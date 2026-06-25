// 2026-05-16: match_player_jersey resolver 미적용 — 매치 컨텍스트 없는 정적 명단 dump.
// 응답 players[].jersey_number = ttp 영구값 (선수당 1번호, 매치 무관). matches[] 배열은 별도이며
// players 와 join 안 됨 → 매치별 jersey 매핑 응답 스키마상 표현 불가. Flutter 앱은 매치 진입 시
// v1/matches/[id]/stats (이미 PR5 적용) 또는 roster 를 호출해 그 매치의 정확값을 받음.
// 따라서 본 full-data dump 는 ttp.jerseyNumber 직접 사용이 정답.
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { notFound, forbidden } from "@/lib/api/response";
import { getTournamentFullData, hasAccessToTournament } from "@/lib/services/tournament";
import { getDisplayName } from "@/lib/utils/player-display-name";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";
import { toGameRulesResponse } from "@/lib/tournaments/game-rules";
import { getRecordingMode, getTournamentDefaultMode } from "@/lib/tournaments/recording-mode";

// FR-024: 토너먼트 전체 데이터 다운로드 (Flutter 오프라인 동기화)
// 이 라우트는 Flutter와의 호환성을 위해 명시적 snake_case 사용
// 2026-05-16 — recorder_admin 전역 흡수 (Flutter 기록앱 모든 대회 진입 통과)
async function handler(
  _req: NextRequest,
  ctx: AuthContext,
  tournamentId: string
) {
  // IDOR 방지 — super_admin / recorder_admin 자동 통과, 그 외 organizer/TAM/recorder DB 검증
  const hasGlobalAccess = isSuperAdmin(ctx.payload) || isRecorderAdmin(ctx.payload);
  const hasAccess = await hasAccessToTournament(tournamentId, BigInt(ctx.userId), hasGlobalAccess);
  if (!hasAccess) return forbidden("No access to this tournament");

  let fullData;
  try {
    fullData = await getTournamentFullData(tournamentId);
  } catch (dbError) {
    console.error("[full-data] DB error:", dbError);
    return new Response(JSON.stringify({ error: "DB error", detail: String(dbError) }), { status: 500 });
  }
  if (!fullData) return notFound("Tournament not found");

  const { tournament, teams, players, matches, playerStats } = fullData;
  const gameRules = toGameRulesResponse(tournament.game_rules);
  const publicTeams = teams.filter((team) => team.status === "approved");
  const publicTournamentTeamIds = new Set(publicTeams.map((team) => team.id.toString()));
  const publicMatches = matches.filter((match) => {
    const homeId = match.homeTeamId?.toString() ?? null;
    const awayId = match.awayTeamId?.toString() ?? null;
    return (
      (homeId === null || publicTournamentTeamIds.has(homeId)) &&
      (awayId === null || publicTournamentTeamIds.has(awayId))
    );
  });
  const publicMatchIds = new Set(publicMatches.map((match) => match.id.toString()));
  const publicPlayers = players.filter((player) =>
    publicTournamentTeamIds.has(player.tournamentTeamId.toString()),
  );
  const publicPlayerStats = playerStats.filter((stat) =>
    publicMatchIds.has(stat.tournamentMatchId.toString()),
  );

  return NextResponse.json({
    tournament: {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      start_date: tournament.startDate?.toISOString() ?? null,
      end_date: tournament.endDate?.toISOString() ?? null,
      venue_name: tournament.venue_name,
      venue_address: tournament.venue_address,
      team_count: publicTeams.length,
      match_count: publicMatches.length,
      logo_url: tournament.logo_url ?? null,
      court_bg_url: tournament.court_bg_url ?? null,
      places: tournament.places ?? null,
      schedule_dates: tournament.schedule_dates ?? [],
      default_recording_mode: getTournamentDefaultMode(tournament),
      ...gameRules,
    },
    teams: publicTeams.map((t) => ({
      id: Number(t.id),
      tournament_id: t.tournamentId,
      team_id: Number(t.teamId),
      team_name: t.team.name,
      primary_color: t.team.primaryColor,
      secondary_color: t.team.secondaryColor,
      status: t.status,
      category: t.category,
      division: t.division,
      division_tier: t.division_tier,
      uniform_home: t.uniform_home,
      uniform_away: t.uniform_away,
      group_name: t.groupName,
      seed_number: t.seedNumber,
      wins: t.wins,
      losses: t.losses,
      draws: t.draws,
      points_for: t.points_for,
      points_against: t.points_against,
      point_difference: t.point_difference,
      win_points: t.win_points,
      final_rank: t.final_rank,
    })),
    players: publicPlayers.map((p) => ({
      id: Number(p.id),
      tournament_team_id: Number(p.tournamentTeamId),
      user_id: p.userId?.toString(),
      // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
      user_name: getDisplayName(p.users, { player_name: p.player_name, jerseyNumber: p.jerseyNumber }, `#${p.jerseyNumber ?? p.id}`),
      jersey_number: p.jerseyNumber,
      position: p.position,
      role: p.role,
      phone: p.phone,
      auto_registered: p.auto_registered ?? false,
      is_starter: p.isStarter ?? false,
      is_elite: p.is_elite ?? false,
      is_active: p.is_active ?? true,
      division_code: p.division_code ?? null,
    })),
    matches: publicMatches.map((m) => {
      const settings =
        m.settings && typeof m.settings === "object" && !Array.isArray(m.settings)
          ? (m.settings as Record<string, unknown>)
          : {};
      return {
      id: Number(m.id),
      uuid: m.uuid,
      tournament_id: m.tournamentId,
      home_team_id: m.homeTeamId ? Number(m.homeTeamId) : null,
      away_team_id: m.awayTeamId ? Number(m.awayTeamId) : null,
      round_name: m.roundName,
      round_number: m.round_number,
      group_name: m.group_name,
      match_code: m.match_code,
      scheduled_at: m.scheduledAt?.toISOString() ?? null,
      started_at: m.started_at?.toISOString() ?? null,
      ended_at: m.ended_at?.toISOString() ?? null,
      status: m.status,
      home_score: m.homeScore,
      away_score: m.awayScore,
      winner_team_id: m.winner_team_id ? Number(m.winner_team_id) : null,
      mvp_player_id: m.mvp_player_id ? Number(m.mvp_player_id) : null,
      venue_id: m.venue_id ? Number(m.venue_id) : null,
      venue_name: m.venue_name,
      court_number: m.court_number,
      division_code: typeof settings.division_code === "string" ? settings.division_code : null,
      recording_mode: getRecordingMode(m),
      home_slot_label: typeof settings.homeSlotLabel === "string" ? settings.homeSlotLabel : null,
      away_slot_label: typeof settings.awaySlotLabel === "string" ? settings.awaySlotLabel : null,
      quarter_scores: m.quarterScores,
    };
    }),
    player_stats: publicPlayerStats.map((s) => ({
      id: Number(s.id),
      tournament_match_id: Number(s.tournamentMatchId),
      tournament_team_player_id: Number(s.tournamentTeamPlayerId),
      is_starter: s.isStarter ?? false,
      minutes_played: s.minutesPlayed ?? 0,
      points: s.points ?? 0,
      field_goals_made: s.fieldGoalsMade ?? 0,
      field_goals_attempted: s.fieldGoalsAttempted ?? 0,
      two_pointers_made: s.two_pointers_made ?? 0,
      two_pointers_attempted: s.two_pointers_attempted ?? 0,
      three_pointers_made: s.threePointersMade ?? 0,
      three_pointers_attempted: s.threePointersAttempted ?? 0,
      free_throws_made: s.freeThrowsMade ?? 0,
      free_throws_attempted: s.freeThrowsAttempted ?? 0,
      offensive_rebounds: s.offensive_rebounds ?? 0,
      defensive_rebounds: s.defensive_rebounds ?? 0,
      total_rebounds: s.total_rebounds ?? 0,
      assists: s.assists ?? 0,
      steals: s.steals ?? 0,
      blocks: s.blocks ?? 0,
      turnovers: s.turnovers ?? 0,
      personal_fouls: s.personal_fouls ?? 0,
      plus_minus: s.plusMinus ?? 0,
      fouled_out: s.fouled_out ?? false,
      ejected: s.ejected ?? false,
    })),
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    return await withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
      return handler(r, authCtx, id);
    }))(req);
  } catch (error) {
    console.error("[full-data] Unhandled error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
