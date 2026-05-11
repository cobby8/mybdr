import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, apiError, forbidden, validationError } from "@/lib/api/response";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";
import { SYNC_ALLOWED_STATUSES } from "@/lib/constants/match-status";
// 2026-05-11: Phase 1-A 매치별 recording_mode 게이팅 (decisions.md [2026-05-11] §3).
//   settings.recording_mode === "paper" 매치는 Flutter sync 차단 — 웹 종이 기록지와 충돌 방지.
//   기존 매치 100% (settings null / {}) 는 fallback "flutter" 로 그대로 허용 — 운영 영향 0.
import { assertRecordingMode } from "@/lib/tournaments/recording-mode";
// 2026-05-11: Phase 1-B refactor — sync core 로직을 service 로 추출.
//   본 route 는 zod 검증 + 권한 + 모드 가드 + service 호출 + 응답 wrap 만 담당.
//   웹 종이 기록지 BFF (`/api/web/score-sheet/[matchId]/submit`) 도 동일 service 호출 = 단일 source.
import { syncSingleMatch } from "@/lib/services/match-sync";

// 단일 경기 동기화 스키마 (Flutter bdr_stat 앱용)
const playByPlaySchema = z.object({
  local_id: z.string().min(1),
  tournament_team_player_id: z.number().int().min(0),
  tournament_team_id: z.number().int().min(0),
  quarter: z.number().int().min(1).max(8),
  game_clock_seconds: z.number().int().min(0),
  shot_clock_seconds: z.number().int().min(0).optional().nullable(),
  action_type: z.string().min(1),
  action_subtype: z.string().optional().nullable(),
  is_made: z.boolean().optional().nullable(),
  points_scored: z.number().int().min(0).default(0),
  court_x: z.number().optional().nullable(),
  court_y: z.number().optional().nullable(),
  court_zone: z.number().int().optional().nullable(),
  shot_distance: z.number().optional().nullable(),
  home_score_at_time: z.number().int().min(0),
  away_score_at_time: z.number().int().min(0),
  assist_player_id: z.number().int().positive().optional().nullable(),
  rebound_player_id: z.number().int().positive().optional().nullable(),
  block_player_id: z.number().int().positive().optional().nullable(),
  steal_player_id: z.number().int().positive().optional().nullable(),
  fouled_player_id: z.number().int().positive().optional().nullable(),
  sub_in_player_id: z.number().int().positive().optional().nullable(),
  sub_out_player_id: z.number().int().positive().optional().nullable(),
  is_flagrant: z.boolean().default(false),
  is_technical: z.boolean().default(false),
  is_fastbreak: z.boolean().default(false),
  is_second_chance: z.boolean().default(false),
  is_from_turnover: z.boolean().default(false),
  description: z.string().optional().nullable(),
});

const singleMatchSyncSchema = z.object({
  match: z.object({
    server_id: z.number().int().min(0),
    home_score: z.number().int().min(0),
    away_score: z.number().int().min(0),
    status: z.enum(SYNC_ALLOWED_STATUSES),
    current_quarter: z.number().int().min(0).max(8).optional(),
    quarter_scores: z.any().optional(),
    mvp_player_id: z.number().int().positive().optional().nullable(),
    started_at: z.string().optional().nullable(),
    ended_at: z.string().optional().nullable(),
  }),
  player_stats: z.array(z.object({
    tournament_team_player_id: z.number().int().positive(),
    tournament_team_id: z.number().int().positive(),
    is_starter: z.boolean().default(false),
    minutes_played: z.number().int().min(0).default(0),
    points: z.number().int().min(0).default(0),
    field_goals_made: z.number().int().min(0).default(0),
    field_goals_attempted: z.number().int().min(0).default(0),
    two_pointers_made: z.number().int().min(0).default(0),
    two_pointers_attempted: z.number().int().min(0).default(0),
    three_pointers_made: z.number().int().min(0).default(0),
    three_pointers_attempted: z.number().int().min(0).default(0),
    free_throws_made: z.number().int().min(0).default(0),
    free_throws_attempted: z.number().int().min(0).default(0),
    offensive_rebounds: z.number().int().min(0).default(0),
    defensive_rebounds: z.number().int().min(0).default(0),
    total_rebounds: z.number().int().min(0).default(0),
    assists: z.number().int().min(0).default(0),
    steals: z.number().int().min(0).default(0),
    blocks: z.number().int().min(0).default(0),
    turnovers: z.number().int().min(0).default(0),
    personal_fouls: z.number().int().min(0).default(0),
    technical_fouls: z.number().int().min(0).default(0),
    unsportsmanlike_fouls: z.number().int().min(0).default(0),
    plus_minus: z.number().int().default(0),
    quarter_stats_json: z.string().nullable().optional(),
    fouled_out: z.boolean().default(false),
    ejected: z.boolean().default(false),
  })).optional(),
  play_by_plays: z.array(playByPlaySchema).optional(),
});

