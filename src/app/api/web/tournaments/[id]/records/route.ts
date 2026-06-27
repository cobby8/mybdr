import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { officialMatchWhere } from "@/lib/tournaments/official-match";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";
import {
  toRawBox,
  aggregateBox,
  aggregateTeamBox,
  type RawBox,
} from "@/lib/records/match-stat-aggregate";
// 2026-06-16: PBP 기반 출전시간 (라이브와 단일 source). minutesPlayed(999 버그/전자기록지 0) 미사용.
import {
  getMatchMinutesBySec,
  buildMatchMinutesMeta,
} from "@/lib/records/match-minutes";
// 비공개 대회 노출 차단 가드 (SSR page.tsx와 동일 정책 — insider 외 404).
import { blockIfPrivateTournament } from "@/lib/auth/private-tournament-guard";
// 2026-06-27: 기록 모드 전파 — 매치별 recording_mode(paper 측정 불가 게이팅) + 대회 default_recording_mode.
import {
  getRecordingMode,
  getTournamentDefaultMode,
} from "@/lib/tournaments/recording-mode";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 대회 기록실 공개 API (인증 불필요)
 * GET /api/web/tournaments/[id]/records
 *
 * 대회 상세 "기록실" 탭에서 호출. 선수/팀/경기 3종 집계를 한 번에 반환.
 * - 공식가드(officialMatchWhere) 필수 — 미래/비공식 매치 집계 금지.
 * - 신규 DB 0. MatchPlayerStat + TournamentMatch + TournamentTeam 만 사용.
 * - apiSuccess() = 응답 키 자동 snake_case (프론트 접근자도 snake).
 * - 평점(rating)은 매치 단위 소스 부재 → null('–' 표기). (PM 결재 Q1)
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return apiError("Invalid tournament ID", 400);
  }

  // 1) 대회 메타
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    // 2026-06-27: settings = 대회 기본 기록 모드(default_recording_mode) 판정용.
    select: { status: true, gender: true, divisions: true, is_public: true, settings: true },
  });
  if (!tournament) return apiError("Tournament not found", 404);

  // 비공개 대회: 관계자(insider) 외 존재 숨김(404). 공개 대회는 통과.
  if (await blockIfPrivateTournament(id, tournament.is_public)) {
    return apiError("Tournament not found", 404);
  }

  // 2026-06-27: 대회 기본 기록 모드(대회 단위 식별 — meta 노출). paper 면 표시 레이어가 슈팅 시도/% 컬럼 hide.
  const defaultRecordingMode = getTournamentDefaultMode({ settings: tournament.settings });

  // 2) 공식 매치 (공식가드 필수)
  const matches = await prisma.tournamentMatch.findMany({
    where: officialMatchWhere({ tournamentId: id }),
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      winner_team_id: true,
      roundName: true,
      scheduledAt: true,
      // 2026-06-16: PBP 출전시간 공용 함수용 — status(cap 분기) / settings(paper 판별)
      status: true,
      settings: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  // 3) 참가팀 (TournamentTeam.id → 팀명 + Team.id 매핑)
  const tts = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    select: { id: true, teamId: true, team: { select: { name: true } } },
  });
  const ttMap = new Map(
    tts.map((t) => [
      t.id.toString(),
      { name: t.team?.name ?? "팀", teamId: t.teamId.toString() },
    ]),
  );

  // 매치 0 → 빈 집계 반환 (탭은 빈 상태 렌더)
  if (matches.length === 0) {
    return apiSuccess({
      meta: {
        status: TOURNAMENT_STATUS_LABEL[tournament.status ?? ""] ?? tournament.status ?? "",
        division: buildDivision(tournament.gender, tournament.divisions),
        teams_n: tts.length,
        games_n: 0,
        mvp_name: null,
        default_recording_mode: defaultRecordingMode,
      },
      players: [],
      teams: [],
      games: [],
    });
  }

  const matchIds = matches.map((m) => m.id);

  // 2026-06-27: 매치별 기록 모드 맵 — recording_mode(표시 뱃지) + isPaper(집계 게이팅).
  //   getRecordingMode 재사용(같은 paper 판정 source). paper 만 시도/%/+/- 측정 불가로 본다.
  const modeByMatch = new Map(
    matches.map((m) => [m.id.toString(), getRecordingMode({ settings: m.settings })]),
  );
  const isPaperOf = (matchId: bigint): boolean =>
    modeByMatch.get(matchId.toString()) === "paper";

  // 2026-06-16: PBP 기반 출전초 일괄 산출 (라이브와 단일 source). 전자기록지/PBP없음 매치는 결과 제외 → min '–'.
  const minutesMeta = await buildMatchMinutesMeta(matches);
  const minutesBySec = await getMatchMinutesBySec(matchIds, minutesMeta);
  // (matchId, ttpId) → 출전초 헬퍼. 부재 시 null → toRawBox 가 min=0 처리.
  const getMinSec = (matchId: bigint, ttpId: bigint): number | null =>
    minutesBySec.get(Number(matchId))?.get(ttpId) ?? null;

  // 4) 매치 선수 stat (공식 매치 한정) + ttp 메타
  const stats = await prisma.matchPlayerStat.findMany({
    where: { tournamentMatchId: { in: matchIds } },
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
          users: { select: { nickname: true, name: true } },
          tournamentTeam: {
            select: { id: true, teamId: true, team: { select: { name: true } } },
          },
        },
      },
    },
  });

  // ── 선수 집계: ttp.id 그룹 ──
  interface PlayerAcc {
    user_id: string | null;
    name: string;
    team: string;
    team_id: string;
    claimed: boolean;
    rows: RawBox[];
  }
  const playerAcc = new Map<string, PlayerAcc>();
  // ── 팀 집계용: tt.id → (matchId → RawBox[]) ──
  const teamBoxByMatch = new Map<string, Map<string, RawBox[]>>();

  for (const s of stats) {
    const ttp = s.tournamentTeamPlayer;
    if (!ttp) continue;
    const ttpId = ttp.id.toString();
    const ttId = ttp.tournamentTeam?.id?.toString() ?? null;
    // PBP 출전초 주입 (라이브와 동일 변환 min=Math.round(sec/60)). 전자기록지/PBP없음 = null → min '–'.
    //   isPaper: paper 매치는 시도/%/+/- 측정 불가 → aggregateBox 가 풀에서 제외.
    const box = toRawBox(s, {
      minOverrideSec: getMinSec(s.tournamentMatchId, ttp.id),
      isPaper: isPaperOf(s.tournamentMatchId),
    });

    // 선수
    let pa = playerAcc.get(ttpId);
    if (!pa) {
      const displayName =
        ttp.player_name ?? ttp.users?.nickname ?? ttp.users?.name ?? "선수";
      pa = {
        user_id: ttp.userId != null ? ttp.userId.toString() : null,
        name: displayName,
        team: ttp.tournamentTeam?.team?.name ?? "팀",
        team_id: ttp.tournamentTeam?.teamId?.toString() ?? "",
        claimed: ttp.userId != null,
        rows: [],
      };
      playerAcc.set(ttpId, pa);
    }
    pa.rows.push(box);

    // 팀
    if (ttId) {
      let byMatch = teamBoxByMatch.get(ttId);
      if (!byMatch) {
        byMatch = new Map();
        teamBoxByMatch.set(ttId, byMatch);
      }
      const mId = s.tournamentMatchId.toString();
      const arr = byMatch.get(mId) ?? [];
      arr.push(box);
      byMatch.set(mId, arr);
    }
  }

  const players = Array.from(playerAcc.values()).map((p) => ({
    user_id: p.user_id,
    player_name: p.name,
    name: p.name,
    team: p.team,
    team_id: p.team_id,
    claimed: p.claimed,
    ...aggregateBox(p.rows),
  }));

  // ── 팀 스코어링(승패·득실) : 매치 home/away 스코어 + winner ──
  interface TeamScore {
    g: number;
    w: number;
    l: number;
    sumFor: number;
    sumAgainst: number;
  }
  const teamScore = new Map<string, TeamScore>();
  const bump = (ttId: string): TeamScore => {
    let t = teamScore.get(ttId);
    if (!t) {
      t = { g: 0, w: 0, l: 0, sumFor: 0, sumAgainst: 0 };
      teamScore.set(ttId, t);
    }
    return t;
  };
  for (const m of matches) {
    const home = m.homeTeamId?.toString() ?? null;
    const away = m.awayTeamId?.toString() ?? null;
    const hs = m.homeScore ?? 0;
    const as = m.awayScore ?? 0;
    const winner = m.winner_team_id?.toString() ?? null;
    if (home) {
      const t = bump(home);
      t.g += 1;
      t.sumFor += hs;
      t.sumAgainst += as;
      if (winner === home) t.w += 1;
      else if (winner) t.l += 1;
    }
    if (away) {
      const t = bump(away);
      t.g += 1;
      t.sumFor += as;
      t.sumAgainst += hs;
      if (winner === away) t.w += 1;
      else if (winner) t.l += 1;
    }
  }

  const r1 = (n: number): number => Math.round(n * 10) / 10;
  const teams = Array.from(teamScore.entries())
    .map(([ttId, sc]) => {
      const meta = ttMap.get(ttId);
      const box = aggregateTeamBox(teamBoxByMatch.get(ttId) ?? new Map(), sc.g);
      const ppg = sc.g ? r1(sc.sumFor / sc.g) : 0;
      const oppg = sc.g ? r1(sc.sumAgainst / sc.g) : 0;
      const diff = r1(ppg - oppg);
      return {
        team_id: meta?.teamId ?? "",
        name: meta?.name ?? "팀",
        g: sc.g,
        w: sc.w,
        l: sc.l,
        ppg,
        oppg,
        diff,
        pm: diff,
        // 박스 평균 (팀 1경기 총합 평균) — min/pm/rating 제외 컬럼만 의미
        fgm: box.fgm,
        fga: box.fga,
        fg_pct: box.fg_pct,
        tpm: box.tpm,
        tpa: box.tpa,
        tp_pct: box.tp_pct,
        ftm: box.ftm,
        fta: box.fta,
        ft_pct: box.ft_pct,
        oreb: box.oreb,
        dreb: box.dreb,
        reb: box.reb,
        ast: box.ast,
        stl: box.stl,
        blk: box.blk,
        tov: box.tov,
        pf: box.pf,
        rating: null,
        // ── 누적(합계) — sum 토글이 읽는 정수 누적값(aggregateTeamBox 가 sum_* 제공) ──
        //   팀 누적 = 전 경기 합계. min/pm 은 팀 합산 의미 약해 미노출(기존 정책 유지).
        sum_pts: box.sum_pts,
        sum_fgm: box.sum_fgm,
        sum_fga: box.sum_fga,
        sum_tpm: box.sum_tpm,
        sum_tpa: box.sum_tpa,
        sum_ftm: box.sum_ftm,
        sum_fta: box.sum_fta,
        sum_oreb: box.sum_oreb,
        sum_dreb: box.sum_dreb,
        sum_reb: box.sum_reb,
        sum_ast: box.sum_ast,
        sum_stl: box.sum_stl,
        sum_blk: box.sum_blk,
        sum_to: box.sum_to,
        sum_pf: box.sum_pf,
      };
    })
    .filter((t) => t.g > 0);

  // ── 경기 로그 ──
  const games = matches.map((m) => {
    const home = m.homeTeamId ? ttMap.get(m.homeTeamId.toString()) : undefined;
    const away = m.awayTeamId ? ttMap.get(m.awayTeamId.toString()) : undefined;
    return {
      match_id: m.id.toString(),
      date: m.scheduledAt ? m.scheduledAt.toISOString().slice(0, 10) : "",
      round: m.roundName ?? "",
      home: home?.name ?? "미정",
      home_id: home?.teamId ?? null,
      away: away?.name ?? "미정",
      away_id: away?.teamId ?? null,
      hs: m.homeScore ?? 0,
      as: m.awayScore ?? 0,
      // 2026-06-27: 경기별 기록 모드(표시 레이어 뱃지). paper=전자기록지(시도/%/+/- 측정 불가).
      recording_mode: modeByMatch.get(m.id.toString()) ?? "flutter",
    };
  });

  return apiSuccess({
    meta: {
      status:
        TOURNAMENT_STATUS_LABEL[tournament.status ?? ""] ??
        tournament.status ??
        "",
      division: buildDivision(tournament.gender, tournament.divisions),
      teams_n: tts.length,
      games_n: matches.length,
      // mvp_name: 대회 단위 MVP 소스 미확정(mvp_player_id 타깃 불명) → null('–'). 후속 결정.
      mvp_name: null,
      // 대회 기본 기록 모드(대회 단위 식별). paper_games(players/teams 행)와 함께 표시 레이어 사용.
      default_recording_mode: defaultRecordingMode,
    },
    players,
    teams,
    games,
  });
}

/** gender + divisions(Json) → 표시용 division 문자열 (없으면 null) */
function buildDivision(
  gender: string | null,
  divisions: unknown,
): string | null {
  const genderLabel =
    gender === "male"
      ? "남자"
      : gender === "female"
        ? "여자"
        : gender === "mixed"
          ? "혼성"
          : null;
  let divStr: string | null = null;
  if (Array.isArray(divisions) && divisions.length > 0) {
    divStr = divisions
      .map((d) => (typeof d === "string" ? d : null))
      .filter(Boolean)
      .join(" · ");
  }
  const parts = [genderLabel, divStr || null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
