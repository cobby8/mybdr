// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 5 PR16 — 명단 완전 삭제 API
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 보고서 §3-B (사용자 결정 #5) — 탈퇴 멤버 명단 row 자체를 삭제 (history 보존).
//   사용자 결정으로 captain 만 가능 (위임 X — 데이터 영구 삭제는 위험).
//   대상 = status='withdrawn' 인 row 만 (active/dormant 멤버는 force_withdraw 후 진행).
//
// 삭제 룰:
//   - team_members row DELETE
//   - team_member_history 보존 (source of truth)
//   - 알림 발송 X (이미 탈퇴 상태인 row 의 사후 정리)
// ─────────────────────────────────────────────────────────────────────────────

import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { isTeamCaptain } from "@/lib/team-members/permissions";

type RouteCtx = { params: Promise<{ id: string; memberId: string }> };

// DELETE /api/web/teams/[id]/members/[memberId]/permanent-delete
export const DELETE = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id, memberId } = await routeCtx.params;

  let teamId: bigint;
  let memberIdBig: bigint;
  try {
    teamId = BigInt(id);
    memberIdBig = BigInt(memberId);
  } catch {
    return apiError("ID 값이 올바르지 않습니다.", 400, "INVALID_PARAMS");
  }

  // captain 만 가능 — 위임 X (사용자 결정 #5)
  // 이유: 명단 row 영구 삭제는 데이터 파괴. captain 의 직접 결정만 허용.
  const isCaptain = await isTeamCaptain(teamId, ctx.userId);
  if (!isCaptain) return apiError("팀장만 명단 영구 삭제를 할 수 있습니다.", 403, "FORBIDDEN");

  // 멤버 조회 — 본 팀 + status='withdrawn' 만 통과 (active/dormant 차단)
  const member = await prisma.teamMember.findFirst({
    where: { id: memberIdBig, teamId, status: "withdrawn" },
    select: { id: true, userId: true },
  });
  if (!member) return apiError("멤버를 찾을 수 없거나 탈퇴 상태가 아닙니다.", 404, "MEMBER_NOT_FOUND_OR_NOT_WITHDRAWN");

  // 자기 자신 row 삭제 차단 (captain 본인이 withdrawn 상태일 일은 거의 없지만 방어)
  if (member.userId === ctx.userId) {
    return apiError("본인 row 는 삭제할 수 없습니다.", 403, "CANNOT_DELETE_SELF");
  }

  // DELETE — history 는 보존 (eventType='permanent_deleted' INSERT 로 사실 기록)
  // 이유: history 테이블이 source of truth — row 가 삭제되어도 멤버 가입/탈퇴 이력 추적 가능.
  await prisma.$transaction([
    prisma.teamMemberHistory.create({
      data: {
        teamId,
        userId: member.userId,
        eventType: "permanent_deleted",
        payload: {
          memberId: member.id.toString(),
          by_admin: true,
          actor_user_id: ctx.userId.toString(),
        },
        reason: null,
        createdById: ctx.userId,
      },
    }),
    prisma.teamMember.delete({
      where: { id: memberIdBig },
    }),
  ]);

  return apiSuccess({ ok: true, deletedMemberId: memberIdBig.toString() });
});
