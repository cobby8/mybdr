/**
 * 2026-05-16 PR-G5.5-NBA-seed — NBA 표준 시드 토너먼트 generator (plan/generate 분리).
 *
 * 도메인 컨텍스트:
 *   기존 `generateKnockoutMatches` (tournament-seeding.ts:214) = 순차 시드 (1+8, 2+7, …).
 *   본 모듈 = NBA 표준 양분 트리 (1+8, 4+5, 3+6, 2+7) — opt-in 진입 (settings.bracket.seedingMode === "nba").
 *
 * 설계 원칙:
 *   1) plan/generate 분리 (lessons.md §22 의무) — `planNbaSeedKnockout` PURE / `generateNbaSeedKnockout` DB
 *   2) placeholder-helpers 통과 의무 (PR-G5 룰) — `buildSlotLabel({ kind: "seed_number" })` 만 사용 (인라인 박제 금지)
 *   3) 운영 회귀 0 — 기존 `generateKnockoutMatches` 시그니처 / 동작 변경 0
 *   4) BYE 자동 처리 — bracketSize 올림 + null 슬롯 = 부전승 (해당 1R 매치 생략)
 *
 * 사용처:
 *   - `bracket/knockout/route.ts` POST 의 seedingMode 분기 (default sequential)
 *   - `matches/[matchId]/route.ts` PATCH 의 자동 진출 분기 (선택)
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { applyMatchCodeFields } from "@/lib/tournaments/match-code";
import { buildSlotLabel } from "@/lib/tournaments/placeholder-helpers";
import { nbaSeedPairsWithBye, isByePair, type NbaSeedPair } from "@/lib/tournaments/nba-seed-helpers";

// ─────────────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────────────

/**
 * 시드 1·2·3·… 순서로 정렬된 팀 입력 — caller (route) 가 ranking 계산 후 전달.
 */
export interface SeedingTeam {
  tournamentTeamId: bigint;
  seedNumber: number; // 1·2·3·… (NBA 양분 트리의 시드 번호)
}

/**
 * planNbaSeedKnockout 입력.
 */
export interface NbaSeedKnockoutInput {
  teams: SeedingTeam[];        // seedNumber 순 정렬 가정 (caller 가 보장)
  knockoutSize: number;        // 4 / 8 / 16 / 32 — 진출 팀 수
  bronzeMatch?: boolean;       // 3·4위전 추가 여부
  startMatchNumber?: number;   // 매치 번호 시작값 (default 1) — DB 호출시 lastMatch+1
}

/**
 * plan 결과 매치 spec — DB I/O 없이 생성.
 *
 * caller (generateNbaSeedKnockout) 가 createMany payload 로 변환.
 */
export interface PlannedKnockoutMatch {
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
  status: "scheduled";
  homeScore: number;
  awayScore: number;
  round_number: number;
  bracket_position: number;
  roundName: string;
  match_number: number;
  /** placeholder-helpers 통과 라벨 — settings JSON 박제용 (UI 카드 표시 + 검증) */
  homeSlotLabel: string | null;
  awaySlotLabel: string | null;
}

export interface PlanNbaSeedKnockoutResult {
  matches: PlannedKnockoutMatch[];
  bracketSize: number;
  totalRounds: number;
  /** BYE 시드 번호 리스트 (1·2 등) — 디버깅 / 검증 용 */
  byeSeeds: number[];
}

// ─────────────────────────────────────────────────────────────────────────
// PURE 함수 영역 — DB I/O 0
// ─────────────────────────────────────────────────────────────────────────

/**
 * 라운드 번호 → 한국어 라운드 이름.
 * 사유: tournament-seeding.ts 의 getRoundName 동일 로직 (PR 격리 위해 inline copy).
 *   추후 PR-G5.2 dual-generator refactor 에서 단일 헬퍼로 통합 예정.
 */
function getRoundName(roundNumber: number, totalRounds: number): string {
  const remaining = Math.pow(2, totalRounds - roundNumber + 1);
  if (remaining === 2) return "결승";
  if (remaining === 4) return "준결승";
  if (remaining === 8) return "8강";
  if (remaining === 16) return "16강";
  if (remaining === 32) return "32강";
  return `${remaining}강`;
}

