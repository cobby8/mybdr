import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 3 PR10+PR11 — 팀 인박스용 이적 신청 조회 (captain 시야)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 본 팀이 fromTeam (떠나는 신청 — 현 팀장 결정 필요) 또는 toTeam (들어오는
//   신청 — 새 팀장 결정 필요) 인 transfer_requests 를 captain 시야로 조회.
//   본인 시야 (마이페이지) 용 GET /api/web/transfer-requests 는 별개 — 그건 userId 필터.
// 권한: captain only (Phase 4 PR12 위임 통합 예정 — 현재는 captain 한정).
// ─────────────────────────────────────────────────────────────────────────────

type RouteCtx = { params: Promise<{ id: string }> };

export const GET = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  let teamId: bigint;
  try {
    teamId = BigInt(id);
  } catch {
    return apiError("INVALID_TEAM_ID", 400);
  }

  // 팀 존재 + captain 검증
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, captainId: true },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404);
  if (team.captainId !== ctx.userId) {
    return apiError("FORBIDDEN", 403, "팀장만 이적 신청을 조회할 수 있습니다.");
  }

  // 본 팀이 fromTeam 또는 toTeam 인 신청 (양쪽 사이드 모두 본 captain 결정 대상)
  // status 필터 — 기본 final_status='pending' (인박스 용도)
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const validStatus = ["pending", "approved", "rejected", "cancelled"];

  // 본 captain 이 미처리한 row 만 표시 (본 사이드 status='pending')
  // 이유: from 사이드에서 이미 결정한 경우 본 팀 인박스에 다시 보일 필요 X (다른 사이드 대기 중).
  const where: Prisma.TransferRequestWhereInput = {
    OR: [
      { fromTeamId: teamId, fromTeamStatus: "pending" },
      { toTeamId: teamId, toTeamStatus: "pending" },
    ],
    ...(statusFilter && validStatus.includes(statusFilter) ? { finalStatus: statusFilter } : {}),
  };

  const transfers = await prisma.transferRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      fromTeam: { select: { id: true, name: true, logoUrl: true } },
      toTeam: { select: { id: true, name: true, logoUrl: true } },
      user: { select: { id: true, nickname: true, name: true, profile_image: true } },
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
      user: t.user
        ? {
            id: t.user.id.toString(),
            nickname: t.user.nickname,
            name: t.user.name,
            profile_image: t.user.profile_image,
          }
        : null,
    })),
  });
});
