import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * PUT /api/web/games/[id]/attendance — 출석 토글 (M3, 매칭 고도화)
 *
 * 호스트가 종료/확정된 경기의 승인 참가자(status=1) 출석을 체크/해제한다.
 *   body: { user_id: string|number, present: boolean }
 *   present=true  → attended_at = now()
 *   present=false → attended_at = null
 *
 * 권한(IDOR): 경기 호스트(games.organizer_id === 세션 userId)만. 그 외 403.
 * 대상: status=1(승인 참가자) 신청만. 그 외(대기/거절/취소)는 409.
 *
 * ※ schema 변경 없음 — 기존 game_applications.attended_at(DateTime?) 사용.
 *   별도 attendances 테이블 만들지 않는다(§0).
 * ※ confirm 라우트(applications/[appId]/confirm)와 동일한 검증 체인 재사용
 *   (short UUID hex 검증 → 경기/신청 조회 → IDOR → status 검증).
 */
export const PUT = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    // 0) 요청 본문 파싱 + 검증
    let body: { user_id?: string | number; present?: boolean };
    try {
      body = await req.json();
    } catch {
      return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
    }

    // present 는 명시적 boolean 이어야 한다(누락 시 출석/해제 의도 불명확).
    if (typeof body.present !== "boolean") {
      return apiError("present(boolean)가 필요합니다.", 422, "INVALID_PRESENT");
    }
    // user_id 는 string 또는 number 로 들어올 수 있으므로 BigInt 로 정규화.
    if (body.user_id === undefined || body.user_id === null) {
      return apiError("user_id가 필요합니다.", 422, "INVALID_USER_ID");
    }
    const targetUserId = parseBigIntParam(String(body.user_id));
    if (targetUserId === null) {
      return apiError("유효하지 않은 user_id 입니다.", 422, "INVALID_USER_ID");
    }

    // 1) 경기 조회 (short UUID hex 검증 — LIKE 와일드카드 인젝션 방지)
    let game = null;
    if (id.length === 8) {
      if (!/^[a-f0-9]{8}$/.test(id)) {
        return apiError("경기를 찾을 수 없습니다.", 404, "NOT_FOUND");
      }
      const rows = await prisma.$queryRaw<{ uuid: string }[]>`
        SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${id + "%"} LIMIT 1
      `;
      const fullUuid = rows[0]?.uuid;
      if (fullUuid) game = await prisma.games.findUnique({ where: { uuid: fullUuid } });
    } else {
      game = await prisma.games.findUnique({ where: { uuid: id } });
    }
    if (!game) return apiError("경기를 찾을 수 없습니다.", 404, "NOT_FOUND");

    // 2) IDOR 방지: 호스트만 출석 체크 가능.
    if (game.organizer_id !== ctx.userId) {
      return apiError("경기 호스트만 출석을 관리할 수 있습니다.", 403, "FORBIDDEN");
    }

    // 3) 대상 신청 조회 (game_id + user_id 유니크).
    const application = await prisma.game_applications.findUnique({
      where: {
        game_id_user_id: { game_id: game.id, user_id: targetUserId },
      },
    });
    if (!application) {
      return apiError("해당 참가 신청을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 4) 승인 참가자(status=1)만 출석 체크 대상. 대기(3)/거절(2)/신청(0)은 불가.
    if (application.status !== 1) {
      return apiError("승인된 참가자만 출석을 체크할 수 있습니다.", 409, "NOT_APPROVED");
    }

    // 5) 출석 토글 — present 에 따라 attended_at set/null.
    const attendedAt = body.present ? new Date() : null;
    await prisma.game_applications.update({
      where: { id: application.id },
      data: { attended_at: attendedAt, updated_at: new Date() },
    });

    // 응답 snake_case (apiSuccess 가 자동 변환하나, 키 자체를 snake 로 둔다).
    return apiSuccess({
      user_id: targetUserId.toString(),
      present: body.present,
      attended_at: attendedAt ? attendedAt.toISOString() : null,
    });
  } catch {
    return apiError("출석 처리 중 오류가 발생했습니다.", 500, "INTERNAL_ERROR");
  }
});
