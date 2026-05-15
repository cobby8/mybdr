/**
 * 2026-05-15 — divisions.ts YOUTH_AGES + buildYouthDivisionCodes 검증.
 * 사용자 결재 Q1(b U7~U18 12종) + Q4(b cross-product) 박제 룰.
 */
import { describe, it, expect } from "vitest";
import { YOUTH_AGES, buildYouthDivisionCodes } from "@/lib/constants/divisions";

describe("YOUTH_AGES 상수", () => {
  it("U7~U18 12종 정확", () => {
    expect(YOUTH_AGES.length).toBe(12);
    expect(YOUTH_AGES[0]).toBe("U7");
    expect(YOUTH_AGES[11]).toBe("U18");
  });

  it("순서 보장 (UI 표시용)", () => {
    expect([...YOUTH_AGES]).toEqual([
      "U7", "U8", "U9", "U10", "U11", "U12",
      "U13", "U14", "U15", "U16", "U17", "U18",
    ]);
  });
});

describe("buildYouthDivisionCodes — Q4(b) cross-product", () => {
  it("연령 미선택 = 디비전 그대로 (회귀 0)", () => {
    expect(buildYouthDivisionCodes(["i2"], [])).toEqual(["i2"]);
    expect(buildYouthDivisionCodes(["i2", "i3"], [])).toEqual(["i2", "i3"]);
  });

  it("단일 디비전 × 다중 연령", () => {
    expect(buildYouthDivisionCodes(["i2"], ["U11", "U12"])).toEqual([
      "i2-U11",
      "i2-U12",
    ]);
  });

  it("다중 디비전 × 다중 연령 = N×M cross-product", () => {
    expect(buildYouthDivisionCodes(["i2", "i3"], ["U11", "U12"])).toEqual([
      "i2-U11",
      "i2-U12",
      "i3-U11",
      "i3-U12",
    ]);
  });

  it("운영 강남구협회장배 실측 패턴 호환 (i3-U9 / i2-U11 등)", () => {
    // 운영 DB 의 TournamentDivisionRule.code 형식과 일치
    expect(buildYouthDivisionCodes(["i3"], ["U9"])).toEqual(["i3-U9"]);
    expect(buildYouthDivisionCodes(["i2"], ["U11"])).toEqual(["i2-U11"]);
  });

  it("빈 디비전 = 빈 결과 (방어)", () => {
    expect(buildYouthDivisionCodes([], ["U11"])).toEqual([]);
    expect(buildYouthDivisionCodes([], [])).toEqual([]);
  });

  it("순서: 디비전 우선 (외부 loop) → 연령 (내부 loop)", () => {
    // UI 사용자 멘탈 모델 = "i2 종별의 U10/U11/U12" 묶음으로 표시
    const result = buildYouthDivisionCodes(["i2", "i3"], ["U10", "U11", "U12"]);
    // i2 의 3개 → i3 의 3개 = 6개
    expect(result).toHaveLength(6);
    expect(result.slice(0, 3)).toEqual(["i2-U10", "i2-U11", "i2-U12"]);
    expect(result.slice(3, 6)).toEqual(["i3-U10", "i3-U11", "i3-U12"]);
  });
});
