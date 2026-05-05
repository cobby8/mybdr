// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 5 PR15 — 유령회원 강제 액션 API
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 보고서 §3-3 + §4 — captain 또는 위임받은 자 (forceChange/withdrawApprove)
//   가 유령으로 분류된 멤버에 대해 강제 jersey 변경 / 강제 탈퇴 / 강제 role 변경 수행.
//   본인 동의 없이 운영진 결정으로 처리 — 미묘 룰 #5 (활동 감지 시 자동 active 복귀
//   = 강제 액션과 별개 흐름) 와 무관.
//
// 액션 3종:
//   - force_jersey_change: payload.newJersey 로 강제 변경 (충돌 검증 — 다른 active 멤버와 동일 X)
//     권한: forceChange
//   - force_withdraw: status='withdrawn' UPDATE (history 보존)
//     권한: withdrawApprove
//   - force_change_role: payload.newRole 로 강제 변경 (manager/coach/treasurer/director/member)
//     권한: forceChange
//
// 미묘 룰:
//   - 본인 captain 강제 변경 금지 (별도 captain transfer API 필요 — 본 endpoint 범위 밖)
//   - 강제 탈퇴 + history INSERT (eventType='force_withdrawn', payload.by_admin=true)
//   - 알림 발송 (대상자에게)
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
import { hasTeamOfficerPermission } from "@/lib/team-members/permissions";

type RouteCtx = { params: Promise<{ id: string; memberId: string }> };

// 강제 jersey 변경 payload
const ForceJerseyPayload = z.object({
  action: z.literal("force_jersey_change"),
  newJersey: z.number().int().min(0).max(99).nullable(), // null = 미배정
  reason: z.string().trim().max(500).optional(),
});

// 강제 탈퇴 payload
const ForceWithdrawPayload = z.object({
  action: z.literal("force_withdraw"),
  reason: z.string().trim().min(1).max(500), // 사유 필수 — 운영진 결정
});

// 강제 role 변경 payload
const ForceRolePayload = z.object({
  action: z.literal("force_change_role"),
  newRole: z.enum(["member", "manager", "coach", "treasurer", "director"]), // captain X (별도 transfer)
  reason: z.string().trim().max(500).optional(),
});

const RequestBodySchema = z.discriminatedUnion("action", [
  ForceJerseyPayload,
  ForceWithdrawPayload,
  ForceRolePayload,
]);

