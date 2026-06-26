/**
 * 대회 참가팀 종별 일괄 이동 API.
 *
 * PATCH /api/web/admin/tournaments/[id]/teams/category
 * body: { fromCategory: string | null, category: string }
 *
 * TournamentTeam.category / division 과 TournamentTeamPlayer.division_code 를
 * 한 트랜잭션에서 맞춘다. 대회 직전 운영에서는 이 세 값이 갈라지면
 * 조편성·대진·기록 화면이 서로 다른 종별을 보게 된다.
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { adminLog } from "@/lib/admin/log";

type Ctx = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  fromCategory: z.string().trim().min(1).max(40).nullable().optional(),
  category: z.string().trim().min(1).max(40),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);

  const userId = BigInt(session.sub);
  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) return apiError("권한이 없습니다.", 403);

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 입력입니다.", 422, "VALIDATION_ERROR");
  }

  const fromCategory = parsed.data.fromCategory ?? null;
  const category = parsed.data.category;
  if (fromCategory === category) {
    return apiSuccess({ ok: true, changed: false, previous: fromCategory, current: category });
  }

  const rule = await prisma.tournamentDivisionRule.findFirst({
    where: { tournamentId, code: category },
    select: { code: true, label: true },
  });
  if (!rule) {
    return apiError(`종 코드 '${category}' 가 본 대회에 등록되지 않았습니다.`, 422);
  }

  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId, category: fromCategory },
    select: { id: true, team: { select: { name: true } } },
  });
  if (teams.length === 0) {
    return apiSuccess({
      ok: true,
      changed: false,
      previous: fromCategory,
      current: category,
      teamCount: 0,
      playerCount: 0,
    });
  }

  const teamIds = teams.map((team) => team.id);
  const [teamUpdate, playerUpdate] = await prisma.$transaction([
    prisma.tournamentTeam.updateMany({
      where: { id: { in: teamIds }, tournamentId },
      data: {
        category,
        division: category,
      },
    }),
    prisma.tournamentTeamPlayer.updateMany({
      where: { tournamentTeamId: { in: teamIds } },
      data: { division_code: category },
    }),
  ]);

  await adminLog("tournament_team.bulk_change_category", "TournamentTeam", {
    targetType: "Tournament",
    targetId: tournamentId,
    description: `참가팀 ${teamUpdate.count}팀 종별 일괄 변경: ${fromCategory ?? "(미지정)"} → ${category}`,
    previousValues: { category: fromCategory },
    changesMade: {
      category,
      team_count: teamUpdate.count,
      player_count: playerUpdate.count,
      teams: teams.map((team) => team.team?.name ?? team.id.toString()),
    },
    severity: "warning",
  });

  return apiSuccess({
    ok: true,
    changed: teamUpdate.count > 0,
    previous: fromCategory,
    current: category,
    teamCount: teamUpdate.count,
    playerCount: playerUpdate.count,
  });
}
