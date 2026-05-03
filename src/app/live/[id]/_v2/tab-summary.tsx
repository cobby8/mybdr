"use client";

// 2026-04-22: Phase 2 GameResult v2 — 요약 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L210~L249
// 좌: 경기 요약 내러티브 + 통계 4블록 / 우: TOP 퍼포머 4항목
//
// 2026-05-02: Phase 0 단신 기사 형식 도입 (LLM 호출 0, 순수 템플릿)
// 이유: 기존 단조로운 1줄 요약("닥터바스켓이(가) ... B조 2경기 경기.") 을
//       단신 기사 5섹션 (Header / Headline / Lead / Body / Stats) 으로 개선.
// 5섹션 구조:
//   Header   토너먼트명 · 라운드명 · 일시 · 장소 (메타라인)
//   Headline {승팀} {스코어} {패팀} — {N}점차 {flow 분류} (font-display, 굵게)
//   Lead     8 flow 분류별 분기 1~2 문장 (Phase 0 템플릿) → Phase 1 LLM 응답 우선
//   Body     MVP 라인 + 양 팀 최다득점
//   Stats    4 카드: 점수차 / 쿼터 승 / 총 득점 / 리드체인지
// flow 8 분류 (overtime/lastminute/comeback/seesaw/blowout/dominant/narrow/default).
// 한글 조사 처리: josa(name, "이/가"|"을/를"|"은/는") — 받침 검사.
// PBP score_at_time 필드 부재 → points_scored 누적으로 score 시계열 직접 계산.
//
// 2026-05-02: Phase 1 — Gemini 2.5 Flash 단신 기사 통합 (알기자 페르소나)
// /api/live/[id]/brief 에서 LLM 응답 fetch (SWR). 종료 매치만 호출 + 캐시.
// 정책:
//   - 로딩 중: Phase 0 템플릿 노출 (즉시 표시 보장)
//   - LLM 성공: brief 텍스트 + "✍️ 알기자 (BDR NEWS AI)" 시그니처
//   - LLM 실패 (검증/네트워크/키 미설정): Phase 0 템플릿 영구 fallback
// completed 매치만 LLM 호출 — 진행 중 매치는 fetch 자체 skip.

import { useEffect, useState } from "react";
import type { MatchDataV2, MvpPlayerV2, PlayerRowV2, PlayByPlayRowV2 } from "./game-result";

// LLM brief 응답 타입 — /api/live/[id]/brief 응답 (snake_case 자동 변환 후)
type BriefResponse =
  | { ok: true; brief: string; matchId: number; generated_at: string }
  | { ok: false; reason: string };

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼 함수 (module-level)
// ─────────────────────────────────────────────────────────────────────────────

// 한글 받침 검사 → 조사 선택. name 마지막 글자가 한글이 아니면 첫 형태 (받침 없음 가정)
function josa(name: string, pair: "이/가" | "을/를" | "은/는"): string {
  if (!name) return "";
  const last = name.charCodeAt(name.length - 1);
  // 한글 음절 범위: 0xAC00 ~ 0xD7A3
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  if (!isHangul) {
    // 한글 외 (숫자/영문 등) → 받침 없는 쪽으로 통일 (가독성 우선)
    const [, noJong] = pair.split("/");
    return noJong;
  }
  // 받침 유무: (음절 - 0xAC00) % 28 !== 0 → 받침 있음
  const hasJong = (last - 0xac00) % 28 !== 0;
  const [withJong, noJong] = pair.split("/");
  return hasJong ? withJong : noJong;
}

// 누적 점수 시계열 — PBP 의 points_scored 를 home/away 별로 순차 누적
// 반환: [{home, away}, ...] (PBP 길이 + 1, [0]은 0-0 시작점)
function buildScoreSeries(
  pbps: PlayByPlayRowV2[],
  homeTeamId: number,
): Array<{ home: number; away: number }> {
  const series: Array<{ home: number; away: number }> = [{ home: 0, away: 0 }];
  let h = 0;
  let a = 0;
  for (const e of pbps) {
    if (e.points_scored > 0 && e.is_made) {
      if (e.team_id === homeTeamId) h += e.points_scored;
      else a += e.points_scored;
    }
    series.push({ home: h, away: a });
  }
  return series;
}

