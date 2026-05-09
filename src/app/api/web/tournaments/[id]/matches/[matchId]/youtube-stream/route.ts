/**
 * 2026-05-09 PR2 — 매치 라이브 YouTube 영상 스트림 등록/갱신/제거 API.
 *
 * 도메인 컨텍스트 (Dev/live-youtube-embed-2026-05-09.md §6):
 *   tournament_matches 에 ADD COLUMN 3 (youtube_video_id / youtube_status / youtube_verified_at) — 1:1 옵션 A.
 *   상태값:
 *     - "manual"        — 운영자가 수동 URL 입력 (1차 흐름)
 *     - "auto_verified" — 자동 검색 ≥80점 채택 (Q8 임계값)
 *     - "auto_pending"  — 자동 검색 후보 검토중 (50~79점)
 *     - null            — 미등록
 *
 * 권한 (Q7 결재):
 *   super_admin / tournament.organizerId / tournamentAdminMember(is_active=true).
 *   recorder 제외 (점수 입력 전용 권한이라 영상 등록 권한 별도).
 *
 * 가드:
 *   - withWebAuth → JWT 쿠키 검증
 *   - resolveMatchStreamAuth → matchId 존재 + tournamentId 일치 (IDOR 방어) + 권한 3종
 *   - zod → URL/status 입력 검증
 *   - extractVideoId → 정규식 11자 검증 + URL 파서 (악의적 입력 차단)
 *   - fetchVideoMeta → /videos API 1회 (실존 검증, 쿼터 1) — 옵션 (no-verify 플래그로 우회 가능)
 *
 * 응답 envelope: apiSuccess() / apiError() — 자동 snake_case 변환.
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { resolveMatchStreamAuth } from "@/lib/auth/match-stream";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { extractVideoId, fetchVideoMeta } from "@/lib/youtube/enriched-videos";
import { adminLog } from "@/lib/admin/log";

type Ctx = { params: Promise<{ id: string; matchId: string }> };

// 등록/갱신 입력 스키마.
// youtubeUrl: URL 또는 video_id 11자 직접 입력 양쪽 허용.
// status: 수동 등록은 "manual" 고정, 자동 검색 채택은 "auto_verified" / 후보 검토는 "auto_pending".
const PostBodySchema = z.object({
  youtubeUrl: z.string().min(1).max(500),
  status: z.enum(["manual", "auto_verified", "auto_pending"]).optional(),
  // 자동 검색에서 호출 시 video_id 실존 검증 스킵 (이미 검색 단계에서 검증됨 — 쿼터 절약)
  skipVerify: z.boolean().optional(),
});

const PatchBodySchema = z.object({
  youtubeUrl: z.string().min(1).max(500).optional(),
  status: z.enum(["manual", "auto_verified", "auto_pending"]).optional(),
  skipVerify: z.boolean().optional(),
});

/**
 * POST /api/web/tournaments/[id]/matches/[matchId]/youtube-stream
 * — 신규 등록 (기존 등록 있어도 덮어씀 — UPSERT 의미).
 *
 * body: { youtubeUrl, status?, skipVerify? }
 * 401 = 미로그인 / 403 = 권한 없음 / 404 = 매치 없음 또는 다른 대회 / 422 = URL 파싱 실패 / 502 = video_id 실존 검증 실패
 */
export const POST = withWebAuth(async (req: NextRequest, routeCtx: Ctx, ctx: WebAuthContext) => {
  const { id: tournamentId, matchId } = await routeCtx.params;

  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  // 입력 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }
  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("입력값이 유효하지 않습니다.", 422, "VALIDATION_ERROR");
  }
  const { youtubeUrl, status, skipVerify } = parsed.data;

  // video_id 추출 (URL/직접입력 양쪽 + 11자 정규식 검증) — XSS / 악의적 입력 1차 차단
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    return apiError("유효한 YouTube 영상 URL 또는 ID 가 아닙니다.", 422, "INVALID_YOUTUBE_URL");
  }

  // 권한 + IDOR + 매치 메타 한 번에 검증 (왕복 1회)
  const auth = await resolveMatchStreamAuth(ctx.userId, tournamentId, matchBigInt, ctx.session);
  if ("error" in auth) return auth.error;

  // video_id 실존 검증 (skipVerify=true 시 우회 — 자동 검색 후 등록 케이스)
  if (!skipVerify) {
    const youtubeKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeKey) {
      // API 키 없을 때는 등록 자체는 허용 (운영 영향 0). 검증만 스킵.
      console.warn("[youtube-stream] YOUTUBE_API_KEY not configured — skipping verification");
    } else {
      try {
        const meta = await fetchVideoMeta(videoId, youtubeKey);
        if (!meta) {
          return apiError("YouTube 에서 해당 영상을 찾을 수 없습니다.", 404, "VIDEO_NOT_FOUND");
        }
      } catch (err) {
        // YouTube API 장애 — 등록은 통과 (graceful). 운영자 경고만 로그.
        console.error("[youtube-stream] verification failed (non-fatal):", err);
      }
    }
  }

  const finalStatus = status ?? "manual";
  const now = new Date();

  // ADD COLUMN 3 갱신 — 단일 SQL UPDATE
  await prisma.tournamentMatch.update({
    where: { id: matchBigInt },
    data: {
      youtube_video_id: videoId,
      youtube_status: finalStatus,
      youtube_verified_at: now,
    },
  });

  // admin_logs INSERT — 운영자 활동 추적 (warning severity)
  await adminLog("match_youtube_stream_set", "tournament_match", {
    targetType: "tournament_match",
    targetId: matchBigInt,
    description: `매치 ${matchBigInt.toString()} YouTube 영상 등록: ${videoId} (${finalStatus})`,
    severity: "info",
    changesMade: {
      tournament_match_id: matchBigInt.toString(),
      youtube_video_id: videoId,
      youtube_status: finalStatus,
    },
    previousValues: {
      youtube_video_id: auth.match.youtube_video_id,
      youtube_status: auth.match.youtube_status,
    },
  });

  return apiSuccess({
    matchId: matchBigInt.toString(),
    youtubeVideoId: videoId,
    youtubeStatus: finalStatus,
    youtubeVerifiedAt: now.toISOString(),
  });
});

