/**
 * 공격권 (Possession) 헬퍼 단위 테스트 — PR-Possession-1 (2026-05-16).
 *
 * 검증 대상 (FIBA Article 12):
 *   - togglePossession: home ↔ away 토글 + null arrow 가드 + immutability (4 케이스)
 *   - applyOpeningJumpBall: home winner → arrow=away / away winner → arrow=home / 재호출 보존 (3 케이스)
 *   - applyHeldBall: arrow 토글 + event push + null arrow 가드 (3 케이스)
 *   - possessionToPBPInputs: empty / opening only / opening+held / period 정합 / actionType 정합 (5 케이스)
 *
 * 룰 매트릭스:
 *   - Opening Jump Ball winner = home → arrow = away (loser 방향)
 *   - Held Ball 발생 시 takingTeam = 현재 arrow → 박제 후 arrow 토글
 *   - PBP 변환: jump_ball (period=1) 1번째 + held_ball (event.period 순서) 시계열
 */

import { describe, it, expect } from "vitest";
import {
  togglePossession,
  applyOpeningJumpBall,
  applyHeldBall,
  possessionToPBPInputs,
} from "@/lib/score-sheet/possession-helpers";
import {
  type PossessionState,
  EMPTY_POSSESSION,
} from "@/lib/score-sheet/possession-types";

describe("togglePossession", () => {
  // 1. home → away 토글
  it("arrow=home → away", () => {
    const state: PossessionState = {
      arrow: "home",
      openingJumpBall: { winner: "away", winnerPlayerId: null },
      heldBallEvents: [],
    };
    const result = togglePossession(state);
    expect(result.arrow).toBe("away");
  });

  // 2. away → home 토글
  it("arrow=away → home", () => {
    const state: PossessionState = {
      arrow: "away",
      openingJumpBall: { winner: "home", winnerPlayerId: null },
      heldBallEvents: [],
    };
    const result = togglePossession(state);
    expect(result.arrow).toBe("home");
  });

  // 3. null arrow 가드 — state 그대로 반환
  it("arrow=null → state 그대로 (Opening Jump Ball 미박제 가드)", () => {
    const result = togglePossession(EMPTY_POSSESSION);
    expect(result.arrow).toBe(null);
    expect(result.openingJumpBall).toBe(null);
    expect(result.heldBallEvents).toEqual([]);
  });

  // 4. immutability — 원본 state 변경 0
  it("원본 state 불변 (immutability)", () => {
    const state: PossessionState = {
      arrow: "home",
      openingJumpBall: null,
      heldBallEvents: [],
    };
    togglePossession(state);
    expect(state.arrow).toBe("home"); // 원본 보존
  });
});

describe("applyOpeningJumpBall", () => {
  // 5. home winner → arrow = away (loser 방향)
  it("home winner → arrow=away (loser 방향)", () => {
    const result = applyOpeningJumpBall(EMPTY_POSSESSION, "home", "player-1");
    expect(result.arrow).toBe("away");
    expect(result.openingJumpBall).toEqual({
      winner: "home",
      winnerPlayerId: "player-1",
    });
  });

  // 6. away winner → arrow = home (loser 방향)
  it("away winner → arrow=home (loser 방향)", () => {
    const result = applyOpeningJumpBall(EMPTY_POSSESSION, "away", "player-2");
    expect(result.arrow).toBe("home");
    expect(result.openingJumpBall).toEqual({
      winner: "away",
      winnerPlayerId: "player-2",
    });
  });

  // 7. 재호출 시 마지막 박제값 보존 (재정정 시나리오)
  it("두번 호출 시 마지막 박제값 보존", () => {
    const first = applyOpeningJumpBall(EMPTY_POSSESSION, "home", "player-1");
    const second = applyOpeningJumpBall(first, "away", "player-2");
    expect(second.openingJumpBall).toEqual({
      winner: "away",
      winnerPlayerId: "player-2",
    });
    expect(second.arrow).toBe("home"); // away winner → home arrow
  });
});

