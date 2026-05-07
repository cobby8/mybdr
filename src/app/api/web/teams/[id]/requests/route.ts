import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";
// Phase 4 PR13 — GET 시야 결정 (captain 또는 jersey/dormant/withdraw 중 1개 위임받은 자)
import { hasTeamOfficerPermission } from "@/lib/team-members/permissions";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 2 PR6 — 팀 멤버 라이프사이클 통합 신청 API
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 번호 변경 / 휴면 / 탈퇴 신청을 단일 엔드포인트로 통합. type 별 payload
//   schema 만 다르고 신청/승인 워크플로 자체는 공통. 본 PR6 = 인프라만, type 별 실제
//   동작 (jersey UPDATE / dormant 처리 / withdraw 처리) 은 PR7+ dispatcher 에서.
// 미묘 룰 #1 (보고서 §8): 같은 (team, user) status='pending' 1건만 허용 (409 ALREADY_PENDING).
// ─────────────────────────────────────────────────────────────────────────────

type RouteCtx = { params: Promise<{ id: string }> };

// type 별 payload schema (zod) — POST 시 type 에 따라 분기 검증
// jersey_change: 새 등번호 0~99 (PR2 와 동일 범위)
// dormant: 종료일 ISO 문자열 선택 (기본 +3개월)
// withdraw: payload 빈 객체
const JerseyChangePayload = z.object({
  newJersey: z.number().int().min(0).max(99),
});
const DormantPayload = z.object({
  // ISO 8601 datetime/date 모두 허용 — 빈 입력 시 기본 +3개월 (서버 계산)
  until: z.string().datetime().optional().or(z.string().date().optional()),
});
const WithdrawPayload = z.object({}).strict();

