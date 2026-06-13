import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
// Phase 4 — 매치 코드 v4 자동 부여 (호출자 영향 0 / NULL 안전)
import { applyMatchCodeFields } from "@/lib/tournaments/match-code";

// 팀별 순위 결과 타입
// rank는 1부터 시작 (1위, 2위, ...)
type RankedTeam = {
  tournamentTeamId: bigint;
  rank: number;
};

// ─────────────────────────────────────────────────────────────────────────
// KO Sprint1 재발방지 (2026-06-14) — knockout 중복생성 + 조 무시 시드 차단
// 사고: 제10회 BDR YOUNGMAN GAME 결선 9경기 중복 (errors.md [2026-06-09]/[2026-06-14])
// ─────────────────────────────────────────────────────────────────────────

/**
 * [KO-1] 이 대회에 결선(knockout) 매치가 이미 존재하는지 카운트.
 *
 * 기존 가드는 `round_number IS NOT NULL` 단독 카운트였는데,
 * 6/9 수동 INSERT 매치가 round_number를 안 박았으면 가드가 0으로 인식 → 재생성 통과 → 중복.
 *
 * 그래서 판정 기준을 확장한다 (OR):
 *   1) round_number IS NOT NULL          (기존 표준 generator 산출물)
 *   2) bracket_position IS NOT NULL       (대진 위치만 박힌 수동 매치)
 *   3) roundName이 knockout 라운드명 포함 (결승/준결승/N강/3·4위전 — 수동 INSERT가 라운드명만 박은 경우)
 *
 * → 셋 중 하나라도 맞으면 "결선 매치 존재"로 간주해 중복 생성을 막는다.
 *
 * @returns 결선으로 판정되는 매치 수
 */
export async function countKnockoutMatches(tournamentId: string): Promise<number> {
  return prisma.tournamentMatch.count({
    where: {
      tournamentId,
      OR: [
        // 1) round_number 부여된 매치 = 표준 토너먼트 경기
        { round_number: { not: null } },
        // 2) bracket_position 부여된 매치 = 대진 위치만 박힌 수동 매치
        { bracket_position: { not: null } },
        // 3) roundName이 명시적 knockout 라운드명 (결승/3·4위전 — "강" 미포함이라 별도 매칭)
        { roundName: { in: ["결승", "3/4위전", "3·4위전"] } },
        // 4) roundName에 "강"(8강/16강 등) 또는 "결승"(준결승/결승) 포함
        { roundName: { contains: "강" } },
        { roundName: { contains: "결승" } },
      ],
    },
  });
}

/**
 * [KO-2 / PURE] 2개조 이상이면 자동 knockout 생성을 차단(throw).
 *
 * 사유: 2개조+ 조별리그 대회에서 조(group)를 무시한 표준 시드(1위 vs N위)를
 *       자동 생성하면 같은 조 팀이 결선에서 재대결한다 (조별리그+토너먼트 의미 붕괴).
 *       → 자동생성을 막고, 운영자가 group-aware 크로스 대진(A1 vs B2)을 수동으로 짜야 한다.
 *
 * 판정: groupName을 정규화(trim, 빈값 제거)한 뒤 distinct 종류가 2 이상이면 throw.
 *       distinct ≤ 1 (단일 조 또는 조 미지정)이면 통과 — 기존 1개조 경로 100% 보존.
 *
 * @param groupNames TournamentTeam.groupName 배열 (null/빈문자 포함 가능)
 * @throws distinct 조가 2개 이상이면 Error (한국어 안내 메시지)
 */
