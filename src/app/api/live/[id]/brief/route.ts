// 2026-05-02: Phase 1 — BDR NEWS 알기자 매치 단신 기사 endpoint
// GET /api/live/[id]/brief
// 이유: tab-summary.tsx 의 Phase 0 템플릿을 LLM 응답으로 대체.
// 진행 중 매치(live)는 LLM 호출 X — 종료(completed) 매치만 응답.
// 캐시 = match-brief-generator 의 메모리 Map (Vercel instance 별).
//
// 응답 형식:
//   200 ok=true                  : { brief, generated_at, matchId }
//   200 ok=false reason=*        : { reason } — 클라가 fallback 으로 처리
//     - "match_not_found"        : 404 대신 200 + reason (클라 fallback 단일화)
//     - "not_completed"          : 진행 중 매치 → fallback
//     - "missing_api_key"        : GEMINI_API_KEY 미설정 → fallback
//     - "validation_failed: *"   : LLM 검증 실패 → fallback
//     - "llm_error: *"           : 네트워크/안전필터 → fallback
//
// 안전 가드:
//   - completed 매치만 LLM 호출
//   - rate-limit (live route 와 동일 정책 — 라이브 페이지 다중 탭 고려)
//   - 메모리 캐시 (매치당 1회 호출)
//
// Phase 2 도입 예정:
//   - DB community_posts 의 'news' 카테고리에 영구 저장 (process 재시작 후에도 보존)
//   - 사용자 선별 후 발행 (Phase 6 few-shot 자동→사용자 선별)

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";
import { getDisplayName } from "@/lib/utils/player-display-name";
import {
  generateMatchBrief,
  type MatchBriefInput,
} from "@/lib/news/match-brief-generator";

// 한글 받침 검사 → 조사 선택 (tab-summary 의 josa 와 동일 로직)
// 사용처: flow 분류 외, brief generator 입력엔 직접 사용 안 함 — 여기서는 미사용.
// (LLM 자체가 조사 처리 — system prompt 에 명시)

// 8 flow 분류 — tab-summary.tsx classifyFlow 와 동일 (간소화 버전)
// LLM 톤 hint 용 — 정확한 우선순위는 tab-summary 의 분류 결과를 받아야 정합.
// 여기서는 server-side 단독 분류 (request body 받지 않음, GET).
type FlowType = MatchBriefInput["flow"];

