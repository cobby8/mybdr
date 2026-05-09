/**
 * 2026-05-09 PR2 — 라이브 페이지 매치 카드 1건 (네이버 농구 라이브 패턴).
 *
 * 도메인 컨텍스트 (Dev/live-match-cards-2026-05-09.md §3-2):
 *   같은 날 / 같은 대회 다른 매치 1건의 진행 상태 + 점수 표시 카드.
 *   클릭 시 `<Link href={"/live/" + matchId}>` Next routing 으로 페이지 전환.
 *
 * 사용자 결정 (Q1~Q9):
 *   - Q3=A 시간순 정렬 (정렬은 Rail 책임 / 본 컴포넌트는 단일 카드 렌더만)
 *   - Q6=A "1쿼터" 한국어 라벨 (NBA Q1 표기 X / 라이브 페이지 hero 와 일관)
 *   - 현재 매치 = accent border highlight (`is_current=true`)
 *   - 라이브 매치 = red ping 애니메이션 (`is_live=true`)
 *
 * 13 디자인 룰 준수:
 *   - var(--color-*) 토큰만 (핑크/살몬/코랄 ❌)
 *   - Tailwind arbitrary `[var(--*)]` 0 — inline style + 일반 Tailwind class만 (errors.md 2026-05-09 룰)
 *   - lucide-react ❌ — Material Symbols Outlined만 사용
 *   - pill 9999px ❌ / rounded-md (4px) 통일
 *   - 44px+ 터치 영역 (카드 자체 ~140~200px × ~120px = 충분)
 *   - 정사각형 원형 = 50% (팀 로고 placeholder만)
 *
 * 회귀 차단:
 *   - DB schema 변경 0 / 신규 import 0 (Next Link 만)
 *   - 라이브 페이지 기존 영역 (영상/hero/박스/PBP/minutes) 영향 0
 */

"use client";

import Link from "next/link";
import { memo } from "react";

// 라이브 매치 카드 1건 데이터 — `/api/live/[id]` 응답 same_day_matches[i] 와 동일 shape
// snake_case 키는 apiSuccess 자동 변환 룰에 따라 클라 수신 형태 그대로
export interface LiveMatchCardData {
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
  // 2026-05-09 사용자 결정: 카드 우측 상단에 대회 명칭 표시 (같은 대회 N건이지만 명시적 표시)
  tournament_name?: string | null;
}

interface LiveMatchCardProps {
  match: LiveMatchCardData;
}

/**
 * 매치 상태 → 좌측 라벨 + 강조 분기.
 *
 * 룰 (사용자 결정 Q6=A 한국어 친화):
 *   - 라이브 + 1~4쿼터 → "1쿼터" / "2쿼터" / "3쿼터" / "4쿼터"
 *   - 라이브 + 5쿼터+ → "연장" / "연장2"
 *   - 라이브 (쿼터 정보 0) → "경기 중"
 *   - 종료 (ended_at != null) → "경기종료"
 *   - 예정 (그 외) → "HH:MM" 시각
 *
 * highlight = 라이브 매치 시 accent 색 + ping (`is_live=true` 시 빨간 점)
 */
function getStatusLabel(match: LiveMatchCardData): {
  text: string;
  isLiveBadge: boolean;
} {
  if (match.is_live) {
    if (match.current_quarter !== null) {
      const q = match.current_quarter;
      const text = q <= 4 ? `${q}쿼터` : q === 5 ? "연장" : `연장${q - 4}`;
      return { text, isLiveBadge: true };
    }
    // status="halftime" 별도 안내 — current_quarter 없을 때만
    if (match.status === "halftime") return { text: "하프타임", isLiveBadge: true };
    if (match.status === "warmup") return { text: "경기 준비중", isLiveBadge: true };
    return { text: "경기 중", isLiveBadge: true };
  }
  if (match.is_completed) {
    return { text: "경기종료", isLiveBadge: false };
  }
  // 예정 매치 → 시각 (HH:MM 로컬)
  if (match.scheduled_at) {
    const d = new Date(match.scheduled_at);
    if (!isNaN(d.getTime())) {
      const HH = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return { text: `${HH}:${mm}`, isLiveBadge: false };
    }
  }
  return { text: "예정", isLiveBadge: false };
}