// 리드 변경 횟수 — series 의 부호 변화를 카운트 (0 동점은 무시)
function countLeadChanges(series: Array<{ home: number; away: number }>): number {
  let changes = 0;
  let lastSign: 1 | -1 | 0 = 0; // home 우세=+1, away 우세=-1
  for (const s of series) {
    const diff = s.home - s.away;
    const sign: 1 | -1 | 0 = diff > 0 ? 1 : diff < 0 ? -1 : 0;
    if (sign === 0) continue; // 동점은 sign 변경 트리거 X
    if (lastSign !== 0 && sign !== lastSign) changes += 1;
    lastSign = sign;
  }
  return changes;
}

// 최대 점수차 + 그 시점의 leader (홈/원정)
function findMaxLead(
  series: Array<{ home: number; away: number }>,
  homeName: string,
  awayName: string,
): { diff: number; leader: string } {
  let maxDiff = 0;
  let leader = "";
  for (const s of series) {
    const d = s.home - s.away;
    if (Math.abs(d) > maxDiff) {
      maxDiff = Math.abs(d);
      leader = d > 0 ? homeName : awayName;
    }
  }
  return { diff: maxDiff, leader };
}

// 8 Flow 분류 (우선순위 순) — Lead 문장 분기에 사용
type FlowType =
  | "overtime"
  | "lastminute"
  | "comeback"
  | "seesaw"
  | "blowout"
  | "dominant"
  | "narrow"
  | "default";

function classifyFlow(args: {
  hasOT: boolean;
  scoreDiff: number;
  leadChanges: number;
  maxLead: number;
  maxLeadLeaderIsLoser: boolean; // 한때 패팀이 최대리드 → comeback 가능성
  lastMinuteLeadChange: boolean;
}): FlowType {
  // 우선순위 1: 연장
  if (args.hasOT) return "overtime";
  // 우선순위 2: 마지막 60s 리드 변경 + 4점 이내
  if (args.lastMinuteLeadChange && args.scoreDiff <= 4) return "lastminute";
  // 우선순위 3: 한때 8점+ 끌렸다가 역전 (패자가 한때 8점+ 우세)
  if (args.maxLeadLeaderIsLoser && args.maxLead >= 8) return "comeback";
  // 우선순위 4: 리드체인지 5+ + 점수차 6 이내
  if (args.leadChanges >= 5 && args.scoreDiff <= 6) return "seesaw";
  // 우선순위 5~8: 점수차 기준
  if (args.scoreDiff >= 20) return "blowout";
  if (args.scoreDiff >= 10) return "dominant";
  if (args.scoreDiff >= 5) return "narrow";
  return "default";
}

// 마지막 60s (game_clock_seconds <= 60) 안에 4Q/OT 에서 리드 변경이 있었는지
// PBP 가 quarter + game_clock_seconds 정렬되어 있다고 가정 (라이브 API 기본).
function hasLastMinuteLeadChange(
  pbps: PlayByPlayRowV2[],
  homeTeamId: number,
): boolean {
  if (pbps.length === 0) return false;
  // 마지막 쿼터 식별
  let maxQ = 0;
  for (const e of pbps) {
    if (e.quarter > maxQ) maxQ = e.quarter;
  }
  // 마지막 쿼터 + 60s 이내 액션만 추려서 리드 부호 변화 검사
  let h = 0;
  let a = 0;
  // 전체 누적은 진행하되, 마지막 60s 진입 후의 sign 변화만 카운트
  let inLastMinute = false;
  let signBefore: 1 | -1 | 0 = 0;
  for (const e of pbps) {
    if (e.is_made && e.points_scored > 0) {
      if (e.team_id === homeTeamId) h += e.points_scored;
      else a += e.points_scored;
    }
    const isLastMinute = e.quarter === maxQ && e.game_clock_seconds <= 60;
    if (isLastMinute && !inLastMinute) {
      // 마지막 60s 진입 직전의 sign 기록
      const d = h - a;
      signBefore = d > 0 ? 1 : d < 0 ? -1 : 0;
      inLastMinute = true;
    }
    if (isLastMinute) {
      const d = h - a;
      const sign: 1 | -1 | 0 = d > 0 ? 1 : d < 0 ? -1 : 0;
      if (sign !== 0 && signBefore !== 0 && sign !== signBefore) return true;
    }
  }
  return false;
}

