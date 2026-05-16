/**
 * Bench Technical + Delay of Game 헬퍼 단위 테스트 (2026-05-16 긴급 박제).
 *
 * 검증 대상 (FIBA Article 36):
 *   - addCoachFoul: 정상 추가 / 추방 도달 / 추방 후 차단 (4 케이스)
 *   - removeLastCoachFoul: 정상 제거 / 빈 배열 no-op (2 케이스)
 *   - canEjectCoach / coachFoulSummary / getCoachFoulCellState (4 케이스)
 *   - addDelayEvent: 1차 W / 2차+ T 자동 분기 (3 케이스)
 *   - removeLastDelayEvent: T pop / W 해제 / 빈 no-op (3 케이스)
 *   - delayToPBPEvents / benchTechToPBPEvents (2 케이스)
 *
 * 룰 매트릭스 (사용자 결재 권장안):
 *   - Head Coach 누적 3건 = 추방 (C / B_HEAD / B_BENCH 합산)
 *   - Delay 1차 = W (점수 변동 0) / 2차+ = T (자유투 1개)
 */

import { describe, it, expect } from "vitest";
import {
  addCoachFoul,
  removeLastCoachFoul,
  canEjectCoach,
  coachFoulSummary,
  getCoachFoulCellState,
  addDelayEvent,
  removeLastDelayEvent,
  benchTechToPBPEvents,
  delayToPBPEvents,
} from "@/lib/score-sheet/bench-tech-helpers";
import {
  EMPTY_BENCH_TECHNICAL,
  EMPTY_DELAY_OF_GAME,
} from "@/lib/score-sheet/bench-tech-types";

describe("addCoachFoul", () => {
  it("정상 추가 — head 배열에 push", () => {
    const result = addCoachFoul(EMPTY_BENCH_TECHNICAL, "home", {
      kind: "C",
      period: 1,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.home.head.length).toBe(1);
      expect(result.state.home.head[0].kind).toBe("C");
      expect(result.ejected).toBe(false);
    }
  });

  it("추방 도달 — 3건째 추가 후 ejected=true", () => {
    let state = EMPTY_BENCH_TECHNICAL;
    for (let i = 0; i < 2; i += 1) {
      const r = addCoachFoul(state, "home", { kind: "B_BENCH", period: 1 });
      if (r.ok) state = r.state;
    }
    // 3건째 = 추방 트리거
    const result = addCoachFoul(state, "home", { kind: "C", period: 2 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.home.head.length).toBe(3);
      expect(result.ejected).toBe(true);
    }
  });

  it("추방 후 차단 — 4건째 추가 = ok:false", () => {
    let state = EMPTY_BENCH_TECHNICAL;
    for (let i = 0; i < 3; i += 1) {
      const r = addCoachFoul(state, "home", { kind: "B_BENCH", period: 1 });
      if (r.ok) state = r.state;
    }
    // 4건째 = 차단
    const result = addCoachFoul(state, "home", { kind: "C", period: 2 });
    expect(result.ok).toBe(false);
  });

  it("팀 분리 — home 추가가 away 영향 0", () => {
    const result = addCoachFoul(EMPTY_BENCH_TECHNICAL, "home", {
      kind: "C",
      period: 1,
    });
    if (result.ok) {
      expect(result.state.home.head.length).toBe(1);
      expect(result.state.away.head.length).toBe(0);
    }
  });
});

describe("removeLastCoachFoul", () => {
  it("정상 제거 — 마지막 1건 pop", () => {
    let state = EMPTY_BENCH_TECHNICAL;
    for (let i = 0; i < 2; i += 1) {
      const r = addCoachFoul(state, "home", { kind: "B_BENCH", period: 1 });
      if (r.ok) state = r.state;
    }
    const next = removeLastCoachFoul(state, "home");
    expect(next.home.head.length).toBe(1);
  });

  it("빈 배열 = no-op (동일 ref)", () => {
    const next = removeLastCoachFoul(EMPTY_BENCH_TECHNICAL, "home");
    expect(next).toBe(EMPTY_BENCH_TECHNICAL);
  });
});