export function assertSingleGroupForAutoKnockout(groupNames: (string | null | undefined)[]): void {
  // 1) 정규화 — null/undefined/빈문자(공백만)를 제거하고 trim
  const normalized = groupNames
    .map((g) => (g ?? "").trim())
    .filter((g) => g.length > 0);

  // 2) distinct 조 종류 카운트
  const distinct = new Set(normalized);

  // 3) 2개조 이상이면 자동 생성 차단
  if (distinct.size >= 2) {
    throw new Error(
      `2개조 이상(${distinct.size}개조: ${[...distinct].join(", ")}) 대회는 결선 자동생성을 막습니다. ` +
        `조를 무시한 시드는 같은 조 팀이 결선에서 재대결하는 위험이 있습니다. ` +
        `group-aware 크로스 대진(예: A조1위 vs B조2위)을 수동으로 등록하세요.`,
    );
  }
  // distinct ≤ 1 → 통과 (단일 조 / 조 미지정 대회는 기존 동작 유지)
}

/**
 * [KO-2 / DB] guardAutoKnockoutGroups — DB에서 조 목록을 조회해 PURE 가드 호출.
 *
 * generator 진입부에서 호출 → 2개조+면 throw로 자동 생성 자체를 차단한다.
 *
 * @param tournamentId 대회 ID
 * @throws 2개조 이상이면 Error
 */
export async function guardAutoKnockoutGroups(tournamentId: string): Promise<void> {
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId },
    select: { groupName: true },
  });
  // PURE 가드에 위임 — 테스트는 PURE 함수만 회귀 게이트로 검증
  assertSingleGroupForAutoKnockout(teams.map((t) => t.groupName));
}

/**
 * 리그 결과로부터 팀 순위 계산
 * 정렬 우선순위: 승률 → 득실차 → 다득점
 * - 리그 경기만 집계 (round_number === null)
 * - completed/live 경기 모두 득실점은 합산 (승패는 completed만)
 */
export async function calculateLeagueRanking(tournamentId: string): Promise<RankedTeam[]> {
  // 팀 목록과 리그 경기를 동시에 조회 (병렬 처리로 속도 개선)
  const [teams, matches] = await Promise.all([
    prisma.tournamentTeam.findMany({
      where: { tournamentId },
      select: { id: true },
    }),
    prisma.tournamentMatch.findMany({
      where: {
        tournamentId,
        round_number: null, // 리그 경기만 (토너먼트 경기는 round_number 부여됨)
        status: { in: ["completed", "live"] },
        homeTeamId: { not: null },
        awayTeamId: { not: null },
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        status: true,
      },
    }),
  ]);

  // 팀별 전적 집계 버킷 초기화
  // key는 tournamentTeamId를 string으로 변환 (BigInt는 Map 키로 동작하지만 Record에서 안전하게 쓰려고)
  const stats: Record<string, { wins: number; losses: number; pointsFor: number; pointsAgainst: number }> = {};
  for (const t of teams) {
    stats[t.id.toString()] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
  }

  // 경기 순회하며 점수/승패 합산
  for (const m of matches) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    const hid = m.homeTeamId.toString();
    const aid = m.awayTeamId.toString();
    const hs = m.homeScore ?? 0;
    const as_ = m.awayScore ?? 0;

    // 득실점은 live/completed 모두 누적
    if (stats[hid]) {
      stats[hid].pointsFor += hs;
      stats[hid].pointsAgainst += as_;
    }
    if (stats[aid]) {
      stats[aid].pointsFor += as_;
      stats[aid].pointsAgainst += hs;
    }

    // 승패 카운트는 completed 경기만 (live는 진행 중이라 최종 아님)
    if (m.status === "completed") {
      if (hs > as_) {
        if (stats[hid]) stats[hid].wins++;
        if (stats[aid]) stats[aid].losses++;
      } else if (as_ > hs) {
        if (stats[aid]) stats[aid].wins++;
        if (stats[hid]) stats[hid].losses++;
      }
      // 동점은 농구 규칙상 연장으로 결정되므로 여기선 무시 (데이터상 발생 어려움)
    }
  }

  // 정렬: 승률 → 득실차 → 다득점
  const ranked = teams
    .map((t) => {
      const s = stats[t.id.toString()];
      const gp = s.wins + s.losses;
      return {
        tournamentTeamId: t.id,
        wins: s.wins,
        losses: s.losses,
        winRate: gp > 0 ? s.wins / gp : 0,
        pointDiff: s.pointsFor - s.pointsAgainst,
        pointsFor: s.pointsFor,
      };
    })
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      return b.pointsFor - a.pointsFor;
    });

  // rank 부여 (1부터 시작)
  return ranked.map((t, i) => ({ tournamentTeamId: t.tournamentTeamId, rank: i + 1 }));
}

