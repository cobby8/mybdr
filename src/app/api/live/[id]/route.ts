import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";
import { getDisplayName } from "@/lib/utils/player-display-name";
// 2026-05-03: PBP-only 출전시간 산출 엔진 (단일 source) — quarterStatsJson/minutesPlayed/MAX 전략 폐기
import { calculateMinutes, applyCompletedCap, type MinutesPbp } from "@/lib/live/minutes-engine";
// 2026-05-09: 라이브 명단 영역 임시 jersey 우선 적용 (W1 모달 등록 #) — 기존 후처리(line 647~) 통합 + 모든 사용처 일관.
//   우선순위: match_player_jersey (이 매치 임시 #) → ttp.jerseyNumber (대회 등록 #) → null
//   사용 이유: line 291/299/311/538 직접 ttp.jerseyNumber 매핑 시점에는 임시 # 미반영 → 정영민 #9 누락 사례.
//   helper 1회 SELECT 로 모든 분기(진행중/종료/MVP/PBP 타임라인)에 일괄 적용.
import { resolveMatchJerseysBatch } from "@/lib/jersey/resolve";
// 2026-05-11 Phase B: PBP 합산 fallback 헬퍼 — match.homeScore=0 + playerStats.pts=0 케이스 (매치 #132) 안전망
import { computeScoreFromPbp } from "@/lib/tournaments/score-from-pbp";
// 2026-05-13 FIBA Phase 21: 종이 매치(`settings.recording_mode = "paper"`) 박스스코어 슈팅 6 컬럼 (FG/FG%/3P/3P%/FT/FT%) 클라이언트 hide 게이팅.
// 종이 기록 = miss/시도 미박제 → 시도=성공=100% → 가짜 정확도 시각 노이즈 차단. 응답에 recording_mode 노출 (snake_case 변환됨).
import { getRecordingMode } from "@/lib/tournaments/recording-mode";

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
            // 2026-05-10 fix: team.id 추가 — TeamLink href 의 Team.id (/teams/[id] 404 회피).
            team: { select: { id: true, name: true, primaryColor: true, logoUrl: true } },
            players: {
              // 2026-05-10 PlayerLink 마이그 — 응답에 user_id 포함을 위해 users.id select 추가.
              include: { users: { select: { id: true, name: true, nickname: true } } },
            },
          },
        },
        awayTeam: {
          include: {
            // 2026-05-10 fix: team.id 추가 — TeamLink href 의 Team.id (/teams/[id] 404 회피).
            team: { select: { id: true, name: true, primaryColor: true, logoUrl: true } },
            players: {
              include: { users: { select: { id: true, name: true, nickname: true } } },
            },
          },
        },
        // 경기장명 fallback용으로 tournament.venue_name 같이 가져옴
        tournament: { select: { name: true, venue_name: true } },
        playerStats: {
          include: {
            tournamentTeamPlayer: {
              include: { users: { select: { id: true, name: true, nickname: true } } },
            },
          },
          orderBy: { points: "desc" },
        },
      },
    });

    if (!match) {
      return apiError("Match not found", 404);
    }

    // 2026-05-09: 라이브 매치 카드 패널 PR1 — 같은 날 (KST) + 같은 대회 매치 list.
    // 사용자 결정 Q1=A (API 응답 확장) / Q2=A (KST 같은 날) / Q3=A (시간순 ASC) / Q4=A (가변 N건).
    //
    // KST 윈도우 산출 이유:
    //   현재 매치의 scheduledAt (UTC) 을 KST (+9h) 기준 자정~다음날 자정으로 변환 → UTC 윈도우로 환산.
    //   예: scheduledAt = 2026-05-09T01:00:00Z (KST 10:00) → KST 자정 = 2026-05-09T00:00 KST
    //       → UTC = 2026-05-08T15:00:00Z ~ 2026-05-09T15:00:00Z
    //
    // 폴링 부하 최소화: select 절에 카드 렌더링 필수 필드만 (homeTeam/awayTeam name/logoUrl + score + status).
    //   index_tournament_matches_on_scheduled_at 인덱스 hit (성능 영향 미미).
    //
    // 빈 윈도우 가드: scheduledAt 이 NULL 매치는 same_day_matches=[] 로 처리 (사용자 결정 Q4=A 가변).
    let sameDayMatchesPayload: Array<{
      id: number;
      scheduled_at: string | null;
      status: string | null;
      current_quarter: number | null;
      match_code: string | null;
      round_name: string | null;
      home_score: number | null;
      away_score: number | null;
      home_team: { id: number; name: string; logo_url: string | null };
      away_team: { id: number; name: string; logo_url: string | null };
      is_current: boolean;
      is_live: boolean;
      is_completed: boolean;
    }> = [];

    if (match.scheduledAt && match.tournamentId) {
      // KST (+9h) 기준 자정 윈도우 산출 — UTC 비교용
      const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
      const matchAtUtc = match.scheduledAt.getTime();
      const matchAtKst = matchAtUtc + KST_OFFSET_MS;
      // KST 자정 (00:00) 으로 floor → UTC 환산
      const kstDayMs = 24 * 60 * 60 * 1000;
      const kstMidnightMs = Math.floor(matchAtKst / kstDayMs) * kstDayMs;
      const dayStart = new Date(kstMidnightMs - KST_OFFSET_MS);
      const dayEnd = new Date(kstMidnightMs - KST_OFFSET_MS + kstDayMs);

      // 같은 대회 + 같은 날 (KST) 매치 SELECT — select min (카드 렌더 필수 필드만)
      const sameDayMatches = await prisma.tournamentMatch.findMany({
        where: {
          tournamentId: match.tournamentId,
          scheduledAt: { gte: dayStart, lt: dayEnd },
        },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          match_code: true,
          roundName: true,
          homeScore: true,
          awayScore: true,
          started_at: true,
          ended_at: true,
          homeTeam: {
            select: {
              id: true,
              team: { select: { id: true, name: true, logoUrl: true } },
            },
          },
          awayTeam: {
            select: {
              id: true,
              team: { select: { id: true, name: true, logoUrl: true } },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      });

      // 라이브(진행중) 매치들의 current_quarter 일괄 도출 — PBP 최신 quarter group by
      // 부하 가드: 같은 날 라이브 매치는 보통 1~3건. PBP groupBy 1회로 일괄 처리.
      const liveMatchIds = sameDayMatches
        .filter((m) => m.started_at !== null && m.ended_at === null)
        .map((m) => m.id);

      const quarterMap = new Map<bigint, number>();
      if (liveMatchIds.length > 0) {
        const quarterRows = await prisma.play_by_plays.groupBy({
          by: ["tournament_match_id"],
          where: { tournament_match_id: { in: liveMatchIds } },
          _max: { quarter: true },
        });
        for (const row of quarterRows) {
          if (row.tournament_match_id !== null && row._max.quarter !== null) {
            quarterMap.set(row.tournament_match_id, row._max.quarter);
          }
        }
      }

      sameDayMatchesPayload = sameDayMatches.map((m) => {
        const isLive = m.started_at !== null && m.ended_at === null;
        const isCompleted = m.ended_at !== null;
        return {
          id: Number(m.id),
          scheduled_at: m.scheduledAt?.toISOString() ?? null,
          status: m.status ?? null,
          // 라이브 매치만 current_quarter 노출. 종료/예정 매치는 null.
          current_quarter: isLive ? quarterMap.get(m.id) ?? null : null,
          match_code: m.match_code ?? null,
          round_name: m.roundName ?? null,
          home_score: m.homeScore ?? null,
          away_score: m.awayScore ?? null,
          home_team: {
            id: Number(m.homeTeam?.team?.id ?? 0),
            // 5/9 사용자 fix: TBD 매치 (8강 등 대진 미정) 시 "홈" → "미정" placeholder.
            // 정확한 "X조 N위" 매핑은 대회 bracket 룰이 schema 에 명시 안 됨 (별도 PR — settings JSON 박제 또는 룰 추론).
            name: m.homeTeam?.team?.name ?? "미정",
            logo_url: m.homeTeam?.team?.logoUrl ?? null,
          },
          away_team: {
            id: Number(m.awayTeam?.team?.id ?? 0),
            name: m.awayTeam?.team?.name ?? "미정",
            logo_url: m.awayTeam?.team?.logoUrl ?? null,
          },
          is_current: m.id === match.id,
          is_live: isLive,
          is_completed: isCompleted,
        };
      });
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

    // 2026-05-09: 매치 1건의 모든 ttp 에 대한 임시 jersey 일괄 SELECT (PR5 헬퍼).
    //   왜 이 시점인가:
    //     - 진행중 분기 (line 287~) 의 allPlayers map 생성 + 종료 분기 (line 530~) 의 toPlayerRow 모두에서 사용.
    //     - playerNameById (PBP 타임라인) / mvpPlayer 도 같은 매핑 사용 → 분기 직전 미리 만들어두면 1회 SELECT.
    //   ttp.id 는 양 팀 합쳐 일반적으로 20건 미만 → IN 조건 단일 쿼리 + 매치당 1회 = 성능 영향 미미.
    const allTtpEntries = [
      ...(match.homeTeam?.players ?? []).map((p) => ({
        ttpId: p.id,                  // BigInt
        ttpJersey: p.jerseyNumber,    // 대회 등록 #
        teamJersey: null as number | null, // team_members.jersey_number 는 본 라우트 미조회 (생략 — fallback ttpJersey 만)
      })),
      ...(match.awayTeam?.players ?? []).map((p) => ({
        ttpId: p.id,
        ttpJersey: p.jerseyNumber,
        teamJersey: null as number | null,
      })),
    ];
    // jerseyMap: ttp.id (BigInt) → 최종 결정 # (override → ttpJersey → null).
    // 사용처: row.jerseyNumber 매핑 / playerNameById / mvpPlayer.
    const jerseyMap = await resolveMatchJerseysBatch(BigInt(matchId), allTtpEntries);
    // helper: ttp.id (number) → 최종 # (number | null). 호출처에서 BigInt 변환 부담 제거.
    const getJersey = (ttpId: number | bigint, fallback: number | null = null): number | null => {
      const key = typeof ttpId === "bigint" ? ttpId : BigInt(ttpId);
      const v = jerseyMap.get(key);
      return v ?? fallback;
    };

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
    // 2026-05-03 Tier 2: DB starter 주입 (MatchPlayerStat.isStarter 활용).
    //   왜: PBP 만으로 Q1 starter 추정 시 92~93% 정확. Flutter 가 매치 시작 시 양팀 5명씩
    //        is_starter=true 로 sync 하므로 이 데이터를 직접 주입하면 Q1 100% 정확.
    //   매핑: ttp_id → tournamentTeamId (palyerStats include 의 tournamentTeamPlayer 통해)
    //   formatting: Map<teamId, Set<ttp_id>> — minutes-engine 이 union 후 사용.
    const dbStartersByTeam = new Map<bigint, Set<bigint>>();
    for (const s of match.playerStats) {
      if (s.isStarter !== true) continue;
      const teamId = s.tournamentTeamPlayer?.tournamentTeamId;
      if (teamId == null) continue;
      let set = dbStartersByTeam.get(teamId);
      if (!set) {
        set = new Set();
        dbStartersByTeam.set(teamId, set);
      }
      set.add(s.tournamentTeamPlayerId);
    }
    const { bySec: pbpMinutesBySec, byQuarterSec: pbpMinutesByQ } = calculateMinutes({
      pbps: minutesEngineInput,
      qLen: minutesQL,
      numQuarters: minutesQs,
      // 비어있을 때(0개) 는 undefined 와 동일 효과 (engine 내부 size===0 가드 처리)
      dbStartersByTeam: dbStartersByTeam.size > 0 ? dbStartersByTeam : undefined,
    });

    // 2026-05-03 옵션 C: 종료 매치만 풀타임 보호 cap 적용.
    //   - sub 누락/지연으로 한 팀 합이 만점(qLen×numQ×5) 미달 케이스 정확화 (#132 home 137:40 → 140:00 등)
    //   - 라이브 매치 cap X (진행 중 출전시간은 PBP 그대로)
    //   - 풀타임 선수 sec 절대 변경 X. 풀타임 외 선수만 비례 분배
    //   - byQuarterSec(쿼터별)은 cap 미적용 — 시각화/디버깅용 PBP 원본 유지
    if (match.status === "completed") {
      const expectedTeamSec = minutesQL * minutesQs * 5; // 한 팀 코트시간 합
      // home/away 별 sec map 분리 (cap 은 팀 단위로 적용해야 정확)
      const homeMap = new Map<bigint, number>();
      const awayMap = new Map<bigint, number>();
      for (const ttp of match.homeTeam?.players ?? []) {
        if (pbpMinutesBySec.has(ttp.id)) homeMap.set(ttp.id, pbpMinutesBySec.get(ttp.id)!);
      }
      for (const ttp of match.awayTeam?.players ?? []) {
        if (pbpMinutesBySec.has(ttp.id)) awayMap.set(ttp.id, pbpMinutesBySec.get(ttp.id)!);
      }
      applyCompletedCap(homeMap, expectedTeamSec, minutesQL, minutesQs);
      applyCompletedCap(awayMap, expectedTeamSec, minutesQL, minutesQs);
      // cap 결과를 pbpMinutesBySec 에 반영 (헬퍼 getPbpSec 가 이 Map 을 참조)
      for (const [id, sec] of homeMap) pbpMinutesBySec.set(id, sec);
      for (const [id, sec] of awayMap) pbpMinutesBySec.set(id, sec);
    }

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
      // 2026-05-09: jerseyNumber = jerseyMap (임시 # 우선) ?? ttp.jerseyNumber (대회 등록 #).
      const allPlayers = [
        ...(match.homeTeam?.players ?? []).filter(filterRoster).map((p) => ({
          id: Number(p.id),
          jerseyNumber: getJersey(p.id, p.jerseyNumber),
          // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
          name: getDisplayName(p.users, { player_name: p.player_name, jerseyNumber: p.jerseyNumber }, `#${p.jerseyNumber ?? "-"}`),
          teamId: Number(p.tournamentTeamId),
          // 2026-05-10 PlayerLink 마이그 — User.id 노출 (placeholder user 시 null).
          userId: p.users?.id ? Number(p.users.id) : null,
          isStarter: p.isStarter ?? false,
        })),
        ...(match.awayTeam?.players ?? []).filter(filterRoster).map((p) => ({
          id: Number(p.id),
          jerseyNumber: getJersey(p.id, p.jerseyNumber),
          // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
          name: getDisplayName(p.users, { player_name: p.player_name, jerseyNumber: p.jerseyNumber }, `#${p.jerseyNumber ?? "-"}`),
          teamId: Number(p.tournamentTeamId),
          userId: p.users?.id ? Number(p.users.id) : null,
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
          user_id: p.userId,
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
          // 2026-05-09: jerseyMap (임시 # 우선) ?? ttp.jerseyNumber. player.id 는 ttp.id 와 동일.
          jerseyNumber: getJersey(player.id, player.jerseyNumber),
          // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
          name: getDisplayName(user, { player_name: player.player_name, jerseyNumber: player.jerseyNumber }, `#${player.jerseyNumber ?? "-"}`),
          teamId: Number(player.tournamentTeamId),
          // 2026-05-10 PlayerLink 마이그 — User.id 노출 (placeholder user 시 null → span fallback)
          user_id: user?.id ? Number(user.id) : null,
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

    // 2026-05-09: 기존 line 647~698 의 사후 jerseyNumber 후처리는 jerseyMap (line ~100) 으로 통합 완료.
    //   - 진행중 분기 allPlayers map / 종료 분기 toPlayerRow / playerNameById (PBP 타임라인) 모두 jerseyMap 사용.
    //   - mvpPlayer 는 PlayerRow 의 jerseyNumber 를 그대로 읽어 자동 정합 (별도 매핑 불필요).
    //   - SELECT 1회 (resolveMatchJerseysBatch) 로 통일 — 기존 후처리의 중복 SELECT 제거 + 일관성 ↑.

    // 2026-04-17: quarter_scores 는 play_by_plays 기반으로 "항상" 재계산 (DB match.quarterScores 무시)
    // 이유: match 99~104 에서 DB quarterScores 와 실제 score 불일치 발생. PBP 가 진실 원천.
    // 이미 상단에서 조회한 allPbps 를 재사용하므로 추가 쿼리 없음.
    //
    // 2026-05-13 FIBA Phase 22 — paper 매치는 예외:
    //   배경: score-sheet BFF(`/api/web/score-sheet/[matchId]/submit`)가 quarter_scores 를 정확히
    //         박제하지만, paper-fix PBP 의 `game_clock_seconds = 0` 특성 때문에 아래 STL 보정
    //         (L862~) 의 "쿼터 마지막 이벤트 = 가장 작은 clock" 판정이 "첫 이벤트"로 잘못 동작 →
    //         home_score_at_time 누적값이 쿼터 첫 마킹 시점값으로 박혀 delta 계산 왜곡.
    //         결과: 매치 218 의 OT 점수 3/2 가 LIVE 응답에서 0/0 으로 변환 (Q3 도 합산 흡수).
    //   해결: paper 매치는 score-sheet BFF 박제 결과 (DB.quarterScores) 가 단일 진실 source —
    //         PBP 재계산 결과를 DB 값으로 override + STL 보정 블록 skip.
    const recordingMode = getRecordingMode({ settings: match.settings });
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

    // FIBA Phase 22 — paper 매치 override.
    //   score-sheet BFF 가 정확 박제한 DB.quarterScores 가 단일 source. PBP 합산 결과를 덮어씀.
    //   match.quarterScores 가 null/비정상일 경우 PBP 합산 결과 그대로 (안전 fallback).
    if (recordingMode === "paper" && match.quarterScores) {
      const dbQs = match.quarterScores as unknown as QS;
      quarterScores.home.q1 = dbQs.home?.q1 ?? 0;
      quarterScores.home.q2 = dbQs.home?.q2 ?? 0;
      quarterScores.home.q3 = dbQs.home?.q3 ?? 0;
      quarterScores.home.q4 = dbQs.home?.q4 ?? 0;
      quarterScores.home.ot.length = 0;
      quarterScores.home.ot.push(...(dbQs.home?.ot ?? []));
      quarterScores.away.q1 = dbQs.away?.q1 ?? 0;
      quarterScores.away.q2 = dbQs.away?.q2 ?? 0;
      quarterScores.away.q3 = dbQs.away?.q3 ?? 0;
      quarterScores.away.q4 = dbQs.away?.q4 ?? 0;
      quarterScores.away.ot.length = 0;
      quarterScores.away.ot.push(...(dbQs.away?.ot ?? []));
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
    //
    // FIBA Phase 22 (2026-05-13) — paper 매치는 보정 skip.
    //   위 paper override 가 이미 DB.quarterScores 신뢰값 박제 → STL 보정 재진입 시 OT 0 변환
    //   버그 재발 (paper-fix PBP 의 clock=0 특성). score-sheet BFF 가 진실 source.
    if (recordingMode !== "paper") {
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
      // 2026-05-10 PlayerLink 마이그 — MVP 카드의 선수명 → 공개프로필(`/users/[id]`).
      // null = placeholder ttp (드물지만 fallback 유지).
      user_id: number | null;
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
    // 2026-05-03: MVP 승팀 한정 (사용자 요청). 승팀에서만 추출.
    // - 승부 미결정 (동점/미입력/라이브) 시 양 팀 합산 fallback
    const _hs = match.homeScore ?? 0;
    const _as = match.awayScore ?? 0;
    const winnerTeamIdForMvp =
      _hs > _as
        ? Number(match.homeTeamId ?? 0)
        : _as > _hs
          ? Number(match.awayTeamId ?? 0)
          : null;
    const mvpSourcePlayers =
      winnerTeamIdForMvp && match.status === "completed"
        ? [...homePlayers, ...awayPlayers].filter(
            (p) => p.teamId === winnerTeamIdForMvp,
          )
        : [...homePlayers, ...awayPlayers];

    const allMvpCandidates: MvpPlayer[] = [];
    for (const p of mvpSourcePlayers) {
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
        // 2026-05-10 PlayerLink 마이그 — PlayerRow 의 user_id 그대로 전파.
        user_id: p.user_id ?? null,
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
      // 2026-05-09: PBP 타임라인 jersey_number 도 임시 # 우선 적용 (라이브 명단과 일관).
      playerNameById.set(Number(p.id), { name, jersey_number: getJersey(p.id, p.jerseyNumber) });
    }
    for (const p of match.awayTeam?.players ?? []) {
      // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
      const name = getDisplayName(p.users, { player_name: p.player_name, jerseyNumber: p.jerseyNumber }, `#${p.jerseyNumber ?? "-"}`);
      // 2026-05-09: PBP 타임라인 jersey_number 도 임시 # 우선 적용 (라이브 명단과 일관).
      playerNameById.set(Number(p.id), { name, jersey_number: getJersey(p.id, p.jerseyNumber) });
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

    // 합계 점수: 3단 fallback (2026-05-11 Phase B)
    // 우선순위: DB homeScore(>0) > playerStats.pts 합산(>0) > PBP made shot 합산
    // 이유: 종료된 경기에서 homeScore/awayScore sync 누락 (e.g. match #132, #102)
    //       + playerStats 도 0인 케이스 (PBP 만 박제 — Flutter app 이 /sync 한번도 호출 안 함)
    //       → PBP 가 source-of-truth → 마지막 fallback 으로 PBP 합산 보강
    // PBP 합산 로직은 위 L820~835 quarterScores 계산과 동일 (computeScoreFromPbp 헬퍼로 단일 source 박제)
    const homePlayerPts = homePlayers.reduce((sum, p) => sum + p.pts, 0);
    const awayPlayerPts = awayPlayers.reduce((sum, p) => sum + p.pts, 0);
    // PBP 합산 — match.homeTeamId / awayTeamId null 안전 (0 fallback 시 어떤 team_id 와도 매칭 안 됨 → 0 반환)
    // BigInt 리터럴 (Nn) 대신 0 number 사용 — CLAUDE.md 글로벌 룰 (헬퍼가 BigInt|number 혼용 지원)
    const pbpScore = computeScoreFromPbp(
      allPbps,
      match.homeTeamId ?? 0,
      match.awayTeamId ?? 0,
    );
    const finalHomeScore = (match.homeScore && match.homeScore > 0)
      ? match.homeScore
      : (homePlayerPts > 0 ? homePlayerPts : pbpScore.home);
    const finalAwayScore = (match.awayScore && match.awayScore > 0)
      ? match.awayScore
      : (awayPlayerPts > 0 ? awayPlayerPts : pbpScore.away);

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
        // 2026-05-05 PR4: 라이브 페이지 운영자 모달 (W1 임시 번호) 가 사용 — admin-check + jersey-override API 호출용.
        // tournament.id 는 String @db.Uuid (TournamentMatch.tournamentId 와 동일).
        tournamentId: match.tournamentId,
        status: match.status ?? "scheduled",
        homeScore: finalHomeScore,
        awayScore: finalAwayScore,
        roundName: match.roundName,
        // Phase 5 (매치 코드 v4) — 글로벌 매치 식별 코드
        // 형식: `{YY}-{지역2자}-{대회이니셜+회차4자}-{매치번호3자}` 예: `26-GG-MD21-001`
        // null 가능 (short_code/region_code 미부여 대회). 클라이언트 NULL 안전 분기 의무.
        // apiSuccess camelCase → snake_case 변환으로 클라이언트는 match_code 로 수신
        matchCode: match.match_code,
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
        // 2026-05-13 FIBA Phase 21: 매치 기록 모드 ("paper" | "flutter") — 클라이언트 박스스코어 슈팅 컬럼 hide 분기용.
        // getRecordingMode = "paper" 만 명시적 match, 그 외 (settings null / 누락 / 기타) 모두 "flutter" fallback.
        // apiSuccess camelCase → snake_case 변환으로 클라이언트는 recording_mode 로 수신.
        recordingMode: getRecordingMode(match),
        // 2026-05-16 (긴급 박제 — 전후반 모드 / 사용자 보고 이미지 #160) — period_format 응답 박제.
        //
        // 왜 (이유):
        //   halves 모드 매치 (강남구 i3 등) 라이브 페이지에서 쿼터 라벨 "전반/후반/OT1+" 분기.
        //   score-sheet BFF 가 match.settings.period_format JSON 키에 박제 → 본 응답 transfer.
        //
        // shape:
        //   - "halves" = 전후반 모드 (라벨 "전반/후반/OT1+")
        //   - "quarters" = 4쿼터 모드 (라벨 "Q1/Q2/Q3/Q4/OT1+" / 기본 / 호환성)
        //   - 미박제 (구버전 매치) = "quarters" 기본 폴백 — settings.period_format 키 자체 미존재 시.
        //
        // 운영 동작 보존:
        //   - 4쿼터 매치 (기본) = "quarters" 응답 → 라이브 페이지 기존 라벨 그대로.
        //   - halves 매치만 = "halves" 응답 → 라이브 페이지 라벨 분기 트리거.
        //
        // apiSuccess snake_case 변환: 응답 키 = period_format (이미 snake_case — 그대로 통과).
        periodFormat:
          ((match.settings as Record<string, unknown> | null)?.period_format as
            | "halves"
            | "quarters"
            | undefined) ?? "quarters",
        // 2026-05-03: 시간 데이터 소실 매치 안내 배너 트리거 (settings.timeDataMissing 플래그)
        // 운영자 sync 누락 매치 (#141 블랙라벨 vs MSA 등) — 박제 stat 만 입력 + 출전시간 0 표시
        timeDataMissing: ((match.settings as Record<string, unknown> | null)?.timeDataMissing as boolean | undefined) ?? false,
        // 2026-05-04: 알기자 Phase 1 요약 (라이브 페이지 [Lead] 섹션) — DB 영구 저장 (매치 종료 시 자동 생성)
        // 형식: { brief: string, generated_at: string, mode: "phase1-section" } | null
        // null 이면 클라이언트가 Phase 0 템플릿 fallback (silent fail / 미생성 / 진행 중 매치)
        summaryBrief: match.summary_brief,
        // 2026-05-09 PR3: 라이브 YouTube 영상 임베딩 — 매치 1건 = 영상 1건 (1:1 옵션 A).
        // null 이면 라이브 페이지에서 임베드 영역 hidden (Q11 결재). apiSuccess camelCase → snake_case 변환.
        youtubeVideoId: match.youtube_video_id,
        youtubeStatus: match.youtube_status,
        youtubeVerifiedAt: match.youtube_verified_at?.toISOString() ?? null,
        // 2026-05-09 PR1: 같은 대회 + 같은 날 (KST) 매치 list — 라이브 페이지 매치 카드 패널 (네이버 패턴).
        // 이미 snake_case 로 작성 → apiSuccess 자동 변환에서 그대로 통과 (errors.md 2026-04-17 룰).
        // 빈 list 가능 (현재 매치 scheduledAt NULL / 데이터 부족 등) — 클라가 빈 list 시 Rail 자체 hidden.
        same_day_matches: sameDayMatchesPayload,
        homeTeam: {
          // home_team.id = TournamentTeam.id (슬롯 ID, PBP/MVP/timeline 의 tournament_team_id 매칭용 — 기존 의미 보존).
          id: Number(match.homeTeam?.id ?? 0),
          // 2026-05-10 fix: team_id = Team.id (실제 팀 ID, /teams/[id] 라우트용). TeamLink 가 이것 사용해야 404 회피.
          //   `home_team.id` 와 의미가 다르므로 별도 필드. 기존 PBP 매칭 코드 회귀 0.
          team_id: Number(match.homeTeam?.team?.id ?? 0),
          name: match.homeTeam?.team?.name ?? "홈",
          color: match.homeTeam?.team?.primaryColor ?? "#F97316",
          // 팀 로고 URL — 없으면 null (프런트에서 팀색 원 + 이니셜로 fallback)
          logoUrl: match.homeTeam?.team?.logoUrl ?? null,
        },
        awayTeam: {
          id: Number(match.awayTeam?.id ?? 0),
          team_id: Number(match.awayTeam?.team?.id ?? 0),
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
  // 2026-05-10 PlayerLink 마이그 — 공개프로필(`/users/[id]`) 링크 대상 User.id.
  // null = ttp.userId 미부여 (placeholder user / player_name 만 존재) → PlayerLink 가 span fallback.
  user_id: number | null;
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