/**
 * NBA 표준 시드 토너먼트 1R~결승 매치 spec 산출 (PURE).
 *
 * 알고리즘:
 *   1) bracketSize = min(knockoutSize, teamCount) 의 2^N 올림
 *   2) nbaSeedPairsWithBye(size) 로 1R 페어 (BYE 포함) 생성
 *   3) BYE 페어 = 1R 매치 생략 + 상위 시드를 2R bracket_position 에 자동 박제
 *   4) 2R~결승 = NULL 슬롯 (`buildSlotLabel({ kind: "seed_number" })` 라벨 박제 / 승자 채워질 자리)
 *   5) bronzeMatch 옵션 시 결승과 같은 라운드에 bracket_position=99 추가
 *
 * @returns matches (createMany 변환 가능) + bracketSize / totalRounds / byeSeeds
 */
export function planNbaSeedKnockout(input: NbaSeedKnockoutInput): PlanNbaSeedKnockoutResult {
  const { teams, knockoutSize, bronzeMatch = false, startMatchNumber = 1 } = input;

  if (teams.length < 2) {
    throw new Error("planNbaSeedKnockout: 토너먼트 생성에 필요한 팀이 부족합니다 (최소 2팀).");
  }

  // 1) 실제 size = min(knockoutSize, teams.length) — 시드 8까지만 들어가는 8강 안에 6팀이면 size=6
  const size = Math.min(knockoutSize, teams.length);
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(size, 2))));
  const totalRounds = Math.log2(bracketSize);

  // 2) 시드 → tournamentTeamId 매핑 (Map O(1) 조회)
  // teams 가 seedNumber 순으로 정렬됐다고 caller 가 보장 — 안전을 위해 자체 Map 구성
  const seedToTeamId = new Map<number, bigint>();
  for (const t of teams) {
    seedToTeamId.set(t.seedNumber, t.tournamentTeamId);
  }

  // 3) NBA 표준 페어링 + BYE 처리
  const pairs: NbaSeedPair[] = nbaSeedPairsWithBye(size);
  const byeSeeds: number[] = [];

  // 4) 매치 spec 누적 (1R ~ 결승)
  const matches: PlannedKnockoutMatch[] = [];
  let nextMatchNumber = startMatchNumber;

  // 4-1) 1R 매치 — BYE 페어는 생략, 양쪽 실팀인 페어만 매치 생성
  // bracket_position 은 페어 인덱스 그대로 = 양분 트리 자연 순서
  pairs.forEach((pair, idx) => {
    if (isByePair(pair)) {
      // 부전승 — 실팀 시드 추적 (디버깅 + 추후 자동 2R 진출 검증용)
      const realSeed = pair[0] ?? pair[1];
      if (realSeed != null) byeSeeds.push(realSeed);
      return; // 1R 매치 생략 (해당 시드는 2R 자동 진출 — 슬롯은 4-2 단계에서 채움)
    }

    // 양쪽 실팀 = 1R 매치 생성
    const [homeSeed, awaySeed] = pair as [number, number];
    matches.push({
      homeTeamId: seedToTeamId.get(homeSeed) ?? null,
      awayTeamId: seedToTeamId.get(awaySeed) ?? null,
      status: "scheduled",
      homeScore: 0,
      awayScore: 0,
      round_number: 1,
      bracket_position: idx,
      roundName: getRoundName(1, totalRounds),
      match_number: nextMatchNumber++,
      // placeholder-helpers 통과 — "1번 시드" / "8번 시드" (NBA 라벨)
      homeSlotLabel: buildSlotLabel({ kind: "seed_number", seedNumber: homeSeed }),
      awaySlotLabel: buildSlotLabel({ kind: "seed_number", seedNumber: awaySeed }),
    });
  });

  // 4-2) 2R ~ 결승 빈 슬롯 — BYE 시드는 2R bracket_position 에 자동 박제
  // BYE 시드의 2R 위치 = pairIdx / 2 (1R 두 페어가 합쳐 2R 한 매치)
  // BYE 페어 인덱스 → 2R bracket_position 매핑
  const byeAdvancement = new Map<number, bigint>();
  pairs.forEach((pair, idx) => {
    if (!isByePair(pair)) return;
    const realSeed = pair[0] ?? pair[1];
    if (realSeed == null) return;
    const teamId = seedToTeamId.get(realSeed);
    if (teamId == null) return;
    // 2R 매치 위치 = 1R pair 인덱스의 절반 (인접한 두 페어가 한 2R 매치로 수렴)
    const r2Position = Math.floor(idx / 2);
    byeAdvancement.set(r2Position, teamId);
  });

  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r);
    for (let i = 0; i < matchCount; i++) {
      // 2R 의 BYE 자동 진출 처리 — 해당 위치의 home/away 슬롯 결정
      // 2R bracket_position i 는 1R 페어 (2i, 2i+1) 의 승자가 만나는 자리
      let homeTeamId: bigint | null = null;
      let awayTeamId: bigint | null = null;
      let homeSlotLabel: string | null = null;
      let awaySlotLabel: string | null = null;

      if (r === 2) {
        const pair1 = pairs[2 * i];
        const pair2 = pairs[2 * i + 1];

        // 첫 번째 페어 (홈 슬롯)
        if (pair1 && isByePair(pair1)) {
          const seed = pair1[0] ?? pair1[1];
          if (seed != null) {
            homeTeamId = seedToTeamId.get(seed) ?? null;
            // 자동 진출이므로 라벨 = "N번 시드" (NBA 양분 트리 의미 보존)
            homeSlotLabel = buildSlotLabel({ kind: "seed_number", seedNumber: seed });
          }
        } else if (pair1) {
          // 1R 매치 승자 라벨 (placeholder-helpers 통과)
          // matchNumber = 1R 매치들의 nextMatchNumber 추적이 필요 — 미사용 (UI 는 settings.homeSlotLabel 우선 표시)
          // → "1R 시드 N" 형식 대신 "1번 시드" / "8번 시드" 의 승자 의미를 일관 박제
          // 단순화: 승자 라벨은 "1R N번 시드 페어 승자" 식으로 표기 — 본 PR 범위는 BYE 자동 박제만 우선
          // 향후 PR 에서 buildSlotLabel match_winner 로 통합 가능 (1R match_number 사후 매핑 필요)
          homeSlotLabel = null; // 2R 일반 매치 = 라벨 미박제 (UI 가 1R 진행 후 승자 표시)
        }

        // 두 번째 페어 (어웨이 슬롯)
        if (pair2 && isByePair(pair2)) {
          const seed = pair2[0] ?? pair2[1];
          if (seed != null) {
            awayTeamId = seedToTeamId.get(seed) ?? null;
            awaySlotLabel = buildSlotLabel({ kind: "seed_number", seedNumber: seed });
          }
        } else if (pair2) {
          awaySlotLabel = null;
        }
      }

      matches.push({
        homeTeamId,
        awayTeamId,
        status: "scheduled",
        homeScore: 0,
        awayScore: 0,
        round_number: r,
        bracket_position: i,
        roundName: getRoundName(r, totalRounds),
        match_number: nextMatchNumber++,
        homeSlotLabel,
        awaySlotLabel,
      });
    }
  }

  // 4-3) 3·4위전 (옵션) — 결승과 같은 라운드, bracket_position=99
  if (bronzeMatch && totalRounds >= 2) {
    matches.push({
      homeTeamId: null,
      awayTeamId: null,
      status: "scheduled",
      homeScore: 0,
      awayScore: 0,
      round_number: totalRounds,
      bracket_position: 99,
      roundName: "3/4위전",
      match_number: nextMatchNumber++,
      // 3·4위전 = 준결승 패자 슬롯 (placeholder-helpers match_loser kind)
      homeSlotLabel: buildSlotLabel({ kind: "match_loser", roundName: "준결승", matchNumber: 1 }),
      awaySlotLabel: buildSlotLabel({ kind: "match_loser", roundName: "준결승", matchNumber: 2 }),
    });
  }

  // 양분 검증 통과 보장 — byeSeeds 정렬 (디버깅 가독성)
  byeSeeds.sort((a, b) => a - b);

  return { matches, bracketSize, totalRounds, byeSeeds };
}

