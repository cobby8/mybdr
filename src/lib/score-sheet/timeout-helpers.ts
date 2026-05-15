/**
 * Time-outs 순수 헬퍼 — DB / DOM 의존 없는 함수만 (vitest 단위 테스트 가능).
 *
 * 2026-05-12 — Phase 4 신규.
 *
 * 왜 (이유):
 *   TimeoutsBox (client) + ScoreSheetForm (client) + BFF (server) + vitest
 *   양쪽에서 재사용 + Article 18-19 룰 회귀 방지. UI 와 분리해 테스트 케이스 15+ 검증.
 *   `src/lib/score-sheet/` 위치 = server-safe (Phase 3 foul-helpers.ts 패턴 일관).
 *
 * 방법 (어떻게):
 *   - getGamePhase: period → "first_half" | "second_half" | "overtime"
 *   - getUsedTimeouts: 특정 phase 의 사용 카운트 (OT 는 별도 period 지정)
 *   - getRemainingTimeouts: 잔여 카운트 (= TIMEOUTS_PER_PHASE - used)
 *   - canAddTimeout: 현재 period 에서 추가 가능 여부 + 사유 메시지
 *   - addTimeout / removeLastTimeout: 상태 변경 (Article 18-19 차단 포함)
 *
 * 룰 (FIBA Article 18-19):
 *   - 전반 (Q1+Q2): 팀당 2개 — Q1 + Q2 합산
 *   - 후반 (Q3+Q4): 팀당 3개 — Q3 + Q4 합산
 *   - 연장 (OT 각각): 팀당 1개 — period 5 / 6 / 7 별도 카운트
 *
 * 단순화 (본 작업 범위 외):
 *   - Q4 마지막 2분 룰 (후반 3개 중 2개만 사용 가능) 미적용
 *   - Q2 마지막 2분 룰 (전반 2개 모두 마지막 2분 사용 가능) 미적용
 *   → 현재는 합산 카운트만 검증 (시간 정보 없음 = 종이 기록 특성)
 */

import {
  type TimeoutMark,
  type TimeoutsState,
  type GamePhase,
  TIMEOUTS_PER_PHASE,
} from "./timeout-types";

// period → GamePhase 분기
//
// 룰:
//   - 1, 2 → first_half (전반)
//   - 3, 4 → second_half (후반)
//   - 5+ → overtime (연장)
export function getGamePhase(period: number): GamePhase {
  if (period <= 2) return "first_half";
  if (period <= 4) return "second_half";
  return "overtime";
}

// 사용된 타임아웃 카운트
//
// 룰:
//   - first_half: period 1+2 합산
//   - second_half: period 3+4 합산
//   - overtime: 특정 OT period (5/6/7) 만 카운트 — overtimePeriod 인자 필수
//
// 인자:
//   - timeouts: 한 팀의 TimeoutMark[] (home 또는 away)
//   - phase: "first_half" | "second_half" | "overtime"
//   - overtimePeriod: overtime phase 일 때 어떤 OT 인지 (5/6/7) — 미전달 시 모든 OT 합산
export function getUsedTimeouts(
  timeouts: TimeoutMark[],
  phase: GamePhase,
  overtimePeriod?: number
): number {
  if (phase === "first_half") {
    return timeouts.filter((t) => t.period === 1 || t.period === 2).length;
  }
  if (phase === "second_half") {
    return timeouts.filter((t) => t.period === 3 || t.period === 4).length;
  }
  // overtime — 특정 OT period 지정 시 그것만 카운트
  if (overtimePeriod !== undefined) {
    return timeouts.filter((t) => t.period === overtimePeriod).length;
  }
  // 미지정 시 모든 OT 합산 (호환성)
  return timeouts.filter((t) => t.period >= 5).length;
}

// 잔여 타임아웃 카운트
//
// 룰:
//   - first_half: 2 - used
//   - second_half: 3 - used
//   - overtime: 1 - used (각 OT 별도)
//   - 음수 방지 (max 0)
export function getRemainingTimeouts(
  timeouts: TimeoutMark[],
  phase: GamePhase,
  overtimePeriod?: number
): number {
  const used = getUsedTimeouts(timeouts, phase, overtimePeriod);
  const max = TIMEOUTS_PER_PHASE[phase];
  return Math.max(0, max - used);
}

// 추가 가능 여부 + 사유 메시지
//
// 룰:
//   - 현재 period 의 phase 추출 → 해당 phase 의 잔여 검증
//   - OT (period 5+) 는 해당 OT period 만 카운트
//   - reason 카피:
//       - 허용: "전반 타임아웃 1/2 사용" 류 (caller 가 toast 직접 조립)
//       - 차단: "전반 타임아웃 모두 사용" / "후반 타임아웃 모두 사용" / "OT 타임아웃 모두 사용"
export function canAddTimeout(
  timeouts: TimeoutMark[],
  currentPeriod: number
): { allowed: boolean; reason: string } {
  const phase = getGamePhase(currentPeriod);
  // overtime 일 때만 현재 OT period 전달 (각 OT 별도 카운트)
  const otPeriod = phase === "overtime" ? currentPeriod : undefined;
  const remaining = getRemainingTimeouts(timeouts, phase, otPeriod);
  if (remaining <= 0) {
    // phase 별 차단 메시지 분기
    if (phase === "first_half") {
      return { allowed: false, reason: "전반 타임아웃 모두 사용 — 추가 불가" };
    }
    if (phase === "second_half") {
      return { allowed: false, reason: "후반 타임아웃 모두 사용 — 추가 불가" };
    }
    return {
      allowed: false,
      reason: `OT${currentPeriod - 4} 타임아웃 모두 사용 — 추가 불가`,
    };
  }
  // 허용 — 잔여 표시 (caller 가 사용/총합 형식으로 toast)
  const used = getUsedTimeouts(timeouts, phase, otPeriod);
  const max = TIMEOUTS_PER_PHASE[phase];
  if (phase === "first_half") {
    return { allowed: true, reason: `전반 타임아웃 ${used + 1}/${max}` };
  }
  if (phase === "second_half") {
    return { allowed: true, reason: `후반 타임아웃 ${used + 1}/${max}` };
  }
  return {
    allowed: true,
    reason: `OT${currentPeriod - 4} 타임아웃 ${used + 1}/${max}`,
  };
}

