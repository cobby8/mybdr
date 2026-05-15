/**
 * FIBA SCORESHEET Player Stats 헬퍼 — Phase 19 PR-Stat1 신규.
 *
 * 2026-05-15 — Phase 19 PR-Stat1 (planner-architect §1)
 *
 * 왜 (이유):
 *   PlayerStatsState 의 add / remove / get / total 순수 함수.
 *   immutable 패턴 (운영 fouls / timeouts helpers 와 동일) — vitest 안전.
 *
 * 방법 (어떻게):
 *   - addStat: 해당 stat +1 / 신규 player = EMPTY_PLAYER_STAT 에서 시작
 *   - removeStat: 해당 stat -1, min 0 (음수 차단 — UI 잘못 클릭 안전망)
 *   - getStat: 미존재 player / stat = 0 폴백
 *   - totalStats: 단일 player 의 6 stat 합산 (모달 / live 표시 보조)
 *
 * 운영 동작 보존:
 *   - PlayerStat / PlayerStatsState 객체 단순 spread → 기존 state 와 reference 분리
 *   - state 변경 없으면 같은 reference 반환 가능 (React 리렌더 최소화 — 단, 본 헬퍼는 항상 새 객체)
 */

import type { PlayerStat, PlayerStatsState, StatKey } from "./player-stats-types";
import { EMPTY_PLAYER_STAT } from "./player-stats-types";

/**
 * 해당 player 의 해당 stat +1.
 * - player 미존재 = EMPTY_PLAYER_STAT 에서 시작 (해당 stat 만 1)
 * - 기존 stat 값 +1 (max 룰 없음 — 운영 사고 시 음수만 차단)
 *
 * @param state 전체 PlayerStatsState
 * @param playerId tournamentTeamPlayerId.toString()
 * @param statKey "or" | "dr" | "a" | "s" | "b" | "to"
 * @returns 새 PlayerStatsState (immutable)
 */
export function addStat(
  state: PlayerStatsState,
  playerId: string,
  statKey: StatKey
): PlayerStatsState {
  // 기존 player stat 폴백 — 미존재 시 EMPTY 에서 시작
  const prev = state[playerId] ?? EMPTY_PLAYER_STAT;
  // 단일 stat key 만 +1 (immutable spread)
  const next: PlayerStat = {
    ...prev,
    [statKey]: prev[statKey] + 1,
  };
  return {
    ...state,
    [playerId]: next,
  };
}

/**
 * 해당 player 의 해당 stat -1. min 0 (음수 차단).
 * - player 미존재 또는 stat=0 = state 그대로 반환 (reference 동일)
 * - 기존 stat 값 -1 (음수 결과 차단)
 *
 * @param state 전체 PlayerStatsState
 * @param playerId tournamentTeamPlayerId.toString()
 * @param statKey "or" | "dr" | "a" | "s" | "b" | "to"
 * @returns 새 PlayerStatsState 또는 변경 없으면 같은 reference
 */
export function removeStat(
  state: PlayerStatsState,
  playerId: string,
  statKey: StatKey
): PlayerStatsState {
  const prev = state[playerId];
  // 미존재 = 변경 없음 (reference 동일)
  if (!prev) return state;
  // 이미 0 = 변경 없음 (음수 차단)
  if (prev[statKey] <= 0) return state;
  const next: PlayerStat = {
    ...prev,
    [statKey]: prev[statKey] - 1,
  };
  return {
    ...state,
    [playerId]: next,
  };
}

/**
 * 해당 player 의 해당 stat 값 조회. 미존재 = 0 폴백.
 * - UI cell 렌더링 시 빈 칸 표시 분기에 사용
 *
 * @param state 전체 PlayerStatsState
 * @param playerId tournamentTeamPlayerId.toString()
 * @param statKey "or" | "dr" | "a" | "s" | "b" | "to"
 * @returns number (0 이상)
 */
export function getStat(
  state: PlayerStatsState,
  playerId: string,
  statKey: StatKey
): number {
  const player = state[playerId];
  if (!player) return 0;
  return player[statKey];
}

/**
 * 해당 player 의 6 stat 합산 PlayerStat 반환. 미존재 = EMPTY_PLAYER_STAT 복사.
 * - 모달 / live 표시 보조 (단일 선수 6 stat 요약 출력 시)
 *
 * @param state 전체 PlayerStatsState
 * @param playerId tournamentTeamPlayerId.toString()
 * @returns PlayerStat (always — 미존재도 EMPTY 복사)
 */
export function totalStats(
  state: PlayerStatsState,
  playerId: string
): PlayerStat {
  const player = state[playerId];
  if (!player) return { ...EMPTY_PLAYER_STAT };
  // immutable — 호출자가 mutate 못 하게 복사
  return { ...player };
}
