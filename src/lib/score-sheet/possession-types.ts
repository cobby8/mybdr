/**
 * 공격권 (Possession Arrow) 관련 공유 타입 — PR-Possession-1 (2026-05-16).
 *
 * 왜 (이유):
 *   FIBA 양식의 공격권 화살표 (Alternating Possession) 박제 — 점프볼 / 헬드볼 발생 시
 *   "다음 점유는 어느 팀" 시각 표시. UI (쿼터 뱃지 좌측 화살표) + BFF (PBP 박제) +
 *   vitest 사이에서 공유되는 데이터 모델.
 *   `src/lib/score-sheet/` 위치 = server-safe (running-score-types.ts / foul-types.ts /
 *   timeout-types.ts 동일 패턴).
 *
 * 룰 (FIBA Article 12 — Alternating Possession):
 *   - 경기 시작 시 점프볼 (Opening Jump Ball) — 1회 발생
 *     · winner = 점프볼 승리 팀 (실제 첫 점유 = home/away)
 *     · arrow = 패배 팀 방향 (= 다음 공격권 보유 팀)
 *   - 경기 중 헬드볼 (Held Ball) — 발생 시마다
 *     · 화살표 방향 팀이 공격권 획득
 *     · 이후 화살표는 반대 팀으로 토글 (다음 헬드볼 시 반대 팀 점유)
 *   - 화살표가 null 인 상태 = 경기 시작 전 (Opening Jump Ball 미박제)
 *
 * 박제 위치 (PR-Possession-2 책임):
 *   - match.settings.possession JSON (PR-1 은 헬퍼만 — JSON 박제는 PR-2)
 *   - PBP play_by_plays 테이블 (action_type = "jump_ball" / "held_ball") — PR-Possession-3
 *
 * 방법 (어떻게):
 *   - arrow: "home" | "away" | null — 화살표 현재 방향 (다음 점유 팀)
 *   - openingJumpBall: JumpBallEvent | null — 경기 시작 점프볼 이벤트 (1회)
 *   - heldBallEvents: HeldBallEvent[] — 경기 중 헬드볼 이벤트 시계열
 *   - winnerPlayerId: TournamentTeamPlayer.id (string — bigint 직렬화)
 */

// 경기 시작 점프볼 이벤트 — 1회 발생
export interface JumpBallEvent {
  // 점프볼 승리 팀 (첫 점유 권한)
  winner: "home" | "away";
  // 승리 선수 (선수 미선택 시 null — UI 가 fallback 허용)
  winnerPlayerId: string | null;
}

// 경기 중 헬드볼 이벤트 — 발생 시마다
export interface HeldBallEvent {
  // 발생 Period (1~7 — 1~4 = Quarter, 5+ = Overtime)
  period: number;
  // 화살표 방향대로 공격권 획득한 팀 (= 이벤트 직전 arrow 값)
  takingTeam: "home" | "away";
}

export interface PossessionState {
  // 현재 화살표 방향 (null = 경기 시작 전 / Opening Jump Ball 미박제)
  arrow: "home" | "away" | null;
  // 경기 시작 점프볼 (1회만 박제 — 2회 호출 시 마지막 박제값 보존)
  openingJumpBall: JumpBallEvent | null;
  // 경기 중 헬드볼 이벤트 시계열 (push 순서 = 발생 순서)
  heldBallEvents: HeldBallEvent[];
}

// 빈 상태 — 컴포넌트 초기값 + draft 복원 실패 시 fallback
export const EMPTY_POSSESSION: PossessionState = {
  arrow: null,
  openingJumpBall: null,
  heldBallEvents: [],
};
