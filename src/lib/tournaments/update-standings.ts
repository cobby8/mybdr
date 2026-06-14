import { prisma } from "@/lib/db/prisma";
import {
  calculateMatchPoints,
  type PointsRuleScheme,
} from "@/lib/tournaments/standings-points";

// ─────────────────────────────────────────────────────────────────────────
// 2026-06-14 순위표 집계 근본 수정 (PR-STANDINGS-ROOT-FIX)
//
// 배경: full_league_knockout 포맷 대회에서 결승/4강(KO) 매치가 예선 standings 에
//   혼입되는 사고 (5차 뉴비리그 #301 결승이 오름 예선에 합산 → W3 오집계).
//   기존 가드는 roundName "순위" 만 제외 → "결승"/"4강" 등 KO 라운드는 통과돼 버그.
//
// 룰: 토너먼트(KO) 라운드명은 예선이 아니므로 standings 합산에서 제외한다.
//   결승 / 준결승 / 4강·8강·16강·32강 (n강) / 3·4위전 / 3위전 / 결승전 등.
// ─────────────────────────────────────────────────────────────────────────
const KNOCKOUT_ROUND_REGEX =
  /(결승|준결승|준준결승|[0-9]+\s*강|[0-9]+\s*위\s*전|[0-9]+\s*[·∙ㆍ]\s*[0-9]+\s*위)/;

// 기존 순위전 정규식 (placeholder-helpers 의 RANKING_ROUND_REGEX 와 동일).
//   "순위" 포함 = 순위결정전 / 순위전 / 동순위전 등 = 예선 아님 (제외).
const RANKING_ROUND_REGEX = /순위/;

/**
 * "예선 매치인지" 판정 — false 면 standings 합산에서 제외 (= 예선 아님).
 *
 * 3중 OR 가드 (하나라도 참이면 예선 아님 → 제외):
 *   ① roundName 이 "순위" 포함 (기존 룰 보존)
 *   ② roundName 이 KO 라운드 (결승/n강/n위전 등) — 2026-06-14 신규
 *   ③ round_number 와 bracket_position 이 둘 다 NOT NULL (= 브래킷 좌표 보유 = KO 트리 매치)
 *      — roundName 이 비어있어도 좌표만으로 KO 판정 (#301 같은 좌표부여 매치 대비)
 *
 * 폴백: 셋 다 거짓이면 예선으로 간주 (= 기존 동작 — 회귀 0).
 */
function isPrelimMatch(m: {
  roundName: string | null;
  round_number: number | null;
  bracket_position: number | null;
}): boolean {
  // ① 순위전
  if (m.roundName && RANKING_ROUND_REGEX.test(m.roundName)) return false;
  // ② KO 라운드명
  if (m.roundName && KNOCKOUT_ROUND_REGEX.test(m.roundName)) return false;
  // ③ 브래킷 좌표 (round_number + bracket_position 동시 보유 = KO 트리)
  //   느슨한 비교(`!= null`) — null + undefined 둘 다 "좌표 없음"으로 취급.
  //   (Prisma 는 SELECT 필드를 null 로 반환하나, 좌표 미지정 매치 = 예선 폴백 안전)
  if (m.round_number != null && m.bracket_position != null) return false;
  return true;
}

/**
 * 경기 결과 기록 후 승자 진출 처리
 * TournamentMatch.winner_team_id → next_match_id의 빈 슬롯에 배치
 *
 * ⚠️ single elim 전용. dual_tournament 는 progressDualMatch 가 진출 처리 (loser bracket 포함).
 * (2026-05-03 가드 추가: dual 매치에 본 함수가 호출되어 home/away 모두 winner 로 set 되는
 *  무한 루프 corrupt 발생 — sync route 의 진입 차단과 더불어 함수 자체에도 이중 가드.)
 */
export async function advanceWinner(matchId: bigint): Promise<void> {
  // dual_tournament 가드 — format 만 조회하여 본 함수 대상 외이면 즉시 종료
  const matchForGuard = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { tournament: { select: { format: true } } },
  });
  if (matchForGuard?.tournament?.format === "dual_tournament") return;

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      next_match_id: true,
      winner_team_id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      tournamentId: true,
    },
  });

  if (!match?.next_match_id || !match.winner_team_id) return;

  const nextMatch = await prisma.tournamentMatch.findUnique({
    where: { id: match.next_match_id },
    select: { homeTeamId: true, awayTeamId: true },
  });
  if (!nextMatch) return;

  // 빈 슬롯에 승자 배치 (home 먼저, 이미 채워졌으면 away)
  const slot = nextMatch.homeTeamId === null ? "homeTeamId" : "awayTeamId";

  await prisma.tournamentMatch.update({
    where: { id: match.next_match_id },
    data: { [slot]: match.winner_team_id },
  });
}