// Lead 문장 생성 — flow 별 템플릿. 모두 300자 이내 1~2문장.
function generateLead(args: {
  flow: FlowType;
  winner: string;
  loser: string;
  winnerScore: number;
  loserScore: number;
  scoreDiff: number;
  maxLead: number;
  hasOT: boolean;
}): string {
  const { winner, loser, scoreDiff, maxLead, hasOT } = args;
  const winJ = josa(winner, "이/가"); // 승팀 + 이/가
  switch (args.flow) {
    case "overtime":
      return `연장 혈투 끝에 ${winner}${winJ} ${loser}을(를) 꺾고 ${scoreDiff}점차 신승을 거뒀다.`;
    case "lastminute":
      return `${loser}의 추격을 막판 분전으로 끊어낸 ${winner}${winJ} ${scoreDiff}점차로 승부의 추를 가져왔다.`;
    case "comeback":
      return `한때 ${maxLead}점차로 끌려가던 ${winner}${winJ} 후반 역전에 성공해 ${scoreDiff}점차 승리를 따냈다.`;
    case "seesaw":
      return `리드가 수차례 뒤바뀌는 시소 게임 끝에 ${winner}${winJ} ${scoreDiff}점차 신승을 거뒀다.`;
    case "blowout":
      return `${winner}${winJ} 시종일관 우위를 지키며 ${loser}을(를) ${scoreDiff}점차로 압도했다.`;
    case "dominant":
      return `${winner}${winJ} 경기 흐름을 주도하며 ${loser}을(를) ${scoreDiff}점차로 따돌렸다.`;
    case "narrow":
      return `${winner}${winJ} 끝까지 리드를 지키며 ${scoreDiff}점차 신승을 거뒀다.`;
    case "default":
    default:
      return `${winner}${winJ} 박빙의 승부 끝에 ${scoreDiff}점차 승리를 거뒀다.${hasOT ? " (연장 포함)" : ""}`;
  }
}

// 양 팀 최다득점자 — 각 팀에서 pts 1위 1명씩
function findTopScorerByTeam(players: PlayerRowV2[]): PlayerRowV2 | null {
  let best: PlayerRowV2 | null = null;
  let bestVal = 0;
  for (const p of players) {
    if (p.dnp) continue;
    if (p.pts > bestVal) {
      bestVal = p.pts;
      best = p;
    }
  }
  return best;
}

