/**
 * Player / Team Fouls 순수 헬퍼 — DB / DOM 의존 없는 함수만 (vitest 단위 테스트 가능).
 *
 * 2026-05-12 — Phase 3 신규.
 *
 * 왜 (이유):
 *   파울 카운트 / 퇴장 판정 / Team Fouls 자동 합산 / 자유투 부여 / PBP 변환 로직을
 *   PlayerFoulsCells (client) + TeamFoulsBox (client) + BFF (server) 양쪽에서
 *   재사용 + vitest 회귀 방지. UI 와 분리해 테스트 케이스 15+ 검증 가능.
 *   `src/lib/score-sheet/` 위치 = server-safe.
 *
 * 방법 (어떻게):
 *   - getPlayerFoulCount: 특정 선수의 파울 누적
 *   - getTeamFoulCountByPeriod: Period 별 팀 파울 합산
 *   - isPlayerEjected: 5반칙 도달 여부
 *   - shouldAwardFreeThrow: Period 내 팀 파울 5+ 도달 여부
 *   - foulsToPBPEvents: FoulsState → PBP foul event[] 변환 (BFF 박제용)
 *   - addFoul / removeLastFoul: 상태 변경 (5반칙 차단 포함)
 */

import {
  type FoulMark,
  type FoulsState,
  MAX_PLAYER_FOULS,
  TEAM_FOUL_FT_THRESHOLD,
} from "./foul-types";

// 선수 1인당 파울 누적 카운트
//
// 룰:
//   - fouls 배열 안 playerId 일치 항목 개수
//   - 0~5 범위 (caller 가 차단)
export function getPlayerFoulCount(
  fouls: FoulMark[],
  playerId: string
): number {
  return fouls.filter((f) => f.playerId === playerId).length;
}

// Period 별 팀 파울 합산
//
// 룰:
//   - 같은 period 의 모든 선수 파울 합산
//   - period 5+ = OT 각 period 별로 분리 합산 (FIBA 5x5 룰 — OT 도 5+ FT)
export function getTeamFoulCountByPeriod(
  fouls: FoulMark[],
  period: number
): number {
  return fouls.filter((f) => f.period === period).length;
}

// 선수 5반칙 도달 (퇴장) 여부
//
// 룰:
//   - 5 파울 이상 = 퇴장 (UI 행 회색 + "퇴장" 안내)
//   - 6번째 추가 시도 = caller 가 alert + 차단
export function isPlayerEjected(
  fouls: FoulMark[],
  playerId: string
): boolean {
  return getPlayerFoulCount(fouls, playerId) >= MAX_PLAYER_FOULS;
}

// Period 안 자유투 부여 여부 (Team Fouls 5+ 도달)
//
// 룰:
//   - 같은 period 안 팀 파울 5건 이상 = 다음 파울부터 자유투 부여
//   - UI alert toast 호출 시점 판정용
export function shouldAwardFreeThrow(
  fouls: FoulMark[],
  period: number
): boolean {
  return getTeamFoulCountByPeriod(fouls, period) >= TEAM_FOUL_FT_THRESHOLD;
}

// PlayByPlay foul event 변환 — service syncSingleMatch 가 박제할 PBP 형태
//
// 박제 룰 (Phase 2 score event 와 동일 패턴):
//   - local_id = `paper-fix-{uuid}` — 종이 기록 식별자
//   - description = `[종이 기록] 선수 N번 PX 파울` (N=등번호, X=period)
//   - action_type = "foul" (live API + 통산 stat 호환 — fouls 누적 시 +1)
//   - tournament_team_id, tournament_team_player_id 는 caller (BFF) 가 채움
//   - quarter = period (1~7)
//
// 점수 시계열 박제:
//   - home_score_at_time / away_score_at_time = 0 (파울 자체는 점수 영향 없음 — Phase 4+ 자유투 통합 시 보완)
export interface PaperFoulPBPInput {
  local_id: string;
  tournament_team_player_id_str: string; // BFF 가 bigint 변환
  team_side: "home" | "away"; // BFF 가 tournament_team_id 변환
  quarter: number;
  action_type: "foul";
  description: string;
}

