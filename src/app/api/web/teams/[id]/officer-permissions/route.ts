import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 4 PR12 — 운영진 권한 위임/회수/조회 (captain only)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): captain 이 manager/coach/treasurer/director (team_members.role) 에게 6 종
//   액션 권한 분배. 보고서 §4 결정 #4 — captain only (재위임 X).
// 라우트:
//   - GET    : captain (전체 활성 권한 row 목록) + 본인 (자기 활성 권한 1건)
//   - POST   : captain only — 위임 신설 또는 기존 활성 row 의 permissions UPDATE
//   - DELETE : captain only — revokedAt = now() (DELETE X, 이력 보존)
// UNIQUE 룰: (teamId, userId, revokedAt) 복합 — revokedAt=NULL 끼리 PostgreSQL distinct
//   처리 → 활성 권한 1건만 가능.
// 위임 대상 검증: targetUser 가 본 팀의 active 멤버 + role IN (manager/coach/treasurer/director)
//   이어야 함. captain 자기 자신 위임 차단 (이미 모든 권한 보유).
// ─────────────────────────────────────────────────────────────────────────────

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// permissions JSON 키 6 종 — TeamOfficerPermission 과 동기 (permissions.ts)
// ─────────────────────────────────────────────────────────────────────────────
const PermissionsSchema = z
  .object({
    jerseyChangeApprove: z.boolean().optional(),
    dormantApprove: z.boolean().optional(),
    withdrawApprove: z.boolean().optional(),
    transferApprove: z.boolean().optional(),
    ghostClassify: z.boolean().optional(),
    forceChange: z.boolean().optional(),
  })
  .strict();

const PostBodySchema = z.object({
  userId: z.union([z.string(), z.number()]).transform((v) => {
    try {
      return BigInt(v);
    } catch {
      throw new Error("INVALID_USER_ID");
    }
  }),
  permissions: PermissionsSchema,
});

