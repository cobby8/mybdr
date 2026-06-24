/**
 * 종별 진행 방식 관리 API.
 *
 * GET  /api/web/admin/tournaments/[id]/division-rules
 * POST /api/web/admin/tournaments/[id]/division-rules
 */

import { type NextRequest } from "next/server";
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

  const rawDivSchedule = settingsObj.div_schedule;
  const divScheduleList: Array<{
    division: string;
    dateId?: unknown;
    courtId?: unknown;
  }> =
    rawDivSchedule && typeof rawDivSchedule === "object"
      ? Object.entries(rawDivSchedule as Record<string, unknown>).map(
          ([division, v]) => {
            const entry =
              v && typeof v === "object" ? (v as Record<string, unknown>) : {};
            return {
              division,
              dateId: entry.dateId,
              courtId: entry.courtId,
            };
          },
        )
      : [];

  return apiSuccess({
    rules: rules.map(serializeRule),
    allowed_formats: ALLOWED_FORMATS,
    master_categories: masterCategories.map(serializeMasterCategory),
    current_categories: toCategorySelectionItems(
      tournament.categories,
      tournament.div_caps,
      tournament.div_fees,
    ),
    div_schedule: divScheduleList,
    schedule_dates: tournament.schedule_dates ?? [],
    places: tournament.places ?? [],
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

  if (Object.keys(categories).length === 0) {
    return apiError("종별을 하나 이상 선택하세요", 400, "EMPTY_DIVISIONS");
  }

  const [tournament, existingRules] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id },
      select: { id: true, format: true, entry_fee: true },
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

  const updatedRules = await prisma.$transaction(async (tx) => {
    await tx.tournament.update({
      where: { id },
      data: {
        categories,
        div_caps: divCaps,
        div_fees: divFees,
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

    return tx.tournamentDivisionRule.findMany({
      where: { tournamentId: id },
      orderBy: { sortOrder: "asc" },
    });
  });

  return apiSuccess({
    rules: updatedRules.map(serializeRule),
    current_categories: toCategorySelectionItems(categories, divCaps, divFees),
    sync_result: {
      created: createSeeds.length,
      updated: updateSeeds.length,
      preserved: Math.max(existingRules.length - updateSeeds.length, 0),
    },
  });
}
