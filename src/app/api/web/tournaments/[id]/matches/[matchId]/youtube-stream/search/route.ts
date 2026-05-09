/**
 * 2026-05-09 PR2 — BDR 채널 자동 검색 API (매치 ↔ 영상 후보 매칭).
 *
 * 도메인 컨텍스트 (Dev/live-youtube-embed-2026-05-09.md §3, §7):
 *   사용자가 매치 라이브 페이지 관리 모달에서 "BDR 채널 자동 검색" 버튼 클릭 시 호출.
 *   BDR uploads playlist (150건) 에서 매치 키워드 + 시간 ± 30분 매칭 후 후보 N건 반환.
 *
 * 알고리즘:
 *   1) 시간 매칭 (±30분 = +60점 / ±2배 = +30점 / 무관 = 0점)
 *   2) 제목 키워드 매칭 (양 팀명 +30 / 한 팀명 +20 / 대회명 +10 / 매치 코드 +20 / 라운드 +5)
 *   3) 결과: 점수 desc 정렬 + 후보 임계값 필터.
 *
 * Q8 결재: 80점 = 자동 채택 / 50~79점 = 후보 / <50 = 노출 안 함.
 *
 * Quota:
 *   /playlistItems 재사용 (cache hit 시 0) + /videos 재사용. search API 미사용.
 *   분당 30회/IP rate limit (스팸 방지).
 */

import { type NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { resolveMatchStreamAuth } from "@/lib/auth/match-stream";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { fetchEnrichedVideos, type EnrichedVideo } from "@/lib/youtube/enriched-videos";
// 2026-05-10 PR-A — scoreMatch 헬퍼 추출 (search + auto-register 공용 source)
import {
  scoreMatch,
  type ScoredCandidate,
  SCORE_THRESHOLD_CANDIDATE,
} from "@/lib/youtube/score-match";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

type Ctx = { params: Promise<{ id: string; matchId: string }> };

// 검색 후보 cache (매치별 5분 — 운영자가 모달 여러 번 열어도 한 번만 점수 계산)
const SEARCH_CACHE_TTL = 5 * 60; // 초
const SEARCH_CACHE_KEY = (matchId: string) => `mybdr:youtube:match-search:${matchId}`;

const hasRedisConfig =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (!hasRedisConfig) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisClient;
}

/**
 * GET /api/web/tournaments/[id]/matches/[matchId]/youtube-stream/search
 *
 * Query: 없음
 * 401 = 미로그인 / 403 = 권한 없음 / 404 = 매치 없음 / 503 = YouTube API 미설정
 * 200 응답: { videos: [{ video_id, title, thumbnail, score, is_live, published_at, view_count, score_breakdown }] }
 */
export const GET = withWebAuth(async (req: NextRequest, routeCtx: Ctx, ctx: WebAuthContext) => {
  const { id: tournamentId, matchId } = await routeCtx.params;

  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  // 권한 + 매치 존재 + IDOR 방어 (한 번에)
  const auth = await resolveMatchStreamAuth(ctx.userId, tournamentId, matchBigInt, ctx.session);
  if ("error" in auth) return auth.error;

  // Rate limit — 운영자 검색 폭주 방지 (분당 30회/IP)
  const rl = await checkRateLimit(`youtube-search:${ctx.userId}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }
  void req;

  // Cache 확인 (5분 TTL)
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get<ScoredCandidate[]>(SEARCH_CACHE_KEY(matchId));
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return apiSuccess({ videos: cached, cached: true });
      }
    } catch (err) {
      console.error("[youtube-search] Redis get failed:", err);
    }
  }

  // 매치 + 팀 + 대회 메타 한 쿼리 (resolveMatchStreamAuth 가 ID 만 반환해서 보충)
  const matchMeta = await prisma.tournamentMatch.findUnique({
    where: { id: matchBigInt },
    select: {
      scheduledAt: true,
      started_at: true,
      roundName: true,
      match_code: true,
      tournament: { select: { name: true } },
      homeTeam: { include: { team: { select: { name: true } } } },
      awayTeam: { include: { team: { select: { name: true } } } },
    },
  });
  if (!matchMeta) {
    return apiError("경기 정보를 찾을 수 없습니다.", 404);
  }

  const homeTeamName = matchMeta.homeTeam?.team?.name ?? "";
  const awayTeamName = matchMeta.awayTeam?.team?.name ?? "";
  const tournamentName = matchMeta.tournament?.name ?? "";

  // YouTube API 키 확인
  const youtubeKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeKey) {
    return apiError("YouTube API 가 설정되지 않았습니다.", 503, "YOUTUBE_API_NOT_CONFIGURED");
  }

  // BDR uploads playlist (150건) 영상 일괄 fetch — recommend route 와 같은 cache 공유
  let videos: EnrichedVideo[] = [];
  try {
    videos = await fetchEnrichedVideos(youtubeKey);
  } catch (err) {
    console.error("[youtube-search] fetchEnrichedVideos failed:", err);
    return apiError("YouTube 영상 조회에 실패했습니다.", 502);
  }

  // 점수 계산 + 임계값 필터
  const scored: ScoredCandidate[] = videos
    .map((v) =>
      scoreMatch(v, {
        homeTeamName,
        awayTeamName,
        tournamentName,
        roundName: matchMeta.roundName,
        matchCode: matchMeta.match_code,
        scheduledAt: matchMeta.scheduledAt,
        startedAt: matchMeta.started_at,
      }),
    )
    .filter((c) => c.score >= SCORE_THRESHOLD_CANDIDATE)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // 최대 10건만 반환 (UI 가독성)

  // Cache 저장 (fire-and-forget — 응답 지연 0)
  if (redis && scored.length > 0) {
    redis.set(SEARCH_CACHE_KEY(matchId), scored, { ex: SEARCH_CACHE_TTL }).catch((err) => {
      console.error("[youtube-search] Redis set failed:", err);
    });
  }

  return apiSuccess({ videos: scored, cached: false });
});