// 타임아웃 추가 — Article 18-19 차단 시 차단 + 사유 반환
//
// 반환:
//   - { ok: true, state: 갱신, reason: "전반 타임아웃 1/2" 류 } — 정상 추가
//   - { ok: false, reason } — Article 18-19 차단 메시지
export function addTimeout(
  state: TimeoutsState,
  team: "home" | "away",
  mark: TimeoutMark
):
  | { ok: true; state: TimeoutsState; reason: string }
  | { ok: false; reason: string } {
  const teamTimeouts = team === "home" ? state.home : state.away;
  const check = canAddTimeout(teamTimeouts, mark.period);
  if (!check.allowed) {
    return { ok: false, reason: check.reason };
  }
  if (team === "home") {
    return {
      ok: true,
      state: { ...state, home: [...state.home, mark] },
      reason: check.reason,
    };
  }
  return {
    ok: true,
    state: { ...state, away: [...state.away, mark] },
    reason: check.reason,
  };
}

// FIBA Phase 19 PR-T1 (2026-05-15) — 셀 위치 기반 phase 추출 + 활성 분기
//
// 왜 (이유):
//   FIBA SCORESHEET Time-outs 7 cells (전반 2 / 후반 3 / OT 2) — 시안 정합 고정 grid.
//   현재 period 와 cell 위치 phase 가 다르면 사용 불가 (예: Q3 진행 중 = 전반 cell 0/1 disabled).
//   기존 canAddTimeout 은 "phase 잔여" 만 검증 → cell index 별 시각 disabled 차단 룰 별도 필요.
//
// 방법 (어떻게):
//   - getCellPhase(cellIndex): 0~1 = first_half / 2~4 = second_half / 5+ = overtime
//   - isCellActive(cellIndex, currentPeriod):
//       cell phase === current phase 일 때만 활성
//       단, OT 의 경우 cellIndex 5 = OT1 (period 5) / 6 = OT2 (period 6) ... 1:1 매칭
//
// 사용처:
//   team-section.tsx SSTimeoutCells onClick / disabled / data-disabled-phase 속성 wiring.
//   cell 의 시각 회색 (data-disabled-phase="true") + cursor not-allowed CSS 룰 트리거.

// cell 위치 → 해당 cell 이 속한 phase
//
// 룰 (시안 7 cells 정합):
//   - index 0, 1 = first_half (전반 2칸)
//   - index 2, 3, 4 = second_half (후반 3칸)
//   - index 5+ = overtime (OT 2칸 기본 + 다중 OT 확장)
export function getCellPhase(cellIndex: number): GamePhase {
  if (cellIndex <= 1) return "first_half";
  if (cellIndex <= 4) return "second_half";
  return "overtime";
}

// cell 활성 여부 — 현재 period 와 cell phase 일치 시 true
//
// 룰:
//   - cell phase === current phase 인 경우 활성
//   - OT 의 경우 cellIndex 와 currentPeriod 일대일 매칭:
//       cellIndex 5 ↔ period 5 (OT1) / 6 ↔ 6 (OT2) / 7 ↔ 7 (OT3) ...
//       다른 OT 진행 중인 cell = 비활성 (예: OT2 진행 중 = cell 5 disabled)
//   - 미래 phase (e.g. Q1 진행 중 = 후반/OT cell) = 비활성
//   - 과거 phase (e.g. Q3 진행 중 = 전반 cell) = 비활성 (이미 채워진 셀은 caller 에서 별도 isLastFilled 분기)
export function isCellActive(cellIndex: number, currentPeriod: number): boolean {
  const cellPhase = getCellPhase(cellIndex);
  const currentPhase = getGamePhase(currentPeriod);
  if (cellPhase !== currentPhase) return false;
  // OT phase 일 때만 cellIndex ↔ currentPeriod 일대일 매칭
  if (cellPhase === "overtime") {
    // cellIndex 5 = period 5 / 6 = period 6 / 7 = period 7 ...
    return cellIndex === currentPeriod;
  }
  return true;
}

// 마지막 타임아웃 1건 제거 (해제 — pop 패턴, foul-helpers 와 일관)
//
// 룰:
//   - 해당 팀 마지막 마킹 1건 제거 (period 무관 — 가장 최근 박제)
//   - 빈 배열 = no-op (원본 state 반환)
export function removeLastTimeout(
  state: TimeoutsState,
  team: "home" | "away"
): TimeoutsState {
  const teamTimeouts = team === "home" ? state.home : state.away;
  if (teamTimeouts.length === 0) return state;
  const next = teamTimeouts.slice(0, -1);
  if (team === "home") {
    return { ...state, home: next };
  }
  return { ...state, away: next };
}
