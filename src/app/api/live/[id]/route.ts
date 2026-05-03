import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";
import { getDisplayName } from "@/lib/utils/player-display-name";
// 2026-05-03: PBP-only 출전시간 산출 엔진 (단일 source) — quarterStatsJson/minutesPlayed/MAX 전략 폐기
import { calculateMinutes, type MinutesPbp } from "@/lib/live/minutes-engine";

// 인증 없는 공개 엔드포인트 — 라이브 박스스코어
// playerStats(종료 후 합계) + play_by_plays(쿼터별 상세 집계)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = getClientIp(req);
  // 2026-05-02: subdomain (30/60s) → liveDetail (120/60s) — 라이브 페이지 폴링 3초 + 다중 탭 합산 고려
  const rl = await checkRateLimit(`live-detail:${ip}`, RATE_LIMITS.liveDetail);
  if (!rl.allowed) {
    return apiError("Too many requests", 429);
  }

  const matchId = Number(id);
  if (isNaN(matchId)) {
    return apiError("Invalid match ID", 400);
  }

  try {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: BigInt(matchId) },
      include: {
        homeTeam: {
          include: {
            // 팀 로고 URL 추가 (티빙 스타일 스코어카드 — 큰 원형 로고 표시용)
            // tournament_teams에는 logo_url 컬럼이 없으므로 teams.logoUrl만 사용
            team: { select: { name: true, primaryColor: true, logoUrl: true } },
            players: {
              include: { users: { select: { name: true, nickname: true } } },
            },
          },
        },
        awayTeam: {
          include: {
            team: { select: { name: true, primaryColor: true, logoUrl: true } },
            players: {
              include: { users: { select: { name: true, nickname: true } } },
            },
          },
        },
        // 경기장명 fallback용으로 tournament.venue_name 같이 가져옴
        tournament: { select: { name: true, venue_name: true } },
        playerStats: {
          include: {
            tournamentTeamPlayer: {
              include: { users: { select: { name: true, nickname: true } } },
            },
          },
          orderBy: { points: "desc" },
        },
      },
    });

    if (!match) {
      return apiError("Match not found", 404);
    }

    const homeTeamId = match.homeTeamId;
    const awayTeamId = match.awayTeamId;
    // BUG-01 fix: playerStats가 존재하면(bdr_stat sync 완료) 경기 상태 무관하게 사용.
    // playerStats 없을 때만 play_by_plays 로 실시간 집계.
    const hasPlayerStats = match.playerStats.length > 0;

    // 2026-04-17: 쿼터별 집계 소스를 match_events → play_by_plays 로 전환.
    // 배경: 현재 Flutter recording/ 화면은 /api/v1/tournaments/:id/matches/sync 로 play_by_plays만 채운다.
    //       match_events 는 레거시 recorder/ 화면(/api/v1/matches/:id/events/batch) 전용 — 현재 앱은 사용 안 함.
    //       match 92/98~104 전부 match_events=0건으로 확인됨. play_by_plays 가 단일 진실 원천.
    // 이 한 번의 쿼리에서 얻은 allPbps 로 (a) 선수별 쿼터 스탯, (b) 팀 쿼터 점수, (c) MIN fallback 모두 계산한다.
    // 2026-04-18: game_clock_seconds, sub_in/out 추가 — MIN 추정 + DNP 완화 판정에 사용.
    const allPbps = await prisma.play_by_plays.findMany({
      where: { tournament_match_id: BigInt(matchId) },
      select: {
        tournament_team_player_id: true,
        tournament_team_id: true,
        quarter: true,
        action_type: true,
        action_subtype: true,
        is_made: true,
        points_scored: true,
        game_clock_seconds: true,
        sub_in_player_id: true,
        sub_out_player_id: true,
        // 2026-05-02 STL R1: 쿼터 점수 보정 — 절대 점수 시계열로 누락 쿼터 식별
        home_score_at_time: true,
        away_score_at_time: true,
      },
    });

    // 쿼터별 상세 스탯 존재 여부 — PBP 가 1건이라도 있으면 true.
    const hasQuarterEventDetail = allPbps.length > 0;

    // 2026-04-18: PBP 에 등장한 선수 ID 집합 — DNP 완화 판정용.
    // 본인 액션(tournament_team_player_id) 또는 교체 투입(sub_in_player_id) 으로 코트에 나타났던 선수 포함.
    const playedPlayerIds = new Set<number>();
    for (const p of allPbps) {
      if (p.tournament_team_player_id) playedPlayerIds.add(Number(p.tournament_team_player_id));
      if (p.sub_in_player_id) playedPlayerIds.add(Number(p.sub_in_player_id));
    }

    // 2026-05-03: PBP-only 출전시간 산출 — quarterStatsJson / minutesPlayed / MAX 전략 폐기.
    // qLen 추정: PBP 의 max game_clock_seconds = 쿼터 시작 시점 (보통 420/480/600/720).
    // 일반 농구 룰 후보 중 가장 가까운 값 채택, 비정상값(<300/>1200) 시 600 default.
    const minutesQL = (() => {
      if (allPbps.length === 0) return 600;
      const maxClock = Math.max(...allPbps.map((p) => p.game_clock_seconds ?? 0));
      if (maxClock < 300 || maxClock > 1200) return 600;
      const candidates = [420, 480, 600, 720];
      let best = 600;
      let bestDiff = Infinity;
      for (const c of candidates) {
        const d = Math.abs(c - maxClock);
        if (d < bestDiff) { bestDiff = d; best = c; }
      }
      return bestDiff <= 30 ? best : maxClock;
    })();
    const minutesQs = Math.max(4, ...allPbps.map((p) => p.quarter ?? 4));
    const minutesEngineInput: MinutesPbp[] = allPbps.map((p) => ({
      ttpId: p.tournament_team_player_id ?? null,
      quarter: p.quarter ?? 1,
      clock: p.game_clock_seconds ?? 0,
      type: p.action_type,
      subtype: p.action_subtype,
      subInId: p.sub_in_player_id ?? null,
      subOutId: p.sub_out_player_id ?? null,
    }));
    const { bySec: pbpMinutesBySec, byQuarterSec: pbpMinutesByQ } = calculateMinutes({
      pbps: minutesEngineInput,
      qLen: minutesQL,
      numQuarters: minutesQs,
    });
    // 헬퍼: ttp.id (number 또는 bigint) → PBP-only 출전시간 (sec). 미등장(DNP) 시 0.
    const getPbpSec = (ttpId: number | bigint | null | undefined): number => {
      if (ttpId == null) return 0;
      const key = typeof ttpId === "bigint" ? ttpId : BigInt(ttpId);
      return pbpMinutesBySec.get(key) ?? 0;
    };
    const getPbpQuarterSec = (ttpId: number | bigint, q: number): number => {
      const key = typeof ttpId === "bigint" ? ttpId : BigInt(ttpId);
      return pbpMinutesByQ.get(key)?.get(q) ?? 0;
    };


    // 쿼터별 스탯 집계 헬퍼 — playerId → { "1": {...}, "2": {...}, ... }
    // min/min_seconds/plus_minus 는 PBP 만으로 산출 불가 → 0 고정. quarterStatsJson 에서 나중에 주입.
    type QuarterStatEntry = {
      min: number; min_seconds: number; pts: number;
      fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number;
      oreb: number; dreb: number; reb: number;
      ast: number; stl: number; blk: number; to: number; fouls: number; plus_minus: number;
    };
    const emptyQStat = (): QuarterStatEntry => ({
      min: 0, min_seconds: 0, pts: 0,
      fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
      oreb: 0, dreb: 0, reb: 0,
      ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
    });

    // playerId별 쿼터 집계 Map 구성 — Flutter action_type 매핑
    // - 'shot' + subtype "2pt"/"3pt" + is_made
    // - 'missed_shot' (2인 모드)
    // - 'free_throw' + is_made
    // - 'rebound' + subtype "offensive"/"defensive"
    // - 'assist' / 'steal' / 'block' / 'turnover' / 'foul'
    // 제외: 'team_foul', 'timeout', 'substitution', 'jump_ball'
    const quarterStatsByPlayer = new Map<number, Record<string, QuarterStatEntry>>();
    for (const p of allPbps) {
      if (!p.tournament_team_player_id) continue;
      const pid = Number(p.tournament_team_player_id);
      const q = String(p.quarter ?? 1);
      let byQ = quarterStatsByPlayer.get(pid);
      if (!byQ) {
        byQ = {};
        quarterStatsByPlayer.set(pid, byQ);
      }
      if (!byQ[q]) byQ[q] = emptyQStat();
      const s = byQ[q];
      const isMade = p.is_made === true;
      const pts = p.points_scored ?? 0;
      const sub = p.action_subtype ?? "";
      const isThree = sub === "3pt" || pts === 3;

      switch (p.action_type) {
        case "shot":
          // 1인 모드 (game_recording_screen): is_made 로 성공/실패 구분
          if (isMade) {
            s.pts += pts;
            s.fgm += 1; s.fga += 1;
            if (isThree) { s.tpm += 1; s.tpa += 1; }
          } else {
            s.fga += 1;
            if (isThree) { s.tpa += 1; }
          }
          break;
        case "made_shot":
          // 2인 모드 (duo_recording_screen): 성공 슛은 made_shot 으로 기록됨
          s.pts += pts;
          s.fgm += 1; s.fga += 1;
          if (isThree) { s.tpm += 1; s.tpa += 1; }
          break;
        case "missed_shot":
          // 2인 모드: 실패 슛은 missed_shot
          s.fga += 1;
          if (isThree) { s.tpa += 1; }
          break;
        case "free_throw":
          s.fta += 1;
          if (isMade) { s.ftm += 1; s.pts += 1; }
          break;
        case "rebound":
          s.reb += 1;
          if (sub === "offensive") s.oreb += 1;
          else if (sub === "defensive") s.dreb += 1;
          break;
        case "assist":  s.ast += 1; break;
        case "steal":   s.stl += 1; break;
        case "block":   s.blk += 1; break;
        case "turnover":s.to  += 1; break;
        case "foul":    s.fouls += 1; break;
        // team_foul / timeout / substitution / jump_ball: 선수 개인 스탯 집계 제외
      }
    }

    let homePlayers: PlayerRow[];
    let awayPlayers: PlayerRow[];

    if (!hasPlayerStats) {
      // 진행 중이거나 playerStats가 없으면 play_by_plays 에서 실시간 집계
      // 선수 목록 구성 (roster)
      // 0414: role='player' + is_active !== false 인 선수만 박스스코어 대상 (감독/코치/매니저 제외)
      const filterRoster = (p: { role?: string | null; is_active?: boolean | null }) =>
        (p.role ?? "player") === "player" && p.is_active !== false;

      // 2026-04-15: roster에 isStarter 포함 (TournamentTeamPlayer.isStarter fallback 용)
      const allPlayers = [
        ...(match.homeTeam?.players ?? []).filter(filterRoster).map((p) => ({
          id: Number(p.id),
          jerseyNumber: p.jerseyNumber,
          // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
          name: getDisplayName(p.users, { player_name: p.player_name, jerseyNumber: p.jerseyNumber }, `#${p.jerseyNumber ?? "-"}`),
          teamId: Number(p.tournamentTeamId),
          isStarter: p.isStarter ?? false,
        })),
        ...(match.awayTeam?.players ?? []).filter(filterRoster).map((p) => ({
          id: Number(p.id),
          jerseyNumber: p.jerseyNumber,
          // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
          name: getDisplayName(p.users, { player_name: p.player_name, jerseyNumber: p.jerseyNumber }, `#${p.jerseyNumber ?? "-"}`),
          teamId: Number(p.tournamentTeamId),
          isStarter: p.isStarter ?? false,
        })),
      ];

      const statsMap = new Map<number, PlayerRow>();
      for (const p of allPlayers) {
        statsMap.set(p.id, {
          id: p.id,
          jerseyNumber: p.jerseyNumber,
          name: p.name,
          teamId: p.teamId,
          min: 0, min_seconds: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
          oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
          isStarter: p.isStarter,
        });
      }

      // 2026-04-17: PBP → 전체 합계 스탯 집계 (쿼터별 집계와 동일한 매핑 규칙)
      for (const p of allPbps) {
        if (!p.tournament_team_player_id) continue;
        const pid = Number(p.tournament_team_player_id);
        const stat = statsMap.get(pid);
        if (!stat) continue;

        const isMade = p.is_made === true;
        const pts = p.points_scored ?? 0;
        const sub = p.action_subtype ?? "";
        const isThree = sub === "3pt" || pts === 3;

        switch (p.action_type) {
          case "shot":
            if (isMade) {
              stat.pts += pts;
              stat.fgm += 1; stat.fga += 1;
              if (isThree) { stat.tpm += 1; stat.tpa += 1; }
            } else {
              stat.fga += 1;
              if (isThree) { stat.tpa += 1; }
            }
            break;
          case "made_shot":
            // 2인 모드: 성공 슛
            stat.pts += pts;
            stat.fgm += 1; stat.fga += 1;
            if (isThree) { stat.tpm += 1; stat.tpa += 1; }
            break;
          case "missed_shot":
            stat.fga += 1;
            if (isThree) { stat.tpa += 1; }
            break;
          case "free_throw":
            stat.fta += 1;
            if (isMade) { stat.ftm += 1; stat.pts += 1; }
            break;
          case "rebound":
            stat.reb += 1;
            if (sub === "offensive") stat.oreb += 1;
            else if (sub === "defensive") stat.dreb += 1;
            break;
          case "assist":  stat.ast += 1; break;
          case "steal":   stat.stl += 1; break;
          case "block":   stat.blk += 1; break;
          case "turnover":stat.to  += 1; break;
          case "foul":    stat.fouls += 1; break;
          // team_foul / timeout / substitution / jump_ball: 선수 개인 스탯 집계 제외
        }
      }

      // 2026-05-03: PBP-only 출전시간 일괄 주입 (quarterStatsJson 의 min/min_seconds 무시).
      //   - row.min/min_seconds = pbpMinutesBySec (총 출전초)
      //   - row.quarter_stats[q].min/min_seconds = pbpMinutesByQ (쿼터별)
      //   - quarterStatsJson 은 plus_minus(pm) 만 추출 (시간은 PBP 가 SSOT)
      //   - matchPlayerStat 의 plusMinus / isStarter 는 그대로 보강 (시간 무관)
      for (const stat of match.playerStats) {
        const pid = Number(stat.tournamentTeamPlayerId);
        const row = statsMap.get(pid);
        if (!row) continue;

        // (시간) PBP-only 총 출전초
        const totalPbp = getPbpSec(pid);
        row.min_seconds = totalPbp;
        row.min = Math.round(totalPbp / 60);

        // quarterStatsJson 에서 plus_minus 만 추출 → quarter_stats 주입
        if (stat.quarterStatsJson) {
          try {
            const parsed = JSON.parse(stat.quarterStatsJson) as Record<string, { min?: number; pm?: number }>;
            if (!row.quarter_stats) row.quarter_stats = {};
            for (const [jsonKey, qv] of Object.entries(parsed)) {
              const qKey = jsonKey.startsWith("OT")
                ? String(4 + Number(jsonKey.slice(2))) // "OT1"→"5", "OT2"→"6"
                : jsonKey.replace(/^Q/, "");           // "Q1"→"1"
              if (!qKey) continue;
              if (!row.quarter_stats[qKey]) {
                row.quarter_stats[qKey] = {
                  min: 0, min_seconds: 0, pts: 0,
                  fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
                  oreb: 0, dreb: 0, reb: 0,
                  ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
                };
              }
              row.quarter_stats[qKey].plus_minus = qv.pm ?? 0;
            }
          } catch {}
        }

        // +/- 보강 (전체 집계 레벨)
        if (stat.plusMinus != null) {
          row.plus_minus = stat.plusMinus;
        }
        // 2026-04-15: MatchPlayerStat.isStarter 가 있으면 TournamentTeamPlayer fallback 을 덮어쓰기
        if (stat.isStarter != null) {
          row.isStarter = stat.isStarter;
        }
      }

      // 2026-05-03: row.quarter_stats 의 쿼터별 min/min_seconds 도 PBP-only 로 일괄 덮어쓰기
      //   (quarterStatsByPlayer 는 점수/리바 등 비시간 스탯 source 로 별도 처리)
      for (const stat of match.playerStats) {
        const pid = Number(stat.tournamentTeamPlayerId);
        const row = statsMap.get(pid);
        if (!row) continue;
        const qMap = pbpMinutesByQ.get(BigInt(pid));
        if (!qMap) continue;
        if (!row.quarter_stats) row.quarter_stats = {};
        for (const [q, sec] of qMap.entries()) {
          const qKey = String(q);
          if (!row.quarter_stats[qKey]) {
            row.quarter_stats[qKey] = {
              min: 0, min_seconds: 0, pts: 0,
              fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
              oreb: 0, dreb: 0, reb: 0,
              ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
            };
          }
          row.quarter_stats[qKey].min_seconds = sec;
          row.quarter_stats[qKey].min = Math.round(sec / 60);
        }
      }

      // 0414: DNP 플래그 부여 (MIN 보강 후에 판정해야 정확)
      // 2026-04-18: is_starter 또는 PBP 에 등장한 선수는 DNP 해제 (출전 선수는 "00:00" 으로 표시)
      for (const stat of statsMap.values()) {
        const dnp = isDnpRow(stat);
        if (dnp && (stat.isStarter || playedPlayerIds.has(stat.id))) {
          stat.dnp = false;
        } else {
          stat.dnp = dnp;
        }
      }

      const allStats = Array.from(statsMap.values()).sort((a, b) => {
        // DNP는 항상 마지막. 그 외는 득점 내림차순.
        if ((a.dnp ?? false) !== (b.dnp ?? false)) {
          return (a.dnp ?? false) ? 1 : -1;
        }
        return b.pts - a.pts;
      });
      homePlayers = allStats.filter((s) => s.teamId === Number(homeTeamId));
      awayPlayers = allStats.filter((s) => s.teamId === Number(awayTeamId));
      // 쿼터별 집계 주입 (진행 중 분기) — stat.id는 tournamentTeamPlayer.id와 동일하게 세팅되어 있어 그대로 매칭됨
      // 2026-05-03: PBP 비시간 스탯(점수/리바 등)은 qs 에서 그대로, 시간(min/min_seconds) 은 PBP 엔진(row.quarter_stats) 보존
      for (const row of [...homePlayers, ...awayPlayers]) {
        const qs = quarterStatsByPlayer.get(row.id);
        if (qs && Object.keys(qs).length > 0) {
          // 기존 row.quarter_stats (시간만 들어있음) 를 비시간 스탯과 머지
          const existing = row.quarter_stats ?? {};
          const merged: typeof qs = {};
          const allQKeys = new Set([...Object.keys(qs), ...Object.keys(existing)]);
          for (const qKey of allQKeys) {
            const fromPbpStats = qs[qKey];
            const fromTime = existing[qKey];
            merged[qKey] = {
              ...(fromPbpStats ?? {
                min: 0, min_seconds: 0, pts: 0,
                fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
                oreb: 0, dreb: 0, reb: 0,
                ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
              }),
              // 시간 + plus_minus 는 PBP 엔진/quarterStatsJson 결과 우선 적용
              ...(fromTime
                ? {
                    min: fromTime.min,
                    min_seconds: fromTime.min_seconds,
                    plus_minus: fromTime.plus_minus,
                  }
                : {}),
            };
          }
          row.quarter_stats = merged;
        }
      }
      // 2026-05-03: 진행 중 분기 — 모든 row 의 row.min/min_seconds 도 PBP-only 로 통일
      // (위 quarterStatsJson 처리는 match.playerStats 가 있는 row 만 다룸 → 없는 row 보강)
      for (const row of [...homePlayers, ...awayPlayers]) {
        const totalPbp = getPbpSec(row.id);
        if (totalPbp > 0) {
          row.min_seconds = totalPbp;
          row.min = Math.round(totalPbp / 60);
        }
        // PBP 쿼터별 시간 보강 (quarter_stats 에 시간 누락된 쿼터)
        const qMap = pbpMinutesByQ.get(BigInt(row.id));
        if (qMap) {
          if (!row.quarter_stats) row.quarter_stats = {};
          for (const [q, sec] of qMap.entries()) {
            const qKey = String(q);
            if (!row.quarter_stats[qKey]) {
              row.quarter_stats[qKey] = {
                min: 0, min_seconds: 0, pts: 0,
                fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
                oreb: 0, dreb: 0, reb: 0,
                ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
              };
            }
            row.quarter_stats[qKey].min_seconds = sec;
            row.quarter_stats[qKey].min = Math.round(sec / 60);
          }
        }
      }
    } else {
      // 종료된 경기 — playerStats 테이블 사용
      //
      // 2026-05-03: 종료 분기 — PBP-only 출전시간 적용. estimateMinutesFromPbp / minEstimates / R3 폐기.
      //   - row.min/min_seconds = pbpMinutesBySec (총 출전초)
      //   - row.quarter_stats[q].min/min_seconds = pbpMinutesByQ (쿼터별)
      //   - quarterStatsJson 은 plus_minus(pm) 만 추출 (시간은 PBP SSOT)
      //   - 비시간 스탯(점수/리바 등)은 matchPlayerStat 컬럼 그대로
      const toPlayerRow = (stat: (typeof match.playerStats)[number]): PlayerRow => {
        const player = stat.tournamentTeamPlayer;
        const user = player.users;
        const playerIdNum = Number(player.id);
        // PBP-only 출전시간 (DNP 시 0)
        const minSeconds = getPbpSec(playerIdNum);
        const row: PlayerRow = {
          id: Number(stat.id),
          jerseyNumber: player.jerseyNumber,
          // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
          name: getDisplayName(user, { player_name: player.player_name, jerseyNumber: player.jerseyNumber }, `#${player.jerseyNumber ?? "-"}`),
          teamId: Number(player.tournamentTeamId),
          min: Math.round(minSeconds / 60),
          min_seconds: minSeconds,
          pts: stat.points ?? 0,
          fgm: stat.fieldGoalsMade ?? 0,
          fga: stat.fieldGoalsAttempted ?? 0,
          tpm: stat.threePointersMade ?? 0,
          tpa: stat.threePointersAttempted ?? 0,
          ftm: stat.freeThrowsMade ?? 0,
          fta: stat.freeThrowsAttempted ?? 0,
          oreb: stat.offensive_rebounds ?? 0,
          dreb: stat.defensive_rebounds ?? 0,
          reb: stat.total_rebounds ?? 0,
          ast: stat.assists ?? 0,
          stl: stat.steals ?? 0,
          blk: stat.blocks ?? 0,
          to: stat.turnovers ?? 0,
          fouls: stat.personal_fouls ?? 0,
          plus_minus: stat.plusMinus ?? 0,
          // 2026-04-15: 스타팅 여부 — MatchPlayerStat 우선, TournamentTeamPlayer fallback
          isStarter: stat.isStarter ?? player.isStarter ?? false,
        };

        row.dnp = isDnpRow(row);
        // 2026-04-18: DNP 완화 — is_starter 또는 PBP 에 등장한 선수는 DNP 표시 해제 (출전선수를 "DNP"→"00:00" 로)
        if (row.isStarter || playedPlayerIds.has(playerIdNum)) {
          row.dnp = false;
        }
        // 쿼터별 비시간 스탯 (점수/리바/어시 등) 주입 — quarterStatsByPlayer = PBP 액션 집계 결과
        const qs = quarterStatsByPlayer.get(playerIdNum);
        if (qs && Object.keys(qs).length > 0) {
          row.quarter_stats = qs;
        }
        // 2026-05-03: quarterStatsJson 에서 plus_minus 만 추출 (시간은 아래 PBP 일괄 주입)
        if (stat.quarterStatsJson) {
          try {
            const parsed = JSON.parse(stat.quarterStatsJson) as Record<string, { min?: number; pm?: number }>;
            if (!row.quarter_stats) row.quarter_stats = {};
            for (const [jsonKey, qv] of Object.entries(parsed)) {
              const qKey = jsonKey.startsWith("OT")
                ? String(4 + Number(jsonKey.slice(2)))
                : jsonKey.replace(/^Q/, "");
              if (!qKey) continue;
              if (!row.quarter_stats[qKey]) {
                row.quarter_stats[qKey] = {
                  min: 0, min_seconds: 0, pts: 0,
                  fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
                  oreb: 0, dreb: 0, reb: 0,
                  ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
                };
              }
              row.quarter_stats[qKey].plus_minus = qv.pm ?? 0;
            }
          } catch {}
        }
        // 2026-05-03: PBP-only 쿼터별 출전시간 일괄 주입 (quarterStatsJson 의 min 무시)
        const qMap = pbpMinutesByQ.get(BigInt(playerIdNum));
        if (qMap) {
          if (!row.quarter_stats) row.quarter_stats = {};
          for (const [q, sec] of qMap.entries()) {
            const qKey = String(q);
            if (!row.quarter_stats[qKey]) {
              row.quarter_stats[qKey] = {
                min: 0, min_seconds: 0, pts: 0,
                fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
                oreb: 0, dreb: 0, reb: 0,
                ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
              };
            }
            row.quarter_stats[qKey].min_seconds = sec;
            row.quarter_stats[qKey].min = Math.round(sec / 60);
          }
        }

        return row;
      };

      // 0414: role='player' + is_active !== false 필터 (감독/코치 제외)
      const isPlayerRole = (stat: (typeof match.playerStats)[number]) => {
        const p = stat.tournamentTeamPlayer;
        return (p.role ?? "player") === "player" && p.is_active !== false;
      };

      // DNP는 항상 마지막, 그 외는 득점 내림차순
      const sortWithDnp = (rows: PlayerRow[]) =>
        rows.sort((a, b) => {
          if ((a.dnp ?? false) !== (b.dnp ?? false)) {
            return (a.dnp ?? false) ? 1 : -1;
          }
          return b.pts - a.pts;
        });

      homePlayers = sortWithDnp(
        match.playerStats
          .filter((s) => s.tournamentTeamPlayer.tournamentTeamId === homeTeamId)
          .filter(isPlayerRole)
          .map(toPlayerRow)
      );
      awayPlayers = sortWithDnp(
        match.playerStats
          .filter((s) => s.tournamentTeamPlayer.tournamentTeamId === awayTeamId)
          .filter(isPlayerRole)
          .map(toPlayerRow)
      );
    }

    // 2026-04-17: quarter_scores 는 play_by_plays 기반으로 "항상" 재계산 (DB match.quarterScores 무시)
    // 이유: match 99~104 에서 DB quarterScores 와 실제 score 불일치 발생. PBP 가 진실 원천.
    // 이미 상단에서 조회한 allPbps 를 재사용하므로 추가 쿼리 없음.
    type QS = { home: { q1: number; q2: number; q3: number; q4: number; ot: number[] }; away: { q1: number; q2: number; q3: number; q4: number; ot: number[] } };
    const homeIdForQS = Number(homeTeamId);
    const qMap: Record<number, { home: number; away: number }> = {};
    for (const p of allPbps) {
      if (p.is_made !== true) continue;
      const pts = p.points_scored ?? 0;
      if (pts <= 0) continue;
      const q = p.quarter ?? 1;
      if (!qMap[q]) qMap[q] = { home: 0, away: 0 };
      if (Number(p.tournament_team_id) === homeIdForQS) {
        qMap[q].home += pts;
      } else {
        qMap[q].away += pts;
      }
    }
    const quarterScores: QS = {
      home: { q1: qMap[1]?.home ?? 0, q2: qMap[2]?.home ?? 0, q3: qMap[3]?.home ?? 0, q4: qMap[4]?.home ?? 0, ot: [] },
      away: { q1: qMap[1]?.away ?? 0, q2: qMap[2]?.away ?? 0, q3: qMap[3]?.away ?? 0, q4: qMap[4]?.away ?? 0, ot: [] },
    };
    for (const q of Object.keys(qMap).map(Number).filter(n => n > 4).sort()) {
      quarterScores.home.ot.push(qMap[q].home);
      quarterScores.away.ot.push(qMap[q].away);
    }

    // 2026-05-02 STL Phase 1 — R1 쿼터 점수 보정 (PBP score_at_time 시계열 + 매치 헤더 cap)
    //
    // 배경: Flutter app 의 점수 입력 단축 또는 박스스코어 직접 편집 시 made_shot PBP 가
    //       생성되지 않는 케이스 발생 → PBP points_scored 합산 기반 quarterScores 가 부정확.
    // 해결 (3 단계):
    //   Step 1) PBP score_at_time 시계열로 쿼터별 누락 점수 식별 + 그 쿼터에 직접 분배
    //           (매치 102 gap +4/+4 → Q1 +2/0, Q2 0/+2, Q3 +2/+2 정확 식별)
    //   Step 2) 보정 합 vs 매치 헤더 cap — score_at_time 자체가 정확하지 않은 케이스
    //           (예: 매치 103 score_at_time 64 vs 헤더 60 → 4점 차감 필요)
    //   Step 3) 매치 헤더 < PBP 합 (음수 gap) 케이스: 매치 헤더 미갱신 의심 → 보정 미적용 (PBP 그대로)
    // 검증: 매치 101/102/103/132/133 모두 보정 후 합계 = 매치 헤더 정확 일치.
    // 안전: matchPlayerStat 합 = 매치 헤더 100% 일치 (운영 18 매치 검증) → 매치 헤더가 SSOT.
    {
      const homeHeaderScore = match.homeScore ?? 0;
      const awayHeaderScore = match.awayScore ?? 0;
      // 현재 PBP 합산
      const pbpSumHome = quarterScores.home.q1 + quarterScores.home.q2 + quarterScores.home.q3 + quarterScores.home.q4 + quarterScores.home.ot.reduce((a, b) => a + b, 0);
      const pbpSumAway = quarterScores.away.q1 + quarterScores.away.q2 + quarterScores.away.q3 + quarterScores.away.q4 + quarterScores.away.ot.reduce((a, b) => a + b, 0);

      // Step 3 (사전 가드): 음수 gap 케이스 — 매치 헤더 < PBP 합. 매치 헤더가 갱신 안 된 라이브 매치 의심 → 보정 X.
      const homeNeedsCorrection = homeHeaderScore >= pbpSumHome;
      const awayNeedsCorrection = awayHeaderScore >= pbpSumAway;

      if (homeNeedsCorrection || awayNeedsCorrection) {
        // Step 1: score_at_time 시계열로 쿼터별 누락 식별 + 분배
        type QEnd = { home: number; away: number; lastClock: number };
        const qEnd = new Map<number, QEnd>();
        for (const p of allPbps) {
          const q = p.quarter ?? 0;
          if (q < 1) continue;
          const clock = p.game_clock_seconds ?? 0;
          const cur = qEnd.get(q);
          // 가장 작은 clock = 그 쿼터의 마지막 이벤트 (농구 시계 10:00→0:00 감소)
          if (!cur || clock < cur.lastClock) {
            qEnd.set(q, {
              home: p.home_score_at_time ?? 0,
              away: p.away_score_at_time ?? 0,
              lastClock: clock,
            });
          }
        }
        const sortedQs = [...qEnd.keys()].sort((a, b) => a - b);
        let prevHome = 0;
        let prevAway = 0;
        for (const q of sortedQs) {
          const end = qEnd.get(q)!;
          const deltaHome = end.home - prevHome;
          const deltaAway = end.away - prevAway;
          if (q <= 4) {
            const key = `q${q}` as "q1" | "q2" | "q3" | "q4";
            if (homeNeedsCorrection) {
              const missingHome = deltaHome - (quarterScores.home[key] ?? 0);
              if (missingHome > 0) quarterScores.home[key] = (quarterScores.home[key] ?? 0) + missingHome;
            }
            if (awayNeedsCorrection) {
              const missingAway = deltaAway - (quarterScores.away[key] ?? 0);
              if (missingAway > 0) quarterScores.away[key] = (quarterScores.away[key] ?? 0) + missingAway;
            }
          } else {
            const otIdx = q - 5;
            if (quarterScores.home.ot.length <= otIdx) {
              while (quarterScores.home.ot.length < otIdx) quarterScores.home.ot.push(0);
              while (quarterScores.away.ot.length < otIdx) quarterScores.away.ot.push(0);
              quarterScores.home.ot.push(0);
              quarterScores.away.ot.push(0);
            }
            if (homeNeedsCorrection) {
              const missingHome = deltaHome - (quarterScores.home.ot[otIdx] ?? 0);
              if (missingHome > 0) quarterScores.home.ot[otIdx] = (quarterScores.home.ot[otIdx] ?? 0) + missingHome;
            }
            if (awayNeedsCorrection) {
              const missingAway = deltaAway - (quarterScores.away.ot[otIdx] ?? 0);
              if (missingAway > 0) quarterScores.away.ot[otIdx] = (quarterScores.away.ot[otIdx] ?? 0) + missingAway;
            }
          }
          prevHome = end.home;
          prevAway = end.away;
        }

        // Step 2: 보정 합 vs 매치 헤더 cap — over/under correction 처리.
        //   over (보정합 > 헤더): 마지막 쿼터부터 차감
        //   under (보정합 < 헤더): 마지막 쿼터에 추가
        const adjustQuarter = (
          team: "home" | "away",
          qIdx: number, // 1~4 또는 5+ (OT)
          delta: number, // 양수=추가, 음수=차감
        ) => {
          if (qIdx <= 4) {
            const key = `q${qIdx}` as "q1" | "q2" | "q3" | "q4";
            const cur = quarterScores[team][key] ?? 0;
            quarterScores[team][key] = Math.max(0, cur + delta);
            return Math.max(0, cur + delta) - cur; // 실제 변경량
          } else {
            const otIdx = qIdx - 5;
            const cur = quarterScores[team].ot[otIdx] ?? 0;
            quarterScores[team].ot[otIdx] = Math.max(0, cur + delta);
            return Math.max(0, cur + delta) - cur;
          }
        };

        const newSumHome = quarterScores.home.q1 + quarterScores.home.q2 + quarterScores.home.q3 + quarterScores.home.q4 + quarterScores.home.ot.reduce((a, b) => a + b, 0);
        const newSumAway = quarterScores.away.q1 + quarterScores.away.q2 + quarterScores.away.q3 + quarterScores.away.q4 + quarterScores.away.ot.reduce((a, b) => a + b, 0);

        // 마지막 진행 쿼터 결정 (PBP 보유)
        const lastQuarter = sortedQs.length > 0 ? sortedQs[sortedQs.length - 1] : 1;

        // home cap
        if (homeNeedsCorrection) {
          let homeDelta = homeHeaderScore - newSumHome;
          // 마지막 쿼터부터 역순으로 적용 (한 쿼터 점수 ≥0 유지)
          const orderedQs = [...sortedQs].reverse();
          orderedQs.unshift(lastQuarter); // 마지막 쿼터 우선
          const tried = new Set<number>();
          for (const q of orderedQs) {
            if (tried.has(q) || homeDelta === 0) continue;
            tried.add(q);
            const applied = adjustQuarter("home", q, homeDelta);
            homeDelta -= applied;
          }
        }
        // away cap
        if (awayNeedsCorrection) {
          let awayDelta = awayHeaderScore - newSumAway;
          const orderedQs = [...sortedQs].reverse();
          orderedQs.unshift(lastQuarter);
          const tried = new Set<number>();
          for (const q of orderedQs) {
            if (tried.has(q) || awayDelta === 0) continue;
            tried.add(q);
            const applied = adjustQuarter("away", q, awayDelta);
            awayDelta -= applied;
          }
        }
      }
      // 음수 gap 케이스 (homeHeaderScore < pbpSumHome 등): PBP 그대로 유지 (Flutter app 의 매치 헤더 미갱신 의심).
    }

    // 진행 중인 쿼터 계산 — 가장 최근 PBP 이벤트의 quarter
    // 라이브가 아니거나 PBP가 없으면 null. 프런트에서 isLive && current_quarter 조건으로 표시 분기.
    const latestPbp = await prisma.play_by_plays.findFirst({
      where: { tournament_match_id: BigInt(matchId) },
      orderBy: [{ created_at: "desc" }],
      select: { quarter: true },
    });
    const currentQuarter = latestPbp?.quarter ?? null;

    // 2026-04-22: GameResult v2 — MVP 선정 (GameScore 공식 단순화 버전)
    // 이유: 시안 GameResult.jsx 의 MVP 배너 렌더를 위해 playerStats 기반으로 최고 점수 선수 1명 추출.
    // 공식: pts + 0.4*fgm - 0.7*fga - 0.4*(fta-ftm) + 0.7*oreb + 0.3*dreb + stl + 0.7*ast + 0.7*blk - 0.4*pf - tov
    // 출전 기록 전혀 없는 선수(DNP)는 제외. homePlayers+awayPlayers 합친 리스트에서 최고 스코어 선수 1명.
    type MvpPlayer = {
      id: number;
      jersey_number: number | null;
      name: string;
      team_id: number;
      pts: number;
      reb: number;
      ast: number;
      stl: number;
      blk: number;
      plus_minus: number;
      fgm: number;
      fga: number;
      tpm: number;
      tpa: number;
      ftm: number;
      fta: number;
      game_score: number;
    };
    const allMvpCandidates: MvpPlayer[] = [];
    for (const p of [...homePlayers, ...awayPlayers]) {
      // DNP(완전 출전 없음) 제외
      if (p.dnp === true) continue;
      // 득점/시도/기록이 전부 0인 선수는 제외
      if (p.pts === 0 && p.fga === 0 && p.ast === 0 && p.reb === 0 && p.stl === 0 && p.blk === 0) continue;
      const gameScore =
        p.pts
        + 0.4 * p.fgm
        - 0.7 * p.fga
        - 0.4 * (p.fta - p.ftm)
        + 0.7 * p.oreb
        + 0.3 * p.dreb
        + p.stl
        + 0.7 * p.ast
        + 0.7 * p.blk
        - 0.4 * p.fouls
        - p.to;
      allMvpCandidates.push({
        id: p.id,
        jersey_number: p.jerseyNumber,
        name: p.name,
        team_id: p.teamId,
        pts: p.pts,
        reb: p.reb,
        ast: p.ast,
        stl: p.stl,
        blk: p.blk,
        plus_minus: p.plus_minus ?? 0,
        fgm: p.fgm,
        fga: p.fga,
        tpm: p.tpm,
        tpa: p.tpa,
        ftm: p.ftm,
        fta: p.fta,
        game_score: Math.round(gameScore * 10) / 10,
      });
    }
    // GameScore 내림차순 정렬. 동점이면 득점, 그 다음 어시스트 순.
    allMvpCandidates.sort((a, b) => {
      if (b.game_score !== a.game_score) return b.game_score - a.game_score;
      if (b.pts !== a.pts) return b.pts - a.pts;
      return b.ast - a.ast;
    });
    const mvpPlayer = allMvpCandidates[0] ?? null;

    // 2026-04-22: GameResult v2 — play_by_plays 타임라인 응답
    // 이유: 시안 timeline 탭을 위해 최근 이벤트 역순 노출.
    // 2026-05-02: 50 → 500 cap 으로 확대 (사용자 요청 "타임라인 전부 표시 안 됨").
    //   한 경기 PBP 평균 200~400건. 500이면 실질 무제한. 응답 크기 영향 미미.
    // 기존 응답 구조(playByPlays: []) 자리에 채워넣음 → 프론트 필드명 불변.
    // 선수명/팀ID는 allPbps 의 BigInt 만으로는 못 내리므로 roster(TournamentTeamPlayer)로 직접 lookup.
    // BUG: home_players[].id 는 분기(진행중/종료)에 따라 (a) tournament_team_player.id 또는 (b) match_player_stat.id
    //      가 되어 PBP의 tournament_team_player_id와 매칭 실패. roster에서 직접 매핑해야 확실히 매칭됨.
    const playerNameById = new Map<number, { name: string; jersey_number: number | null }>();
    for (const p of match.homeTeam?.players ?? []) {
      // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
      const name = getDisplayName(p.users, { player_name: p.player_name, jerseyNumber: p.jerseyNumber }, `#${p.jerseyNumber ?? "-"}`);
      playerNameById.set(Number(p.id), { name, jersey_number: p.jerseyNumber });
    }
    for (const p of match.awayTeam?.players ?? []) {
      // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
      const name = getDisplayName(p.users, { player_name: p.player_name, jerseyNumber: p.jerseyNumber }, `#${p.jerseyNumber ?? "-"}`);
      playerNameById.set(Number(p.id), { name, jersey_number: p.jerseyNumber });
    }
    // allPbps 는 created_at 순서대로 insert 되어 있으므로 quarter + game_clock_seconds 로 정렬.
    // 농구 게임 클럭은 내려가는 방식(10:00 → 0:00) 이므로 쿼터별로 clock 내림차순 = 발생순.
    // 최신순 렌더를 위해 여기서는 quarter DESC + clock ASC (쿼터 후반부가 먼저 오도록).
    const sortedPbp = [...allPbps].sort((a, b) => {
      if ((b.quarter ?? 0) !== (a.quarter ?? 0)) return (b.quarter ?? 0) - (a.quarter ?? 0);
      // 같은 쿼터 안에서는 clock 값이 작은 쪽(후반)이 먼저 — 농구 클럭은 10:00→0:00 감소
      return (a.game_clock_seconds ?? 0) - (b.game_clock_seconds ?? 0);
    });
    const playByPlays = sortedPbp.slice(0, 500).map((p, idx) => {
      const pid = p.tournament_team_player_id ? Number(p.tournament_team_player_id) : null;
      const playerInfo = pid ? playerNameById.get(pid) : null;
      return {
        id: idx, // PBP 자체 id 는 BigInt 라 serialize 이슈 회피용 인덱스
        quarter: p.quarter ?? 1,
        game_clock_seconds: p.game_clock_seconds ?? 0,
        team_id: p.tournament_team_id ? Number(p.tournament_team_id) : 0,
        jersey_number: playerInfo?.jersey_number ?? null,
        player_name: playerInfo?.name ?? "",
        action_type: p.action_type ?? "",
        action_subtype: p.action_subtype ?? null,
        is_made: p.is_made ?? null,
        points_scored: p.points_scored ?? 0,
      };
    });

    // 경기장명: tournament_matches.venue_name 우선 → 없으면 tournament.venue_name fallback
    const venueName = match.venue_name ?? match.tournament?.venue_name ?? null;

    // 합계 점수: DB homeScore가 0이면 playerStats 합산으로 fallback
    // 이유: 종료된 경기에서 homeScore/awayScore가 sync 안 된 경우 있음 (e.g. match 102)
    // 우선순위: DB homeScore(>0) > playerStats pts 합산
    const homePlayerPts = homePlayers.reduce((sum, p) => sum + p.pts, 0);
    const awayPlayerPts = awayPlayers.reduce((sum, p) => sum + p.pts, 0);
    const finalHomeScore = (match.homeScore && match.homeScore > 0) ? match.homeScore : homePlayerPts;
    const finalAwayScore = (match.awayScore && match.awayScore > 0) ? match.awayScore : awayPlayerPts;

    // 임시 디버그 (쿼터별 집계 불일치 진단용) — ?debug=1 시 PBP 샘플/매핑 노출
    const debugEnabled = req.nextUrl.searchParams.get("debug") === "1";
    const debugPayload = debugEnabled
      ? {
          pbp_count: allPbps.length,
          pbp_sample: allPbps.slice(0, 10).map((p) => ({
            player_id: p.tournament_team_player_id != null ? String(p.tournament_team_player_id) : null,
            team_id:   p.tournament_team_id   != null ? String(p.tournament_team_id)   : null,
            quarter: p.quarter,
            action_type: p.action_type,
            action_subtype: p.action_subtype,
            is_made: p.is_made,
            points_scored: p.points_scored,
          })),
          pbp_distinct_player_ids: Array.from(new Set(allPbps.map((p) => String(p.tournament_team_player_id)))),
          map_keys: Array.from(quarterStatsByPlayer.keys()),
          roster_player_ids_home: (match.homeTeam?.players ?? []).map((p) => String(p.id)),
          roster_player_ids_away: (match.awayTeam?.players ?? []).map((p) => String(p.id)),
        }
      : undefined;

    return apiSuccess({
      match: {
        id: Number(match.id),
        status: match.status ?? "scheduled",
        homeScore: finalHomeScore,
        awayScore: finalAwayScore,
        roundName: match.roundName,
        quarterScores,
        // 경기 날짜 필드 — 프런트에서 4/11~12 게임 클럭 부정확 안내 분기에 사용
        // scheduledAt(예정일) / started_at(실제 시작 시각) 둘 다 내려줘서 프런트가 우선순위로 선택 가능하게 함
        scheduledAt: match.scheduledAt?.toISOString() ?? null,
        startedAt: match.started_at?.toISOString() ?? null,
        tournamentName: match.tournament?.name ?? "",
        // 티빙 스타일 스코어카드 신규 필드 — 경기장명 + 진행 쿼터
        venueName,
        currentQuarter,
        // 2026-04-16: 쿼터별 이벤트 기반 상세 스탯 존재 여부 (프론트 안내 배너 + "—" 처리용)
        // apiSuccess가 camelCase → snake_case 변환하므로 클라이언트는 has_quarter_event_detail로 수신
        hasQuarterEventDetail,
        homeTeam: {
          id: Number(match.homeTeam?.id ?? 0),
          name: match.homeTeam?.team?.name ?? "홈",
          color: match.homeTeam?.team?.primaryColor ?? "#F97316",
          // 팀 로고 URL — 없으면 null (프런트에서 팀색 원 + 이니셜로 fallback)
          logoUrl: match.homeTeam?.team?.logoUrl ?? null,
        },
        awayTeam: {
          id: Number(match.awayTeam?.id ?? 0),
          name: match.awayTeam?.team?.name ?? "원정",
          color: match.awayTeam?.team?.primaryColor ?? "#10B981",
          logoUrl: match.awayTeam?.team?.logoUrl ?? null,
        },
        homePlayers,
        awayPlayers,
        // 2026-04-22: GameResult v2 — 타임라인 이벤트 (상위 50건, 최신순)
        // 기존 필드명 유지(playByPlays → snake_case 변환 후 play_by_plays).
        playByPlays,
        // 2026-04-22: GameResult v2 — MVP 선수 (GameScore 최고). 없으면 null.
        // apiSuccess camelCase → snake_case 변환으로 클라이언트는 mvp_player 로 수신.
        mvpPlayer,
        updatedAt: match.updatedAt.toISOString(),
        ...(debugPayload ? { _debug: debugPayload } : {}),
      },
    });
  } catch (err) {
    console.error("[live/id] error:", err);
    return apiError("Server error", 500);
  }
}

