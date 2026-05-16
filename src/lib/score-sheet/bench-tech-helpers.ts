/**
 * Bench Technical + Delay of Game PURE 헬퍼 — DB / DOM 의존 0 (vitest 가능).
 *
 * 2026-05-16 (긴급 박제 — FIBA 정확 룰 / 사용자 결재 권장안 100%).
 *
 * 왜 (이유):
 *   team-section (client) + score-sheet-form (client) + bench-tech-modal (client) +
 *   BFF submit (server) + vitest 사이 공유. UI 와 분리해 ~15 케이스 단위 검증.
 *
 * 룰 (사용자 결재 권장안 — FIBA Article 36.3 / 36.4 / 36.2.3):
 *   - Head Coach 추방 = head[].length >= 3 (C/B_HEAD/B_BENCH 누적 합산)
 *   - Delay 자동 분기 = warned=false 시 클릭 = W 박제 / true 시 = T 박제
 *   - 자유투 슈터 모달 없음 (운영자 별도 박제 — Q3 수동)
 */

import {
  type BenchTechnicalState,
  type CoachFoulEntry,
  type CoachFoulKind,
  type DelayOfGameState,
  type TeamBenchTechnicalState,
  HEAD_COACH_EJECT_THRESHOLD,
} from "./bench-tech-types";

// ─────────────────────────────────────────────────────────────────────────────
// Bench Technical
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 한 팀의 Head Coach 누적 위반 수 (C + B_HEAD + B_BENCH 합산).
 *
 * 사유: 사용자 결재 권장안 = "Head Coach 통계 박제" — kind 무관 합산 후 임계 3 도달 시 추방.
 */
export function getCoachFoulCount(team: TeamBenchTechnicalState): number {
  // head 배열 = 모든 kind 합산 (assistant 는 보존용 / 현재 미사용).
  return team.head.length;
}

/**
 * Head Coach 추방 여부 — 누적 3건 도달.
 *
 * 사용자 결재 권장안:
 *   - C × 2 = 추방
 *   - C × 1 + B × 2 (= 3 total) = 추방
 *   - B × 3 (= 3 total, C 0) = 추방
 * ⇒ kind 분기 불필요 (합산 3 = 추방).
 */
export function canEjectCoach(team: TeamBenchTechnicalState): boolean {
  return getCoachFoulCount(team) >= HEAD_COACH_EJECT_THRESHOLD;
}

/**
 * 한 팀의 코치 위반 종류별 카운트 (UI 안내 / audit 박제용).
 */
export function coachFoulSummary(team: TeamBenchTechnicalState): {
  c: number;
  bHead: number;
  bBench: number;
  total: number;
} {
  const c = team.head.filter((e) => e.kind === "C").length;
  const bHead = team.head.filter((e) => e.kind === "B_HEAD").length;
  const bBench = team.head.filter((e) => e.kind === "B_BENCH").length;
  return { c, bHead, bBench, total: c + bHead + bBench };
}

/**
 * 코치 위반 1건 추가.
 *
 * 룰:
 *   - 이미 추방 (>=3) 시 차단 (caller 가 toast 표시).
 *   - 정상 추가 시 head 배열 끝에 push (시간순 보존).
 *
 * 반환:
 *   - { ok: true, state: 갱신 } — 정상 추가
 *   - { ok: false, reason } — 임계 도달 차단 메시지
 */
export function addCoachFoul(
  state: BenchTechnicalState,
  team: "home" | "away",
  entry: CoachFoulEntry,
):
  | { ok: true; state: BenchTechnicalState; ejected: boolean }
  | { ok: false; reason: string } {
  const teamState = team === "home" ? state.home : state.away;
  if (canEjectCoach(teamState)) {
    return {
      ok: false,
      reason: "Head Coach 추방 — 추가 박제 불가 (어시 코치 인계).",
    };
  }
  const nextTeamState: TeamBenchTechnicalState = {
    head: [...teamState.head, entry],
    assistant: teamState.assistant,
  };
  const nextState: BenchTechnicalState = {
    ...state,
    [team]: nextTeamState,
  };
  // 추방 도달 여부 — 본 추가 결과로 임계 도달 시 caller 가 toast 표시.
  const ejected = canEjectCoach(nextTeamState);
  return { ok: true, state: nextState, ejected };
}

/**
 * 한 팀의 마지막 코치 위반 1건 제거 (cell 마지막 클릭 = 해제).
 *
 * 룰:
 *   - 빈 배열 = no-op (state 그대로 반환 — caller 가 setX(next) 시 prev === next 비교 가능).
 */
export function removeLastCoachFoul(
  state: BenchTechnicalState,
  team: "home" | "away",
): BenchTechnicalState {
  const teamState = team === "home" ? state.home : state.away;
  if (teamState.head.length === 0) return state;
  const nextHead = teamState.head.slice(0, -1);
  const nextTeamState: TeamBenchTechnicalState = {
    head: nextHead,
    assistant: teamState.assistant,
  };
  return {
    ...state,
    [team]: nextTeamState,
  };
}

/**
 * UI cell idx (0~2) 의 현재 박제 상태 — Coach Fouls row 우측 3 cells.
 *
 * 반환:
 *   - filled       : 박제됨 (해당 idx < head.length)
 *   - kind         : 박제된 kind (filled=true 시) / null
 *   - isLastFilled : 마지막 마킹 cell (idx === head.length - 1) — 클릭 시 해제
 *   - isNextEmpty  : 다음 빈 cell (idx === head.length) — 클릭 시 모달 open
 *   - blocked      : 추방 도달 후 cell — 클릭 차단 (cell disabled)
 */