describe("applyHeldBall", () => {
  // 8. arrow 토글 (home → away)
  it("arrow=home 시 → takingTeam=home + arrow 토글 (away)", () => {
    const state: PossessionState = {
      arrow: "home",
      openingJumpBall: { winner: "away", winnerPlayerId: null },
      heldBallEvents: [],
    };
    const result = applyHeldBall(state, 2);
    expect(result.arrow).toBe("away"); // 토글 완료
    expect(result.heldBallEvents).toHaveLength(1);
    expect(result.heldBallEvents[0]).toEqual({
      period: 2,
      takingTeam: "home", // 현 arrow 값 = 점유 팀
    });
  });

  // 9. event push (배열 누적)
  it("연속 호출 시 heldBallEvents 누적", () => {
    const initial: PossessionState = {
      arrow: "home",
      openingJumpBall: { winner: "away", winnerPlayerId: null },
      heldBallEvents: [],
    };
    const after1 = applyHeldBall(initial, 1);
    const after2 = applyHeldBall(after1, 3);
    expect(after2.heldBallEvents).toHaveLength(2);
    expect(after2.heldBallEvents[0]).toEqual({ period: 1, takingTeam: "home" });
    expect(after2.heldBallEvents[1]).toEqual({ period: 3, takingTeam: "away" });
    expect(after2.arrow).toBe("home"); // 두번 토글 → 원복
  });

  // 10. null arrow 가드 — state 그대로 반환
  it("arrow=null → state 그대로 (Opening Jump Ball 미박제 가드)", () => {
    const result = applyHeldBall(EMPTY_POSSESSION, 1);
    expect(result.arrow).toBe(null);
    expect(result.heldBallEvents).toEqual([]);
  });
});

describe("possessionToPBPInputs", () => {
  // 11. empty state → 0건
  it("EMPTY_POSSESSION → 빈 배열", () => {
    const result = possessionToPBPInputs(EMPTY_POSSESSION, "match-1");
    expect(result).toEqual([]);
  });

  // 12. Opening only → 1건 (jump_ball)
  it("openingJumpBall 만 박제 → jump_ball 1건", () => {
    const state = applyOpeningJumpBall(EMPTY_POSSESSION, "home", "player-1");
    const result = possessionToPBPInputs(state, "match-1");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      actionType: "jump_ball",
      period: 1,
      team: "home", // winner
    });
  });

  // 13. Opening + Held 2건 → 3건 (jump_ball 1 + held_ball 2)
  it("opening + held 2건 → PBP 3건 (순서 보존)", () => {
    let state = applyOpeningJumpBall(EMPTY_POSSESSION, "home", "p1"); // arrow = away
    state = applyHeldBall(state, 2); // takingTeam = away, arrow → home
    state = applyHeldBall(state, 3); // takingTeam = home, arrow → away
    const result = possessionToPBPInputs(state, "match-1");
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ actionType: "jump_ball", period: 1, team: "home" });
    expect(result[1]).toEqual({ actionType: "held_ball", period: 2, team: "away" });
    expect(result[2]).toEqual({ actionType: "held_ball", period: 3, team: "home" });
  });

  // 14. period 정합 — held_ball 의 period 가 event.period 와 일치
  it("held_ball period 정합 (event.period 그대로)", () => {
    let state = applyOpeningJumpBall(EMPTY_POSSESSION, "away", null); // arrow = home
    state = applyHeldBall(state, 4); // period 4 (Q4)
    state = applyHeldBall(state, 5); // period 5 (OT1)
    const result = possessionToPBPInputs(state, "match-1");
    const heldOnly = result.filter((r) => r.actionType === "held_ball");
    expect(heldOnly.map((r) => r.period)).toEqual([4, 5]);
  });

  // 15. actionType 정합 — jump_ball / held_ball 만 출력
  it("actionType = jump_ball | held_ball 만 출력", () => {
    let state = applyOpeningJumpBall(EMPTY_POSSESSION, "home", "p1");
    state = applyHeldBall(state, 1);
    state = applyHeldBall(state, 2);
    const result = possessionToPBPInputs(state, "match-1");
    const types = result.map((r) => r.actionType);
    expect(types).toEqual(["jump_ball", "held_ball", "held_ball"]);
    // 외 actionType 0건
    types.forEach((t) => {
      expect(["jump_ball", "held_ball"]).toContain(t);
    });
  });
});
