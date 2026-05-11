/**
 * Player / Team Fouls 순수 헬퍼 — DB / DOM 의존 없는 함수만 (vitest 단위 테스트 가능).
 *
 * 2026-05-12 — Phase 3 신규.
 * 2026-05-12 — Phase 3.5 확장 (FIBA Article 41 5반칙 룰 + 파울 종류 P/T/U/D + 퇴장 사유 분기).
 *
 * 왜 (이유):
 *   파울 카운트 / 퇴장 판정 / Team Fouls 자동 합산 / 자유투 부여 / PBP 변환 로직을
 *   PlayerFoulsCells (client) + TeamFoulsBox (client) + BFF (server) 양쪽에서
 *   재사용 + vitest 회귀 방지. UI 와 분리해 테스트 케이스 20+ 검증 가능.
 *   `src/lib/score-sheet/` 위치 = server-safe.
 *
 * 방법 (어떻게):
 *   - getPlayerFoulCount: 특정 선수의 파울 누적 (P/T/U/D 합산)
 *   - getPlayerFoulCountByType: 종류별 누적 (Article 41 T/U/D 임계 판정용)
 *   - getTeamFoulCountByPeriod: Period 별 팀 파울 합산
 *   - isPlayerEjected: Article 41 — 4가지 조건 중 하나라도 도달 시 true
 *   - getEjectionReason: 퇴장 사유 분기 (5_fouls / 2_technical / 2_unsportsmanlike / disqualifying)
 *   - shouldAwardFreeThrow: Period 내 팀 파울 5+ 도달 여부
 *   - foulsToPBPEvents: FoulsState → PBP foul event[] 변환 (BFF 박제용)
 *   - addFoul / removeLastFoul: 상태 변경 (Article 41 차단 포함)
 */

import {
  type FoulMark,
  type FoulsState,
  type FoulType,
  type EjectionReason,
  MAX_PLAYER_FOULS,
  TEAM_FOUL_FT_THRESHOLD,
} from "./foul-types";

// 선수 1인당 파울 누적 카운트 (P/T/U/D 합산)
//
// 룰:
//   - fouls 배열 안 playerId 일치 항목 개수 (종류 무관 합산)
//   - 0~∞ 범위 (caller 가 Article 41 종합 차단)
export function getPlayerFoulCount(
  fouls: FoulMark[],
  playerId: string
): number {
  return fouls.filter((f) => f.playerId === playerId).length;
}

// Phase 3.5 — 선수별 + 종류별 누적 (Article 41 T/U/D 임계 판정용)
//
// 룰:
//   - 같은 playerId + 같은 type 항목 개수
//   - T ≥ 2 / U ≥ 2 / D ≥ 1 분기 판정에 사용
export function getPlayerFoulCountByType(
  fouls: FoulMark[],
  playerId: string,
  type: FoulType
): number {
  return fouls.filter((f) => f.playerId === playerId && f.type === type).length;
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

// Phase 3.5 — Article 41 퇴장 사유 분기
//
// 룰 (우선순위 — 가장 빠른 조건 적용):
//   1. D ≥ 1 → "disqualifying" (1건만으로도 즉시 퇴장)
//   2. T ≥ 2 → "2_technical"
//   3. U ≥ 2 → "2_unsportsmanlike"
//   4. P+T+U+D 합 ≥ 5 → "5_fouls"
//   - 어떤 조건도 미달 시 null
//
// 이유:
//   - 알림 메시지 차별화 (5반칙 vs T 2회 vs U 2회 vs D 즉시) — 사용자 결재 Phase 3.5
//   - 우선순위는 "조건이 가장 빨리 도달한 것" 이 아닌 "심각도 순" (D > T 2회 > U 2회 > 5반칙)
//     → 같은 시점에 여러 조건 동시 도달 시 더 심각한 사유로 표기
export function getEjectionReason(
  fouls: FoulMark[],
  playerId: string
): { ejected: boolean; reason: EjectionReason | null } {
  const dCount = getPlayerFoulCountByType(fouls, playerId, "D");
  if (dCount >= 1) {
    return { ejected: true, reason: "disqualifying" };
  }
  const tCount = getPlayerFoulCountByType(fouls, playerId, "T");
  if (tCount >= 2) {
    return { ejected: true, reason: "2_technical" };
  }
  const uCount = getPlayerFoulCountByType(fouls, playerId, "U");
  if (uCount >= 2) {
    return { ejected: true, reason: "2_unsportsmanlike" };
  }
  const total = getPlayerFoulCount(fouls, playerId);
  if (total >= MAX_PLAYER_FOULS) {
    return { ejected: true, reason: "5_fouls" };
  }
  return { ejected: false, reason: null };
}

// 선수 퇴장 여부 (Article 41 4가지 조건 중 하나라도 도달)
//
// 룰:
//   - getEjectionReason 결과의 ejected 값 그대로
//   - UI 행 회색 + 차단용
export function isPlayerEjected(
  fouls: FoulMark[],
  playerId: string
): boolean {
  return getEjectionReason(fouls, playerId).ejected;
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
//   - description = `[종이 기록] 선수 N번 {P/T/U/D}` (N=등번호, 종류 약자 직접 박제)
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
  // Phase 3.5 — 파울 종류 (BFF 가 추가 박제 필요 시 사용 — 현재 description 에 박제)
  foul_type: FoulType;
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
    // Phase 3.5 — 파울 종류 약자 직접 박제 (예: "T", "U", "D")
    return {
      local_id: `paper-fix-${generateUuid()}`,
      tournament_team_player_id_str: mark.playerId,
      team_side: side,
      quarter: mark.period,
      action_type: "foul" as const,
      description: `[종이 기록] 선수 ${jersey}번 ${mark.type}`,
      foul_type: mark.type,
    };
  });
}

// 파울 추가 — Article 41 도달 시 차단 (caller 가 alert)
//
// 룰:
//   - 추가 전 getEjectionReason 으로 이미 퇴장 상태인지 확인
//   - 이미 퇴장 → 차단 + reason 반환
//   - 정상 추가
//
// 반환:
//   - { ok: true, state: 갱신 } — 정상 추가
//   - { ok: false, reason } — Article 41 차단 메시지
export function addFoul(
  state: FoulsState,
  team: "home" | "away",
  mark: FoulMark
):
  | { ok: true; state: FoulsState }
  | { ok: false; reason: string } {
  const teamFouls = team === "home" ? state.home : state.away;
  // Article 41 차단 (이미 퇴장 상태인 선수에 추가 시도)
  const ejection = getEjectionReason(teamFouls, mark.playerId);
  if (ejection.ejected) {
    // reason 별 차단 메시지 분기
    const reasonMsg: Record<EjectionReason, string> = {
      "5_fouls": "5반칙 — 이미 퇴장한 선수에게 추가 파울을 박제할 수 없습니다.",
      "2_technical":
        "Technical 2회 — 이미 퇴장한 선수에게 추가 파울을 박제할 수 없습니다.",
      "2_unsportsmanlike":
        "Unsportsmanlike 2회 — 이미 퇴장한 선수에게 추가 파울을 박제할 수 없습니다.",
      "disqualifying":
        "Disqualifying — 이미 퇴장한 선수에게 추가 파울을 박제할 수 없습니다.",
    };
    return {
      ok: false,
      reason: reasonMsg[ejection.reason!],
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
