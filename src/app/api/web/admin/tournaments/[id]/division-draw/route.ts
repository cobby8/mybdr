import { randomInt } from "crypto";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiSuccess, forbidden, unauthorized } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { adminLog } from "@/lib/admin/log";

type Ctx = { params: Promise<{ id: string }> };

const GROUP_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const BodySchema = z.object({
  divisionCode: z.string().trim().min(1).max(40),
  groupCount: z.number().int().min(1).max(16).optional(),
});

function readGroupCount(settings: unknown): number | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return null;
  }
  const record = settings as Record<string, unknown>;
  const raw = record.group_count ?? record.groupCount;
  return typeof raw === "number" && Number.isInteger(raw) && raw > 0 ? raw : null;
}

function shuffle<T>(values: T[]): T[] {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  const session = await getWebSession();
  if (!session) return unauthorized();
  const userId = BigInt(session.sub);
  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) return forbidden();

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("요청값이 올바르지 않습니다.", 422, "VALIDATION_ERROR");
  }

  const rule = await prisma.tournamentDivisionRule.findFirst({
    where: { tournamentId, code: parsed.data.divisionCode },
    select: { code: true, label: true, settings: true },
  });
  if (!rule) {
    return apiError("등록된 종별을 찾을 수 없습니다.", 404, "DIVISION_NOT_FOUND");
  }

  const teams = await prisma.tournamentTeam.findMany({
    where: {
      tournamentId,
      status: "approved",
      category: rule.code,
    },
    orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
    select: { id: true, team: { select: { name: true } } },
  });

  if (teams.length < 2) {
    return apiError("승인팀이 2팀 이상이어야 조편성을 할 수 있습니다.", 400, "TEAMS_INSUFFICIENT");
  }

  const desiredGroupCount =
    parsed.data.groupCount ?? readGroupCount(rule.settings) ?? Math.ceil(teams.length / 4);
  const groupCount = Math.min(Math.max(desiredGroupCount, 1), teams.length, GROUP_LABELS.length);
  const shuffled = shuffle(teams);

  const groups = Object.fromEntries(
    GROUP_LABELS.slice(0, groupCount).map((group) => [group, [] as string[]]),
  );

  await prisma.$transaction(
    shuffled.map((team, index) => {
      const groupName = GROUP_LABELS[index % groupCount];
      groups[groupName].push(team.team?.name ?? team.id.toString());
      return prisma.tournamentTeam.update({
        where: { id: team.id },
        data: {
          seedNumber: index + 1,
          groupName,
        },
      });
    }),
  );

  await adminLog("tournament.division_draw", "Tournament", {
    resourceId: tournamentId,
    description: `${rule.label} 자동 조편성 실행: ${teams.length}팀 / ${groupCount}조`,
    changesMade: {
      division_code: rule.code,
      team_count: teams.length,
      group_count: groupCount,
      groups,
    },
    severity: "info",
  }).catch(() => {
    /* 조편성 자체는 성공 유지 */
  });

  return apiSuccess({
    divisionCode: rule.code,
    divisionLabel: rule.label,
    teamCount: teams.length,
    groupCount,
    groups,
  });
}
