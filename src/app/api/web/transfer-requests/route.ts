import { z } from "zod";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 3 PR10 — 팀 이적 신청 API (양쪽 팀장 승인 state machine)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 본인이 팀 A 에서 팀 B 로 이동하기 위한 요청 채널. 단일 팀 신청
//   (TeamMemberRequest) 과 본질이 다르다 — 양쪽 팀장 모두 승인해야 자동 이동 트리거.
// state machine 진입점:
//   POST = 본인 신청 (fromTeam active 검증 + toTeam 미가입 검증 + pending 1건 룰)
//   GET  = 본인 이적 신청 목록 (마이페이지 진행 표시 카드용)
// 이적 별도 권한 = 본인만 신청 가능. 팀장이 멤버를 강제로 이적시키는 흐름은 미지원
//   (Phase 4 PR12 권한 위임 후 검토).
// ─────────────────────────────────────────────────────────────────────────────

// POST body schema
// fromTeamId / toTeamId 는 BigInt 컬럼 — 클라이언트는 string 으로 전송 받아 변환
const PostBodySchema = z.object({
  fromTeamId: z.string().min(1),
  toTeamId: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
});

// POST /api/web/transfer-requests
// 본인이 자기 자신을 위한 이적 신청 작성
// 권한: 로그인 + fromTeam active 멤버 (본인) + toTeam 비활성 멤버 (이미 가입 X)
export const POST = withWebAuth(async (req: Request, _ctx: unknown, ctx: WebAuthContext) => {
  // body 파싱 + zod
  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return apiError("INVALID_JSON", 400);
  }
  const parsed = PostBodySchema.safeParse(bodyRaw);
  if (!parsed.success) {
    return apiError(
      `INVALID_PAYLOAD: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      400,
    );
  }

  let fromTeamId: bigint;
  let toTeamId: bigint;
  try {
    fromTeamId = BigInt(parsed.data.fromTeamId);
    toTeamId = BigInt(parsed.data.toTeamId);
  } catch {
    return apiError("INVALID_TEAM_ID", 400);
  }
  const reason = parsed.data.reason ?? null;

  // fromTeam ≠ toTeam — 같은 팀 이적은 의미 없음
  if (fromTeamId === toTeamId) {
    return apiError("SAME_TEAM", 400, "이적할 팀은 현 팀과 달라야 합니다.");
  }

  // 본인이 fromTeam active 멤버인지 확인 (이적 자격)
  const fromMembership = await prisma.teamMember.findFirst({
    where: { teamId: fromTeamId, userId: ctx.userId, status: "active" },
    select: { id: true },
  });
  if (!fromMembership) {
    return apiError(
      "NOT_FROM_TEAM_MEMBER",
      403,
      "현재 팀의 활성 멤버만 이적을 신청할 수 있습니다.",
    );
  }

  // 본인이 toTeam 활성 멤버가 아닌지 확인 (이미 가입 시 차단)
  const existingToMember = await prisma.teamMember.findFirst({
    where: { teamId: toTeamId, userId: ctx.userId, status: "active" },
    select: { id: true },
  });
  if (existingToMember) {
    return apiError(
      "ALREADY_TO_TEAM_MEMBER",
      409,
      "이미 해당 팀의 활성 멤버입니다.",
    );
  }

  // 미묘 룰 확장 — pending 이적 1건만 허용
  const pendingTransfer = await prisma.transferRequest.findFirst({
    where: { userId: ctx.userId, finalStatus: "pending" },
    select: { id: true, fromTeamId: true, toTeamId: true },
  });
  if (pendingTransfer) {
    return apiError(
      "ALREADY_PENDING_TRANSFER",
      409,
      "이미 처리 대기 중인 이적 신청이 있습니다. 먼저 처리되어야 새 신청을 보낼 수 있습니다.",
    );
  }

  // 미묘 룰 #1 확장 — fromTeam 에 jersey_change/dormant/withdraw pending 동시 진행 차단
  // 이유: 휴면/탈퇴 신청 중인 사용자가 동시에 이적까지 신청하면 승인 순서에 따라
  //   상태가 불일치 (예: 휴면 승인 → active 가 아닌데 이적 자동이동 시도). 단순화 위해 차단.
  const pendingMember = await prisma.teamMemberRequest.findFirst({
    where: { teamId: fromTeamId, userId: ctx.userId, status: "pending" },
    select: { id: true, requestType: true },
  });
  if (pendingMember) {
    return apiError(
      "ALREADY_PENDING_MEMBER_REQUEST",
      409,
      `현 팀에 처리 대기 중인 멤버 신청 (${pendingMember.requestType}) 이 있습니다. 먼저 처리되어야 이적을 신청할 수 있습니다.`,
    );
  }

  // toTeam 존재 + captain 확인 (알림 대상)
  const toTeam = await prisma.team.findUnique({
    where: { id: toTeamId },
    select: { id: true, name: true, captainId: true, status: true },
  });
  if (!toTeam) {
    return apiError("TO_TEAM_NOT_FOUND", 404, "이적할 팀을 찾을 수 없습니다.");
  }
  if (toTeam.status === "dissolved") {
    return apiError("TO_TEAM_DISSOLVED", 409, "해당 팀은 해산되어 이적이 불가능합니다.");
  }

  // fromTeam 정보 (알림 대상)
  const fromTeam = await prisma.team.findUnique({
    where: { id: fromTeamId },
    select: { id: true, name: true, captainId: true },
  });
  if (!fromTeam) {
    return apiError("FROM_TEAM_NOT_FOUND", 404);
  }

  // INSERT — DB default fromTeamStatus/toTeamStatus/finalStatus = 'pending'
  const created = await prisma.transferRequest.create({
    data: {
      userId: ctx.userId,
      fromTeamId,
      toTeamId,
      reason,
    },
    select: {
      id: true,
      finalStatus: true,
      fromTeamStatus: true,
      toTeamStatus: true,
      createdAt: true,
    },
  });

  // 신청 시작 — 현 팀장에게만 알림 발송 (새 팀장은 현 팀장 승인 후 알림)
  // 이유: 흐름 명확화 — 현 팀장이 먼저 결정 → 그 후 새 팀장. 동시 알림 시 흐름 혼란.
  const applicant = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { nickname: true, name: true },
  });
  const applicantName = applicant?.nickname ?? applicant?.name ?? "회원";

  if (fromTeam.captainId) {
    createNotification({
      userId: fromTeam.captainId,
      notificationType: NOTIFICATION_TYPES.TRANSFER_REQUEST_NEW_FROM,
      title: `[${fromTeam.name ?? "팀"}] ${applicantName} 님의 이적 신청`,
      content: `${applicantName} 님이 ${toTeam.name ?? "다른 팀"} 으로의 이적을 신청했습니다.`,
      // 현 팀장 manage 페이지 변경 요청 탭으로 이동
      actionUrl: `/teams/${fromTeamId}/manage?tab=member-requests`,
      notifiableType: "transfer_request",
      notifiableId: created.id,
    }).catch(() => {});
  }

  return apiSuccess(
    {
      transferRequest: {
        id: created.id.toString(),
        userId: ctx.userId.toString(),
        fromTeamId: fromTeamId.toString(),
        toTeamId: toTeamId.toString(),
        finalStatus: created.finalStatus,
        fromTeamStatus: created.fromTeamStatus,
        toTeamStatus: created.toTeamStatus,
        createdAt: created.createdAt.toISOString(),
      },
    },
    201,
  );
});

// GET /api/web/transfer-requests
// 본인 이적 신청 목록 — 마이페이지 진행 표시 카드용
// 권한: 로그인. status filter 옵션 (?status=pending|approved|rejected)
export const GET = withWebAuth(async (req: Request, _ctx: unknown, ctx: WebAuthContext) => {
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const validStatus = ["pending", "approved", "rejected", "cancelled"];

  const where: Prisma.TransferRequestWhereInput = {
    userId: ctx.userId,
    ...(statusFilter && validStatus.includes(statusFilter) ? { finalStatus: statusFilter } : {}),
  };

  const transfers = await prisma.transferRequest.findMany({
    where,
    orderBy: [{ finalStatus: "asc" }, { createdAt: "desc" }],
    include: {
      fromTeam: { select: { id: true, name: true, logoUrl: true } },
      toTeam: { select: { id: true, name: true, logoUrl: true } },
    },
  });

  return apiSuccess({
    transferRequests: transfers.map((t) => ({
      id: t.id.toString(),
      userId: t.userId.toString(),
      fromTeamId: t.fromTeamId.toString(),
      toTeamId: t.toTeamId.toString(),
      reason: t.reason,
      fromTeamStatus: t.fromTeamStatus,
      toTeamStatus: t.toTeamStatus,
      finalStatus: t.finalStatus,
      fromProcessedAt: t.fromProcessedAt?.toISOString() ?? null,
      toProcessedAt: t.toProcessedAt?.toISOString() ?? null,
      fromRejectionReason: t.fromRejectionReason,
      toRejectionReason: t.toRejectionReason,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      fromTeam: t.fromTeam
        ? {
            id: t.fromTeam.id.toString(),
            name: t.fromTeam.name,
            logoUrl: t.fromTeam.logoUrl ?? null,
          }
        : null,
      toTeam: t.toTeam
        ? {
            id: t.toTeam.id.toString(),
            name: t.toTeam.name,
            logoUrl: t.toTeam.logoUrl ?? null,
          }
        : null,
    })),
  });
});
