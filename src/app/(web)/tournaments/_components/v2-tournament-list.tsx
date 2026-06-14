"use client";

/* ============================================================
 * V2TournamentList — UA1 시안 박제판 (Phase 1C-1, 2026-05-28)
 *
 * 왜 이 컴포넌트가 있는가:
 *  - tournaments-content.tsx 의 "리스트 뷰" 카드만 BDR-current/Tournaments.jsx (UA1)
 *    시안의 tnl-card 패턴으로 교체. 캘린더/주간 뷰 토글, 필터 로직, 페이지네이션,
 *    /api/web/tournaments 호출은 기존 그대로 유지.
 *  - 상위(tournaments-content.tsx)는 이미 필터·페이지네이션 처리가 끝난
 *    paginatedTournaments 배열만 내려주면 됨. photoMap 도 동일 전달.
 *
 * 시안 대비:
 *  - 시안 hero/sticky filter bar 는 tournaments-content.tsx 에서 처리
 *  - 본 파일은 "탭(chip) + 카드 그리드" 만 박제
 *  - 카드 구조: poster(grad) → body(div chips + status + name + meta + cap or champ) → foot(host + fee)
 *  - 4탭 (전체/접수중/진행중/종료) 유지 — 시안 5탭 중 "내 지역" 은 운영 FloatingFilterPanel 의 지역필터로 대체
 *
 * 데이터 원칙:
 *  - API 응답(TournamentFromApi) 그대로 사용. 새 필드 요구 ❌
 *  - 시안의 champion/mvp/org 필드는 API 에 없음 → 카드 footer 에서 폴백 (host 영역 = 종별 라벨 / champion 라인 = 종료 카드만 D-1d 라벨)
 * ============================================================ */

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants/divisions";
import { effectiveTournamentStatus } from "@/lib/constants/tournament-status";
import { formatShortDate } from "@/lib/utils/format-date";
import "./tournaments.css"; // tnl-* 클래스 — 시안 박제 CSS

// tournaments-content 에서 가져오는 것과 동일 — import 순환 피하려고 로컬에 재선언
interface TournamentFromApi {
  id: string;
  name: string;
  format: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  entry_fee: string | null;
  city: string | null;
  venue_name: string | null;
  max_teams: number | null;
  team_count: number;
  divisions: string[];
  categories: Record<string, boolean>;
  division_tiers: string[];
  // 마감임박 계산용 (API 응답에 있을 수도 있음 — 옵션)
  registration_end_at?: string | null;
}

// 4상태 탭 (운영 유지 — 2026-05-03 사용자 결정)
//  - "마감임박" 탭 제거 → 카드 뱃지 (registration_end_at 기준 7일 이내)
//  - "접수예정" 탭 제거 → 프리미엄 큐 (listTournaments 에서도 제외)
//  - 시안의 "내 지역" 탭은 운영 FloatingFilterPanel 의 지역필터로 대체
export const V2_MATCH_TABS = [
  "전체",
  "접수중",
  "진행중",
  "종료",
] as const;
export type V2MatchTab = (typeof V2_MATCH_TABS)[number];

// 카드 상태 (deriveV2Status 반환) — 탭과 분리
type CardStatus = "접수중" | "마감임박" | "진행중" | "접수예정" | "종료";

// 시안 STATUS_META 와 동일한 톤 매핑 — Tournaments.jsx L17~22
const STATUS_META: Record<
  CardStatus,
  { label: string; tone: "accent" | "navy" | "mute" }
> = {
  접수중: { label: "모집 중", tone: "accent" },
  마감임박: { label: "마감 임박", tone: "accent" },
  진행중: { label: "본선 진행", tone: "navy" },
  접수예정: { label: "예정", tone: "mute" },
  종료: { label: "종료", tone: "mute" },
};

/**
 * 개별 대회 카드 status → 5상태 매핑
 *
 * 왜 유틸로 분리?
 *  - 상위 탭 필터와 카드 배지가 동일한 규칙을 써야 하므로 단일 소스로 유지.
 *  - 마감임박은 DB status 하나로 결정 안 됨 → registration_end_at 기준 동적 계산.
 */