/**
 * 경기 완료 시 팀 전적 SET 방식 박제 (idempotent — 동일 매치 N회 호출 안전).
 *
 * 2026-05-16 영구 fix (errors.md 6회째 회귀 차단 — PR-G5.5-followup-B):
 *   기존 increment 방식 → 동일 매치 다중 path 호출 시 N배 박제 (은평 PA 17→34 사고).
 *   본 함수 = 매치 단건 trigger → 종별 모든 매치 재계산 SET 방식 — 호출 가드 의존 0.
 *
 * 동작:
 *   1. 매치 단건 SELECT (tournamentId / home/away teamId / settings.division_code)
 *   2. 같은 tournament + 같은 division_code 의 status=completed + winner_team_id NOT NULL 매치 N건 SELECT
 *      (division_code 없으면 같은 tournament 전체 — 4차 뉴비리그 패턴 호환)
 *   3. in-memory 합산 (wins/losses/draws/PF/PA/PD — 각 팀이 참여한 모든 매치)
 *   4. TournamentTeam.updateMany (영향 받는 2건 — home + away) SET 방식 박제
 *
 * race 안전: concurrent 2회 호출 시 마지막 호출이 정확한 결과 SET (증분 누적 X).
 * 가드 무관: caller 가드 (alreadyCompleted / prev status) 우회해도 항상 정확.
 * 외부 스크립트 안전: scripts/_temp/* 가 직접 호출해도 안전 (SET 재계산).
 *
 * 시그니처 변경 0 — 기존 caller 5종 (admin/match-sync/batch-sync/status PATCH/score-sheet) 호환.
 */
