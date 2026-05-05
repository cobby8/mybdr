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
  // dispatcher (PR7 부터 jersey_change 활성화 — dormant/withdraw 는 PR8/PR9)
  // ─────────────────────────────────────────────────────
  // 이유(왜): approve 시점에 type 별 실제 동작을 수행. status UPDATE + history INSERT
  //   와 함께 같은 prisma.$transaction 으로 묶어 일관성 보장.
  // jersey_change 경우 사전 검증(POST 시점)은 통과했어도 그 사이에 다른 멤버가 같은
  //   번호를 사용했을 수 있으므로 **승인 시점 재충돌 검증** 필수.
  // ⚠ ttp.jerseyNumber 자동 sync 는 의도적으로 제외 (옵션 C+UI = historical 보존).
  //   미래 대회 신청부터 PR3 의 자동 복사 hook 으로 새 번호가 적용된다.
  let oldJersey: number | null = null;
  let newJersey: number | null = null;
  if (action === "approve" && memberRequest.requestType === "jersey_change") {
    // payload 에서 newJersey 추출 (POST 시 zod 로 0~99 정수 보장됨)
    const payload = memberRequest.payload as { newJersey?: number } | null;
    if (!payload || typeof payload.newJersey !== "number") {
      return apiError("INVALID_PAYLOAD", 400, "신청 데이터가 손상되었습니다.");
    }
    newJersey = payload.newJersey;

    // 신청자의 현재 active 멤버 row 조회 (oldJersey 기록 + UPDATE 대상 식별)
    const myActive = await prisma.teamMember.findFirst({
      where: { teamId, userId: memberRequest.userId, status: "active" },
      select: { id: true, jerseyNumber: true },
    });
    if (!myActive) {
      // 신청자가 그 사이 탈퇴했거나 휴면 처리된 경우
      return apiError(
        "APPLICANT_NOT_ACTIVE",
        409,
        "신청자가 더 이상 활성 멤버가 아닙니다.",
      );
    }
    oldJersey = myActive.jerseyNumber ?? null;

    // 재충돌 검증 — 같은 팀 active 멤버 중 새 번호 사용자가 신청자 본인이 아니어야 함
    const conflict = await prisma.teamMember.findFirst({
      where: {
        teamId,
        jerseyNumber: newJersey,
        status: "active",
        NOT: { userId: memberRequest.userId },
      },
      select: { id: true },
    });
    if (conflict) {
      return apiError(
        "JERSEY_CONFLICT",
        409,
        `등번호 #${newJersey} 가 이미 사용 중입니다. 신청자에게 다른 번호를 신청하도록 안내해 주세요.`,
      );
    }
    // ⚠ 실제 UPDATE 는 아래 트랜잭션에서 status UPDATE/history INSERT 와 함께 수행.
  }
  // dormant / withdraw 는 PR8/PR9 에서 활성화 — 현재는 status UPDATE + history INSERT 만.

  // request 상태 UPDATE + history INSERT (+ jersey_change approve 시 team_members UPDATE) 트랜잭션
  // 이유(왜): jersey_change approve 분기 활성화 — status/history/team_members 3 작업을
  //   하나의 트랜잭션으로 묶어 부분 실패 시 일관성 보장 (request 만 approved 인데
  //   team_members.jersey_number 미반영 같은 사일런트 분기 방지).
  // history.eventType 명명:
  //   - reject 시: '{requestType}_rejected' (예: jersey_change_rejected)
  //   - approve 시: jersey_change → 'jersey_changed' (보고서 §3 명세) / 그 외 → '{requestType}_approved'
  const eventType =
    action === "approve" && memberRequest.requestType === "jersey_change"
      ? "jersey_changed"
      : `${memberRequest.requestType}_${newStatus}`;

  // history payload — jersey_change approve 는 보고서 §3 형식 ({old, new, reason}) 적용
  const historyPayload: Prisma.InputJsonValue =
    action === "approve" && memberRequest.requestType === "jersey_change"
      ? {
          requestId: memberRequest.id.toString(),
          requestType: memberRequest.requestType,
          old: oldJersey, // 변경 전 번호 (null 가능 — 미배정 상태)
          new: newJersey, // 변경 후 번호 (재충돌 검증 통과)
          reason: memberRequest.reason ?? null,
        }
      : {
          requestId: memberRequest.id.toString(),
          requestType: memberRequest.requestType,
          requestPayload: memberRequest.payload as Prisma.InputJsonValue,
          oldStatus: "pending",
          newStatus,
          ...(rejectionReasonClean && { rejectionReason: rejectionReasonClean }),
        };

  // 트랜잭션 작업 배열 — jersey_change approve 시에만 team_members UPDATE 추가
  // 이유: prisma.$transaction 은 동일 batch 내 작업 모두 성공 or 모두 롤백 보장.
  const txOps: Prisma.PrismaPromise<unknown>[] = [
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
  ];

  // jersey_change approve — team_members.jersey_number UPDATE 추가
  if (action === "approve" && memberRequest.requestType === "jersey_change" && newJersey !== null) {
    txOps.push(
      prisma.teamMember.updateMany({
        // 이유: updateMany 사용 — (teamId, userId, status='active') 복합 조건 매칭.
        //   team_members.id 단일키 UPDATE 를 쓰려면 위에서 myActive.id 로 조회해뒀지만,
        //   updateMany 가 status 보호 + 중복 row 방지 (가능성 낮지만 안전망)
        where: { teamId, userId: memberRequest.userId, status: "active" },
        data: { jerseyNumber: newJersey },
      }),
    );
  }

  const txResults = await prisma.$transaction(txOps);
  // 첫 번째 결과 = teamMemberRequest.update — select 한 필드 반환
  const updated = txResults[0] as {
    id: bigint;
    requestType: string;
    status: string;
    processedAt: Date | null;
  };

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