// FR-025b: 단일 매치 동기화 (bdr_stat Flutter 앱)
async function handler(req: NextRequest, ctx: AuthContext, tournamentId: string) {
  // 권한 확인: super_admin/admin은 모든 대회 접근 가능
  const isSuperUser = ctx.userRole === "super_admin" || ctx.userRole === "admin";
  if (!isSuperUser) {
    const adminMember = await prisma.tournamentAdminMember.findFirst({
      where: { tournamentId, userId: BigInt(ctx.userId), isActive: true },
    });
    const recorder = await prisma.tournament_recorders.findFirst({
      where: { tournamentId, recorderId: BigInt(ctx.userId) },
    });
    if (!adminMember && !recorder) return forbidden("No access to this tournament");
  }

  let body: unknown;
  try { body = await req.json(); } catch { return validationError([{ message: "Invalid JSON body" }]); }

  const result = singleMatchSyncSchema.safeParse(body);
  if (!result.success) {
    console.log("[match-sync] VALIDATION FAILED:", JSON.stringify(result.error.issues));
    return validationError(result.error.issues);
  }

  const { match, player_stats, play_by_plays } = result.data;

  try {
    // 2026-05-11: Phase 1-A 매치별 recording_mode 게이팅 — paper 매치 차단.
    // service 호출 전 가드 (service 는 모드 무관 core 로직만 담당 — caller 책임).
    // 별도 SELECT 1회 (id + settings) — 본 route handler 직접 수행.
    const modeRow = await prisma.tournamentMatch.findFirst({
      where: { id: BigInt(match.server_id), tournamentId },
      select: { id: true, settings: true },
    });
    if (modeRow) {
      const modeGuard = assertRecordingMode(modeRow, "flutter", "Flutter sync from app");
      if (modeGuard) return modeGuard;
    }
    // modeRow null = 매치 미존재 — service 가 동일 SELECT 후 404 반환 (단일 source 보장).

    // 2026-05-11: Phase 1-B — core sync 로직 service 호출.
    // service 는 zod 검증 후의 input 만 받음 (route 가 검증 책임).
    const syncResult = await syncSingleMatch({
      tournamentId,
      match,
      player_stats,
      play_by_plays,
    });

    if (!syncResult.ok) {
      // 매치 미존재 = 404, 기타 = 500 (현 시점 MATCH_NOT_FOUND 만 명시 — 그 외는 service 가 throw)
      if (syncResult.code === "MATCH_NOT_FOUND") {
        return apiError(syncResult.message, 404);
      }
      return apiError(syncResult.message, 500);
    }

    // 응답 envelope = 기존 sync route 와 100% 동일 형식.
    return apiSuccess(syncResult.data);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[match-sync] Match ${match.server_id} failed:`, errMsg, err);
    return apiError(`Sync failed: ${errMsg}`, 500);
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  // 디버깅: 요청 로그
  let bodyForLog: unknown;
  try { bodyForLog = await req.clone().json(); } catch { bodyForLog = "parse_failed"; }
  const tokenPreview = req.headers.get("authorization")?.slice(0, 30) ?? "NONE";
  console.log(`[match-sync] tournament=${id} token=${tokenPreview}...`);
  console.log(`[match-sync] body.match=`, JSON.stringify((bodyForLog as Record<string, unknown>)?.match ?? "no_match"));

  // JWT 우선, 실패 시 대회 API token 폴백
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) { console.log("[match-sync] NO TOKEN"); return apiError("Unauthorized", 401); }

  const payload = await verifyToken(token);
  if (payload) {
    // JWT 인증 성공
    const authCtx: AuthContext = {
      userId: payload.sub,
      userRole: payload.role,
      payload,
    };
    return withErrorHandler(async (_r: NextRequest) => {
      return handler(_r, authCtx, id);
    })(req);
  }

  // API token 폴백
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { apiToken: true, organizerId: true },
  });

  if (tournament?.apiToken && tournament.apiToken === token) {
    const authCtx: AuthContext = {
      userId: String(tournament.organizerId),
      userRole: "organizer",
      payload: { sub: String(tournament.organizerId), email: "", name: "", role: "organizer" },
    };
    return withErrorHandler(async (_r: NextRequest) => {
      return handler(_r, authCtx, id);
    })(req);
  }

  return apiError("Unauthorized", 401);
}