// POST /api/web/teams/[id]/members/[memberId]/force-action
export const POST = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id, memberId } = await routeCtx.params;

  let teamId: bigint;
  let memberIdBig: bigint;
  try {
    teamId = BigInt(id);
    memberIdBig = BigInt(memberId);
  } catch {
    return apiError("ID 값이 올바르지 않습니다.", 400, "INVALID_PARAMS");
  }

  // body 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("요청 데이터를 읽을 수 없습니다.", 400, "INVALID_JSON");
  }
  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("요청 데이터가 올바르지 않습니다.", 400, "VALIDATION_FAILED");
  }
  const data = parsed.data;

  // 멤버 조회 — 본 팀 소속 + active (탈퇴 상태에는 강제 액션 X)
  const member = await prisma.teamMember.findFirst({
    where: { id: memberIdBig, teamId, status: "active" },
    select: {
      id: true,
      userId: true,
      jerseyNumber: true,
      role: true,
      position: true,
      team: { select: { id: true, name: true, captainId: true } },
    },
  });
  if (!member) return apiError("멤버를 찾을 수 없거나 이미 비활성 상태입니다.", 404, "MEMBER_NOT_FOUND_OR_INACTIVE");

  // captain 본인 강제 변경 차단 (별도 transfer captain API 필요)
  if (member.userId === member.team.captainId) {
    return apiError("팀장은 강제 액션 대상이 될 수 없습니다.", 403, "CANNOT_FORCE_CAPTAIN");
  }

  // 자기 자신 강제 변경 차단
  if (member.userId === ctx.userId) {
    return apiError("본인에게 강제 액션을 적용할 수 없습니다.", 403, "CANNOT_FORCE_SELF");
  }

  // 권한 검증 — action 별 분기
  // force_jersey_change/force_change_role = forceChange 권한
  // force_withdraw = withdrawApprove 권한
  const requiredPermission =
    data.action === "force_withdraw" ? "withdrawApprove" : "forceChange";
  const allowed = await hasTeamOfficerPermission(teamId, ctx.userId, requiredPermission);
  if (!allowed) return apiError("팀장 또는 해당 권한을 위임받은 운영진만 처리할 수 있습니다.", 403, "FORBIDDEN");

  // 액션 실행
  if (data.action === "force_jersey_change") {
    // 충돌 검증 — null 이 아니면 다른 active 멤버 jersey 와 충돌하지 X
    if (data.newJersey !== null) {
      const conflict = await prisma.teamMember.findFirst({
        where: {
          teamId,
          status: "active",
          jerseyNumber: data.newJersey,
          NOT: { id: memberIdBig },
        },
        select: { id: true },
      });
      if (conflict) return apiError("이미 사용 중인 등번호입니다.", 409, "JERSEY_CONFLICT");
    }

    // 트랜잭션: jersey UPDATE + history INSERT
    const oldJersey = member.jerseyNumber;
    await prisma.$transaction([
      prisma.teamMember.update({
        where: { id: memberIdBig },
        data: { jerseyNumber: data.newJersey },
      }),
      prisma.teamMemberHistory.create({
        data: {
          teamId,
          userId: member.userId,
          eventType: "force_changed",
          payload: {
            field: "jersey_number",
            old: oldJersey,
            new: data.newJersey,
            by_admin: true,
            actor_user_id: ctx.userId.toString(),
          },
          reason: data.reason ?? null,
          createdById: ctx.userId,
        },
      }),
    ]);

    // 알림 — 대상에게
    createNotification({
      userId: member.userId,
      notificationType: NOTIFICATION_TYPES.FORCE_JERSEY_CHANGED,
      title: `[${member.team.name ?? "팀"}] 등번호 강제 변경`,
      content: `운영진이 등번호를 ${oldJersey ?? "미배정"} → ${data.newJersey ?? "미배정"} 로 변경했습니다.${data.reason ? ` 사유: ${data.reason}` : ""}`,
      actionUrl: `/teams/${teamId}`,
      notifiableType: "team_member",
      notifiableId: memberIdBig,
    }).catch(() => {});

    return apiSuccess({ ok: true, action: data.action, oldJersey, newJersey: data.newJersey });
  }

  if (data.action === "force_change_role") {
    const oldRole = member.role;
    await prisma.$transaction([
      prisma.teamMember.update({
        where: { id: memberIdBig },
        data: { role: data.newRole },
      }),
      prisma.teamMemberHistory.create({
        data: {
          teamId,
          userId: member.userId,
          eventType: "force_changed",
          payload: {
            field: "role",
            old: oldRole,
            new: data.newRole,
            by_admin: true,
            actor_user_id: ctx.userId.toString(),
          },
          reason: data.reason ?? null,
          createdById: ctx.userId,
        },
      }),
    ]);

    return apiSuccess({ ok: true, action: data.action, oldRole, newRole: data.newRole });
  }

  // force_withdraw — status='withdrawn' UPDATE + history INSERT
  // 이유: 명단 row 는 보존 (이력 추적). PR16 의 permanent-delete 와 분리.
  await prisma.$transaction([
    prisma.teamMember.update({
      where: { id: memberIdBig },
      data: { status: "withdrawn", left_at: new Date() },
    }),
    prisma.teamMemberHistory.create({
      data: {
        teamId,
        userId: member.userId,
        eventType: "force_withdrawn",
        payload: {
          prevStatus: "active",
          prevJersey: member.jerseyNumber,
          prevPosition: member.position,
          prevRole: member.role,
          by_admin: true,
          actor_user_id: ctx.userId.toString(),
        },
        reason: data.reason,
        createdById: ctx.userId,
      },
    }),
  ]);

  // 알림 — 대상에게
  createNotification({
    userId: member.userId,
    notificationType: NOTIFICATION_TYPES.FORCE_WITHDRAWN,
    title: `[${member.team.name ?? "팀"}] 강제 탈퇴 처리`,
    content: `운영진이 강제 탈퇴 처리했습니다. 사유: ${data.reason}`,
    actionUrl: `/teams/${teamId}`,
    notifiableType: "team_member",
    notifiableId: memberIdBig,
  }).catch(() => {});

  return apiSuccess({ ok: true, action: data.action });
});
