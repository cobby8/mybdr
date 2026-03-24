import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/stats
 *
 * 플랫폼 전체 통계를 반환하는 공개 API
 * - 인증 불필요 (공개 정보)
 * - 팀 수, 매치 수, 유저 수를 병렬로 COUNT 쿼리
 * - 응답은 apiSuccess()를 통해 자동 snake_case 변환
 */
export async function GET() {
  try {
    // 3개의 COUNT 쿼리를 동시에 실행하여 응답 시간 최소화
    const [teamCount, matchCount, userCount] = await Promise.all([
      // 활성 + 공개 팀만 카운트
      prisma.team.count({
        where: { status: "active", is_public: true },
      }),
      // 전체 경기(games) 수 -- Prisma 모델명은 games
      prisma.games.count(),
      // 전체 유저 수
      prisma.user.count(),
    ]);

    return apiSuccess({
      teamCount,
      matchCount,
      userCount,
    });
  } catch (error) {
    console.error("[GET /api/web/stats] Error:", error);
    return apiError("통계를 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
