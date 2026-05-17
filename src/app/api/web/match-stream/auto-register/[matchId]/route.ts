/**
 * 2026-05-10 PR-B — 라이브 YouTube 자동 등록 트리거 (무인증 endpoint).
 *
 * 도메인 컨텍스트 (Dev/live-youtube-auto-trigger-2026-05-10.md §1, §3, §6):
 *   라이브 페이지 viewer 가 윈도우 ±10분 내 30초 폴링으로 호출 → BDR 채널 영상 자동 등록.
 *   80점+ 매칭 시 DB UPDATE + admin_logs INSERT (audit).
 *   80점 미만 = no_match_found + Redis 5분 cache (다른 viewer 30초 폴링 시 quota 0).
 *
 * 왜 search route 와 분리했는가?
 *   - 권한: search = 운영자만 / auto-register = 무인증 (라이브 페이지 공개)
 *   - 메서드: search = GET / auto-register = POST (DB 변경 액션)
 *   - rate limit: search = 30/분/IP / auto-register = 6/분/IP+matchId (abuse 차단)
 *   - 동작: search = 후보만 반환 / auto-register = 80점+ INSERT 자동 실행
 *
 * 응답 형식 (registered 플래그 + reason 4종):
 *   - { registered: false, reason: "already_registered", video_id }
 *   - { registered: false, reason: "out_of_window", window_minutes: 10 }
 *   - { registered: false, reason: "match_not_live", match_status }
 *   - { registered: false, reason: "no_match_found", top_score? }
 *   - { registered: true, video_id, score, status: "auto_verified" | "auto_pending" }
 */

