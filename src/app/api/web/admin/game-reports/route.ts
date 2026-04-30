/**
 * GET /api/web/admin/game-reports — super_admin 신고 검토 큐 (Phase 10-1 B-9)
 *
 * 왜:
 * - game_player_ratings.flags 배열에 신고 태그(no_show/late/poor_manner/foul/verbal/cheat)가 누적됨
 * - 운영자가 한 곳에서 검토할 수 있도록 큐를 제공한다.
 *
 * 어떻게:
 * - 세션 super_admin 가드 (org-permission.ts isSuperAdmin)
 * - status="submitted" + flags 비어있지 않은 ratings 가 1건 이상인 리포트만 조회
 * - 최신순 + 페이지네이션 (limit 20)
 *
 * NOTE:
 * - 응답은 apiSuccess()로 반환 → 자동 snake_case 변환됨 (errors.md 2026-04-17)
 * - 검토 액션(PATCH)은 후속 작업으로 분리. 본 작업은 GET만 구현.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/org-permission";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  // 세션 + super_admin 가드
  const session = await getWebSession();
  if (!session || !isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  // 페이지네이션 파라미터 — 기본 limit 20
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const cursor = searchParams.get("cursor"); // BigInt id 문자열

  // status 필터 — 기본 "submitted" (검토 대기). "all" 이면 전체.
  const statusFilter = searchParams.get("status") || "submitted";

  const reports = await prisma.game_reports.findMany({
    where: {
      // flags 가 비어있지 않은 rating 이 1건 이상 존재해야 함 (= 신고 누적된 리포트)
      ratings: {
        some: { flags: { isEmpty: false } },
      },
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    },
    include: {
      // 게임 기본 정보 — 카드 헤더에 노출
      game: {
        select: {
          id: true,
          title: true,
          scheduled_at: true,
        },
      },
      // 신고자 닉네임
      reporter: {
        select: { id: true, nickname: true },
      },
      // 신고 플래그가 달린 ratings 만 (깨끗한 평가는 제외해서 노이즈 줄임)
      ratings: {
        where: { flags: { isEmpty: false } },
        include: {
          rated_user: {
            select: { id: true, nickname: true },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: limit + 1, // hasMore 판별용 +1
    ...(cursor
      ? {
          cursor: { id: BigInt(cursor) },
          skip: 1, // 커서 자기 자신 제외
        }
      : {}),
  });

  // hasMore 판별 후 limit 만큼만 반환
  const hasMore = reports.length > limit;
  const sliced = hasMore ? reports.slice(0, limit) : reports;

  // BigInt → string 직렬화
  const result = sliced.map((r) => ({
    id: r.id.toString(),
    status: r.status,
    overallRating: r.overall_rating,
    comment: r.comment,
    createdAt: r.created_at.toISOString(),
    game: {
      id: r.game.id.toString(),
      title: r.game.title,
      scheduledAt: r.game.scheduled_at?.toISOString() ?? null,
    },
    reporter: {
      id: r.reporter.id.toString(),
      nickname: r.reporter.nickname || "이름없음",
    },
    // 신고된 선수별 플래그 목록
    ratings: r.ratings.map((rt) => ({
      id: rt.id.toString(),
      ratedUser: {
        id: rt.rated_user.id.toString(),
        nickname: rt.rated_user.nickname || "이름없음",
      },
      rating: rt.rating,
      flags: rt.flags, // string[] (no_show / late / poor_manner / foul / verbal / cheat ...)
      isNoshow: rt.is_noshow,
    })),
  }));

  return apiSuccess({
    reports: result,
    hasMore,
    nextCursor: hasMore ? sliced[sliced.length - 1].id.toString() : null,
  });
}