export function deriveV2Status(t: TournamentFromApi): CardStatus {
  // 종료일(end_date, 없으면 start_date)이 지난 in_progress/published 등은
  // 실효 상태로 "completed" 보정 후 분기 (끝난 대회가 진행중/접수중으로 안 보이게).
  const st = effectiveTournamentStatus(t.status, t.start_date, t.end_date).toLowerCase();

  // 종료
  if (["completed", "ended", "closed", "cancelled"].includes(st)) return "종료";
  // 진행중
  if (["in_progress", "live", "ongoing", "group_stage"].includes(st)) return "진행중";
  // 접수예정 (아직 접수 전)
  if (["draft", "upcoming"].includes(st)) return "접수예정";

  // 접수중/마감임박 분기 — registration_end_at 기준 7일 이내면 마감임박
  const regStatuses = [
    "registration", "registration_open", "active", "published",
    "open", "opening_soon", "registration_closed",
  ];
  if (regStatuses.includes(st)) {
    // registration_closed 는 이미 마감 직전 상태
    if (st === "registration_closed") return "마감임박";

    // registration_end_at 있으면 7일 이내 여부 계산
    if (t.registration_end_at) {
      const endAt = new Date(t.registration_end_at);
      if (!isNaN(endAt.getTime())) {
        const diffMs = endAt.getTime() - Date.now();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 7) return "마감임박";
      }
    }
    return "접수중";
  }

  // 알 수 없는 상태 — 접수예정으로 안전 폴백
  return "접수예정";
}

/* ---------- 시안 hue 결정 (대회명 해시 → 0~360°) ----------
   왜 hash 인가:
    - 시안은 mock data 의 poster_hue 를 직접 받음
    - 운영 API 에는 그 필드 없음 → 대회명 기반 deterministic hash 로
      같은 대회는 항상 같은 hue → 컬러 일관성 보장
*/
function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