// 1라운드 경기 타입 (rank 기반 — 실제 팀 매핑은 이후 단계에서)
type BracketMatchSeed = {
  homeRank: number | null;
  awayRank: number | null;
  bracketPosition: number;
};

/**
 * 토너먼트 대진 생성 (BYE 부전승 처리 포함)
 *
 * 알고리즘:
 * 1. knockoutSize와 참가 가능 팀 수 중 작은 값으로 실제 size 결정
 * 2. bracketSize = size 이상의 가장 작은 2의 제곱 (4,8,16,32...)
 * 3. byeCount = bracketSize - size  → 상위 시드가 부전승으로 2라운드 직행
 * 4. 1라운드: bracketSize/2개 슬롯 중 양쪽 seed 모두 실팀인 경우만 실제 경기 생성
 *
 * 예시:
 * - 4강: size=4, bracketSize=4, byeCount=0 → 1-4, 2-3 (2경기)
 * - 6강: size=6, bracketSize=8, byeCount=2 → 1,2 부전승 / 3-6, 4-5 (2경기)
 * - 8강: size=8, bracketSize=8, byeCount=0 → 1-8, 2-7, 3-6, 4-5 (4경기)
 * - 12강: size=12, bracketSize=16, byeCount=4 → 1~4 부전승 / 5-12, 6-11, 7-10, 8-9 (4경기)
 */
export function buildKnockoutBracket(
  ranking: RankedTeam[],
  knockoutSize: number,
): {
  rounds: Array<{
    roundNumber: number;
    matches: BracketMatchSeed[];
  }>;
  totalRounds: number;
  bracketSize: number;
} {
  // 참가 팀 수보다 knockoutSize가 크면 참가 팀 수로 제한
  const size = Math.min(knockoutSize, ranking.length);
  // 다음 2의 제곱 (예: 6→8, 12→16)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(size, 2))));
  // 전체 라운드 수 (log2 기준)
  const totalRounds = Math.log2(bracketSize);

  const rounds: Array<{ roundNumber: number; matches: BracketMatchSeed[] }> = [];

  // 1라운드 대진 구성 — 표준 시드 매칭: 1 vs bracketSize, 2 vs bracketSize-1, ...
  const firstRoundMatches: BracketMatchSeed[] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    const homeSeed = i + 1;
    const awaySeed = bracketSize - i;

    // size 초과 시드는 실제 팀이 없으므로 null (BYE)
    const homeRank = homeSeed <= size ? homeSeed : null;
    const awayRank = awaySeed <= size ? awaySeed : null;

    // 양쪽 다 실팀이면 1라운드 경기 생성, 한쪽만 있으면 부전승(1라운드 경기 없음 = 2라운드 직행)
    if (homeRank && awayRank) {
      firstRoundMatches.push({ homeRank, awayRank, bracketPosition: i });
    }
    // homeRank만 또는 awayRank만 있는 경우 → 1라운드에는 경기를 만들지 않음
    // (해당 팀은 부전승으로 다음 라운드에 자동 배치되어야 하지만,
    //  Phase 2A에서는 2라운드 이후 경기를 빈 슬롯으로 생성하므로 admin이 수동 배정 예정)
  }

  if (firstRoundMatches.length > 0) {
    rounds.push({ roundNumber: 1, matches: firstRoundMatches });
  }

  // 2라운드 이후: 승자가 채워질 빈 경기 틀 생성
  // 라운드 r의 경기 수 = bracketSize / 2^r
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r);
    const matches: BracketMatchSeed[] = [];
    for (let i = 0; i < matchCount; i++) {
      matches.push({ homeRank: null, awayRank: null, bracketPosition: i });
    }
    rounds.push({ roundNumber: r, matches });
  }

  return { rounds, totalRounds, bracketSize };
}