/**
 * PATCH — 등록된 영상 갱신 (URL 교체 또는 status 만 갱신).
 *
 * body: { youtubeUrl?, status?, skipVerify? }
 * youtubeUrl 도 status 도 미전달이면 400 (변경 사항 없음).
 */
export const PATCH = withWebAuth(async (req: NextRequest, routeCtx: Ctx, ctx: WebAuthContext) => {
  const { id: tournamentId, matchId } = await routeCtx.params;

  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }
  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("입력값이 유효하지 않습니다.", 422, "VALIDATION_ERROR");
  }
  const { youtubeUrl, status, skipVerify } = parsed.data;

  if (!youtubeUrl && !status) {
    return apiError("변경할 값이 없습니다.", 400);
  }

  const auth = await resolveMatchStreamAuth(ctx.userId, tournamentId, matchBigInt, ctx.session);
  if ("error" in auth) return auth.error;

  // 갱신 대상 필드 동적 구성 (undefined 면 미변경)
  const updateData: {
    youtube_video_id?: string;
    youtube_status?: string;
    youtube_verified_at?: Date;
  } = {};

  if (youtubeUrl) {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return apiError("유효한 YouTube 영상 URL 또는 ID 가 아닙니다.", 422, "INVALID_YOUTUBE_URL");
    }

    // skipVerify=false 시 video_id 실존 검증
    if (!skipVerify) {
      const youtubeKey = process.env.YOUTUBE_API_KEY;
      if (youtubeKey) {
        try {
          const meta = await fetchVideoMeta(videoId, youtubeKey);
          if (!meta) {
            return apiError("YouTube 에서 해당 영상을 찾을 수 없습니다.", 404, "VIDEO_NOT_FOUND");
          }
        } catch (err) {
          console.error("[youtube-stream] verification failed (non-fatal):", err);
        }
      }
    }

    updateData.youtube_video_id = videoId;
    updateData.youtube_verified_at = new Date();
  }
  if (status) {
    updateData.youtube_status = status;
    if (!updateData.youtube_verified_at) {
      // status 만 변경할 때도 verified_at 갱신 (검증 시점 추적)
      updateData.youtube_verified_at = new Date();
    }
  }

  await prisma.tournamentMatch.update({
    where: { id: matchBigInt },
    data: updateData,
  });

  await adminLog("match_youtube_stream_update", "tournament_match", {
    targetType: "tournament_match",
    targetId: matchBigInt,
    description: `매치 ${matchBigInt.toString()} YouTube 영상 갱신`,
    severity: "info",
    changesMade: {
      tournament_match_id: matchBigInt.toString(),
      ...(updateData.youtube_video_id ? { youtube_video_id: updateData.youtube_video_id } : {}),
      ...(updateData.youtube_status ? { youtube_status: updateData.youtube_status } : {}),
    },
    previousValues: {
      youtube_video_id: auth.match.youtube_video_id,
      youtube_status: auth.match.youtube_status,
    },
  });

  return apiSuccess({
    matchId: matchBigInt.toString(),
    youtubeVideoId: updateData.youtube_video_id ?? auth.match.youtube_video_id,
    youtubeStatus: updateData.youtube_status ?? auth.match.youtube_status,
    youtubeVerifiedAt: (updateData.youtube_verified_at ?? new Date()).toISOString(),
  });
});

/**
 * DELETE — 등록 영상 제거 (3 컬럼 모두 NULL 처리).
 *
 * 200 = 성공 / 401 = 미로그인 / 403 = 권한 없음 / 404 = 매치 없음 또는 다른 대회
 */
export const DELETE = withWebAuth(async (_req: NextRequest, routeCtx: Ctx, ctx: WebAuthContext) => {
  const { id: tournamentId, matchId } = await routeCtx.params;

  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  const auth = await resolveMatchStreamAuth(ctx.userId, tournamentId, matchBigInt, ctx.session);
  if ("error" in auth) return auth.error;

  // 이미 NULL 이면 noop 처리 (404 안 냄 — 멱등성)
  await prisma.tournamentMatch.update({
    where: { id: matchBigInt },
    data: {
      youtube_video_id: null,
      youtube_status: null,
      youtube_verified_at: null,
    },
  });

  await adminLog("match_youtube_stream_remove", "tournament_match", {
    targetType: "tournament_match",
    targetId: matchBigInt,
    description: `매치 ${matchBigInt.toString()} YouTube 영상 제거`,
    severity: "warning",
    previousValues: {
      youtube_video_id: auth.match.youtube_video_id,
      youtube_status: auth.match.youtube_status,
    },
  });

  return apiSuccess({ removed: true });
});
