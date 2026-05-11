/**
 * 2026-05-12 Phase 4-B (옵션 B 3번) — 팀 종별 변경 API.
 *
 * PATCH /api/web/admin/tournaments/[id]/teams/[ttId]/category
 * body: { category: string }  (해당 대회의 TournamentDivisionRule.code 중 하나)
 * 권한: canManageTournament
 *
 * UPDATE TournamentTeam.category + TournamentTeamPlayer.division_code 일괄 sync + admin_logs warning
 *
 * 주의 — TournamentTeamPlayer 의 birth_date / grade 가 신규 종별 룰과 불일치 시 경고만 (강제 차단 X — 운영자 판단).
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
  category: z.string().trim().min(1).max(20),
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
  if (!parsed.success) return apiError("유효하지 않은 입력입니다.", 422);
  const { category } = parsed.data;

  const tt = await prisma.tournamentTeam.findUnique({
    where: { id: BigInt(ttId) },
    select: {
      id: true, tournamentId: true, category: true,
      team: { select: { name: true } },
    },
  });
  if (!tt) return apiError("팀을 찾을 수 없습니다.", 404);
  if (tt.tournamentId !== tournamentId) return apiError("대회 매칭 오류.", 400);
  if (tt.category === category) {
    return apiSuccess({ ok: true, changed: false });
  }

  // 종별 룰 존재 검증
  const rule = await prisma.tournamentDivisionRule.findFirst({
    where: { tournamentId, code: category },
    select: { code: true, label: true },
  });
  if (!rule) {
    return apiError(`종 코드 '${category}' 가 본 대회에 등록되지 않았습니다.`, 422);
  }

  const previous = tt.category;

  // 트랜잭션 — TournamentTeam + TournamentTeamPlayer division_code 동시 sync
  await prisma.$transaction([
    prisma.tournamentTeam.update({
      where: { id: tt.id },
      data: { category },
    }),
    prisma.tournamentTeamPlayer.updateMany({
      where: { tournamentTeamId: tt.id },
      data: { division_code: category },
    }),
  ]);

  await adminLog("tournament_team.change_category", "TournamentTeam", {
    description: `${tt.team?.name ?? "(이름 없음)"} 종별 변경: ${previous ?? "(없음)"} → ${category}`,
    previousValues: { category: previous },
    changesMade: { category },
    severity: "warning",
  });

  return apiSuccess({ ok: true, changed: true, previous, current: category });
}
