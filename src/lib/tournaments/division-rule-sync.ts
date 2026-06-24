import type { Prisma } from "@prisma/client";

export type TournamentCategoryMap = Record<string, string[]>;
export type TournamentNumberMap = Record<string, number>;

export type DivisionRuleSeed = {
  code: string;
  label: string;
  feeKrw: number;
  sortOrder: number;
  format: string | null;
  settings: Prisma.InputJsonValue;
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
}: {
  categories: unknown;
  divFees?: unknown;
  entryFee?: number | null;
  format?: string | null;
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
    for (const division of divisions) {
      if (seen.has(division)) continue;
      seen.add(division);
      seeds.push({
        code: division,
        label: division,
        feeKrw: normalizedFees[division] ?? fallbackFee,
        sortOrder: seeds.length,
        format: format ?? null,
        settings: { category },
      });
    }
  }

  return seeds;
}
