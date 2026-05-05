// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 5 PR15 — 유령 후보 조회 API
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 보고서 §3 — 3개월 이상 미활동 active 멤버 후보 일괄 조회.
//   captain 또는 ghostClassify 위임받은 자가 manage UI "유령 후보" 탭에서 호출.
//   본 endpoint = 조회만 (분류/액션은 별도 endpoint).
// 권한: hasTeamOfficerPermission(ghostClassify) 통과
// 룰:
//   - last_activity_at < now - 3 months 인 active 멤버
//   - last_activity_at IS NULL AND createdAt < now - 3 months 도 후보 (PR14 컬럼 신설 전 가입자)
// ─────────────────────────────────────────────────────────────────────────────

import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { hasTeamOfficerPermission } from "@/lib/team-members/permissions";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/web/teams/[id]/ghost-candidates
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
    select: { id: true },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

  // 권한 — captain 또는 ghostClassify 위임받은 자
  const canClassify = await hasTeamOfficerPermission(teamId, ctx.userId, "ghostClassify");
  if (!canClassify) return apiError("FORBIDDEN", 403);

  // 3개월 전 시점 — 본 endpoint 의 단일 기준
  // 이유: 보고서 §3-3 룰 — last_activity_at < now-3m 또는 (NULL AND createdAt < now-3m)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const candidates = await prisma.teamMember.findMany({
    where: {
      teamId,
      status: "active",
      OR: [
        { last_activity_at: { lt: threeMonthsAgo } },
        // PR14 신설 전 가입자 = NULL → createdAt 으로 fallback 평가
        { AND: [{ last_activity_at: null }, { createdAt: { lt: threeMonthsAgo } }] },
      ],
    },
    orderBy: [
      // NULL 먼저 (가장 의심) → 그 다음 last_activity_at asc (오래 미활동 우선)
      { last_activity_at: "asc" },
    ],
    select: {
      id: true,
      userId: true,
      jerseyNumber: true,
      role: true,
      position: true,
      createdAt: true,
      last_activity_at: true,
      user: {
        select: {
          id: true,
          nickname: true,
          name: true,
          profile_image: true,
        },
      },
    },
  });

  return apiSuccess({
    candidates: candidates.map((m) => ({
      memberId: m.id.toString(),
      userId: m.userId.toString(),
      jerseyNumber: m.jerseyNumber,
      role: m.role,
      position: m.position,
      joinedAt: m.createdAt.toISOString(),
      lastActivityAt: m.last_activity_at?.toISOString() ?? null,
      user: m.user
        ? {
            id: m.user.id.toString(),
            nickname: m.user.nickname,
            name: m.user.name,
            profileImage: m.user.profile_image,
          }
        : null,
    })),
    threshold: threeMonthsAgo.toISOString(),
  });
});
