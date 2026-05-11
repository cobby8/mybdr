/**
 * 2026-05-12 Phase 4-B (옵션 B 2번) — 코치 정보 변경 API.
 *
 * PATCH /api/web/admin/tournaments/[id]/teams/[ttId]/manager
 * body: { managerName?: string, managerPhone?: string }
 * 권한: canManageTournament
 *
 * UPDATE TournamentTeam.manager_name / manager_phone + admin_logs
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { adminLog } from "@/lib/admin/log";

type Ctx = { params: Promise<{ id: string; ttId: string }> };

const BodySchema = z.object({
  managerName: z.string().trim().min(1).max(30).optional(),
  managerPhone: z
    .string()
    .trim()
    .regex(/^(010-\d{4}-\d{4}|01\d{9}|)$/, "휴대폰 형식 (010-XXXX-XXXX) 또는 빈 값")
    .optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId, ttId } = await params;

  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);
  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) return apiError("권한이 없습니다.", 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return apiError("잘못된 요청입니다.", 400); }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 입력입니다.", 422, "VALIDATION_ERROR");
  }
  const { managerName, managerPhone } = parsed.data;

  const tt = await prisma.tournamentTeam.findUnique({
    where: { id: BigInt(ttId) },
    select: {
      id: true, tournamentId: true,
      manager_name: true, manager_phone: true,
      team: { select: { name: true } },
    },
  });
  if (!tt) return apiError("팀을 찾을 수 없습니다.", 404);
  if (tt.tournamentId !== tournamentId) return apiError("대회 매칭 오류.", 400);

  const previousValues: Record<string, unknown> = {};
  const changesMade: Record<string, unknown> = {};
  const updateData: { manager_name?: string | null; manager_phone?: string | null } = {};

  if (managerName !== undefined && managerName !== tt.manager_name) {
    previousValues.manager_name = tt.manager_name;
    changesMade.manager_name = managerName;
    updateData.manager_name = managerName;
  }
  if (managerPhone !== undefined && managerPhone !== tt.manager_phone) {
    previousValues.manager_phone = tt.manager_phone;
    changesMade.manager_phone = managerPhone || null;
    updateData.manager_phone = managerPhone || null;
  }

  if (Object.keys(updateData).length === 0) {
    return apiSuccess({ ok: true, changed: false });
  }

  await prisma.tournamentTeam.update({
    where: { id: tt.id },
    data: updateData,
  });

  await adminLog("tournament_team.update_manager", "TournamentTeam", {
    description: `${tt.team?.name ?? "(이름 없음)"} 코치 정보 변경 (대회 ${tournamentId})`,
    previousValues,
    changesMade,
    severity: "info",
  });

  return apiSuccess({ ok: true, changed: true });
}
