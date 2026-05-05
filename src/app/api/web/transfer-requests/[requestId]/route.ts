import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 3 PR10 — 팀 이적 승인/거부 (양쪽 팀장 state machine)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 양쪽 팀장 (fromTeam captain / toTeam captain) 이 각자 자기 사이드를 승인/거부.
//   - side='from' approve → fromTeamStatus='approved'
//   - side='to' approve   → toTeamStatus='approved'
//   - 둘 다 approved      → finalStatus='approved' + 자동 이동 트리거
//   - 한쪽 reject         → finalStatus='rejected' (즉시 종결, 다른 사이드 처리 차단)
// 자동 이동 (둘 다 approved):
//   1. fromTeam 본인 row UPDATE status='withdrawn' (history 보존)
//   2. toTeam   본인 row INSERT status='active', role='member', jerseyNumber=NULL
//   3. team_member_history 2건 (transferred_out / transferred_in)
//   모두 단일 prisma.$transaction.
// 미묘 룰: 이미 처리된 사이드 재처리 차단 + rejected 후 다른 사이드 처리 차단.
// ─────────────────────────────────────────────────────────────────────────────

type RouteCtx = { params: Promise<{ requestId: string }> };

const PatchBodySchema = z.object({
  side: z.enum(["from", "to"]),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

export const PATCH = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { requestId } = await routeCtx.params;

  let reqId: bigint;
  try {
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
  const { side, action, rejectionReason } = parsed.data;

  // 신청 + 양쪽 팀 정보 동시 로드
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: reqId },
    include: {
      fromTeam: { select: { id: true, name: true, captainId: true } },
      toTeam: { select: { id: true, name: true, captainId: true } },
      user: { select: { id: true, nickname: true, name: true } },
    },
  });
  if (!transfer) return apiError("NOT_FOUND", 404);

  // 최종 종결된 신청은 재처리 불가
  if (transfer.finalStatus !== "pending") {
    return apiError(
      "ALREADY_FINALIZED",
      409,
      `이미 종결된 신청입니다 (${transfer.finalStatus}).`,
    );
  }

  // 권한 검증 — 해당 사이드 captain 만 자기 사이드 처리 가능
  const isFromCaptain = transfer.fromTeam.captainId === ctx.userId;
  const isToCaptain = transfer.toTeam.captainId === ctx.userId;

  if (side === "from" && !isFromCaptain) {
    return apiError("FORBIDDEN", 403, "현 팀의 팀장만 이 사이드를 처리할 수 있습니다.");
  }
  if (side === "to" && !isToCaptain) {
    return apiError("FORBIDDEN", 403, "새 팀의 팀장만 이 사이드를 처리할 수 있습니다.");
  }

  // 이미 처리한 사이드 재처리 차단
  const sideStatus = side === "from" ? transfer.fromTeamStatus : transfer.toTeamStatus;
  if (sideStatus !== "pending") {
    return apiError(
      "ALREADY_PROCESSED",
      409,
      `해당 사이드는 이미 처리되었습니다 (${sideStatus}).`,
    );
  }

  // rejected 된 다른 사이드가 있으면 처리 차단 (방어 — finalStatus 검사로 이미 잡혀야 함)
  const otherStatus = side === "from" ? transfer.toTeamStatus : transfer.fromTeamStatus;
  if (otherStatus === "rejected") {
    return apiError(
      "ALREADY_REJECTED",
      409,
      "다른 사이드에서 이미 거부된 신청입니다.",
    );
  }

  const rejectionReasonClean =
    action === "reject" && rejectionReason ? rejectionReason : null;
  const now = new Date();
  const newSideStatus = action === "approve" ? "approved" : "rejected";

  // ─────────────────────────────────────────────────────
  // state machine 결정
  // ─────────────────────────────────────────────────────
  // 이유(왜): 이번 결정으로 finalStatus 가 결정되는지 확인 후 그에 맞춰 트랜잭션 ops 구성.
  //   - reject → finalStatus 즉시 'rejected'
  //   - approve + 다른 사이드도 'approved' → finalStatus 'approved' + 자동 이동
  //   - approve + 다른 사이드 'pending'  → finalStatus 그대로 'pending' (대기)
  let newFinalStatus: "pending" | "approved" | "rejected" = "pending";
  let triggersTransfer = false;
  if (action === "reject") {
    newFinalStatus = "rejected";
  } else {
    // approve — 다른 사이드 상태에 따라 분기
    if (otherStatus === "approved") {
      newFinalStatus = "approved";
      triggersTransfer = true; // 자동 이동 트리거
    } else {
      newFinalStatus = "pending";
    }
  }

  // ─────────────────────────────────────────────────────
  // 트랜잭션 ops 구성
  // ─────────────────────────────────────────────────────
  // 모든 작업을 단일 prisma.$transaction 으로 묶어 부분 실패 시 롤백 보장.
  // jersey_number = NULL 로 to_team INSERT — 새 팀에서 다시 입력 받음 (충돌 회피).

  // Prisma 가 FK relation 필드 직접 업데이트는 connect 형태 요구 — fromProcessedBy relation 사용
  const updateData: Prisma.TransferRequestUpdateInput =
    side === "from"
      ? {
          fromTeamStatus: newSideStatus,
          fromProcessedBy: { connect: { id: ctx.userId } },
          fromProcessedAt: now,
          fromRejectionReason: rejectionReasonClean,
          finalStatus: newFinalStatus,
        }
      : {
          toTeamStatus: newSideStatus,
          toProcessedBy: { connect: { id: ctx.userId } },
          toProcessedAt: now,
          toRejectionReason: rejectionReasonClean,
          finalStatus: newFinalStatus,
        };

  const txOps: Prisma.PrismaPromise<unknown>[] = [
    prisma.transferRequest.update({
      where: { id: reqId },
      data: updateData,
      select: {
        id: true,
        finalStatus: true,
        fromTeamStatus: true,
        toTeamStatus: true,
      },
    }),
  ];

  // 자동 이동 트리거 — 양쪽 모두 approved 인 마지막 처리 시점
  // ⚠ 이 트랜잭션 안에서 fromMember 조회는 미리 해서 jersey/position 박제
  let fromMemberSnapshot: {
    id: bigint;
    jerseyNumber: number | null;
    position: string | null;
    role: string | null;
  } | null = null;

  if (triggersTransfer) {
    // 신청자가 그 사이 fromTeam active 가 아닌 경우 (예: 휴면/탈퇴) 차단
    fromMemberSnapshot = await prisma.teamMember.findFirst({
      where: { teamId: transfer.fromTeamId, userId: transfer.userId, status: "active" },
      select: { id: true, jerseyNumber: true, position: true, role: true },
    });
    if (!fromMemberSnapshot) {
      return apiError(
        "APPLICANT_NOT_ACTIVE",
        409,
        "신청자가 더 이상 현 팀의 활성 멤버가 아닙니다.",
      );
    }

    // 그 사이 toTeam active 멤버가 되었으면 차단 (어떤 경로로든 이중 가입 방지)
    const reCheckTo = await prisma.teamMember.findFirst({
      where: { teamId: transfer.toTeamId, userId: transfer.userId, status: "active" },
      select: { id: true },
    });
    if (reCheckTo) {
      return apiError(
        "ALREADY_TO_TEAM_MEMBER",
        409,
        "신청자가 이미 새 팀의 활성 멤버입니다.",
      );
    }

    // 1. fromTeam 본인 row → status='withdrawn' (history 보존, DELETE X)
    txOps.push(
      prisma.teamMember.update({
        where: { id: fromMemberSnapshot.id },
        data: { status: "withdrawn" },
      }),
    );

    // 2. toTeam 본인 row INSERT (status='active', role='member', jersey/position NULL)
    //    이유: 새 팀에서 다시 등번호 입력 받음 — 충돌 회피 (옵션 C+UI 정신: historical 보존)
    txOps.push(
      prisma.teamMember.create({
        data: {
          teamId: transfer.toTeamId,
          userId: transfer.userId,
          role: "member",
          status: "active",
          jerseyNumber: null,
          position: null,
        },
      }),
    );

    // 3. team_member_history 2건 INSERT (transferred_out / transferred_in)
    const transferredOutPayload: Prisma.InputJsonValue = {
      transferRequestId: transfer.id.toString(),
      fromTeamId: transfer.fromTeamId.toString(),
      toTeamId: transfer.toTeamId.toString(),
      prevJersey: fromMemberSnapshot.jerseyNumber,
      prevPosition: fromMemberSnapshot.position,
      prevRole: fromMemberSnapshot.role,
      reason: transfer.reason ?? null,
    };
    const transferredInPayload: Prisma.InputJsonValue = {
      transferRequestId: transfer.id.toString(),
      fromTeamId: transfer.fromTeamId.toString(),
      toTeamId: transfer.toTeamId.toString(),
      reason: transfer.reason ?? null,
    };
    txOps.push(
      prisma.teamMemberHistory.create({
        data: {
          teamId: transfer.fromTeamId,
          userId: transfer.userId,
          eventType: "transferred_out",
          payload: transferredOutPayload,
          reason: transfer.reason ?? null,
          createdById: ctx.userId,
        },
      }),
      prisma.teamMemberHistory.create({
        data: {
          teamId: transfer.toTeamId,
          userId: transfer.userId,
          eventType: "transferred_in",
          payload: transferredInPayload,
          reason: transfer.reason ?? null,
          createdById: ctx.userId,
        },
      }),
    );
  }

  // ─────────────────────────────────────────────────────
  // 트랜잭션 실행
  // ─────────────────────────────────────────────────────
  const txResults = await prisma.$transaction(txOps);
  const updated = txResults[0] as {
    id: bigint;
    finalStatus: string;
    fromTeamStatus: string;
    toTeamStatus: string;
  };

  // ─────────────────────────────────────────────────────
  // 알림 발송 — 액션/최종 상태별 분기
  // ─────────────────────────────────────────────────────
  // 이유: 신청자 + 다른 사이드 captain 에게 진행 상태 통보. 최종 완료/거부 시점에는
  //   양쪽 팀 captain 모두에게 결과 통보.
  const applicantName = transfer.user?.nickname ?? transfer.user?.name ?? "회원";
  const fromTeamName = transfer.fromTeam.name ?? "현 팀";
  const toTeamName = transfer.toTeam.name ?? "새 팀";

  // 비동기 알림 — silent fail (운영 부하 회피)
  if (newFinalStatus === "rejected") {
    // 거부 — 신청자 + 다른 사이드 captain 에게 통보 (정보용)
    createNotification({
      userId: transfer.userId,
      notificationType: NOTIFICATION_TYPES.TRANSFER_REQUEST_REJECTED,
      title: `[이적 거부] ${fromTeamName} → ${toTeamName}`,
      content:
        side === "from"
          ? `현 팀장이 이적을 거부했습니다.${rejectionReasonClean ? ` 사유: ${rejectionReasonClean}` : ""}`
          : `새 팀장이 이적을 거부했습니다.${rejectionReasonClean ? ` 사유: ${rejectionReasonClean}` : ""}`,
      actionUrl: `/profile`,
      notifiableType: "transfer_request",
      notifiableId: transfer.id,
    }).catch(() => {});

    // 다른 사이드 captain 에게도 정보 알림 (이미 처리한 경우 X — 그대로 두면 됨)
    const otherCaptainId = side === "from" ? transfer.toTeam.captainId : transfer.fromTeam.captainId;
    if (otherCaptainId && otherCaptainId !== ctx.userId) {
      createNotification({
        userId: otherCaptainId,
        notificationType: NOTIFICATION_TYPES.TRANSFER_REQUEST_REJECTED,
        title: `[이적 거부] ${applicantName} (${fromTeamName} → ${toTeamName})`,
        content:
          side === "from"
            ? `현 팀장이 이적을 거부해 신청이 종결되었습니다.`
            : `새 팀장이 이적을 거부해 신청이 종결되었습니다.`,
        actionUrl: `/teams/${side === "from" ? transfer.toTeamId : transfer.fromTeamId}/manage?tab=member-requests`,
        notifiableType: "transfer_request",
        notifiableId: transfer.id,
      }).catch(() => {});
    }
  } else if (newFinalStatus === "approved") {
    // 최종 승인 — 자동 이동 완료, 신청자 + 양쪽 팀 captain 에게 통보
    createNotification({
      userId: transfer.userId,
      notificationType: NOTIFICATION_TYPES.TRANSFER_REQUEST_APPROVED,
      title: `[이적 완료] ${fromTeamName} → ${toTeamName}`,
      content: `양쪽 팀장 모두 승인하여 ${toTeamName} 멤버로 이동했습니다. 새 팀에서 등번호를 등록해 주세요.`,
      actionUrl: `/teams/${transfer.toTeamId}`,
      notifiableType: "transfer_request",
      notifiableId: transfer.id,
    }).catch(() => {});

    // 양쪽 팀 captain — 본인이 막 처리한 사이드는 본인 감지로 알림 X (createNotification 호출 자체 skip)
    if (transfer.fromTeam.captainId && transfer.fromTeam.captainId !== ctx.userId) {
      createNotification({
        userId: transfer.fromTeam.captainId,
        notificationType: NOTIFICATION_TYPES.TRANSFER_REQUEST_APPROVED,
        title: `[이적 완료] ${applicantName} (${fromTeamName} → ${toTeamName})`,
        content: `${applicantName} 님이 ${toTeamName} 으로 이적했습니다.`,
        actionUrl: `/teams/${transfer.fromTeamId}`,
        notifiableType: "transfer_request",
        notifiableId: transfer.id,
      }).catch(() => {});
    }
    if (transfer.toTeam.captainId && transfer.toTeam.captainId !== ctx.userId) {
      createNotification({
        userId: transfer.toTeam.captainId,
        notificationType: NOTIFICATION_TYPES.TRANSFER_REQUEST_APPROVED,
        title: `[이적 완료] ${applicantName} 합류`,
        content: `${applicantName} 님이 ${fromTeamName} 에서 이적해 합류했습니다.`,
        actionUrl: `/teams/${transfer.toTeamId}`,
        notifiableType: "transfer_request",
        notifiableId: transfer.id,
      }).catch(() => {});
    }
  } else {
    // pending 상태 유지 (현 팀장 승인 → 새 팀장 알림 발송)
    if (side === "from" && action === "approve") {
      // 현 팀장 승인 → 새 팀장에게 결정 요청 알림
      if (transfer.toTeam.captainId) {
        createNotification({
          userId: transfer.toTeam.captainId,
          notificationType: NOTIFICATION_TYPES.TRANSFER_REQUEST_NEW_TO,
          title: `[${toTeamName}] ${applicantName} 님 합류 신청`,
          content: `${fromTeamName} 의 ${applicantName} 님이 이적을 신청했고 현 팀장이 승인했습니다. 합류 여부를 결정해 주세요.`,
          actionUrl: `/teams/${transfer.toTeamId}/manage?tab=member-requests`,
          notifiableType: "transfer_request",
          notifiableId: transfer.id,
        }).catch(() => {});
      }
      // 신청자에게도 진행 상태 통보 (현 팀장 승인 단계 통과)
      createNotification({
        userId: transfer.userId,
        notificationType: NOTIFICATION_TYPES.TRANSFER_REQUEST_APPROVED,
        title: `[이적 진행] 현 팀장 승인 완료`,
        content: `${fromTeamName} 팀장이 이적을 승인했습니다. 이제 ${toTeamName} 팀장 결정을 기다립니다.`,
        actionUrl: `/profile`,
        notifiableType: "transfer_request",
        notifiableId: transfer.id,
      }).catch(() => {});
    }
    // side='to' approve + 다른 쪽 pending — 매우 드문 케이스 (보통 from 먼저). 신청자 알림만.
  }

  return apiSuccess({
    transferRequest: {
      id: updated.id.toString(),
      finalStatus: updated.finalStatus,
      fromTeamStatus: updated.fromTeamStatus,
      toTeamStatus: updated.toTeamStatus,
      triggersTransfer,
    },
  });
});