const RequestBodySchema = z.discriminatedUnion("requestType", [
  z.object({
    requestType: z.literal("jersey_change"),
    payload: JerseyChangePayload,
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({
    requestType: z.literal("dormant"),
    payload: DormantPayload,
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({
    requestType: z.literal("withdraw"),
    payload: WithdrawPayload,
    reason: z.string().trim().max(500).optional(),
  }),
]);

// POST /api/web/teams/[id]/requests
// 본인이 자신의 팀에 대해 jersey_change / dormant / withdraw 신청
// 권한: 로그인 + 해당 팀 active 멤버
export const POST = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  let teamId: bigint;
  try {
    teamId = BigInt(id);
  } catch {
    // 사용자 친화 한국어 메시지로 표기 + code 는 식별자로 보존
    return apiError("팀 ID가 올바르지 않습니다.", 400, "INVALID_TEAM_ID");
  }

  // body 파싱 + zod 검증 (discriminatedUnion 으로 type 별 payload 자동 분기)
  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return apiError("요청 데이터를 읽을 수 없습니다.", 400, "INVALID_JSON");
  }
  const parsed = RequestBodySchema.safeParse(bodyRaw);
  if (!parsed.success) {
    return apiError(
      `신청 데이터가 올바르지 않습니다: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      400,
      "INVALID_PAYLOAD",
    );
  }
  const { requestType, payload, reason } = parsed.data;

  // 본인이 해당 팀 active 멤버인지 (신청 자격)
  const myMembership = await prisma.teamMember.findFirst({
    where: { teamId, userId: ctx.userId, status: "active" },
    select: { id: true, jerseyNumber: true },
  });
  if (!myMembership) {
    return apiError("해당 팀의 활성 멤버만 신청할 수 있습니다.", 403, "NOT_TEAM_MEMBER");
  }

  // 미묘 룰 #1: 같은 (team, user) status='pending' 1건만 허용
  // 이유: 동일 사용자가 type 별 다중 신청을 하면 승인 순서 모호 + 충돌. 1건 처리 후 다음.
  const pendingExisting = await prisma.teamMemberRequest.findFirst({
    where: { teamId, userId: ctx.userId, status: "pending" },
    select: { id: true, requestType: true },
  });
  if (pendingExisting) {
    return apiError(
      `이미 처리 대기 중인 신청이 있습니다 (type: ${pendingExisting.requestType}). 먼저 처리되어야 새 신청을 보낼 수 있습니다.`,
      409,
      "ALREADY_PENDING",
    );
  }

  // jersey_change: 사전 충돌 검증 (UNIQUE 같은 팀 active 멤버 jersey)
  // 이유: 충돌 번호 신청을 미리 차단해 팀장 부담 감소. 단, 승인 시점에도 재검증 (PR7+).
  let payloadOut: Prisma.InputJsonValue = payload as Prisma.InputJsonValue;
  if (requestType === "jersey_change") {
    const { newJersey } = payload;
    // 본인 현재 번호와 동일하면 의미 없는 신청 — 차단
    if (myMembership.jerseyNumber === newJersey) {
      return apiError("현재 번호와 동일합니다.", 400, "SAME_JERSEY");
    }
    const conflict = await prisma.teamMember.findFirst({
      where: {
        teamId,
        jerseyNumber: newJersey,
        status: "active",
        NOT: { userId: ctx.userId },
      },
      select: { id: true, userId: true },
    });
    if (conflict) {
      return apiError(
        `등번호 #${newJersey} 는 이미 사용 중입니다. 다른 번호를 선택해 주세요.`,
        409,
        "JERSEY_CONFLICT",
      );
    }
  } else if (requestType === "dormant") {
    // dormant: until 미입력 시 +3개월 기본값 서버 계산 후 payload 에 저장
    const { until } = payload;
    let untilDate: Date;
    if (until) {
      untilDate = new Date(until);
      if (Number.isNaN(untilDate.getTime())) {
        return apiError("휴면 종료일 형식이 올바르지 않습니다.", 400, "INVALID_UNTIL");
      }
    } else {
      untilDate = new Date();
      untilDate.setMonth(untilDate.getMonth() + 3);
    }
    payloadOut = { until: untilDate.toISOString() } satisfies Prisma.InputJsonValue;
  }

  // 신청 INSERT — DB 레벨에서 status default='pending'
  const created = await prisma.teamMemberRequest.create({
    data: {
      teamId,
      userId: ctx.userId,
      requestType,
      payload: payloadOut,
      reason: reason ?? null,
    },
    select: { id: true, requestType: true, status: true, createdAt: true },
  });

  // 팀장 + 위임받은 자(해당 type 권한 보유) 에게 알림 (PR13)
  // 이유(왜): captain 만 알림 받으면 위임받은 운영진이 인박스 신청을 모르고 미처리. 따라서
  //   captain 자동 + permissions JSON 의 해당 키 true 인 활성 권한 row 모두 발송.
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true, captainId: true },
  });
  const applicant = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { nickname: true, name: true },
  });
  const applicantName = applicant?.nickname ?? applicant?.name ?? "회원";
  const typeLabel =
    requestType === "jersey_change" ? "번호 변경" : requestType === "dormant" ? "휴면" : "탈퇴";

  // 권한 키 매핑 — type → 위임 키
  const permissionKey =
    requestType === "jersey_change"
      ? "jerseyChangeApprove"
      : requestType === "dormant"
      ? "dormantApprove"
      : "withdrawApprove";

  // 알림 대상자 후보 = captain + 활성 권한 row 의 userId 들
  const recipientIds = new Set<bigint>();
  if (team?.captainId) recipientIds.add(team.captainId);
  const grants = await prisma.teamOfficerPermissions.findMany({
    where: { teamId, revokedAt: null },
    select: { userId: true, permissions: true },
  });
  for (const g of grants) {
    const perms = g.permissions as Record<string, unknown> | null;
    if (perms && perms[permissionKey] === true) {
      recipientIds.add(g.userId);
    }
  }

  for (const uid of recipientIds) {
    createNotification({
      userId: uid,
      notificationType: NOTIFICATION_TYPES.TEAM_MEMBER_REQUEST_NEW,
      title: `[${team?.name ?? "팀"}] 새 ${typeLabel} 신청`,
      content: `${applicantName} 님이 ${typeLabel} 신청을 보냈습니다.`,
      // 5/7 fix: `/manage/requests` sub-route 미존재 → 404. manage 페이지의 ?tab= 쿼리로
      // resolveInitialTab 가 'member-requests' 키로 매핑 (번호변경/휴면/탈퇴 통합 탭).
      // 5/7 v2: &req=${id} deep-link 추가 — 클라이언트가 해당 row scrollIntoView + highlight.
      actionUrl: `/teams/${teamId}/manage?tab=member-requests&req=${created.id}`,
      notifiableType: "team_member_request",
      notifiableId: created.id,
    }).catch(() => {});
  }

  return apiSuccess(
    {
      request: {
        id: created.id.toString(),
        requestType: created.requestType,
        status: created.status,
        createdAt: created.createdAt.toISOString(),
      },
    },
    201,
  );
});

