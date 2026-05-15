/**
 * 2026-05-15 — schedule-timeline.tsx 종별 색상 매핑 검증 (PR-G3).
 * 강남구협회장배 6 종별 × 2 체육관 분리 UI 박제 룰.
 */
import { describe, it, expect } from "vitest";
import { getDivisionColorVar } from "@/app/(web)/tournaments/[id]/_components/schedule-timeline";

describe("getDivisionColorVar — 종별 색상 결정성 (PR-G3)", () => {
  it("null / 빈 문자열 → null (회귀 0 — 단일 종별 대회)", () => {
    expect(getDivisionColorVar(null)).toBeNull();
    expect(getDivisionColorVar(undefined)).toBeNull();
    expect(getDivisionColorVar("")).toBeNull();
  });

  it("동일 종별 코드 = 동일 색상 (결정적 매핑)", () => {
    const a = getDivisionColorVar("i2-U11");
    const b = getDivisionColorVar("i2-U11");
    expect(a).toBe(b);
    expect(a).not.toBeNull();
  });

  it("CSS 변수 토큰 사용 (하드코딩 hex 0 / CLAUDE.md 13 룰 준수)", () => {
    const color = getDivisionColorVar("i3-U9");
    expect(color).toMatch(/^var\(--color-/);
  });

  it("운영 강남구협회장배 6 종별 모두 매핑 가능 (null 0)", () => {
    const codes = ["i2-U11", "i2-U12", "i3-U11", "i3-U14", "i3-U9", "i3w-U12"];
    for (const code of codes) {
      const color = getDivisionColorVar(code);
      expect(color).not.toBeNull();
      expect(color).toMatch(/^var\(--color-/);
    }
  });

  it("최소 2종 이상 다른 색상 분포 (시각 분리 보장)", () => {
    const codes = ["i2-U11", "i2-U12", "i3-U11", "i3-U14", "i3-U9", "i3w-U12"];
    const colors = new Set(codes.map((c) => getDivisionColorVar(c)));
    // 6 종별이 모두 동일 색은 절대 안 됨 (해시 함수 분산성)
    expect(colors.size).toBeGreaterThanOrEqual(2);
  });
});
