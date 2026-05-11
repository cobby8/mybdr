/**
 * Running Score 관련 공유 타입 — Phase 2 (2026-05-12).
 *
 * 왜 (이유):
 *   RunningScoreGrid (client) + PlayerSelectModal (client) + ScoreSheetForm (client)
 *   + BFF submit (server) + vitest 사이에서 공유되는 점수 마킹 데이터 모델.
 *   `src/lib/score-sheet/` 위치 = server-safe (route group dir 의 "use client" 컴포넌트
 *   곁에 두면 server import 시 위험할 수 있음 — 안전한 lib 위치로 이동).
 *
 * 방법 (어떻게):
 *   - position: 1~160 (4 세트 × 40 row × A|B 한쪽 기준) — Team 별 누적 점수와 일치
 *   - playerId: TournamentTeamPlayer.id (string — bigint 직렬화)
 *   - period: 1~7 (1~4 = Quarter, 5+ = Overtime — 운영 안전성 7까지 허용)
 *   - points: 1/2/3 (마킹 칸 차이로 자동 추론된 값 — UI 표시용)
 */

export interface ScoreMark {
  // FIBA 양식 1-160 (한 팀 누적 점수 위치 — 마킹된 칸 번호)
  position: number;
  // 득점 선수 (TournamentTeamPlayer.id 문자열)
  playerId: string;
  // 1=Q1 / 2=Q2 / 3=Q3 / 4=Q4 / 5+ = OT
  period: number;
  // 1점 / 2점 / 3점 (이전 마킹과의 차이로 자동 추론)
  points: 1 | 2 | 3;
}

export interface RunningScoreState {
  // 홈팀 마킹 (position 오름차순)
  home: ScoreMark[];
  // 어웨이팀 마킹 (position 오름차순)
  away: ScoreMark[];
  // 현재 진행 중인 Period (1~7) — UI 에서 새 득점 마킹 시 자동 부여
  currentPeriod: number;
}

/**
 * Period 별 점수 합산 결과 — PeriodScoresSection 표시용.
 *
 * 각 Period 의 점수 = 해당 Period 에서 마킹된 ScoreMark 의 points 합.
 */
export interface PeriodScoreLine {
  // 1~4 (Quarter) / 5+ (Overtime)
  period: number;
  homePoints: number;
  awayPoints: number;
}

/**
 * Final Score + Winner — UI 표시용 derived state.
 *
 * - homeTotal = home.length 마지막 마킹 position (없으면 0)
 * - awayTotal = away.length 마지막 마킹 position
 * - winner: "home" | "away" | "tie" | "none" (경기 미시작)
 */
export interface FinalScore {
  homeTotal: number;
  awayTotal: number;
  winner: "home" | "away" | "tie" | "none";
}
