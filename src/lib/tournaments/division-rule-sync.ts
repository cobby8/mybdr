import type { Prisma } from "@prisma/client";
// Phase 1 순수 매핑 함수 — 종별 연령코드(U{N}/+{N}) → 출생연도·학년 범위 계산.
import { computeAgeRangeForDivision } from "@/lib/tournaments/age-mapping";

export type TournamentCategoryMap = Record<string, string[]>;
export type TournamentNumberMap = Record<string, number>;

export type DivisionRuleSeed = {
  code: string;
  label: string;
  feeKrw: number;
  sortOrder: number;
  format: string | null;
  settings: Prisma.InputJsonValue;
  // 종별 연령 자동 채움 (Phase 2). 미산출 시 null = 기존 동작 유지.
  birthYearMin?: number | null;
  birthYearMax?: number | null;
  gradeMin?: number | null;
  gradeMax?: number | null;
};

export type CategorySelectionItem = {
  category: string;
  divisions: Array<{
    name: string;
    cap: number | null;
    fee: number | null;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function uniqueText(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

export function normalizeCategoryMap(value: unknown): TournamentCategoryMap {
  if (!isRecord(value)) return {};

  const result: TournamentCategoryMap = {};
  for (const [rawCategory, rawDivisions] of Object.entries(value)) {
    const category = rawCategory.trim();
    if (!category || !Array.isArray(rawDivisions)) continue;

    const divisions = uniqueText(rawDivisions);
    if (divisions.length > 0) {
      result[category] = divisions;
    }
  }
  return result;
}

export function normalizeNumberMap(value: unknown): TournamentNumberMap {
  if (!isRecord(value)) return {};

  const result: TournamentNumberMap = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = rawKey.trim();
    const value =
      typeof rawValue === "number"
        ? rawValue
        : typeof rawValue === "string" && rawValue.trim() !== ""
          ? Number(rawValue)
          : NaN;

    if (!key || !Number.isFinite(value) || value < 0) continue;
    result[key] = Math.trunc(value);
  }
  return result;
}

export function countCategoryDivisions(value: unknown): number {
  return Object.values(normalizeCategoryMap(value)).reduce(
    (sum, divisions) => sum + divisions.length,
    0,
  );
}

export function toCategorySelectionItems(
  categoriesValue: unknown,
  divCapsValue: unknown,
  divFeesValue: unknown,
): CategorySelectionItem[] {
  const categories = normalizeCategoryMap(categoriesValue);
  const divCaps = normalizeNumberMap(divCapsValue);
  const divFees = normalizeNumberMap(divFeesValue);

  return Object.entries(categories).map(([category, divisions]) => ({
    category,
    divisions: divisions.map((name) => ({
      name,
      cap: divCaps[name] ?? null,
      fee: divFees[name] ?? null,
    })),
  }));
}

export function buildDivisionRuleSeedsFromCategories({
  categories,
  divFees,
  entryFee,
  format,
  divFormats,
  divSettings,
  categoryAges,
  tournamentYear,
}: {
  categories: unknown;
  divFees?: unknown;
  entryFee?: number | null;
  format?: string | null;
  // 디비전명 → 진행방식(format) 맵. divFees 와 동일한 키 컨벤션(디비전명).
  //   미지정 디비전은 대회 format 으로 폴백(회귀 0). 빈 문자열도 폴백 취급.
  divFormats?: Record<string, string>;
  // 디비전명 → 종별 settings(group_size/advance_per_group 등) 맵.
  //   기존 { category } 에 병합 저장(category 보존 + 종별 settings 추가).
  divSettings?: Record<string, Record<string, unknown>>;
  // 종별명 → ages 배열 (유청소년 ["U8".."U18"] / 일반부·대학부 []). 미전달 시 연령 자동 채움 skip.
  categoryAges?: Record<string, string[]>;
  // 대회 기준 연도 (출생연도 계산용). 미전달 시 연령 자동 채움 skip.
  tournamentYear?: number;
}): DivisionRuleSeed[] {
  const normalizedCategories = normalizeCategoryMap(categories);
  const normalizedFees = normalizeNumberMap(divFees);
  const fallbackFee =
    typeof entryFee === "number" && Number.isFinite(entryFee) && entryFee >= 0
      ? Math.trunc(entryFee)
      : 0;

  const seen = new Set<string>();
  const seeds: DivisionRuleSeed[] = [];

  for (const [category, divisions] of Object.entries(normalizedCategories)) {
    // 해당 종별의 연령 코드 배열 (없으면 [] → 토큰 매칭 실패로 연령 미적용).
    const ageCodes = categoryAges?.[category] ?? [];
    for (const division of divisions) {
      if (seen.has(division)) continue;
      seen.add(division);
      // tournamentYear 미전달 시 계산 자체를 건너뛰어 기존 동작(전부 null) 유지 = 회귀 0.
      const ageRange =
        tournamentYear != null
          ? computeAgeRangeForDivision(division, ageCodes, tournamentYear)
          : null;
      // 디비전별 진행방식 — divFormats 우선, 없으면(빈 문자열 포함) 대회 format 폴백.
      const perFormat = divFormats?.[division];
      const ruleFormat =
        typeof perFormat === "string" && perFormat.trim() ? perFormat : (format ?? null);
      // 디비전별 settings — 기존 { category } 에 종별 settings 병합(category 보존).
      const perSettings = divSettings?.[division];
      const ruleSettings: Prisma.InputJsonValue =
        perSettings && typeof perSettings === "object" && !Array.isArray(perSettings)
          ? ({ category, ...perSettings } as Prisma.InputJsonValue)
          : { category };
      seeds.push({
        code: division,
        label: division,
        feeKrw: normalizedFees[division] ?? fallbackFee,
        sortOrder: seeds.length,
        format: ruleFormat,
        settings: ruleSettings,
        // 연령 범위 null 이면 4필드 모두 null (일반부/대학부 ages=[] → null).
        birthYearMin: ageRange?.birthYearMin ?? null,
        birthYearMax: ageRange?.birthYearMax ?? null,
        gradeMin: ageRange?.gradeMin ?? null,
        gradeMax: ageRange?.gradeMax ?? null,
      });
    }
  }

  return seeds;
}