// uuid v4 (브라우저 + node 양쪽 호환) — Phase 2 패턴 재사용
function generateUuid(): string {
  const cryptoLike = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoLike?.randomUUID) {
    return cryptoLike.randomUUID();
  }
  // fallback (테스트 환경 한정)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// PlayerNumberLookup — 등번호 표시용 (description "선수 N번" — N=jerseyNumber)
//
// 이유: PBP description 박제 시 선수 식별 위해 등번호 사용 (선수명은 PII 차원에서 회피)
export type PlayerNumberLookup = (playerIdStr: string) => string | null;

// home/away 양쪽 파울 → PaperFoulPBPInput[] 변환 (period 오름차순 정렬)
//
// 정렬 룰:
//   - period 오름차순 (Period 1 먼저)
//   - 같은 period 안 = 입력 순서 유지 (마킹 시간순 — UI 가 push 순서로 보장)
//   - 같은 period 안 home 먼저 (Phase 2 패턴 동일)
export function foulsToPBPEvents(
  state: FoulsState,
  jerseyLookup?: PlayerNumberLookup
): PaperFoulPBPInput[] {
  type TaggedFoul = { mark: FoulMark; side: "home" | "away"; index: number };
  const merged: TaggedFoul[] = [
    ...state.home.map((m, i) => ({ mark: m, side: "home" as const, index: i })),
    ...state.away.map((m, i) => ({ mark: m, side: "away" as const, index: i })),
  ];

  // 정렬: period → side (home 먼저) → index (마킹 순서 보존)
  merged.sort((a, b) => {
    if (a.mark.period !== b.mark.period) return a.mark.period - b.mark.period;
    if (a.side !== b.side) return a.side === "home" ? -1 : 1;
    return a.index - b.index;
  });

  return merged.map(({ mark, side }) => {
    // 등번호 lookup (없으면 playerId 그대로 노출 회피 — "?")
    const jersey = jerseyLookup?.(mark.playerId) ?? "?";
    return {
      local_id: `paper-fix-${generateUuid()}`,
      tournament_team_player_id_str: mark.playerId,
      team_side: side,
      quarter: mark.period,
      action_type: "foul" as const,
      description: `[종이 기록] 선수 ${jersey}번 P${mark.period} 파울`,
    };
  });
}

// 파울 추가 — 5반칙 도달 시 차단 (caller 가 alert)
//
// 반환:
//   - { ok: true, state: 갱신 } — 정상 추가
//   - { ok: false, reason } — 5반칙 (퇴장 후 추가 시도) 차단
export function addFoul(
  state: FoulsState,
  team: "home" | "away",
  mark: FoulMark
):
  | { ok: true; state: FoulsState }
  | { ok: false; reason: string } {
  const teamFouls = team === "home" ? state.home : state.away;
  // 5반칙 차단 (퇴장 후 추가 시도)
  if (getPlayerFoulCount(teamFouls, mark.playerId) >= MAX_PLAYER_FOULS) {
    return {
      ok: false,
      reason: `5반칙 도달 — 퇴장 선수에게 추가 파울을 박제할 수 없습니다.`,
    };
  }
  if (team === "home") {
    return {
      ok: true,
      state: { ...state, home: [...state.home, mark] },
    };
  }
  return {
    ok: true,
    state: { ...state, away: [...state.away, mark] },
  };
}

// 특정 선수의 마지막 파울 1건 제거 (해제 — pop 패턴)
//
// 룰:
//   - 해당 선수 마지막 마킹 1건 제거 (period 무관 — 가장 최근 박제)
//   - 빈 배열 또는 해당 선수 마킹 0 = no-op
export function removeLastFoul(
  state: FoulsState,
  team: "home" | "away",
  playerId: string
): FoulsState {
  const teamFouls = team === "home" ? state.home : state.away;
  // 뒤에서부터 검색해 첫 매치 1건 제거
  let removeIndex = -1;
  for (let i = teamFouls.length - 1; i >= 0; i -= 1) {
    if (teamFouls[i].playerId === playerId) {
      removeIndex = i;
      break;
    }
  }
  if (removeIndex < 0) return state;

  const next = [
    ...teamFouls.slice(0, removeIndex),
    ...teamFouls.slice(removeIndex + 1),
  ];
  if (team === "home") {
    return { ...state, home: next };
  }
  return { ...state, away: next };
}
