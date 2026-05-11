/**
 * Player / Team Fouls 관련 공유 타입 — Phase 3 (2026-05-12).
 *
 * 왜 (이유):
 *   PlayerFoulsCells (client) + TeamFoulsBox (client) + ScoreSheetForm (client)
 *   + BFF submit (server) + vitest 사이에서 공유되는 파울 마킹 데이터 모델.
 *   `src/lib/score-sheet/` 위치 = server-safe (route group dir 의 client 컴포넌트
 *   곁에 두면 server import 시 위험).
 *
 * 룰 (FIBA 5x5):
 *   - 선수 1인당 최대 5 파울 (6번째 = 차단, 5번째 = 퇴장)
 *   - Team Fouls Period 별 5+ 도달 시 자유투 부여 (alert)
 *   - period 1~7 (1~4 = Quarter, 5+ = Overtime)
 *
 * 방법 (어떻게):
 *   - playerId: TournamentTeamPlayer.id (string — bigint 직렬화)
 *   - period: 1~7
 *   - Team 정보는 FoulsState 의 home/away 키로 결정 (FoulMark 안에 미박제)
 */

export interface FoulMark {
  // 파울 한 선수 (TournamentTeamPlayer.id 문자열)
  playerId: string;
  // 1=Q1 / 2=Q2 / 3=Q3 / 4=Q4 / 5+ = OT
  period: number;
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

// 선수 1인당 최대 파울 (FIBA 5x5 = 5)
export const MAX_PLAYER_FOULS = 5;

// Team Fouls Period 별 자유투 부여 임계값 (5+ 부터)
export const TEAM_FOUL_FT_THRESHOLD = 5;
