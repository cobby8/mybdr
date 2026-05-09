// 2026-05-10: pending → scheduled 자동 전환 헬퍼
// errors.md `[2026-05-10] stale pending` 재발 방지.
//
// 배경:
//   dual-tournament-generator 는 8강/4강/결승 매치를 status="pending" 으로 박제 (팀 미정 슬롯).
//   팀이 채워지고 일정도 확정됐는데 status 가 pending 으로 남는 stale 케이스가
//   2026-05-10 운영 DB 에서 3건 발견 (matchId 150/151/152, 정정 완료).
//
// 룰:
//   매치 update 시 다음 4 조건을 모두 만족하면 status 를 자동으로 "scheduled" 로 전환.
//   1) 현재 status === "pending"
//   2) update 후 homeTeamId 채워짐 (NULL 아님)
//   3) update 후 awayTeamId 채워짐 (NULL 아님)
//   4) update 후 scheduledAt 채워짐 (NULL 아님)
//
// 사용 위치 (3 곳):
//   1) src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts  (운영자 PATCH)
//   2) src/lib/services/match.ts: updateMatch                       (winner 진출 시 다음 매치)
//   3) src/lib/tournaments/dual-progression.ts: progressDualMatch   (loser 진출 시 다음 매치)
//
// 단일 헬퍼로 추출하여 3 위치 일관 동작 보장.

/**
 * 매치가 자동으로 pending → scheduled 전환되어야 하는지 판정.
 *
 * @param state - 매치의 (update 후) 4 필드 상태
 * @returns true = 자동 전환 필요 / false = 변경 X
 */
export function shouldAutoSchedule(state: {
  /** 현재 (또는 update 직전) status. null 도 허용 (DB 컬럼이 nullable). */
  currentStatus: string | null;
  /** update 후 homeTeamId. null 이면 아직 미정. */
  homeTeamId: bigint | null;
  /** update 후 awayTeamId. null 이면 아직 미정. */
  awayTeamId: bigint | null;
  /** update 후 scheduledAt. null 이면 아직 미정. */
  scheduledAt: Date | null;
}): boolean {
  return (
    state.currentStatus === "pending" &&
    state.homeTeamId !== null &&
    state.awayTeamId !== null &&
    state.scheduledAt !== null
  );
}

/**
 * 자동 전환 trigger 식별자 (audit context 용).
 * - matches_patch: 운영자가 PATCH /matches/:matchId 직접 호출
 * - advance:      services/match.ts updateMatch winner 진출 (다음 매치 슬롯 채움)
 * - dual_progress: progressDualMatch loser/winner 진출 (다음 매치 슬롯 채움)
 */
export type AutoScheduleTrigger = "matches_patch" | "advance" | "dual_progress";

/**
 * audit context 표준 메시지 생성.
 * recordMatchAudit 의 context 파라미터에 그대로 전달.
 */
export function autoScheduleAuditContext(
  trigger: AutoScheduleTrigger,
  sourceMatchId?: bigint,
): string {
  const base = `auto-schedule pending→scheduled (${trigger})`;
  if (sourceMatchId !== undefined) {
    return `${base} (source match ${sourceMatchId})`;
  }
  return base;
}
