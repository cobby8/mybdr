/**
 * 매치 코드 v4 helper unit test
 *
 * 검증 범위:
 * - generateMatchCode (정상 / 999매치 / zero-pad)
 * - parseMatchCode (정상 / 형식 오류 / region 외)
 * - normalizeRegion (정확 매칭 / 접미사 / 키워드 / 도시→시도 / 실패)
 * - isValidShortCode (영문2+숫자2 / 소문자 / 자릿수)
 *
 * Phase 4 generator (DB 의존성) 는 별도 통합 테스트로 분리 — 본 파일은 순수 함수만.
 */
import { describe, it, expect } from "vitest";
import {
  generateMatchCode,
  parseMatchCode,
  normalizeRegion,
  isValidShortCode,
  REGION_CODE_MAP,
} from "@/lib/tournaments/match-code";

describe("match-code v4 — REGION_CODE_MAP", () => {
  it("17 시도 모두 매핑 되어야 함", () => {
    // 17 시도 카운트 검증 (운영 무결성)
    expect(Object.keys(REGION_CODE_MAP)).toHaveLength(17);
  });

  it("핵심 매핑 정확성 (사용자 결정 Q7)", () => {
    expect(REGION_CODE_MAP.서울).toBe("SE");
    expect(REGION_CODE_MAP.경기).toBe("GG");
    expect(REGION_CODE_MAP.인천).toBe("IC");
    expect(REGION_CODE_MAP.제주).toBe("JJ");
  });
});

describe("match-code v4 — generateMatchCode", () => {
  it("몰텐배 표준 (26-GG-MD21-001)", () => {
    expect(
      generateMatchCode({ year: 2026, regionCode: "GG", shortCode: "MD21", matchNumber: 1 }),
    ).toBe("26-GG-MD21-001");
  });

  it("열혈 SEASON2 (26-GG-HJ02-034)", () => {
    expect(
      generateMatchCode({ year: 2026, regionCode: "GG", shortCode: "HJ02", matchNumber: 34 }),
    ).toBe("26-GG-HJ02-034");
  });

  it("999매치 (자릿수 한계)", () => {
    expect(
      generateMatchCode({ year: 2026, regionCode: "SE", shortCode: "AB99", matchNumber: 999 }),
    ).toBe("26-SE-AB99-999");
  });

  it("매치 번호 zero-pad (matchNumber=5 → 005)", () => {
    expect(
      generateMatchCode({ year: 2027, regionCode: "BS", shortCode: "XY01", matchNumber: 5 }),
    ).toBe("27-BS-XY01-005");
  });
});

describe("match-code v4 — parseMatchCode", () => {
  it("정상 (26-GG-MD21-001)", () => {
    expect(parseMatchCode("26-GG-MD21-001")).toEqual({
      year: 2026,
      regionCode: "GG",
      shortCode: "MD21",
      matchNumber: 1,
    });
  });

  it("999매치 파싱", () => {
    expect(parseMatchCode("27-SE-AB99-999")).toEqual({
      year: 2027,
      regionCode: "SE",
      shortCode: "AB99",
      matchNumber: 999,
    });
  });

  it("형식 오류 — 짧은 코드 (null 반환)", () => {
    expect(parseMatchCode("M21-001")).toBeNull();
  });

  it("형식 오류 — year 4자리 (null 반환)", () => {
    // 4자리 year 는 정규식 (\d{2}) 매칭 안 됨
    expect(parseMatchCode("2026-GG-MD21-001")).toBeNull();
  });

  it("형식 오류 — 소문자 region (null 반환)", () => {
    expect(parseMatchCode("26-gg-MD21-001")).toBeNull();
  });

  it("형식 오류 — 매치번호 자릿수 부족 (null 반환)", () => {
    expect(parseMatchCode("26-GG-MD21-1")).toBeNull();
  });

  it("빈 문자열 (null 반환)", () => {
    expect(parseMatchCode("")).toBeNull();
  });
});

describe("match-code v4 — normalizeRegion", () => {
  it("정확 매칭", () => {
    expect(normalizeRegion("서울")).toBe("SE");
    expect(normalizeRegion("경기")).toBe("GG");
    expect(normalizeRegion("제주")).toBe("JJ");
  });

  it("접미사 제거 — 특별시/광역시/도", () => {
    expect(normalizeRegion("서울특별시")).toBe("SE");
    expect(normalizeRegion("부산광역시")).toBe("BS");
    expect(normalizeRegion("경기도")).toBe("GG");
  });

  it("접미사 제거 — 특별자치도/특별자치시", () => {
    expect(normalizeRegion("제주특별자치도")).toBe("JJ");
    expect(normalizeRegion("세종특별자치시")).toBe("SJ");
  });

  it("키워드 추출 — 시도 + 시군구 (운영 2대회 케이스)", () => {
    expect(normalizeRegion("경기도 화성시")).toBe("GG");
    expect(normalizeRegion("충청남도 천안시")).toBe("CN");
  });

  it("도시→시도 보조 매핑 (운영 1번 케이스 = 남양주)", () => {
    expect(normalizeRegion("남양주시")).toBe("GG");
    expect(normalizeRegion("화성시")).toBe("GG");
  });

  it("자치구 → 서울 (강남구 / 송파구)", () => {
    expect(normalizeRegion("강남구")).toBe("SE");
    expect(normalizeRegion("송파")).toBe("SE");
  });

  it("실패 케이스 — null/undefined/빈 문자열", () => {
    expect(normalizeRegion(null)).toBeNull();
    expect(normalizeRegion(undefined)).toBeNull();
    expect(normalizeRegion("")).toBeNull();
    expect(normalizeRegion("   ")).toBeNull();
  });

  it("실패 케이스 — 매핑 외 텍스트", () => {
    expect(normalizeRegion("외국")).toBeNull();
    expect(normalizeRegion("뉴욕")).toBeNull();
  });
});

describe("match-code v4 — isValidShortCode", () => {
  it("정상 (영문 대문자 2자 + 숫자 2자리)", () => {
    expect(isValidShortCode("MD21")).toBe(true);
    expect(isValidShortCode("HJ02")).toBe(true);
    expect(isValidShortCode("AB99")).toBe(true);
  });

  it("자릿수 부족 (3자)", () => {
    expect(isValidShortCode("M21")).toBe(false);
    expect(isValidShortCode("MD2")).toBe(false);
  });

  it("자릿수 초과 (5자)", () => {
    expect(isValidShortCode("MD211")).toBe(false);
  });

  it("소문자 거부", () => {
    expect(isValidShortCode("md21")).toBe(false);
    expect(isValidShortCode("Md21")).toBe(false);
  });

  it("특수문자 거부", () => {
    expect(isValidShortCode("MD-1")).toBe(false);
    expect(isValidShortCode("MD 1")).toBe(false);
  });

  it("빈 문자열 / falsy", () => {
    expect(isValidShortCode("")).toBe(false);
  });
});
