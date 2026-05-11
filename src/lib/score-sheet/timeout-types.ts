/**
 * Time-outs 관련 공유 타입 — Phase 4 (2026-05-12).
 *
 * 왜 (이유):
 *   TimeoutsBox (client) + ScoreSheetForm (client) + BFF submit (server) + vitest
 *   사이에서 공유되는 타임아웃 마킹 데이터 모델. `src/lib/score-sheet/` 위치 =
 *   server-safe (Phase 3 foul-types.ts 패턴 일관).
 *
 * 룰 (FIBA Article 18-19):
 *   - 전반 (Q1 + Q2): 팀당 2개
 *   - 후반 (Q3 + Q4): 팀당 3개
 *   - 연장 (OT 각각, period 5+): 팀당 1개
 *   - period 1~7 (1~4 = Quarter, 5+ = Overtime)
 *
 * 박제 위치:
 *   - match.settings.timeouts JSON (Phase 1-A recording_mode 토글 패턴 재사용)
 *   - schema 변경 0
 *
 * 방법 (어떻게):
 *   - period: 1~7 (1=Q1 / 2=Q2 / 3=Q3 / 4=Q4 / 5+=OT)
 *   - TimeoutMark 안에는 team / playerId 없음 — TimeoutsState 의 home/away 키로 결정
 *     (FoulMark 와 일관 패턴)
 */

// 타임아웃 1건 마킹
export interface TimeoutMark {
  // 1=Q1 / 2=Q2 / 3=Q3 / 4=Q4 / 5+=OT
  period: number;
}

export interface TimeoutsState {
  // 홈팀 타임아웃 (마킹 순서 = 시간순)
  home: TimeoutMark[];
  // 어웨이팀 타임아웃
  away: TimeoutMark[];
}

// 빈 상태 — 컴포넌트 초기값 + draft 복원 실패 시 fallback
export const EMPTY_TIMEOUTS: TimeoutsState = {
  home: [],
  away: [],
};

// 경기 phase (Article 18-19 룰 분기)
//   - first_half: Q1+Q2 (period 1~2) — 팀당 2개
//   - second_half: Q3+Q4 (period 3~4) — 팀당 3개
//   - overtime: OT (period 5+) — 팀당 1개 (각 OT 별도)
export type GamePhase = "first_half" | "second_half" | "overtime";

// Phase 별 사용 가능 타임아웃 수 (Article 18-19)
export const TIMEOUTS_PER_PHASE: Record<GamePhase, number> = {
  first_half: 2,
  second_half: 3,
  overtime: 1,
};
