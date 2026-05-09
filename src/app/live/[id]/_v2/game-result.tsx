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

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroScoreboard } from "./hero-scoreboard";
import { MvpBanner } from "./mvp-banner";
// 2026-05-09 PR3: 종료 매치 다시보기 임베드 (live 페이지와 동일 컴포넌트 — youtube-nocookie / 16:9)
import { YouTubeEmbed } from "./youtube-embed";
import { TabSummary } from "./tab-summary";
import { TabTeamStats } from "./tab-team-stats";
import { TabPlayers } from "./tab-players";
import { TabTimeline } from "./tab-timeline";
import { TabShotChart } from "./tab-shot-chart";
import { PrintBoxScoreArea } from "./print-box-score";
// 2026-05-02: 옛 page.tsx 의 풀 프린트 다이얼로그 복원
import { PrintOptionsDialog, type PrintOptions } from "./print-options-dialog";

// page.tsx 의 MatchData 와 동일한 공용 타입 — 순환 참조 피하려 여기에 최소 정의를 다시 둠
// (리팩토링 금지 원칙상 page.tsx export 를 건드리지 않기 위함)
//
// 2026-05-02: quarter_stats 필드 추가 — 옛 page.tsx 의 PlayerRow 와 동일 형태.
// 이유: BoxScoreTable / PrintBoxScoreTable 의 쿼터 필터 기능 복원에 필수.
// API (`/api/live/[id]`) 응답엔 이미 포함되어 있어 타입만 추가하면 됨.
// 키: "1"=Q1, "2"=Q2, "3"=Q3, "4"=Q4, "5"=OT1.
export interface PlayerQuarterStat {
  min: number;
  min_seconds: number;
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
  plus_minus: number;
}

export interface PlayerRowV2 {
  id: number;
  jersey_number: number | null;
  name: string;
  team_id: number;
  // 2026-05-10 PlayerLink 마이그 — 박스스코어 선수명 → 공개프로필(`/users/[id]`).
  // null = placeholder user (ttp.userId NULL) → 링크 비활성 (span fallback).
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
  dnp?: boolean;
  is_starter?: boolean;
  // 2026-05-02: 쿼터별 집계 — 옛 BoxScoreTable 의 쿼터 필터에 사용
  quarter_stats?: Record<string, PlayerQuarterStat>;
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
  // 2026-05-10 PlayerLink 마이그 — MVP 카드 선수명 → 공개프로필.
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
}

export interface MatchDataV2 {
  id: number;
  status: string;
  home_score: number;
  away_score: number;
  round_name: string | null;
  tournament_name: string;
  // Phase 5 (매치 코드 v4) — 글로벌 매치 식별 코드
  // 형식: `26-GG-MD21-001` (14자 영숫자) 또는 null (short_code/region_code 미부여 대회)
  // hero-scoreboard 가 NULL 안전 분기로 표시
  match_code?: string | null;
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
  // 2026-05-03: 시간 데이터 소실 매치 안내 배너 트리거 (settings.timeDataMissing)
  // 운영자가 매치 종료 sync 시 PBP 미입력한 매치 박제용 (#141 블랙라벨 vs MSA 등)
  time_data_missing?: boolean;
  // 2026-05-04: 알기자 Phase 1 요약 (라이브 페이지 [Lead] 섹션) — DB 영구 저장 (매치 종료 시 자동 생성)
  // 형식: { brief: string, generated_at: string, mode: "phase1-section" } | null
  // null 이면 Phase 0 템플릿 fallback (silent fail / 미생성 / 진행 중 매치)
  // 2026-05-09: forfeit 매치 메타 추가 (forfeit / forfeit_reason). tab-summary 가 분기.
  summary_brief?: {
    brief: string;
    generated_at: string;
    mode: string;
    forfeit?: boolean;
    forfeit_reason?: string | null;
  } | null;
  // 2026-05-09 PR3: 라이브 YouTube 영상 — 종료 매치 (FINAL) 에서도 다시보기 임베드 노출.
  // null = 영상 미등록 → 임베드 영역 hidden (Q11 결재).
  youtube_video_id?: string | null;
  youtube_status?: "manual" | "auto_verified" | "auto_pending" | null;
  youtube_verified_at?: string | null;
}