export async function updateTeamStandings(
  matchId: bigint,
): Promise<void> {
  // ─────────────────────────────────────────────────────────────────────
  // 1. 매치 단건 SELECT — tournamentId + home/away + division_code 식별
  // ─────────────────────────────────────────────────────────────────────
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
      settings: true,
      // 2026-05-17 강남구 승점 룰 — tournament.settings.points_rule 분기 위해 SELECT
      tournament: { select: { settings: true } },
    },
  });

  // 매치 미존재 또는 양 팀 NULL → 무처리 (기존 동작 보존)
  if (!match || match.homeTeamId === null || match.awayTeamId === null) return;

  // settings.division_code 추출 — 종별 격리 매핑
  // 사유: 같은 tournament 의 다른 종별 매치가 standings 에 영향 주면 안 됨 (격리 의무)
  const settingsRaw = (match.settings ?? {}) as Record<string, unknown>;
  const divisionCode =
    typeof settingsRaw.division_code === "string" ? settingsRaw.division_code : null;

  // 2026-05-17 강남구 승점 룰 — tournament.settings.points_rule 추출.
  //   "gnba" 박제 시만 강남구 가산점 분기 적용 / 그 외 = "default" (= 승=3 / 패=0).
  //   미박제 대회 = "default" 폴백 (= 회귀 0).
  const tournamentSettingsRaw = (match.tournament?.settings ?? {}) as Record<string, unknown>;
  const pointsRule: PointsRuleScheme =
    tournamentSettingsRaw.points_rule === "gnba" ? "gnba" : "default";

  // ─────────────────────────────────────────────────────────────────────
  // 2. 같은 tournament + 같은 division_code 의 완료 매치 전체 SELECT
  //   사유: 종별 모든 매치 합산이 idempotent 보장의 핵심.
  //   divisionCode 없음 → 4차 뉴비리그 (settings.division_code 미설정) 패턴 → tournament 전체.
  //   divisionCode 있음 → 강남구협회장배 등 종별 격리 (다른 종별 매치 영향 차단).
  // ─────────────────────────────────────────────────────────────────────
  const matchesWhere: {
    tournamentId: string;
    status: "completed";
    winner_team_id: { not: null };
    settings?: { path: string[]; equals: string };
  } = {
    tournamentId: match.tournamentId,
    status: "completed",
    winner_team_id: { not: null },
  };
  if (divisionCode !== null) {
    matchesWhere.settings = { path: ["division_code"], equals: divisionCode };
  }

  const rawCompletedMatches = await prisma.tournamentMatch.findMany({
    where: matchesWhere,
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      winner_team_id: true,
      roundName: true,
      // 2026-06-14 근본 수정 — KO 좌표 판정 (isPrelimMatch ③) 위해 SELECT 추가
      round_number: true,
      bracket_position: true,
      // 2026-06-14 근본 수정 — 조별 격리 (조간 매치 skip) 위해 양 팀 groupName SELECT 추가
      homeTeam: { select: { groupName: true } },
      awayTeam: { select: { groupName: true } },
    },
  });
  // 2026-05-16 사고 fix + 2026-06-14 근본 수정 — 예선 매치만 standings 에 반영.
  //   isPrelimMatch: 순위전(기존) / KO 라운드명 / 브래킷 좌표 매치를 모두 제외.
  //   (기존 /순위/ 단일 필터 → 결승·n강 등 KO 라운드 통과 버그를 isPrelimMatch 가 흡수)
  const completedMatches = rawCompletedMatches.filter(isPrelimMatch);

  // 무승부 매치도 standings 에 포함 — winner_team_id NOT NULL 필터 후 별도 SELECT 1건
  // 사유: 현 비즈니스 룰상 무승부 매치도 PF/PA + draws 박제 의무.
  //   기존 함수 (L75) 의 isDraw 분기 호환 — winner_team_id === null + scores 있음 = draws++
  //   완료 매치 중 winner_team_id NULL 인 매치 = 무승부 케이스.
  const drawMatchesWhere: {
    tournamentId: string;
    status: "completed";
    winner_team_id: null;
    settings?: { path: string[]; equals: string };
  } = {
    tournamentId: match.tournamentId,
    status: "completed",
    winner_team_id: null,
  };
  if (divisionCode !== null) {
    drawMatchesWhere.settings = { path: ["division_code"], equals: divisionCode };
  }
  const rawDrawMatches = await prisma.tournamentMatch.findMany({
    where: drawMatchesWhere,
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      roundName: true,
      // 2026-06-14 근본 수정 — completed 매치와 동일하게 KO 좌표·조별 격리 판정 필드 추가
      round_number: true,
      bracket_position: true,
      homeTeam: { select: { groupName: true } },
      awayTeam: { select: { groupName: true } },
    },
  });
  // 동일 룰 — 순위전·KO·좌표 무승부 매치도 예선 standings 에서 제외 (isPrelimMatch)
  const drawMatches = rawDrawMatches.filter(isPrelimMatch);

  // ─────────────────────────────────────────────────────────────────────
  // 3. in-memory 합산 (영향 받는 2 팀: home + away 만 계산)
  //   사유: 모든 팀을 합산할 필요 없음 — 본 함수는 매치 단건 trigger 이므로 영향 받는 2 팀만 UPDATE.
  //   (전체 종별 reset 은 scripts/_temp/recalc-standings-set.ts 의 역할이었음 — 본 함수 통합 후 삭제)
  // ─────────────────────────────────────────────────────────────────────
  // 2026-05-17 — winPoints 추가 (강남구 승점 룰).
  //   default 룰 = 승=3 / 패=0 → 단순 wins * 3 과 동일하나, 강남구는 점수차 분기 = 매치별 계산.
  //   매치별 calculateMatchPoints 호출 → home/awayPoints 합산.
  type Stats = {
    wins: number;
    losses: number;
    draws: number;
    pf: number;
    pa: number;
    winPoints: number;
  };
  const init = (): Stats => ({ wins: 0, losses: 0, draws: 0, pf: 0, pa: 0, winPoints: 0 });

  const homeId = match.homeTeamId;
  const awayId = match.awayTeamId;
  const homeStats = init();
  const awayStats = init();

  // 승부 결정 매치 합산
  for (const m of completedMatches) {
    if (m.homeTeamId === null || m.awayTeamId === null) continue;
    if (m.homeScore === null || m.awayScore === null) continue;
    // 2026-06-14 조별 격리 — 양 팀이 서로 다른 조면 조간(cross-group) 매치 → 조별 standings 오염 차단.
    //   ★폴백: 한쪽이라도 groupName NULL 이면 격리 안 함 (전체 1조 = 기존 동작 = 회귀 0).
    const hg = m.homeTeam?.groupName ?? null;
    const ag = m.awayTeam?.groupName ?? null;
    if (hg !== null && ag !== null && hg !== ag) continue;
    const hs = m.homeScore;
    const as = m.awayScore;
    const winnerId = m.winner_team_id;

    // 2026-05-17 강남구 승점 — 매치 단위 home/awayPoints 산출.
    //   loop 매치의 divisionCode = 본 update-standings 가 처리 중인 매치의 divisionCode 와 동일
    //   (= 위 matchesWhere 가 같은 division_code 로 filter 한 상태).
    //   따라서 본 매치의 divisionCode 를 전달.
    const matchPoints = calculateMatchPoints({
      homeScore: hs,
      awayScore: as,
      divisionCode,
      pointsRule,
    });

    // 매치의 home/away 가 본 함수의 home/away 와 같을 수도, 반대일 수도 있음 — 양 케이스 모두 처리
    // (한 팀이 home 으로 출전한 매치 + away 로 출전한 매치 모두 합산 필요)
    if (m.homeTeamId === homeId) {
      homeStats.pf += hs;
      homeStats.pa += as;
      homeStats.winPoints += matchPoints.homePoints;
      if (winnerId === homeId) homeStats.wins++;
      else if (winnerId === m.awayTeamId) homeStats.losses++;
    } else if (m.awayTeamId === homeId) {
      // homeId 팀이 본 매치에서 away 로 출전
      homeStats.pf += as;
      homeStats.pa += hs;
      homeStats.winPoints += matchPoints.awayPoints;
      if (winnerId === homeId) homeStats.wins++;
      else if (winnerId === m.homeTeamId) homeStats.losses++;
    }
    if (m.homeTeamId === awayId) {
      awayStats.pf += hs;
      awayStats.pa += as;
      awayStats.winPoints += matchPoints.homePoints;
      if (winnerId === awayId) awayStats.wins++;
      else if (winnerId === m.homeTeamId) awayStats.losses++;
    } else if (m.awayTeamId === awayId) {
      awayStats.pf += as;
      awayStats.pa += hs;
      awayStats.winPoints += matchPoints.awayPoints;
      if (winnerId === awayId) awayStats.wins++;
      else if (winnerId === m.homeTeamId) awayStats.losses++;
    }
  }

  // 무승부 매치 합산 (PF/PA + draws)
  for (const m of drawMatches) {
    if (m.homeTeamId === null || m.awayTeamId === null) continue;
    if (m.homeScore === null || m.awayScore === null) continue;
    // 2026-06-14 조별 격리 — completed loop 와 동일 (조간 무승부 매치 skip · NULL 폴백)
    const hg = m.homeTeam?.groupName ?? null;
    const ag = m.awayTeam?.groupName ?? null;
    if (hg !== null && ag !== null && hg !== ag) continue;
    const hs = m.homeScore;
    const as = m.awayScore;
    if (m.homeTeamId === homeId) {
      homeStats.pf += hs;
      homeStats.pa += as;
      homeStats.draws++;
    } else if (m.awayTeamId === homeId) {
      homeStats.pf += as;
      homeStats.pa += hs;
      homeStats.draws++;
    }
    if (m.homeTeamId === awayId) {
      awayStats.pf += hs;
      awayStats.pa += as;
      awayStats.draws++;
    } else if (m.awayTeamId === awayId) {
      awayStats.pf += as;
      awayStats.pa += hs;
      awayStats.draws++;
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // 4. TournamentTeam UPDATE (영향 받는 2 팀만 SET 방식 — 트랜잭션 wrap)
  //   사유: increment 가 아닌 SET → race / 다중 호출 / 외부 스크립트 모두 안전.
  // ─────────────────────────────────────────────────────────────────────
  // 2026-05-16 BUG FIX — where 절이 `teamId: homeId` 였음 (Team.id 매칭) → 다른 종별 섞임.
  //   `homeId` = `match.homeTeamId` = **TournamentTeam.id** (FK) 인데 Team.id 컬럼으로 검색.
  //   결과: 매치 0건 매칭 → standings 박제 안 됨 + 우연히 매칭된 다른 종별 row 에 박힘.
  //   수정: `id: homeId` 로 TournamentTeam.id 직접 매칭.
  await prisma.$transaction([
    prisma.tournamentTeam.updateMany({
      where: { id: homeId },
      data: {
        wins: homeStats.wins,
        losses: homeStats.losses,
        draws: homeStats.draws,
        points_for: homeStats.pf,
        points_against: homeStats.pa,
        point_difference: homeStats.pf - homeStats.pa,
        // 2026-05-17 강남구 승점 — default 룰 대회도 동일하게 박제 (= wins * 3 자연 합산).
        //   강남구 외 대회: points_rule 미박제 → default → 모든 승=3 / 패=0 = wins * 3 동일.
        win_points: homeStats.winPoints,
      },
    }),
    prisma.tournamentTeam.updateMany({
      // BUG FIX (위 home 동일) — teamId → id (TournamentTeam.id FK 직접 매칭)
      where: { id: awayId },
      data: {
        wins: awayStats.wins,
        losses: awayStats.losses,
        draws: awayStats.draws,
        points_for: awayStats.pf,
        points_against: awayStats.pa,
        point_difference: awayStats.pf - awayStats.pa,
        win_points: awayStats.winPoints,
      },
    }),
  ]);
}