/* ---------- 포스터 (시안 Poster — Tournaments.jsx L53~63) ---------- */
function Poster({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  // 사진 있으면 배경 이미지로 우선 표시
  if (photoUrl) {
    return (
      <div
        className="tnl-poster"
        style={{
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="tnl-poster__name">{name}</div>
      </div>
    );
  }

  const hue = hueFromName(name);
  return (
    <div
      className="tnl-poster"
      style={{
        background: `linear-gradient(155deg, hsl(${hue} 65% 32%) 0%, hsl(${hue} 70% 18%) 100%)`,
      }}
    >
      <div className="tnl-poster__grid" />
      <div className="tnl-poster__name">{name}</div>
    </div>
  );
}

/* ---------- 진행바 (시안 ProgressBar — Tournaments.jsx L65~100) ---------- */
function ProgressBar({
  now,
  max,
  deadlineDays,
  completed,
}: {
  now: number;
  max: number;
  deadlineDays: number | null;
  completed: boolean;
}) {
  if (completed) {
    return (
      <div className="tnl-cap">
        <div className="tnl-cap__bar" aria-hidden="true">
          <div className="tnl-cap__fill is-done" style={{ width: "100%" }} />
        </div>
        <div className="tnl-cap__meta">
          <span className="tnl-cap__count">{now}팀 참가</span>
          <span className="tnl-cap__deadline is-end">대회 종료</span>
        </div>
      </div>
    );
  }
  // max 가 0 이면 진행률 표시 불가 → 0% 표시 (시안과 동일하게 처리)
  const pct = max > 0 ? Math.min(100, Math.round((now / max) * 100)) : 0;
  const full = max > 0 && now >= max;
  const urgent = deadlineDays !== null && deadlineDays <= 3;
  return (
    <div className="tnl-cap">
      <div className="tnl-cap__bar" aria-hidden="true">
        <div
          className={"tnl-cap__fill" + (full ? " is-full" : "")}
          style={{ width: pct + "%" }}
        />
      </div>
      <div className="tnl-cap__meta">
        <span className="tnl-cap__count">
          {max > 0 ? (
            <>
              <b>{now}</b>/{max}팀
              {full && <span className="tnl-cap__chip">정원 마감</span>}
            </>
          ) : (
            // max 미설정 시 — "N팀 참가" 형식으로 폴백
            <>
              <b>{now}</b>팀
            </>
          )}
        </span>
        {deadlineDays !== null && (
          <span
            className={"tnl-cap__deadline" + (urgent ? " is-urgent" : "")}
          >
            {deadlineDays <= 0 ? "오늘 마감" : `마감 D-${deadlineDays}`}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- 참가비 (시안 FeeText — Tournaments.jsx L113~117) ---------- */
function FeeText({ fee }: { fee: string | null }) {
  // 운영 API entry_fee 는 string 단일값 — 시안의 min/max range 는 단일값으로 폴백
  const n = fee ? Number(fee) : 0;
  if (!n || n === 0) return <span className="tnl-fee is-free">무료</span>;
  return <span className="tnl-fee">{n.toLocaleString()}원</span>;
}

/* ---------- 개별 대회 카드 (시안 Card — Tournaments.jsx L119~172) ---------- */
function V2TournamentCard({
  tournament: t,
  photoUrl,
}: {
  tournament: TournamentFromApi;
  photoUrl?: string | null;
}) {
  const v2Status = deriveV2Status(t);
  const meta = STATUS_META[v2Status];
  const completed = v2Status === "종료";

  // 마감일까지 D-day (registration_end_at 우선, 없으면 start_date 폴백)
  // 왜: 시안은 t.apply_deadline 사용. 운영 API 는 registration_end_at 또는 start_date.
  const deadlineSrc = t.registration_end_at ?? t.start_date;
  const deadlineDays = deadlineSrc
    ? Math.ceil(
        (new Date(deadlineSrc).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;

  // 디비전 칩 — 시안은 t.divisions (string[]) / 운영은 division_tiers 또는 divisions 사용
  // 우선순위: division_tiers > divisions (단순 라벨)
  const divList =
    t.division_tiers && t.division_tiers.length > 0
      ? t.division_tiers
      : t.divisions ?? [];

  // 종별 라벨 (host 영역 fallback — 시안의 org.name 자리)
  const categoryEntries = Object.entries(t.categories ?? {}).filter(
    ([, v]) => v === true,
  );
  const categoryLabel =
    categoryEntries
      .map(([k]) => CATEGORIES[k as keyof typeof CATEGORIES]?.label ?? k)
      .filter(Boolean)[0] ?? null;
  // 종별 이니셜 (host avatar fallback — 시안 org.avatar 자리)
  const hostAvatar = categoryLabel ? categoryLabel.charAt(0) : "B";

  // 날짜 라인 (시안 dateLine — 같은 날이면 단일 / 아니면 range)
  const dateLine = (() => {
    if (!t.start_date) return "일정 미정";
    if (!t.end_date || t.end_date === t.start_date) {
      return formatShortDate(t.start_date);
    }
    return `${formatShortDate(t.start_date)} – ${formatShortDate(t.end_date)}`;
  })();

  // 장소 — venue_name 우선, 없으면 city
  const venue = t.venue_name ?? t.city ?? "장소 미정";

  return (
    <Link
      href={`/tournaments/${t.id}`}
      prefetch={true}
      className={"tnl-card tnl-card--" + meta.tone}
      data-status={completed ? "completed" : v2Status}
    >
      {/* 포스터 영역 — photoUrl 있으면 배경 이미지 / 없으면 시안 그라디언트 */}
      <Poster name={t.name} photoUrl={photoUrl} />

      <div className="tnl-card__body">
        <header className="tnl-card__head">
          <div className="tnl-card__divs">
            {divList.slice(0, 3).map((d) => (
              <span key={d} className="tnl-div">
                {d}
              </span>
            ))}
            {divList.length > 3 && (
              <span className="tnl-div tnl-div--more">
                +{divList.length - 3}
              </span>
            )}
          </div>
          <span className={"tnl-status tnl-status--" + meta.tone}>
            <span className="tnl-status__dot" />
            {meta.label}
          </span>
        </header>

        <h3 className="tnl-card__name">{t.name}</h3>

        <dl className="tnl-card__meta">
          <div className="tnl-mi">
            <span className="ico material-symbols-outlined">event</span>
            <span>{dateLine}</span>
          </div>
          <div className="tnl-mi">
            <span className="ico material-symbols-outlined">location_on</span>
            <span>{venue}</span>
          </div>
        </dl>

        {/* 종료 카드: 시안의 champion/mvp 데이터가 API 에 없으므로 진행바(is-done) 로 폴백 */}
        <ProgressBar
          now={t.team_count}
          max={t.max_teams ?? 0}
          deadlineDays={completed ? null : deadlineDays}
          completed={completed}
        />
      </div>

      <footer className="tnl-card__foot">
        <div className="tnl-host">
          <span className="tnl-host__av">{hostAvatar}</span>
          <div className="tnl-host__txt">
            <div className="tnl-host__name">{categoryLabel ?? "BDR"}</div>
            <div className="tnl-host__role">주최</div>
          </div>
        </div>
        <FeeText fee={t.entry_fee} />
      </footer>
    </Link>
  );
}

/* ---------- 메인: 4상태 탭(chip) + 카드 그리드 ----------
   왜 탭과 그리드를 한 컴포넌트에 두는가:
    - 운영 기존 인터페이스 (activeTab/onTabChange/counts) 와 호환 유지 →
      tournaments-content.tsx 의 props 변경 최소화
    - 시안에서는 탭 chip 이 sticky filter bar 안에 있으나, 운영은 컨트롤이
      헤더 우측 / 검색·필터·뷰토글 / 본 컴포넌트 4탭으로 이미 분리되어 있음 →
      탭 chip 만 시안 .tnl-chip 시각으로 교체. 헤더의 컨트롤은 유지.
*/
interface V2TournamentListProps {
  tournaments: TournamentFromApi[];
  photoMap?: Record<string, string | null>;
  activeTab: V2MatchTab;
  onTabChange: (tab: V2MatchTab) => void;
  emptyMessage?: string;
  counts?: Partial<Record<V2MatchTab, number>>;
  onReset?: () => void; // 빈 상태에서 필터 초기화 핸들러 (시안 EmptyState 버튼)
}

export function V2TournamentList({
  tournaments,
  photoMap,
  activeTab,
  onTabChange,
  emptyMessage,
  counts,
  onReset,
}: V2TournamentListProps) {
  const shown = tournaments;

  return (
    <div>
      {/* 시안 탭 chip 패턴 — Tournaments.jsx L228~237
          .tnl-filter 의 chip 그룹만 추출해서 본 컴포넌트에 단독 배치.
          (검색·정렬은 시안에서 같은 줄에 있지만 운영에서는 헤더 우측의
          ViewToggle + TournamentsFilterComponent 가 그 역할을 함) */}
      <div className="tnl-filter" role="tablist" style={{ position: "static", borderBottom: "none", paddingTop: 0 }}>
        <div className="tnl-filter__chips">
          {V2_MATCH_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = counts?.[tab];
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-pressed={isActive}
                onClick={() => onTabChange(tab)}
                className={"tnl-chip" + (isActive ? " is-on" : "")}
              >
                {tab}
                {count !== undefined && count > 0 && (
                  <span className="tnl-chip__count">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        // 시안 EmptyState — Tournaments.jsx L174~183
        <div className="tnl-empty">
          <span className="ico material-symbols-outlined">manage_search</span>
          <div className="tnl-empty__title">
            {emptyMessage ?? "조건에 맞는 대회가 없습니다"}
          </div>
          <div className="tnl-empty__sub">
            다른 필터로 검색해보거나, 검색어를 비워보세요.
          </div>
          {onReset && (
            <button
              type="button"
              className="btn btn--accent"
              onClick={onReset}
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        // 시안 grid — Tournaments.jsx L260
        <div className="tnl-grid">
          {shown.map((t) => {
            const photoUrl =
              photoMap === undefined
                ? undefined
                : (photoMap[t.venue_name ?? t.city ?? ""] ?? null);
            return (
              <V2TournamentCard
                key={t.id}
                tournament={t}
                photoUrl={photoUrl}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
