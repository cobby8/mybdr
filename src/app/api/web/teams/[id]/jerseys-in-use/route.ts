import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * GET /api/web/teams/[id]/jerseys-in-use
 *
 * 이유(왜): 가입 신청 폼에서 사용자가 선호 등번호 입력 시
 *   같은 팀에서 이미 사용 중인 번호를 미리 확인할 수 있어야 한다.
 *   (충돌하면 신청 자체는 가능하나 승인 단계에서 차단되므로,
 *    UX 상 미리 회피 안내).
 *
 * 어떻게:
 *  - 해당 팀의 active 멤버 jersey_number 만 SELECT (NULL 제외)
 *  - 정렬 후 응답 — 클라가 "사용 중: #1, #5, #10" 형태로 표시
 *
 * IDOR: 로그인 필수. 팀 단위 정보로 가입 의향자도 조회 가능 (낮은 민감도).
 */
export const GET = withWebAuth(async (_req: Request, routeCtx: RouteCtx, _ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    const teamId = BigInt(id);

    // 팀 존재 확인
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    });
    if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

    // active 멤버의 jersey 만 조회 (NULL 자연 제외)
    const members = await prisma.teamMember.findMany({
      where: { teamId, status: "active", jerseyNumber: { not: null } },
      select: { jerseyNumber: true },
      orderBy: { jerseyNumber: "asc" },
    });

    const jerseys = members
      .map((m) => m.jerseyNumber)
      .filter((n): n is number => n != null);

    return apiSuccess({ jerseys });
  } catch {
    return apiError("등번호 조회 중 오류가 발생했습니다.", 500);
  }
});
