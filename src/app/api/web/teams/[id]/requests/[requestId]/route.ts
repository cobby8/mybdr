import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 2 PR6 — 팀 멤버 신청 승인/거부 (단건 PATCH)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 팀장/매니저가 pending 신청을 approve/reject 처리. PR6 = 인프라만, type 별
//   실제 동작 (jersey UPDATE / dormant 상태전환 / withdraw 명단삭제) 은 PR7+ dispatcher 에서.
// dispatcher 패턴: action='approve' 시 switch(requestType) 으로 분기 — PR6 은 placeholder TODO.
// 모든 처리는 history INSERT 로 이력 보존 (탈퇴 후에도 영구).
// 권한: captain (team.captainId) 또는 manager (team_members.role='manager' AND status='active')
//   Phase 4 PR12 에서 team_officer_permissions 통합 — 본 PR6 은 captain + manager 한정.
// ─────────────────────────────────────────────────────────────────────────────

type RouteCtx = { params: Promise<{ id: string; requestId: string }> };

const PatchBodySchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

export const PATCH = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id, requestId } = await routeCtx.params;

  let teamId: bigint;
  let reqId: bigint;
  try {
    teamId = BigInt(id);
    reqId = BigInt(requestId);
  } catch {
    return apiError("INVALID_ID", 400);
  }

  // body 파싱
  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return apiError("INVALID_JSON", 400);
  }
  const parsed = PatchBodySchema.safeParse(bodyRaw);
  if (!parsed.success) {
    return apiError(
      `INVALID_PAYLOAD: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      400,
    );
  }
  const { action, rejectionReason } = parsed.data;

  // 신청 조회 + 팀 일치 확인
  const memberRequest = await prisma.teamMemberRequest.findUnique({
    where: { id: reqId },
    include: {
      team: { select: { id: true, captainId: true, name: true } },
      user: { select: { id: true, nickname: true, name: true } },
    },
  });
  if (!memberRequest || memberRequest.teamId !== teamId) {
    return apiError("NOT_FOUND", 404);
  }
  if (memberRequest.status !== "pending") {
    return apiError("ALREADY_PROCESSED", 409, "이미 처리된 신청입니다.");
  }

  // 권한 검증 — captain or manager(active)
  const isCaptain = memberRequest.team.captainId === ctx.userId;
  let isManager = false;
  if (!isCaptain) {
    const mgr = await prisma.teamMember.findFirst({
      where: { teamId, userId: ctx.userId, role: "manager", status: "active" },
      select: { id: true },
    });
    isManager = !!mgr;
  }
  if (!isCaptain && !isManager) {
    return apiError("FORBIDDEN", 403, "팀장 또는 매니저만 처리할 수 있습니다.");
  }

  // 거부 사유 정리
  const rejectionReasonClean =
    action === "reject" && rejectionReason ? rejectionReason : null;

  const now = new Date();
  const newStatus = action === "approve" ? "approved" : "rejected";

  // ─────────────────────────────────────────────────────
  // dispatcher (PR6 = placeholder TODO, PR7+ 에서 실제 동작 구현)
  // ─────────────────────────────────────────────────────
  // status UPDATE + history INSERT 는 트랜잭션으로 묶어 일관성 보장.
  // type 별 실제 변경 (jersey UPDATE / team_members.status='dormant' / 명단 삭제) 은
  // 본 트랜잭션 안에 PR7+ 에서 추가될 예정.
  if (action === "approve") {
    switch (memberRequest.requestType) {
      case "jersey_change":
        // TODO: PR7 — jersey_change 실제 처리
        // 1) 본인 team_members.jersey_number = payload.newJersey UPDATE (재충돌 검증)
        // 2) 본인 ttp.jerseyNumber 도 sync (선택, 활성 대회 한정)
        // 3) team_member_history INSERT (eventType='jersey_changed', payload={old, new})
        break;
      case "dormant":
        // TODO: PR8 — dormant 실제 처리
        // 1) team_members.status = 'dormant' UPDATE + dormant_until 컬럼 (Phase 2 추가)
        // 2) team_member_history INSERT (eventType='dormant')
        // 3) lazy 복구 룰 (보고서 §8 미묘 #2): 페이지 진입 시 expires_at 체크
        break;
      case "withdraw":
        // TODO: PR9 — withdraw 실제 처리
        // 1) team_members row DELETE (또는 status='withdrawn' 후 분기)
        // 2) team_member_history INSERT (eventType='withdrawn') — 명단 삭제해도 이력 보존
        // 3) tournament_team_players 활성 대회 영향 검토 (별도 룰)
        break;
    }
  }

  // request 상태 UPDATE + history INSERT 트랜잭션
  // history.eventType 명명: '{requestType}_{approved|rejected}' (예: jersey_change_approved)
  const eventType = `${memberRequest.requestType}_${newStatus}`;
  const historyPayload: Prisma.InputJsonValue = {
    requestId: memberRequest.id.toString(),
    requestType: memberRequest.requestType,
    requestPayload: memberRequest.payload as Prisma.InputJsonValue,
    oldStatus: "pending",
    newStatus,
    ...(rejectionReasonClean && { rejectionReason: rejectionReasonClean }),
  };

  const [updated] = await prisma.$transaction([
    prisma.teamMemberRequest.update({
      where: { id: reqId },
      data: {
        status: newStatus,
        processedById: ctx.userId,
        processedAt: now,
        rejectionReason: rejectionReasonClean,
      },
      select: {
        id: true,
        requestType: true,
        status: true,
        processedAt: true,
      },
    }),
    prisma.teamMemberHistory.create({
      data: {
        teamId,
        userId: memberRequest.userId,
        eventType,
        payload: historyPayload,
        reason: memberRequest.reason ?? null,
        createdById: ctx.userId,
      },
    }),
  ]);

  // 신청자에게 결과 알림
  const typeLabel =
    memberRequest.requestType === "jersey_change"
      ? "번호 변경"
      : memberRequest.requestType === "dormant"
      ? "휴면"
      : "탈퇴";
  const teamName = memberRequest.team.name ?? "팀";

  createNotification({
    userId: memberRequest.userId,
    notificationType:
      action === "approve"
        ? NOTIFICATION_TYPES.TEAM_MEMBER_REQUEST_APPROVED
        : NOTIFICATION_TYPES.TEAM_MEMBER_REQUEST_REJECTED,
    title:
      action === "approve"
        ? `[${teamName}] ${typeLabel} 신청 승인`
        : `[${teamName}] ${typeLabel} 신청 거부`,
    content:
      action === "approve"
        ? `${typeLabel} 신청이 승인되었습니다.`
        : rejectionReasonClean
        ? `${typeLabel} 신청이 거부되었습니다. 사유: ${rejectionReasonClean}`
        : `${typeLabel} 신청이 거부되었습니다.`,
    actionUrl: `/teams/${teamId}`,
    notifiableType: "team_member_request",
    notifiableId: memberRequest.id,
  }).catch(() => {});

  return apiSuccess({
    request: {
      id: updated.id.toString(),
      requestType: updated.requestType,
      status: updated.status,
      processedAt: updated.processedAt?.toISOString() ?? null,
    },
  });
});
