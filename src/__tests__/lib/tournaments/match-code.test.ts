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
import { describe, it, expect, vi } from "vitest";
import {
  generateMatchCode,
  parseMatchCode,
  normalizeRegion,
  isValidShortCode,
  REGION_CODE_MAP,
  // Phase 4 — generator 통합 함수들
  categoryNameToLetter,
  parseCategoryDivision,
  applyMatchCodeFields,
  generateUniqueMatchCode,
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

// ============================================================
// Phase 4 — generator 통합 함수 테스트
// ============================================================

describe("match-code v4 — categoryNameToLetter (Phase 4)", () => {
  it("5종 표준 매핑", () => {
    expect(categoryNameToLetter("일반부")).toBe("A");
    expect(categoryNameToLetter("유청소년부")).toBe("Y");
    expect(categoryNameToLetter("시니어부")).toBe("S");
    expect(categoryNameToLetter("여성부")).toBe("W");
    expect(categoryNameToLetter("대학부")).toBe("U");
  });

  it("미매핑 종별 → null (운영자 수동 보정 큐)", () => {
    expect(categoryNameToLetter("프로부")).toBeNull();
    expect(categoryNameToLetter("")).toBeNull();
  });

  it("공백 trim", () => {
    expect(categoryNameToLetter(" 일반부 ")).toBe("A");
  });
});

describe("match-code v4 — parseCategoryDivision (Phase 4)", () => {
  it("케이스 ① — 빈 categories (열혈 패턴)", () => {
    expect(parseCategoryDivision({})).toEqual({ categoryLetter: null, divisionTier: null });
    expect(parseCategoryDivision(null)).toEqual({ categoryLetter: null, divisionTier: null });
    expect(parseCategoryDivision(undefined)).toEqual({ categoryLetter: null, divisionTier: null });
  });

  it("케이스 ④ — 단일 종별 + 단일 디비전 (몰텐배 패턴)", () => {
    expect(parseCategoryDivision({ 일반부: ["D3"] })).toEqual({
      categoryLetter: "A",
      divisionTier: "D3",
    });
  });

  it("단일 종별 + 다중 디비전 → categoryLetter 만 부여, divisionTier null", () => {
    expect(parseCategoryDivision({ 일반부: ["D1", "D2"] })).toEqual({
      categoryLetter: "A",
      divisionTier: null,
    });
  });

  it("다중 종별 → 매치 오버라이드 우선 (매치별 부여 시나리오)", () => {
    const categories = { 일반부: ["D3"], 여성부: ["D1"] };
    // 오버라이드 없으면 둘 다 NULL (다중 종별이라 단일 추정 불가)
    expect(parseCategoryDivision(categories)).toEqual({
      categoryLetter: null,
      divisionTier: null,
    });
    // 매치 오버라이드 있으면 사용
    expect(parseCategoryDivision(categories, { category_letter: "W", division_tier: "D1" })).toEqual({
      categoryLetter: "W",
      divisionTier: "D1",
    });
  });
});

describe("match-code v4 — applyMatchCodeFields (Phase 4)", () => {
  // applyMatchCodeFields generic T 가 입력 매치 객체 형식을 보존하므로
  // 입력 타입에 v4 필드 (match_code 등) 가 명시돼야 result 도 인식
  type TestMatch = {
    match_number?: number | null;
    group_name?: string | null;
    match_code?: string | null;
    category_letter?: string | null;
    division_tier?: string | null;
    group_letter?: string | null;
  };

  const baseMeta = {
    short_code: "MD21",
    region_code: "GG",
    categories: { 일반부: ["D3"] },
    startDate: new Date("2026-05-02"),
  };

  it("정상 — 4컬럼 모두 자동 부여 (몰텐배 케이스)", () => {
    const matches: TestMatch[] = [
      { match_number: 1, group_name: "A" },
      { match_number: 2, group_name: "B" },
    ];
    const result = applyMatchCodeFields(matches, baseMeta);
    expect(result[0].match_code).toBe("26-GG-MD21-001");
    expect(result[0].category_letter).toBe("A");
    expect(result[0].division_tier).toBe("D3");
    expect(result[0].group_letter).toBe("A");
    expect(result[1].match_code).toBe("26-GG-MD21-002");
    expect(result[1].group_letter).toBe("B");
  });

  it("short_code NULL → match_code NULL (안전 가드)", () => {
    const matches: TestMatch[] = [{ match_number: 1, group_name: null }];
    const result = applyMatchCodeFields(matches, { ...baseMeta, short_code: null });
    expect(result[0].match_code).toBeNull();
    // category_letter / division_tier 는 categories 기반 부여 (match_code 와 독립)
    expect(result[0].category_letter).toBe("A");
    expect(result[0].division_tier).toBe("D3");
  });

  it("region_code NULL → match_code NULL (안전 가드)", () => {
    const matches: TestMatch[] = [{ match_number: 1 }];
    const result = applyMatchCodeFields(matches, { ...baseMeta, region_code: null });
    expect(result[0].match_code).toBeNull();
  });

  it("케이스 ① — 빈 categories (열혈 패턴, category/division NULL)", () => {
    const matches: TestMatch[] = [{ match_number: 1, group_name: null }];
    const result = applyMatchCodeFields(matches, {
      ...baseMeta,
      short_code: "HJ02",
      categories: {},
    });
    expect(result[0].match_code).toBe("26-GG-HJ02-001");
    expect(result[0].category_letter).toBeNull();
    expect(result[0].division_tier).toBeNull();
    expect(result[0].group_letter).toBeNull();
  });

  it("group_name 1자가 아니면 group_letter NULL (VarChar(1) 안전 가드)", () => {
    const matches: TestMatch[] = [{ match_number: 1, group_name: "AB" }];
    const result = applyMatchCodeFields(matches, baseMeta);
    expect(result[0].group_letter).toBeNull();
  });

  it("startDate NULL → 현재 연도 fallback (운영 무중단)", () => {
    const matches: TestMatch[] = [{ match_number: 1 }];
    const result = applyMatchCodeFields(matches, { ...baseMeta, startDate: null });
    const currentYY = String(new Date().getFullYear()).slice(-2);
    expect(result[0].match_code).toBe(`${currentYY}-GG-MD21-001`);
  });

  it("in-place 변형 X — 새 배열 반환 (호출자 안전성)", () => {
    const matches: TestMatch[] = [{ match_number: 1, match_code: null }];
    const result = applyMatchCodeFields(matches, baseMeta);
    // 원본 보존 (참조 비교)
    expect(matches[0].match_code).toBeNull();
    expect(result[0].match_code).toBe("26-GG-MD21-001");
    // 새 배열인지
    expect(result).not.toBe(matches);
  });
});

describe("match-code v4 — generateUniqueMatchCode (Phase 4)", () => {
  it("충돌 0 — 1차 시도 성공 (일반 generator 흐름)", async () => {
    // mock prisma — 모든 코드 unique (findUnique → null)
    const mockPrisma = {
      tournamentMatch: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    const code = await generateUniqueMatchCode(mockPrisma, {
      year: 2026,
      regionCode: "GG",
      shortCode: "MD21",
      matchNumber: 1,
    });
    expect(code).toBe("26-GG-MD21-001");
    expect(mockPrisma.tournamentMatch.findUnique).toHaveBeenCalledTimes(1);
  });

  it("충돌 시 fallback — matchNumber+1 재시도 동작", async () => {
    // mock prisma — 첫 2회 충돌 (existing 반환), 3번째 성공 (null 반환)
    const mockPrisma = {
      tournamentMatch: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: BigInt(1) }) // 26-GG-MD21-001 충돌
          .mockResolvedValueOnce({ id: BigInt(2) }) // 26-GG-MD21-002 충돌
          .mockResolvedValueOnce(null), // 26-GG-MD21-003 성공
      },
    };
    const code = await generateUniqueMatchCode(mockPrisma, {
      year: 2026,
      regionCode: "GG",
      shortCode: "MD21",
      matchNumber: 1,
    });
    expect(code).toBe("26-GG-MD21-003");
    expect(mockPrisma.tournamentMatch.findUnique).toHaveBeenCalledTimes(3);
  });

  it("maxRetry 초과 시 throw", async () => {
    // mock prisma — 항상 충돌 (existing 반환)
    const mockPrisma = {
      tournamentMatch: {
        findUnique: vi.fn().mockResolvedValue({ id: BigInt(99) }),
      },
    };
    await expect(
      generateUniqueMatchCode(
        mockPrisma,
        { year: 2026, regionCode: "GG", shortCode: "MD21", matchNumber: 1 },
        3, // maxRetry=3 (테스트 빠르게)
      ),
    ).rejects.toThrow(/3회 재시도 후도 충돌/);
    expect(mockPrisma.tournamentMatch.findUnique).toHaveBeenCalledTimes(3);
  });
});