interface PlayerRow {
  id: number;
  jerseyNumber: number | null;
  name: string;
  teamId: number;
  min: number;
  min_seconds?: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fouls: number;
  plus_minus?: number;
  // 0414: DNP(Did Not Play) — 등록됐으나 출전 0 + 스탯 0
  dnp?: boolean;
  // 2026-04-15: 스타팅 5 여부 — 박스스코어 상단 정렬에 사용
  // 우선순위: MatchPlayerStat.isStarter → TournamentTeamPlayer.isStarter fallback → false
  isStarter?: boolean;
  // 2026-04-15: 쿼터별 스탯 (박스스코어 쿼터 필터 버튼용)
  // 키: "1"=Q1, "2"=Q2, ..., "5"=OT1. 해당 쿼터에 기록이 없으면 키 자체가 없음.
  quarter_stats?: Record<string, {
    min: number; min_seconds: number; pts: number;
    fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number;
    oreb: number; dreb: number; reb: number;
    ast: number; stl: number; blk: number; to: number; fouls: number; plus_minus: number;
  }>;
}

// 2026-05-03: PBP-only 출전시간은 src/lib/live/minutes-engine.ts 로 분리.
//   기존 estimateMinutesFromPbp / EstimatedMin 폐기 — 단일 source (calculateMinutes) 로 통일.

/// 선수가 "코트에서 뛴 기록이 전혀 없음" 여부 (DNP 판정)
function isDnpRow(p: {
  min_seconds?: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fouls: number;
}): boolean {
  return (
    (p.min_seconds ?? 0) === 0 &&
    p.pts === 0 &&
    p.fgm === 0 && p.fga === 0 &&
    p.tpm === 0 && p.tpa === 0 &&
    p.ftm === 0 && p.fta === 0 &&
    p.oreb === 0 && p.dreb === 0 &&
    p.ast === 0 && p.stl === 0 && p.blk === 0 &&
    p.to === 0 && p.fouls === 0
  );
}
