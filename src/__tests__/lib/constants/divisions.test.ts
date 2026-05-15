/**
 * 2026-05-15 — divisions.ts YOUTH_AGES + buildYouthDivisionCodes 검증.
 * 사용자 결재 Q1(b U7~U18 12종) + Q4(b cross-product) 박제 룰.
 *
 * 2026-05-15 Phase 3.5 — parseDivisionCode + getDivisionInfo fallback 12 케이스 추가
 * 사용자 결재 Q1=A / Q2=A / Q3=A / Q4=A / Q5=A 박제 룰.
 */
import { describe, it, expect } from "vitest";
import {
  YOUTH_AGES,
  buildYouthDivisionCodes,
  parseDivisionCode,
  getDivisionInfo,
} from "@/lib/constants/divisions";

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

// ─── Phase 3.5 (2026-05-15) — parseDivisionCode 헬퍼 ─────────────────────
// 사유: commit `8d92c9d` 으로 생성된 결합 코드 ("i2-U11") 의 후속 안전 박제 검증.
//   Q2=A 결재 → 4 필드 시그니처 (baseCode + age + gender + isCombined)
//   Q5=A 결재 → YOUTH_AGES strict 화이트리스트 ("U99" = null)
describe("parseDivisionCode — Phase 3.5 결합 코드 파싱", () => {
  it("[Case 1] i2-U11 = 남성 + U11 + isCombined=true", () => {
    // 운영 강남구협회장배 실측 패턴
    expect(parseDivisionCode("i2-U11")).toEqual({
      baseCode: "i2",
      age: "U11",
      gender: "male",
      isCombined: true,
    });
  });

  it("[Case 2] i2W-U11 = 여성 + U11 + isCombined=true (W 접미사 인식)", () => {
    expect(parseDivisionCode("i2W-U11")).toEqual({
      baseCode: "i2W",
      age: "U11",
      gender: "female",
      isCombined: true,
    });
  });

  it("[Case 3] D3 단독 = 남성 + age=null + isCombined=false (회귀 0)", () => {
    expect(parseDivisionCode("D3")).toEqual({
      baseCode: "D3",
      age: null,
      gender: "male",
      isCombined: false,
    });
  });

  it("[Case 4] 하모니W 단독 = 여성 + age=null + isCombined=false (한글 + W)", () => {
    expect(parseDivisionCode("하모니W")).toEqual({
      baseCode: "하모니W",
      age: null,
      gender: "female",
      isCombined: false,
    });
  });

  it("[Case 5] i2-U99 = null (U99 는 YOUTH_AGES 미존재 — strict 화이트리스트)", () => {
    expect(parseDivisionCode("i2-U99")).toBeNull();
  });

  it("[Case 6] null 입력 = null (방어)", () => {
    expect(parseDivisionCode(null)).toBeNull();
  });

  it("[Case 7] 빈 문자열 = null (방어)", () => {
    expect(parseDivisionCode("")).toBeNull();
  });

  it("[Case 8] invalid-code = null (ALL_DIVISIONS_MAP 미존재)", () => {
    expect(parseDivisionCode("invalid-code")).toBeNull();
  });
});

// ─── Phase 3.5 (2026-05-15) — getDivisionInfo fallback ─────────────────
// 사유: Q3=A 결재 → 결합 코드 입력 시 base code 로 fallback lookup.
//   기존 호출자 (직접 lookup 경로) 회귀 0 검증 필수.
describe("getDivisionInfo — Phase 3.5 fallback 확장", () => {
  it("[Case 9] i2 = 기존 동작 (직접 lookup 회귀 0)", () => {
    const info = getDivisionInfo("i2");
    expect(info).not.toBeNull();
    expect(info?.label).toBe("i2");
    expect(info?.category).toBe("youth");
    expect(info?.gender).toBe("male");
  });

  it("[Case 10] i2-U11 = i2 base info 반환 (fallback — label 은 base 그대로)", () => {
    // Q1=A 결재: 라벨은 운영자 입력 rule.label 우선이지만,
    //   getDivisionInfo 는 base 정보만 반환 (라벨 자동 생성 ❌)
    const info = getDivisionInfo("i2-U11");
    expect(info).not.toBeNull();
    expect(info?.label).toBe("i2"); // base 라벨 그대로 (자동 생성 ❌)
    expect(info?.category).toBe("youth");
    expect(info?.gender).toBe("male");
  });

  it("[Case 11] D3 = 기존 동작 (회귀 0 — 일반부 직접 lookup)", () => {
    const info = getDivisionInfo("D3");
    expect(info).not.toBeNull();
    expect(info?.label).toBe("D3");
    expect(info?.leagueName).toBe("동호회 최강전");
    expect(info?.category).toBe("general");
    expect(info?.gender).toBe("male");
  });

  it("[Case 12] xxx = null (잘못된 코드 — fallback 모두 실패)", () => {
    expect(getDivisionInfo("xxx")).toBeNull();
  });
});
