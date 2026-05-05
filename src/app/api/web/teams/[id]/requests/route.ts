import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";

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
    return apiError("INVALID_TEAM_ID", 400);
  }

  // body 파싱 + zod 검증 (discriminatedUnion 으로 type 별 payload 자동 분기)
  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return apiError("INVALID_JSON", 400);
  }
  const parsed = RequestBodySchema.safeParse(bodyRaw);
  if (!parsed.success) {
    return apiError(
      `INVALID_PAYLOAD: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      400,
    );
  }
  const { requestType, payload, reason } = parsed.data;

  // 본인이 해당 팀 active 멤버인지 (신청 자격)
  const myMembership = await prisma.teamMember.findFirst({
    where: { teamId, userId: ctx.userId, status: "active" },
    select: { id: true, jerseyNumber: true },
  });
  if (!myMembership) {
    return apiError("NOT_TEAM_MEMBER", 403, "해당 팀의 활성 멤버만 신청할 수 있습니다.");
  }

  // 미묘 룰 #1: 같은 (team, user) status='pending' 1건만 허용
  // 이유: 동일 사용자가 type 별 다중 신청을 하면 승인 순서 모호 + 충돌. 1건 처리 후 다음.
  const pendingExisting = await prisma.teamMemberRequest.findFirst({
    where: { teamId, userId: ctx.userId, status: "pending" },
    select: { id: true, requestType: true },
  });
  if (pendingExisting) {
    return apiError(
      "ALREADY_PENDING",
      409,
      `이미 처리 대기 중인 신청이 있습니다 (type: ${pendingExisting.requestType}). 먼저 처리되어야 새 신청을 보낼 수 있습니다.`,
    );
  }

  // jersey_change: 사전 충돌 검증 (UNIQUE 같은 팀 active 멤버 jersey)
  // 이유: 충돌 번호 신청을 미리 차단해 팀장 부담 감소. 단, 승인 시점에도 재검증 (PR7+).
  let payloadOut: Prisma.InputJsonValue = payload as Prisma.InputJsonValue;
  if (requestType === "jersey_change") {
    const { newJersey } = payload;
    // 본인 현재 번호와 동일하면 의미 없는 신청 — 차단
    if (myMembership.jerseyNumber === newJersey) {
      return apiError("SAME_JERSEY", 400, "현재 번호와 동일합니다.");
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
        "JERSEY_CONFLICT",
        409,
        `등번호 #${newJersey} 는 이미 사용 중입니다. 다른 번호를 선택해 주세요.`,
      );
    }
  } else if (requestType === "dormant") {
    // dormant: until 미입력 시 +3개월 기본값 서버 계산 후 payload 에 저장
    const { until } = payload;
    let untilDate: Date;
    if (until) {
      untilDate = new Date(until);
      if (Number.isNaN(untilDate.getTime())) {
        return apiError("INVALID_UNTIL", 400, "휴면 종료일 형식이 올바르지 않습니다.");
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

  // 팀장(captainId)에게 알림 — manager 권한자도 처리 가능하지만 알림은 captain 기본 (UI 에서 매니저도 동일 inbox 노출)
  // 이유: 다중 알림 발송은 본 PR6 범위 외 (Phase 4 PR12 권한 위임 후 일괄 알림 룰 검토).
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

  if (team?.captainId) {
    createNotification({
      userId: team.captainId,
      notificationType: NOTIFICATION_TYPES.TEAM_MEMBER_REQUEST_NEW,
      title: `[${team.name ?? "팀"}] 새 ${typeLabel} 신청`,
      content: `${applicantName} 님이 ${typeLabel} 신청을 보냈습니다.`,
      actionUrl: `/teams/${teamId}/manage/requests`,
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
    return apiError("INVALID_TEAM_ID", 400);
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, captainId: true },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

  // 권한 결정 — captain 또는 manager(active) 면 팀 전체 조회, 아니면 본인 신청만
  // (Phase 4 PR12 에서 team_officer_permissions 통합 — 본 PR6 은 captain + manager 만)
  const isCaptain = team.captainId === ctx.userId;
  let isManager = false;
  if (!isCaptain) {
    const mgr = await prisma.teamMember.findFirst({
      where: { teamId, userId: ctx.userId, role: "manager", status: "active" },
      select: { id: true },
    });
    isManager = !!mgr;
  }
  const canSeeAll = isCaptain || isManager;

  // 일반 멤버는 active 멤버 자격 확인 (탈퇴 후엔 본인 이력만 별도 확인 — Phase 2 PR9 에서)
  if (!canSeeAll) {
    const myMembership = await prisma.teamMember.findFirst({
      where: { teamId, userId: ctx.userId, status: "active" },
      select: { id: true },
    });
    if (!myMembership) return apiError("FORBIDDEN", 403);
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
