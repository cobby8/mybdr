import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { teamMatchRequestCreateSchema } from "@/lib/validation/team-follow";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

/**
 * Phase 10-4 — 팀 매치 신청 (POST 만)
 * ─────────────────────────────────────────────────────────
 * 이유(왜): 팀 상세의 "매치 신청" CTA 활성화. from_team(제안자 측) → to_team(URL의 팀)
 * 친선/연습경기 신청 흐름. 본 phase에서는 생성(POST)만 담당하고 수락/거절(PATCH)은 후속.
 *
 * 흐름:
 * 1) URL [id] = to_team_id (호스트 측 팀)
 * 2) body.from_team_id = 제안자 측 팀 (검증 필수)
 * 3) 검증
 *    - to_team / from_team 존재
 *    - to_team === from_team 자기 자신 신청 차단 (400)
 *    - 신청자(ctx.userId) 가 from_team 의 운영진(captain/vice/manager) 인지 (403)
 *    - 같은 (from→to) pending 중복 (409)
 * 4) 생성 + to_team 의 captain 에게 알림 (fire-and-forget)
 *
 * 보안:
 * - to_team_id 는 path param 으로만 받음 (스푸핑 방지)
 * - from_team_id 는 body 이지만 운영진 확인을 통과해야 함 → 임의의 팀으로 스푸핑 불가
 */

type RouteCtx = { params: Promise<{ id: string }> };

// 매치 신청 권한 — captain/vice/manager 동일 가드 (members route 와 일관)
const TEAM_MANAGER_ROLES = ["captain", "vice", "manager"] as const;

export const POST = withWebAuth(
  async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
    const { id } = await routeCtx.params;

    let toTeamId: bigint;
    try {
      toTeamId = BigInt(id);
    } catch {
      return apiError("유효하지 않은 팀 ID 입니다.", 400);
    }

    // body 파싱 + zod 검증
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError([{ field: "body", message: "유효하지 않은 값입니다." }]);
    }
    const parsed = teamMatchRequestCreateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.issues);

    const fromTeamId = BigInt(parsed.data.from_team_id);

    // 자기 팀에 자기 신청 금지
    if (fromTeamId === toTeamId) {
      return apiError("같은 팀에 매치 신청할 수 없습니다.", 400);
    }

    // 두 팀 존재 확인 (한 번에 조회) — 둘 다 안 잡히면 to / from 어느 쪽이든 NF
    const teams = await prisma.team.findMany({
      where: { id: { in: [fromTeamId, toTeamId] } },
      select: { id: true, name: true },
    });
    const fromTeam = teams.find((t) => t.id === fromTeamId);
    const toTeam = teams.find((t) => t.id === toTeamId);
    if (!fromTeam || !toTeam) {
      return apiError("팀을 찾을 수 없습니다.", 404);
    }

    // 신청자가 from_team 의 운영진(captain/vice/manager) 인지 검증 — IDOR 방지
    const isManager = await prisma.teamMember.findFirst({
      where: {
        teamId: fromTeamId,
        userId: ctx.userId,
        role: { in: [...TEAM_MANAGER_ROLES] },
        status: "active",
      },
      select: { id: true },
    });
    if (!isManager) {
      return apiError("매치 신청은 팀 운영진(팀장/부팀장/매니저)만 가능합니다.", 403);
    }

    // 같은 (from→to) 조합 pending 중복 차단 — 호스트 인박스 도배 방지
    const existing = await prisma.team_match_requests.findFirst({
      where: {
        from_team_id: fromTeamId,
        to_team_id: toTeamId,
        status: "pending",
      },
      select: { id: true },
    });
    if (existing) {
      return apiError("이미 처리 대기 중인 매치 신청이 있습니다.", 409);
    }

    // 메시지 트리밍 + 빈 문자열은 null
    const trimmedMessage =
      typeof parsed.data.message === "string"
        ? parsed.data.message.trim().slice(0, 1000) || null
        : null;
    const preferredDate = parsed.data.preferred_date
      ? new Date(parsed.data.preferred_date)
      : null;

    const created = await prisma.team_match_requests.create({
      data: {
        from_team_id: fromTeamId,
        to_team_id: toTeamId,
        proposer_id: ctx.userId,
        message: trimmedMessage,
        preferred_date: preferredDate,
        status: "pending",
      },
      select: { id: true, created_at: true },
    });

    // 호스트 팀(to_team)의 captain 에게 알림 (fire-and-forget) — 가입 신청 알림 패턴 그대로
    const toCaptain = await prisma.teamMember.findFirst({
      where: { teamId: toTeamId, role: "captain", status: "active" },
      select: { userId: true },
    });
    if (toCaptain) {
      createNotification({
        userId: toCaptain.userId,
        notificationType: NOTIFICATION_TYPES.TEAM_MATCH_REQUEST_RECEIVED,
        title: "새 매치 신청",
        content: `"${fromTeam.name}" 팀이 "${toTeam.name}" 팀에 매치를 신청했습니다.`,
        // 호스트 팀 매니지 페이지로 이동 (후속 PATCH 작업에서 매치신청 탭 추가 예정)
        actionUrl: `/teams/${toTeamId}/manage`,
        metadata: {
          request: { id: created.id.toString() },
          from_team: { id: fromTeam.id.toString(), name: fromTeam.name },
          to_team: { id: toTeam.id.toString(), name: toTeam.name },
        },
      }).catch(() => {});
    }

    return apiSuccess(
      {
        id: created.id.toString(),
        from_team_id: fromTeamId.toString(),
        to_team_id: toTeamId.toString(),
        status: "pending",
        created_at: created.created_at.toISOString(),
        message: "매치 신청이 전송되었습니다.",
      },
      201
    );
  }
);
