import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";
import { getDisplayName } from "@/lib/utils/player-display-name";

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

    // 2026-05-02 STL Phase 2 — quarter length 동적 추정 (양 분기 공통 사용)
    // 이유: 진행 중 + 종료 매치 모두에 sub 기반 출전시간 재계산을 적용하려면 분기 밖에서 산정.
    // (기존: 종료 매치 분기 안에서만 계산 — Phase 1 R8 commit f0278b4)
    // PBP 의 max game_clock_seconds = 쿼터 시작 시점 = quarter length.
    // 일반 농구 룰: 420(7분) / 480(8분) / 600(10분) / 720(12분).
    // 비정상값(<300 또는 >1200) → 600 default.
    const estimatedQL = (() => {
      if (allPbps.length === 0) return 600;
      const maxClock = Math.max(...allPbps.map((p) => p.game_clock_seconds ?? 0));
      if (maxClock < 300 || maxClock > 1200) return 600;
      const candidates = [420, 480, 600, 720];
      let best = 600;
      let bestDiff = Infinity;
      for (const c of candidates) {
        const diff = Math.abs(c - maxClock);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = c;
        }
      }
      return bestDiff <= 30 ? best : maxClock;
    })();

    // 2026-05-02 STL Phase 2 — sub 기반 출전시간 재계산 (모든 매치 0순위)
    //
    // 목적:
    //   (1) Flutter app 의 minutesPlayed 999s hard cap (2697 등 — 16~28분 실제 출전이 999s/16m 캡)
    //   (2) quarterStatsJson 의 last_clock 절단 (Q4 113s 남기고 끊긴 매치 등 — qsJson에 미반영 시간)
    //   두 문제를 동시에 회피.
    //
    // 알고리즘 (kebab-spec 기획안):
    //   - 쿼터별 lineup tracking
    //   - starter = 쿼터 내 등장한 선수 중 한번도 sub_in 으로 들어온 적 없는 선수
    //   - sub_in 시점 = lineup 진입 시각, sub_out 시점 = lineup 이탈 시각
    //   - 쿼터 종료 시 코트 잔존 선수 → 0초까지 자동 누적
    //   - DB / Flutter 응답 변경 0. 응답 가공만 (best-effort fallback 가드 포함).
    //
    // 안전망:
    //   - sub 기반 결과가 비합리적 (qLength × 4 초과 = 1쿼터 평균 초과) 시 기존 fallback
    //   - sub 결과 0 (PBP/sub 미입력 매치) 시 기존 fallback
    // G1 (2026-05-02): return 객체화 — perPlayer (시간 Map) + dnpSet (참고용)
    const { perPlayer: subBasedMinutes } = calculateSubBasedMinutes(allPbps, estimatedQL);


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

      // 진행 중 경기에서도 match_player_stats의 quarter_stats_json에서 MIN 보강 (dev)
      for (const stat of match.playerStats) {
        const pid = Number(stat.tournamentTeamPlayerId);
        const row = statsMap.get(pid);
        if (!row) continue;
        // 1) quarterStatsJson에서 초 합산 (2인 모드)
        //    2026-04-15: 집계뿐 아니라 "쿼터별" min/pm을 row.quarter_stats에도 주입하여 쿼터 필터 지원
        let resolved = false;
        if (stat.quarterStatsJson) {
          try {
            const parsed = JSON.parse(stat.quarterStatsJson) as Record<string, { min?: number; pm?: number }>;
            const total = Object.values(parsed).reduce((sum, q) => sum + (q.min ?? 0), 0);
            if (total > 0) {
              row.min_seconds = total;
              row.min = Math.round(total / 60);
              resolved = true;
            }
            // 쿼터별 min/pm → quarter_stats[qKey] 덮어쓰기
            // JSON 키 "Q1"→"1", ..., "OT1"→"5" 매핑 (현행 quarter_stats 키 체계와 통일)
            if (!row.quarter_stats) row.quarter_stats = {};
            for (const [jsonKey, qv] of Object.entries(parsed)) {
              const qKey = jsonKey.startsWith("OT")
                ? String(4 + Number(jsonKey.slice(2))) // "OT1"→"5", "OT2"→"6"
                : jsonKey.replace(/^Q/, ""); // "Q1"→"1"
              if (!qKey) continue;
              if (!row.quarter_stats[qKey]) {
                // 이벤트 기반 집계가 없던 쿼터 — 0 초기값으로 생성해서 MIN/PM만 채움
                row.quarter_stats[qKey] = {
                  min: 0, min_seconds: 0, pts: 0,
                  fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
                  oreb: 0, dreb: 0, reb: 0,
                  ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
                };
              }
              const minSec = qv.min ?? 0;
              row.quarter_stats[qKey].min_seconds = minSec;
              row.quarter_stats[qKey].min = Math.round(minSec / 60);
              row.quarter_stats[qKey].plus_minus = qv.pm ?? 0;
            }
          } catch {}
        }
        // 2) fallback: minutesPlayed (초 단위)
        if (!resolved && stat.minutesPlayed && stat.minutesPlayed > 0) {
          row.min_seconds = stat.minutesPlayed;
          row.min = Math.round(stat.minutesPlayed / 60);
        }
        // 0) STL Phase 2 — sub 기반 lineup tracking 결과 (진행 중 매치 분기)
        //   "더 큰 값 선택" 전략 (종료 매치 분기와 동일).
        //   라이브 매치 (D-day #133/#134/#135) 의 999s cap + last_clock 절단 동시 회피.
        //   sub 가 qsJson/minutesPlayed 보다 큰 경우만 갱신 → 정상 매치 (qsJson 만점) 영향 0.
        // G1 (2026-05-02): DNP 선수는 sub 무효 — qsJson=0 + dbMin=0 + PBP 0건인 선수가
        //   F3 starter chain 으로 시간 받던 버그 (#136 +49.8m) fix.
        //   판정: stat 자체가 모든 누적 0 (qsJson/dbMin 모두 0) 일 때 sub 시간도 0 처리.
        // G3 (2026-05-02): subBasedMinutes 가 PlayerTimeBreakdown 으로 변경 → 3채널 sum
        const subBreakdownLive = subBasedMinutes.get(BigInt(pid));
        const subSecLive = totalOf(subBreakdownLive);
        const hasAnyRealStat = (row.min_seconds ?? 0) > 0
          || row.pts > 0 || row.fgm > 0 || row.fga > 0 || row.tpm > 0 || row.tpa > 0
          || row.ftm > 0 || row.fta > 0 || row.oreb > 0 || row.dreb > 0
          || row.ast > 0 || row.stl > 0 || row.blk > 0 || row.to > 0 || row.fouls > 0;
        // 풀타임 검출 — sub trustedSec 이 4×qLen 근접 → 그대로 채택 (cap 보호)
        const fullMatchSecLive = estimatedQL * 4;
        if (
          hasAnyRealStat &&
          subBreakdownLive &&
          subBreakdownLive.trustedSec >= fullMatchSecLive - 2
        ) {
          row.min_seconds = subBreakdownLive.trustedSec;
          row.min = Math.round(subBreakdownLive.trustedSec / 60);
          row._minBreakdown = { trustedSec: subBreakdownLive.trustedSec, mediumSec: 0, distributedSec: 0 };
        } else if (subSecLive > 0 && subSecLive <= fullMatchSecLive && hasAnyRealStat && subSecLive > (row.min_seconds ?? 0)) {
          // sub 채택: 3채널 그대로 보관 → cap 시 distributed 우선 축소
          row.min_seconds = subSecLive;
          row.min = Math.round(subSecLive / 60);
          row._minBreakdown = subBreakdownLive ? { ...subBreakdownLive } : undefined;
        } else if ((row.min_seconds ?? 0) > 0) {
          // qsJson/dbMin 우위 — 외부 출처는 trustedSec 으로 (축소 금지)
          row._minBreakdown = { trustedSec: row.min_seconds ?? 0, mediumSec: 0, distributedSec: 0 };
        }
        // +/- 보강 (전체 집계 레벨)
        if (stat.plusMinus != null) {
          row.plus_minus = stat.plusMinus;
        }
        // 2026-04-15: MatchPlayerStat.isStarter가 있으면 TournamentTeamPlayer fallback을 덮어쓰기
        if (stat.isStarter != null) {
          row.isStarter = stat.isStarter;
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
      for (const row of [...homePlayers, ...awayPlayers]) {
        const qs = quarterStatsByPlayer.get(row.id);
        if (qs && Object.keys(qs).length > 0) {
          row.quarter_stats = qs;
        }
      }
    } else {
      // 종료된 경기 — playerStats 테이블 사용
      //
      // 2026-05-02: B-2 — Flutter app 이 minutes_played=0 보낸 매치(예: 매치 101)의 MIN fallback.
      //   matchPlayerStat.minutesPlayed === 0 + quarterStatsJson 도 비어있을 때만 PBP 시뮬레이션 추정.
      //   DB 안 건드림 → Flutter sync 영향 0.
      //   starter 정보는 playerStats[].isStarter (또는 player.isStarter fallback) 에서 추출.
      const startersByTeam = new Map<number, Set<number>>();
      for (const stat of match.playerStats) {
        const player = stat.tournamentTeamPlayer;
        const isStarter = stat.isStarter ?? player.isStarter ?? false;
        if (!isStarter) continue;
        const teamId = Number(player.tournamentTeamId);
        if (!startersByTeam.has(teamId)) startersByTeam.set(teamId, new Set());
        startersByTeam.get(teamId)!.add(Number(player.id));
      }
      // 2026-05-02 STL Phase 2: estimatedQL 은 분기 밖에서 산정 (양 분기 공통 사용).
      // 기존 estimateMinutesFromPbp 는 STL R3 (quarterStatsJson 부분 누락 보충) 용으로 그대로 유지.
      const minEstimates = estimateMinutesFromPbp(allPbps, startersByTeam, estimatedQL);

      // quarter_stats_json에서 초 단위 MIN 합계 계산 (없으면 minutesPlayed * 60 fallback → PBP 추정 fallback)
      // 2026-05-02 STL Phase 2: sub 기반 lineup tracking 결과 — "qsJson/minutesPlayed 보다 큰 경우만" 채택.
      //
      // 검증 결과 (매치 #132~#135 4건):
      //   #134 (last_clock 절단): sub 273.95m > qsJson 264.17m → sub 채택 (+9.78m 회복)
      //   #132/#135 (qsJson 만점): sub 264~267m < qsJson 280m → qsJson 유지
      //   #133: qsJson 278.67m > sub 255.05m → qsJson 유지
      //
      // 이유: sub 기반은 substitution PBP 누락 시 (예: 올아웃 5명 일괄 교체 중 일부 미생성) 시간을 잃음.
      //       qsJson 이 더 정확한 경우가 다수 → sub 는 보강용 0순위가 아닌 "더 큰 값 선택" 전략.
      // G3 (2026-05-02): 신뢰도 기반 출전시간 선택 — 풀타임 보호 + cap 정확성.
      // 반환: { sec, breakdown }
      //   sec       : 응답에 들어갈 최종 min_seconds 후보 (cap 적용 전)
      //   breakdown : 팀 cap 적용 시 distributed 우선 축소용 분리값
      // 단, 마지막에 qsJson/dbMin/pbpSim 이 더 큰 경우는 그 값 자체를 trustedSec 으로 간주
      // (외부 출처 = 우리 알고리즘이 회수 못한 시간이므로 축소 금지).
      const getSecondsPlayed = (stat: (typeof match.playerStats)[number]): { sec: number; breakdown: PlayerTimeBreakdown } => {
        const playerId = Number(stat.tournamentTeamPlayer.id);
        const subBreakdown = subBasedMinutes.get(BigInt(playerId));
        const subTotal = totalOf(subBreakdown);
        // 합리성 가드: 쿼터당 평균 < quarter_length (4쿼터 = qLength × 4)
        const subValid = subTotal > 0 && subTotal <= estimatedQL * 4;

        // 1) quarterStatsJson 합산
        let qsJsonSec = 0;
        if (stat.quarterStatsJson) {
          try {
            const parsed = JSON.parse(stat.quarterStatsJson) as Record<string, { min?: number; pm?: number }>;
            qsJsonSec = Object.values(parsed).reduce((sum, q) => sum + (q.min ?? 0), 0);
          } catch {}
        }
        // 2) minutesPlayed (Flutter 999s cap 가능성 있음)
        const dbMinSec = stat.minutesPlayed && stat.minutesPlayed > 0 ? stat.minutesPlayed : 0;
        // 3) PBP 시뮬레이션 (B-2 fallback)
        const est = minEstimates.get(Number(stat.tournamentTeamPlayer.id));
        const pbpSimSec = est?.totalSec ?? 0;

        // G1 (2026-05-02): DNP 선수의 sub 시간 무효화
        //   qsJson === 0 + dbMin === 0 + PBP 시뮬레이션 === 0 + 통계 누적도 0
        //   → 이 선수는 매치 출전 0초. sub 가 가짜 시간 (#136 전효민 22m 류) 일 가능성 높음.
        const hasRealRecord =
          qsJsonSec > 0 || dbMinSec > 0 || pbpSimSec > 0 ||
          (stat.points ?? 0) > 0 ||
          (stat.fieldGoalsMade ?? 0) > 0 || (stat.fieldGoalsAttempted ?? 0) > 0 ||
          (stat.threePointersMade ?? 0) > 0 || (stat.threePointersAttempted ?? 0) > 0 ||
          (stat.freeThrowsMade ?? 0) > 0 || (stat.freeThrowsAttempted ?? 0) > 0 ||
          (stat.offensive_rebounds ?? 0) > 0 || (stat.defensive_rebounds ?? 0) > 0 ||
          (stat.assists ?? 0) > 0 || (stat.steals ?? 0) > 0 || (stat.blocks ?? 0) > 0 ||
          (stat.turnovers ?? 0) > 0 || (stat.personal_fouls ?? 0) > 0 ||
          (stat.isStarter ?? false);

        // DNP → 모든 채널 0
        if (!hasRealRecord) {
          return { sec: 0, breakdown: { trustedSec: 0, mediumSec: 0, distributedSec: 0 } };
        }

        const fullMatchSec = estimatedQL * 4;

        // [1순위] 풀타임 검출 — sub 기반 trustedSec 가 풀매치(4×qLen)에 근접
        //   → 한 번도 안 빠진 선수. 그대로 반환 (cap 시 절대 축소 X).
        if (subBreakdown && subBreakdown.trustedSec >= fullMatchSec - 2) {
          return {
            sec: subBreakdown.trustedSec,
            breakdown: { trustedSec: subBreakdown.trustedSec, mediumSec: 0, distributedSec: 0 },
          };
        }

        // [2순위] qsJson 이 sub 와 비슷 (±60s) → qsJson 신뢰 (Flutter 정상 입력 매치)
        //   qsJson 자체는 우리 알고리즘 외부 출처 → 전체 trustedSec 로 간주 (축소 금지).
        if (qsJsonSec > 0 && subValid && Math.abs(qsJsonSec - subTotal) < 60) {
          return {
            sec: qsJsonSec,
            breakdown: { trustedSec: qsJsonSec, mediumSec: 0, distributedSec: 0 },
          };
        }

        // [3순위] sub 채택 (G1 가드 통과 + 합리값) — 3채널 그대로 반환 → cap 시 distributed 우선 축소
        if (subValid && subBreakdown) {
          return { sec: subTotal, breakdown: { ...subBreakdown } };
        }

        // [4순위] qsJson > dbMin > pbpSim 중 최대값 — 외부 출처는 trustedSec 처리
        const fallback = Math.max(qsJsonSec, dbMinSec, pbpSimSec);
        if (fallback > 0) {
          return {
            sec: fallback,
            breakdown: { trustedSec: fallback, mediumSec: 0, distributedSec: 0 },
          };
        }

        return { sec: 0, breakdown: { trustedSec: 0, mediumSec: 0, distributedSec: 0 } };
      };

      const toPlayerRow = (stat: (typeof match.playerStats)[number]): PlayerRow => {
        const player = stat.tournamentTeamPlayer;
        const user = player.users;
        // G3 (2026-05-02): getSecondsPlayed 가 { sec, breakdown } 반환 → cap 적용 단계용 breakdown 보관
        const { sec: minSeconds, breakdown: minBreakdown } = getSecondsPlayed(stat);
        // 2026-05-02 B-2: stat.minutesPlayed 가 0 이면 minSeconds(PBP 추정)에서 분 단위로 변환
        const minDerived = stat.minutesPlayed && stat.minutesPlayed > 0
          ? stat.minutesPlayed
          : Math.round(minSeconds / 60);
        const row: PlayerRow = {
          id: Number(stat.id),
          jerseyNumber: player.jerseyNumber,
          // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
          name: getDisplayName(user, { player_name: player.player_name, jerseyNumber: player.jerseyNumber }, `#${player.jerseyNumber ?? "-"}`),
          teamId: Number(player.tournamentTeamId),
          min: minDerived,
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
          // G3: cap 적용용 신뢰도 분리 breakdown
          _minBreakdown: minBreakdown,
        };

        // 2026-04-18: MIN fallback 은 롤백 (DNP 조건까지만 조정, MIN fake 주입 안 함).
        const playerIdNum = Number(player.id);

        row.dnp = isDnpRow(row);
        // 2026-04-18: DNP 완화 — is_starter 또는 PBP 에 등장한 선수는 DNP 표시 해제 (출전선수를 "DNP"→"00:00" 로)
        if (row.isStarter || playedPlayerIds.has(playerIdNum)) {
          row.dnp = false;
        }
        // 쿼터별 집계 주입 (종료 경기 분기) — tournamentTeamPlayerId로 Map 조회
        const qs = quarterStatsByPlayer.get(Number(player.id));
        if (qs && Object.keys(qs).length > 0) {
          row.quarter_stats = qs;
        }
        // 2026-04-15: quarterStatsJson의 쿼터별 min(초)/pm을 quarter_stats에 주입
        // "Q1"→"1", "OT1"→"5" 키 매핑. 이벤트 기반에 해당 쿼터가 없으면 0초기화 후 MIN/PM만 채움.
        let appliedMinFromJson = false;
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
              const minSec = qv.min ?? 0;
              row.quarter_stats[qKey].min_seconds = minSec;
              row.quarter_stats[qKey].min = Math.round(minSec / 60);
              row.quarter_stats[qKey].plus_minus = qv.pm ?? 0;
              if (minSec > 0) appliedMinFromJson = true;
            }
          } catch {}
        }

        // 2026-05-02 STL R3 — quarterStatsJson 부분 누락 쿼터에 PBP 시뮬 주입
        //
        // 배경 (매치 133 케이스): Flutter app 의 quarterStatsJson 갱신이
        //   라이브 매치의 마지막 진행 쿼터를 종종 누락 (예: Q3 시작 후 sub 없는 동안 min=0).
        //   양팀 starter 모두 동일 패턴 → 양팀 합계 차이 0 이지만 진행 시간 미달.
        //
        // 해결:
        //   B-2 (이전): quarterStatsJson 비었을 때만 PBP 시뮬 fallback (전체 대체).
        //   R3 (신규): quarterStatsJson 일부 채워진 케이스에서, "누락 쿼터(Q*.min=0 또는 키 없음)"만
        //              PBP 시뮬값으로 보충. 정상 쿼터는 그대로 유지.
        //
        // 발동 조건:
        //   - estimateMinutesFromPbp 결과 (minEstimates) 가 그 선수에 대해 존재
        //   - 그 쿼터의 quarter_stats[q].min_seconds = 0 (json 누락 또는 0)
        //   - PBP 시뮬값 > 0 (실제 코트 출전한 선수)
        const est = minEstimates.get(Number(player.id));
        if (est && est.byQuarter.size > 0) {
          if (!row.quarter_stats) row.quarter_stats = {};
          for (const [q, sec] of est.byQuarter.entries()) {
            if (sec <= 0) continue;
            const qKey = String(q);
            const cur = row.quarter_stats[qKey];
            // 정상 쿼터는 건드리지 않음 — 누락된 쿼터(min_seconds=0)만 보충
            if (cur && cur.min_seconds > 0) continue;
            if (!cur) {
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
          // row.min_seconds / row.min 도 quarter_stats 합으로 재계산 (보충 반영)
          // 단, matchPlayerStat.minutesPlayed 가 더 크면 그 값 유지 (Flutter 우선)
          const qsTotal = Object.values(row.quarter_stats).reduce((a, q) => a + (q.min_seconds ?? 0), 0);
          if (qsTotal > (row.min_seconds ?? 0)) {
            row.min_seconds = qsTotal;
            row.min = Math.round(qsTotal / 60);
          }
        }
        // appliedMinFromJson 사용 흔적 정리 (변수 자체는 stat.quarterStatsJson 처리에 여전히 사용됨)
        void appliedMinFromJson;

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

    // G4 (2026-05-02): 팀별 출전시간 cap 양방향 정확 매칭 — medium+distributed 동시 비율, 풀타임 trustedSec 절대 보호
    //
    // 원칙:
    //   total = trusted + medium + distributed  (선수 단위)
    //   teamTotal = sum(total)                  (팀 단위)
    //   cap = 5 × qLen × 4 (=4쿼터 풀 = 1팀 코트시간 합 = 정확히 140분)
    //
    //   1) |teamTotal - cap| < 1s : 변경 0 (이미 정확 일치)
    //   2) trustedTotal > cap : 데이터 이상 — 경고 로그만 + 그대로 (풀타임 보호)
    //   3) variableTotal > 0 (medium/distributed 존재) :
    //      remaining = cap - trustedTotal           ← medium+distributed 가 차지할 정확 양
    //      ratio = remaining / (mediumTotal + distributedTotal)
    //      medium *= ratio + distributed *= ratio   ← ratio < 1 이면 축소, ratio > 1 이면 확대
    //   4) variableTotal = 0 (옵션 B fallback — sub_in/sub_out 명시 매치 #133 케이스):
    //      풀타임 선수 (trustedSec >= qLen×4 - 5s) 는 절대 보호 + partial trustedSec 만 비례 확대.
    //      remainingForPartial = cap - fullTimeSum
    //      trustedRatio = remainingForPartial / partialSum
    //      partial.trustedSec *= trustedRatio       ← partial 만 확대해 cap 정확 매칭
    //
    //   풀타임 선수의 trustedSec 은 절대 변경 X (28분 선수 1680s 보장).
    //
    //   G3 와 차이: G3 는 합 > cap 시만 축소. G4 는 합 < cap 도 정확히 cap 에 맞춤.
    //   → #132/#134/#135 (medium/distributed 있음) = 케이스 3 / #133 (없음) = 케이스 4
    //   → 4매치 모두 280m 정확 매칭.
    // G4 디버그 정보 (debug=1 시 응답에 포함)
    const capDebug: Array<Record<string, unknown>> = [];
    const applyTeamCap = (players: PlayerRow[], teamLabel: string): void => {
      // 2026-05-03: 라이브 매치는 cap 적용 skip (status-aware 단순화).
      // 사유: 진행 중 매치는 partial total < cap → 비례 확대 13배+ 부풀림.
      //       라이브에서는 raw 값 그대로 표시, 종료 매치만 cap 정확 매칭 적용.
      if (match.status !== "completed") {
        return;
      }
      // G4 (2026-05-02 양방향): 일치하지 않을 때 medium+distributed 비례 매칭
      const cap = 5 * estimatedQL * 4; // 한 팀의 최대 코트시간 합 (예: 7분 → 8400s, 10분 → 12000s)

      // 합산 (cap 체크용) — _minBreakdown 부재 선수는 min_seconds 그대로 부재합산 (G4 디버그)
      let trustedTotal = 0;
      let mediumTotal = 0;
      let distributedTotal = 0;
      let unmappedTotal = 0; // _minBreakdown 가 없는 선수의 min_seconds 합 (cap 적용 외부 영역)
      let mappedCount = 0;
      let unmappedCount = 0;
      for (const p of players) {
        const b = p._minBreakdown;
        if (!b) {
          unmappedTotal += p.min_seconds ?? 0;
          unmappedCount++;
          continue;
        }
        trustedTotal += b.trustedSec;
        mediumTotal += b.mediumSec;
        distributedTotal += b.distributedSec;
        mappedCount++;
      }
      const total = trustedTotal + mediumTotal + distributedTotal;
      capDebug.push({
        team: teamLabel, cap, total, trustedTotal, mediumTotal, distributedTotal,
        unmappedTotal, mappedCount, unmappedCount,
      });

      // 1초 이내 일치 → 변경 0 (이미 정확)
      if (Math.abs(total - cap) < 1) return;

      // 데이터 이상 (풀타임 합만으로 cap 초과) — 경고만 + 그대로 (풀타임 보호 우선)
      if (trustedTotal > cap) {
        console.warn(`[live/cap] team trustedSec ${trustedTotal} > cap ${cap} — 풀타임 보호 우선, cap skip`);
        return;
      }

      // medium + distributed 가 채워야 할 정확 양
      const remaining = cap - trustedTotal;
      const variableTotal = mediumTotal + distributedTotal;

      // 가변 풀이 0 이면 분배 불가가 아니라 — G4 옵션 B fallback 으로 진입 (trustedSec 만 비례 확대)
      // 이유: #133 케이스 (sub_in/sub_out 명시 매치) 는 medium/distributed = 0 이고 trustedTotal < cap.
      //       이때 풀타임 선수는 보호하고, partial 출전 trusted 만 비례 확대해 280m 정확 매칭.
      if (variableTotal < 1) {
        // 풀타임 임계값 — 풀타임 = 4쿼터 출전 = qLen × 4 (예: 7분 → 1680s, 10분 → 2400s)
        // ±5s 마진을 둬서 1675s 이상이면 "풀타임 선수" 로 간주 (ratio 적용 X)
        const fullTimeThreshold = estimatedQL * 4 - 5;

        let fullTimeSum = 0;   // 풀타임 선수의 trustedSec 합 (보호 영역)
        let partialSum = 0;    // 비풀타임 선수의 trustedSec 합 (비례 확대 대상)
        for (const p of players) {
          const b = p._minBreakdown;
          if (!b) continue;
          if (b.trustedSec >= fullTimeThreshold) {
            fullTimeSum += b.trustedSec;
          } else {
            partialSum += b.trustedSec;
          }
        }

        // partial 합이 0 이거나, 풀타임 합이 cap 을 넘으면 분배 불가 — 그대로
        // (풀타임 선수가 cap 초과는 trustedTotal > cap 케이스에서 이미 걸러짐. 안전망)
        const remainingForPartial = cap - fullTimeSum;
        if (partialSum < 1 || remainingForPartial < 0) {
          capDebug.push({ team: teamLabel, optionB: "skip", fullTimeSum, partialSum, remainingForPartial });
          return;
        }

        // partial 만 비례 확대 (풀타임은 그대로 보호)
        const trustedRatio = remainingForPartial / partialSum;
        capDebug.push({ team: teamLabel, optionB: "applied", fullTimeSum, partialSum, trustedRatio });

        for (const p of players) {
          const b = p._minBreakdown;
          if (!b) continue;
          // 풀타임 선수는 trustedSec 그대로 (1680s ±5s 절대 보호)
          if (b.trustedSec < fullTimeThreshold) {
            b.trustedSec = b.trustedSec * trustedRatio;
          }
          // medium/distributed 는 0 이지만 안전하게 합산
          p.min_seconds = Math.round(b.trustedSec + b.mediumSec + b.distributedSec);
          p.min = Math.round(p.min_seconds / 60);
        }
        return;
      }

      // 양방향 비율 (ratio < 1 = 축소 / ratio > 1 = 확대)
      const ratio = remaining / variableTotal;

      for (const p of players) {
        if (!p._minBreakdown) continue;
        // trustedSec 은 절대 변경 X (풀타임 선수 1680s 보호)
        p._minBreakdown.mediumSec = p._minBreakdown.mediumSec * ratio;
        p._minBreakdown.distributedSec = p._minBreakdown.distributedSec * ratio;
      }

      // min_seconds / min 재계산 (반올림은 최종 단계에서만 — 누적 오차 최소화)
      for (const p of players) {
        if (!p._minBreakdown) continue;
        const newSec = Math.round(
          p._minBreakdown.trustedSec + p._minBreakdown.mediumSec + p._minBreakdown.distributedSec,
        );
        p.min_seconds = newSec;
        p.min = Math.round(newSec / 60);
      }
    };
    applyTeamCap(homePlayers, "home");
    applyTeamCap(awayPlayers, "away");

    // _minBreakdown 은 내부 cap 계산용 — 응답 직전 strip (외부 노출 X)
    for (const p of [...homePlayers, ...awayPlayers]) {
      delete p._minBreakdown;
    }

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
          cap_debug: capDebug,
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
  // G3 (2026-05-02): cap 적용용 신뢰도 분리 breakdown — 응답 직전 정리 (snake_case 변환 시 외부 노출 X)
  _minBreakdown?: PlayerTimeBreakdown;
}

// 2026-05-02: PBP action_subtype "in:X,out:Y" 파싱 → 쿼터별 IN/OUT 시뮬레이션
// 사용처: matchPlayerStat.minutesPlayed === 0 + quarterStatsJson 도 비어있는 매치의 fallback.
//   예) 매치 101 — Flutter app이 minutes_played=0 보낸 케이스 (운영 DB 8 매치 중 유일).
// 안전성:
//  - DB 손대지 않고 응답에서만 추정값 채움 → Flutter sync 영향 0.
//  - regex 미매칭/데이터 부정합 시 0 반환 (안전 fallback).
//  - quarterLengthSec 600초 가정 (settings.quarter_length 우선 사용 가능).
type EstimatedMin = { totalSec: number; byQuarter: Map<number, number> };

function estimateMinutesFromPbp(
  pbps: Array<{
    quarter: number | null;
    game_clock_seconds: number | null;
    action_type: string;
    action_subtype: string | null;
    tournament_team_player_id: bigint | number | null;
    tournament_team_id: bigint | number | null;
    sub_in_player_id?: bigint | number | null;
    sub_out_player_id?: bigint | number | null;
  }>,
  startersByTeam: Map<number, Set<number>>,
  quarterLengthSec = 600,
): Map<number, EstimatedMin> {
  const out = new Map<number, EstimatedMin>();
  const addSec = (pid: number, q: number, sec: number) => {
    if (sec <= 0) return;
    let r = out.get(pid);
    if (!r) {
      r = { totalSec: 0, byQuarter: new Map() };
      out.set(pid, r);
    }
    r.totalSec += sec;
    r.byQuarter.set(q, (r.byQuarter.get(q) ?? 0) + sec);
  };

  // 쿼터 그룹 (quarter > 0 만, 시간순 = clock 내림차순 10:00→0:00)
  const byQ = new Map<number, typeof pbps>();
  for (const p of pbps) {
    const q = p.quarter ?? 0;
    if (q < 1) continue;
    if (!byQ.has(q)) byQ.set(q, []);
    byQ.get(q)!.push(p);
  }
  for (const list of byQ.values()) {
    list.sort((a, b) => (b.game_clock_seconds ?? 0) - (a.game_clock_seconds ?? 0));
  }
  const quarterKeys = Array.from(byQ.keys()).sort((a, b) => a - b);

  // 2026-05-02 매치 132 fix: 쿼터별 마지막 PBP clock = 그 쿼터의 끝점.
  //  - 종료 매치: lastClock ≈ 0 (정상 — 600초 누적)
  //  - 라이브 매치 (마지막 진행 쿼터): lastClock > 0 (예: 212초) → starter (600-212)=388초만 누적
  //  - 이벤트 없는 쿼터: lastClock=quarterLengthSec → 누적 0 (시작 안 된 쿼터)
  // 모든 팀 PBP 통합 기준으로 산출 (한 팀만 sub 한 경우에도 다른 팀 동일 시점 적용).
  const lastClockByQ = new Map<number, number>();
  for (const q of quarterKeys) {
    const all = byQ.get(q) ?? [];
    if (all.length === 0) continue;
    const minClock = Math.min(...all.map((e) => e.game_clock_seconds ?? quarterLengthSec));
    lastClockByQ.set(q, minClock);
  }

  // 팀별로 별도 시뮬레이션 (각 팀 코트 5명 트래킹)
  for (const [teamId, starters] of startersByTeam.entries()) {
    let prevQuarterEndCourt: Set<number> = new Set(starters);

    for (const q of quarterKeys) {
      const events = (byQ.get(q) ?? []).filter(
        (p) => Number(p.tournament_team_id) === teamId,
      );
      // 쿼터 끝점 — 라이브 매치는 마지막 PBP clock, 종료 매치는 ≈0
      const lastClock = lastClockByQ.get(q) ?? quarterLengthSec;

      // 쿼터 시작 코트 = 이전 쿼터 끝 코트 (Q1은 starter)
      const onCourt = new Map<number, number>();
      for (const pid of prevQuarterEndCourt) {
        onCourt.set(pid, quarterLengthSec);
      }

      for (const e of events) {
        if (e.action_type !== "substitution") continue;

        // (a) 별도 컬럼 우선 (Flutter app이 향후 채울 경우)
        let inPid = e.sub_in_player_id ? Number(e.sub_in_player_id) : 0;
        let outPid = e.sub_out_player_id ? Number(e.sub_out_player_id) : 0;
        // (b) 컬럼 비어있으면 action_subtype "in:X,out:Y" 파싱 (현재 Flutter 형식)
        if (!inPid || !outPid) {
          const m = e.action_subtype?.match(/in:(\d+),out:(\d+)/);
          if (!m) continue;
          inPid = inPid || Number(m[1]);
          outPid = outPid || Number(m[2]);
        }
        const clock = e.game_clock_seconds ?? 0;

        // 쿼터 시작 시점 (clock ≈ quarterLengthSec) 의 sub = 라인업 설정 이벤트로 간주
        // (매치 101 처럼 Flutter가 Q 시작에 5명 라인업을 sub 형태로 기록)
        if (clock >= quarterLengthSec - 1) {
          if (onCourt.has(outPid)) onCourt.delete(outPid);
          if (!onCourt.has(inPid)) onCourt.set(inPid, quarterLengthSec);
          continue;
        }

        // 일반 sub: out 의 (in_clock - now) 누적, in 은 in_clock=now 로 새로 시작
        if (onCourt.has(outPid)) {
          const inClock = onCourt.get(outPid)!;
          addSec(outPid, q, inClock - clock);
          onCourt.delete(outPid);
        }
        if (!onCourt.has(inPid)) {
          onCourt.set(inPid, clock);
        }
      }

      // 쿼터 끝: 코트 잔존 선수 → (in_clock - lastClock) 누적
      // 라이브 매치 마지막 진행 쿼터는 lastClock > 0 이라 진행 시점까지만 누적.
      for (const [pid, inClock] of onCourt.entries()) {
        addSec(pid, q, Math.max(0, inClock - lastClock));
      }

      prevQuarterEndCourt = new Set(onCourt.keys());
    }
  }

  return out;
}

// 2026-05-02 STL Phase 2 — sub 기반 lineup tracking 알고리즘
//
// 목적: Flutter 999s cap + qsJson last_clock 절단 동시 회피.
//       응답 가공만 / DB·Flutter 변경 0.
//
// 입력: PBP 전체 (모든 쿼터, 모든 팀, 모든 액션 타입)
// 출력: Map<ttp_id, total_seconds>
//
// 핵심 로직 (쿼터별):
//   1) 쿼터 내 등장한 모든 선수 수집 (action 또는 sub_in/out 으로 등장)
//   2) substitution 이벤트 파싱 (action_subtype="in:X,out:Y" 문자열 — schema 컬럼은 미사용)
//   3) starter 추정 = 쿼터 내 등장 + 한번도 sub_in 으로 들어온 적 없는 선수
//   4) starter 는 quarterLengthSec 시점부터 시작, sub_out 시 lineup 이탈, sub_in 시 진입
//   5) 쿼터 종료 (clock=0) 시 잔존 선수는 0초까지 자동 누적
//
// ⚠️ schema 의 sub_in_player_id / sub_out_player_id 컬럼은 현재 모두 null
//    (Flutter app 이 안 채움). action_subtype 문자열 파싱이 정답.
function parseSubAction(subtype: string | null): { inId: bigint; outId: bigint } | null {
  if (!subtype) return null;
  const m = subtype.match(/^in:(\d+),out:(\d+)$/);
  if (!m) return null;
  try {
    return { inId: BigInt(m[1]), outId: BigInt(m[2]) };
  } catch {
    return null;
  }
}

// 반환 타입 — G3 (2026-05-02) 신뢰도 분리:
//   trustedSec (HIGH)      : sub_in→sub_out 양 끝 명시 segment + 풀타임 (한 쿼터 sub 0건 starter — 정확히 qLen)
//   mediumSec (MEDIUM)     : starter→sub_out (시작 qLen 추정) / sub_in→쿼터끝 (끝 0초 추정)
//   distributedSec (LOW)   : F2 deficit 가중분배
// totalSec = sum(3채널). 풀타임 선수 = trustedSec ≥ 4×qLen → cap 시 절대 축소 금지.
type PlayerTimeBreakdown = {
  trustedSec: number;
  mediumSec: number;
  distributedSec: number;
};
type SubBasedMinutesResult = {
  perPlayer: Map<bigint, PlayerTimeBreakdown>;
  dnpSet: Set<bigint>;
};

// 합산 헬퍼 — 3채널 sum
function totalOf(b: PlayerTimeBreakdown | undefined): number {
  if (!b) return 0;
  return b.trustedSec + b.mediumSec + b.distributedSec;
}

function calculateSubBasedMinutes(
  pbps: Array<{
    quarter: number | null;
    game_clock_seconds: number | null;
    action_type: string;
    action_subtype: string | null;
    tournament_team_player_id: bigint | number | null;
    tournament_team_id: bigint | number | null;
  }>,
  quarterLengthSec: number,
): SubBasedMinutesResult {
  // 2026-05-02 STL Phase 2 강화 (F3 + F2)
  // F3: starter 추정 정확화 — Q2~Q4 starter = 직전 쿼터 종료 시점 코트 5명
  //     (기존: 쿼터 내 등장 + sub_in 미경험. 단점: 직전 쿼터에서 들어와 그 쿼터 코트 끝까지 잔존했지만
  //      현재 쿼터에선 PBP 등장 0건인 선수 → starter 로 인정 안 됨 → 시간 누락)
  // F2: 쿼터별 합 미달 보정 — 쿼터별 합 < expected (5 × qLen) 시 deficit 을 출전 선수에 가중 분배
  //     (단 deficit < qLen 가드 — 비합리값 제외)
  // 2026-05-02 G1: DNP 가드 추가 — F2 가중분배가 PBP 액션 0건 + sub 등장 0건 선수에게 시간 분배하던 버그
  //     (예: 매치 #136 전효민 = qsJson=0 + dbMin=0 + PBP 0건인데 sub=22m 받아 양팀 합 +49.8m 초과)
  //     원인: F3 starter 추정이 prevLineup 을 그대로 받아 DNP 선수를 starter 로 잘못 포함 →
  //          quarterPlayerSec 에 시간 누적 → F2 분배 대상에 진입.
  //     fix: 매치당 DNP set 사전 계산 (PBP 액션 + sub in/out 양쪽 검증) → starter / F2 분배 모두에서 제외.

  // 팀별로 분리해서 처리 (lineup tracking 은 팀 단위가 맞음 — 다른 팀 선수가 섞이면 X)
  // 하지만 출력 result 는 통합 (Map<ttpId, totalSec>).

  // G1 DNP set: PBP 액션 풀 (action_type !== 'substitution') 등장 + sub in/out 등장 양쪽 모두에서 0건인 선수
  //   - 등장 정보를 한 번에 모음 (성능 — pbps 1회 순회)
  //   - 후속 단계 (starter 결정 / F2 분배) 에서 dnpSet.has(pid) 인 선수는 시간 받지 않음
  // 등장 = "PBP 액션 한 건이라도 자기 ttpId 로 기록" + "sub_in 또는 sub_out 으로 명시 등장"
  const everSeen = new Set<bigint>(); // 등장한 모든 ttpId (ANY 액션 또는 sub in/out)
  for (const p of pbps) {
    // 1) action_type 이 substitution 이 아니면 자기 ttpId 등장 카운트
    if (p.tournament_team_player_id != null && p.action_type !== "substitution") {
      everSeen.add(BigInt(p.tournament_team_player_id));
    }
    // 2) substitution 의 경우 in/out 양쪽 ttpId 추출 (action_subtype 파싱)
    if (p.action_type === "substitution") {
      const parsed = parseSubAction(p.action_subtype);
      if (parsed) {
        everSeen.add(parsed.inId);
        everSeen.add(parsed.outId);
      }
    }
  }
  // dnpSet 은 "PBP/sub 어디에도 등장 안 한 선수" — 우리는 등장한 선수만 알 수 있으므로
  // dnp 판정은 starter / F2 단계에서 "everSeen 미포함이면 DNP" 로 검사 (별도 set 안 만듦, 더 단순).
  // 단, 외부 (호출부) 에 노출할 dnpSet 은 "등장한 적 있는데 PBP 액션 0건 + sub 0건" 케이스가 아니라
  // "어떤 PBP 에도 안 잡힌 선수" 인데, 이건 함수 내부에서 알 수 없음 (선수 마스터 미보유).
  // → 외부 노출 dnpSet 은 "이 함수가 sub 시간을 0 으로 결정한 선수" (= 결과 perPlayer 에 없거나 0) 로 정의.
  // 결과적으로 호출부 G1 가드는 "subSec === 0 또는 미보유 = sub 무효" 와 동치 (이미 그렇게 동작).

  // 쿼터별 / 선수별 누적 (F2 보정용) — G3 (2026-05-02) 신뢰도 채널 분리
  // 한 쿼터 내 한 선수의 시간을 trusted / medium / distributed 3채널로 누적.
  // F2 deficit 가중분배 시 distributed 만 채워서 cap 시 우선 축소 가능.
  type Channel = "trusted" | "medium" | "distributed";
  const quarterPlayerSec = new Map<number, Map<bigint, PlayerTimeBreakdown>>();
  const ensureBreakdown = (q: number, pid: bigint): PlayerTimeBreakdown => {
    if (!quarterPlayerSec.has(q)) quarterPlayerSec.set(q, new Map());
    const m = quarterPlayerSec.get(q)!;
    let b = m.get(pid);
    if (!b) {
      b = { trustedSec: 0, mediumSec: 0, distributedSec: 0 };
      m.set(pid, b);
    }
    return b;
  };
  const addQSec = (q: number, pid: bigint, sec: number, channel: Channel) => {
    const b = ensureBreakdown(q, pid);
    if (channel === "trusted") b.trustedSec += sec;
    else if (channel === "medium") b.mediumSec += sec;
    else b.distributedSec += sec;
  };

  // 쿼터 키 수집 + 정렬
  const allQuarters = new Set<number>();
  for (const p of pbps) {
    if (p.quarter != null && p.quarter >= 1) allQuarters.add(p.quarter);
  }
  const sortedQuarters = [...allQuarters].sort((a, b) => a - b);

  // 팀 키 수집
  const teamIds = new Set<bigint>();
  for (const p of pbps) {
    if (p.tournament_team_id) teamIds.add(BigInt(p.tournament_team_id));
  }

  // 팀별 직전 쿼터 종료 lineup (F3 핵심 — starter 정확도 강화)
  // teamId → Set<ttpId> (Q[N-1] 끝 시점 코트 5명)
  const prevQuarterEndLineup = new Map<bigint, Set<bigint>>();

  // 팀별 / 쿼터별 PBP 그룹핑 (시간순 정렬: clock 큰 → 작은)
  type PbpRow = (typeof pbps)[number];
  const byTeamQ = new Map<string, PbpRow[]>();
  for (const p of pbps) {
    if (p.quarter == null || p.tournament_team_id == null) continue;
    const key = `${p.tournament_team_id}|${p.quarter}`;
    if (!byTeamQ.has(key)) byTeamQ.set(key, []);
    byTeamQ.get(key)!.push(p);
  }
  for (const arr of byTeamQ.values()) {
    arr.sort((a, b) => (b.game_clock_seconds ?? 0) - (a.game_clock_seconds ?? 0));
  }

  // 팀 단위 처리
  for (const teamId of teamIds) {
    for (const q of sortedQuarters) {
      const qPbps = byTeamQ.get(`${teamId}|${q}`) ?? [];
      if (qPbps.length === 0) continue;

      // 1) 쿼터 내 등장한 모든 선수 (자기 액션 + sub in/out)
      const playersInQuarter = new Set<bigint>();
      for (const p of qPbps) {
        if (p.tournament_team_player_id) {
          playersInQuarter.add(BigInt(p.tournament_team_player_id));
        }
      }

      // 2) substitution 이벤트 파싱
      type SubEvent = { clock: number; inId: bigint; outId: bigint };
      const subs: SubEvent[] = [];
      for (const p of qPbps) {
        if (p.action_type !== "substitution") continue;
        const parsed = parseSubAction(p.action_subtype);
        if (!parsed) continue;
        subs.push({
          clock: p.game_clock_seconds ?? 0,
          inId: parsed.inId,
          outId: parsed.outId,
        });
        // sub IN/OUT 으로 등장한 선수도 playersInQuarter 에 추가
        playersInQuarter.add(parsed.inId);
        playersInQuarter.add(parsed.outId);
      }

      // 3) starter 추정 (F3 강화 + G1 DNP 가드)
      // - Q1 (또는 직전 쿼터 lineup 정보 없음): 기존 방식 (등장 + sub_in 미경험)
      // - Q2~ : 직전 쿼터 종료 시 코트에 있던 선수 (5명) 우선 사용
      // - G1: 어떤 starter 도 DNP (everSeen 미포함) 면 제외 — 매치 전체 PBP 0건 선수가
      //       prevLineup chain 으로 잘못 전파되는 경우 차단.
      const subInIds = new Set(subs.map((s) => s.inId.toString()));
      const subOutIds = new Set(subs.map((s) => s.outId.toString()));
      const prevLineup = prevQuarterEndLineup.get(teamId);
      let starters: Set<bigint>;
      if (prevLineup && prevLineup.size > 0) {
        // F3: 직전 쿼터 종료 lineup 을 그대로 starter 로 사용
        // (현재 쿼터 PBP 미등장 선수도 포함 → 시간 미누락)
        starters = new Set(prevLineup);
        // playersInQuarter 에도 starter 추가 (자기 PBP 없어도 출전 시간은 계산되어야 함)
        for (const pid of starters) playersInQuarter.add(pid);
      } else {
        // Q1 또는 직전 lineup 미보유 → 기존 추정 (등장 + sub_in 미경험)
        starters = new Set(
          [...playersInQuarter].filter((id) => !subInIds.has(id.toString())),
        );
      }
      // G1: DNP 선수 (매치 전체 PBP 0건 + sub 0건) 는 starter 에서 제외
      // — 시간 누적 자체를 막아 F2 분배 대상에서도 자동 배제됨.
      for (const pid of [...starters]) {
        if (!everSeen.has(pid)) starters.delete(pid);
      }
      // playersInQuarter 도 동일하게 정화 (DNP 가 잘못 들어왔다면 제거)
      for (const pid of [...playersInQuarter]) {
        if (!everSeen.has(pid)) playersInQuarter.delete(pid);
      }

      // 4) 각 선수의 segment 합산 + 쿼터 종료 시 코트 잔존 추적
      // G3: segment 단위 신뢰도 분류
      //   - "starter→sub_out" segment : 시작이 qLen 추정 → MEDIUM (단, 시작점만 추정. sub_out clock 은 명시.)
      //   - "sub_in→sub_out" segment  : 양 끝 명시 → HIGH (가장 신뢰)
      //   - "sub_in→쿼터끝(0초)" segment : 끝 0초 가정 → MEDIUM
      //   - "starter→쿼터끝(0초)" segment : 양 끝 모두 가정값 (qLen, 0) BUT 한 쿼터 풀출전 = 정확히 qLen → HIGH
      //     ※ 풀타임 (Q1~Q4 모두 이 패턴) 선수의 trustedSec = 4×qLen 보장 → cap 에서 절대 축소 금지.
      const endLineup = new Set<bigint>(); // 쿼터 종료 시 코트 잔존 = 다음 쿼터 starter
      for (const playerId of playersInQuarter) {
        // starter 면 quarterLengthSec 부터 시작 (segment 시작이 추정값)
        // segmentStartIsTrusted = 시작점이 명시 sub_in 인지 여부
        let activeStart: number | null = starters.has(playerId) ? quarterLengthSec : null;
        let segmentStartIsTrusted = false; // starter 시작은 추정 (false), sub_in 시작은 명시 (true)

        for (const sub of subs) {
          if (sub.outId === playerId && activeStart != null) {
            const sec = activeStart - sub.clock;
            if (sec > 0) {
              // 끝점 = sub_out clock = 명시값. 신뢰도는 시작점에 의존.
              const channel: Channel = segmentStartIsTrusted ? "trusted" : "medium";
              addQSec(q, playerId, sec, channel);
            }
            activeStart = null;
            segmentStartIsTrusted = false;
          }
          if (sub.inId === playerId) {
            // 새 segment 시작 = 명시 sub_in clock
            activeStart = sub.clock;
            segmentStartIsTrusted = true;
          }
        }

        // 쿼터 종료 (0초) 까지 잔존 → 누적. 끝 0초는 가정값.
        if (activeStart != null) {
          const sec = activeStart - 0;
          if (sec > 0) {
            // 풀타임 보호 룰: starter 가 sub 0건으로 한 쿼터 내내 출전 (qLen→0) = 정확히 qLen
            // → 양끝 가정값이지만 qLen 자체가 농구 룰상 정확 → trusted 로 분류.
            // 그 외 (sub_in 후 쿼터 끝까지) = sub_in 명시 + 끝 0초 가정 → medium.
            const isFullQuarter = starters.has(playerId) && segmentStartIsTrusted === false && sec >= quarterLengthSec - 1;
            const channel: Channel = isFullQuarter ? "trusted" : (segmentStartIsTrusted ? "medium" : "medium");
            // 주: "sub_in 후 쿼터끝" 도 medium (시작 명시 + 끝 가정), starter 풀타임만 trusted.
            // 단순화: starter 의 첫 segment 가 sub 없이 끝까지 = trusted, 그 외 = medium
            addQSec(q, playerId, sec, channel);
          }
          endLineup.add(playerId); // 다음 쿼터 starter 후보
        }
      }

      // F3: 다음 쿼터 starter 로 전달
      // (단 endLineup 사이즈가 비현실적이면 — 0명 또는 6명+ — 전달 skip = 다음 쿼터 fallback)
      if (endLineup.size >= 3 && endLineup.size <= 7) {
        prevQuarterEndLineup.set(teamId, endLineup);
      } else {
        prevQuarterEndLineup.delete(teamId);
      }

      // F2: 쿼터별 팀 합 미달 보정 (이 팀 / 이 쿼터)
      // expected = 5명 × qLen. deficit > 0 && < qLen 일 때만 분배.
      // G1 가드: DNP 선수는 분배 대상 제외 (PBP 0건 + sub 0건 = 매치 출전 안 했음)
      // G3 (2026-05-02): 분배는 distributed 채널에만 — cap 시 우선 축소 가능.
      const teamQMap = quarterPlayerSec.get(q);
      if (teamQMap) {
        // 이 팀의 이 쿼터 출전 선수만 합산 (DNP 제외 — everSeen 검증)
        const teamPlayers = [...playersInQuarter].filter(
          (pid) => teamQMap.has(pid) && everSeen.has(pid),
        );
        // 3채널 sum 으로 teamQTotal 계산
        const teamQTotal = teamPlayers.reduce((s, pid) => s + totalOf(teamQMap.get(pid)), 0);
        const expected = 5 * quarterLengthSec;
        const deficit = expected - teamQTotal;
        // 가드: 0 < deficit < qLen (비합리값 제외) + 출전 선수 1명 이상
        if (deficit > 0 && deficit < quarterLengthSec && teamPlayers.length > 0) {
          // 출전 시간 비율로 분배 (팀 출전 합이 0 이면 균등 분배) — distributed 채널
          if (teamQTotal > 0) {
            for (const pid of teamPlayers) {
              const cur = totalOf(teamQMap.get(pid));
              const weight = cur / teamQTotal;
              addQSec(q, pid, Math.round(deficit * weight), "distributed");
            }
          } else {
            const each = Math.round(deficit / teamPlayers.length);
            for (const pid of teamPlayers) addQSec(q, pid, each, "distributed");
          }
        }
      }
    }
  }

  // 최종 합산 — 모든 쿼터의 player breakdown 을 채널별로 누적 → 결과 Map
  const result = new Map<bigint, PlayerTimeBreakdown>();
  for (const perPlayer of quarterPlayerSec.values()) {
    for (const [pid, b] of perPlayer.entries()) {
      let agg = result.get(pid);
      if (!agg) {
        agg = { trustedSec: 0, mediumSec: 0, distributedSec: 0 };
        result.set(pid, agg);
      }
      agg.trustedSec += b.trustedSec;
      agg.mediumSec += b.mediumSec;
      agg.distributedSec += b.distributedSec;
    }
  }
  // G1: dnpSet 외부 노출 — getSecondsPlayed / 진행중 분기에서 sub 무효 처리에 사용.
  // 정의: PBP 액션도 sub 등장도 0건 인 선수 = "이 매치에 출전 0초".
  // 단, 이 함수는 선수 마스터를 모르므로 "이 함수가 본 모든 선수" (PBP 에서 등장한 ttpId 모음) 를
  // dnpSet 으로 직접 만들 수 없음. 대신 호출부가 "subSec === 0 또는 미보유" 로 판단 가능.
  // 명시적으로 노출: everSeen 미포함 ttpId — 호출부가 자기 ttpId 를 검사할 때 사용.
  const dnpSet = new Set<bigint>(); // 빈 set — 호출부는 result.get(ttpId) === 0/undefined 로 검사
  // 명시적 dnpSet 보강: pbps 에서 잠깐 등장은 했지만 (예: free_throw 등) 결과 result 값이 0 인 케이스
  // (현재 알고리즘 특성상 발생 가능성 낮음. 호출부는 result 값으로 판단)
  return { perPlayer: result, dnpSet };
}

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
