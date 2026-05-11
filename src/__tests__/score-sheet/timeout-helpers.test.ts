/**
 * Time-outs 헬퍼 단위 테스트 — Phase 4 (2026-05-12).
 *
 * 검증 대상 (FIBA Article 18-19):
 *   - getGamePhase: period → "first_half" | "second_half" | "overtime"
 *   - getUsedTimeouts / getRemainingTimeouts: phase 별 카운트 (OT 는 별도)
 *   - canAddTimeout: 추가 가능 여부 + 사유 메시지 분기
 *   - addTimeout: Article 18-19 차단 (전반2/후반3/OT1)
 *   - removeLastTimeout: 마지막 1건 제거 (pop 패턴)
 *
 * 룰 매트릭스:
 *   - 전반 (period 1+2): 팀당 2개
 *   - 후반 (period 3+4): 팀당 3개
 *   - 연장 (period 5/6/7 각각): 팀당 1개
 */

import { describe, it, expect } from "vitest";
import {
  getGamePhase,
  getUsedTimeouts,
  getRemainingTimeouts,
  canAddTimeout,
  addTimeout,
  removeLastTimeout,
} from "@/lib/score-sheet/timeout-helpers";
import {
  type TimeoutMark,
  type TimeoutsState,
  EMPTY_TIMEOUTS,
} from "@/lib/score-sheet/timeout-types";

// 헬퍼 — TimeoutMark 빌더
function t(period: number): TimeoutMark {
  return { period };
}

describe("getGamePhase", () => {
  it("period 1, 2 → first_half", () => {
    expect(getGamePhase(1)).toBe("first_half");
    expect(getGamePhase(2)).toBe("first_half");
  });

  it("period 3, 4 → second_half", () => {
    expect(getGamePhase(3)).toBe("second_half");
    expect(getGamePhase(4)).toBe("second_half");
  });

  it("period 5, 6, 7 → overtime", () => {
    expect(getGamePhase(5)).toBe("overtime");
    expect(getGamePhase(6)).toBe("overtime");
    expect(getGamePhase(7)).toBe("overtime");
  });
});

describe("getUsedTimeouts", () => {
  it("first_half = Q1+Q2 합산", () => {
    const timeouts = [t(1), t(2), t(3)]; // Q1, Q2, Q3
    expect(getUsedTimeouts(timeouts, "first_half")).toBe(2);
  });

  it("second_half = Q3+Q4 합산", () => {
    const timeouts = [t(2), t(3), t(4), t(4)]; // Q2, Q3, Q4, Q4
    expect(getUsedTimeouts(timeouts, "second_half")).toBe(3);
  });

  it("overtime + overtimePeriod 지정 = 해당 OT 만 카운트", () => {
    const timeouts = [t(5), t(5), t(6)]; // OT1 2건, OT2 1건
    expect(getUsedTimeouts(timeouts, "overtime", 5)).toBe(2);
    expect(getUsedTimeouts(timeouts, "overtime", 6)).toBe(1);
    expect(getUsedTimeouts(timeouts, "overtime", 7)).toBe(0);
  });

  it("overtime + overtimePeriod 미지정 = 모든 OT 합산 (호환성)", () => {
    const timeouts = [t(5), t(6), t(7)];
    expect(getUsedTimeouts(timeouts, "overtime")).toBe(3);
  });
});

describe("getRemainingTimeouts", () => {
  it("first_half 잔여 = 2 - used", () => {
    expect(getRemainingTimeouts([], "first_half")).toBe(2);
    expect(getRemainingTimeouts([t(1)], "first_half")).toBe(1);
    expect(getRemainingTimeouts([t(1), t(2)], "first_half")).toBe(0);
  });

  it("second_half 잔여 = 3 - used", () => {
    expect(getRemainingTimeouts([], "second_half")).toBe(3);
    expect(getRemainingTimeouts([t(3), t(4)], "second_half")).toBe(1);
    expect(getRemainingTimeouts([t(3), t(3), t(4)], "second_half")).toBe(0);
  });

  it("overtime 잔여 = 1 - used (각 OT 별도)", () => {
    expect(getRemainingTimeouts([], "overtime", 5)).toBe(1);
    expect(getRemainingTimeouts([t(5)], "overtime", 5)).toBe(0);
    // OT1 사용했어도 OT2 는 별도 1개
    expect(getRemainingTimeouts([t(5)], "overtime", 6)).toBe(1);
  });

  it("음수 방지 — used > max 면 0", () => {
    // 비정상 케이스 (방어): 전반 3건 있어도 잔여 0
    expect(getRemainingTimeouts([t(1), t(2), t(1)], "first_half")).toBe(0);
  });
});