// 일시 포맷: "5월 2일 (금) 14:00" — 시안 메타라인용
function formatScheduledAt(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dn = dayNames[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}월 ${dd}일 (${dn}) ${hh}:${mm}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 본 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export function TabSummary({ match }: { match: MatchDataV2 }) {
  // 2026-05-02 Phase 1: LLM 단신 기사 fetch (알기자)
  // 정책: completed 매치만 호출. 로딩 중/실패 시 Phase 0 템플릿 fallback.
  // SWR 미사용 — 캐시는 서버 측 메모리 (match-brief-generator.ts) 라 클라 SWR 불필요.
  // useState + useEffect 단순 패턴으로 1회 fetch.
  const [llmBrief, setLlmBrief] = useState<string | null>(null);
  // briefStatus: "idle"=초기 / "loading"=fetch 중 / "ok"=LLM 성공 / "fallback"=Phase 0 사용
  const [briefStatus, setBriefStatus] = useState<"idle" | "loading" | "ok" | "fallback">(
    "idle",
  );

  useEffect(() => {
    // 진행 중 매치 → fetch skip (서버 측에서도 거부)
    if (match.status !== "completed") {
      setBriefStatus("fallback");
      return;
    }
    let cancelled = false;
    setBriefStatus("loading");
    void (async () => {
      try {
        const res = await fetch(`/api/live/${match.id}/brief`, {
          // 라이브 페이지 폴링과 분리 — brief 은 매치당 1회만 fetch
          cache: "no-store",
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json: BriefResponse = await res.json();
        if (cancelled) return;
        if (json.ok) {
          setLlmBrief(json.brief);
          setBriefStatus("ok");
        } else {
          // LLM 검증 실패 / 네트워크 / API 키 미설정 → Phase 0 fallback
          setBriefStatus("fallback");
        }
      } catch {
        // 네트워크 에러 → Phase 0 fallback
        if (!cancelled) setBriefStatus("fallback");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [match.id, match.status]);

  // TOP 퍼포머 계산 — 득점/리바/어시/스틸 각 1위 (우측 카드)
  const allPlayers = [...match.home_players, ...match.away_players].filter((p) => !p.dnp);
  const topScorer = maxByStat(allPlayers, (p) => p.pts);
  const topRebounder = maxByStat(allPlayers, (p) => p.reb);
  const topAssister = maxByStat(allPlayers, (p) => p.ast);
  const topStealer = maxByStat(allPlayers, (p) => p.stl);

  // 팀 판정 헬퍼
  const teamTag = (teamId: number): string => {
    if (teamId === match.home_team.id) return match.home_team.name;
    if (teamId === match.away_team.id) return match.away_team.name;
    return "";
  };

  // 기본 변수 — 점수/승팀/패팀
  const homeTotal = match.home_score;
  const awayTotal = match.away_score;
  const scoreDiff = Math.abs(homeTotal - awayTotal);
  const homeWon = homeTotal > awayTotal;
  const winnerName = homeWon ? match.home_team.name : match.away_team.name;
  const loserName = homeWon ? match.away_team.name : match.home_team.name;
  const winnerScore = Math.max(homeTotal, awayTotal);
  const loserScore = Math.min(homeTotal, awayTotal);

  // 쿼터 승 카운트 (Stats 카드용)
  const qs = match.quarter_scores;
  let homeQuarterWins = 0;
  let awayQuarterWins = 0;
  let totalQuarters = 0;
  if (qs) {
    const quarters = [
      { h: qs.home.q1, a: qs.away.q1 },
      { h: qs.home.q2, a: qs.away.q2 },
      { h: qs.home.q3, a: qs.away.q3 },
      { h: qs.home.q4, a: qs.away.q4 },
      ...qs.home.ot.map((v, i) => ({ h: v, a: qs.away.ot[i] ?? 0 })),
    ];
    totalQuarters = quarters.length;
    for (const q of quarters) {
      if (q.h > q.a) homeQuarterWins += 1;
      else if (q.a > q.h) awayQuarterWins += 1;
    }
  }
  const winnerQuarters = homeWon ? homeQuarterWins : awayQuarterWins;

  // PBP 시계열 분석 — score_at_time 부재 → points_scored 누적으로 직접 계산
  const series = buildScoreSeries(match.play_by_plays, match.home_team.id);
  const leadChanges = countLeadChanges(series);
  const { diff: maxLead, leader: maxLeadLeader } = findMaxLead(
    series,
    match.home_team.name,
    match.away_team.name,
  );
  const maxLeadLeaderIsLoser = maxLeadLeader === loserName;
  const lastMinLeadChange = hasLastMinuteLeadChange(match.play_by_plays, match.home_team.id);
  const hasOT = (qs?.home?.ot?.length ?? 0) > 0;

  // Flow 분류 → Lead 문장 생성
  const flow = classifyFlow({
    hasOT,
    scoreDiff,
    leadChanges,
    maxLead,
    maxLeadLeaderIsLoser,
    lastMinuteLeadChange: lastMinLeadChange,
  });
  const leadSentence = generateLead({
    flow,
    winner: winnerName,
    loser: loserName,
    winnerScore,
    loserScore,
    scoreDiff,
    maxLead,
    hasOT,
  });

  // Headline 부제(flow 한국어 라벨) — 헤드라인 끝에 붙임
  const flowLabel: Record<FlowType, string> = {
    overtime: "연장 혈투",
    lastminute: "막판 역전",
    comeback: "역전승",
    seesaw: "혈투",
    blowout: "압승",
    dominant: "완승",
    narrow: "신승",
    default: "박빙 승부",
  };

  // MVP 정보 (mvp_player null 가드)
  const mvp: MvpPlayerV2 | null = match.mvp_player;
  const mvpTeamName = mvp ? teamTag(mvp.team_id) : "";

  // 양 팀 최다득점자 (Body 라인용)
  const homeTopScorer = findTopScorerByTeam(match.home_players);
  const awayTopScorer = findTopScorerByTeam(match.away_players);

  // Header 메타라인
  const dateLabel = formatScheduledAt(match.scheduled_at ?? match.started_at);
  const headerParts = [
    match.tournament_name,
    match.round_name,
    dateLabel,
    match.venue_name,
  ].filter((v): v is string => Boolean(v && v.length > 0));

  // 2026-05-03: Stats 4 카드 변경 (사용자 요청)
  // - 점수차 → "최대점수차" (한때 가장 벌어진 차이, maxLead)
  // - 쿼터승 (의미 모호) → "스코어링 런" (한 팀이 상대 0점 동안 연속 득점 최대)
  //   예: "MZ Q3 14-0" — MZ 가 Q3 동안 우아 0점 사이 14점 연속 득점

  // 스코어링 런 산출 — PBP 시계열에서 같은 팀 연속 득점 (다른 팀 사이 0점)
  let bestRunTeam = "";
  let bestRunQuarter = 0;
  let bestRunPts = 0;
  let curRunTeamId: number | null = null;
  let curRunPts = 0;
  let curRunQuarter = 0;
  for (const e of match.play_by_plays) {
    if (!e.is_made || !e.points_scored || e.points_scored <= 0) continue;
    if (e.team_id === curRunTeamId) {
      // 같은 팀 연속 득점 누적
      curRunPts += e.points_scored;
    } else {
      // 다른 팀 득점 — 직전 run 평가 후 reset
      if (curRunPts > bestRunPts) {
        bestRunPts = curRunPts;
        bestRunTeam =
          curRunTeamId === match.home_team.id
            ? match.home_team.name
            : curRunTeamId === match.away_team.id
              ? match.away_team.name
              : "";
        bestRunQuarter = curRunQuarter;
      }
      curRunTeamId = e.team_id;
      curRunPts = e.points_scored;
      curRunQuarter = e.quarter;
    }
  }
  // 마지막 run 평가
  if (curRunPts > bestRunPts) {
    bestRunPts = curRunPts;
    bestRunTeam =
      curRunTeamId === match.home_team.id
        ? match.home_team.name
        : curRunTeamId === match.away_team.id
          ? match.away_team.name
          : "";
    bestRunQuarter = curRunQuarter;
  }

  const summaryBlocks = [
    { l: "최대점수차", v: maxLead > 0 ? `${maxLead}점` : `${scoreDiff}점` },
    {
      l: "최다 스코어링 런",
      v:
        bestRunPts > 0 && bestRunTeam
          ? `${bestRunTeam} Q${bestRunQuarter} ${bestRunPts}-0`
          : "—",
    },
    { l: "총 득점", v: `${homeTotal + awayTotal}점` },
    { l: "리드 체인지", v: leadChanges > 0 ? `${leadChanges}회` : "—" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 2fr) 1fr",
        gap: 18,
      }}
      className="gr-summary-grid"
    >
      <div className="card" style={{ padding: "18px 20px", borderRadius: 4 }}>
        {/* 카드 헤더 — "경기 요약" 라벨 */}
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          경기 요약
        </h3>

        {/* [Header] 메타라인 — 토너먼트 · 라운드 · 일시 · 장소 */}
        {headerParts.length > 0 && (
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
              letterSpacing: ".06em",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            {headerParts.join(" · ")}
          </div>
        )}

        {/* [Headline] 한 줄 결과 — 단신 기사 표제 톤 */}
        <h4
          style={{
            margin: "0 0 10px",
            fontFamily: "var(--ff-display)",
            fontSize: 17,
            fontWeight: 800,
            lineHeight: 1.4,
            color: "var(--ink)",
          }}
        >
          {winnerName} {winnerScore}-{loserScore} {loserName}
          <span style={{ color: "var(--ink-dim)", fontWeight: 600 }}>
            {" "}— {scoreDiff}점차 {flowLabel[flow]}
          </span>
        </h4>

        {/* [Lead] flow 별 1~2 문장 분기 */}
        {/* 2026-05-02 Phase 1: LLM 응답 우선 + Phase 0 템플릿 fallback */}
        {/* status="ok" 일 때만 LLM brief 노출. 그 외 (loading/fallback/idle) Phase 0 노출. */}
        {briefStatus === "ok" && llmBrief ? (
          <>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--ink-soft)",
                whiteSpace: "pre-wrap", // LLM 가끔 줄바꿈 포함
              }}
            >
              {llmBrief}
            </p>
            {/* 시그니처 — 알기자 (BDR NEWS AI) */}
            <div
              style={{
                margin: "0 0 12px",
                fontSize: 11,
                color: "var(--ink-dim)",
                fontStyle: "italic",
                letterSpacing: ".02em",
              }}
            >
              ✍️ 알기자 · BDR NEWS AI
            </div>
          </>
        ) : (
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 13,
              lineHeight: 1.7,
              color: "var(--ink-soft)",
            }}
          >
            {leadSentence}
          </p>
        )}

        {/* [Body] MVP + 양 팀 최다득점 */}
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.7,
            color: "var(--ink-soft)",
            paddingLeft: 10,
            borderLeft: "2px solid var(--border)",
            marginBottom: 14,
          }}
        >
          {mvp && (
            <div>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--accent)",
                  fontWeight: 800,
                  letterSpacing: ".08em",
                  marginRight: 6,
                }}
              >
                MVP
              </span>
              <b style={{ color: "var(--ink)" }}>{mvp.name}</b>
              {mvpTeamName && (
                <span style={{ color: "var(--ink-dim)" }}> ({mvpTeamName})</span>
              )}
              {" "}— {mvp.pts}점 {mvp.reb}리바 {mvp.ast}어시
            </div>
          )}
          {(homeTopScorer || awayTopScorer) && (
            <div>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--ink-dim)",
                  fontWeight: 800,
                  letterSpacing: ".08em",
                  marginRight: 6,
                }}
              >
                최다득점
              </span>
              {homeTopScorer && (
                <>
                  {homeTopScorer.name}({homeTopScorer.pts}점)
                </>
              )}
              {homeTopScorer && awayTopScorer && " / "}
              {awayTopScorer && (
                <>
                  {awayTopScorer.name}({awayTopScorer.pts}점)
                </>
              )}
            </div>
          )}
        </div>

        {/* [Stats] 4 카드 — 점수차 / 쿼터 승 / 총 득점 / 리드 체인지 */}
        <div
          className="gr-summary-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}
        >
          {summaryBlocks.map((s) => (
            <div
              key={s.l}
              style={{
                padding: "10px 12px",
                background: "var(--bg-alt)",
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--ink-dim)",
                  fontWeight: 800,
                  letterSpacing: ".1em",
                }}
              >
                {s.l}
              </div>
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: 16,
                  fontWeight: 900,
                  marginTop: 3,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: "18px 20px", borderRadius: 4 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          TOP 퍼포머
        </h3>
        <TopPerformerRow
          label="득점"
          player={topScorer}
          value={topScorer ? `${topScorer.pts}점` : null}
          teamName={topScorer ? teamTag(topScorer.team_id) : ""}
        />
        <TopPerformerRow
          label="리바운드"
          player={topRebounder}
          value={topRebounder ? `${topRebounder.reb}개` : null}
          teamName={topRebounder ? teamTag(topRebounder.team_id) : ""}
        />
        <TopPerformerRow
          label="어시스트"
          player={topAssister}
          value={topAssister ? `${topAssister.ast}개` : null}
          teamName={topAssister ? teamTag(topAssister.team_id) : ""}
        />
        <TopPerformerRow
          label="스틸"
          player={topStealer}
          value={topStealer ? `${topStealer.stl}개` : null}
          teamName={topStealer ? teamTag(topStealer.team_id) : ""}
        />
      </div>

      {/* 모바일: 1열 전환 + Stats 4→2 카드 */}
      <style jsx>{`
        @media (max-width: 720px) {
          .gr-summary-grid {
            grid-template-columns: 1fr !important;
          }
          .gr-summary-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

function TopPerformerRow({
  label,
  player,
  value,
  teamName,
}: {
  label: string;
  player: PlayerRowV2 | null;
  value: string | null;
  teamName: string;
}) {
  if (!player || !value) {
    return (
      <div
        style={{
          padding: "8px 0",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--ink-dim)",
              fontWeight: 700,
              letterSpacing: ".08em",
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>—</div>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            color: "var(--ink-dim)",
            fontWeight: 700,
            letterSpacing: ".08em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {player.name}
          {teamName && (
            <span
              style={{
                fontSize: 10,
                color: "var(--ink-dim)",
                fontFamily: "var(--ff-mono)",
                marginLeft: 4,
                fontWeight: 500,
              }}
            >
              {teamName}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--ff-display)",
          fontWeight: 900,
          fontSize: 16,
          color: "var(--ink)",
          flex: "0 0 auto",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// 최대값 선수 반환 — 0 이하면 null
function maxByStat(players: PlayerRowV2[], fn: (p: PlayerRowV2) => number): PlayerRowV2 | null {
  let best: PlayerRowV2 | null = null;
  let bestVal = 0;
  for (const p of players) {
    const v = fn(p);
    if (v > bestVal) {
      bestVal = v;
      best = p;
    }
  }
  return best;
}
