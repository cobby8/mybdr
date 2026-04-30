import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * Phase 10-4 — 팀 팔로우 / 언팔로우 API
 * ─────────────────────────────────────────────────────────
 * 이유(왜): 팀 상세 페이지의 "팔로우" CTA를 활성화하려면 (team_id, user_id) 1:1
 * 토글 엔드포인트가 필요. 알림이 필요 없는 light action이므로 단순화 (Phase 10-4 원칙).
 *
 * 방법(어떻게):
 * - POST: 팔로우 행 생성. 이미 있으면 409 반환 (UI는 낙관적 토글이라 409여도 정상 처리).
 * - DELETE: 본인 팔로우만 삭제 (deleteMany + where user_id=ctx.userId 로 IDOR 차단).
 *
 * 보안:
 * - 본인 행만 조작 가능 — body 없이 ctx.userId 를 그대로 사용
 * - 팀 존재 여부는 FK 제약(ON DELETE CASCADE)이 보장하지만, 명시적 404 처리로 UX 개선
 */

type RouteCtx = { params: Promise<{ id: string }> };

// POST — 팔로우 추가
export const POST = withWebAuth(
  async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
    const { id } = await routeCtx.params;

    let teamId: bigint;
    try {
      teamId = BigInt(id);
    } catch {
      // 잘못된 id 포맷
      return apiError("유효하지 않은 팀 ID 입니다.", 400);
    }

    // 팀 존재 확인 — FK CASCADE 가 있지만 404 명시 (UI 메시지 일관성)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    });
    if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

    // 이미 팔로우 중인지 — @@unique 으로 자동 차단되지만 깔끔한 409 반환을 위해 선조회
    const existing = await prisma.team_follows.findUnique({
      where: {
        team_id_user_id: { team_id: teamId, user_id: ctx.userId },
      },
      select: { id: true },
    });
    if (existing) return apiError("이미 팔로우 중인 팀입니다.", 409);

    await prisma.team_follows.create({
      data: { team_id: teamId, user_id: ctx.userId },
    });

    return apiSuccess({ followed: true, message: "팀을 팔로우했습니다." });
  }
);

// DELETE — 언팔로우 (본인 행만 삭제)
export const DELETE = withWebAuth(
  async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
    const { id } = await routeCtx.params;

    let teamId: bigint;
    try {
      teamId = BigInt(id);
    } catch {
      return apiError("유효하지 않은 팀 ID 입니다.", 400);
    }

    // deleteMany 사용 — 본인 행이 없으면 count=0 (idempotent). 다른 사람 행은 where 조건으로 차단.
    const result = await prisma.team_follows.deleteMany({
      where: { team_id: teamId, user_id: ctx.userId },
    });

    if (result.count === 0) {
      // 팔로우 중이 아니어도 클라이언트는 결과적으로 동일한 unfollowed 상태이므로 200 처리
      return apiSuccess({ followed: false, message: "팔로우 상태가 아닙니다." });
    }

    return apiSuccess({ followed: false, message: "팔로우를 해제했습니다." });
  }
);
