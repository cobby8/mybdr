import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/me/registrations  (M2 wave2 — 대기열 "내 신청 현황")
 *
 * 이유: /my/registrations 화면(MyRegistrationStatus)이 내가 신청한 경기를
 *   신청완료(0)·확정(1)·거절(2)·대기 N번(3)·승격(3+deadline) 으로 분기 표시한다.
 *   기존 /me/activity?type=games 는 대기열 필드(waitlist_position/promotion_deadline)를
 *   포함하지 않으므로, 대기열 전용 최소 라우트를 신설한다(읽기 전용).
 *
 * IDOR: where.user_id = session 본인 고정.
 *
 * ⚠️ 응답은 apiSuccess → snake_case 자동 변환. 프론트 접근자도 snake_case.
 *   대기열 파생 필드 노출: waitlist_position / promotion_deadline (DATA-BINDING §2-2).
 *   BigInt(id) → toString() 수동 직렬화(기존 /me/activity 동일 패턴).
 */
export const GET = withWebAuth(async (req: Request, _routeCtx, ctx: WebAuthContext) => {
  // 상한 100 — 내 신청 전체를 한 화면에 보여주되 과다 전송 방지
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));

  try {
    const rows = await prisma.game_applications.findMany({
      where: { user_id: ctx.userId },
      orderBy: { created_at: "desc" },
      take: limit,
      // 필요한 컬럼만 select — 과다 전송/권한 밖 데이터 노출 방지
      select: {
        id: true,
        status: true,
        waitlist_position: true,
        promotion_deadline: true,
        created_at: true,
        games: {
          select: {
            id: true,
            uuid: true,
            title: true,
            game_type: true,
            scheduled_at: true,
            venue_name: true,
            city: true,
            district: true,
            status: true,
            max_participants: true,
            current_participants: true,
          },
        },
      },
    });

    return apiSuccess({
      items: rows.map((r) => ({
        id: r.id.toString(), // BigInt → string
        status: r.status, // 0=신청완료/1=확정/2=거절/3=대기
        waitlist_position: r.waitlist_position, // 대기 순번(1부터) 또는 null
        promotion_deadline: r.promotion_deadline, // 승격 마감 ISO 또는 null
        created_at: r.created_at,
        game: r.games
          ? {
              id: r.games.id.toString(),
              uuid: r.games.uuid,
              // 상세 딥링크용 short uuid (8자리) — 프론트 라우팅 편의
              short_id: r.games.uuid ? r.games.uuid.slice(0, 8) : null,
              title: r.games.title,
              game_type: r.games.game_type, // 0=픽업/1=게스트/2=연습
              scheduled_at: r.games.scheduled_at,
              venue_name: r.games.venue_name,
              city: r.games.city,
              district: r.games.district,
              status: r.games.status, // 1=모집중/2=확정/3=완료/4=취소
              max_participants: r.games.max_participants,
              current_participants: r.games.current_participants,
            }
          : null,
      })),
    });
  } catch {
    return apiError("내 신청 현황을 불러오지 못했습니다.", 500);
  }
});
