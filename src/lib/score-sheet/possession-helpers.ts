/**
 * 공격권 (Possession Arrow) 순수 헬퍼 — PR-Possession-1 (2026-05-16).
 *
 * 왜 (이유):
 *   togglePossession / applyOpeningJumpBall / applyHeldBall / possessionToPBPInputs
 *   = ScoreSheetForm (client) + BFF submit (server) + vitest 가 공유.
 *   UI 와 분리해 vitest 회귀 보장 + immutable 패턴 강제 (state.* 직접 변형 ❌).
 *   `src/lib/score-sheet/` 위치 = server-safe (running-score-helpers.ts /
 *   timeout-helpers.ts 동일 패턴).
 *
 * 룰 (FIBA Article 12 — Alternating Possession):
 *   1. Opening Jump Ball (경기 시작 1회):
 *      - winner 팀이 첫 점유 → arrow = 반대 팀 (loser) 방향 (= 다음 공격권)
 *   2. Held Ball (경기 중):
 *      - arrow 방향 팀이 공격권 획득 (현 arrow 값 = takingTeam)
 *      - 이후 arrow 토글 (반대 팀으로 — 다음 헬드볼 시 반대 팀 점유)
 *   3. togglePossession (단순 토글 — 외부 호출용):
 *      - home ↔ away 즉시 전환
 *      - arrow = null 인 상태에서는 변경 0 (state 그대로 반환 — Opening Jump Ball 선행 필요)
 *
 * 방법 (어떻게):
 *   - 모든 헬퍼는 PURE — side effect 0, immutable, 새 객체 반환
 *   - running-score-helpers.ts 의 marksToPaperPBPInputs 패턴 그대로 적용 (PBP 변환)
 */

import type {
  PossessionState,
  JumpBallEvent,
  HeldBallEvent,
} from "./possession-types";

// 화살표 단순 토글 — home ↔ away 전환 (immutable)
//
// 룰:
//   - arrow = "home" → "away" / "away" → "home"
//   - arrow = null → state 그대로 반환 (Opening Jump Ball 미박제 시 토글 ❌)
//   - 새 객체 반환 (state.arrow 직접 변형 ❌)
export function togglePossession(state: PossessionState): PossessionState {
  if (state.arrow === null) {
    // Opening Jump Ball 박제 전 — 토글 불가 (caller 가 applyOpeningJumpBall 선호출 필요)
    return state;
  }
  return {
    ...state,
    arrow: state.arrow === "home" ? "away" : "home",
  };
}

// Opening Jump Ball 박제 — 경기 시작 1회 (재호출 시 마지막 박제값 보존)
//
// 룰:
//   - winner = 점프볼 승리 팀 → 첫 점유 권한 보유
//   - arrow = winner 의 반대 팀 (loser) 방향 (= 다음 공격권 = 헬드볼 발생 시 점유 팀)
//   - openingJumpBall 박제 (winner / winnerPlayerId)
//   - heldBallEvents 는 변경 0 (Opening Jump Ball 은 헬드볼 ❌ — 별도 이벤트)
export function applyOpeningJumpBall(
  state: PossessionState,
  winner: "home" | "away",
  winnerPlayerId: string | null
): PossessionState {
  const jumpBall: JumpBallEvent = {
    winner,
    winnerPlayerId,
  };
  return {
    ...state,
    arrow: winner === "home" ? "away" : "home", // 화살표 = 반대 팀 (loser) 방향
    openingJumpBall: jumpBall,
  };
}

// 헬드볼 박제 — 경기 중 발생 시마다 (배열 push + arrow 토글)
//
// 룰:
//   - takingTeam = 현재 arrow 값 (= 화살표 방향 팀이 공격권 획득)
//   - 이벤트 박제 후 arrow 토글 (= 다음 헬드볼 시 반대 팀 점유)
//   - arrow = null 인 상태 → state 그대로 반환 (Opening Jump Ball 선행 필수)
//
// 안전망:
//   - arrow null 가드 = caller (UI) 가 Opening Jump Ball 박제 후에만 호출하지만 보호 차원
export function applyHeldBall(
  state: PossessionState,
  period: number
): PossessionState {
  if (state.arrow === null) {
    // Opening Jump Ball 박제 전 — 헬드볼 박제 불가 (caller 보호)
    return state;
  }
  const event: HeldBallEvent = {
    period,
    takingTeam: state.arrow, // 현 arrow 값 = 공격권 획득 팀
  };
  return {
    ...state,
    arrow: state.arrow === "home" ? "away" : "home", // 토글 (다음 점유 = 반대 팀)
    heldBallEvents: [...state.heldBallEvents, event],
  };
}

// PBP 변환 입력 형식 — BFF (PR-Possession-3) 가 play_by_plays 박제용
//
// 박제 룰:
//   - action_type = "jump_ball" (Opening Jump Ball) / "held_ball" (경기 중 헬드볼)
//   - team = winner (jump_ball) / takingTeam (held_ball)
//   - period = 1 (Opening Jump Ball — Q1 시작 시점 박제) / event.period (held_ball)
//   - matchId 는 caller 가 PBP row 의 match_id 컬럼으로 박제 (본 헬퍼는 변환만)
export interface PossessionPBPInput {
  actionType: "jump_ball" | "held_ball";
  period: number;
  team: "home" | "away";
}

// PossessionState → PossessionPBPInput[] 변환 (시간순)
//
// 정렬 룰:
//   - openingJumpBall 이 1번째 (period = 1) — 있으면
//   - heldBallEvents 가 push 순서 그대로 (시계열 보존)
//
// 입력:
//   - state: PossessionState (UI 상태 또는 draft 복원)
//   - matchId: 본 헬퍼는 사용하지 않음 (caller PBP 박제 시 match_id 컬럼에 사용 — 시그니처 일관성)
export function possessionToPBPInputs(
  state: PossessionState,
  _matchId: string
): PossessionPBPInput[] {
  const result: PossessionPBPInput[] = [];

  // 1. Opening Jump Ball (있으면 1번째 — period = 1)
  if (state.openingJumpBall !== null) {
    result.push({
      actionType: "jump_ball",
      period: 1, // Q1 시작 시점 박제
      team: state.openingJumpBall.winner, // 승리 팀 = 첫 점유 팀
    });
  }

  // 2. 헬드볼 이벤트 시계열 (push 순서 그대로)
  state.heldBallEvents.forEach((event) => {
    result.push({
      actionType: "held_ball",
      period: event.period,
      team: event.takingTeam, // 화살표 방향대로 공격권 획득한 팀
    });
  });

  return result;
}
