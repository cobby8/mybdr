/**
 * GET /api/web/profile/season-stats
 *
 * Phase 12-3 (12-A): 사용자 시즌 통계 조회
 *
 * Why: ProfileGrowth(/profile/growth) 마일스톤에 시즌별 평균 평점·MVP·순위·경기수
 *      를 표시하기 위함. UserSeasonStat 테이블은 Phase 12-1 에서 추가됐고, 집계
 *      cron 은 Phase 13+ 에서 추가될 예정 — 현재는 빈 시즌이 일반적임.
 *
 * 응답 형태:
 *   { stats: [
 *       { id, season_year, season_label, games_played, wins, losses,
 *         avg_rating(number|null), mvp_count, rank_position(number|null),
 *         total_minutes, total_xp }
 *     ] }
 *
 *   - 항상 현재 시즌(year)이 stats[0]에 포함됨 — 데이터 없으면 0으로 채운 빈 시즌
 *   - 12주 spark 데이터는 미포함 (UserSeasonStat 은 시즌별 누적만 — 주간 집계 별도 큐)
 */

import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

export const GET = withWebAuth(async (_req: Request, ctx: WebAuthContext) => {
  try {
    // 본인 시즌 통계 — season_year 내림차순(최신 시즌 먼저)
    const stats = await prisma.userSeasonStat.findMany({
      where: { user_id: ctx.userId },
      orderBy: { season_year: "desc" },
      select: {
        id: true,
        season_year: true,
        season_label: true,
        games_played: true,
        wins: true,
        losses: true,
        avg_rating: true,
        mvp_count: true,
        rank_position: true,
        total_minutes: true,
        total_xp: true,
      },
    });

    // BigInt(id) + Decimal(avg_rating) 직렬화
    // - id: string 으로
    // - avg_rating: Number(decimal) — null 보존
    const serialized = stats.map((s) => ({
      id: s.id.toString(),
      season_year: s.season_year,
      season_label: s.season_label,
      games_played: s.games_played,
      wins: s.wins,
      losses: s.losses,
      avg_rating: s.avg_rating ? Number(s.avg_rating) : null,
      mvp_count: s.mvp_count,
      rank_position: s.rank_position,
      total_minutes: s.total_minutes,
      total_xp: s.total_xp,
    }));

    // 현재 시즌이 누락된 경우(가장 흔한 케이스 — 집계 cron 미실행)
    // 0으로 채운 빈 시즌을 stats[0] 에 삽입 → 클라가 항상 "현재 시즌" 슬롯을 가짐
    const currentYear = new Date().getFullYear();
    const hasCurrentSeason = serialized.some((s) => s.season_year === currentYear);
    if (!hasCurrentSeason) {
      serialized.unshift({
        id: "0",
        season_year: currentYear,
        season_label: `${currentYear} 시즌`,
        games_played: 0,
        wins: 0,
        losses: 0,
        avg_rating: null,
        mvp_count: 0,
        rank_position: null,
        total_minutes: 0,
        total_xp: 0,
      });
    }

    return apiSuccess({ stats: serialized });
  } catch (e) {
    console.error("[GET /api/web/profile/season-stats]", e);
    return apiError("Internal error", 500);
  }
});
