import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { teamMatchRequestPatchSchema } from "@/lib/validation/team-follow";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

/**
 * Phase 10-4 후속 — 팀 매치 신청 PATCH (수락/거절/취소)
 * ─────────────────────────────────────────────────────────
 * 이유(왜): POST 로 생성된 pending 매치 신청을 처리하는 단일 엔드포인트.
 * status 별로 권한이 다르므로 route 안에서 분기한다.
 *
 * 권한 매트릭스:
 *   status="accepted" / "rejected"  → to_team 의 captain 만 가능
 *   status="cancelled"              → from_team 의 proposer 본인 또는 from_team captain
 *
 * 알림:
 *   accepted/rejected → from_team proposer 에게 (TEAM_MATCH_REQUEST_ACCEPTED/REJECTED)
 *   cancelled         → to_team captain 에게 (TEAM_MATCH_REQUEST_CANCELLED) — 인박스 동기화 차원
 *
 * 검증:
 *   - 신청 존재 (404)
 *   - URL [id] (to_team_id) 와 신청의 to_team_id 일치 (400 — 잘못된 경로)
 *   - 기존 status === "pending" 만 변경 가능 (409 — 이미 처리됨)
 *
 * 보안:
 *   - URL path 의 [id]=to_team_id, [reqId]=request_id 로 스푸핑 방지
 *   - body status 는 zod enum 으로 화이트리스트 검증 (pending 되돌리기 차단)
 *   - 권한 검증은 status 별로 분기, 거짓이면 403 즉시 반환 (IDOR 차단)
 */

type RouteCtx = { params: Promise<{ id: string; reqId: string }> };

// 운영진 권한 동일 가드 — POST/match-request 와 일관 (captain/vice/manager)
const TEAM_MANAGER_ROLES = ["captain", "vice", "manager"] as const;