// ─────────────────────────────────────────────────────────────────────────
// DB I/O 함수 — generateNbaSeedKnockout
// ─────────────────────────────────────────────────────────────────────────

/**
 * NBA 표준 시드 토너먼트 매치 DB 박제 (idempotent 가드 포함).
 *
 * 흐름:
 *   1) 중복 생성 방지 — 이미 round_number != null 매치가 있으면 throw
 *   2) ranking 입력 (seedNumber 순) → planNbaSeedKnockout 으로 매치 spec 산출
 *   3) match_number = 기존 최댓값 + 1 부터 이어서 (리그 매치와 연속성 보장)
 *   4) applyMatchCodeFields 로 매치 코드 v4 자동 부여
 *   5) createMany 일괄 INSERT
 *
 * @param tournamentId 대회 ID
 * @param ranking      seedNumber 순 정렬된 팀 목록 (caller 가 calculateLeagueRanking 후 변환)
 * @param knockoutSize 진출 팀 수 (4 / 8 / 16 / 32)
 * @param bronzeMatch  3·4위전 포함 여부
 * @returns 생성된 매치 수
 */
export async function generateNbaSeedKnockout(
  tournamentId: string,
  ranking: SeedingTeam[],
  knockoutSize: number,
  bronzeMatch: boolean = false,
): Promise<number> {
  // 1) 중복 생성 방지 — 기존 generateKnockoutMatches 동일 가드
  const existing = await prisma.tournamentMatch.count({
    where: { tournamentId, round_number: { not: null } },
  });
  if (existing > 0) {
    throw new Error(`이미 ${existing}건의 토너먼트 경기가 존재합니다.`);
  }

  if (ranking.length < 2) {
    throw new Error("NBA 시드 토너먼트 생성에 필요한 팀이 부족합니다 (최소 2팀).");
  }

  // 2) TournamentTeam.seedNumber UPDATE — 시드 뱃지 표시용 (기존 패턴 동일)
  for (const r of ranking) {
    await prisma.tournamentTeam.update({
      where: { id: r.tournamentTeamId },
      data: { seedNumber: r.seedNumber },
    });
  }

  // 3) match_number 시작값 — 리그 매치와 연속
  const lastMatch = await prisma.tournamentMatch.findFirst({
    where: { tournamentId },
    orderBy: { match_number: "desc" },
    select: { match_number: true },
  });
  const startMatchNumber = (lastMatch?.match_number ?? 0) + 1;

  // 4) plan PURE 호출 — DB I/O 0 / 매치 spec 산출
  const { matches } = planNbaSeedKnockout({
    teams: ranking,
    knockoutSize,
    bronzeMatch,
    startMatchNumber,
  });

  // 5) PlannedKnockoutMatch → Prisma createMany payload 변환
  // settings.homeSlotLabel / awaySlotLabel = placeholder-helpers 통과 라벨
  const matchData: Prisma.TournamentMatchCreateManyInput[] = matches.map((m) => {
    const settings: Record<string, string> = {};
    if (m.homeSlotLabel) settings.homeSlotLabel = m.homeSlotLabel;
    if (m.awaySlotLabel) settings.awaySlotLabel = m.awaySlotLabel;

    return {
      tournamentId,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      round_number: m.round_number,
      bracket_position: m.bracket_position,
      roundName: m.roundName,
      match_number: m.match_number,
      // settings 비어있으면 JsonNull (Prisma Json 필드 안전 처리)
      settings: Object.keys(settings).length > 0 ? settings : Prisma.JsonNull,
    };
  });

  // 6) 매치 코드 v4 자동 부여 (호출자 영향 0 / 기존 generateKnockoutMatches 패턴)
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

  // 7) 일괄 INSERT
  await prisma.tournamentMatch.createMany({ data: matchDataWithCode });

  return matchData.length;
}
