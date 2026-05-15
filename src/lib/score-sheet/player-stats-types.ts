/**
 * FIBA SCORESHEET Player Stats 타입 정의 — Phase 19 PR-Stat1 신규.
 *
 * 2026-05-15 — Phase 19 PR-Stat1 (planner-architect §1)
 *
 * 왜 (이유):
 *   FIBA 종이기록지에 OR (offensive rebound) / DR (defensive rebound) / A (assist) /
 *   S (steal) / B (block) / TO (turnover) 6 stat 을 player row 안에 입력 가능하게 박제.
 *   기존 PBP / fouls 외 별도 state 로 분리 — match_player_stats 직접 박제 (DB schema 변경 0).
 *   사용자 결재 Q1 = P.IN 직후 + Fouls 직전 위치 (FIBA 박스스코어 표준 순서).
 *
 * 방법 (어떻게):
 *   - PlayerStat = { or, dr, a, s, b, to } 단순 number 6 필드 (음수 차단 = helper 책임)
 *   - PlayerStatsState = Record<string, PlayerStat> (key = tournamentTeamPlayerId string)
 *   - 양 팀 통합 단일 record — TeamSection 이 자신의 player id 만 lookup
 *   - EMPTY_* 상수 제공 — useState 초기값 / draft 호환
 *
 * 절대 룰:
 *   - Q3 결재: match_player_stats 직접 박제 (DB 변경 0)
 *   - Q5 결재: paper 매치만 박제 / Flutter sync API 영향 0
 *   - playerId 키 = tournamentTeamPlayerId.toString() (BigInt 직렬화 — errors.md 2026-04-17)
 */

// 6 stat 단일 선수 — 음수 차단은 helper 책임 (removeStat 의 min 0 보장)
export interface PlayerStat {
  or: number; // Offensive Rebounds
  dr: number; // Defensive Rebounds
  a: number; // Assists
  s: number; // Steals
  b: number; // Blocks
  to: number; // Turnovers
}

// 양 팀 통합 — TeamSection 은 자신의 player id 만 lookup. record 미존재 시 EMPTY_PLAYER_STAT 폴백.
export type PlayerStatsState = Record<string, PlayerStat>;

// 빈 단일 선수 stat (helper 의 getStat / total 폴백 + UI 초기값)
export const EMPTY_PLAYER_STAT: PlayerStat = {
  or: 0,
  dr: 0,
  a: 0,
  s: 0,
  b: 0,
  to: 0,
};

// 빈 전체 state (useState 초기값) — record 자체 비어있음
export const EMPTY_PLAYER_STATS: PlayerStatsState = {};

// stat key 6 개 — UI / helper / submit wiring 의 단일 source.
//   순서 = FIBA 박스스코어 표준 (OR → DR → A → S → B → TO)
export const STAT_KEYS = ["or", "dr", "a", "s", "b", "to"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
