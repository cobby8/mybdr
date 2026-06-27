import { describe, it, expect } from "vitest";
import {
  parseAgeCode,
  ageCodeToRange,
  computeAgeRangeForDivision,
} from "@/lib/tournaments/age-mapping";

describe("parseAgeCode", () => {
  it("유소년 U{N}", () => {
    expect(parseAgeCode("U12")).toEqual({ kind: "youth", n: 12 });
    expect(parseAgeCode("U8")).toEqual({ kind: "youth", n: 8 });
    expect(parseAgeCode("u9")).toEqual({ kind: "youth", n: 9 }); // 대소문자 허용
  });
  it("시니어 +{N}", () => {
    expect(parseAgeCode("+40")).toEqual({ kind: "senior", n: 40 });
    expect(parseAgeCode("+70")).toEqual({ kind: "senior", n: 70 });
  });
  it("연령 아님 → null", () => {
    expect(parseAgeCode("D5")).toBeNull();
    expect(parseAgeCode("i3")).toBeNull();
    expect(parseAgeCode("하모니")).toBeNull();
    expect(parseAgeCode("S1")).toBeNull();
  });
});

describe("ageCodeToRange (대회연도 2026)", () => {
  const Y = 2026;
  it("U{N} = N세 이하: birthYearMin=연도-N, max=null, gradeMax=N-6", () => {
    expect(ageCodeToRange("U12", Y)).toEqual({ birthYearMin: 2014, birthYearMax: null, gradeMin: null, gradeMax: 6 });
    expect(ageCodeToRange("U9", Y)).toEqual({ birthYearMin: 2017, birthYearMax: null, gradeMin: null, gradeMax: 3 });
    expect(ageCodeToRange("U14", Y)).toEqual({ birthYearMin: 2012, birthYearMax: null, gradeMin: null, gradeMax: 8 });
    expect(ageCodeToRange("U18", Y)).toEqual({ birthYearMin: 2008, birthYearMax: null, gradeMin: null, gradeMax: 12 });
  });
  it("학년 0/음수는 null (미취학)", () => {
    expect(ageCodeToRange("U8", Y)).toEqual({ birthYearMin: 2018, birthYearMax: null, gradeMin: null, gradeMax: 2 });
    expect(ageCodeToRange("U7", Y)?.gradeMax).toBe(1);
    expect(ageCodeToRange("U6", Y)?.gradeMax).toBeNull(); // 6-6=0 → null
  });
  it("+{N} = N세 이상: birthYearMax=연도-N, min=null, 학년 없음", () => {
    expect(ageCodeToRange("+40", Y)).toEqual({ birthYearMin: null, birthYearMax: 1986, gradeMin: null, gradeMax: null });
    expect(ageCodeToRange("+60", Y)).toEqual({ birthYearMin: null, birthYearMax: 1966, gradeMin: null, gradeMax: null });
  });
  it("연령 아님 → null", () => {
    expect(ageCodeToRange("D5", Y)).toBeNull();
    expect(ageCodeToRange("i3", Y)).toBeNull();
  });
});

describe("computeAgeRangeForDivision", () => {
  const YOUTH = ["U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18"];
  const SENIOR = ["+40", "+45", "+50", "+55", "+60", "+65", "+70"];
  const Y = 2026;

  it("유청소년 디비전 — 공백/하이픈 토큰 매칭", () => {
    expect(computeAgeRangeForDivision("i3 U12", YOUTH, Y)).toEqual(ageCodeToRange("U12", Y));
    expect(computeAgeRangeForDivision("i3-U9", YOUTH, Y)).toEqual(ageCodeToRange("U9", Y));
    expect(computeAgeRangeForDivision("하모니 U10", YOUTH, Y)).toEqual(ageCodeToRange("U10", Y));
    expect(computeAgeRangeForDivision("i3w U12", YOUTH, Y)).toEqual(ageCodeToRange("U12", Y)); // 여성 접미
  });
  it("부분일치 오류 차단 — 'U1' 이 'U11' 에 매칭되지 않음", () => {
    // ages 에 U1 이 없고 U11 만 있으면 U11 로 매칭
    expect(computeAgeRangeForDivision("i3 U11", YOUTH, Y)).toEqual(ageCodeToRange("U11", Y));
  });
  it("대학부 디비전 U1~U3 — ages 비어있어 연령 미적용", () => {
    expect(computeAgeRangeForDivision("U1", [], Y)).toBeNull();
    expect(computeAgeRangeForDivision("U2", [], Y)).toBeNull();
    expect(computeAgeRangeForDivision("U3", [], Y)).toBeNull();
  });
  it("일반부 디비전 — 연령부 없음 → null", () => {
    expect(computeAgeRangeForDivision("D5", [], Y)).toBeNull();
    expect(computeAgeRangeForDivision("D8", [], Y)).toBeNull();
  });
  it("시니어 디비전", () => {
    expect(computeAgeRangeForDivision("S1 +40", SENIOR, Y)).toEqual(ageCodeToRange("+40", Y));
    expect(computeAgeRangeForDivision("S2 +60", SENIOR, Y)).toEqual(ageCodeToRange("+60", Y));
  });
  it("ages 에 없는 연령코드는 매칭 안 함 (방어)", () => {
    // 디비전명에 U20 이 있어도 종별 ages 에 없으면 null
    expect(computeAgeRangeForDivision("i3 U20", YOUTH, Y)).toBeNull();
  });
});