/**
 * 라운드 번호 → 한국어 라운드 이름 변환
 * 남은 경기 수 기준 ("결승", "준결승", "8강", "16강" ...)
 */
function getRoundName(roundNumber: number, totalRounds: number): string {
  // 해당 라운드에서 동시에 진행되는 팀 수 = 2^(totalRounds - roundNumber + 1)
  const remaining = Math.pow(2, totalRounds - roundNumber + 1);
  if (remaining === 2) return "결승";
  if (remaining === 4) return "준결승";
  if (remaining === 8) return "8강";
  if (remaining === 16) return "16강";
  if (remaining === 32) return "32강";
  return `${remaining}강`;
}

/**
 * 토너먼트 경기 DB insert
 *
 * 흐름:
 * 1) 기존 토너먼트 경기 존재 여부 확인 (중복 생성 방지)
 * 2) 리그 순위 계산
 * 3) 대진 빌드 (BYE 처리)
 * 4) rank → tournamentTeamId 매핑
 * 5) TournamentMatch 데이터 생성 (+ 옵션 3/4위전)
 * 6) createMany insert
 *
 * @returns 생성된 경기 수
 * @throws 이미 토너먼트 경기가 있거나 팀이 부족하면 Error
 */
export async function generateKnockoutMatches(
  tournamentId: string,
  knockoutSize: number,
  bronzeMatch: boolean = false,
): Promise<number> {
  // [KO-2] 2개조+ 자동생성 차단 — 조 무시 시드로 같은 조 재대결 위험 (조별리그 의미 붕괴)
  await guardAutoKnockoutGroups(tournamentId);

  // 1) 중복 생성 방지 — [KO-1] round_number 유무에 의존하지 않는 강화 가드 사용
  const existing = await countKnockoutMatches(tournamentId);
  if (existing > 0) {
    throw new Error(`이미 ${existing}건의 토너먼트 경기가 존재합니다.`);
  }

  // 2) 리그 순위 계산
  const ranking = await calculateLeagueRanking(tournamentId);
  if (ranking.length < 2) {
    throw new Error("토너먼트 생성에 필요한 팀이 부족합니다.");
  }

  // 2-1) 리그 순위를 TournamentTeam.seedNumber에 저장
  // 이유: 토너먼트 경기 카드에서 "#1 제이크루 vs #4 몽키즈" 형태의 시드 뱃지 표시용
  // 별도 계산 없이 DB 조회만으로 시드 번호를 읽을 수 있어 API 단순화
  for (const r of ranking) {
    await prisma.tournamentTeam.update({
      where: { id: r.tournamentTeamId },
      data: { seedNumber: r.rank },
    });
  }

  // 3) 대진 빌드
  const { rounds, totalRounds } = buildKnockoutBracket(ranking, knockoutSize);

  // 4) rank → tournamentTeamId 매핑 (Map으로 O(1) 조회)
  const rankMap = new Map<number, bigint>(ranking.map((r) => [r.rank, r.tournamentTeamId]));

  // 5) match_number는 리그 경기와 이어지도록 기존 최댓값 + 1부터 시작
  const lastMatch = await prisma.tournamentMatch.findFirst({
    where: { tournamentId },
    orderBy: { match_number: "desc" },
    select: { match_number: true },
  });
  let nextMatchNumber = (lastMatch?.match_number ?? 0) + 1;

  // createMany용 데이터 배열 생성
  const matchData: Array<{
    tournamentId: string;
    homeTeamId: bigint | null;
    awayTeamId: bigint | null;
    status: string;
    homeScore: number;
    awayScore: number;
    round_number: number;
    bracket_position: number;
    roundName: string;
    match_number: number;
  }> = [];

  for (const round of rounds) {
    for (const m of round.matches) {
      matchData.push({
        tournamentId,
        // rank가 있으면 매핑된 팀 ID, 없으면 null (2라운드 이후 빈 슬롯)
        homeTeamId: m.homeRank ? rankMap.get(m.homeRank) ?? null : null,
        awayTeamId: m.awayRank ? rankMap.get(m.awayRank) ?? null : null,
        status: "scheduled",
        homeScore: 0,
        awayScore: 0,
        round_number: round.roundNumber,
        bracket_position: m.bracketPosition,
        roundName: getRoundName(round.roundNumber, totalRounds),
        match_number: nextMatchNumber++,
      });
    }
  }

  // 6) 3/4위전 (옵션) — 결승과 같은 라운드에 특수 bracket_position=99로 생성
  if (bronzeMatch) {
    matchData.push({
      tournamentId,
      homeTeamId: null,
      awayTeamId: null,
      status: "scheduled",
      homeScore: 0,
      awayScore: 0,
      round_number: totalRounds,
      bracket_position: 99, // 특수 위치 (결승과 구분)
      roundName: "3/4위전",
      match_number: nextMatchNumber++,
    });
  }

  // 7) Phase 4 — 매치 코드 v4 필드 자동 부여 (호출자 영향 0)
  //    tournamentMeta 조회 + applyMatchCodeFields. short_code/region_code NULL → match_code NULL.
  const tournamentMeta = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      short_code: true,
      region_code: true,
      categories: true,
      startDate: true,
    },
  });
  const matchDataWithCode = tournamentMeta
    ? applyMatchCodeFields(matchData, tournamentMeta)
    : matchData;

  // 8) 일괄 insert — createMany는 트랜잭션 내부에서 원자적으로 처리
  await prisma.tournamentMatch.createMany({ data: matchDataWithCode });

  return matchData.length;
}