export function getCoachFoulCellState(
  team: TeamBenchTechnicalState,
  cellIdx: number,
): {
  filled: boolean;
  kind: CoachFoulKind | null;
  isLastFilled: boolean;
  isNextEmpty: boolean;
  blocked: boolean;
} {
  const count = team.head.length;
  const filled = cellIdx < count;
  const kind = filled ? team.head[cellIdx].kind : null;
  const isLastFilled = filled && cellIdx === count - 1;
  const isNextEmpty = !filled && cellIdx === count;
  const blocked = canEjectCoach(team) && !filled;
  return { filled, kind, isLastFilled, isNextEmpty, blocked };
}

// ─────────────────────────────────────────────────────────────────────────────
// Delay of Game
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delay 이벤트 1건 추가 (자동 분기).
 *
 * 룰 (사용자 결재 Q2 — Article 36.2.3):
 *   - warned === false → W 박제 (1차 경고 / 매치당 1회만 / 점수 변동 0).
 *   - warned === true  → T 박제 (technicals + 1 / 상대 자유투 1개 부여 — 운영자 수동).
 *
 * 반환:
 *   - { state: 갱신, kind: "W"|"T" } — caller 가 kind 기반 toast 분기.
 */
export function addDelayEvent(
  state: DelayOfGameState,
  team: "home" | "away",
): { state: DelayOfGameState; kind: "W" | "T" } {
  const teamState = state[team];
  if (!teamState.warned) {
    // 1차 = W (warning) 박제
    return {
      state: {
        ...state,
        [team]: { warned: true, technicals: teamState.technicals },
      },
      kind: "W",
    };
  }
  // 2차+ = T 박제 (technicals 카운트 +1 / 자유투 운영자 별도 박제)
  return {
    state: {
      ...state,
      [team]: { warned: true, technicals: teamState.technicals + 1 },
    },
    kind: "T",
  };
}

/**
 * 한 팀의 Delay 누적 cell 개수 (UI cells = W 1 + T technicals — 최소 0).
 *
 * UI 시각화 (사용자 결재 권장안 — Team fouls 위 1행):
 *   [Delay] [W][T1][T2][T3]...
 *   - W cell: warned=true 시 filled / false 시 빈 (다음 클릭 = W 박제)
 *   - T cells: technicals 개수만큼 filled (다음 클릭 = T 박제 — 무제한)
 */
export function getDelayCellCount(team: "home" | "away", state: DelayOfGameState): {
  warnedFilled: boolean;
  technicalsCount: number;
} {
  const teamState = state[team];
  return {
    warnedFilled: teamState.warned,
    technicalsCount: teamState.technicals,
  };
}

/**
 * 한 팀의 Delay 이벤트 1건 해제 (마지막 cell 클릭 = pop 패턴).
 *
 * 룰:
 *   - technicals > 0 = technicals 1 차감 (마지막 T 박제 해제).
 *   - technicals === 0 + warned = warned 해제 (1차 W 박제 해제).
 *   - 둘 다 0 = no-op.
 */
export function removeLastDelayEvent(
  state: DelayOfGameState,
  team: "home" | "away",
): DelayOfGameState {
  const teamState = state[team];
  if (teamState.technicals > 0) {
    return {
      ...state,
      [team]: {
        warned: teamState.warned,
        technicals: teamState.technicals - 1,
      },
    };
  }
  if (teamState.warned) {
    return {
      ...state,
      [team]: { warned: false, technicals: 0 },
    };
  }
  return state;
}

/**
 * PBP action_subtype 박제용 — DelayOfGameState → PBP event 배열 변환.
 *
 * 박제 룰 (BFF submit 시 사용):
 *   - warned=true → DELAY_W event 1건 (시간순 1번째)
 *   - technicals > 0 → DELAY_T event N건 (시간순 2번째~)
 *   - period 정보 = 본 헬퍼는 미박제 (warned/technicals state 가 period 시계열 보존 X) →
 *     BFF 가 currentPeriod 또는 1 fallback 박제.
 */
export interface DelayPBPEvent {
  team: "home" | "away";
  /** PBP action_subtype 박제용 (DELAY_W 또는 DELAY_T). */
  kind: "W" | "T";
}

export function delayToPBPEvents(state: DelayOfGameState): DelayPBPEvent[] {
  const events: DelayPBPEvent[] = [];
  (["home", "away"] as const).forEach((team) => {
    const ts = state[team];
    if (ts.warned) {
      events.push({ team, kind: "W" });
    }
    for (let i = 0; i < ts.technicals; i += 1) {
      events.push({ team, kind: "T" });
    }
  });
  return events;
}

/**
 * BenchTechnicalState → PBP event 배열 변환 (BFF 박제용).
 *
 * 박제 룰:
 *   - home.head + away.head 합산 (시간순 = 배열 push 순서 그대로).
 *   - kind = C / B_HEAD / B_BENCH (PBP action_subtype 박제).
 *   - period = entry.period (모달 박제 시 박혀있음).
 */
export interface BenchTechPBPEvent {
  team: "home" | "away";
  kind: CoachFoulKind;
  period: number;
}

export function benchTechToPBPEvents(
  state: BenchTechnicalState,
): BenchTechPBPEvent[] {
  const events: BenchTechPBPEvent[] = [];
  state.home.head.forEach((e) => {
    events.push({ team: "home", kind: e.kind, period: e.period });
  });
  state.away.head.forEach((e) => {
    events.push({ team: "away", kind: e.kind, period: e.period });
  });
  return events;
}