/**
 * 팀명 약칭 — 좁은 카드 폭 (~140~200px) 내 가독성 우선.
 *
 * 룰 (5/9 사용자 결정 — 한글 8자까지 그대로):
 *   - 영문 대문자/숫자 약어 (2~4자) 그대로 사용 ("BDR", "NYK", "KCC")
 *   - 한글 토큰 N개 → 각 토큰 첫 글자 N개 (최대 8자)
 *   - 영문 단어 N개 → 각 단어 머릿글자 (최대 4자)
 *   - 빈/단일 단어 → 그대로 사용 (8자 이내 / 초과 시 truncate)
 *   - 카드 폭 안에서 truncate CSS 가 자동 처리
 */
function getTeamShort(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  // 영문 약어 즉시 반환
  if (/^[A-Z0-9]{2,4}$/.test(trimmed)) return trimmed;
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 1) {
    // 단일 단어 → 8자 이내 그대로 ("우아한스포츠" 6자 / "닥터바스켓" 5자 / "크로스오버" 5자 모두 보존)
    return trimmed.length <= 8 ? trimmed : trimmed.slice(0, 8);
  }
  // 다중 토큰 → 각 토큰 머릿글자 (최대 4자)
  return tokens.map((t) => t.charAt(0)).join("").slice(0, 4);
}

/**
 * 팀 로고 placeholder — 로고 URL 없을 때 이니셜로 fallback.
 * 정사각형 원형 = border-radius 50% (BDR-current 13룰 §C-10 / pill 9999px 회피).
 */
function TeamLogoMini({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        className="w-6 h-6 object-cover"
        style={{ borderRadius: "50%" }}
      />
    );
  }
  // 로고 없을 때 이니셜 — 카드 내부 다른 영역 색상과 충돌 회피
  const initial = getTeamShort(name).slice(0, 2);
  return (
    <span
      className="w-6 h-6 flex items-center justify-center text-[10px] font-bold"
      style={{
        borderRadius: "50%",
        backgroundColor: "var(--color-elevated)",
        color: "var(--color-text-secondary)",
      }}
      aria-label={name}
    >
      {initial}
    </span>
  );
}

