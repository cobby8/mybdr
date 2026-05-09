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
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

type Ctx = { params: Promise<{ id: string; matchId: string }> };

// 검색 후보 cache (매치별 5분 — 운영자가 모달 여러 번 열어도 한 번만 점수 계산)
const SEARCH_CACHE_TTL = 5 * 60; // 초
const SEARCH_CACHE_KEY = (matchId: string) => `mybdr:youtube:match-search:${matchId}`;

// Q8: 자동 등록 임계값 = 80점 / 후보 노출 = 50점 이상
const SCORE_THRESHOLD_CANDIDATE = 50;

// Q2: 시간 매칭 ± 30분 (매치 시작/예정 시각 기준)
const TIME_MATCH_WINDOW_MS = 30 * 60 * 1000; // 30분

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

interface ScoredCandidate {
  video_id: string;
  title: string;
  thumbnail: string;
  score: number;
  is_live: boolean;
  published_at: string;
  view_count: number;
  // 점수 breakdown — 운영자 UI 에서 "왜 이 영상이 후보로 추천됐는지" 설명용
  score_breakdown: {
    time: number;
    home_team: number;
    away_team: number;
    tournament: number;
    match_code: number;
    round: number;
  };
}

/**
 * 매치 정보 + BDR 영상 1건 → 신뢰도 점수 계산.
 * 점수 ≥80 = 자동 채택 / 50~79 = 후보 노출 / <50 = 무시.
 */
function scoreMatch(
  video: EnrichedVideo,
  match: {
    homeTeamName: string;
    awayTeamName: string;
    tournamentName: string;
    roundName: string | null;
    matchCode: string | null;
    scheduledAt: Date | null;
    startedAt: Date | null;
  },
): ScoredCandidate {
  const breakdown = {
    time: 0,
    home_team: 0,
    away_team: 0,
    tournament: 0,
    match_code: 0,
    round: 0,
  };

  // 1) 시간 매칭 — 영상 publishedAt vs 매치 시작/예정 시각
  // 라이브 영상은 publishedAt = 라이브 시작 시각이라 정확. VOD 도 매치 종료 직후 업로드가 일반적.
  const matchTime = (match.startedAt ?? match.scheduledAt)?.getTime();
  if (matchTime) {
    const videoTime = new Date(video.publishedAt).getTime();
    const diff = Math.abs(videoTime - matchTime);
    if (diff <= TIME_MATCH_WINDOW_MS) {
      breakdown.time = 60; // ±30분 = 강한 시그널
    } else if (diff <= TIME_MATCH_WINDOW_MS * 2) {
      breakdown.time = 30; // ±60분 = 중간 시그널
    } else if (diff <= TIME_MATCH_WINDOW_MS * 8) {
      breakdown.time = 10; // ±4시간 = 약한 시그널 (같은 날)
    }
  }

  // 2) 제목/설명 키워드 매칭 (case-insensitive)
  const haystack = `${video.title} ${video.description}`.toLowerCase();

  // 팀명 — 공백 제거 후 부분 매칭 (한글 공백 변형 대응)
  const homeNameNorm = match.homeTeamName.replace(/\s+/g, "").toLowerCase();
  const awayNameNorm = match.awayTeamName.replace(/\s+/g, "").toLowerCase();
  const haystackNorm = haystack.replace(/\s+/g, "");

  if (homeNameNorm.length >= 2 && haystackNorm.includes(homeNameNorm)) {
    breakdown.home_team = 30;
  }
  if (awayNameNorm.length >= 2 && haystackNorm.includes(awayNameNorm)) {
    breakdown.away_team = 30;
  }

  // 대회명 — 길어서 부분 매칭 (앞 4자만 사용)
  const tournamentTrim = match.tournamentName.replace(/\s+/g, "").toLowerCase().slice(0, 8);
  if (tournamentTrim.length >= 3 && haystackNorm.includes(tournamentTrim)) {
    breakdown.tournament = 10;
  }

  // 매치 코드 — 가장 강한 시그널 (예: "26-GG-MD21-001")
  if (match.matchCode && haystack.includes(match.matchCode.toLowerCase())) {
    breakdown.match_code = 20;
  }

  // 라운드 — 약한 시그널 ("결승" / "8강" / "준결승")
  if (match.roundName) {
    const roundNorm = match.roundName.replace(/\s+/g, "").toLowerCase();
    if (roundNorm.length >= 2 && haystackNorm.includes(roundNorm)) {
      breakdown.round = 5;
    }
  }

  const score =
    breakdown.time +
    breakdown.home_team +
    breakdown.away_team +
    breakdown.tournament +
    breakdown.match_code +
    breakdown.round;

  return {
    video_id: video.videoId,
    title: video.title,
    thumbnail: video.thumbnail,
    score,
    is_live: video.liveBroadcastContent === "live",
    published_at: video.publishedAt,
    view_count: video.viewCount,
    score_breakdown: breakdown,
  };
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
