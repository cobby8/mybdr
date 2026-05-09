import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, apiError, forbidden, validationError } from "@/lib/api/response";
import { verifyToken } from "@/lib/auth/jwt";
import { advanceWinner, updateTeamStandings } from "@/lib/tournaments/update-standings";
import { progressDualMatch } from "@/lib/tournaments/dual-progression";
import { z } from "zod";
import { SYNC_ALLOWED_STATUSES } from "@/lib/constants/match-status";
// 2026-05-09: 알기자 자동 발행 — Flutter sync path 가 updateMatchStatus 헬퍼 우회로 trigger 미호출되던 문제 fix.
//   waitUntil 로 wrap (Vercel serverless 응답 종료 후 process abort 방지).
import { waitUntil } from "@vercel/functions";
import { triggerMatchBriefPublish } from "@/lib/news/auto-publish-match-brief";

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
    // 경기 존재 확인
    // 2026-05-02: winner_team_id 자동 결정 (변경 1) 을 위해 homeTeamId/awayTeamId/winner_team_id 가 필요.
    // findFirst 는 전체 row 를 가져오므로 별도 select 불필요 (existing.homeTeamId 등 그대로 사용 가능).
    const existing = await prisma.tournamentMatch.findFirst({
      where: { id: BigInt(match.server_id), tournamentId },
    });
    if (!existing) return apiError("Match not found in tournament", 404);

    const matchId = BigInt(match.server_id);
    const now = new Date();

    // 2026-05-02: dual 자동 진출 (변경 2) 을 위해 tournament.format 1회 조회.
    // 운영 영향 0 (SELECT only), Flutter sync 응답 구조 유지.
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { format: true },
    });

    // 2026-05-02: status="completed" 시 winner_team_id 자동 결정 (Flutter sync 가 winner 를 보내지 않음).
    // - homeScore vs awayScore 비교 (correctedHomeScore/awayScore 는 아래 BUG-04 보정 후에 계산되므로
    //   여기서는 일단 declaration 만 하고, 보정된 점수가 확정된 후 결정).
    // - 동점일 경우 null 유지 (수동 결정 필요 — advanceWinner/progressDualMatch 양쪽 모두 null 시 skip).
    // - 이미 winner_team_id 가 채워져 있으면 그대로 보존 (idempotent).
    let winnerTeamId: bigint | null = existing.winner_team_id;

    // BUG-04 fix: quarterScores 합계와 home_score/away_score 정합성 보정
    let correctedHomeScore = match.home_score;
    let correctedAwayScore = match.away_score;
    if (match.quarter_scores) {
      const qs = match.quarter_scores as {
        home?: { q1?: number; q2?: number; q3?: number; q4?: number; ot?: number[] };
        away?: { q1?: number; q2?: number; q3?: number; q4?: number; ot?: number[] };
      };
      if (qs.home && qs.away) {
        const sumQuarters = (side: { q1?: number; q2?: number; q3?: number; q4?: number; ot?: number[] }) => {
          const base = (side.q1 ?? 0) + (side.q2 ?? 0) + (side.q3 ?? 0) + (side.q4 ?? 0);
          const otSum = (side.ot ?? []).reduce((a: number, b: number) => a + b, 0);
          return base + otSum;
        };
        const qsHome = sumQuarters(qs.home);
        const qsAway = sumQuarters(qs.away);
        if (qsHome !== match.home_score || qsAway !== match.away_score) {
          console.warn(
            `[match-sync] BUG-04: quarterScores mismatch matchId=${match.server_id}` +
            ` qs=${qsHome}-${qsAway} vs score=${match.home_score}-${match.away_score}. Using quarterScores.`
          );
          correctedHomeScore = qsHome;
          correctedAwayScore = qsAway;
        }
      }
    }

    // 2026-05-02: 보정된 점수로 winner 자동 결정 (status="completed" + winner 미결정 시).
    // Flutter sync 는 winner_team_id 를 보내지 않으므로 서버에서 점수 비교로 결정.
    // 동점이면 null 유지 — 진출/전적 후처리 모두 skip (수동 결정 필요).
    if (
      match.status === "completed" &&
      !winnerTeamId &&
      existing.homeTeamId &&
      existing.awayTeamId
    ) {
      if (correctedHomeScore > correctedAwayScore) winnerTeamId = existing.homeTeamId;
      else if (correctedAwayScore > correctedHomeScore) winnerTeamId = existing.awayTeamId;
      // 동점 → winnerTeamId = null 유지
    }

    // 1. 경기 정보 업데이트 (트랜잭션 없이 개별 처리 — PgBouncer 타임아웃 방지)
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        homeScore: correctedHomeScore,
        awayScore: correctedAwayScore,
        status: match.status,
        // 2026-05-02: winner_team_id 자동 결정 결과 반영.
        // 새로 결정된 경우만 UPDATE (기존 값 유지 시 undefined 로 무영향).
        ...(winnerTeamId && winnerTeamId !== existing.winner_team_id
          ? { winner_team_id: winnerTeamId }
          : {}),
        // I-01: current_quarter는 sync data에 포함되지만 DB 컬럼 미존재.
        // quarter_scores JSON 내부에 current_quarter 값을 함께 보관한다.
        quarterScores: match.quarter_scores
          ? JSON.parse(JSON.stringify({
              ...match.quarter_scores,
              ...(match.current_quarter != null && { current_quarter: match.current_quarter }),
            }))
          : (match.current_quarter != null ? { current_quarter: match.current_quarter } : undefined),
        mvp_player_id: match.mvp_player_id ? BigInt(match.mvp_player_id) : undefined,
        started_at: match.started_at ? new Date(match.started_at) : undefined,
        ended_at: match.ended_at ? new Date(match.ended_at) : undefined,
      },
    });

    // 2026-05-09: 알기자 자동 발행 — completed 신규 전환 시점만 trigger.
    //   Flutter sync 는 updateMatchStatus 헬퍼를 우회하므로 본 라우트에 별도 가드.
    //   조건: existing.status !== "completed" + 신규 status === "completed" → 첫 전환만.
    //   waitUntil 로 wrap = Vercel 응답 종료 후 background Promise 보장. dev/local 영향 0.
    if (existing.status !== "completed" && match.status === "completed") {
      waitUntil(triggerMatchBriefPublish(matchId));
    }

    // 1-B. 경기 리셋 감지: status=scheduled + player_stats 없음 + play_by_plays 없음
    // → 서버에 남은 이전 게임 PBP/stats 전체 삭제 (laive log 잔류 방지)
    const isReset = match.status === "scheduled"
      && (!player_stats || player_stats.length === 0)
      && (!play_by_plays || play_by_plays.length === 0);
    if (isReset) {
      await Promise.all([
        prisma.play_by_plays.deleteMany({ where: { tournament_match_id: matchId } }),
        prisma.matchPlayerStat.deleteMany({ where: { tournamentMatchId: matchId } }),
      ]);
      console.log(`[match-sync] Reset detected matchId=${match.server_id} — cleared PBP & stats`);
    }

    // 2. 선수 스탯 upsert (병렬 처리)
    if (player_stats && player_stats.length > 0) {
      const statPromises = player_stats.map((stat) => {
        const fga = stat.field_goals_attempted;
        const tpa = stat.three_pointers_attempted;
        const fta = stat.free_throws_attempted;
        const twopa = stat.two_pointers_attempted;
        const fgPct = fga > 0 ? (stat.field_goals_made / fga * 100) : 0;
        const tpPct = tpa > 0 ? (stat.three_pointers_made / tpa * 100) : 0;
        const ftPct = fta > 0 ? (stat.free_throws_made / fta * 100) : 0;
        const twoPct = twopa > 0 ? (stat.two_pointers_made / twopa * 100) : 0;
        const eff = stat.points + stat.total_rebounds + stat.assists + stat.steals + stat.blocks
          - (fga - stat.field_goals_made) - (fta - stat.free_throws_made) - stat.turnovers;

        const statData = {
          isStarter: stat.is_starter,
          minutesPlayed: stat.minutes_played,
          points: stat.points,
          fieldGoalsMade: stat.field_goals_made,
          fieldGoalsAttempted: stat.field_goals_attempted,
          field_goal_percentage: fgPct,
          threePointersMade: stat.three_pointers_made,
          threePointersAttempted: stat.three_pointers_attempted,
          three_point_percentage: tpPct,
          freeThrowsMade: stat.free_throws_made,
          freeThrowsAttempted: stat.free_throws_attempted,
          free_throw_percentage: ftPct,
          two_pointers_made: stat.two_pointers_made,
          two_pointers_attempted: stat.two_pointers_attempted,
          two_point_percentage: twoPct,
          offensive_rebounds: stat.offensive_rebounds,
          defensive_rebounds: stat.defensive_rebounds,
          total_rebounds: stat.total_rebounds,
          assists: stat.assists,
          steals: stat.steals,
          blocks: stat.blocks,
          turnovers: stat.turnovers,
          personal_fouls: stat.personal_fouls,
          technicalFouls: stat.technical_fouls,
          unsportsmanlikeFouls: stat.unsportsmanlike_fouls,
          plusMinus: stat.plus_minus,
          quarterStatsJson: stat.quarter_stats_json ?? null,
          efficiency: eff,
          fouled_out: stat.fouled_out,
          ejected: stat.ejected,
        };

        return prisma.matchPlayerStat.upsert({
          where: {
            tournamentMatchId_tournamentTeamPlayerId: {
              tournamentMatchId: matchId,
              tournamentTeamPlayerId: BigInt(stat.tournament_team_player_id),
            },
          },
          create: {
            tournamentMatchId: matchId,
            tournamentTeamPlayerId: BigInt(stat.tournament_team_player_id),
            ...statData,
          },
          update: statData,
        });
      });
      await Promise.all(statPromises);
    }

    // 3. Play-by-Play 동기화
    if (play_by_plays && play_by_plays.length > 0) {
      // 2026-04-18: PBP snapshot replace — 앱 undo 가 서버에 즉시 반영되도록
      // 앱 로컬 DB 에서 삭제된 PBP 는 sync data 에 없으므로, incoming local_id 목록에 없는 기존 서버 PBP 삭제.
      // player_id=0 인 PBP(타임아웃/쿼터시작 등)도 incoming 에 있을 수 있으므로 먼저 전체 local_id 목록 수집.
      // 2026-05-02: 운영자 수동 보정 PBP 보존 — 이중 보호 가드 (local_id prefix + description marker).
      //   사례: 매치 132 임강휘 2점 슛이 Flutter app PBP 에 누락 (matchPlayerStat 만 들어감) → 운영자가 수동 INSERT.
      //   향후 Flutter sync 시 이 PBP 가 자동 삭제되지 않도록 이중 보호:
      //     (1) local_id startsWith "manual-fix-"
      //     (2) description startsWith "[수동 보정]"
      //   둘 중 하나만 매치되어도 보호. 단일 prefix 기반보다 견고.
      const incomingLocalIds = play_by_plays.map((pbp) => pbp.local_id);
      await prisma.play_by_plays.deleteMany({
        where: {
          tournament_match_id: matchId,
          NOT: {
            OR: [
              { local_id: { in: incomingLocalIds } },
              { local_id: { startsWith: "manual-fix-" } },
              { description: { startsWith: "[수동 보정]" } },
            ],
          },
        },
      });

      // player_id=0인 PBP(타임아웃/쿼터시작 등)는 upsert 에서 제외
      const validPbps = play_by_plays.filter((pbp) => pbp.tournament_team_player_id > 0 && pbp.tournament_team_id > 0);
      const pbpPromises = validPbps.map((pbp) => {
        const pbpData = {
          tournament_match_id: matchId,
          tournament_team_player_id: BigInt(pbp.tournament_team_player_id),
          tournament_team_id: BigInt(pbp.tournament_team_id),
          quarter: pbp.quarter,
          game_clock_seconds: pbp.game_clock_seconds,
          shot_clock_seconds: pbp.shot_clock_seconds ?? null,
          action_type: pbp.action_type,
          action_subtype: pbp.action_subtype ?? null,
          is_made: pbp.is_made ?? null,
          points_scored: pbp.points_scored,
          court_x: pbp.court_x ?? null,
          court_y: pbp.court_y ?? null,
          court_zone: pbp.court_zone ?? null,
          shot_distance: pbp.shot_distance ?? null,
          home_score_at_time: pbp.home_score_at_time,
          away_score_at_time: pbp.away_score_at_time,
          assist_player_id: pbp.assist_player_id ? BigInt(pbp.assist_player_id) : null,
          rebound_player_id: pbp.rebound_player_id ? BigInt(pbp.rebound_player_id) : null,
          block_player_id: pbp.block_player_id ? BigInt(pbp.block_player_id) : null,
          steal_player_id: pbp.steal_player_id ? BigInt(pbp.steal_player_id) : null,
          fouled_player_id: pbp.fouled_player_id ? BigInt(pbp.fouled_player_id) : null,
          sub_in_player_id: pbp.sub_in_player_id ? BigInt(pbp.sub_in_player_id) : null,
          sub_out_player_id: pbp.sub_out_player_id ? BigInt(pbp.sub_out_player_id) : null,
          is_flagrant: pbp.is_flagrant,
          is_technical: pbp.is_technical,
          is_fastbreak: pbp.is_fastbreak,
          is_second_chance: pbp.is_second_chance,
          is_from_turnover: pbp.is_from_turnover,
          description: pbp.description ?? null,
          updated_at: now,
        };

        return prisma.play_by_plays.upsert({
          where: { local_id: pbp.local_id },
          create: {
            local_id: pbp.local_id,
            ...pbpData,
            created_at: now,
          },
          update: pbpData,
        });
      });
      await Promise.all(pbpPromises);
    }

    // 경기 완료 시 승자 진출 + 전적 업데이트를 병렬 실행
    // Promise.allSettled를 사용하면 하나가 실패해도 나머지가 중단되지 않고, 각각의 성공/실패를 개별 확인 가능
    const warnings: string[] = [];
    let postProcessStatus: "ok" | "partial_failure" | "skipped" = "skipped";

    if (match.status === "completed") {
      // 2026-05-02: dual_tournament 면 progressDualMatch 추가 (loser 진출 + idempotent winner 진출).
      // - 기존 advanceWinner/updateTeamStandings 와 병렬 (서로 독립).
      // - winnerTeamId 가 null 이면 (동점) skip.
      // - 실패 시 warnings 에 추가하지만 sync 자체는 성공 (best effort).
      // - 트랜잭션은 progressDualMatch 내부에서 관리 (caller 가 tx 전달).
      const isDual = tournament?.format === "dual_tournament";

      // 2026-05-03: dual_tournament 은 advanceWinner skip — progressDualMatch 가 진출 처리 전담.
      // - 과거 버그: advanceWinner 가 dual 매치에도 호출되어 빈 슬롯에 winner 자동 배치 → progressDualMatch self-heal 이 nullify → advanceWinner 다시 채움 무한 루프 corrupt (5/2 C조 + 5/3 D조 audit 11~12회 확인).
      // - guard: isDual 일 때 tasks 에서 advanceWinner 제외. updateTeamStandings 는 항상 실행 (전적 산정 공통).
      const tasks: Promise<unknown>[] = [
        ...(isDual ? [] : [advanceWinner(matchId)]),
        updateTeamStandings(matchId),
      ];
      if (isDual && winnerTeamId) {
        tasks.push(
          prisma.$transaction(async (tx) => {
            await progressDualMatch(tx, matchId, winnerTeamId!);
          })
        );
      }

      const results = await Promise.allSettled(tasks);
      // 2026-05-03: tasks 구성이 isDual 에 따라 가변(dual=advanceWinner 제외) → 인덱스 동적 산출.
      // 순서 = [advanceWinner?, updateTeamStandings, progressDualMatch?]
      let cursor = 0;
      const advanceResult = isDual ? null : results[cursor++];
      const standingsResult = results[cursor++];
      const dualResult = isDual && winnerTeamId ? results[cursor++] : null;

      // 각 후처리 결과를 개별 확인하여 실패 항목만 warnings에 추가
      if (advanceResult && advanceResult.status === "rejected") {
        console.error(`[match-sync:post-process] advanceWinner failed matchId=${match.server_id}:`, advanceResult.reason);
        warnings.push("승자 진출 처리 실패 — 관리자에게 문의하세요");
      }
      if (standingsResult.status === "rejected") {
        console.error(`[match-sync:post-process] updateTeamStandings failed matchId=${match.server_id}:`, standingsResult.reason);
        warnings.push("전적 갱신 실패 — 관리자에게 문의하세요");
      }
      if (dualResult && dualResult.status === "rejected") {
        console.error(`[match-sync:post-process] progressDualMatch failed matchId=${match.server_id}:`, dualResult.reason);
        warnings.push("듀얼토너먼트 자동 진출 실패 — 관리자에게 문의하세요");
      }

      // 모두 성공이면 "ok", 하나라도 실패면 "partial_failure"
      postProcessStatus = warnings.length === 0 ? "ok" : "partial_failure";
    }

    return apiSuccess({
      server_match_id: Number(match.server_id),
      player_count: player_stats?.length ?? 0,
      play_by_play_count: play_by_plays?.length ?? 0,
      synced_at: now.toISOString(),
      post_process_status: postProcessStatus,
      ...(warnings.length > 0 && { warnings }),
    });
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
