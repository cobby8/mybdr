/**
 * PBP (play_by_plays) 이벤트 row 에서 home/away 팀 점수 합산.
 *
 * 왜 필요한가:
 * - 종료 매치에서 `tournamentMatch.homeScore`/`awayScore` = 0 + `match_player_stats.pts` = 0 인
 *   sync 누락 케이스 발생 (예: 매치 #132 — Flutter app 이 종료 시 /sync 한번도 호출 안 함).
 * - PBP 만 박제된 케이스에서 점수를 유일하게 복구 가능한 source = PBP.
 *
 * 단일 source 박제:
 * - Phase B: live API `/api/live/[id]/route.ts` 의 3단 fallback 마지막 단계에서 사용.
 * - Phase A (후속): backfill 스크립트도 동일 헬퍼 재사용 → 두 곳의 합산 로직 일치 보장.
 *
 * 합산 규칙 (route.ts L820~834 의 quarterScores 계산과 동일):
 * - `is_made === true` 만 카운트 (점수 발생 이벤트)
 * - `points_scored` 값 합산 (1/2/3 점)
 * - quarter null → 1 로 fallback
 * - tournament_team_id 가 homeTeamId/awayTeamId 와 일치하지 않으면 무시 (정합성 가드)
 * - 빈 PBP → 모든 값 0
 */

/** PBP 행 최소 type (route.ts SELECT 필드의 부분 집합) */
export type PbpRowForScore = {
  quarter: number | null;
  action_type: string | null;
  is_made: boolean | null;
  points_scored: number | null;
  tournament_team_id: bigint | number | null;
};

/** 합산 결과 — total + quarter 별 home/away */
export type ScoreFromPbp = {
  home: number;
  away: number;
  quarters: Record<number, { home: number; away: number }>;
};

/**
 * PBP 이벤트에서 made shot 만 필터링하여 home/away 팀 + quarter 별 점수 합산.
 *
 * @param pbps         PBP 행 배열 (SELECT 결과)
 * @param homeTeamId   home 팀의 tournament_team_id (BigInt 또는 number)
 * @param awayTeamId   away 팀의 tournament_team_id (BigInt 또는 number)
 * @returns            home/away 총합 + quarter 별 합산 표
 */
export function computeScoreFromPbp(
  pbps: PbpRowForScore[],
  homeTeamId: bigint | number,
  awayTeamId: bigint | number,
): ScoreFromPbp {
  // BigInt 와 number 혼용 안전 비교 — Number() 캐스팅 후 비교.
  // 사유: Prisma 는 tournament_team_id 를 BigInt 로 반환하지만, route.ts 의 다른 코드는
  //       Number 로 비교 (L827, L830). 동일 패턴 유지로 일관성 보장.
  const homeIdNum = Number(homeTeamId);
  const awayIdNum = Number(awayTeamId);

  // quarter 별 누적 — Q1~Q4 + OT (5+) 모두 동일 구조로 박제
  const quarters: Record<number, { home: number; away: number }> = {};
  let homeTotal = 0;
  let awayTotal = 0;

  for (const p of pbps) {
    // made shot 만 카운트 — route.ts L825 와 동일
    if (p.is_made !== true) continue;

    // points_scored null 안전 — 0 점은 무시 (free throw miss 등 방어)
    const pts = p.points_scored ?? 0;
    if (pts <= 0) continue;

    // quarter null fallback — route.ts L828 과 동일
    const q = p.quarter ?? 1;

    // team_id 가 null 또는 home/away 둘 다 아님 → 정합성 가드로 무시
    // (이런 PBP 는 일반적으로 부정상 데이터 — 합산에서 제외)
    if (p.tournament_team_id == null) continue;
    const teamIdNum = Number(p.tournament_team_id);

    if (teamIdNum === homeIdNum) {
      if (!quarters[q]) quarters[q] = { home: 0, away: 0 };
      quarters[q].home += pts;
      homeTotal += pts;
    } else if (teamIdNum === awayIdNum) {
      if (!quarters[q]) quarters[q] = { home: 0, away: 0 };
      quarters[q].away += pts;
      awayTotal += pts;
    }
    // else: 알 수 없는 team_id → 무시 (정합성 가드)
  }

  return {
    home: homeTotal,
    away: awayTotal,
    quarters,
  };
}