/**
 * ✨ Phase 2C: 토너먼트 "빈 뼈대" 미리 생성
 *
 * 리그가 아직 끝나지 않았을 때도 대진표 탭에 토너먼트 트리를 보여주기 위해
 * 팀이 정해지지 않은 빈 경기(homeTeamId/awayTeamId = null)를 미리 insert.
 *
 * 슬롯 라벨은 TournamentMatch.settings JSON에 저장:
 *   settings = { homeSlotLabel: "1위", awaySlotLabel: "4위" }
 *
 * 1라운드만 "N위" 라벨을 표시한다. 2라운드+는 이전 라운드 승자가 채워지므로 라벨 없음.
 * (부전승 시드 직접 표시는 복잡도 대비 이득이 적어 생략 — 팀 할당 시 자연히 채워짐)
 *
 * @param tournamentId 대회 ID
 * @param knockoutSize 토너먼트 진출 팀 수 (4/8/16 등)
 * @param bronzeMatch  3/4위전 포함 여부
 * @returns 생성된 경기 수
 */
export async function generateEmptyKnockoutSkeleton(
  tournamentId: string,
  knockoutSize: number,
  bronzeMatch: boolean = false,
): Promise<number> {
  // [KO-2] 2개조+ 자동생성 차단 — 빈 뼈대도 조 무시 시드("N위" 라벨)라 동일 위험
  await guardAutoKnockoutGroups(tournamentId);

  // 1) 이미 토너먼트 경기가 있으면 중단 — [KO-1] 강화 가드 사용
  const existing = await countKnockoutMatches(tournamentId);
  if (existing > 0) {
    throw new Error(`이미 ${existing}건의 토너먼트 경기가 존재합니다.`);
  }

  // 2) bracketSize(다음 2의 제곱)와 totalRounds 계산
  //    knockoutSize=6이면 bracketSize=8, totalRounds=3 (8강→4강→결승)
  const size = knockoutSize;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(size, 2))));
  const totalRounds = Math.log2(bracketSize);

  // 3) 1라운드 대진 구성 — 표준 시드 매칭 (1 vs N, 2 vs N-1, ...)
  //    양쪽 모두 실팀(size 이내)인 경우에만 1라운드 경기 생성
  //    한쪽만 있으면 부전승으로 2라운드 직행 (이 단계에서는 경기 생성 안 함)
  const firstRoundMatches: Array<{
    homeRank: number;
    awayRank: number;
    bracketPosition: number;
  }> = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    const homeSeed = i + 1;
    const awaySeed = bracketSize - i;
    const homeRank = homeSeed <= size ? homeSeed : null;
    const awayRank = awaySeed <= size ? awaySeed : null;
    if (homeRank && awayRank) {
      firstRoundMatches.push({ homeRank, awayRank, bracketPosition: i });
    }
  }

  // 4) match_number는 기존(리그 경기)의 최댓값 + 1부터 이어서
  const lastMatch = await prisma.tournamentMatch.findFirst({
    where: { tournamentId },
    orderBy: { match_number: "desc" },
    select: { match_number: true },
  });
  let nextMatchNumber = (lastMatch?.match_number ?? 0) + 1;

  // 5) createMany용 데이터 배열 — 1라운드부터 결승까지 빈 슬롯으로 채운다
  // settings는 Prisma Json 필드: null 값을 그대로 못 넣으므로 Prisma.JsonNull 사용
  const matchData: Prisma.TournamentMatchCreateManyInput[] = [];

  // 5-1) 1라운드: "1위" / "4위" 같은 시드 라벨 저장
  for (const m of firstRoundMatches) {
    matchData.push({
      tournamentId,
      homeTeamId: null,
      awayTeamId: null,
      status: "scheduled",
      homeScore: 0,
      awayScore: 0,
      round_number: 1,
      bracket_position: m.bracketPosition,
      roundName: getRoundName(1, totalRounds),
      match_number: nextMatchNumber++,
      settings: {
        homeSlotLabel: `${m.homeRank}위`,
        awaySlotLabel: `${m.awayRank}위`,
      },
    });
  }

  // 5-2) 2라운드 이상: 빈 슬롯만 (라벨 없음, 이전 라운드 승자가 채워짐)
  //     라운드 r의 경기 수 = bracketSize / 2^r
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r);
    for (let i = 0; i < matchCount; i++) {
      matchData.push({
        tournamentId,
        homeTeamId: null,
        awayTeamId: null,
        status: "scheduled",
        homeScore: 0,
        awayScore: 0,
        round_number: r,
        bracket_position: i,
        roundName: getRoundName(r, totalRounds),
        match_number: nextMatchNumber++,
        // 2라운드+는 승자가 채워지므로 라벨 불필요 — Prisma Json 필드라 DbNull 사용
        settings: Prisma.JsonNull,
      });
    }
  }

  // 5-3) 3/4위전 (옵션) — 결승과 같은 라운드, bracket_position=99로 분리
  if (bronzeMatch && totalRounds >= 2) {
    matchData.push({
      tournamentId,
      homeTeamId: null,
      awayTeamId: null,
      status: "scheduled",
      homeScore: 0,
      awayScore: 0,
      round_number: totalRounds,
      bracket_position: 99,
      roundName: "3/4위전",
      match_number: nextMatchNumber++,
      settings: {
        homeSlotLabel: "준결승 1 패자",
        awaySlotLabel: "준결승 2 패자",
      },
    });
  }

  // 6) Phase 4 — 매치 코드 v4 필드 자동 부여 (호출자 영향 0)
  //    빈 뼈대도 매치 코드 부여 — 운영자가 토너먼트 슬롯 채우기 전부터 코드로 매치 식별 가능
  const tournamentMeta = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      short_code: true,
      region_code: true,
      categories: true,
      startDate: true,
    },
  });
  const matchDataWithCode = tournamentMeta
    ? applyMatchCodeFields(matchData, tournamentMeta)
    : matchData;

  // 7) 일괄 insert
  await prisma.tournamentMatch.createMany({ data: matchDataWithCode });

  return matchData.length;
}

