/**
 * Player / Team Fouls 관련 공유 타입 — Phase 3 (2026-05-12).
 * Phase 3.5 (2026-05-12) — 파울 종류 (P/T/U/D) 확장.
 *
 * 왜 (이유):
 *   PlayerFoulsCells (client) + TeamFoulsBox (client) + ScoreSheetForm (client)
 *   + BFF submit (server) + vitest 사이에서 공유되는 파울 마킹 데이터 모델.
 *   `src/lib/score-sheet/` 위치 = server-safe (route group dir 의 client 컴포넌트
 *   곁에 두면 server import 시 위험).
 *
 * 룰 (FIBA 5x5):
 *   - 파울 종류 4종 (Article 36-39):
 *       P = Personal (가장 흔함)
 *       T = Technical
 *       U = Unsportsmanlike
 *       D = Disqualifying (즉시 퇴장)
 *   - 5반칙 룰 (Article 41) — 다음 중 하나 도달 시 퇴장:
 *       (a) Personal + Technical + Unsportsmanlike + Disqualifying 합 ≥ 5
 *       (b) Technical ≥ 2
 *       (c) Unsportsmanlike ≥ 2
 *       (d) Disqualifying ≥ 1 (즉시 퇴장)
 *     → 가장 빠른 조건이 적용 (예: T 2회 도달 시 5반칙 합산 보다 빠르게 퇴장)
 *   - Team Fouls Period 별 5+ 도달 시 자유투 부여 (alert)
 *   - period 1~7 (1~4 = Quarter, 5+ = Overtime)
 *
 * 방법 (어떻게):
 *   - playerId: TournamentTeamPlayer.id (string — bigint 직렬화)
 *   - period: 1~7
 *   - type: P/T/U/D (Phase 3.5 신규 — 기존 draft 호환: undefined = "P" 폴백)
 *   - Team 정보는 FoulsState 의 home/away 키로 결정 (FoulMark 안에 미박제)
 */

// 파울 종류 (FIBA Article 36-39) — Phase 3.5 신규
export type FoulType = "P" | "T" | "U" | "D";

// 파울 종류 라벨 (UI alert + description 박제용)
export const FOUL_TYPE_LABEL: Record<FoulType, string> = {
  P: "Personal",
  T: "Technical",
  U: "Unsportsmanlike",
  D: "Disqualifying",
};

export interface FoulMark {
  // 파울 한 선수 (TournamentTeamPlayer.id 문자열)
  playerId: string;
  // 1=Q1 / 2=Q2 / 3=Q3 / 4=Q4 / 5+ = OT
  period: number;
  // Phase 3.5 신규 — 파울 종류 (구 draft 호환: 없으면 caller 가 "P" 폴백)
  type: FoulType;
}

export interface FoulsState {
  // 홈팀 파울 (마킹 순서 = 시간순 — 같은 선수 5번 누적 시 차단)
  home: FoulMark[];
  // 어웨이팀 파울
  away: FoulMark[];
}

// 빈 상태 — 컴포넌트 초기값 + draft 복원 실패 시 fallback
export const EMPTY_FOULS: FoulsState = {
  home: [],
  away: [],
};

// 선수 1인당 최대 파울 (FIBA 5x5 = 5 — Personal 합산 기준)
export const MAX_PLAYER_FOULS = 5;

// Team Fouls Period 별 자유투 부여 임계값 (5+ 부터)
export const TEAM_FOUL_FT_THRESHOLD = 5;

// Phase 3.5 — 퇴장 사유 분기 (alert 메시지 + UI 안내용)
//
// 룰 (Article 41):
//   - 5_fouls: P+T+U+D 합 ≥ 5
//   - 2_technical: T ≥ 2
//   - 2_unsportsmanlike: U ≥ 2
//   - disqualifying: D ≥ 1 (즉시)
export type EjectionReason =
  | "5_fouls"
  | "2_technical"
  | "2_unsportsmanlike"
  | "disqualifying";

// 퇴장 사유별 alert 메시지 (toast / modal 본문 공통)
export const EJECTION_REASON_LABEL: Record<EjectionReason, string> = {
  "5_fouls": "5반칙 — 퇴장",
  "2_technical": "Technical 2회 — 퇴장",
  "2_unsportsmanlike": "Unsportsmanlike 2회 — 퇴장",
  "disqualifying": "Disqualifying — 즉시 퇴장",
};
