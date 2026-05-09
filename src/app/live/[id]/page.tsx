"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
// 헤더 우측에 테마 토글 버튼을 배치하기 위해 공통 컴포넌트 재사용
import { ThemeToggle } from "@/components/shared/theme-toggle";
// 2026-04-22: GameResult v2 — finished/completed 상태일 때 이 컴포넌트로 전체 렌더 갈아끼움.
// 기존 라이브/진행중 UI 코드(약 1800줄)는 0 수정. 아래 분기 3줄만 추가.
//
// 2026-04-30 P0-3: BDR v2.2 LiveResult 회귀 픽스
// 시안: Dev/design/BDR v2.2/screens/LiveResult.jsx (D등급 P0-3)
// 시안 룰: 색/폰트만 v2 유지 + 레이아웃·기능 옛 디자인 복원
// 회귀 검수 매트릭스 5건:
//   기능              | 옛 v1 | 시안 v2.2          | 진입점               | 모바일
//   FINAL 스코어보드  | ✅    | ✅ HeroScoreboard   | 라이브 종료 자동      | scoreboard 클래스 G-9 보호
//   쿼터별 점수       | ✅    | ✅ ScrollableTable  | -                    | hscroll
//   MVP 배너          | ✅    | ✅ MvpBanner        | playerStats 있을 때  | OK
//   경기 평가 진입    | ✅    | ✅ Link CTA         | /games/[id]/report   | 1열 stack
//   기록 보기 액션    | ✅    | ✅ Link CTA         | /profile/activity    | 1열 stack
// 진입: /live/[id] (경기 종료 자동) / 알림 "경기 결과 보기" 클릭
// 복귀: /games/[id] / /games/my-games / /live (다른 경기 보기)
import { GameResultV2, type MatchDataV2 } from "./_v2/game-result";
// 2026-05-05 Phase 1 PR4 — 매치 임시 jersey 번호 운영자 모달 (W1).
// 운영자 (organizer + tournament_admin_members.is_active=true) 만 진입.
// admin-check API 통과한 사용자에게만 헤더 우측 "임시 번호" 버튼 노출.
import { MatchJerseyOverrideModal } from "./_v2/match-jersey-override-modal";
// 2026-05-09 PR3 — 라이브 YouTube 영상 임베딩 (16:9 + 라이브/VOD 분기 + 모바일 4 분기점).
// youtube_video_id 가 NULL 이 아닐 때만 hero 아래 영역 마운트 (Q11 결재 — 영역 hidden).
import { YouTubeEmbed } from "./_v2/youtube-embed";
// 2026-05-09 PR4+PR5 — 운영자 모달 (수동 URL 입력 + BDR 채널 자동 검색).
// isAdmin = true 일 때만 마운트. POST/DELETE /youtube-stream API 호출 후 fetchMatch refetch.
import { MatchYouTubeModal } from "./_v2/match-youtube-modal";
// 2026-05-09 라이브 매치 카드 패널 PR3 — 같은 날 / 같은 대회 매치 N건 가로 스크롤 (네이버 패턴).
// API 응답 same_day_matches[] 가 비어있거나 1건 이하면 Rail 자체 null 반환 (영역 hidden).
import { LiveMatchCardRail } from "./_v2/live-match-card-rail";
import type { LiveMatchCardData } from "./_v2/live-match-card";

// 2026-04-16: 프린트 옵션 타입 — 팀별로 "누적 / 1~5쿼터"를 개별 체크 가능
// "5"는 OT(연장) 1쿼터(이후 OT는 현재 단일 키로 단순화: 있으면 전체 OT 포함)
interface TeamPrintOption {
  enabled: boolean;                    // 이 팀을 프린트할지 여부
  total: boolean;                      // 누적 기록 페이지 포함 여부
  quarters: Record<string, boolean>;   // "1"~"5" 키별 on/off
}
interface PrintOptions {
  home: TeamPrintOption;
  away: TeamPrintOption;
}

// 2026-04-15: 쿼터별 스탯 — 쿼터 필터 버튼용. API에서 snake_case로 내려옴.
interface QuarterStat {
  min: number; min_seconds: number; pts: number;
  fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number;
  oreb: number; dreb: number; reb: number;
  ast: number; stl: number; blk: number; to: number; fouls: number; plus_minus: number;
}

interface PlayerRow {
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
  // 0414: DNP(Did Not Play) — NBA 미출전 표시
  dnp?: boolean;
  // 2026-04-15: 스타팅 5 여부 — 박스스코어 상단에 고정하기 위한 플래그
  is_starter?: boolean;
  // 2026-04-15: 쿼터별 집계 — 키 "1"=Q1, "5"=OT1. 없는 쿼터는 키 자체 없음.
  quarter_stats?: Record<string, QuarterStat>;
}

interface PlayByPlayRow {
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
  home_score_at_time: number;
  away_score_at_time: number;
}

interface MatchData {
  id: number;
  // 2026-05-05 PR4 — 운영자 모달 (W1 임시 jersey 번호) 가 admin-check + jersey-override API 호출 시 사용.
  // tournament.id (String @db.Uuid) — null 일 수 없는 NOT NULL FK.
  tournament_id: string;
  status: string;
  home_score: number;
  away_score: number;
  round_name: string | null;
  tournament_name: string;
  // Phase 5 (매치 코드 v4) — 글로벌 매치 식별 코드 (snake_case 그대로 유지: 이 페이지는 camelCase 변환 안 함)
  // 형식: `26-GG-MD21-001` (14자) 또는 null. v2 hero-scoreboard 가 NULL 안전 분기 표시.
  match_code?: string | null;
  quarter_scores: {
    home: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
    away: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
  } | null;
  // 티빙 스타일 스코어카드 — 팀 로고 URL 추가 (없으면 null → 팀색 원 + 이니셜 fallback)
  home_team: { id: number; name: string; color: string; logo_url: string | null };
  away_team: { id: number; name: string; color: string; logo_url: string | null };
  home_players: PlayerRow[];
  away_players: PlayerRow[];
  play_by_plays: PlayByPlayRow[];
  updated_at: string;
  // 2026-04-15: 4/11~12 게임 클럭 부정확 시기 안내 분기에 사용 — API가 optional로 내려줌
  scheduled_at?: string | null;
  started_at?: string | null;
  // 티빙 스타일 — 경기장명(없으면 null) + 현재 진행 쿼터(라이브 아닐 때 null)
  venue_name?: string | null;
  current_quarter?: number | null;
  // 2026-04-16: 쿼터별 이벤트 기반 상세 스탯 존재 여부
  // false면 Flutter "최종 스탯 입력 모드"로 기록된 경기 → 쿼터 필터 활성 시 안내 배너 + 스탯 "-" 처리
  has_quarter_event_detail: boolean;
  // 2026-04-22: GameResult v2 — MVP 선수 + play_by_plays (API 신규 필드)
  // 기존 v1 렌더 경로에서는 참조하지 않음. v2 분기에서만 사용.
  mvp_player?: {
    id: number;
    jersey_number: number | null;
    name: string;
    team_id: number;
    pts: number; reb: number; ast: number; stl: number; blk: number;
    plus_minus: number;
    fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number;
    game_score: number;
  } | null;
  // 2026-05-09 PR3: 라이브 YouTube 영상 — 매치 1건 = 영상 1건 (1:1 옵션 A).
  // null 이면 임베드 영역 hidden (Q11). apiSuccess snake_case 변환 후 클라이언트 수신.
  youtube_video_id?: string | null;
  youtube_status?: "manual" | "auto_verified" | "auto_pending" | null;
  youtube_verified_at?: string | null;
  // 2026-05-09 PR1: 라이브 매치 카드 패널 — 같은 대회 + 같은 날 (KST) 매치 N건 (현재 매치 포함).
  // 빈 배열 또는 1건만 있으면 Rail 자체 hidden (사용자 결정 Q4=A 가변).
  // 응답 키 이미 snake_case → apiSuccess 자동 변환에서 그대로 통과 (errors.md 2026-04-17 룰).
  same_day_matches?: LiveMatchCardData[];
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "예정",
  warmup: "워밍업",
  live: "LIVE",
  halftime: "하프타임",
  finished: "종료",
  completed: "종료",
  in_progress: "진행중",
};

const ACTION_LABEL: Record<string, string> = {
  made_shot: "득점",
  missed_shot: "슛 실패",
  free_throw: "자유투",
  rebound: "리바운드",
  rebound_off: "공격 리바운드",
  rebound_def: "수비 리바운드",
  assist: "어시스트",
  steal: "스틸",
  block: "블락",
  turnover: "턴오버",
  foul: "파울",
  foul_personal: "파울",
  foul_technical: "테크니컬 파울",
  substitution: "교체",
  timeout: "타임아웃",
  "2pt": "2점 성공",
  "2pt_miss": "2점 실패",
  "3pt": "3점 성공",
  "3pt_miss": "3점 실패",
  "1pt": "자유투 성공",
  "1pt_miss": "자유투 실패",
};

