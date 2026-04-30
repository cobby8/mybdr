"use client";

// 2026-04-22: Phase 2 GameResult v2 — 메인 컨테이너
// 이유: 기존 /live/[id]/page.tsx(1829줄) 를 건드리지 않고 finished/completed 상태일 때만
// 이 컴포넌트로 렌더를 갈아끼운다. 폴링은 부모(page.tsx)가 이미 중단하므로 여기서는 하지 않음.
// 시안: Dev/design/BDR v2/screens/GameResult.jsx
//
// 2026-04-30 P0-3: BDR v2.2 LiveResult 회귀 픽스
// 시안: Dev/design/BDR v2.2/screens/LiveResult.jsx (D등급 P0-3)
// 시안 룰: 색/폰트만 v2 유지 + 레이아웃·기능 옛 디자인 복원
// 추가 사항(시안 L94~L115): 경기원 평가 / 기록 보기 CTA 2단 카드.
// 회귀 검수 매트릭스: FINAL/쿼터/MVP/평가/기록 5건 통과
//   FINAL 스코어보드 → HeroScoreboard
//   쿼터별 점수      → HeroScoreboard 내 grid (G-9 보호 자동)
//   MVP 배너         → MvpBanner
//   경기 평가 진입   → /games/[id]/report
//   기록 보기 진입   → /profile/activity
// 진입: /live/[id] (경기 종료 자동) / 알림 "경기 결과 보기" 클릭
// 복귀: /games/[id] / /games/my-games / /live (다른 경기 보기)

import { useState } from "react";
import Link from "next/link";
import { HeroScoreboard } from "./hero-scoreboard";
import { MvpBanner } from "./mvp-banner";
import { TabSummary } from "./tab-summary";
import { TabTeamStats } from "./tab-team-stats";
import { TabPlayers } from "./tab-players";
import { TabTimeline } from "./tab-timeline";
import { TabShotChart } from "./tab-shot-chart";

// page.tsx 의 MatchData 와 동일한 공용 타입 — 순환 참조 피하려 여기에 최소 정의를 다시 둠
// (리팩토링 금지 원칙상 page.tsx export 를 건드리지 않기 위함)
export interface PlayerRowV2 {
  id: number;
  jersey_number: number | null;
  name: string;
  team_id: number;
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
  dnp?: boolean;
  is_starter?: boolean;
}

export interface PlayByPlayRowV2 {
  id: number;
  quarter: number;
  game_clock_seconds: number;
  team_id: number;
  jersey_number: number | null;
  player_name: string;
  action_type: string;
  action_subtype: string | null;
  is_made: boolean | null;
  points_scored: number;
}

export interface MvpPlayerV2 {
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
}

export interface MatchDataV2 {
  id: number;
  status: string;
  home_score: number;
  away_score: number;
  round_name: string | null;
  tournament_name: string;
  quarter_scores: {
    home: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
    away: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
  } | null;
  home_team: { id: number; name: string; color: string; logo_url: string | null };
  away_team: { id: number; name: string; color: string; logo_url: string | null };
  home_players: PlayerRowV2[];
  away_players: PlayerRowV2[];
  play_by_plays: PlayByPlayRowV2[];
  mvp_player: MvpPlayerV2 | null;
  updated_at: string;
  scheduled_at?: string | null;
  started_at?: string | null;
  venue_name?: string | null;
  current_quarter?: number | null;
  has_quarter_event_detail: boolean;
}

type TabId = "summary" | "team" | "players" | "timeline" | "shotchart";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "요약" },
  { id: "team", label: "팀 비교" },
  { id: "players", label: "개인 기록" },
  { id: "timeline", label: "타임라인" },
  { id: "shotchart", label: "샷차트" },
];

export function GameResultV2({ match }: { match: MatchDataV2 }) {
  // 탭 상태 — 기본 "요약". 시안 GameResult.jsx L4 와 동일.
  const [tab, setTab] = useState<TabId>("summary");

  return (
    // v2 디자인 토큰 사용 (globals.css 의 .page / --ink / --accent 등)
    <div className="page" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      {/* Hero 스코어보드 — 시안 L118~L179 */}
      <HeroScoreboard match={match} />

      {/* MVP 배너 — playerStats 기반. MVP 없으면(=playerStats 0건) 렌더 안 함 */}
      {match.mvp_player && <MvpBanner mvp={match.mvp_player} match={match} />}

      {/* 탭 네비게이션 — 시안 L193~L208 */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--border)",
          marginBottom: 18,
          overflowX: "auto",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              color: tab === t.id ? "var(--accent)" : "var(--ink-soft)",
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭별 컨텐츠 */}
      {tab === "summary" && <TabSummary match={match} />}
      {tab === "team" && <TabTeamStats match={match} />}
      {tab === "players" && <TabPlayers match={match} />}
      {tab === "timeline" && <TabTimeline match={match} />}
      {tab === "shotchart" && <TabShotChart match={match} />}

      {/*
        P0-3 회귀 픽스: 경기 평가 / 기록 보기 진입점 CTA
        시안 출처: Dev/design/BDR v2.2/screens/LiveResult.jsx L94~L115
        이유: 옛 디자인의 핵심 기능(평가 진입점·기록 보기) 복원.
        모바일에서는 globals.css 모바일 분기로 1열 stack 자동 전환.
      */}
      <div
        className="cta-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginTop: 18,
          marginBottom: 24,
        }}
      >
        {/* 경기원 평가 카드 — /games/[id]/report 로 이동 */}
        <Link
          href={`/games/${match.id}/report`}
          className="card"
          style={{
            padding: "20px 22px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            textDecoration: "none",
            color: "inherit",
            borderRadius: 4,
          }}
        >
          {/* 아이콘 박스 — cafe-blue 12% 배경 */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: "color-mix(in oklab, var(--cafe-blue) 12%, transparent)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--cafe-blue)", fontSize: 26 }}
            >
              rate_review
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
              경기원 평가하기
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
              참여한 선수에게 매너·실력 평점을 남겨 주세요
            </div>
          </div>
          {/* 화살표 — 진입 단서 */}
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--ink-mute)", fontSize: 20, flexShrink: 0 }}
          >
            chevron_right
          </span>
        </Link>

        {/* 전체 기록 보기 카드 — /profile/activity 로 이동 (옛 "기록 보기" 액션) */}
        <Link
          href="/profile/activity"
          className="card"
          style={{
            padding: "20px 22px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            textDecoration: "none",
            color: "inherit",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: "color-mix(in oklab, var(--accent) 12%, transparent)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--accent)", fontSize: 26 }}
            >
              insights
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
              내 기록 보기
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
              경기 활동·통계·참여 이력 전체 보기
            </div>
          </div>
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--ink-mute)", fontSize: 20, flexShrink: 0 }}
          >
            chevron_right
          </span>
        </Link>
      </div>
    </div>
  );
}
