/**
 * Phase 17 (2026-05-13) — 쿼터별 색 매핑 헬퍼 회귀 가드.
 *
 * 검증 대상:
 *   - getPeriodColor: period 1~7 + 경계 케이스 (0, 음수)
 *   - getPeriodLabel: period 1~7 라벨 정합
 *   - getTimeoutPhaseColor: 전반/후반/OT 분기
 *   - PERIOD_LEGEND: 5건 고정 + 색·라벨 정합
 */

import { describe, it, expect } from "vitest";
import {
  getPeriodColor,
  getPeriodLabel,
  getTimeoutPhaseColor,
  PERIOD_LEGEND,
} from "@/lib/score-sheet/period-color";

describe("getPeriodColor", () => {
  it("Q1 = text-primary (기본 흑/백)", () => {
    expect(getPeriodColor(1)).toBe("var(--color-text-primary)");
  });

  it("Q2 = accent (BDR Red 강조)", () => {
    expect(getPeriodColor(2)).toBe("var(--color-accent)");
  });

  it("Q3 = success (초록)", () => {
    expect(getPeriodColor(3)).toBe("var(--color-success)");
  });

  it("Q4 = warning (오렌지)", () => {
    expect(getPeriodColor(4)).toBe("var(--color-warning)");
  });

  it("OT1 (period=5) = primary (BDR Red OT 통합)", () => {
    expect(getPeriodColor(5)).toBe("var(--color-primary)");
  });

  it("OT2 (period=6) = primary (모든 OT 통합 색)", () => {
    expect(getPeriodColor(6)).toBe("var(--color-primary)");
  });

  it("OT3 (period=7) = primary", () => {
    expect(getPeriodColor(7)).toBe("var(--color-primary)");
  });

  it("경계 — period=0 (이상치) = text-primary fallback (Q1 동일)", () => {
    // 운영 안전성: 음수/0 입력도 폭주 X — Q1 색 fallback
    expect(getPeriodColor(0)).toBe("var(--color-text-primary)");
  });
});

describe("getPeriodLabel", () => {
  it("Q1~Q4 라벨", () => {
    expect(getPeriodLabel(1)).toBe("Q1");
    expect(getPeriodLabel(2)).toBe("Q2");
    expect(getPeriodLabel(3)).toBe("Q3");
    expect(getPeriodLabel(4)).toBe("Q4");
  });

  it("OT1 (period=5) = 'OT1'", () => {
    expect(getPeriodLabel(5)).toBe("OT1");
  });

  it("OT2 (period=6) = 'OT2'", () => {
    expect(getPeriodLabel(6)).toBe("OT2");
  });

  it("OT3 (period=7) = 'OT3'", () => {
    expect(getPeriodLabel(7)).toBe("OT3");
  });
});

describe("getTimeoutPhaseColor", () => {
  it("전반 Q1 = text-primary", () => {
    expect(getTimeoutPhaseColor(1)).toBe("var(--color-text-primary)");
  });

  it("전반 Q2 = text-primary", () => {
    expect(getTimeoutPhaseColor(2)).toBe("var(--color-text-primary)");
  });

  it("후반 Q3 = success (Q3 색과 통일)", () => {
    expect(getTimeoutPhaseColor(3)).toBe("var(--color-success)");
  });

  it("후반 Q4 = success", () => {
    expect(getTimeoutPhaseColor(4)).toBe("var(--color-success)");
  });

  it("OT1 (period=5) = primary (OT 색과 통일)", () => {
    expect(getTimeoutPhaseColor(5)).toBe("var(--color-primary)");
  });

  it("OT2 (period=6) = primary", () => {
    expect(getTimeoutPhaseColor(6)).toBe("var(--color-primary)");
  });
});

describe("PERIOD_LEGEND", () => {
  it("5건 고정 (Q1·Q2·Q3·Q4·OT 통합)", () => {
    expect(PERIOD_LEGEND.length).toBe(5);
  });

  it("라벨 순서 정합 (Q1·Q2·Q3·Q4·OT)", () => {
    const labels = PERIOD_LEGEND.map((p) => p.label);
    expect(labels).toEqual(["Q1", "Q2", "Q3", "Q4", "OT"]);
  });

  it("Q1 색 = text-primary", () => {
    expect(PERIOD_LEGEND[0]).toEqual({
      label: "Q1",
      color: "var(--color-text-primary)",
    });
  });

  it("OT 색 = primary (getPeriodColor 5+ 와 정합)", () => {
    expect(PERIOD_LEGEND[4]).toEqual({
      label: "OT",
      color: "var(--color-primary)",
    });
    // 헬퍼 정합 — period 5+ = primary
    expect(getPeriodColor(5)).toBe(PERIOD_LEGEND[4].color);
  });

  it("Legend 색 vs getPeriodColor Q1~Q4 정합", () => {
    // Q1~Q4 = PERIOD_LEGEND[0..3] 와 getPeriodColor(1..4) 일치 검증
    expect(PERIOD_LEGEND[0].color).toBe(getPeriodColor(1));
    expect(PERIOD_LEGEND[1].color).toBe(getPeriodColor(2));
    expect(PERIOD_LEGEND[2].color).toBe(getPeriodColor(3));
    expect(PERIOD_LEGEND[3].color).toBe(getPeriodColor(4));
  });
});