type TabId = "summary" | "team" | "players" | "timeline" | "shotchart";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "요약" },
  { id: "team", label: "팀 비교" },
  { id: "players", label: "박스스코어" }, // 2026-05-02: '개인 기록' → '박스스코어' (사용자 요청)
  { id: "timeline", label: "타임라인" },
  { id: "shotchart", label: "샷차트" },
];

export function GameResultV2({ match }: { match: MatchDataV2 }) {
  // 탭 상태 — 기본 "요약". 시안 GameResult.jsx L4 와 동일.
  const [tab, setTab] = useState<TabId>("summary");

  // 2026-05-02: 프린트 다이얼로그 + 옵션 state — 옛 page.tsx L443-453 풀 복원
  // 이유: 사용자 요청 — "기존에 구현했었던 기록 UI와 순서 그대로 복구. 프린트 기능 아직 안 보임".
  // printDialogOpen — 모달 열림/닫힘
  // printOptions — 사용자가 확정한 옵션. null 이면 프린트 대기 X. 세팅 시 useEffect 가 window.print() 호출.
  // isPrinting — DOM 가시성 토글 (data-printing="true" → globals.css 룰로 #box-score-print-area 외 hidden).
  //              @media print 의존 없이 모바일 브라우저 호환 (errors.md 2026-04-17 참조).
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // OT 쿼터 존재 여부 — 다이얼로그에 OT 옵션 노출 분기
  const hasOT = (match.quarter_scores?.home?.ot?.length ?? 0) > 0;

  // 프린트 트리거 — printOptions 세팅 시 다음 틱에 실제 프린트 실행 (옛 page.tsx L511-555 카피)
  // 이유: printOptions 세팅으로 #box-score-print-area 가 리렌더되는 타이밍과
  //       window.print() 타이밍을 분리해야 DOM 이 완전히 반영된 상태로 프린트.
  // 추가: 프린트 직전 document.title 변경 → Chrome "PDF로 저장" 파일명에 사용. afterprint 으로 복원.
  useEffect(() => {
    if (!printOptions) return;

    // 파일명용 날짜/시간: scheduled_at → started_at → 현재
    const dateStr = match.scheduled_at ?? match.started_at ?? new Date().toISOString();
    const d = new Date(dateStr);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    // 파일명 안전 문자만: 공백/특수문자 → _ (한글 허용)
    const safe = (s: string) => s.replace(/[\s\\/:*?"<>|]+/g, "_").trim() || "team";
    const homeName = safe(match.home_team.name);
    const awayName = safe(match.away_team.name);
    const printTitle = `${yy}${mm}${dd}${hh}_${homeName}_${awayName}`;

    const originalTitle = document.title;
    document.title = printTitle;

    // state 기반 프린트 모드 진입 — @media print 의존 없이 모바일 호환
    setIsPrinting(true);

    // afterprint 이벤트 (사용자가 프린트/저장/취소 후) → title 복원 + state 초기화 + 다이얼로그 닫기
    const handleAfterPrint = () => {
      document.title = originalTitle;
      setIsPrinting(false);
      setPrintOptions(null);
      setPrintDialogOpen(false);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    window.addEventListener("afterprint", handleAfterPrint);

    // 다음 tick 에서 window.print() — DOM 반영 후 실행
    const timer = setTimeout(() => {
      window.print();
    }, 100);

    return () => {
      clearTimeout(timer);
      // 안전장치: cleanup 시 title 복원 + 리스너 제거 + 프린트 모드 해제
      window.removeEventListener("afterprint", handleAfterPrint);
      if (document.title === printTitle) document.title = originalTitle;
      setIsPrinting(false);
    };
  }, [printOptions, match]);

  return (
    // v2 디자인 토큰 사용 (globals.css 의 .page / --ink / --accent 등)
    // 2026-05-02: data-live-root + data-printing — 프린트 시 #box-score-print-area 외 노드 숨김
    <div
      data-live-root
      data-printing={isPrinting ? "true" : undefined}
      className="page"
      style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}
    >
      {/* 2026-05-02: 종료 매치 페이지 nav bar — 뒤로/홈 + 토너먼트명 (페이지 나가기 기능)
          data-print-hide 으로 프린트 시 자동 숨김 */}
      <div
        data-print-hide
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              window.history.back();
            } else if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }}
          aria-label="뒤로 가기"
          className="btn btn--sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          뒤로
        </button>
        <a
          href="/"
          aria-label="홈"
          className="btn btn--sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            padding: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            home
          </span>
        </a>
        {/* 토너먼트명 — 1줄 ellipsis */}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            color: "var(--ink-soft)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {match.tournament_name}
        </span>
        {/* 경기 종료 라벨 */}
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--ff-mono)",
            color: "var(--ink-mute)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          FINAL
        </span>
      </div>

      {/* Hero 스코어보드 — 시안 L118~L179 */}
      <HeroScoreboard match={match} />

      {/* 2026-05-09 PR3: 라이브 YouTube 영상 임베딩 — hero 영역 (FINAL 스코어보드) 아래 (Q4 결재).
          종료 매치는 isLive=false → "다시보기" 뱃지 노출. youtube_video_id NULL 이면 영역 hidden (Q11). */}
      {match.youtube_video_id && (
        <div data-print-hide style={{ marginBottom: 18 }}>
          <YouTubeEmbed
            videoId={match.youtube_video_id}
            isLive={false}
            status={match.youtube_status ?? null}
            // GameResultV2 는 admin-check 별도 호출 안 함 — PR4 운영자 모달에서 통합 시 isAdmin 전달.
            isAdmin={false}
          />
        </div>
      )}

      {/* 2026-05-03: 시간 데이터 소실 안내 배너 — 운영자 매치 종료 sync 누락 매치 박제용 */}
      {match.time_data_missing && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            marginBottom: 14,
            borderRadius: 6,
            background:
              "color-mix(in oklab, var(--warn, #F59E0B) 12%, transparent)",
            border:
              "1px solid color-mix(in oklab, var(--warn, #F59E0B) 35%, transparent)",
            color: "var(--ink)",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{ fontSize: 18, color: "var(--warn, #F59E0B)", flexShrink: 0 }}
          >
            info
          </span>
          <span>
            이 경기는 시간 데이터가 소실되어 출전 시간이 기록되지 않았습니다.
          </span>
        </div>
      )}

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
      {tab === "players" && (
        <>
          {/*
            2026-05-02: "개인 기록" 탭에서만 프린트 버튼 노출.
            이유: 박스스코어 프린트는 본질적으로 개인 기록 데이터.
            클릭 → setIsPrinting(true) → useEffect → window.print().
            data-print-hide 으로 프린트 영역에는 표시 안 됨.
          */}
          {/*
            2026-05-02: 클릭 시 즉시 print 대신 옵션 다이얼로그 열기 (옛 page.tsx L915 카피).
            팀별 enabled + 누적/Q1~Q4/OT 체크 후 "프린트" 버튼 → printOptions 세팅 → useEffect → window.print().
          */}
          <div
            data-print-hide
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={() => setPrintDialogOpen(true)}
              className="btn btn--sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "var(--bg-elev)",
                color: "var(--ink)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
              aria-label="박스스코어 프린트"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
              >
                print
              </span>
              박스스코어 프린트
            </button>
          </div>
          <TabPlayers match={match} />
        </>
      )}
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
        data-print-hide
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

      {/*
        2026-05-02: 프린트 옵션 다이얼로그 — data-print-hide 로 프린트 시 렌더 X (화면 전용 UI).
        옛 page.tsx L928-940 카피.
      */}
      <div data-print-hide>
        <PrintOptionsDialog
          open={printDialogOpen}
          onClose={() => setPrintDialogOpen(false)}
          onConfirm={(opts) => setPrintOptions(opts)}
          homeTeamName={match.home_team.name}
          awayTeamName={match.away_team.name}
          hasOT={hasOT}
          hasQuarterEventDetail={match.has_quarter_event_detail}
        />
      </div>

      {/*
        2026-05-02: 프린트 전용 영역 — 평소엔 hidden, isPrinting=true 시에만
        globals.css 의 [data-printing="true"] 룰로 단독 표시.
        페이지 다른 형제 노드는 모두 display: none 처리됨.
        printOptions 기반으로 (팀 × 기간) 조합마다 PrintBoxScoreTable 렌더 (옛 page.tsx 와 동일).
      */}
      <PrintBoxScoreArea match={match} printOptions={printOptions} />
    </div>
  );
}