function classifyFlow(args: {
  hasOT: boolean;
  scoreDiff: number;
  leadChanges: number;
  maxLead: number;
  maxLeadLeaderIsLoser: boolean;
  lastMinuteLeadChange: boolean;
}): FlowType {
  if (args.hasOT) return "overtime";
  if (args.lastMinuteLeadChange && args.scoreDiff <= 4) return "lastminute";
  if (args.maxLeadLeaderIsLoser && args.maxLead >= 8) return "comeback";
  if (args.leadChanges >= 5 && args.scoreDiff <= 6) return "seesaw";
  if (args.scoreDiff >= 20) return "blowout";
  if (args.scoreDiff >= 10) return "dominant";
  if (args.scoreDiff >= 5) return "narrow";
  return "default";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Rate limit — 라이브 detail 동일 정책 적용 (LLM 호출은 캐시 hit 률이 높아 부하 낮음)
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`brief:${ip}`, RATE_LIMITS.liveDetail);
  if (!rl.allowed) {
    return apiError("Too many requests", 429);
  }

  const matchId = Number(id);
  if (isNaN(matchId)) {
    return apiError("Invalid match ID", 400);
  }

  try {
    // 매치 + 팀 + 선수 통계 + PBP 한 번에 fetch
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: BigInt(matchId) },
      include: {
        homeTeam: {
          include: { team: { select: { name: true } } },
        },
        awayTeam: {
          include: { team: { select: { name: true } } },
        },
        tournament: { select: { venue_name: true, name: true } },
        playerStats: {
          include: {
            tournamentTeamPlayer: {
              include: { users: { select: { name: true, nickname: true } } },
            },
          },
        },
      },
    });

    if (!match) {
      // 클라 fallback 단일화 — 404 대신 200 + ok=false
      return apiSuccess({ ok: false, reason: "match_not_found" });
    }

    // 진행 중 매치 → LLM 호출 X (운영 영향 0 가드)
    // status: scheduled | live | completed | cancelled 등
    if (match.status !== "completed") {
      return apiSuccess({ ok: false, reason: "not_completed" });
    }

    // 점수 (null 가드)
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    // 팀명 — TournamentTeam.team.name (BDR 정식 팀명) 우선
    const homeTeamName = match.homeTeam?.team?.name ?? "홈";
    const awayTeamName = match.awayTeam?.team?.name ?? "어웨이";

    // MVP 산출 — playerStats 중 game_score 1위 (없으면 pts 1위)
    // 2026-05-03: 승팀 한정 (사용자 요청). 종료 매치만 적용 (라이브는 양 팀 합산)
    let mvpData: MatchBriefInput["mvp"] = null;
    if (match.playerStats.length > 0) {
      const _hs = match.homeScore ?? 0;
      const _as = match.awayScore ?? 0;
      const winnerTtTeamId =
        match.status === "completed"
          ? _hs > _as
            ? match.homeTeamId
            : _as > _hs
              ? match.awayTeamId
              : null
          : null;
      const sourceStats = winnerTtTeamId
        ? match.playerStats.filter(
            (p) =>
              p.tournamentTeamPlayer?.tournamentTeamId === winnerTtTeamId,
          )
        : match.playerStats;
      const ranked = [...sourceStats]
        .filter((p) => (p.points ?? 0) + (p.total_rebounds ?? 0) + (p.assists ?? 0) > 0)
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
      const top = ranked[0];
      if (top && top.tournamentTeamPlayer) {
        const u = top.tournamentTeamPlayer.users;
        const name = u
          ? getDisplayName(u, top.tournamentTeamPlayer)
          : (top.tournamentTeamPlayer.player_name ?? "선수");
        mvpData = {
          name,
          pts: top.points ?? 0,
          // schema: total_rebounds (snake_case 직접 노출)
          reb: top.total_rebounds ?? 0,
          ast: top.assists ?? 0,
        };
      }
    }

    // 양 팀 최다득점자
    let homeTopScorer: MatchBriefInput["homeTopScorer"] = null;
    let awayTopScorer: MatchBriefInput["awayTopScorer"] = null;
    for (const ps of match.playerStats) {
      const ttp = ps.tournamentTeamPlayer;
      if (!ttp) continue;
      // schema: tournamentTeamId (camelCase, @map("tournament_team_id"))
      const teamId = ttp.tournamentTeamId;
      const u = ttp.users;
      const name = u ? getDisplayName(u, ttp) : (ttp.player_name ?? "선수");
      const pts = ps.points ?? 0;
      if (teamId === match.homeTeamId) {
        if (!homeTopScorer || pts > homeTopScorer.pts) {
          homeTopScorer = { name, pts };
        }
      } else if (teamId === match.awayTeamId) {
        if (!awayTopScorer || pts > awayTopScorer.pts) {
          awayTopScorer = { name, pts };
        }
      }
    }

    // 쿼터별 점수 — quarterStatsJson 또는 quarter_scores_json 필드 (스키마 확인 필요)
    // tab-summary 의 quarter_scores 와 동일 형식이 이상적이지만, 여기서는 PBP 합산으로 계산.
    // 단순화: matchPlayerStat 의 quarterStatsJson 합산 (있을 때만).
    // 정확한 쿼터 점수 없으면 빈 배열 → LLM 에 hint X (점수차 + flow 만으로 충분).
    const quarterScores: { home: number[]; away: number[] } = { home: [], away: [] };
    // schema: quarterScores (camelCase, @map("quarter_scores")) — Json 타입
    // 형식: { home: { q1, q2, q3, q4, ot[] }, away: { q1, q2, q3, q4, ot[] } }
    const qsJson = match.quarterScores;
    if (qsJson && typeof qsJson === "object" && !Array.isArray(qsJson)) {
      const qs = qsJson as {
        home?: { q1?: number; q2?: number; q3?: number; q4?: number; ot?: number[] };
        away?: { q1?: number; q2?: number; q3?: number; q4?: number; ot?: number[] };
      };
      if (qs.home && qs.away) {
        // q1~q4 + ot 배열 순서로 추가
        const homeQ = [qs.home.q1 ?? 0, qs.home.q2 ?? 0, qs.home.q3 ?? 0, qs.home.q4 ?? 0];
        const awayQ = [qs.away.q1 ?? 0, qs.away.q2 ?? 0, qs.away.q3 ?? 0, qs.away.q4 ?? 0];
        for (const v of qs.home.ot ?? []) homeQ.push(v ?? 0);
        for (const v of qs.away.ot ?? []) awayQ.push(v ?? 0);
        // 0-0 쿼터만 있는 경우 (PBP 가 없을 때) 빈 배열 유지
        const allZero = [...homeQ, ...awayQ].every((v) => v === 0);
        if (!allZero) {
          quarterScores.home.push(...homeQ);
          quarterScores.away.push(...awayQ);
        }
      }
    }

    // PBP 시계열 분석 (간이) — leadChanges / maxLead / hasOT
    // 정확도는 tab-summary 와 약간 다를 수 있음 (LLM 톤 hint 용 — 큰 영향 X)
    const allPbps = await prisma.play_by_plays.findMany({
      where: { tournament_match_id: BigInt(matchId) },
      select: {
        quarter: true,
        game_clock_seconds: true,
        tournament_team_id: true,
        is_made: true,
        points_scored: true,
        home_score_at_time: true,
        away_score_at_time: true,
      },
      orderBy: [{ quarter: "asc" }, { game_clock_seconds: "desc" }],
    });

    // 쿼터별 점수 PBP 로 보충 (quarter_scores_json 비어있을 때)
    if (quarterScores.home.length === 0 && allPbps.length > 0) {
      const qMap: Record<number, { home: number; away: number }> = {};
      for (const p of allPbps) {
        const q = p.quarter ?? 1;
        if (!qMap[q]) qMap[q] = { home: 0, away: 0 };
        if (p.is_made && p.points_scored && p.points_scored > 0) {
          if (p.tournament_team_id === match.homeTeamId)
            qMap[q].home += p.points_scored;
          else if (p.tournament_team_id === match.awayTeamId)
            qMap[q].away += p.points_scored;
        }
      }
      const sortedQ = Object.keys(qMap)
        .map((k) => Number(k))
        .sort((a, b) => a - b);
      for (const q of sortedQ) {
        quarterScores.home.push(qMap[q].home);
        quarterScores.away.push(qMap[q].away);
      }
    }

    // OT 존재 — 5쿼터 이상이면 OT
    const hasOT = quarterScores.home.length > 4;

    // leadChanges + maxLead — 누적 점수 시계열 (PBP)
    let leadChanges = 0;
    let maxLead = 0;
    let maxLeadLeaderIsLoser = false;
    let lastMinuteLeadChange = false;
    if (allPbps.length > 0) {
      let h = 0;
      let a = 0;
      let lastSign: 1 | -1 | 0 = 0;
      const winnerIsHome = homeScore > awayScore;
      const loserId = winnerIsHome ? match.awayTeamId : match.homeTeamId;
      const maxQ = Math.max(...allPbps.map((p) => p.quarter ?? 1));
      let maxLeaderId: bigint | null = null;
      let inLastMinute = false;
      let signBeforeLastMin: 1 | -1 | 0 = 0;
      for (const p of allPbps) {
        if (p.is_made && p.points_scored && p.points_scored > 0) {
          if (p.tournament_team_id === match.homeTeamId) h += p.points_scored;
          else if (p.tournament_team_id === match.awayTeamId) a += p.points_scored;
        }
        const diff = h - a;
        const sign: 1 | -1 | 0 = diff > 0 ? 1 : diff < 0 ? -1 : 0;
        // leadChange 카운트
        if (sign !== 0 && lastSign !== 0 && sign !== lastSign) leadChanges += 1;
        if (sign !== 0) lastSign = sign;
        // maxLead
        if (Math.abs(diff) > maxLead) {
          maxLead = Math.abs(diff);
          maxLeaderId = diff > 0 ? match.homeTeamId : match.awayTeamId;
        }
        // 마지막 60s 리드 변경
        const isLastMinute =
          (p.quarter ?? 1) === maxQ && (p.game_clock_seconds ?? 0) <= 60;
        if (isLastMinute && !inLastMinute) {
          signBeforeLastMin = sign;
          inLastMinute = true;
        }
        if (
          isLastMinute &&
          sign !== 0 &&
          signBeforeLastMin !== 0 &&
          sign !== signBeforeLastMin
        ) {
          lastMinuteLeadChange = true;
        }
      }
      maxLeadLeaderIsLoser = maxLeaderId === loserId;
    }

    const scoreDiff = Math.abs(homeScore - awayScore);
    const flow = classifyFlow({
      hasOT,
      scoreDiff,
      leadChanges,
      maxLead,
      maxLeadLeaderIsLoser,
      lastMinuteLeadChange,
    });

    // round_name 추출 — schema: roundName (camelCase, @map("round_name"))
    const roundName = match.roundName ?? null;
    // 2026-05-03: tournament.name 추가 (점프볼 패턴 정형 리드용)
    const tournamentName = match.tournament?.name ?? null;
    // group_name 추출 — settings.group_name 또는 동등 필드 (없을 가능성 높음)
    // 2026-05-03: groupName 활성화 — schema: group_name (snake)
    const groupName: string | null = match.group_name ?? null;

    // scheduledAt 포맷 — ISO → 한국시간 단순 표기
    let scheduledAtStr: string | null = null;
    if (match.scheduledAt) {
      const d = new Date(match.scheduledAt);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dn = dayNames[d.getDay()];
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      scheduledAtStr = `${m}월 ${day}일 (${dn}) ${hh}:${mm}`;
    }

    // 장소 — match.venue_name 우선, fallback tournament.venue_name
    const venueName = match.venue_name ?? match.tournament?.venue_name ?? null;

    // 2026-05-03: 풍부한 데이터 풀 — 양 팀 통계 합산 + 모든 선수 + 특별 기록
    type PStat = NonNullable<MatchBriefInput["allPlayers"]>[number];
    const allPlayers: PStat[] = [];
    for (const ps of match.playerStats) {
      const ttp = ps.tournamentTeamPlayer;
      if (!ttp) continue;
      const u = ttp.users;
      const name = u ? getDisplayName(u, ttp) : (ttp.player_name ?? "선수");
      const teamSide: "home" | "away" =
        ttp.tournamentTeamId === match.homeTeamId ? "home" : "away";
      const pts = ps.points ?? 0;
      const reb = ps.total_rebounds ?? 0;
      const ast = ps.assists ?? 0;
      const stl = ps.steals ?? 0;
      const blk = ps.blocks ?? 0;
      const to = ps.turnovers ?? 0;
      const minutes = ps.minutesPlayed ?? 0;
      // 출전시간 0 + 점수 0 + 모든 stat 0 = DNP → 제외
      if (pts === 0 && reb === 0 && ast === 0 && stl === 0 && blk === 0 && minutes === 0) continue;
      allPlayers.push({
        team: teamSide,
        name,
        pts,
        reb,
        ast,
        stl,
        blk,
        to,
        fgMade: ps.fieldGoalsMade ?? 0,
        fgAtt: ps.fieldGoalsAttempted ?? 0,
        threesMade: ps.threePointersMade ?? 0,
        threesAtt: ps.threePointersAttempted ?? 0,
        ftMade: ps.freeThrowsMade ?? 0,
        ftAtt: ps.freeThrowsAttempted ?? 0,
        plusMinus: ps.plusMinus ?? 0,
        minutes,
      });
    }

    // 팀 통계 합산
    function sumTeam(team: "home" | "away"): MatchBriefInput["homeTeamStat"] {
      const players = allPlayers.filter((p) => p.team === team);
      if (players.length === 0) return null;
      const sum = players.reduce(
        (acc, p) => {
          acc.pts += p.pts;
          acc.fgMade += p.fgMade;
          acc.fgAtt += p.fgAtt;
          acc.threesMade += p.threesMade;
          acc.threesAtt += p.threesAtt;
          acc.ftMade += p.ftMade;
          acc.ftAtt += p.ftAtt;
          acc.totalReb += p.reb;
          acc.ast += p.ast;
          acc.stl += p.stl;
          acc.blk += p.blk;
          acc.to += p.to;
          return acc;
        },
        {
          pts: 0,
          fgMade: 0,
          fgAtt: 0,
          threesMade: 0,
          threesAtt: 0,
          ftMade: 0,
          ftAtt: 0,
          totalReb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          to: 0,
        },
      );
      // off/def reb 직접 합산 (allPlayers엔 없음)
      const homeIdLocal = match!.homeTeamId;
      const psList = match!.playerStats.filter((ps) => {
        const ttp = ps.tournamentTeamPlayer;
        if (!ttp) return false;
        const side = ttp.tournamentTeamId === homeIdLocal ? "home" : "away";
        return side === team;
      });
      const offReb = psList.reduce((s, p) => s + (p.offensive_rebounds ?? 0), 0);
      const defReb = psList.reduce((s, p) => s + (p.defensive_rebounds ?? 0), 0);
      const pf = psList.reduce((s, p) => s + (p.personal_fouls ?? 0), 0);
      return {
        ...sum,
        offReb,
        defReb,
        pf,
        fgPct: sum.fgAtt > 0 ? (sum.fgMade / sum.fgAtt) * 100 : 0,
        threesPct: sum.threesAtt > 0 ? (sum.threesMade / sum.threesAtt) * 100 : 0,
        ftPct: sum.ftAtt > 0 ? (sum.ftMade / sum.ftAtt) * 100 : 0,
      };
    }
    const homeTeamStat = sumTeam("home");
    const awayTeamStat = sumTeam("away");

    // 특별 기록 검출
    const dDouble: PStat[] = allPlayers.filter((p) => {
      const cats = [p.pts, p.reb, p.ast, p.stl, p.blk].filter((v) => v >= 10).length;
      return cats >= 2 && cats < 3;
    });
    const tDouble: PStat[] = allPlayers.filter((p) => {
      const cats = [p.pts, p.reb, p.ast, p.stl, p.blk].filter((v) => v >= 10).length;
      return cats >= 3;
    });
    const topRebounder = [...allPlayers].sort((a, b) => b.reb - a.reb)[0];
    const topAssister = [...allPlayers].sort((a, b) => b.ast - a.ast)[0];
    const topStealer = [...allPlayers].sort((a, b) => b.stl - a.stl)[0];
    const topBlocker = [...allPlayers].sort((a, b) => b.blk - a.blk)[0];
    const topPlusMinus = [...allPlayers].sort((a, b) => b.plusMinus - a.plusMinus)[0];
    const bestThreeShooter = [...allPlayers]
      .filter((p) => p.threesMade >= 3)
      .sort((a, b) => b.threesMade - a.threesMade)[0];

    // LLM 입력 구성
    const briefInput: MatchBriefInput = {
      matchId,
      tournamentName,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      homeScore,
      awayScore,
      roundName,
      groupName,
      scheduledAt: scheduledAtStr,
      venueName,
      mvp: mvpData,
      homeTopScorer,
      awayTopScorer,
      flow,
      maxLead,
      leadChanges,
      quarterScores,
      homeTeamStat,
      awayTeamStat,
      allPlayers,
      doubleDoubles: dDouble,
      tripleDoubles: tDouble,
      topRebounder: topRebounder && topRebounder.reb >= 5 ? topRebounder : null,
      topAssister: topAssister && topAssister.ast >= 3 ? topAssister : null,
      topStealer: topStealer && topStealer.stl >= 2 ? topStealer : null,
      topBlocker: topBlocker && topBlocker.blk >= 1 ? topBlocker : null,
      topPlusMinus: topPlusMinus && topPlusMinus.plusMinus >= 5 ? topPlusMinus : null,
      bestThreeShooter: bestThreeShooter ?? null,
    };

    // 2026-05-03: mode query param 추가 — Phase 1 (default) / Phase 2 분기
    // ?mode=phase2-match : 게시판 독립 기사용 (auto-publish-match-brief 가 호출)
    const url = new URL(req.url);
    const modeParam = url.searchParams.get("mode");
    const mode: "phase1-section" | "phase2-match" =
      modeParam === "phase2-match" ? "phase2-match" : "phase1-section";

    // LLM 호출 (캐시 적용)
    const result = await generateMatchBrief(briefInput, mode);
    if (!result.ok) {
      // GEMINI_API_KEY 미설정은 별도 reason 으로 분기 (관측성)
      const reason = result.reason.includes("GEMINI_API_KEY")
        ? "missing_api_key"
        : result.reason.includes("검증 실패")
          ? `validation_failed: ${result.reason.replace("검증 실패: ", "")}`
          : `llm_error: ${result.reason}`;
      return apiSuccess({ ok: false, reason });
    }

    return apiSuccess({
      ok: true,
      brief: result.brief,
      ...(result.title !== undefined && { title: result.title }),
      matchId,
      mode,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    // 예측 안 된 에러 — 클라 fallback 가능하도록 200 + ok=false
    const reason = e instanceof Error ? e.message : "unknown_error";
    console.error("[brief] error:", reason);
    return apiSuccess({ ok: false, reason: `internal_error: ${reason}` });
  }
}