import { type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { fetchEnrichedVideos, type EnrichedVideo } from "@/lib/youtube/enriched-videos";
// PR-A 헬퍼 — search route 와 동일 알고리즘 / 임계값 SCORE_THRESHOLD_AUTO=80
import {
  scoreMatch,
  type MatchContext,
  SCORE_THRESHOLD_AUTO,
} from "@/lib/youtube/score-match";
import { checkRateLimit } from "@/lib/security/rate-limit";

type Ctx = { params: Promise<{ matchId: string }> };

// 30초 폴링 시 같은 매치 중복 fetch 방지용 cache (5분 TTL).
// no_match 인 경우 viewer N명이 같은 매치를 동시 폴링해도 quota 1회만 사용.
const NO_MATCH_CACHE_TTL = 5 * 60; // 초
const NO_MATCH_CACHE_KEY = (matchId: string) => `mybdr:youtube:match-auto:${matchId}`;

// 매치 시작/예정 시각 ±10분 윈도우 — 영상 업로드 시점이 라이브 시작 ±10분 내에 거의 다 잡힘.
const WINDOW_MS = 10 * 60 * 1000;

// status 가드 — 라이브 진행/임박 상태에서만 트리거 (Q10 결재 결과)
const ALLOWED_STATUSES = new Set(["scheduled", "ready", "in_progress"]);

// Rate limit — 같은 매치+같은 IP 분당 6회. 30초 폴링 = 분당 2회 → 정상 마진 4회.
const RATE_LIMIT_CONFIG = { maxRequests: 6, windowMs: 60 * 1000 };

// Redis 클라 (PR2 search route 패턴 그대로 — 환경변수 미설정 시 null fallback)
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
 * admin_logs.admin_id 는 NOT NULL + User FK.
 * 무인증 endpoint 라 session 이 없으므로 super_admin 첫 번째를 system actor 로 사용.
 * 운영 DB 에 super_admin 1건 이상 보장됨 (스크립트 youtube-batch-match.ts 와 동일 패턴).
 * cache: 모듈 단위 1회 조회.
 */
let cachedSystemAdminId: bigint | null = null;
async function resolveSystemAdminId(): Promise<bigint | null> {
  if (cachedSystemAdminId !== null) return cachedSystemAdminId;
  const sa = await prisma.user.findFirst({
    where: { admin_role: "super_admin", isAdmin: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  cachedSystemAdminId = sa?.id ?? null;
  return cachedSystemAdminId;
}

/**
 * POST /api/web/match-stream/auto-register/[matchId]
 *
 * 무인증 / IP+matchId 별 분당 6회 rate limit / 80점+ 자동 INSERT.
 *
 * 200 응답: AutoRegisterResponse (registered true/false + reason 4종)
 * 404 = matchId 잘못됨 / 매치 없음
 * 429 = rate limit 초과
 * 502 = YouTube API 호출 실패
 * 503 = YouTube API 키 미설정
 */
export async function POST(req: NextRequest, routeCtx: Ctx) {
  const { matchId } = await routeCtx.params;

  // 1) matchId 파싱 — 잘못된 형식이면 404
  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  // 2) Rate limit — IP+matchId 분리 키 (다른 매치 동시 폴링 OK / 같은 매치 abuse 차단)
  // X-Forwarded-For 첫 번째 IP 만 신뢰 (Vercel edge 가 클라 IP 를 첫 번째에 채움)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`auto-register:${matchId}:${ip}`, RATE_LIMIT_CONFIG);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  // 3) 매치 + 팀 + 대회 메타 한 쿼리 (점수 계산 + status 가드 + already 가드 동시)
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchBigInt },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      started_at: true,
      roundName: true,
      match_code: true,
      youtube_video_id: true,
      tournament: { select: { name: true } },
      homeTeam: { include: { team: { select: { name: true } } } },
      awayTeam: { include: { team: { select: { name: true } } } },
    },
  });
  if (!match) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  // 4) 이미 등록된 영상 — early return (재등록 X / 운영자 수동 등록과 충돌 0)
  if (match.youtube_video_id) {
    return apiSuccess({
      registered: false,
      reason: "already_registered",
      video_id: match.youtube_video_id,
    });
  }

  // 5) status 가드 — Q10 결재: scheduled / ready / in_progress 만 트리거
  // (completed / cancelled / null = 라이브 페이지 자동 트리거 의미 0)
  if (!match.status || !ALLOWED_STATUSES.has(match.status)) {
    return apiSuccess({
      registered: false,
      reason: "match_not_live",
      match_status: match.status ?? "null",
    });
  }

  // 6) 윈도우 가드 — 매치 시작/예정 시각 ±10분 (Q1 결재)
  // started_at 우선 (실제 시작 시각 — 라이브 영상 publishedAt 과 가장 정확 매칭)
  //
  // 2026-05-17 fix B (강남구협회장배 #203 사고) — status='in_progress' 매치는 윈도우 가드 우회.
  //   사유: 운영자가 매치 시작 했는데 started_at 박제 path 누락 (다른 path 사용) → ref=scheduledAt →
  //         실제 시작이 예정보다 늦으면 자동으로 윈도우 밖 → 폴링 종료 → 영상 등록 실패.
  //   룰: 진행 중인 매치 = 시간 무관 폴링 유지 (라이브 영상 등록 기회 보장).
  if (match.status !== "in_progress") {
    const ref = match.started_at ?? match.scheduledAt;
    if (!ref) {
      return apiSuccess({ registered: false, reason: "out_of_window", window_minutes: 10 });
    }
    const refTime = ref.getTime();
    const now = Date.now();
    if (Math.abs(now - refTime) > WINDOW_MS) {
      return apiSuccess({ registered: false, reason: "out_of_window", window_minutes: 10 });
    }
  }

  // 7) Redis cache 확인 — no_match 결과 5분 캐시 (30초 폴링 N viewer 시 quota 1회 만)
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get<{ no_match: true; top_score?: number }>(
        NO_MATCH_CACHE_KEY(matchId),
      );
      if (cached) {
        return apiSuccess({
          registered: false,
          reason: "no_match_found",
          top_score: cached.top_score ?? 0,
        });
      }
    } catch (err) {
      // Redis 장애는 silent fail — YouTube API 호출로 진행 (graceful)
      console.error("[auto-register] Redis get failed:", err);
    }
  }

  // 8) YouTube API 키 확인
  const youtubeKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeKey) {
    return apiError("YouTube API 가 설정되지 않았습니다.", 503, "YOUTUBE_API_NOT_CONFIGURED");
  }

  // 9) BDR uploads playlist 영상 fetch (cache hit ≥99% — 30분 TTL 공유)
  let videos: EnrichedVideo[] = [];
  try {
    videos = await fetchEnrichedVideos(youtubeKey);
  } catch (err) {
    console.error("[auto-register] fetchEnrichedVideos failed:", err);
    return apiError("YouTube 영상 조회에 실패했습니다.", 502);
  }

  // 9-1) 2026-05-10 — 1:1 매핑 가드 (cron `usedSet` 패턴 백포트).
  // 이유(왜): 다른 매치에 이미 박힌 video_id 가 후보 pool 에 남아있으면
  //          home/away 부분 매칭(예: 영상="아울스 vs 업템포" / 매치="슬로우 vs 아울스" → 아울스만 매칭)
  //          + ±30분 시간 시그널만으로 80점 통과 → 결승 158 에 4강 157 영상 잘못 매핑 (5/10 사고).
  // 방법(어떻게): `youtube_video_id IS NOT NULL` 매치 SELECT → Set 으로 후보 pool 제외.
  const usedRows = await prisma.tournamentMatch.findMany({
    where: { youtube_video_id: { not: null } },
    select: { youtube_video_id: true },
  });
  const usedSet = new Set<string>(
    usedRows
      .map((m) => m.youtube_video_id)
      .filter((v): v is string => typeof v === "string" && v.length > 0),
  );
  const availableVideos = videos.filter((v) => !usedSet.has(v.videoId));

  // 10) 점수 계산 — PR-A 헬퍼 그대로 (search route 와 동일 알고리즘)
  const homeTeamName = match.homeTeam?.team?.name ?? "";
  const awayTeamName = match.awayTeam?.team?.name ?? "";
  const tournamentName = match.tournament?.name ?? "";

  const ctx: MatchContext = {
    homeTeamName,
    awayTeamName,
    tournamentName,
    roundName: match.roundName,
    matchCode: match.match_code,
    scheduledAt: match.scheduledAt,
    startedAt: match.started_at,
  };

  // 점수 desc 정렬 — top 1건만 채택 후보
  // (1:1 가드 적용 후 availableVideos pool 만 사용 — 5/10 결승 158 사고 재발 방지)
  const scored = availableVideos
    .map((v) => scoreMatch(v, ctx))
    .sort((a, b) => b.score - a.score);
  const top = scored[0];

  // 11) 80점 미만 = no_match_found + Redis cache 저장 (다음 30초 폴링 시 quota 0)
  if (!top || top.score < SCORE_THRESHOLD_AUTO) {
    if (redis) {
      // fire-and-forget — 응답 지연 0
      redis
        .set(
          NO_MATCH_CACHE_KEY(matchId),
          { no_match: true, top_score: top?.score ?? 0 },
          { ex: NO_MATCH_CACHE_TTL },
        )
        .catch((err) => console.error("[auto-register] Redis set failed:", err));
    }
    return apiSuccess({
      registered: false,
      reason: "no_match_found",
      top_score: top?.score ?? 0,
    });
  }

  // 12) 80점+ 자동 등록 — DB UPDATE
  // is_live=true 면 auto_verified (실시간 라이브 — 즉시 임베딩 OK)
  // is_live=false 면 auto_pending (VOD — 후처리 검토 가능)
  const status = top.is_live ? "auto_verified" : "auto_pending";
  try {
    await prisma.tournamentMatch.update({
      where: { id: matchBigInt },
      data: {
        youtube_video_id: top.video_id,
        youtube_status: status,
        youtube_verified_at: new Date(),
      },
    });
  } catch (err) {
    // UPDATE 실패 시 (예: 동시성 충돌) — 등록 실패로 응답
    console.error("[auto-register] tournamentMatch.update failed:", err);
    return apiError("영상 자동 등록에 실패했습니다.", 500);
  }

  // 13) admin_logs INSERT — audit 박제 (Q9: severity="info" / 정상 동작)
  // admin_id 는 super_admin 첫 번째 (system actor / NOT NULL FK)
  // 실패해도 등록 자체는 성공 — log 만 silent fail
  try {
    const systemAdminId = await resolveSystemAdminId();
    if (systemAdminId !== null) {
      const logNow = new Date();
      await prisma.admin_logs.create({
        data: {
          admin_id: systemAdminId,
          action: "auto_register_youtube_video",
          resource_type: "tournament_match",
          resource_id: matchBigInt,
          target_type: "tournament_match",
          target_id: matchBigInt,
          // changes_made — 점수 / 영상 정보 박제 (잘못된 등록 발견 시 추적용)
          // ScoreBreakdown nested 라 unknown 경유 캐스팅 필요 (prisma JSON 타입 strict)
          changes_made: {
            video_id: top.video_id,
            title: top.title,
            score: top.score,
            score_breakdown: top.score_breakdown,
            is_live: top.is_live,
            status,
            trigger: "auto_register_endpoint",
            ip,
          } as unknown as Prisma.InputJsonValue,
          previous_values: {} as Prisma.InputJsonValue,
          severity: "info",
          description: `auto-register video_id=${top.video_id} score=${top.score}`,
          created_at: logNow,
          updated_at: logNow,
        },
      });
    }
  } catch (err) {
    // log 실패 = 등록 자체에 영향 0 (audit 누락만)
    console.error("[auto-register] admin_logs.create failed:", err);
  }

  // 14) cache invalidate — 등록 후 더 이상 폴링 불필요 (다음 viewer 호출 시 already_registered 반환)
  if (redis) {
    redis
      .del(NO_MATCH_CACHE_KEY(matchId))
      .catch((err) => console.error("[auto-register] Redis del failed:", err));
  }

  return apiSuccess({
    registered: true,
    video_id: top.video_id,
    score: top.score,
    status,
  });
}