function formatGameClock(seconds: number): string {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getQuarterLabel(q: number): string {
  if (q <= 4) return `Q${q}`;
  return `OT${q - 4}`;
}

/**
 * 경기 상태 → 중앙 정보 블록에 표시할 라벨.
 * 이유: 헤더의 "LIVE"/상태 칩과 별개로, 스코어카드 가운데에 "지금 이 경기가 어떤 단계인지"를
 * 한눈에 보여주기 위함 (티빙 중계 스타일). live/in_progress이고 current_quarter가 있으면
 * 구체적 쿼터("3쿼터")로 대체해 중계 몰입감 제공.
 */
function getCenterStatusLabel(
  status: string,
  currentQuarter: number | null | undefined,
): { text: string; highlight: boolean } {
  if (status === "live" || status === "in_progress") {
    if (currentQuarter && currentQuarter > 0) {
      // 4쿼터까지는 "N쿼터", 5 이상은 연장 (OT1 == 연장1)
      const text = currentQuarter <= 4 ? `${currentQuarter}쿼터` : `연장${currentQuarter - 4}`;
      return { text, highlight: true };
    }
    return { text: "경기 중", highlight: true };
  }
  if (status === "halftime") return { text: "하프타임", highlight: true };
  if (status === "warmup") return { text: "워밍업", highlight: false };
  if (status === "scheduled") return { text: "경기 전", highlight: false };
  if (status === "finished" || status === "completed") return { text: "경기 종료", highlight: false };
  // 알 수 없는 상태 — 기존 STATUS_LABEL fallback
  return { text: STATUS_LABEL[status] ?? status, highlight: false };
}

/**
 * ISO 시각을 "YYYY.MM.DD HH:MM" 형식으로 포맷.
 * 이유: 중앙 정보 블록에 "언제 치러진/치러질 경기인지" 표시하기 위함.
 * 우선순위: scheduled_at(예정) → started_at(실제 시작). 둘 다 없으면 null 반환 → UI에서 숨김.
 * 타임존: 브라우저 로컬(클라이언트 컴포넌트라 자연스러움).
 */
function formatMatchDateTime(
  scheduledAt: string | null | undefined,
  startedAt: string | null | undefined,
): string | null {
  const iso = scheduledAt ?? startedAt ?? null;
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}.${MM}.${DD} ${HH}:${mm}`;
}

// 팀명에서 이니셜 추출 — 로고가 없을 때 원형 배지 안에 표기
// 규칙:
//  - 마지막 토큰이 영문 대문자/숫자(2~4자) 약어면 그대로 사용 ("원주 DB" → "DB", "부산 KCC" → "KCC")
//  - 그 외에는 각 토큰 첫 글자 2~3개 ("BDR Eagles" → "BE", "서울 삼성 썬더스" → "서삼썬")
function getTeamInitials(name: string): string {
  const tokens = name.trim().split(/\s+/);
  if (tokens.length === 0) return "?";
  const last = tokens[tokens.length - 1];
  if (/^[A-Z0-9]{2,4}$/.test(last)) return last;
  return tokens.map((t) => t.charAt(0)).join("").slice(0, 3);
}

/**
 * "#RRGGBB" 또는 "#RGB" hex를 RGB로. 실패 시 null.
 * 이유: 팀색이 "#FFF" 같은 단축형으로 들어올 수도 있어 두 형식 모두 지원.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    // 3자리 단축형("FFF") → 각 문자를 2번 반복 ("FFFFFF")
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if ([r, g, b].some((v) => isNaN(v))) return null;
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if ([r, g, b].some((v) => isNaN(v))) return null;
    return { r, g, b };
  }
  return null;
}

/**
 * 팀색(hex)의 perceived brightness (0=검정 ~ 1=흰색).
 * ITU-R BT.601 luma 공식 사용 (간단 + 실용적).
 * 이유: 사람 눈은 빨강/초록/파랑을 균등하게 보지 않기 때문에 단순 평균보다 luma가 체감에 맞음.
 */
function getColorBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5; // 파싱 실패 시 중간값 (안전한 기본)
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

/**
 * 팀 플레이스홀더 뱃지 스타일:
 * - fg: 배경과 대비되는 텍스트 색 (밝은 배경엔 검정, 어두운 배경엔 흰)
 * - needsBorder: 배경이 극단 명도라 테마 배경과 동화될 위험이 있는 경우 테두리 필요
 *   (흰 유니폼이 라이트 모드에서 안 보이거나, 검정 유니폼이 다크 모드에서 안 보이는 문제 해결)
 */
function getTeamBadgeStyle(teamColor: string): { fg: string; needsBorder: boolean } {
  const brightness = getColorBrightness(teamColor);
  const fg = brightness > 0.5 ? "#1a1a1a" : "#ffffff";
  const needsBorder = brightness > 0.9 || brightness < 0.1;
  return { fg, needsBorder };
}

// 팀 로고 컴포넌트 — 로고 URL 있으면 이미지, 없으면 팀색 원 + 이니셜
// size는 px 단위. 모바일에서 작게 쓰려면 호출부에서 반응형 처리.
function TeamLogo({
  team,
  size = 64,
}: {
  team: { name: string; color: string; logo_url: string | null };
  size?: number;
}) {
  const px = `${size}px`;
  if (team.logo_url) {
    return (
      <div
        className="relative rounded-full overflow-hidden"
        // 이미지 로딩 전/실패 시 팀색이 슬쩍 비치도록 surface 배경 깔아둠
        style={{ width: px, height: px, backgroundColor: "var(--color-surface)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* 이유(왜): 팀 로고는 가로/세로 비율이 제각각이라 object-cover 시 잘림 발생.
            object-contain 으로 비율 보존 + 원형 마스크 안 여백은 surface 배경이 받음 (2026-05-02). */}
        <img src={team.logo_url} alt={team.name} className="w-full h-full object-contain" />
      </div>
    );
  }
  // 로고 없음 → 팀색 원 + 이니셜
  // adaptive 처리(2026-04-15):
  //  - 글자색: 팀색 brightness 기반으로 검정/흰색 자동 선택 (흰 유니폼에서 흰 글자 안보이는 문제 해결)
  //  - 극단 명도(거의 흰색 또는 검정): var(--color-border)로 테두리 추가 → 테마 배경과 동화 방지
  const initials = getTeamInitials(team.name);
  const { fg, needsBorder } = getTeamBadgeStyle(team.color);
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: px,
        height: px,
        backgroundColor: team.color,
        color: fg, // adaptive: brightness > 0.5면 검정, 아니면 흰
        fontSize: size >= 64 ? "20px" : "16px",
        // 극단 명도(흰/검)일 때만 테두리 — 중간 명도 팀색은 테두리 불필요
        border: needsBorder ? "2px solid var(--color-border)" : undefined,
        // border 추가 시 전체 크기 유지 (width/height 안에 border 포함)
        boxSizing: "border-box",
      }}
    >
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 스코어카드 서브 컴포넌트 (2026-04-15 모바일 2행 레이아웃 재설계)
// 이유: 기존 5단(로고/점수/중앙/점수/로고) 가로 배치가 모바일에서 가로폭 부족으로
// 점수·중앙정보가 쪼그라들어 가독성이 떨어짐.
// 해결: 모바일은 Row1(팀 좌우) + Row2(점수-중앙정보-점수) 2행 구조, 데스크톱은 5단 유지.
// 공통 빌딩블록으로 뽑아 모바일/데스크톱 양쪽에서 재사용.
// ─────────────────────────────────────────────────────────────

// 팀명 약칭 helper — 모바일 미니스코어용 (sticky 헤더 좁은 공간)
// 왜 인라인 helper:
//   - DB 에 약칭 필드 없음 (team_abbr 컬럼 미존재)
//   - 한글 팀명: 처음 2자 (예: "라이징스타" → "라이")
//   - 영문/혼합: 단어 머릿글자 최대 4자 (예: "BDR Black Label" → "BBL")
//   - 단일 단어 영문: 처음 4자 (예: "Lakers" → "Lake")
function abbreviateTeamName(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  // 한글 포함 여부 (Hangul Syllables 범위)
  const hasHangul = /[가-힯]/.test(trimmed);
  if (hasHangul) {
    // 한글이면 공백 제거 후 처음 2자 (CJK 폭 좁아 2자만으로 충분)
    return trimmed.replace(/\s+/g, "").slice(0, 2);
  }
  // 영문 — 공백으로 단어 분리
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    // 다단어: 머릿글자 최대 4자 (대문자)
    return words.slice(0, 4).map((w) => w[0]?.toUpperCase() ?? "").join("");
  }
  // 단일 단어: 처음 4자
  return trimmed.slice(0, 4);
}

// 팀 블록: 로고 + 팀명(+홈 아이콘)
// logoSize는 호출부에서 모바일 48 / 데스크톱 72로 지정
function TeamBlock({
  team,
  isHome,
  logoSize,
}: {
  team: MatchData["home_team"];
  isHome: boolean;
  logoSize: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <TeamLogo team={team} size={logoSize} />
      {/* 팀명: 모바일은 max-w 100px(좁게), 데스크톱은 160px. 홈팀만 home 아이콘 prepend */}
      <p
        className="text-sm sm:text-base font-medium flex items-center gap-1 truncate max-w-[100px] sm:max-w-[160px]"
        style={{ color: "var(--color-text-primary)" }}
      >
        {isHome && (
          <span
            className="material-symbols-outlined shrink-0"
            style={{ fontSize: "16px", color: "var(--color-text-muted)" }}
          >
            home
          </span>
        )}
        {team.name}
      </p>
    </div>
  );
}

// 점수 표시: 플래시 애니메이션(점수 변경 시 scale+brightness) 유지
function ScoreDisplay({ value, flash }: { value: number; flash: boolean }) {
  return (
    <p
      className={`text-5xl sm:text-6xl font-black transition-all duration-300 ${flash ? "scale-125 brightness-150" : "scale-100"}`}
      style={{ color: "var(--color-text-primary)" }}
    >
      {value}
    </p>
  );
}

// 중앙 정보 블록: 상태 라벨 + 일시 + 장소
// 기존 5단 레이아웃 내 JSX 블록을 그대로 추출. getCenterStatusLabel / formatMatchDateTime 재사용
function CenterInfoBlock({ match, isLive }: { match: MatchData; isLive: boolean }) {
  void isLive; // 현재는 상태 라벨 헬퍼가 match.status/current_quarter만 쓰지만, 추후 확장 대비 시그니처 유지
  const { text, highlight } = getCenterStatusLabel(match.status, match.current_quarter);
  const dt = formatMatchDateTime(match.scheduled_at, match.started_at);
  return (
    <div className="flex flex-col items-center gap-2 px-1 min-w-0">
      {/* 상태 라벨 — highlight(진행 중 쿼터 등)면 primary red + 크게 */}
      <span
        className={`whitespace-nowrap ${highlight ? "text-xl font-semibold" : "text-lg"}`}
        style={{ color: highlight ? "var(--color-primary)" : "var(--color-text-muted)" }}
      >
        {text}
      </span>
      {/* 일시 — 모바일은 text-sm으로 한 단계 축소 (좁은 가로폭 대응) */}
      {dt && (
        <span
          className="text-sm sm:text-base whitespace-nowrap"
          style={{ color: "var(--color-text-muted)" }}
        >
          {dt}
        </span>
      )}
      {/* 장소 — 모바일은 max-w 180px, 데스크톱 220px */}
      {match.venue_name && (
        <span
          className="text-sm sm:text-base truncate max-w-[180px] sm:max-w-[220px] text-center"
          style={{ color: "var(--color-text-muted)" }}
        >
          {match.venue_name}
        </span>
      )}
    </div>
  );
}

const POLL_INTERVAL = 3_000; // 3초

// 얼룩무늬(zebra stripe) 배경색 — card 위에 중립 회색 6%를 섞어 불투명화.
// 모바일 가로 스크롤 시 sticky 셀(bg-inherit)이 투명해지면 뒤 콘텐츠가 비치는 문제 해결.
// color-mix는 모던 브라우저(Chrome 111+, Safari 16.2+, Firefox 113+) 모두 지원.
const ZEBRA_BG = "color-mix(in srgb, var(--color-card), #7f7f7f 6%)";
// TOTAL 합산 행 전용 — 조금 더 진하게 구분 (card 위에 10%)
const TOTAL_ROW_BG = "color-mix(in srgb, var(--color-card), #7f7f7f 10%)";
// 짝수 행(홀수 번째가 아닌) 기본 배경 — 카드 색 그대로 쓰되 sticky 셀도 불투명 상속받도록 명시
const ROW_EVEN_BG = "var(--color-card)";

export default function LiveBoxScorePage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 2026-05-02: 일시 에러(429/5xx/네트워크) 표시용 — match 데이터는 유지하면서 작은 알림만 노출
  const [transientError, setTransientError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [homeFlash, setHomeFlash] = useState(false);
  const [awayFlash, setAwayFlash] = useState(false);
  const prevScoreRef = useRef<{ home: number; away: number } | null>(null);
  // 2026-04-16: 프린트 옵션 다이얼로그 상태
  // printDialogOpen — 모달 열림/닫힘
  // printOptions — 사용자가 확정한 옵션. null이면 프린트 대기 상태가 아님.
  //                값이 세팅되면 useEffect에서 DOM 업데이트 후 window.print() 호출.
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions | null>(null);
  // 2026-05-10 — 프린트 모드 분기 (system = window.print OS 다이얼로그 / pdf = html2canvas+jspdf 자동 다운로드)
  const [printMode, setPrintMode] = useState<"system" | "pdf">("pdf");
  // 2026-05-10 — PDF 저장 시 화면 깜빡임 가리는 loading overlay state.
  //   사유: setIsPrinting(true) 는 원본 DOM 의 data-printing 속성 변경 → globals.css 룰로
  //   원본 화면도 양식 적용 (clone 만 캡처되지만 원본 사이즈 측정 위해 필요).
  //   overlay 로 캡처 200ms 가림 → 사용자 깜빡임 미인지.
  const [pdfGenerating, setPdfGenerating] = useState(false);
  // 2026-04-17: state 기반 프린트 모드 토글 — 모바일/태블릿 브라우저 호환성 개선.
  // 기존 @media print + Tailwind print:block 방식은 일부 모바일 브라우저가 뷰포트 스냅샷
  // 모드로 처리해 hidden 그대로 유지되어 blank 출력되는 문제가 있었음.
  // 이제 data-printing="true" 속성 기반 CSS가 @media 의존 없이 가시성 전환을 담당.
  const [isPrinting, setIsPrinting] = useState(false);

  // 2026-05-05 PR4 — 매치 임시 jersey 번호 운영자 모달 상태.
  // isAdmin: admin-check API 결과 (mount 후 1회 fetch, tournament_id 도달 후 자동).
  // jerseyModalOpen: 모달 토글.
  const [isAdmin, setIsAdmin] = useState(false);
  const [jerseyModalOpen, setJerseyModalOpen] = useState(false);

  // 2026-05-09 PR4+PR5 — 매치 YouTube 영상 운영자 모달 상태.
  // isAdmin && match 일 때 마운트. 영상 등록 시 YouTubeEmbed edit 버튼 / 미등록 시 hero 아래 등록 버튼.
  const [streamModalOpen, setStreamModalOpen] = useState(false);

  // 2026-05-10 PR-C — 라이브 YouTube 영상 자동 등록 폴링 활성화 플래그.
  // true 일 때 운영자 화면에 "BDR 채널 자동 검색 중..." 토스트 노출.
  // 일반 viewer 도 백그라운드 폴링은 동일하게 작동 (토스트만 운영자 한정).
  const [autoRegisterActive, setAutoRegisterActive] = useState(false);

  // 2026-05-10 — 모바일/PC 분기 + YouTube 영상 PIP 모드 (PC 만).
  //   모바일 (≤767px) = 영상 sticky top-14 (헤더 아래 큰 사이즈 고정)
  //   PC (≥768px) = 영상이 viewport 안 = 일반 위치 / viewport 밖 = 우측 하단 PIP (YouTube 스타일)
  //   zoom 1.1 (박스스코어 가독성, 2026-04-15 결정) 도 모바일에서 sticky 깨트림 → 모바일 zoom 1 분기
  const [isMobile, setIsMobile] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const youtubeWrapperRef = useRef<HTMLDivElement | null>(null);

  // matchMedia ≤767px 감지 — SSR 첫 렌더 false (PC 기본) → mount 후 모바일이면 true 로 보정 (깜빡임 1회)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // PC 만: 영상 wrapper 가 viewport 밖일 때 PIP 활성화. 모바일은 sticky 만 사용 → PIP 비활성.
  // dependency 에 match?.youtube_video_id 포함 — 영상이 fetch 후 마운트되는 타이밍 wrapper ref
  // 가 채워진 후 effect 가 다시 실행되어야 observer 가 정상 attach 됨 (5/10 사용자 발견 fix).
  useEffect(() => {
    if (typeof window === "undefined" || isMobile || !match?.youtube_video_id) {
      setIsPip(false);
      return;
    }
    const target = youtubeWrapperRef.current;
    if (!target) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsPip(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [isMobile, match?.youtube_video_id]);

  // zoom 분기 derived (state 분리 안 함 — isMobile 단일 source-of-truth)
  const zoomScale = isMobile ? 1 : 1.1;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/live/${id}`, { cache: "no-store" });
      if (!res.ok) {
        // 2026-05-02 에러 처리 분기:
        //  - 404: 진짜 매치 없음 → 풀스크린 에러 (영구)
        //  - 429/5xx: 일시 에러 → match 데이터 유지 + 작은 알림 (다음 폴링에서 자동 복구)
        if (res.status === 404) {
          setError("경기 정보를 찾을 수 없습니다");
          setTransientError(null);
        } else if (res.status === 429) {
          // rate limit — match 데이터 유지 + 알림
          setTransientError("연결 지연 · 자동 재시도 중");
        } else {
          // 5xx 또는 기타 — match 데이터 유지 + 알림
          setTransientError("일시 오류 · 자동 재시도 중");
        }
        return;
      }
      const data = await res.json();
      const m = data.match as MatchData;

      // 점수 변경 감지 → 플래시 효과
      if (prevScoreRef.current) {
        if (m.home_score !== prevScoreRef.current.home) {
          setHomeFlash(true);
          setTimeout(() => setHomeFlash(false), 800);
        }
        if (m.away_score !== prevScoreRef.current.away) {
          setAwayFlash(true);
          setTimeout(() => setAwayFlash(false), 800);
        }
      }
      prevScoreRef.current = { home: m.home_score, away: m.away_score };

      setMatch(m);
      setLastUpdated(new Date());
      setIsLive(m.status === "live" || m.status === "in_progress");
      setError(null);
      // 정상 응답 시 transientError 클리어 (자동 복구 표시)
      setTransientError(null);

      // 경기 종료 시 폴링 중단 — 깜빡임 방지
      if (m.status === "completed" || m.status === "finished") {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch {
      // 네트워크 끊김/timeout — match 데이터 유지 + 알림
      setTransientError("네트워크 오류 · 자동 재시도 중");
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
    timerRef.current = setInterval(fetchMatch, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchMatch]);

  // 2026-05-05 PR4 — 운영자 여부 1회 확인 (match.tournament_id 도달 후).
  // 라이브 페이지는 공개 — 미로그인/일반회원 = isAdmin:false (silent fail).
  // 운영자 = 헤더 우측 "임시 번호" 버튼 노출. tournament_id 가 변하면 (단일 페이지 내 전환 X 시나리오)
  // 다시 확인. 일반적으로 1회만 호출됨.
  useEffect(() => {
    const tid = match?.tournament_id;
    if (!tid) return;
    let cancelled = false;
    fetch(`/api/web/tournaments/${tid}/admin-check`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        // apiSuccess camelCase → snake_case 변환 (response.ts) → is_admin 으로 수신
        const v = data?.is_admin ?? data?.isAdmin ?? false;
        setIsAdmin(Boolean(v));
      })
      .catch(() => {
        // 실패 = 운영자 아닌 것으로 간주 (보수적 default)
      });
    return () => {
      cancelled = true;
    };
  }, [match?.tournament_id]);

  // 2026-05-10 PR-C — 라이브 YouTube 영상 자동 등록 폴링.
  // 동작:
  //   - match 데이터 도달 + youtube_video_id 미등록 + 윈도우 안 (시작 ±10분) 일 때만 활성화
  //   - 30초마다 POST /api/web/match-stream/auto-register/[matchId] 호출
  //   - 응답 registered=true 시 setInterval clear + fetchMatch refetch (즉시 임베드 노출)
  //   - 윈도우 벗어남 / already_registered / match_not_live 시 자동 stop
  //   - 운영자 (isAdmin) 에게만 토스트 노출 (백그라운드 폴링은 일반 viewer 도 작동)
  //
  // 응답 키는 모두 snake_case (apiSuccess 자동 변환 — errors.md 2026-04-17 룰).
  // data.registered / data.reason / data.video_id / data.score / data.status / data.match_status
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!match) return;

    // 영상 이미 등록 → 폴링 0 (이미 등록 매치는 youtube_video_id 분기에서 임베드 표시 중)
    if (match.youtube_video_id) return;

    // status 가드 — 자동 등록 가능한 상태만 (auto-register endpoint §13 status guard 와 일치)
    // scheduled / ready / in_progress 외 (completed / cancelled 등) 은 endpoint 가 match_not_live 반환 → 폴링 무의미
    if (
      match.status !== "scheduled" &&
      match.status !== "ready" &&
      match.status !== "in_progress"
    ) {
      return;
    }

    // 윈도우 (시작 ±10분) 검증 — 도달 시각 추정 (started_at 우선, 없으면 scheduled_at)
    const ref = match.started_at ?? match.scheduled_at;
    if (!ref) return;
    const refTime = new Date(ref).getTime();
    if (Number.isNaN(refTime)) return; // 날짜 파싱 실패 = 폴링 시작 안 함
    const WINDOW_MS = 10 * 60 * 1000; // ±10분

    const checkWindow = () => Math.abs(Date.now() - refTime) <= WINDOW_MS;
    if (!checkWindow()) return; // 윈도우 밖 = 폴링 시작 안 함

    // 폴링 시작 — 운영자 토스트 노출 + interval 변수 cleanup 용 외부 박제
    setAutoRegisterActive(true);
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // tick 1회 = auto-register endpoint 1회 호출 + 응답 분기 처리
    const tick = async () => {
      if (cancelled) return;

      // 윈도우 벗어났는지 매번 체크 (사용자가 페이지 오래 열어둠 / interval drift 방어)
      if (!checkWindow()) {
        cancelled = true;
        setAutoRegisterActive(false);
        if (intervalId) clearInterval(intervalId);
        return;
      }

      try {
        const res = await fetch(`/api/web/match-stream/auto-register/${match.id}`, {
          method: "POST",
          cache: "no-store",
        });
        if (!res.ok) return; // 429 (rate limit) / 5xx — silent fail, 다음 tick 재시도
        const json = await res.json();
        // apiSuccess envelope = { success, data, ... } / data 없으면 raw 응답 (fallback)
        const data = json?.data ?? json;

        if (data?.registered === true) {
          // 자동 등록 성공 — interval clear + match refetch (즉시 임베드 노출)
          cancelled = true;
          setAutoRegisterActive(false);
          if (intervalId) clearInterval(intervalId);
          fetchMatch();
          return;
        }

        // already_registered = 다른 사용자 폴링이 먼저 등록 / match_not_live = status 변경 → 폴링 stop
        if (data?.reason === "already_registered" || data?.reason === "match_not_live") {
          cancelled = true;
          setAutoRegisterActive(false);
          if (intervalId) clearInterval(intervalId);
          // already_registered 시 match.youtube_video_id 갱신 위해 refetch
          if (data?.reason === "already_registered") fetchMatch();
          return;
        }
        // out_of_window — 다음 tick 의 checkWindow 가 자동 정리 (서버/클라 시계 미세 갭)
        // no_match_found — 다음 tick 에서 재시도 (BDR 채널 영상 미업로드 / 점수 80점 미달)
      } catch (err) {
        console.error("[auto-register polling]", err);
        // 네트워크 에러 = 다음 tick 까지 대기 (silent fail)
      }
    };

    // 즉시 1회 호출 + 30초 간격 폴링 (rate limit 6회/분/IP+matchId — 여유 분당 2회)
    tick();
    intervalId = setInterval(tick, 30 * 1000);

    return () => {
      cancelled = true;
      setAutoRegisterActive(false);
      if (intervalId) clearInterval(intervalId);
    };
    // match 객체 전체를 deps 에 두면 fetchMatch 폴링 (3초) 마다 새 객체로 교체되어 effect 재설정 빈번 →
    // 미세 의존성으로 분리: id / youtube_video_id / status / scheduled_at / started_at 변경 시만 재실행.
  }, [
    match?.id,
    match?.youtube_video_id,
    match?.status,
    match?.scheduled_at,
    match?.started_at,
    fetchMatch,
  ]);

  // 2026-04-16: 프린트 옵션 확정 → 다음 틱에 실제 프린트 실행
  // 이유: printOptions 세팅으로 #box-score-print-area가 리렌더되는 타이밍과
  // window.print() 타이밍을 분리해야 DOM이 완전히 반영된 상태로 프린트된다.
  // 추가: 프린트 직전 document.title을 "YYMMDD_홈팀_원정팀"으로 변경 →
  //       Chrome "PDF로 저장" 다이얼로그의 파일명이 이 title을 사용.
  //       afterprint 이벤트로 원래 title 복원.
  useEffect(() => {
    if (printOptions && match) {
      // 파일명용 날짜/시간: scheduled_at 우선 → started_at → 현재
      // HH는 경기 시작 시간(24시간 형식), 브라우저 로컬 타임존 기준
      const dateStr = match.scheduled_at ?? match.started_at ?? new Date().toISOString();
      const d = new Date(dateStr);
      const yy = String(d.getFullYear()).slice(2);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0"); // 24h
      // 파일명 안전 문자만: 공백/특수문자 → _, 한글 허용
      const safe = (s: string) => s.replace(/[\s\\/:*?"<>|]+/g, "_").trim() || "team";
      const homeName = safe(match.home_team.name);
      const awayName = safe(match.away_team.name);
      const printTitle = `${yy}${mm}${dd}${hh}_${homeName}_${awayName}`;

      // 2026-05-10 — 프린트 모드 분기.
      //   system = window.print() OS 다이얼로그 (PC 권장 / 모바일 Chrome 미작동)
      //   pdf    = html2canvas + jspdf 자동 PDF 다운로드 (모바일 호환)
      // 박스스코어 영역은 .print-team-page 단위로 페이지 분리 → PDF 모드는 각 섹션 별도 페이지.
      setIsPrinting(true);

      let cancelled = false;

      if (printMode === "system") {
        // === SYSTEM MODE (window.print) — OS 다이얼로그 + 종이/PDF 출력 ===
        const originalTitle = document.title;
        document.title = printTitle;
        const handleAfterPrint = () => {
          document.title = originalTitle;
          setIsPrinting(false);
          setPrintOptions(null);
          setPrintDialogOpen(false);
          window.removeEventListener("afterprint", handleAfterPrint);
        };
        window.addEventListener("afterprint", handleAfterPrint);
        const t = setTimeout(() => {
          if (!cancelled) window.print();
        }, 100);
        return () => {
          cancelled = true;
          clearTimeout(t);
          window.removeEventListener("afterprint", handleAfterPrint);
          if (document.title === printTitle) document.title = originalTitle;
          setIsPrinting(false);
        };
      }

      // === PDF MODE (html2canvas + jspdf) — 섹션별 페이지 분할 + A4 landscape 가로 fit ===
      // overlay ON — 화면 깜빡임 가림 (setIsPrinting 보다 먼저 또는 batch 적용)
      setPdfGenerating(true);

      const t = setTimeout(async () => {
        if (cancelled) return;
        try {
          const printArea = document.getElementById("box-score-print-area");
          if (!printArea) {
            console.error("[print] #box-score-print-area not found");
            return;
          }
          // 각 .print-team-page = 1 PDF 페이지 (홈 누적 / 홈 Q1 / ... / 원정 누적 / ...)
          const sections = printArea.querySelectorAll<HTMLElement>(".print-team-page");
          if (sections.length === 0) {
            console.error("[print] .print-team-page 섹션 0건");
            return;
          }
          // dynamic import — bundle size 분리 (~150KB / 첫 PDF 저장 시점만 로드)
          const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
            import("html2canvas"),
            import("jspdf"),
          ]);
          if (cancelled) return;

          const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
          const pdfW = pdf.internal.pageSize.getWidth();   // 297mm
          const pdfH = pdf.internal.pageSize.getHeight();  // 210mm

          for (let i = 0; i < sections.length; i++) {
            if (cancelled) return;
            const section = sections[i];
            // 섹션을 1100px 너비 강제로 캡처 — 모바일 viewport 무관 + 양식 유지
            const canvas = await html2canvas(section, {
              scale: 2, // 고해상도 (재현 정밀)
              width: 1100,
              windowWidth: 1100,
              backgroundColor: "#ffffff",
              useCORS: true,
              logging: false,
              onclone: (clonedDoc) => {
                // 2026-05-10 — globals.css [data-printing="true"] 룰 적용 + html2canvas iframe
                // 한계 우회. iframe 내부 stylesheet 로딩이 일부 누락 + layout 재계산 정밀도 한계가
                // 알려져 있어, root + section 에 한해 핵심 사이즈 fallback 만 inline 박제.
                // (양식 본체 = globals.css 단일 source / inline = layout 사이즈 보장만)
                const root = clonedDoc.querySelector<HTMLElement>("[data-live-root]");
                if (root) {
                  root.setAttribute("data-printing", "true");
                  root.style.width = "1100px";
                  root.style.maxWidth = "1100px";
                  root.style.margin = "0 auto";
                }
                // 캡처 element 자체 사이즈 보장 — html2canvas 가 element width 측정 시 사용
                const sections = clonedDoc.querySelectorAll<HTMLElement>(".print-team-page");
                sections.forEach((s) => {
                  s.style.width = "1100px";
                  s.style.maxWidth = "1100px";
                  s.style.boxSizing = "border-box";
                });
              },
            });
            if (cancelled) return;

            const imgData = canvas.toDataURL("image/png");
            const imgWmm = canvas.width / 2;   // scale 2 보정 (px @ 2x → 1x px)
            const imgHmm = canvas.height / 2;
            // A4 landscape 가로 fit — 가로 297mm 채우고 세로 비율 유지
            const ratio = Math.min(pdfW / imgWmm, pdfH / imgHmm);
            const drawW = imgWmm * ratio;
            const drawH = imgHmm * ratio;
            // 2026-05-10 — PC 프린트 양식 동등: 페이지 상단 정렬 (offsetY=0) + 가운데 가로 정렬 유지
            const offsetX = (pdfW - drawW) / 2;
            const offsetY = 0;

            if (i > 0) pdf.addPage("a4", "landscape");
            pdf.addImage(imgData, "PNG", offsetX, offsetY, drawW, drawH);
          }

          pdf.save(`${printTitle}.pdf`);
        } catch (err) {
          console.error("[print] PDF 생성 실패:", err);
        } finally {
          if (!cancelled) {
            setIsPrinting(false);
            setPrintOptions(null);
            setPrintDialogOpen(false);
            setPdfGenerating(false); // overlay OFF
          }
        }
      }, 200);

      return () => {
        cancelled = true;
        clearTimeout(t);
        setIsPrinting(false);
        setPdfGenerating(false); // overlay OFF (cleanup 시)
      };
    }
  }, [printOptions, match, printMode]);

  // 2026-04-16: printOptions 기반 동적 섹션 목록
  // 순서: 홈(누적 → 1Q → ... → OT) → 원정(누적 → 1Q → ... → OT)
  const printSections = useMemo(() => {
    if (!printOptions) return [];
    const out: Array<{ team: "home" | "away"; filter: string; label: string }> = [];
    for (const side of ["home", "away"] as const) {
      const o = printOptions[side];
      if (!o.enabled) continue;
      if (o.total) out.push({ team: side, filter: "all", label: "누적 기록" });
      for (const q of ["1", "2", "3", "4", "5"]) {
        if (o.quarters[q]) {
          const label = q === "5" ? "OT" : `${q}쿼터`;
          out.push({ team: side, filter: q, label });
        }
      }
    }
    return out;
  }, [printOptions]);

  if (error) {
    // 에러 화면도 테마 반응형이 되도록 CSS 변수로 배경/텍스트 지정
    return (
      <div
        data-live-root
        className="min-h-screen flex items-center justify-center"
        // 2026-04-15: zoom 1.1 — 전체 UI 110% 확대 (박스스코어 가독성)
        // 2026-04-16: data-live-root — 프린트 CSS가 이 컨테이너의 자식 중 프린트 영역만 남기고 제거
        style={{ backgroundColor: "var(--color-background)", color: "var(--color-text-primary)", zoom: "1.1" }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4">🏀</div>
          <p style={{ color: "var(--color-text-secondary)" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!match) {
    // 로딩 스피너: 주황 → BDR 기본 primary 사용 (테마 중립)
    return (
      <div
        data-live-root
        className="min-h-screen flex items-center justify-center"
        // 2026-04-15: zoom 1.1 적용
        // 2026-04-16: data-live-root — 프린트 CSS 타겟
        style={{ backgroundColor: "var(--color-background)", zoom: "1.1" }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  // 2026-04-15: 4/11~12 게임 클럭 부정확 시기 판정
  // 이 기간에 치러진 경기는 box score의 MIN 값이 정확하지 않아 테이블 하단에 안내 문구를 노출한다.
  // 우선순위: scheduled_at(예정일) → started_at(실제 시작) → updated_at(최종 갱신). 하나라도 2026-04-11/12 이면 true.
  const matchDateStr = match.scheduled_at || match.started_at || match.updated_at;
  const matchDate = matchDateStr ? new Date(matchDateStr) : null;
  const isLegacyClockIssue = matchDate
    ? matchDate.getFullYear() === 2026 &&
      matchDate.getMonth() === 3 /* 0-indexed: 3 === 4월 */ &&
      (matchDate.getDate() === 11 || matchDate.getDate() === 12)
    : false;

  const qs = match.quarter_scores;
  const qh = qs?.home;
  const qa = qs?.away;
  const quarters = [
    { label: "Q1", home: qh?.q1 ?? 0, away: qa?.q1 ?? 0 },
    { label: "Q2", home: qh?.q2 ?? 0, away: qa?.q2 ?? 0 },
    { label: "Q3", home: qh?.q3 ?? 0, away: qa?.q3 ?? 0 },
    { label: "Q4", home: qh?.q4 ?? 0, away: qa?.q4 ?? 0 },
    ...(qh?.ot ?? []).map((v, i) => ({
      label: `OT${i + 1}`,
      home: v,
      away: qa?.ot?.[i] ?? 0,
    })),
  ];

  // 2026-04-22: 종료된 경기는 v2 GameResult 컴포넌트로 전체 렌더 교체
  // 기존 라이브/진행중 UI 코드는 0 수정. finished/completed 외 상태는 기존 그대로 렌더.
  if (match.status === "finished" || match.status === "completed") {
    return <GameResultV2 match={match as unknown as MatchDataV2} />;
  }

  return (
    // 페이지 최상단 컨테이너 — 배경/글자 기본색은 모두 CSS 변수 사용 (테마 전환 대응)
    // 2026-04-15: zoom 1.1로 전체 UI 110% 확대 (박스스코어 가독성 개선)
    // 2026-04-16: data-live-root — 프린트 CSS가 자식 중 #box-score-print-area만 남기고 제거
    <div
      data-live-root
      data-printing={isPrinting ? "true" : undefined}
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-text-primary)", zoom: isPrinting ? 1 : zoomScale }}
    >
      {/* 2026-05-02: 일시 에러 (rate limit 429 / 5xx / 네트워크) 알림 — 우상단 작은 토스트
          match 데이터 유지하면서 사용자에게 재시도 중임을 표시. 다음 폴링 (3s) 에 자동 사라짐. */}
      {transientError && !error && (
        <div
          role="status"
          aria-live="polite"
          data-print-hide
          className="fixed right-3 top-3 z-30 flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-warning, #f59e0b)",
            color: "var(--color-warning, #f59e0b)",
          }}
        >
          <span className="material-symbols-outlined text-sm animate-spin" style={{ animationDuration: "1.5s" }}>
            sync
          </span>
          {transientError}
        </div>
      )}

      {/*
        헤더 — sticky 적용 (라이브 모드만 의미 있음 — 스크롤 내려도 스코어/뒤로 항상 노출).
        왜 sticky 인가:
          - 라이브 진행 중 사용자가 박스/플레이어 탭으로 스크롤 내려도 스코어 + LIVE 인디케이터 + 뒤로가기 항상 시야 유지
          - 토큰 일치: var(--color-card) 배경 + var(--color-border) 테두리 (BDR-current 13룰 §C-10 준수)
          - z-20 = AppNav (z-30+) 보다 낮게 — 글로벌 헤더 우선
          - data-print-hide 인쇄 시 숨김 (transientError 와 동일 패턴)
       */}
      <div
        data-print-hide
        className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b backdrop-blur"
        style={{
          // 반투명 + backdrop-blur 로 sticky 시 자연스러운 오버레이 (스크롤 컨텐츠가 살짝 비치게)
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* 2026-05-02: 나가는 액션 강화 — chevron + "뒤로" 텍스트 + history fallback "/" */}
          <button
            onClick={() => {
              // history 비어있을 때 (직접 URL 접속) "/" 로 fallback
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
            aria-label="뒤로 가기"
            className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors hover:bg-[var(--color-elevated)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            <span className="text-xs font-medium hidden sm:inline">뒤로</span>
          </button>
          {/* 홈 진입점 — 모바일/PC 모두 노출 (직접 URL 접속 시 history fallback 외 추가 보조) */}
          <a
            href="/"
            aria-label="홈"
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-[var(--color-elevated)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span className="material-symbols-outlined text-lg">home</span>
          </a>
          {/*
            토너먼트명 — 모바일에서 미니스코어 자리 확보 위해 sm:inline 으로 PC 만 노출.
            모바일은 미니스코어가 더 중요 (라이브 중계 시 가장 자주 보고 싶은 정보).
          */}
          <span className="text-base truncate ml-1 hidden sm:inline" style={{ color: "var(--color-text-secondary)" }}>
            {match.tournament_name}
          </span>
        </div>
        {/*
          모바일 미니스코어 — 라이브 매치만 / 모바일 전용 (sm:hidden = ≥640px 에서 숨김).
          왜 모바일만:
            - PC 는 HeroScoreboard (L770~) 가 항상 보이는 위치에 있어 미니스코어 중복
            - 모바일은 화면 좁아 sticky 헤더에 미니스코어를 끼워 넣어야 스크롤 내려도 스코어 인지 가능
          왜 라이브만:
            - 종료 매치는 헤더 sticky 만으로 충분 (게임 결과는 박스스코어/요약 탭에서 확인)
            - scheduled/cancelled 는 스코어 자체가 0:0
        */}
        {isLive && (
          <div
            className="flex items-center gap-1.5 sm:hidden font-mono text-sm font-bold tabular-nums shrink-0"
            style={{ color: "var(--color-text-primary)" }}
            aria-label={`${match.home_team.name} ${match.home_score} 대 ${match.away_score} ${match.away_team.name}`}
          >
            {/* 홈팀 약칭 (한글 2자 / 영문 단어 머릿글자 4자 이내) */}
            <span className="truncate max-w-[3.5rem]">{abbreviateTeamName(match.home_team.name)}</span>
            {/* 점수: 홈 우세 시 진하게 / 동점 시 동등 / 원정 우세 시 원정 진하게 */}
            <span className={match.home_score >= match.away_score ? "" : "opacity-60"}>{match.home_score}</span>
            <span style={{ color: "var(--color-text-muted)" }}>:</span>
            <span className={match.away_score >= match.home_score ? "" : "opacity-60"}>{match.away_score}</span>
            <span className="truncate max-w-[3.5rem]">{abbreviateTeamName(match.away_team.name)}</span>
            {/* Q 표기 (current_quarter 있을 때만) */}
            {match.current_quarter != null && (
              <span className="ml-0.5 text-[10px] font-normal" style={{ color: "var(--color-text-muted)" }}>
                Q{match.current_quarter}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            // LIVE 인디케이터: 상태 시맨틱 변수 + 온에어 스타일 펄스 (2026-05-02)
            // animate-pulse → live-air-dot (외곽 ring 이 퍼지는 방송 온에어 스타일)
            // 모바일에서는 미니스코어가 자리 차지 → LIVE 라벨은 PC 만 (sm:flex 로 노출)
            <span
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: "var(--color-status-live)" }}
            >
              <span
                className="w-2 h-2 rounded-full live-air-dot"
                style={{ backgroundColor: "var(--color-status-live)" }}
              />
              LIVE
            </span>
          )}
          {/* 상태 라벨: 라이브 외 상태 (예정/종료)에서만 표시 — 빨간 LIVE 펄스와 회색 LIVE 텍스트 중복 제거 (2026-05-02) */}
          {!isLive && (
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {STATUS_LABEL[match.status] ?? match.status}
            </span>
          )}
          {/* 2026-05-05 PR4 — 운영자 전용 "임시 번호" 버튼 (W1 매치 한정 jersey override).
              isAdmin = admin-check 통과 시에만 노출. 모달 열면 home/away players 전달. */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setJerseyModalOpen(true)}
              aria-label="매치 임시 번호 등록"
              title="매치 임시 번호 등록 (운영자)"
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-[var(--color-elevated)]"
              style={{
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span className="material-symbols-outlined text-base">tune</span>
              <span>임시 번호</span>
            </button>
          )}
          {/* 모바일: 아이콘만 (텍스트 생략) — 헤더 공간 보호 */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setJerseyModalOpen(true)}
              aria-label="매치 임시 번호 등록"
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-[var(--color-elevated)]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span className="material-symbols-outlined text-base">tune</span>
            </button>
          )}
          {/* 헤더 우측: 테마 토글만 유지. 새로고침 버튼은 스코어카드 가운데로 이동 (Phase 1) */}
          <ThemeToggle />
        </div>
      </div>

      {/* 2026-05-09 라이브 YouTube 영상 — hero 위 / 모바일 sticky / PC PIP 분기.
          5/10 사용자 결정:
            모바일 (≤767px) = sticky top-14 (헤더 아래 고정 / 큰 사이즈)
            PC (≥768px) = 영상 viewport 안 = 일반 위치 / viewport 밖 = 우측 하단 PIP (YouTube 스타일)
          z-index 레이어:
            AppNav z-50 > PIP z-40 > 영상 sticky z-30 > 페이지 헤더 z-20
          bg = var(--color-background) — sticky 시 뒤 콘텐츠 비침 0
          영상 등록 매치만 마운트 (미등록 → hero 그대로 노출 / placeholder 0 — 사용자 결정 Q11)
          75% wrapper (sm:w-3/4) 로 스코어카드와 시각 정렬. data-print-hide 로 프린트 시 숨김.
          PIP 시 wrapper 자체는 in-flow (aspect-video 로 자리 유지) + 별도 fixed wrapper 에 영상 마운트.
          iframe mount/unmount 시 라이브 영상은 현재 시점부터 재시작 (라이브 = 무관 / VOD = 처음부터). */}
      {match.youtube_video_id ? (
        <>
          <div
            ref={youtubeWrapperRef}
            data-print-hide
            className="sticky top-14 z-30 px-4 pt-3 pb-3 md:static md:z-auto"
            style={{ backgroundColor: "var(--color-background)" }}
          >
            <div className="mx-auto w-full sm:w-3/4">
              {/* PC 에서 PIP 활성 시 sentinel 자리 유지 — aspect-video 로 layout shift 0 */}
              {isPip ? (
                <div className="aspect-video w-full" />
              ) : (
                <YouTubeEmbed
                  videoId={match.youtube_video_id}
                  isLive={isLive || match.youtube_status === "manual"}
                  status={match.youtube_status ?? null}
                  isAdmin={isAdmin}
                  // PR4+PR5 — 운영자 클릭 시 모달 오픈 (수동 입력 / 자동 검색 탭)
                  onManageClick={() => setStreamModalOpen(true)}
                />
              )}
            </div>
          </div>
          {/* PIP 모드 — PC 만 (md: 노출) / fixed 우측 하단 / w-80 (320px) / shadow + rounded */}
          {isPip && !isMobile && (
            <div
              data-print-hide
              className="hidden md:block fixed bottom-4 right-4 z-40 w-80 rounded-md overflow-hidden"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}
            >
              <YouTubeEmbed
                videoId={match.youtube_video_id}
                isLive={isLive || match.youtube_status === "manual"}
                status={match.youtube_status ?? null}
                isAdmin={isAdmin}
                onManageClick={() => setStreamModalOpen(true)}
              />
            </div>
          )}
        </>
      ) : (
        // 영상 미등록 + 운영자만 노출되는 등록 CTA — 일반 회원에게는 영역 0 (사용자 결정 Q11)
        // CTA 는 sticky X (영상 등록 후에만 sticky 의미 있음) — 일반 위치
        isAdmin && (
          <div data-print-hide className="px-4 pt-3 pb-3">
            <div className="mx-auto w-full sm:w-3/4 flex flex-col gap-2">
              {/* 2026-05-10 PR-C — 자동 등록 폴링 활성 시 운영자에게만 노출되는 안내 토스트.
                  매치 시작 ±10분 윈도우 안 + 영상 미등록 시 30초 간격으로 BDR 채널 자동 검색 실행.
                  80점+ 후보 발견 시 자동 INSERT 후 fetchMatch refetch → 임베드 즉시 노출. */}
              {autoRegisterActive && (
                <div
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-xs"
                  style={{
                    backgroundColor: "var(--color-card)",
                    color: "var(--color-text-secondary)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "4px",
                  }}
                >
                  <span
                    className="material-symbols-outlined animate-spin"
                    style={{ fontSize: 16, animationDuration: "1.5s" }}
                  >
                    sync
                  </span>
                  <span>BDR 채널 자동 검색 중... (시작 시각 ±10분 윈도우 / 30초 간격)</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setStreamModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--color-elevated)",
                  color: "var(--color-text-primary)",
                  border: "1px dashed var(--color-border)",
                  borderRadius: "4px",
                }}
                aria-label="YouTube 영상 등록 (운영자 전용)"
              >
                <span className="material-symbols-outlined text-base">smart_display</span>
                YouTube 영상 등록
              </button>
            </div>
          </div>
        )
      )}

      {/* 2026-05-09 라이브 매치 카드 패널 — 영상 sticky 아래 + hero 위 (사용자 결정 Q5=A).
          API 응답 same_day_matches 가 0~1건이면 Rail 자체 null (영역 hidden) — Rail 내부 가드.
          영상 등록 매치 = 영상 sticky 아래에 자연 in-flow / 영상 미등록 + 운영자 = CTA 아래.
          폴링 3초마다 자동 갱신 — 라이브 매치 진행에 따라 카드 상태 라벨/점수 즉시 동기화. */}
      <LiveMatchCardRail matches={match.same_day_matches ?? []} tournamentName={match.tournament_name} />

      {/* 2026-05-05 PR4 — 매치 임시 jersey 번호 운영자 모달 (W1).
          isAdmin = false 면 마운트 안 함. fetchMatch refetch 로 새 jersey 반영. */}
      {isAdmin && match && (
        <MatchJerseyOverrideModal
          isOpen={jerseyModalOpen}
          onClose={() => setJerseyModalOpen(false)}
          tournamentId={match.tournament_id}
          matchId={match.id}
          homeTeam={{ id: match.home_team.id, name: match.home_team.name }}
          awayTeam={{ id: match.away_team.id, name: match.away_team.name }}
          homePlayers={match.home_players.map((p) => ({
            id: p.id,
            jersey_number: p.jersey_number,
            name: p.name,
            team_id: p.team_id,
          }))}
          awayPlayers={match.away_players.map((p) => ({
            id: p.id,
            jersey_number: p.jersey_number,
            name: p.name,
            team_id: p.team_id,
          }))}
          onSuccess={() => {
            // 저장 성공 시 라이브 페이지 즉시 refetch — 새 jersey 반영
            fetchMatch();
          }}
        />
      )}

      {/* 2026-05-09 PR4+PR5 — 매치 YouTube 영상 운영자 모달 (수동 입력 / 자동 검색 2탭).
          isAdmin = false 면 마운트 안 함. POST/DELETE 후 fetchMatch refetch 로 라이브 페이지 영상 즉시 반영. */}
      {isAdmin && match && (
        <MatchYouTubeModal
          isOpen={streamModalOpen}
          onClose={() => setStreamModalOpen(false)}
          tournamentId={match.tournament_id}
          matchId={match.id}
          currentVideoId={match.youtube_video_id ?? null}
          currentStatus={match.youtube_status ?? null}
          onSave={() => {
            // 저장/삭제 성공 시 라이브 페이지 즉시 refetch — youtube_video_id 새로 반영
            fetchMatch();
          }}
        />
      )}

      {/* 스코어 카드 — 티빙 중계 스타일 (5단 가로 레이아웃)
          [홈 로고+팀명] [홈 점수] [중앙] [원정 점수] [원정 로고+팀명]
          이미지 목표대로 각 요소가 독립 영역으로 가로 나열되어야 점수가 가운데에 큼직하게 보임 */}
      <div className="px-4 py-6">
        {/* 스코어카드 + 쿼터 테이블 75% 래퍼: 모바일 100% / sm(640+) 이상에서 75% 폭 중앙.
            이유: 데스크톱에서 스코어카드/쿼터 테이블이 너무 넓게 퍼져 정보 밀도가 떨어지므로
            좌우를 좁혀 시선 집중시키기. 박스스코어는 이 래퍼 밖이라 영향 없음. */}
        <div className="mx-auto w-full sm:w-3/4">
        {/* 스코어카드 레이아웃 분기 (2026-04-15 모바일 2행 재설계)
            - 모바일(sm 미만): 2행 — Row1 [홈팀 | 원정팀], Row2 [홈점수 | 중앙정보 | 원정점수]
            - 데스크톱(sm 이상): 기존 5단 — [홈팀 | 홈점수 | 중앙정보 | 원정점수 | 원정팀]
            이유: 모바일에서 점수·중앙정보가 좁은 가로폭에 짓눌려 판독성이 떨어지는 문제를 해결.
            가로폭이 넉넉한 데스크톱은 한 줄로 보는 편이 시선 흐름이 자연스러워 기존 유지. */}

        {/* 모바일 전용: 2행 레이아웃 */}
        <div className="sm:hidden">
          {/* Row1: 홈팀 / 원정팀 좌우 배치. justify-around로 여백 균등 */}
          <div className="flex items-center justify-around mb-4">
            <TeamBlock team={match.home_team} isHome logoSize={48} />
            <TeamBlock team={match.away_team} isHome={false} logoSize={48} />
          </div>
          {/* Row2: 점수 - 중앙정보 - 점수. justify-between로 양 끝 정렬 */}
          <div className="flex items-center justify-between gap-2 px-2">
            <ScoreDisplay value={match.home_score} flash={homeFlash} />
            <CenterInfoBlock match={match} isLive={isLive} />
            <ScoreDisplay value={match.away_score} flash={awayFlash} />
          </div>
        </div>

        {/* 데스크톱 전용: 기존 5단 가로 레이아웃 */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <TeamBlock team={match.home_team} isHome logoSize={72} />
          <ScoreDisplay value={match.home_score} flash={homeFlash} />
          <CenterInfoBlock match={match} isLive={isLive} />
          <ScoreDisplay value={match.away_score} flash={awayFlash} />
          <TeamBlock team={match.away_team} isHome={false} logoSize={72} />
        </div>

        {/* 쿼터별 점수 — 테이블 폭 100% 롤백 (mx-auto w-3/4 제거).
            진행 쿼터(파랑) / 미도래(회색+"-") 시각 분기는 isLive일 때만 적용.
            종료 경기는 모든 쿼터가 완료이므로 실제 값/기본색 그대로 노출 */}
        {quarters.some((q) => q.home > 0 || q.away > 0) && (
          <div
            className="mt-4 rounded-md overflow-hidden"
            style={{ backgroundColor: "var(--color-card)" }}
          >
            {/* 쿼터 테이블: text-lg(18px) 상속. 좌우 끝 px-2, 쿼터 셀 px-1로 축소 */}
            <table className="w-full text-lg">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  <th className="py-2 px-2 text-left font-normal" style={{ color: "var(--color-text-muted)" }}>팀</th>
                  {quarters.map((q, idx) => {
                    // 라이브 중일 때만 진행/미도래 판정. current_quarter는 1-based (1=Q1).
                    const currentIdx = isLive && match.current_quarter ? match.current_quarter - 1 : -1;
                    const isCurrent = isLive && idx === currentIdx;
                    const isFuture = isLive && match.current_quarter != null && idx > currentIdx;
                    // 진행: info 파랑 + semibold / 미도래: muted 회색 / 나머지: 기본 muted
                    const color = isCurrent
                      ? "var(--color-info)"
                      : "var(--color-text-muted)";
                    return (
                      <th
                        key={q.label}
                        className={`py-2 px-1 text-center ${isCurrent ? "font-semibold" : "font-normal"} ${isFuture ? "opacity-60" : ""}`}
                        style={{ color }}
                      >
                        {q.label}
                      </th>
                    );
                  })}
                  <th className="py-2 px-2 text-center font-semibold" style={{ color: "var(--color-text-secondary)" }}>합계</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  {/* 팀명 셀: 명시 text-base 제거 → 부모 text-lg 상속 */}
                  <td className="py-2 px-2 truncate max-w-[60px]" style={{ color: "var(--color-text-primary)" }}>
                    {match.home_team.name}
                  </td>
                  {quarters.map((q, idx) => {
                    const currentIdx = isLive && match.current_quarter ? match.current_quarter - 1 : -1;
                    const isCurrent = isLive && idx === currentIdx;
                    const isFuture = isLive && match.current_quarter != null && idx > currentIdx;
                    // 미도래 셀 값은 "-" 로 표시 (실제 DB값이 0이어도 시각적으로 "아직 안 함" 구분)
                    const cellValue = isFuture ? "-" : q.home;
                    const color = isCurrent
                      ? "var(--color-info)"
                      : isFuture
                        ? "var(--color-text-muted)"
                        : "var(--color-text-primary)";
                    return (
                      <td
                        key={q.label}
                        className={`py-2 px-1 text-center ${isCurrent ? "font-semibold" : ""}`}
                        style={{ color }}
                      >
                        {cellValue}
                      </td>
                    );
                  })}
                  {/* 합계: 메인 점수와 동일하게 text-primary로 통일 (font-bold로 강조) */}
                  <td
                    className="py-2 px-2 text-center font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {match.home_score}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 truncate max-w-[60px]" style={{ color: "var(--color-text-primary)" }}>
                    {match.away_team.name}
                  </td>
                  {quarters.map((q, idx) => {
                    const currentIdx = isLive && match.current_quarter ? match.current_quarter - 1 : -1;
                    const isCurrent = isLive && idx === currentIdx;
                    const isFuture = isLive && match.current_quarter != null && idx > currentIdx;
                    const cellValue = isFuture ? "-" : q.away;
                    const color = isCurrent
                      ? "var(--color-info)"
                      : isFuture
                        ? "var(--color-text-muted)"
                        : "var(--color-text-primary)";
                    return (
                      <td
                        key={q.label}
                        className={`py-2 px-1 text-center ${isCurrent ? "font-semibold" : ""}`}
                        style={{ color }}
                      >
                        {cellValue}
                      </td>
                    );
                  })}
                  <td
                    className="py-2 px-2 text-center font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {match.away_score}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        </div>
        {/* /75% 래퍼 닫기 */}
      </div>

      {/* 2026-05-09: 라이브 YouTube 영상은 hero 위로 이동 (사용자 결정 5/9). 위쪽 헤더 sticky 다음 마운트 위치 참조 */}

      {/* 2026-04-16: 박스스코어 화면용 영역 (data-print-hide로 프린트 시 숨김)
          기존 BoxScoreTable은 쿼터 필터 버튼과 함께 화면 표시만 담당 */}
      <div data-print-hide className="px-4 pb-4 space-y-4">
        {[
          { team: match.home_team, players: match.home_players },
          { team: match.away_team, players: match.away_players },
        ].map(({ team, players }) => (
          <div key={team.id}>
            {/* 박스스코어 테이블 — hasOT: OT 쿼터가 존재하면 쿼터 필터 버튼에 OT 버튼도 노출
                hasQuarterEventDetail: false면 쿼터 필터 활성 시 안내 배너 + MIN/+- 외 스탯 "-" 처리 */}
            <BoxScoreTable
              teamName={team.name}
              color={team.color}
              players={players}
              hasOT={quarters.some((q) => q.label.startsWith("OT"))}
              hasQuarterEventDetail={match.has_quarter_event_detail}
            />
          </div>
        ))}
      </div>

      {/* 2026-04-16: 프린트 전용 영역 — 화면에서는 hidden, 프린트에서만 block
          printOptions 기반으로 (팀 × 기간) 조합마다 PrintBoxScoreTable을 렌더.
          다이얼로그가 열리기 전에는 printSections가 [] 이므로 빈 컨테이너. */}
      <div id="box-score-print-area" className="hidden print:block">
        {printSections.map((sec, i) => {
          const isHome = sec.team === "home";
          const team = isHome ? match.home_team : match.away_team;
          const players = isHome ? match.home_players : match.away_players;
          const score = isHome ? match.home_score : match.away_score;
          const opponentName = isHome ? match.away_team.name : match.home_team.name;
          const opponentScore = isHome ? match.away_score : match.home_score;
          return (
            <PrintBoxScoreTable
              key={`${sec.team}-${sec.filter}-${i}`}
              teamName={team.name}
              color={team.color}
              players={players}
              opponentName={opponentName}
              score={score}
              opponentScore={opponentScore}
              quarters={quarters}
              tournamentName={match.tournament_name}
              roundName={match.round_name}
              isHome={isHome}
              filter={sec.filter}
              filterLabel={sec.label}
              hasQuarterEventDetail={match.has_quarter_event_detail}
            />
          );
        })}
      </div>

      {/* 2026-04-15: 4/11~12 경기 클럭 부정확 안내 — 두 팀 박스스코어 모두 아래 한 번만 표시
          프린트 시에는 숨김(data-print-hide). 좌측 정렬 + 아이콘 + muted 색상 */}
      {isLegacyClockIssue && (
        <div
          data-print-hide
          className="px-4 pb-2 flex items-start gap-2 text-sm italic"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="material-symbols-outlined text-base leading-tight">info</span>
          <span>경기시간 집계 시스템 오류로 경기시간이 정확하지 않은 부분 양해바랍니다.</span>
        </div>
      )}

      {/* 프린트 / PDF 저장 버튼 — 2026-05-10 분리 (사용자 결정).
          프린트 = window.print() OS 다이얼로그 (PC 권장 / 모바일 미작동)
          PDF 저장 = html2canvas + jspdf 자동 다운로드 (모바일/PC 모두) — 섹션별 페이지 분할 + 양식 유지 */}
      <div data-print-hide className="px-4 pb-8 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setPrintMode("system");
            setPrintDialogOpen(true);
          }}
          className="py-3 rounded-xl text-base font-semibold border transition-colors flex items-center justify-center gap-2"
          style={{
            color: "var(--color-text-primary)",
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <span className="material-symbols-outlined text-lg">print</span>
          프린트
        </button>
        <button
          onClick={() => {
            setPrintMode("pdf");
            setPrintDialogOpen(true);
          }}
          className="py-3 rounded-xl text-base font-semibold border transition-colors flex items-center justify-center gap-2"
          style={{
            color: "var(--color-text-primary)",
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
          PDF 저장
        </button>
      </div>

      {/* 2026-04-16: 프린트 옵션 다이얼로그
          data-print-hide로 프린트 시에는 렌더 안 됨 (화면 전용 UI) */}
      <div data-print-hide>
        <PrintOptionsDialog
          open={printDialogOpen}
          onClose={() => setPrintDialogOpen(false)}
          onConfirm={(opts) => setPrintOptions(opts)}
          homeTeamName={match.home_team.name}
          awayTeamName={match.away_team.name}
          hasOT={quarters.some((q) => q.label.startsWith("OT"))}
          hasQuarterEventDetail={match.has_quarter_event_detail}
        />
      </div>

      {/* 2026-05-10 — PDF 생성 중 loading overlay.
          사유: setIsPrinting(true) 가 원본 화면에 양식 적용 → 사용자에게 깜빡임 보임.
          overlay 가 화면 전체 가림 → 사용자는 "PDF 생성 중..." 안내만 봄 (깜빡임 미인지).
          z-index: AppNav (z-50) 위 → inline style 60 (Tailwind 표준 z 클래스 외 / arbitrary 아님). */}
      {pdfGenerating && (
        <div
          data-print-hide
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 60,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(2px)",
          }}
          aria-busy="true"
          aria-label="PDF 생성 중"
        >
          <div
            className="rounded-lg px-6 py-5 flex flex-col items-center gap-3"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              minWidth: 200,
            }}
          >
            <span
              className="material-symbols-outlined animate-spin"
              style={{ fontSize: 32, color: "var(--color-accent)", animationDuration: "1.2s" }}
            >
              sync
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              PDF 생성 중...
            </span>
          </div>
        </div>
      )}

      {/* PBP 로그 */}
      {match.play_by_plays && match.play_by_plays.length > 0 && (
        <PbpSection match={match} />
      )}

      {/* 하단 갱신 정보 — fixed bar. backdrop-blur 유지, 배경은 CSS 변수 + rgba로 직접 합성 */}
      <div
        className="fixed bottom-0 left-0 right-0 backdrop-blur px-4 py-2 flex items-center justify-between border-t"
        style={{
          // backgroundColor만으로 테마별 투명도를 표현하기 어려우므로 --color-card를 그대로 + 블러에 맡김
          backgroundColor: "color-mix(in srgb, var(--color-background) 90%, transparent)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* 하단 정보 text-xs → text-sm */}
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          🏀 BDR Live Score
        </span>
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {lastUpdated
            ? `${lastUpdated.getHours().toString().padStart(2, "0")}:${lastUpdated.getMinutes().toString().padStart(2, "0")} 기준`
            : "로딩중..."}
        </span>
      </div>
    </div>
  );
}

function BoxScoreTable({
  teamName,
  color,
  players,
  hasOT = false,
  hasQuarterEventDetail = true,
}: {
  teamName: string;
  color: string;
  players: PlayerRow[];
  // 2026-04-15: OT 쿼터 존재 여부 — 쿼터 필터 버튼에 "OT" 버튼 노출 분기
  hasOT?: boolean;
  // 2026-04-16: 쿼터별 이벤트 상세 스탯 존재 여부
  // false + quarterFilter !== "all" → 안내 배너 + MIN/+- 외 스탯 "-" 처리
  hasQuarterEventDetail?: boolean;
}) {
  // 2026-04-15: 쿼터 필터 state — "all" | "1" | "2" | "3" | "4" | "5"(OT1)
  // 이유: 사용자가 특정 쿼터만 집중해서 보고 싶을 때 활용. "all"은 전체 합계(기본값).
  const [quarterFilter, setQuarterFilter] = useState<string>("all");

  if (!players || players.length === 0) return null;

  // 2026-04-16: 이벤트 없는 경기에서 쿼터 필터를 활성화한 경우 — MIN/+-만 유효, 나머지 스탯은 "-"로 표시
  // 이유: Flutter "최종 스탯 입력 모드"는 match_events 없이 MatchPlayerStat.quarterStatsJson의 min/pm만 저장.
  // 쿼터별 PTS/FG/REB 등은 데이터가 없으므로 0 대신 "-"로 표시해야 사용자 혼동이 없다.
  const showPlaceholder = !hasQuarterEventDetail && quarterFilter !== "all";

  // 2026-04-15: 쿼터 필터 헬퍼
  // 이유: "all"이면 원본 그대로, 특정 쿼터면 해당 쿼터의 quarter_stats만 노출.
  // 해당 쿼터에 기록이 없는 선수는 모든 스탯을 0으로 치환(UI에서 0%·- 표시됨).
  // dnp 필드는 원본 유지(쿼터 필터와 무관하게 "등록됐으나 출전 전무"한 선수 구분).
  const applyQuarterFilter = (p: PlayerRow): PlayerRow => {
    if (quarterFilter === "all") return p;
    const qs = p.quarter_stats?.[quarterFilter];
    if (!qs) {
      return { ...p, min: 0, min_seconds: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0 };
    }
    return {
      ...p,
      min: qs.min, min_seconds: qs.min_seconds, pts: qs.pts,
      fgm: qs.fgm, fga: qs.fga, tpm: qs.tpm, tpa: qs.tpa, ftm: qs.ftm, fta: qs.fta,
      oreb: qs.oreb, dreb: qs.dreb, reb: qs.reb,
      ast: qs.ast, stl: qs.stl, blk: qs.blk, to: qs.to, fouls: qs.fouls,
      plus_minus: qs.plus_minus,
    };
  };

  // 0414: DNP(NBA: Did Not Play) 분리 — 테이블 본체는 출전 선수만, 하단에 DNP 리스트
  // 2026-04-15: activePlayers에만 쿼터 필터 적용 (DNP 판정은 원본 p.dnp로 유지)
  const activePlayers = players.filter((p) => !p.dnp).map(applyQuarterFilter);
  const dnpPlayers = players.filter((p) => p.dnp);
  // 2026-04-15: 정렬 규칙 변경 — PTS 내림차순 → 스타팅 5 상단 + 백넘버 오름차순
  // 이유: "전체" 탭과 쿼터 필터 탭 모두 동일한 순서를 유지하고, 로스터 감각으로 보이게 하기 위함.
  // 쿼터 필터는 applyQuarterFilter가 스탯만 치환하므로 is_starter/jersey_number는 원본 유지 → 자연스럽게 동작.
  const sortByStarterJersey = (a: PlayerRow, b: PlayerRow) => {
    // 1) 스타팅이 상단 (true가 false보다 앞)
    const aS = a.is_starter ? 1 : 0;
    const bS = b.is_starter ? 1 : 0;
    if (aS !== bS) return bS - aS;
    // 2) 같은 그룹 내에서는 jersey_number 오름차순 (null은 마지막)
    const aJ = a.jersey_number ?? 999;
    const bJ = b.jersey_number ?? 999;
    return aJ - bJ;
  };
  const sorted = [...activePlayers].sort(sortByStarterJersey);
  // DNP 리스트도 동일 규칙 적용 (스타팅 DNP는 드물지만 일관성 유지)
  dnpPlayers.sort(sortByStarterJersey);
  const pct = (made: number, attempted: number) =>
    attempted > 0 ? Math.round((made / attempted) * 100) : 0;

  // 2026-04-15: PTS 셀 — 팀색은 좌측 띠(3px)로만 표기하고 숫자는 텍스트 기본색을 사용
  // 라이트 모드에서 흰색에 가까운 팀 컬러가 안 보이는 문제(NBA.com 스타일로 해결)
  // 셀 높이의 60%만 차지하도록 상하 20% 여백, 반올림 2px로 살짝 부드럽게
  const PtsTeamBar = () => (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        top: "20%",
        bottom: "20%",
        width: "3px",
        backgroundColor: color,
        borderRadius: "2px",
      }}
    />
  );

  return (
    <div className="print-team-table-wrap">
      <div className="flex items-center gap-2 mb-2 print:hidden flex-wrap">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        {/* 팀명 헤더: text-sm → text-lg (두 단계 확대) */}
        <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {teamName}
        </span>
        {/* 2026-04-15: 쿼터 필터 버튼 그룹 — 전체/1Q/2Q/3Q/4Q/OT(있을 때만)
            이유: 특정 쿼터의 스탯만 보고 싶을 때 사용. print에서는 숨김(모든 쿼터 정보는 별도 방식으로).
            선택된 버튼은 primary 배경+흰색 글자, 나머지는 surface 배경+muted 글자로 시각 구분. */}
        <div className="ml-auto flex items-center gap-1 print:hidden">
          {[
            { key: "all", label: "전체" },
            { key: "1", label: "1Q" },
            { key: "2", label: "2Q" },
            { key: "3", label: "3Q" },
            { key: "4", label: "4Q" },
            ...(hasOT ? [{ key: "5", label: "OT" }] : []),
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setQuarterFilter(key)}
              className="px-2 py-1 text-xs rounded transition-colors"
              style={{
                backgroundColor: quarterFilter === key ? "var(--color-primary)" : "var(--color-surface)",
                color: quarterFilter === key ? "#ffffff" : "var(--color-text-muted)",
                border: `1px solid ${quarterFilter === key ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* 2026-04-16: 이벤트 없는 경기 + 쿼터 필터 활성 안내 배너
          이유: 데이터가 없어 PTS/FG 등이 "-"로 표시되는 이유를 사용자에게 명확히 알림.
          프린트 시에는 숨김(print:hidden). */}
      {showPlaceholder && (
        <div
          className="mb-2 px-3 py-2 rounded text-xs print:hidden"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="material-symbols-outlined align-middle text-base mr-1">info</span>
          이 경기는 실시간 이벤트 기록 없이 최종 스탯만 입력되어, 쿼터별 세부 스탯(PTS/FG/REB 등)은 표시되지 않습니다. MIN과 +/-만 유효합니다.
        </div>
      )}
      <div
        className="rounded-md overflow-hidden"
        style={{ backgroundColor: "var(--color-card)" }}
      >
        <div className="overflow-x-auto">
          {/* 박스스코어 전체 text-xs → text-base (두 단계 확대) */}
          <table className="w-full text-base">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                {/* sticky 셀: 라이트/다크 모두 card 색으로 배경 칠해줘야 투명해지지 않음 */}
                <th
                  className="py-2 px-3 text-left font-normal sticky left-0 z-10 print:static print:bg-transparent"
                  style={{ backgroundColor: "var(--color-card)" }}
                >#</th>
                <th
                  className="py-2 px-1 text-left font-normal sticky left-8 z-10 min-w-[70px] print:static print:bg-transparent"
                  style={{ backgroundColor: "var(--color-card)" }}
                >이름</th>
                {/* 2026-04-15: MIN 복원 — 이름 바로 다음, PTS 앞 */}
                <th className="py-2 px-0.5 text-center font-normal">MIN</th>
                <th className="py-2 px-0.5 text-center font-semibold" style={{ color: "var(--color-text-primary)" }}>PTS</th>
                <th className="py-2 px-0.5 text-center font-normal">FG</th>
                <th className="py-2 px-0.5 text-center font-normal">FG%</th>
                <th className="py-2 px-0.5 text-center font-normal">3P</th>
                <th className="py-2 px-0.5 text-center font-normal">3P%</th>
                <th className="py-2 px-0.5 text-center font-normal">FT</th>
                <th className="py-2 px-0.5 text-center font-normal">FT%</th>
                <th className="py-2 px-0.5 text-center font-normal">OR</th>
                <th className="py-2 px-0.5 text-center font-normal">DR</th>
                <th className="py-2 px-0.5 text-center font-normal">REB</th>
                <th className="py-2 px-0.5 text-center font-normal">AST</th>
                <th className="py-2 px-0.5 text-center font-normal">STL</th>
                <th className="py-2 px-0.5 text-center font-normal">BLK</th>
                <th className="py-2 px-0.5 text-center font-normal">TO</th>
                <th className="py-2 px-0.5 text-center font-normal">PF</th>
                <th className="py-2 px-0.5 text-center font-normal">+/-</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b"
                  style={{
                    borderColor: "var(--color-border)",
                    // 얼룩무늬: 짝수 행은 투명, 홀수 행은 중립 회색 알파
                    backgroundColor: i % 2 === 0 ? ROW_EVEN_BG : ZEBRA_BG,
                  }}
                >
                  {/* sticky 셀은 zebra 배경을 bg-inherit로 따라가게 함 */}
                  <td
                    className="py-2 px-3 sticky left-0 z-10 bg-inherit print:static print:bg-transparent"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {p.jersey_number ?? "-"}
                  </td>
                  <td
                    className="py-2 px-1 sticky left-8 z-10 bg-inherit min-w-[70px] truncate max-w-[70px] print:static print:bg-transparent print:max-w-none"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {p.name}
                  </td>
                  {/* MIN — muted 색으로 살짝 약하게 (스탯만큼 강조 X) */}
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>
                    {formatGameClock(p.min_seconds ?? p.min * 60)}
                  </td>
                  {/* PTS — 팀색 좌측 띠 + 텍스트 기본색. 부모 td에 relative 필수
                      2026-04-16: showPlaceholder 시 "-"만 표시하고 팀색 띠는 생략 (PTS 숫자가 없어 띠의 의미가 없음) */}
                  <td
                    className="py-2 px-0.5 text-center font-bold relative"
                    style={{ color: showPlaceholder ? "var(--color-text-muted)" : "var(--color-text-primary)" }}
                  >
                    {!showPlaceholder && <PtsTeamBar />}
                    {showPlaceholder ? "-" : p.pts}
                  </td>
                  {/* 이하 스탯 셀들 — showPlaceholder 시 모두 "-" (MIN과 +/-만 예외) */}
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {showPlaceholder ? "-" : `${p.fgm}/${p.fga}`}
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {showPlaceholder ? "-" : `${pct(p.fgm, p.fga)}%`}
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {showPlaceholder ? "-" : `${p.tpm}/${p.tpa}`}
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {showPlaceholder ? "-" : `${pct(p.tpm, p.tpa)}%`}
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {showPlaceholder ? "-" : `${p.ftm}/${p.fta}`}
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {showPlaceholder ? "-" : `${pct(p.ftm, p.fta)}%`}
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : p.oreb}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : p.dreb}</td>
                  <td className="py-2 px-0.5 text-center font-semibold" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : p.reb}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : p.ast}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : p.stl}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : p.blk}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : p.to}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : p.fouls}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {p.plus_minus != null ? (p.plus_minus > 0 ? `+${p.plus_minus}` : p.plus_minus) : "-"}
                  </td>
                </tr>
              ))}
              {/* 2026-04-15: DNP 행 재구조화 — colSpan 제거, NBA 스타일로 셀마다 채움.
                  MIN 셀에 "DNP" 표시, 나머지 스탯 16개는 모두 "-" */}
              {dnpPlayers.map((p, i) => (
                <tr
                  key={`dnp-${p.id}`}
                  className="border-b"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: (sorted.length + i) % 2 === 0 ? ROW_EVEN_BG : ZEBRA_BG,
                  }}
                >
                  <td
                    className="py-2 px-3 sticky left-0 z-10 bg-inherit print:static print:bg-transparent"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {p.jersey_number ?? "-"}
                  </td>
                  <td
                    className="py-2 px-1 sticky left-8 z-10 bg-inherit min-w-[70px] truncate max-w-[70px] print:static print:bg-transparent print:max-w-none"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {p.name}
                  </td>
                  {/* MIN 셀에 "DNP" — text-xs + semibold + muted 색으로 시각적 구분 */}
                  <td
                    className="py-2 px-0.5 text-center text-xs font-semibold tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    DNP
                  </td>
                  {/* 나머지 16개 스탯 셀은 모두 "-" */}
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                </tr>
              ))}
              {/* TOTAL 합산 행 — 출전 선수만 집계 (DNP 제외) */}
              {(() => {
                const total = activePlayers.reduce(
                  (acc, p) => ({
                    min: acc.min + p.min,
                    min_seconds: acc.min_seconds + (p.min_seconds ?? p.min * 60),
                    pts: acc.pts + p.pts,
                    fgm: acc.fgm + p.fgm,
                    fga: acc.fga + p.fga,
                    tpm: acc.tpm + p.tpm,
                    tpa: acc.tpa + p.tpa,
                    ftm: acc.ftm + p.ftm,
                    fta: acc.fta + p.fta,
                    oreb: acc.oreb + p.oreb,
                    dreb: acc.dreb + p.dreb,
                    reb: acc.reb + p.reb,
                    ast: acc.ast + p.ast,
                    stl: acc.stl + p.stl,
                    blk: acc.blk + p.blk,
                    to: acc.to + p.to,
                    fouls: acc.fouls + p.fouls,
                  }),
                  { min: 0, min_seconds: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fouls: 0 }
                );
                // TOTAL 행: sticky 셀에 elevated 배경을 지정해 라이트/다크 모두 투명해지지 않음
                const totalStickyBg = "var(--color-elevated)";
                return (
                  <tr
                    className="border-t font-semibold print-total-row"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: TOTAL_ROW_BG,
                    }}
                  >
                    <td
                      className="py-2 px-3 sticky left-0 z-10 print:static print:bg-transparent"
                      style={{ color: "var(--color-text-secondary)", backgroundColor: totalStickyBg }}
                    />
                    <td
                      className="py-2 px-1 sticky left-8 z-10 print:static print:bg-transparent"
                      style={{ color: "var(--color-text-primary)", backgroundColor: totalStickyBg }}
                    >TOTAL</td>
                    {/* MIN — TOTAL 행은 secondary 색으로 강조 */}
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                      {formatGameClock(total.min_seconds)}
                    </td>
                    {/* PTS — TOTAL 행도 동일하게 팀색 좌측 띠 + 텍스트 기본색
                        2026-04-16: showPlaceholder 시 "-"만 표시, 팀색 띠 생략 */}
                    <td
                      className="py-2 px-0.5 text-center relative"
                      style={{ color: showPlaceholder ? "var(--color-text-muted)" : "var(--color-text-primary)" }}
                    >
                      {!showPlaceholder && <PtsTeamBar />}
                      {showPlaceholder ? "-" : total.pts}
                    </td>
                    {/* 나머지 TOTAL 스탯 셀 — showPlaceholder 시 모두 "-" */}
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : `${total.fgm}/${total.fga}`}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : `${pct(total.fgm, total.fga)}%`}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : `${total.tpm}/${total.tpa}`}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : `${pct(total.tpm, total.tpa)}%`}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : `${total.ftm}/${total.fta}`}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : `${pct(total.ftm, total.fta)}%`}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : total.oreb}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : total.dreb}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : total.reb}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : total.ast}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : total.stl}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : total.blk}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : total.to}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{showPlaceholder ? "-" : total.fouls}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>-</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const PBP_COLLAPSED_COUNT = 10;

function PbpSection({ match }: { match: MatchData }) {
  const [expanded, setExpanded] = useState(false);
  const pbps = match.play_by_plays;
  const visiblePbps = expanded ? pbps : pbps.slice(0, PBP_COLLAPSED_COUNT);
  const hasMore = pbps.length > PBP_COLLAPSED_COUNT;

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center gap-2 mb-3">
        {/* PBP 섹션 헤더: text-sm → text-lg (두 단계 확대) */}
        <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Play-by-Play</span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>({pbps.length})</span>
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--color-elevated)" }}
      >
        <div className="overflow-x-auto">
          {/* PBP 테이블 전체 text-xs → text-base (두 단계 확대) */}
          <table className="w-full text-base">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                <th className="py-2 px-2 text-left font-normal w-[60px]">시간</th>
                <th className="py-2 px-2 text-center font-normal w-[32px]">팀</th>
                <th className="py-2 px-2 text-center font-normal w-[32px]">#</th>
                <th className="py-2 px-2 text-left font-normal">행동</th>
                <th className="py-2 px-2 text-center font-normal w-[60px]">점수</th>
              </tr>
            </thead>
            <tbody>
              {visiblePbps.map((pbp, i) => {
                const isHome = pbp.team_id === match.home_team.id;
                const teamColor = isHome ? match.home_team.color : match.away_team.color;
                const actionLabel = ACTION_LABEL[pbp.action_type] ?? pbp.action_type;

                return (
                  <tr
                    key={pbp.id}
                    className="border-b"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: i % 2 === 0 ? ROW_EVEN_BG : ZEBRA_BG,
                    }}
                  >
                    <td className="py-1.5 px-2 whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>{getQuarterLabel(pbp.quarter)}</span>{" "}
                      {formatGameClock(pbp.game_clock_seconds)}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <div
                        className="w-2.5 h-2.5 rounded-full mx-auto"
                        style={{ backgroundColor: teamColor }}
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center" style={{ color: "var(--color-text-secondary)" }}>
                      {pbp.jersey_number ?? "-"}
                    </td>
                    <td className="py-1.5 px-2" style={{ color: "var(--color-text-primary)" }}>
                      {actionLabel}
                    </td>
                    <td className="py-1.5 px-2 text-center whitespace-nowrap" style={{ color: "var(--color-text-secondary)" }}>
                      <span style={{ color: match.home_team.color }}>{pbp.home_score_at_time}</span>
                      <span className="mx-0.5" style={{ color: "var(--color-text-muted)" }}>:</span>
                      <span style={{ color: match.away_team.color }}>{pbp.away_score_at_time}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2.5 text-xs transition-colors border-t"
            style={{
              color: "var(--color-text-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            {expanded ? "접기" : `더보기 (${pbps.length - PBP_COLLAPSED_COUNT}건)`}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 2026-04-16: 프린트 옵션 다이얼로그
 * - 팀 enabled 체크 → 누적/쿼터별 개별 체크
 * - 기본값: 양 팀 + 누적만 체크
 * - onConfirm 호출 시 옵션을 상위로 전달 → useEffect가 window.print() 호출
 */
function PrintOptionsDialog({
  open,
  onClose,
  onConfirm,
  homeTeamName,
  awayTeamName,
  hasOT,
  hasQuarterEventDetail,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (opts: PrintOptions) => void;
  homeTeamName: string;
  awayTeamName: string;
  hasOT: boolean;
  hasQuarterEventDetail: boolean;
}) {
  // 옵션 state — 기본값은 양 팀 + 누적만 체크
  const [opts, setOpts] = useState<PrintOptions>(() => ({
    home: { enabled: true, total: true, quarters: {} },
    away: { enabled: true, total: true, quarters: {} },
  }));

  if (!open) return null;

  // 프린트 버튼 비활성 조건: 양 팀 모두 enabled=false (아무것도 출력할 팀 없음)
  const nothingSelected = !opts.home.enabled && !opts.away.enabled;

  return (
    <div
      // 오버레이 클릭 시 닫힘 (stopPropagation 적용된 내부 모달은 제외)
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          박스스코어 프린트 옵션
        </h3>

        {/* 홈팀 섹션 */}
        <TeamSection
          label={homeTeamName}
          opt={opts.home}
          onChange={(next) => setOpts({ ...opts, home: next })}
          hasOT={hasOT}
        />

        <div className="h-3" />

        {/* 원정팀 섹션 */}
        <TeamSection
          label={awayTeamName}
          opt={opts.away}
          onChange={(next) => setOpts({ ...opts, away: next })}
          hasOT={hasOT}
        />

        {/* 이벤트 없는 경기에서 쿼터 선택 시 주의 안내 */}
        {!hasQuarterEventDetail && (
          <p
            className="mt-3 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            이 경기는 실시간 이벤트 기록이 없어 쿼터별 세부 스탯이 "-"로 표시됩니다.
          </p>
        )}

        {/* 프린트 방향 안내 — Hancom PDF 등 외부 가상 프린터는 @page CSS를 무시하므로 사용자 개입 필요 */}
        <div
          className="mt-3 p-2 rounded text-xs flex items-start gap-2"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: "16px", color: "var(--color-primary)" }}>warning</span>
          <div className="space-y-1">
            <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
              PDF 저장이 세로로 나올 때
            </p>
            <p>
              권장: 프린터를 <strong>&quot;PDF로 저장&quot;</strong>(Chrome 기본)으로 선택하세요.
              Hancom PDF 등 외부 PDF 드라이버는 가로 설정을 무시합니다.
            </p>
            <p>
              또는 프린트 대화상자에서 <strong>인쇄 방향 → 가로</strong>로 직접 변경하세요.
            </p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(opts)}
            disabled={nothingSelected}
            className="px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
            }}
          >
            프린트
          </button>
        </div>
      </div>
    </div>
  );
}

/** 팀별 옵션 섹션: enabled 체크 + 누적/쿼터 체크박스 */
function TeamSection({
  label,
  opt,
  onChange,
  hasOT,
}: {
  label: string;
  opt: TeamPrintOption;
  onChange: (next: TeamPrintOption) => void;
  hasOT: boolean;
}) {
  // 쿼터 토글 — 현재 상태를 반전시켜 onChange
  const toggleQuarter = (q: string) => {
    const next = { ...opt.quarters, [q]: !opt.quarters[q] };
    onChange({ ...opt, quarters: next });
  };

  // 쿼터 버튼 목록 — OT는 hasOT일 때만 노출
  const quarterKeys = ["1", "2", "3", "4", ...(hasOT ? ["5"] : [])];

  return (
    <div
      className="rounded border p-3"
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* 팀 enabled 체크 */}
      <label
        className="flex items-center gap-2 font-medium"
        style={{ color: "var(--color-text-primary)" }}
      >
        <input
          type="checkbox"
          checked={opt.enabled}
          onChange={(e) => onChange({ ...opt, enabled: e.target.checked })}
        />
        {label}
      </label>
      {/* enabled일 때만 하위 옵션 노출 */}
      {opt.enabled && (
        <div className="mt-2 ml-5 flex flex-wrap gap-x-4 gap-y-1">
          <label
            className="flex items-center gap-1 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <input
              type="checkbox"
              checked={opt.total}
              onChange={(e) => onChange({ ...opt, total: e.target.checked })}
            />
            누적 기록
          </label>
          {quarterKeys.map((q) => (
            <label
              key={q}
              className="flex items-center gap-1 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <input
                type="checkbox"
                checked={!!opt.quarters[q]}
                onChange={() => toggleQuarter(q)}
              />
              {q === "5" ? "OT" : `${q}Q`}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 2026-04-16: 프린트 전용 박스스코어 테이블
 * - 화면용 BoxScoreTable과 달리 쿼터 필터 버튼은 없음 (filter prop으로 고정)
 * - 페이지 상단에 "팀명 vs 상대 — 누적 기록 / 1쿼터 등" 라벨을 크게 표시
 * - filter !== "all" + hasQuarterEventDetail=false → MIN/+- 외 모든 스탯 "-"
 */
function PrintBoxScoreTable({
  teamName,
  color,
  players,
  opponentName,
  score,
  opponentScore,
  quarters,
  tournamentName,
  roundName,
  isHome,
  filter,
  filterLabel,
  hasQuarterEventDetail,
}: {
  teamName: string;
  color: string;
  players: PlayerRow[];
  opponentName: string;
  score: number;
  opponentScore: number;
  quarters: Array<{ label: string; home: number; away: number }>;
  tournamentName: string;
  roundName: string | null;
  isHome: boolean;
  filter: string;          // "all" | "1"~"5"
  filterLabel: string;     // "누적 기록" / "1쿼터" / "OT"
  hasQuarterEventDetail: boolean;
}) {
  if (!players || players.length === 0) return null;

  // 쿼터 필터 시 이벤트 기록이 없으면 플레이스홀더 처리
  const showPlaceholder = filter !== "all" && !hasQuarterEventDetail;

  // 화면용과 동일한 applyQuarterFilter 로직 — 스탯만 치환, dnp는 원본 유지
  const applyQuarterFilter = (p: PlayerRow): PlayerRow => {
    if (filter === "all") return p;
    const qs = p.quarter_stats?.[filter];
    if (!qs) {
      return { ...p, min: 0, min_seconds: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0 };
    }
    return {
      ...p,
      min: qs.min, min_seconds: qs.min_seconds, pts: qs.pts,
      fgm: qs.fgm, fga: qs.fga, tpm: qs.tpm, tpa: qs.tpa, ftm: qs.ftm, fta: qs.fta,
      oreb: qs.oreb, dreb: qs.dreb, reb: qs.reb,
      ast: qs.ast, stl: qs.stl, blk: qs.blk, to: qs.to, fouls: qs.fouls,
      plus_minus: qs.plus_minus,
    };
  };

  // 활성/DNP 분리 + 스타팅 우선 백넘버 오름차순 정렬 (화면용과 동일)
  const activePlayers = players.filter((p) => !p.dnp).map(applyQuarterFilter);
  const dnpPlayers = players.filter((p) => p.dnp);
  const sortByStarterJersey = (a: PlayerRow, b: PlayerRow) => {
    const aS = a.is_starter ? 1 : 0;
    const bS = b.is_starter ? 1 : 0;
    if (aS !== bS) return bS - aS;
    const aJ = a.jersey_number ?? 999;
    const bJ = b.jersey_number ?? 999;
    return aJ - bJ;
  };
  const sorted = [...activePlayers].sort(sortByStarterJersey);
  dnpPlayers.sort(sortByStarterJersey);

  const pct = (made: number, attempted: number) =>
    attempted > 0 ? Math.round((made / attempted) * 100) : 0;

  // TOTAL 합산 (활성 선수만)
  const total = activePlayers.reduce(
    (acc, p) => ({
      min: acc.min + p.min,
      min_seconds: acc.min_seconds + (p.min_seconds ?? p.min * 60),
      pts: acc.pts + p.pts,
      fgm: acc.fgm + p.fgm,
      fga: acc.fga + p.fga,
      tpm: acc.tpm + p.tpm,
      tpa: acc.tpa + p.tpa,
      ftm: acc.ftm + p.ftm,
      fta: acc.fta + p.fta,
      oreb: acc.oreb + p.oreb,
      dreb: acc.dreb + p.dreb,
      reb: acc.reb + p.reb,
      ast: acc.ast + p.ast,
      stl: acc.stl + p.stl,
      blk: acc.blk + p.blk,
      to: acc.to + p.to,
      fouls: acc.fouls + p.fouls,
    }),
    { min: 0, min_seconds: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fouls: 0 }
  );

  // color 참조 방지용 (변수 경고 회피) — 현재 프린트에서는 색 없이 검정 잉크 사용
  void color;

  return (
    <div className="print-team-page">
      {/* 페이지 상단 헤더 — 팀명 + 상대 + 기간 라벨(빨강 강조) + 토너먼트/라운드명 */}
      <div data-print-show className="hidden">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "6px" }}>
          <div>
            <span style={{ fontSize: "16px", fontWeight: 800 }}>{teamName}</span>
            <span style={{ fontSize: "12px", marginLeft: "8px", color: "#666" }}>vs {opponentName}</span>
            {/* 기간 라벨 — 빨강 강조 (BDR primary #E31B23) */}
            <span style={{ fontSize: "14px", marginLeft: "12px", fontWeight: 700, color: "#E31B23" }}>
              — {filterLabel}
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", color: "#666" }}>{tournamentName}</span>
            {roundName && <span style={{ fontSize: "10px", color: "#999", marginLeft: "6px" }}>{roundName}</span>}
          </div>
        </div>
        {/* 쿼터별 점수 요약 */}
        <div style={{ display: "flex", gap: "12px", fontSize: "9px", color: "#666", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "2px" }}>
          <span style={{ fontWeight: 700, color: "#000", fontSize: "12px" }}>{score} : {opponentScore}</span>
          {quarters.map((q) => {
            const myScore = isHome ? q.home : q.away;
            const oppScore = isHome ? q.away : q.home;
            return <span key={q.label}>{q.label} {myScore}-{oppScore}</span>;
          })}
        </div>
      </div>

      {/* 테이블 본체 */}
      <div className="print-team-table-wrap">
        <table className="w-full">
          <thead>
            <tr>
              <th>#</th>
              <th style={{ textAlign: "left" }}>이름</th>
              <th>MIN</th>
              <th>PTS</th>
              <th>FG</th>
              <th>FG%</th>
              <th>3P</th>
              <th>3P%</th>
              <th>FT</th>
              <th>FT%</th>
              <th>OR</th>
              <th>DR</th>
              <th>REB</th>
              <th>AST</th>
              <th>STL</th>
              <th>BLK</th>
              <th>TO</th>
              <th>PF</th>
              <th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id}>
                <td>{p.jersey_number ?? "-"}</td>
                <td style={{ textAlign: "left" }}>{p.name}</td>
                <td>{formatGameClock(p.min_seconds ?? p.min * 60)}</td>
                <td style={{ fontWeight: 700 }}>{showPlaceholder ? "-" : p.pts}</td>
                <td>{showPlaceholder ? "-" : `${p.fgm}/${p.fga}`}</td>
                <td>{showPlaceholder ? "-" : `${pct(p.fgm, p.fga)}%`}</td>
                <td>{showPlaceholder ? "-" : `${p.tpm}/${p.tpa}`}</td>
                <td>{showPlaceholder ? "-" : `${pct(p.tpm, p.tpa)}%`}</td>
                <td>{showPlaceholder ? "-" : `${p.ftm}/${p.fta}`}</td>
                <td>{showPlaceholder ? "-" : `${pct(p.ftm, p.fta)}%`}</td>
                <td>{showPlaceholder ? "-" : p.oreb}</td>
                <td>{showPlaceholder ? "-" : p.dreb}</td>
                <td>{showPlaceholder ? "-" : p.reb}</td>
                <td>{showPlaceholder ? "-" : p.ast}</td>
                <td>{showPlaceholder ? "-" : p.stl}</td>
                <td>{showPlaceholder ? "-" : p.blk}</td>
                <td>{showPlaceholder ? "-" : p.to}</td>
                <td>{showPlaceholder ? "-" : p.fouls}</td>
                <td>{p.plus_minus != null ? (p.plus_minus > 0 ? `+${p.plus_minus}` : p.plus_minus) : "-"}</td>
              </tr>
            ))}
            {/* DNP 행 — MIN에 "DNP", 나머지 "-" */}
            {dnpPlayers.map((p) => (
              <tr key={`dnp-${p.id}`}>
                <td>{p.jersey_number ?? "-"}</td>
                <td style={{ textAlign: "left" }}>{p.name}</td>
                <td style={{ fontWeight: 600 }}>DNP</td>
                <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
                <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
              </tr>
            ))}
            {/* TOTAL 행 — print-total-row 클래스로 상단 굵은 선 + bold */}
            <tr className="print-total-row">
              <td></td>
              <td style={{ textAlign: "left" }}>TOTAL</td>
              <td>{formatGameClock(total.min_seconds)}</td>
              <td>{showPlaceholder ? "-" : total.pts}</td>
              <td>{showPlaceholder ? "-" : `${total.fgm}/${total.fga}`}</td>
              <td>{showPlaceholder ? "-" : `${pct(total.fgm, total.fga)}%`}</td>
              <td>{showPlaceholder ? "-" : `${total.tpm}/${total.tpa}`}</td>
              <td>{showPlaceholder ? "-" : `${pct(total.tpm, total.tpa)}%`}</td>
              <td>{showPlaceholder ? "-" : `${total.ftm}/${total.fta}`}</td>
              <td>{showPlaceholder ? "-" : `${pct(total.ftm, total.fta)}%`}</td>
              <td>{showPlaceholder ? "-" : total.oreb}</td>
              <td>{showPlaceholder ? "-" : total.dreb}</td>
              <td>{showPlaceholder ? "-" : total.reb}</td>
              <td>{showPlaceholder ? "-" : total.ast}</td>
              <td>{showPlaceholder ? "-" : total.stl}</td>
              <td>{showPlaceholder ? "-" : total.blk}</td>
              <td>{showPlaceholder ? "-" : total.to}</td>
              <td>{showPlaceholder ? "-" : total.fouls}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