export const PATCH = withWebAuth(
  async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
    const { id, reqId } = await routeCtx.params;

    // path param 파싱 — BigInt 변환 실패 시 400
    let toTeamIdFromUrl: bigint;
    let requestId: bigint;
    try {
      toTeamIdFromUrl = BigInt(id);
      requestId = BigInt(reqId);
    } catch {
      return apiError("유효하지 않은 ID 입니다.", 400);
    }

    // body 파싱 + zod 검증 — status enum 외 값은 422 차단
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError([
        { field: "body", message: "유효하지 않은 값입니다." },
      ]);
    }
    const parsed = teamMatchRequestPatchSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.issues);

    const nextStatus = parsed.data.status;

    // 신청 + 양 팀 captain + from_team 이름 / to_team 이름 한 번에 조회
    // 이유(왜): 권한 검증과 알림 발송에 필요한 정보를 N+1 없이 묶어서 가져옴.
    const matchRequest = await prisma.team_match_requests.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        from_team_id: true,
        to_team_id: true,
        proposer_id: true,
        status: true,
        from_team: { select: { id: true, name: true } },
        to_team: { select: { id: true, name: true } },
      },
    });
    if (!matchRequest) {
      return apiError("매치 신청을 찾을 수 없습니다.", 404);
    }

    // URL [id] 와 신청의 to_team_id 가 다르면 잘못된 경로 — 스푸핑/오타 방지
    if (matchRequest.to_team_id !== toTeamIdFromUrl) {
      return apiError("매치 신청 경로가 올바르지 않습니다.", 400);
    }

    // 이미 처리된 신청은 다시 변경 불가 (멱등성 보호 + 경쟁 상황 차단)
    if (matchRequest.status !== "pending") {
      return apiError("이미 처리된 매치 신청입니다.", 409);
    }

    // ─── 권한 검증 (status 별 분기) ──────────────────────────
    // accepted/rejected: to_team 의 captain 본인만 가능
    // cancelled: from_team proposer 본인 OR from_team captain
    if (nextStatus === "accepted" || nextStatus === "rejected") {
      const toCaptain = await prisma.teamMember.findFirst({
        where: {
          teamId: matchRequest.to_team_id,
          userId: ctx.userId,
          role: "captain",
          status: "active",
        },
        select: { id: true },
      });
      if (!toCaptain) {
        return apiError(
          "매치 신청 수락/거절은 호스트 팀의 팀장만 가능합니다.",
          403
        );
      }
    } else {
      // cancelled — proposer 본인이거나 from_team 의 운영진(captain) 일 때만
      const isProposer = matchRequest.proposer_id === ctx.userId;
      let allowed = isProposer;
      if (!allowed) {
        const fromCaptain = await prisma.teamMember.findFirst({
          where: {
            teamId: matchRequest.from_team_id,
            userId: ctx.userId,
            // 취소 권한도 운영진(captain/vice/manager) 동일 가드와 통일
            role: { in: [...TEAM_MANAGER_ROLES] },
            status: "active",
          },
          select: { id: true },
        });
        allowed = !!fromCaptain;
      }
      if (!allowed) {
        return apiError(
          "매치 신청 취소는 신청자 본인 또는 신청 팀의 운영진만 가능합니다.",
          403
        );
      }
    }

    // ─── status 갱신 ─────────────────────────────────────────
    // 이유(왜): updateMany 로 status="pending" 조건을 한 번 더 걸어
    //         경쟁 상황(동시 처리)에서 한 쪽이 이미 변경했다면 count=0 으로 안전 차단.
    const updated = await prisma.team_match_requests.updateMany({
      where: { id: requestId, status: "pending" },
      data: { status: nextStatus, updated_at: new Date() },
    });
    if (updated.count === 0) {
      return apiError("이미 처리된 매치 신청입니다.", 409);
    }

    // ─── 알림 발송 (fire-and-forget) ────────────────────────
    // 수락/거절 → 신청자(proposer) 에게
    // 취소 → 호스트 팀(to_team) captain 에게 (있을 때만)
    if (nextStatus === "accepted" || nextStatus === "rejected") {
      const isAccepted = nextStatus === "accepted";
      const notifType = isAccepted
        ? NOTIFICATION_TYPES.TEAM_MATCH_REQUEST_ACCEPTED
        : NOTIFICATION_TYPES.TEAM_MATCH_REQUEST_REJECTED;
      const title = isAccepted ? "매치 신청 수락" : "매치 신청 거절";
      const content = isAccepted
        ? `"${matchRequest.to_team.name}" 팀이 매치 신청을 수락했습니다.`
        : `"${matchRequest.to_team.name}" 팀이 매치 신청을 거절했습니다.`;

      createNotification({
        userId: matchRequest.proposer_id,
        notificationType: notifType,
        title,
        content,
        // 신청자 측 팀 페이지로 이동 (인박스 미구현 동안의 임시 진입점)
        actionUrl: `/teams/${matchRequest.from_team_id}`,
        metadata: {
          request: { id: matchRequest.id.toString(), status: nextStatus },
          from_team: {
            id: matchRequest.from_team.id.toString(),
            name: matchRequest.from_team.name,
          },
          to_team: {
            id: matchRequest.to_team.id.toString(),
            name: matchRequest.to_team.name,
          },
        },
      }).catch(() => {});
    } else {
      // cancelled — to_team captain 에게 동기화 알림 (선택적이지만 인박스 UX 위해 발송)
      const toCaptain = await prisma.teamMember.findFirst({
        where: {
          teamId: matchRequest.to_team_id,
          role: "captain",
          status: "active",
        },
        select: { userId: true },
      });
      if (toCaptain) {
        createNotification({
          userId: toCaptain.userId,
          notificationType: NOTIFICATION_TYPES.TEAM_MATCH_REQUEST_CANCELLED,
          title: "매치 신청 취소",
          content: `"${matchRequest.from_team.name}" 팀이 매치 신청을 취소했습니다.`,
          actionUrl: `/teams/${matchRequest.to_team_id}/manage`,
          metadata: {
            request: { id: matchRequest.id.toString(), status: nextStatus },
            from_team: {
              id: matchRequest.from_team.id.toString(),
              name: matchRequest.from_team.name,
            },
            to_team: {
              id: matchRequest.to_team.id.toString(),
              name: matchRequest.to_team.name,
            },
          },
        }).catch(() => {});
      }
    }

    return apiSuccess({
      id: matchRequest.id.toString(),
      status: nextStatus,
      message:
        nextStatus === "accepted"
          ? "매치 신청을 수락했습니다."
          : nextStatus === "rejected"
            ? "매치 신청을 거절했습니다."
            : "매치 신청을 취소했습니다.",
    });
  }
);
