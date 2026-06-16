import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { officialMatchWhere } from "@/lib/tournaments/official-match";
import { toRawBox, aggregateBox, type RawBox } from "@/lib/records/match-stat-aggregate";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 팀 기록 공개 API (인증 불필요)
 * GET /api/web/teams/[id]/records
 *
 * 팀 상세 "기록" 탭에서 호출. 경기별/대회별/시즌별 3 스코프를 한 번에 반환.
 * - 공식가드(officialMatchWhere) 필수 — 미래/비공식 매치 집계 금지.
 * - ⚠ 대회 경기(TournamentMatch) 한정 — 박스스코어는 tournament_match_id 에만 연결.
 *   친선/픽업(games)은 박스 없음. (PM 결재: 대회 경기 한정)
 * - 로스터/집계는 TournamentTeam 경유 TournamentTeamPlayer(ttp) 기준. (PM 결재 Q6)
 * - 신규 DB 0. apiSuccess() = 응답 키 자동 snake_case (프론트 접근자도 snake).
 * - 평점(rating)은 매치 단위 소스 부재 → null('–' 표기). (PM 결재 Q1)
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  // 팀 id 는 BigInt(숫자) — 대회(uuid)와 다름.
  if (!/^\d+$/.test(id)) return apiError("Invalid team ID", 400);
  const teamId = BigInt(id);

  // 1) 팀 메타
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });
  if (!team) return apiError("Team not found", 404);

  // 2) 이 팀의 TournamentTeam id 목록 (Q6: ttp 연결고리)
  const tts = await prisma.tournamentTeam.findMany({
    where: { teamId },
    select: { id: true },
  });
  const ttIds = tts.map((t) => t.id);

  const emptyResponse = {
    meta: { team_name: team.name ?? "팀", members_n: 0, claimed_n: 0 },
    seasons: [] as number[],
    tournaments: [] as { id: string; name: string }[],
    games: [] as unknown[],
    season_rosters: {} as Record<string, unknown[]>,
    tournament_rosters: {} as Record<string, unknown[]>,
  };
  if (ttIds.length === 0) return apiSuccess(emptyResponse);

  // 3) 공식 매치 (공식가드 필수) — 이 팀이 home 또는 away
  const matches = await prisma.tournamentMatch.findMany({
    where: officialMatchWhere({
      OR: [{ homeTeamId: { in: ttIds } }, { awayTeamId: { in: ttIds } }],
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    }),
    select: {
      id: true,
      tournamentId: true,
      scheduledAt: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      winner_team_id: true,
      roundName: true,
      tournament: { select: { name: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });
  if (matches.length === 0) return apiSuccess(emptyResponse);

  const ourTt = new Set(ttIds.map((x) => x.toString()));
  const matchIds = matches.map((m) => m.id);

  // 4) 상대팀(및 우리팀) 표시 정보: 매치에 등장한 모든 tt.id → {name, teamId}
  const allTtIds = new Set<bigint>();
  for (const m of matches) {
    if (m.homeTeamId != null) allTtIds.add(m.homeTeamId);
    if (m.awayTeamId != null) allTtIds.add(m.awayTeamId);
  }
  const ttInfoRows = await prisma.tournamentTeam.findMany({
    where: { id: { in: Array.from(allTtIds) } },
    select: { id: true, teamId: true, team: { select: { name: true } } },
  });
  const ttInfo = new Map(
    ttInfoRows.map((t) => [
      t.id.toString(),
      { name: t.team?.name ?? "팀", teamId: t.teamId.toString() },
    ]),
  );

  // matchId → 메타(연도/대회/상대/결과) 매핑
  interface MatchMeta {
    tnId: string;
    tnName: string;
    year: number | null;
    date: string;
    opp: string;
    oppId: string | null;
    result: "W" | "L" | "-";
    hs: number; // 우리팀 점수
    as: number; // 상대팀 점수
  }
  const matchMeta = new Map<string, MatchMeta>();
  for (const m of matches) {
    const home = m.homeTeamId?.toString() ?? null;
    const away = m.awayTeamId?.toString() ?? null;
    const weAreHome = home != null && ourTt.has(home);
    const oppTtId = weAreHome ? away : home;
    const ourScore = (weAreHome ? m.homeScore : m.awayScore) ?? 0;
    const oppScore = (weAreHome ? m.awayScore : m.homeScore) ?? 0;
    const winner = m.winner_team_id?.toString() ?? null;
    const ourTtIdInMatch = weAreHome ? home : away;
    let result: "W" | "L" | "-" = "-";
    if (winner) result = winner === ourTtIdInMatch ? "W" : "L";
    const oppMeta = oppTtId ? ttInfo.get(oppTtId) : undefined;
    matchMeta.set(m.id.toString(), {
      tnId: m.tournamentId,
      tnName: m.tournament?.name ?? "대회",
      year: m.scheduledAt ? m.scheduledAt.getFullYear() : null,
      date: m.scheduledAt ? m.scheduledAt.toISOString().slice(0, 10) : "",
      opp: oppMeta?.name ?? "상대",
      oppId: oppMeta?.teamId ?? null,
      result,
      hs: ourScore,
      as: oppScore,
    });
  }

  // 5) 우리 팀 선수 stat (공식 매치 한정 + 우리 ttp 한정)
  const stats = await prisma.matchPlayerStat.findMany({
    where: {
      tournamentMatchId: { in: matchIds },
      tournamentTeamPlayer: { tournamentTeamId: { in: ttIds } },
    },
    select: {
      tournamentMatchId: true,
      minutesPlayed: true,
      points: true,
      fieldGoalsMade: true,
      fieldGoalsAttempted: true,
      threePointersMade: true,
      threePointersAttempted: true,
      freeThrowsMade: true,
      freeThrowsAttempted: true,
      offensive_rebounds: true,
      defensive_rebounds: true,
      total_rebounds: true,
      assists: true,
      steals: true,
      blocks: true,
      turnovers: true,
      personal_fouls: true,
      plusMinus: true,
      tournamentTeamPlayer: {
        select: {
          id: true,
          userId: true,
          player_name: true,
          jerseyNumber: true,
          users: { select: { nickname: true, name: true } },
        },
      },
    },
  });

  // 선수 식별 키: 클레임=userId / 미클레임=player_name#jersey (팀 내 동일인 합산)
  interface PlayerMeta {
    user_id: string | null;
    name: string;
    player_name: string;
    jersey: number | null;
    claimed: boolean;
  }
  const playerMeta = new Map<string, PlayerMeta>();
  const byYear = new Map<string, Map<number, RawBox[]>>(); // playerKey → year → rows
  const byTn = new Map<string, Map<string, RawBox[]>>(); // playerKey → tnId → rows
  const gameBox = new Map<string, RawBox[]>(); // matchId → [{box+meta}] (raw)
  const gameBoxMeta = new Map<string, PlayerMeta[]>(); // matchId → [playerMeta] (병렬)

  for (const s of stats) {
    const ttp = s.tournamentTeamPlayer;
    if (!ttp) continue;
    const claimed = ttp.userId != null;
    const displayName =
      ttp.player_name ?? ttp.users?.nickname ?? ttp.users?.name ?? "선수";
    const key = claimed
      ? "u" + ttp.userId!.toString()
      : "n" + (ttp.player_name ?? "?") + "#" + (ttp.jerseyNumber ?? "");
    if (!playerMeta.has(key)) {
      playerMeta.set(key, {
        user_id: claimed ? ttp.userId!.toString() : null,
        name: displayName,
        player_name: displayName,
        jersey: ttp.jerseyNumber,
        claimed,
      });
    }
    const box = toRawBox(s);
    const mId = s.tournamentMatchId.toString();
    const mm = matchMeta.get(mId);
    if (!mm) continue;

    // 시즌별
    if (mm.year != null) {
      let ym = byYear.get(key);
      if (!ym) byYear.set(key, (ym = new Map()));
      const arr = ym.get(mm.year) ?? [];
      arr.push(box);
      ym.set(mm.year, arr);
    }
    // 대회별
    let tm = byTn.get(key);
    if (!tm) byTn.set(key, (tm = new Map()));
    const tarr = tm.get(mm.tnId) ?? [];
    tarr.push(box);
    tm.set(mm.tnId, tarr);

    // 경기별 (raw)
    const gb = gameBox.get(mId) ?? [];
    gb.push(box);
    gameBox.set(mId, gb);
    const gm = gameBoxMeta.get(mId) ?? [];
    gm.push(playerMeta.get(key)!);
    gameBoxMeta.set(mId, gm);
  }

  // ── 시즌 목록 / 대회 목록 ──
  const seasonSet = new Set<number>();
  const tnOrder: { id: string; name: string }[] = [];
  const tnSeen = new Set<string>();
  for (const m of matches) {
    const mm = matchMeta.get(m.id.toString())!;
    if (mm.year != null) seasonSet.add(mm.year);
    if (!tnSeen.has(mm.tnId)) {
      tnSeen.add(mm.tnId);
      tnOrder.push({ id: mm.tnId, name: mm.tnName });
    }
  }
  const seasons = Array.from(seasonSet).sort((a, b) => b - a);

  // ── 시즌별 로스터(평균) ──
  const season_rosters: Record<string, unknown[]> = {};
  for (const year of seasons) {
    const rows: unknown[] = [];
    for (const [key, ym] of byYear) {
      const r = ym.get(year);
      if (!r || r.length === 0) continue;
      const pm = playerMeta.get(key)!;
      rows.push({ ...pm, ...aggregateBox(r) });
    }
    season_rosters[String(year)] = rows;
  }

  // ── 대회별 로스터(평균) ──
  const tournament_rosters: Record<string, unknown[]> = {};
  for (const { id: tnId } of tnOrder) {
    const rows: unknown[] = [];
    for (const [key, tm] of byTn) {
      const r = tm.get(tnId);
      if (!r || r.length === 0) continue;
      const pm = playerMeta.get(key)!;
      rows.push({ ...pm, ...aggregateBox(r) });
    }
    tournament_rosters[tnId] = rows;
  }

  // ── 경기 목록 + 경기별 box(raw) ──
  const games = matches.map((m) => {
    const mId = m.id.toString();
    const mm = matchMeta.get(mId)!;
    const boxes = gameBox.get(mId) ?? [];
    const metas = gameBoxMeta.get(mId) ?? [];
    const box = boxes.map((b, i) => ({ ...metas[i], ...b }));
    return {
      match_id: mId,
      date: mm.date,
      tournament: mm.tnName,
      opp: mm.opp,
      opp_id: mm.oppId,
      result: mm.result,
      hs: mm.hs,
      as: mm.as,
      box,
    };
  });

  const claimedN = Array.from(playerMeta.values()).filter((p) => p.claimed).length;

  return apiSuccess({
    meta: {
      team_name: team.name ?? "팀",
      members_n: playerMeta.size,
      claimed_n: claimedN,
    },
    seasons,
    tournaments: tnOrder,
    games,
    season_rosters,
    tournament_rosters,
  });
}
