"use client";

// 2026-04-22: Phase 2 GameResult v2 — Hero 스코어보드
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L118~L179
// 어두운 그라디언트 카드 + 팀명/큰 스코어(96px)/WINNER 라벨 + 쿼터 스코어 표
// D5 원칙(DB 없는 필드 생략):
//  - 시드 (e.g. "#1 SEED") 생략 — tournament_teams 에 seed 필드 없음
//  - 팀 전적 (e.g. "15W 4L · 1684") 생략 — 경기별 시점 전적 미산출
//  - 관중수 412명 생략 — DB 필드 없음
//  - 하이라이트/공유/기록지 버튼 생략 — 기능 없음

import type { MatchDataV2 } from "./game-result";

// 2026-05-02: PC/모바일 비율 분기 CSS (사용자 요청 — WINNER 제거 + 쿼터 테이블 한번에 + PC 확대)
import "./hero-scoreboard.css";

export function HeroScoreboard({ match }: { match: MatchDataV2 }) {
  const homeScore = match.home_score;
  const awayScore = match.away_score;
  const homeWin = homeScore > awayScore;
  const awayWin = awayScore > homeScore;

  // 쿼터 스코어 배열 구성 — Q1~Q4 + OT (있는 경우만)
  const qs = match.quarter_scores;
  const quarters: { label: string; home: number; away: number }[] = [
    { label: "Q1", home: qs?.home.q1 ?? 0, away: qs?.away.q1 ?? 0 },
    { label: "Q2", home: qs?.home.q2 ?? 0, away: qs?.away.q2 ?? 0 },
    { label: "Q3", home: qs?.home.q3 ?? 0, away: qs?.away.q3 ?? 0 },
    { label: "Q4", home: qs?.home.q4 ?? 0, away: qs?.away.q4 ?? 0 },
    ...(qs?.home.ot ?? []).map((v, i) => ({
      label: `OT${i + 1}`,
      home: v,
      away: qs?.away.ot?.[i] ?? 0,
    })),
  ];

  // 경기 일시 포맷 — "YYYY.MM.DD (요일) HH:MM"
  // scheduled_at 우선, 없으면 started_at, 둘 다 없으면 빈 문자열
  const isoStr = match.scheduled_at ?? match.started_at ?? null;
  const dateLine = isoStr ? formatMatchDate(isoStr) : "";

  // 라운드명이 있으면 tournament_name 뒤에 " · {round}" 형태로 붙임 (시안 L123 참조)
  const tournamentLine = match.round_name
    ? `${match.tournament_name} · ${match.round_name}`
    : match.tournament_name;

  return (
    <div
      className="card"
      style={{
        padding: "32px 24px",
        marginBottom: 18,
        // 어두운 그라디언트 배경 — 시안 L118
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
      }}
    >
      {/* 장식용 radial gradient 오버레이 — 시안 L119 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(220,38,38,.2), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(15,95,204,.2), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div className="hero-sb__inner">

        {/* 상단 배지 — FINAL + 토너먼트/라운드 */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <span
            style={{
              background: "rgba(16,185,129,.2)",
              color: "#10B981",
              border: "1px solid #10B981",
              fontSize: 10,
              padding: "3px 10px",
              borderRadius: 3,
              fontWeight: 700,
              letterSpacing: ".1em",
            }}
          >
            경기종료 · FINAL
          </span>
          {tournamentLine && (
            <span
              style={{
                background: "rgba(255,255,255,.15)",
                color: "#fff",
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: 3,
                fontWeight: 700,
                letterSpacing: ".1em",
              }}
            >
              {tournamentLine}
            </span>
          )}
        </div>

        {/* 날짜/장소 라인 */}
        {(dateLine || match.venue_name) && (
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              opacity: 0.7,
              fontFamily: "var(--ff-mono)",
              marginBottom: 16,
            }}
          >
            {dateLine}
            {dateLine && match.venue_name ? " · " : ""}
            {match.venue_name ?? ""}
          </div>
        )}

        {/* 점수판 5 column — [홈로고][홈팀명+점수][dash][원정팀명+점수][원정로고]
            2026-05-02 v3 사용자 재설계:
              - 로고 inline (좌·우 끝 absolute → 점수판 안)
              - PC dash 폭 확대 (양 팀 점수 떨어뜨림)
              - 모바일 가운데 정렬 + 작게 + 로고 같이 노출 */}
        <div className="hero-sb__row scoreboard">
          {/* 홈팀 로고 */}
          <TeamLogo team={match.home_team} />

          {/* 홈팀 정보 (팀명 + 점수, 가운데 정렬) */}
          <TeamScoreBlock team={match.home_team} score={homeScore} />

          {/* 중앙 dash + FINAL */}
          <div className="hero-sb__center">
            <div className="hero-sb__center-dash">–</div>
            <div className="hero-sb__center-final">FINAL</div>
          </div>

          {/* 원정팀 정보 */}
          <TeamScoreBlock team={match.away_team} score={awayScore} />

          {/* 원정팀 로고 */}
          <TeamLogo team={match.away_team} />
        </div>

        {/* 쿼터 스코어 표 — 2026-05-02 사용자 요청: 가로 스크롤 X, 한 번에 노출 + PC 비율 확대.
            ScrollableTable 제거 + .hero-sb__quarter-grid CSS 분기 (모바일 fit / PC 확대) */}
        <div
          className="hero-sb__quarter-grid"
          style={{ marginTop: 24, ["--qcount" as string]: String(quarters.length) }}
        >
          {/* 첫 행 — 헤더 (빈칸 + Q1~Q4 + TOTAL). 사용자 요청 2026-05-02:
              모든 텍스트 흰색 / winner 레드+볼드 / 폰트 확대 / 시인성 강화 */}
          <div />
          {quarters.map((q) => (
            <div key={`h-${q.label}`} className="hero-sb__quarter-header">
              {q.label}
            </div>
          ))}
          <div className="hero-sb__quarter-total-header">TOTAL</div>

          {/* 홈팀 행 */}
          <div className="hero-sb__quarter-team">{match.home_team.name}</div>
          {quarters.map((q) => (
            <div
              key={`home-${q.label}`}
              className={`hero-sb__quarter-cell${q.home > q.away ? " hero-sb__quarter-cell--win" : ""}`}
            >
              {q.home}
            </div>
          ))}
          <div
            className={`hero-sb__quarter-total${homeWin ? " hero-sb__quarter-total--win" : ""}`}
          >
            {homeScore}
          </div>

          {/* 원정팀 행 */}
          <div className="hero-sb__quarter-team">{match.away_team.name}</div>
          {quarters.map((q) => (
            <div
              key={`away-${q.label}`}
              className={`hero-sb__quarter-cell${q.away > q.home ? " hero-sb__quarter-cell--win" : ""}`}
            >
              {q.away}
            </div>
          ))}
          <div
            className={`hero-sb__quarter-total${awayWin ? " hero-sb__quarter-total--win" : ""}`}
          >
            {awayScore}
          </div>
        </div>
      </div>
    </div>
  );
}

// 팀 로고 (좌·우 끝 inline) — 2026-05-02 v3 사용자 재설계
function TeamLogo({ team }: { team: MatchDataV2["home_team"] }) {
  return (
    <div className="hero-sb__logo" aria-hidden>
      {team.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logo_url} alt="" />
      ) : (
        <span className="hero-sb__logo-fallback">{team.name.charAt(0)}</span>
      )}
    </div>
  );
}

// 팀 정보 (팀명 + 점수, 가운데 정렬)
// 2026-05-02 v3: 양 팀 모두 가운데 정렬 (좌/우 정렬 prop 제거 — 사용자 요청)
function TeamScoreBlock({
  team,
  score,
}: {
  team: MatchDataV2["home_team"];
  score: number;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="hero-sb__team-name">{team.name}</div>
      <div className="hero-sb__score">{score}</div>
    </div>
  );
}

// ISO 문자열 → "YYYY.MM.DD (요일) HH:MM"
// 이유: 시안 L125 과 동일한 포맷. 브라우저 로컬 타임존 기준.
function formatMatchDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  // 요일: 일월화수목금토
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const day = days[d.getDay()];
  return `${yyyy}.${mm}.${dd} (${day}) ${hh}:${mi}`;
}
