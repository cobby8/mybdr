/**
 * 종별 진행 방식 관리 API.
 *
 * GET  /api/web/admin/tournaments/[id]/division-rules
 * POST /api/web/admin/tournaments/[id]/division-rules
 */

import { type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { apiSuccess, apiError, unauthorized, forbidden } from "@/lib/api/response";
import { ALLOWED_FORMATS } from "@/lib/tournaments/division-formats";
import {
  buildDivisionRuleSeedsFromCategories,
  normalizeCategoryMap,
  normalizeNumberMap,
  toCategorySelectionItems,
} from "@/lib/tournaments/division-rule-sync";

function serializeRule(r: {
  id: bigint;
  code: string;
  label: string;
  // 2026-06-28 연령 자동 채움 — 출생연도 범위 응답 노출 (학년은 기존부터 노출).
  birthYearMin: number | null;
  birthYearMax: number | null;
  gradeMin: number | null;
  gradeMax: number | null;
  feeKrw: number;
  sortOrder: number;
  format: string | null;
  settings: unknown;
}) {
  return {
    id: r.id.toString(),
    code: r.code,
    label: r.label,
    // 출생연도 min/max 추가 — 패널 연령 입력 초기값으로 사용.
    birth_year_min: r.birthYearMin,
    birth_year_max: r.birthYearMax,
    grade_min: r.gradeMin,
    grade_max: r.gradeMax,
    fee_krw: r.feeKrw,
    sort_order: r.sortOrder,
    format: r.format,
    settings: r.settings,
  };
}

function serializeMasterCategory(c: {
  id: bigint;
  name: string;
  divisions: unknown;
  ages: unknown;
  sortOrder: number;
}) {
  return {
    id: c.id.toString(),
    name: c.name,
    divisions: Array.isArray(c.divisions) ? c.divisions : [],
    ages: Array.isArray(c.ages) ? c.ages : [],
    sort_order: c.sortOrder,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeDivSchedule(
  value: unknown,
  categories: Record<string, string[]>,
): Record<string, { dateId: string; courtId: string }> | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return {};

  const selectedDivisions = new Set(
    Object.values(categories)
      .flat()
      .map((division) => division.trim())
      .filter(Boolean),
  );
  const result: Record<string, { dateId: string; courtId: string }> = {};

  for (const [rawDivision, rawEntry] of Object.entries(value)) {
    const division = rawDivision.trim();
    if (!division || !selectedDivisions.has(division) || !isRecord(rawEntry)) {
      continue;
    }

    const rawDateId = rawEntry.dateId ?? rawEntry.date_id;
    const rawCourtId = rawEntry.courtId ?? rawEntry.court_id;
    const dateId = typeof rawDateId === "string" ? rawDateId.trim() : "";
    const courtId = typeof rawCourtId === "string" ? rawCourtId.trim() : "";
    if (dateId && courtId) {
      result[division] = { dateId, courtId };
    }
  }

  return result;
}

function serializeDivSchedule(value: unknown): Array<{
  division: string;
  dateId?: unknown;
  courtId?: unknown;
}> {
  if (!isRecord(value)) return [];

  return Object.entries(value).map(([division, rawEntry]) => {
    const entry = isRecord(rawEntry) ? rawEntry : {};
    return {
      division,
      dateId: entry.dateId ?? entry.date_id,
      courtId: entry.courtId ?? entry.court_id,
    };
  });
}

async function authorizeTournament(id: string) {
  const session = await getWebSession();
  if (!session) return { response: unauthorized() };

  const userId = BigInt(session.sub);
  const allowed = await canManageTournament(id, userId, session);
  if (!allowed) return { response: forbidden() };

  return { session };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authorizeTournament(id);
  if ("response" in auth) return auth.response;

  const [rules, tournament, masterCategories] = await Promise.all([
    prisma.tournamentDivisionRule.findMany({
      where: { tournamentId: id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.tournament.findUnique({
      where: { id },
      select: {
        categories: true,
        div_caps: true,
        div_fees: true,
        settings: true,
        schedule_dates: true,
        places: true,
        // 2026-06-28 연령 자동 채움 — 출생연도 계산 기준 연도(대회 시작일).
        startDate: true,
      },
    }),
    prisma.adminCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);
  if (!tournament) return apiError("대회를 찾을 수 없습니다", 404, "NOT_FOUND");

  const settingsObj =
    tournament.settings && typeof tournament.settings === "object"
      ? (tournament.settings as Record<string, unknown>)
      : {};

  // 2026-06-28 연령 자동 채움 — 대회 기준 연도 = startDate 의 연도(KST).
  //   Vercel 서버는 UTC 라 tz 보정 없이 getFullYear 하면 12/31 자정 KST 가 전년으로 밀릴 수 있다.
  //   Phase 2 createTournament 와 동일하게 +9h 보정 후 UTC 연도를 취한다(한국은 DST 없음).
  //   startDate 없으면(초안 등) 현재 연도 폴백.
  const tournamentYear = tournament.startDate
    ? new Date(tournament.startDate.getTime() + 9 * 60 * 60 * 1000).getUTCFullYear()
    : new Date().getFullYear();

  return apiSuccess({
    rules: rules.map(serializeRule),
    allowed_formats: ALLOWED_FORMATS,
    master_categories: masterCategories.map(serializeMasterCategory),
    current_categories: toCategorySelectionItems(
      tournament.categories,
      tournament.div_caps,
      tournament.div_fees,
    ),
    div_schedule: serializeDivSchedule(settingsObj.div_schedule),
    schedule_dates: tournament.schedule_dates ?? [],
    places: tournament.places ?? [],
    // 패널 "연령 자동 채움" 버튼의 출생연도 계산 기준 연도.
    tournament_year: tournamentYear,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authorizeTournament(id);
  if ("response" in auth) return auth.response;

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return apiError("잘못된 요청입니다", 400, "BAD_REQUEST");
  }

  const body = raw as Record<string, unknown>;
  const categories = normalizeCategoryMap(body.categories);
  const divCaps = normalizeNumberMap(body.div_caps ?? body.divCaps);
  const divFees = normalizeNumberMap(body.div_fees ?? body.divFees);
  const divSchedule = normalizeDivSchedule(
    body.div_schedule ?? body.divSchedule,
    categories,
  );

  if (Object.keys(categories).length === 0) {
    return apiError("종별을 하나 이상 선택하세요", 400, "EMPTY_DIVISIONS");
  }

  const [tournament, existingRules] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id },
      select: { id: true, format: true, entry_fee: true, settings: true },
    }),
    prisma.tournamentDivisionRule.findMany({
      where: { tournamentId: id },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  if (!tournament) return apiError("대회를 찾을 수 없습니다", 404, "NOT_FOUND");

  const seeds = buildDivisionRuleSeedsFromCategories({
    categories,
    divFees,
    entryFee: Number(tournament.entry_fee ?? 0),
    format: tournament.format ?? "single_elimination",
  });
  const existingByCode = new Map(existingRules.map((rule) => [rule.code, rule]));
  const createSeeds = seeds.filter((seed) => !existingByCode.has(seed.code));
  const updateSeeds = seeds.filter((seed) => existingByCode.has(seed.code));
  const seedCodes = new Set(seeds.map((seed) => seed.code));
  const deleteRules = existingRules.filter((rule) => !seedCodes.has(rule.code));
  const deleteCodes = deleteRules.map((rule) => rule.code);
  if (deleteCodes.length > 0) {
    const [teamRefs, playerRefs, matchRefs] = await Promise.all([
      prisma.tournamentTeam.groupBy({
        by: ["category"],
        where: { tournamentId: id, category: { in: deleteCodes } },
        _count: { _all: true },
      }),
      prisma.tournamentTeamPlayer.groupBy({
        by: ["division_code"],
        where: {
          division_code: { in: deleteCodes },
          tournamentTeam: { tournamentId: id },
        },
        _count: { _all: true },
      }),
      Promise.all(
        deleteCodes.map(async (code) => {
          const count = await prisma.tournamentMatch.count({
            where: {
              tournamentId: id,
              settings: { path: ["division_code"], equals: code },
            },
          });
          return count > 0 ? { code, count } : null;
        }),
      ),
    ]);

    const teamCountByCode = new Map(
      teamRefs
        .filter((row) => typeof row.category === "string")
        .map((row) => [row.category as string, row._count._all]),
    );
    const playerCountByCode = new Map(
      playerRefs
        .filter((row) => typeof row.division_code === "string")
        .map((row) => [row.division_code as string, row._count._all]),
    );
    const matchCountByCode = new Map(
      matchRefs
        .filter((row): row is { code: string; count: number } => !!row)
        .map((row) => [row.code, row.count]),
    );
    const blockedSummaries = deleteCodes
      .map((code) => {
        const details = [
          teamCountByCode.has(code) ? `팀 ${teamCountByCode.get(code)}팀` : null,
          playerCountByCode.has(code) ? `선수 ${playerCountByCode.get(code)}명` : null,
          matchCountByCode.has(code) ? `경기 ${matchCountByCode.get(code)}경기` : null,
        ].filter(Boolean);
        return details.length > 0 ? `${code}(${details.join(", ")})` : null;
      })
      .filter((summary): summary is string => !!summary);
    if (blockedSummaries.length > 0) {
      return apiError(
        `연결된 참가팀·선수·경기가 있어 삭제할 수 없습니다. 참가팀 탭에서 신청 종별을 먼저 이동하세요: ${blockedSummaries.join(", ")}`,
        409,
        "DIVISION_IN_USE",
      );
    }
  }

  const settingsObj =
    tournament.settings && typeof tournament.settings === "object" && !Array.isArray(tournament.settings)
      ? { ...(tournament.settings as Record<string, unknown>) }
      : {};
  const finalDivSchedule =
    divSchedule ?? normalizeDivSchedule(settingsObj.div_schedule, categories) ?? {};
  if (Object.keys(finalDivSchedule).length > 0) {
    settingsObj.div_schedule = finalDivSchedule;
  } else {
    delete settingsObj.div_schedule;
  }

  const updatedRules = await prisma.$transaction(async (tx) => {
    await tx.tournament.update({
      where: { id },
      data: {
        categories,
        div_caps: divCaps,
        div_fees: divFees,
        settings: JSON.parse(JSON.stringify(settingsObj)) as Prisma.InputJsonValue,
      },
    });

    await Promise.all(
      updateSeeds.map((seed) => {
        const existing = existingByCode.get(seed.code);
        if (!existing) return Promise.resolve(null);
        return tx.tournamentDivisionRule.update({
          where: { id: existing.id },
          data: {
            label: seed.label,
            feeKrw: seed.feeKrw,
            sortOrder: seed.sortOrder,
            format: existing.format ?? seed.format,
          },
        });
      }),
    );

    if (createSeeds.length > 0) {
      await tx.tournamentDivisionRule.createMany({
        data: createSeeds.map((seed) => ({
          ...seed,
          tournamentId: id,
        })),
      });
    }

    if (deleteRules.length > 0) {
      await tx.tournamentDivisionRule.deleteMany({
        where: {
          tournamentId: id,
          id: { in: deleteRules.map((rule) => rule.id) },
        },
      });
    }

    return tx.tournamentDivisionRule.findMany({
      where: { tournamentId: id },
      orderBy: { sortOrder: "asc" },
    });
  });

  return apiSuccess({
    rules: updatedRules.map(serializeRule),
    current_categories: toCategorySelectionItems(categories, divCaps, divFees),
    div_schedule: serializeDivSchedule(settingsObj.div_schedule),
    sync_result: {
      created: createSeeds.length,
      updated: updateSeeds.length,
      deleted: deleteRules.length,
      preserved: Math.max(existingRules.length - updateSeeds.length - deleteRules.length, 0),
    },
  });
}