describe("canAddTimeout", () => {
  it("전반 — 잔여 있을 때 허용 + 사용/총합 표시", () => {
    const result = canAddTimeout([], 1);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("전반 타임아웃 1/2");
  });

  it("전반 — 2개 모두 사용 시 차단", () => {
    const result = canAddTimeout([t(1), t(2)], 2);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("전반 타임아웃 모두 사용");
  });

  it("후반 — 잔여 있을 때 허용", () => {
    const result = canAddTimeout([t(3)], 3);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("후반 타임아웃 2/3");
  });

  it("후반 — 3개 모두 사용 시 차단", () => {
    const result = canAddTimeout([t(3), t(3), t(4)], 4);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("후반 타임아웃 모두 사용");
  });

  it("OT — 각 OT 별도 1개 허용", () => {
    // OT1 1개 사용 → OT2 진입 시 OT2 는 잔여 1
    const result = canAddTimeout([t(5)], 6);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("OT2 타임아웃 1/1");
  });

  it("OT — 같은 OT 에서 2번째 차단", () => {
    const result = canAddTimeout([t(5)], 5);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("OT1 타임아웃 모두 사용 — 추가 불가");
  });

  it("Q1 → Q2 이동 시 전반 합산 유지 — Q1 에서 2개 다 썼으면 Q2 차단", () => {
    // 전반 룰: Q1 + Q2 합산 2개. Q1 에서 2개 다 사용했으면 Q2 차단.
    const result = canAddTimeout([t(1), t(1)], 2);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("전반 타임아웃 모두 사용");
  });

  it("Q2 → Q3 이동 시 phase 전환 — Q2 에서 2개 다 썼어도 Q3 는 3개 별도", () => {
    // 후반 룰: Q3 + Q4 합산 3개. 전반 사용량은 영향 없음.
    const result = canAddTimeout([t(1), t(2)], 3);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("후반 타임아웃 1/3");
  });
});

describe("addTimeout", () => {
  it("정상 추가 — home", () => {
    const result = addTimeout(EMPTY_TIMEOUTS, "home", t(1));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.home.length).toBe(1);
      expect(result.state.home[0]).toEqual({ period: 1 });
      expect(result.state.away.length).toBe(0);
    }
  });

  it("정상 추가 — away", () => {
    const result = addTimeout(EMPTY_TIMEOUTS, "away", t(3));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.home.length).toBe(0);
      expect(result.state.away.length).toBe(1);
      expect(result.state.away[0]).toEqual({ period: 3 });
    }
  });

  it("전반 차단 — 3번째 추가 시도", () => {
    const state: TimeoutsState = { home: [t(1), t(2)], away: [] };
    const result = addTimeout(state, "home", t(2));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("전반");
    }
  });

  it("후반 차단 — 4번째 추가 시도", () => {
    const state: TimeoutsState = {
      home: [t(3), t(3), t(4)],
      away: [],
    };
    const result = addTimeout(state, "home", t(4));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("후반");
    }
  });

  it("OT 차단 — 같은 OT 2번째 추가 시도", () => {
    const state: TimeoutsState = { home: [t(5)], away: [] };
    const result = addTimeout(state, "home", t(5));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("OT1");
    }
  });

  it("OT 분리 — OT1 사용 후 OT2 는 별도 1개 허용", () => {
    const state: TimeoutsState = { home: [t(5)], away: [] };
    const result = addTimeout(state, "home", t(6));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.home.length).toBe(2);
    }
  });

  it("team 양면 독립 — home 다 써도 away 영향 0", () => {
    const state: TimeoutsState = { home: [t(1), t(2)], away: [] };
    // away 는 빈 상태 → 전반 추가 OK
    const result = addTimeout(state, "away", t(1));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.away.length).toBe(1);
    }
  });
});

describe("removeLastTimeout", () => {
  it("home 마지막 1건 제거", () => {
    const state: TimeoutsState = { home: [t(1), t(2)], away: [t(3)] };
    const next = removeLastTimeout(state, "home");
    expect(next.home.length).toBe(1);
    expect(next.home[0]).toEqual({ period: 1 });
    expect(next.away.length).toBe(1); // away 무변경
  });

  it("away 마지막 1건 제거", () => {
    const state: TimeoutsState = { home: [], away: [t(5), t(6)] };
    const next = removeLastTimeout(state, "away");
    expect(next.away.length).toBe(1);
    expect(next.away[0]).toEqual({ period: 5 });
  });

  it("빈 배열 — no-op (원본 state 반환)", () => {
    const next = removeLastTimeout(EMPTY_TIMEOUTS, "home");
    expect(next).toBe(EMPTY_TIMEOUTS);
  });
});

describe("회귀 시나리오 — 전체 경기 흐름", () => {
  it("전반 2개 + 후반 3개 + OT1 1개 = 정상 한 경기", () => {
    let state: TimeoutsState = EMPTY_TIMEOUTS;
    // 전반 — Q1, Q2 각 1개
    const r1 = addTimeout(state, "home", t(1));
    expect(r1.ok).toBe(true);
    if (r1.ok) state = r1.state;
    const r2 = addTimeout(state, "home", t(2));
    expect(r2.ok).toBe(true);
    if (r2.ok) state = r2.state;
    // 전반 3번째 차단
    const r3 = addTimeout(state, "home", t(2));
    expect(r3.ok).toBe(false);
    // 후반 — Q3 2개 + Q4 1개
    const r4 = addTimeout(state, "home", t(3));
    expect(r4.ok).toBe(true);
    if (r4.ok) state = r4.state;
    const r5 = addTimeout(state, "home", t(3));
    expect(r5.ok).toBe(true);
    if (r5.ok) state = r5.state;
    const r6 = addTimeout(state, "home", t(4));
    expect(r6.ok).toBe(true);
    if (r6.ok) state = r6.state;
    // 후반 4번째 차단
    const r7 = addTimeout(state, "home", t(4));
    expect(r7.ok).toBe(false);
    // OT1 1개
    const r8 = addTimeout(state, "home", t(5));
    expect(r8.ok).toBe(true);
    if (r8.ok) state = r8.state;
    // OT1 2번째 차단
    const r9 = addTimeout(state, "home", t(5));
    expect(r9.ok).toBe(false);
    // 최종 검증 — 전반 2 + 후반 3 + OT1 1 = 6건
    expect(state.home.length).toBe(6);
  });
});