function LiveMatchCardInner({ match }: LiveMatchCardProps) {
  const { text: statusText, isLiveBadge } = getStatusLabel(match);
  const showScore = match.is_live || match.is_completed;
  // 종료 매치 = 승팀 강조 (Bold). 동점이면 양쪽 동일.
  const homeWin = match.is_completed && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWin = match.is_completed && (match.away_score ?? 0) > (match.home_score ?? 0);

  return (
    <Link
      href={`/live/${match.id}`}
      // 카드 자체 = a 태그. 가로 스크롤 컨테이너 안에서 snap-start 적용.
      // pointer-events: 카드 클릭 시 라이브 페이지 이동 (soft navigation).
      // hover/focus = 살짝 elevated 톤 (BDR 토큰).
      className="flex-shrink-0 block transition-opacity hover:opacity-90 focus-visible:opacity-90"
      style={{
        // 모바일 폭 ~140px / 데스크탑 ~180px 가변 (Rail 의 모바일 4 분기점은 부모 grid/flex 가 결정)
        width: "160px",
        // 현재 매치 = accent border highlight (사용자 결정 — Q3 정렬 시간순 + highlight 별도)
        // 비현재 매치 = 일반 border
        border: match.is_current
          ? "2px solid var(--color-accent)"
          : "1px solid var(--color-border)",
        borderRadius: "4px",
        backgroundColor: "var(--color-card)",
        // scroll-snap 정렬 — Rail 가로 스크롤 시 카드 중앙 정렬
        scrollSnapAlign: "center",
      }}
      aria-label={`${match.home_team.name} vs ${match.away_team.name} 라이브 페이지로 이동`}
    >
      {/* 2026-05-09 사용자 결정 (재구성): 좌상단 대회명 / 좌하단 라운드 / 우하단 시간·상태 */}
      <div className="px-3 py-1.5 flex flex-col gap-1.5">
        {/* 상단 row — 좌측 정렬 대회 명칭 + 우측 라이브 ping (라이브 시만) */}
        {(match.tournament_name || match.is_live) && (
          <div className="flex items-center justify-between gap-2">
            {match.tournament_name ? (
              <span
                className="truncate text-[10px] font-medium"
                style={{ color: "var(--color-text-muted)" }}
                title={match.tournament_name}
              >
                {match.tournament_name}
              </span>
            ) : (
              <span />
            )}
            {match.is_live && (
              <span className="relative flex w-2 h-2 flex-shrink-0" aria-label="라이브 진행 중">
                <span
                  className="absolute inset-0 animate-ping opacity-75"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    borderRadius: "50%",
                  }}
                />
                <span
                  className="relative w-2 h-2"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    borderRadius: "50%",
                  }}
                />
              </span>
            )}
          </div>
        )}

        {/* 홈 row — 로고 + 약칭 + 점수 (라이브/종료 시만). 승팀 = font-bold */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <TeamLogoMini logoUrl={match.home_team.logo_url} name={match.home_team.name} />
            <span
              className={`text-sm truncate ${homeWin ? "font-bold" : "font-medium"}`}
              style={{ color: "var(--color-text-primary)" }}
              title={match.home_team.name}
            >
              {getTeamShort(match.home_team.name)}
            </span>
          </div>
          {showScore && (
            <span
              className={`text-sm tabular-nums ${homeWin ? "font-bold" : "font-medium"}`}
              style={{
                color: homeWin
                  ? "var(--color-text-primary)"
                  : match.is_completed
                  ? "var(--color-text-muted)"
                  : "var(--color-text-primary)",
              }}
            >
              {match.home_score ?? 0}
            </span>
          )}
        </div>

        {/* 어웨이 row — 동일 구조 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <TeamLogoMini logoUrl={match.away_team.logo_url} name={match.away_team.name} />
            <span
              className={`text-sm truncate ${awayWin ? "font-bold" : "font-medium"}`}
              style={{ color: "var(--color-text-primary)" }}
              title={match.away_team.name}
            >
              {getTeamShort(match.away_team.name)}
            </span>
          </div>
          {showScore && (
            <span
              className={`text-sm tabular-nums ${awayWin ? "font-bold" : "font-medium"}`}
              style={{
                color: awayWin
                  ? "var(--color-text-primary)"
                  : match.is_completed
                  ? "var(--color-text-muted)"
                  : "var(--color-text-primary)",
              }}
            >
              {match.away_score ?? 0}
            </span>
          )}
        </div>

        {/* 하단 row — 좌측 라운드명 / 우측 시간·상태 (5/9 사용자 결정 — 시간/상태 우측 하단 이동) */}
        {(match.round_name || statusText) && (
          <div className="flex items-center justify-between gap-2 text-xs">
            {match.round_name ? (
              <span
                className="truncate"
                style={{ color: "var(--color-text-muted)" }}
                title={match.round_name}
              >
                {match.round_name}
              </span>
            ) : (
              <span />
            )}
            <span
              className="flex-shrink-0 font-medium"
              style={{
                color: isLiveBadge
                  ? "var(--color-accent)"
                  : match.is_completed
                  ? "var(--color-text-muted)"
                  : "var(--color-text-secondary)",
              }}
            >
              {statusText}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * memo — 같은 props 일 때 리렌더 회피.
 * 라이브 페이지 폴링 (3초/회) 시 매치 카드 N건 중 변경 없는 카드는 리렌더 X.
 */
export const LiveMatchCard = memo(LiveMatchCardInner);