/**
 * ✨ Phase 2C: 리그 완료 후 빈 토너먼트 슬롯에 팀 할당
 *
 * generateEmptyKnockoutSkeleton으로 생성된 빈 1라운드 경기들의
 * settings.homeSlotLabel("N위")를 파싱해서 실제 tournamentTeamId를 채워 넣는다.
 *
 * - TournamentTeam.seedNumber도 동시에 업데이트 (시드 뱃지 표시용)
 * - 1라운드만 처리. 2라운드+는 경기 진행 중 승자가 자동으로 전파됨
 * - 뼈대가 없으면(= 구버전 대회) 0 반환 → 호출 측에서 fallback 가능
 *
 * @returns 팀이 할당된 경기 수
 */
export async function assignTeamsToKnockout(tournamentId: string): Promise<number> {
  // [KO-2] 2개조+ 자동배정 차단 — 조 무시 "N위" 슬롯 파싱은 같은 조 재대결 위험
  await guardAutoKnockoutGroups(tournamentId);

  // 1) 리그 순위 계산
  const ranking = await calculateLeagueRanking(tournamentId);
  if (ranking.length < 2) {
    throw new Error("토너먼트 배정에 필요한 팀이 부족합니다.");
  }

  // 2) TournamentTeam.seedNumber 업데이트 (시드 뱃지 표시용)
  for (const r of ranking) {
    await prisma.tournamentTeam.update({
      where: { id: r.tournamentTeamId },
      data: { seedNumber: r.rank },
    });
  }

  // 3) rank → tournamentTeamId 매핑
  const rankMap = new Map<number, bigint>(ranking.map((r) => [r.rank, r.tournamentTeamId]));

  // 4) 1라운드 빈 슬롯 경기 조회
  const firstRound = await prisma.tournamentMatch.findMany({
    where: { tournamentId, round_number: 1 },
    select: { id: true, settings: true, homeTeamId: true, awayTeamId: true },
  });

  // 5) settings.homeSlotLabel / awaySlotLabel("N위")에서 숫자 추출해 팀 할당
  let updated = 0;
  for (const m of firstRound) {
    // 이미 팀이 배정된 경기는 건너뜀 (중복 실행 안전)
    if (m.homeTeamId && m.awayTeamId) continue;

    const settings = m.settings as Record<string, unknown> | null;
    const homeLabel = settings?.homeSlotLabel as string | undefined;
    const awayLabel = settings?.awaySlotLabel as string | undefined;

    // "1위" → 1, "4위" → 4 식으로 숫자만 추출
    const homeRank = homeLabel ? parseInt(homeLabel.replace(/\D/g, ""), 10) : NaN;
    const awayRank = awayLabel ? parseInt(awayLabel.replace(/\D/g, ""), 10) : NaN;

    const homeTeamId = Number.isFinite(homeRank) ? rankMap.get(homeRank) ?? null : null;
    const awayTeamId = Number.isFinite(awayRank) ? rankMap.get(awayRank) ?? null : null;

    if (homeTeamId || awayTeamId) {
      await prisma.tournamentMatch.update({
        where: { id: m.id },
        data: {
          homeTeamId: homeTeamId ?? null,
          awayTeamId: awayTeamId ?? null,
        },
      });
      updated++;
    }
  }

  return updated;
}

/**
 * 리그 경기가 모두 완료되었는지 확인
 * - 리그 경기(round_number === null) 중 completed/cancelled 아닌 게 하나라도 있으면 false
 */
export async function isLeagueComplete(tournamentId: string): Promise<boolean> {
  const incomplete = await prisma.tournamentMatch.count({
    where: {
      tournamentId,
      round_number: null, // 리그 경기
      status: { notIn: ["completed", "cancelled"] },
    },
  });
  return incomplete === 0;
}