const DeleteBodySchema = z.object({
  userId: z.union([z.string(), z.number()]).transform((v) => {
    try {
      return BigInt(v);
    } catch {
      throw new Error("INVALID_USER_ID");
    }
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 위임 가능 role — captain 이 아닌 운영진 직급만 위임 가능
// ─────────────────────────────────────────────────────────────────────────────
const DELEGABLE_ROLES = ["manager", "coach", "treasurer", "director"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// GET — 권한 조회
// ─────────────────────────────────────────────────────────────────────────────
// captain : 본 팀의 모든 활성 권한 row 목록 (운영진 권한 탭 렌더용)
// 비-captain : 본인의 활성 권한 1건 (자기 시야 — 일반 멤버는 빈 배열)
export const GET = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  let teamId: bigint;
  try {
    teamId = BigInt(id);
  } catch {
    return apiError("INVALID_TEAM_ID", 400);
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, captainId: true },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

  const isCaptain = team.captainId === ctx.userId;

  // captain 시야 — 본 팀 활성 권한 row 전체
  if (isCaptain) {
    const grants = await prisma.teamOfficerPermissions.findMany({
      where: { teamId, revokedAt: null },
      orderBy: { grantedAt: "desc" },
      include: {
        user: { select: { id: true, nickname: true, name: true, profile_image: true } },
      },
    });
    return apiSuccess({
      role: "captain",
      grants: grants.map((g) => ({
        id: g.id.toString(),
        userId: g.userId.toString(),
        permissions: g.permissions,
        grantedAt: g.grantedAt.toISOString(),
        user: g.user
          ? {
              id: g.user.id.toString(),
              nickname: g.user.nickname,
              name: g.user.name,
              profile_image: g.user.profile_image,
            }
          : null,
      })),
    });
  }

  // 비-captain 시야 — 본인의 활성 권한 1건만
  const myGrant = await prisma.teamOfficerPermissions.findFirst({
    where: { teamId, userId: ctx.userId, revokedAt: null },
    select: { id: true, permissions: true, grantedAt: true },
  });
  return apiSuccess({
    role: "member",
    myGrant: myGrant
      ? {
          id: myGrant.id.toString(),
          permissions: myGrant.permissions,
          grantedAt: myGrant.grantedAt.toISOString(),
        }
      : null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — 위임 신설 또는 기존 활성 row 의 permissions UPDATE
// ─────────────────────────────────────────────────────────────────────────────
// captain only. 같은 (team, user) 활성 row 가 이미 있으면 permissions 만 UPDATE
// (UNIQUE 위반 회피). 없으면 신설.
export const POST = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  let teamId: bigint;
  try {
    teamId = BigInt(id);
  } catch {
    return apiError("INVALID_TEAM_ID", 400);
  }

  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return apiError("INVALID_JSON", 400);
  }
  let parsed: z.infer<typeof PostBodySchema>;
  try {
    const result = PostBodySchema.safeParse(bodyRaw);
    if (!result.success) {
      return apiError(
        `INVALID_PAYLOAD: ${result.error.issues.map((i) => i.message).join(", ")}`,
        400,
      );
    }
    parsed = result.data;
  } catch {
    return apiError("INVALID_USER_ID", 400);
  }
  const { userId: targetUserId, permissions } = parsed;

  // captain 검증
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, captainId: true, name: true },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404);
  if (team.captainId !== ctx.userId) {
    return apiError("FORBIDDEN", 403, "팀장만 권한을 위임할 수 있습니다.");
  }

  // 자기 자신에게 위임 차단 (captain 은 이미 모든 권한 보유)
  if (targetUserId === ctx.userId) {
    return apiError("CANNOT_GRANT_TO_SELF", 400, "본인에게는 위임할 수 없습니다.");
  }

  // 위임 대상 검증 — 본 팀 active 멤버 + role IN (manager/coach/treasurer/director)
  const targetMember = await prisma.teamMember.findFirst({
    where: { teamId, userId: targetUserId, status: "active" },
    select: { id: true, role: true },
  });
  if (!targetMember) {
    return apiError(
      "TARGET_NOT_TEAM_MEMBER",
      404,
      "위임 대상이 본 팀의 활성 멤버가 아닙니다.",
    );
  }
  if (!DELEGABLE_ROLES.includes(targetMember.role as (typeof DELEGABLE_ROLES)[number])) {
    return apiError(
      "TARGET_ROLE_NOT_DELEGABLE",
      400,
      `위임 가능한 직급(${DELEGABLE_ROLES.join("/")}) 만 위임 가능합니다. 현재 직급: ${targetMember.role ?? "없음"}`,
    );
  }

  // 기존 활성 row 조회 — 있으면 UPDATE, 없으면 신설
  const existing = await prisma.teamOfficerPermissions.findFirst({
    where: { teamId, userId: targetUserId, revokedAt: null },
    select: { id: true },
  });

  let grantedRow;
  if (existing) {
    grantedRow = await prisma.teamOfficerPermissions.update({
      where: { id: existing.id },
      data: { permissions, grantedById: ctx.userId },
      select: { id: true, permissions: true, grantedAt: true },
    });
  } else {
    grantedRow = await prisma.teamOfficerPermissions.create({
      data: { teamId, userId: targetUserId, permissions, grantedById: ctx.userId },
      select: { id: true, permissions: true, grantedAt: true },
    });
  }

  // 알림 — 위임받은 자에게 통보 (silent fail)
  createNotification({
    userId: targetUserId,
    notificationType: NOTIFICATION_TYPES.TEAM_OFFICER_PERMISSION_GRANTED,
    title: `[${team.name ?? "팀"}] 운영진 권한이 위임되었습니다`,
    content: `팀장이 운영진 권한을 위임했습니다. 본인 권한은 마이페이지/팀 페이지에서 확인할 수 있습니다.`,
    actionUrl: `/teams/${teamId}`,
    notifiableType: "team_officer_permissions",
    notifiableId: grantedRow.id,
  }).catch(() => {});

  return apiSuccess({
    grant: {
      id: grantedRow.id.toString(),
      permissions: grantedRow.permissions,
      grantedAt: grantedRow.grantedAt.toISOString(),
    },
    updated: !!existing,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — 위임 회수 (revokedAt = now())
// ─────────────────────────────────────────────────────────────────────────────
// 이유: 권한 row 자체를 DELETE 하면 위임 이력이 사라짐. revoked_at = now() 로 soft delete
//   → 동일 (team, user) 에 다시 위임 시 신규 row INSERT 가능 (UNIQUE 룰 통과 — revokedAt 분기).
export const DELETE = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  let teamId: bigint;
  try {
    teamId = BigInt(id);
  } catch {
    return apiError("INVALID_TEAM_ID", 400);
  }

  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return apiError("INVALID_JSON", 400);
  }
  let parsed: z.infer<typeof DeleteBodySchema>;
  try {
    const result = DeleteBodySchema.safeParse(bodyRaw);
    if (!result.success) {
      return apiError(
        `INVALID_PAYLOAD: ${result.error.issues.map((i) => i.message).join(", ")}`,
        400,
      );
    }
    parsed = result.data;
  } catch {
    return apiError("INVALID_USER_ID", 400);
  }
  const { userId: targetUserId } = parsed;

  // captain 검증
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, captainId: true, name: true },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404);
  if (team.captainId !== ctx.userId) {
    return apiError("FORBIDDEN", 403, "팀장만 권한을 회수할 수 있습니다.");
  }

  // 활성 row 조회
  const active = await prisma.teamOfficerPermissions.findFirst({
    where: { teamId, userId: targetUserId, revokedAt: null },
    select: { id: true },
  });
  if (!active) {
    return apiError("NOT_FOUND", 404, "회수할 활성 권한이 없습니다.");
  }

  // soft delete
  await prisma.teamOfficerPermissions.update({
    where: { id: active.id },
    data: { revokedAt: new Date() },
  });

  // 알림 (silent fail)
  createNotification({
    userId: targetUserId,
    notificationType: NOTIFICATION_TYPES.TEAM_OFFICER_PERMISSION_REVOKED,
    title: `[${team.name ?? "팀"}] 운영진 권한이 회수되었습니다`,
    content: `팀장이 운영진 권한을 회수했습니다.`,
    actionUrl: `/teams/${teamId}`,
    notifiableType: "team_officer_permissions",
    notifiableId: active.id,
  }).catch(() => {});

  return apiSuccess({ revoked: true });
});