// GET /api/web/teams/[id]/requests
// - 팀장/매니저: 해당 팀 모든 신청 조회 (status 필터 옵션)
// - 일반 멤버: 본인 신청만 조회
// 권한: 로그인 + 해당 팀 active 멤버 (또는 captain)
export const GET = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  let teamId: bigint;
  try {
    teamId = BigInt(id);
  } catch {
    return apiError("팀 ID가 올바르지 않습니다.", 400, "INVALID_TEAM_ID");
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404, "TEAM_NOT_FOUND");

  // 권한 결정 — PR13: captain 또는 jersey/dormant/withdraw 중 1개라도 위임받은 자
  // 이유(왜): 위임받은 운영진이 본인이 처리할 수 있는 신청 종류를 인박스에서 확인 가능해야 함.
  //   3 권한 중 어느 하나라도 있으면 본 팀 신청 전체 조회 (실제 PATCH 시 권한별 재검증).
  const [canJersey, canDormant, canWithdraw] = await Promise.all([
    hasTeamOfficerPermission(teamId, ctx.userId, "jerseyChangeApprove"),
    hasTeamOfficerPermission(teamId, ctx.userId, "dormantApprove"),
    hasTeamOfficerPermission(teamId, ctx.userId, "withdrawApprove"),
  ]);
  const canSeeAll = canJersey || canDormant || canWithdraw;

  // 일반 멤버는 active 멤버 자격 확인 (탈퇴 후엔 본인 이력만 별도 확인 — Phase 2 PR9 에서)
  if (!canSeeAll) {
    const myMembership = await prisma.teamMember.findFirst({
      where: { teamId, userId: ctx.userId, status: "active" },
      select: { id: true },
    });
    if (!myMembership) return apiError("해당 팀의 활성 멤버만 조회할 수 있습니다.", 403, "FORBIDDEN");
  }

  // optional status 필터 — ?status=pending|approved|rejected|cancelled
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const validStatus = ["pending", "approved", "rejected", "cancelled"];

  const where: Prisma.TeamMemberRequestWhereInput = {
    teamId,
    ...(canSeeAll ? {} : { userId: ctx.userId }),
    ...(statusFilter && validStatus.includes(statusFilter) ? { status: statusFilter } : {}),
  };

  const requests = await prisma.teamMemberRequest.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, nickname: true, name: true, profile_image: true } },
      processedBy: { select: { id: true, nickname: true, name: true } },
    },
  });

  return apiSuccess({
    requests: requests.map((r) => ({
      id: r.id.toString(),
      teamId: r.teamId.toString(),
      userId: r.userId.toString(),
      requestType: r.requestType,
      payload: r.payload,
      reason: r.reason,
      status: r.status,
      processedById: r.processedById?.toString() ?? null,
      processedAt: r.processedAt?.toISOString() ?? null,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      user: r.user
        ? {
            id: r.user.id.toString(),
            nickname: r.user.nickname,
            name: r.user.name,
            profile_image: r.user.profile_image,
          }
        : null,
      processedBy: r.processedBy
        ? {
            id: r.processedBy.id.toString(),
            nickname: r.processedBy.nickname,
            name: r.processedBy.name,
          }
        : null,
    })),
    canSeeAll,
  });
});