describe("canEjectCoach / coachFoulSummary", () => {
  it("0건 = ejected false", () => {
    expect(canEjectCoach(EMPTY_BENCH_TECHNICAL.home)).toBe(false);
  });

  it("3건 = ejected true", () => {
    let state = EMPTY_BENCH_TECHNICAL;
    for (let i = 0; i < 3; i += 1) {
      const r = addCoachFoul(state, "home", { kind: "C", period: 1 });
      if (r.ok) state = r.state;
    }
    expect(canEjectCoach(state.home)).toBe(true);
  });

  it("coachFoulSummary — kind 별 카운트", () => {
    let state = EMPTY_BENCH_TECHNICAL;
    const adds: Array<"C" | "B_HEAD" | "B_BENCH"> = ["C", "C", "B_BENCH"];
    for (const k of adds) {
      const r = addCoachFoul(state, "home", { kind: k, period: 1 });
      if (r.ok) state = r.state;
    }
    const sum = coachFoulSummary(state.home);
    expect(sum.c).toBe(2);
    expect(sum.bHead).toBe(0);
    expect(sum.bBench).toBe(1);
    expect(sum.total).toBe(3);
  });

  it("getCoachFoulCellState — cell idx 분기", () => {
    let state = EMPTY_BENCH_TECHNICAL;
    const r = addCoachFoul(state, "home", { kind: "C", period: 1 });
    if (r.ok) state = r.state;
    // cell 0 = filled (C)
    const c0 = getCoachFoulCellState(state.home, 0);
    expect(c0.filled).toBe(true);
    expect(c0.kind).toBe("C");
    expect(c0.isLastFilled).toBe(true);
    // cell 1 = next empty
    const c1 = getCoachFoulCellState(state.home, 1);
    expect(c1.filled).toBe(false);
    expect(c1.isNextEmpty).toBe(true);
    // cell 2 = empty (not next)
    const c2 = getCoachFoulCellState(state.home, 2);
    expect(c2.filled).toBe(false);
    expect(c2.isNextEmpty).toBe(false);
  });
});

describe("addDelayEvent", () => {
  it("1차 = W 자동 박제 (warned false → true)", () => {
    const r = addDelayEvent(EMPTY_DELAY_OF_GAME, "home");
    expect(r.kind).toBe("W");
    expect(r.state.home.warned).toBe(true);
    expect(r.state.home.technicals).toBe(0);
  });

  it("2차 = T 자동 박제 (technicals + 1)", () => {
    let state = EMPTY_DELAY_OF_GAME;
    const r1 = addDelayEvent(state, "home");
    state = r1.state;
    const r2 = addDelayEvent(state, "home");
    expect(r2.kind).toBe("T");
    expect(r2.state.home.technicals).toBe(1);
  });

  it("3차+ = T 누적 (무제한)", () => {
    let state = EMPTY_DELAY_OF_GAME;
    addDelayEvent(state, "home"); // ignored — state 갱신 X
    state = addDelayEvent(state, "home").state; // W
    state = addDelayEvent(state, "home").state; // T1
    state = addDelayEvent(state, "home").state; // T2
    expect(state.home.technicals).toBe(2);
  });
});

describe("removeLastDelayEvent", () => {
  it("T 박제 후 pop = technicals - 1", () => {
    let state = EMPTY_DELAY_OF_GAME;
    state = addDelayEvent(state, "home").state; // W
    state = addDelayEvent(state, "home").state; // T1
    const next = removeLastDelayEvent(state, "home");
    expect(next.home.warned).toBe(true);
    expect(next.home.technicals).toBe(0);
  });

  it("W만 박제 + T 0 시 = warned false 로 해제", () => {
    let state = EMPTY_DELAY_OF_GAME;
    state = addDelayEvent(state, "home").state; // W
    const next = removeLastDelayEvent(state, "home");
    expect(next.home.warned).toBe(false);
    expect(next.home.technicals).toBe(0);
  });

  it("빈 = no-op (동일 ref)", () => {
    const next = removeLastDelayEvent(EMPTY_DELAY_OF_GAME, "home");
    expect(next).toBe(EMPTY_DELAY_OF_GAME);
  });
});

describe("benchTechToPBPEvents / delayToPBPEvents", () => {
  it("benchTechToPBPEvents — home/away 합산 + kind 보존", () => {
    let state = EMPTY_BENCH_TECHNICAL;
    state = addCoachFoul(state, "home", { kind: "C", period: 1 }).ok
      ? (addCoachFoul(state, "home", { kind: "C", period: 1 }) as { ok: true; state: typeof state }).state
      : state;
    state = (addCoachFoul(state, "away", { kind: "B_BENCH", period: 2 }) as { ok: true; state: typeof state }).state;
    const events = benchTechToPBPEvents(state);
    expect(events.length).toBe(2);
    expect(events[0].team).toBe("home");
    expect(events[0].kind).toBe("C");
    expect(events[1].team).toBe("away");
    expect(events[1].kind).toBe("B_BENCH");
  });

  it("delayToPBPEvents — W 1건 + T N건 시계열 박제", () => {
    let state = EMPTY_DELAY_OF_GAME;
    state = addDelayEvent(state, "home").state; // W
    state = addDelayEvent(state, "home").state; // T1
    state = addDelayEvent(state, "away").state; // away W
    const events = delayToPBPEvents(state);
    expect(events.length).toBe(3);
    // home W + T1 / away W
    expect(events[0]).toEqual({ team: "home", kind: "W" });
    expect(events[1]).toEqual({ team: "home", kind: "T" });
    expect(events[2]).toEqual({ team: "away", kind: "W" });
  });
});
