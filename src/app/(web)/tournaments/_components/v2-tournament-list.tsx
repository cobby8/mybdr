"use client";

/* ============================================================
 * V2TournamentList — Phase 2 Match 목록 v2 재구성 (래퍼 컴포넌트)
 *
 * 왜 이 컴포넌트가 있는가:
 * 기존 tournaments-content.tsx의 "리스트 뷰" 카드만 시안(Match.jsx)
 * 의 2열 포스터 카드 + 6상태 칩으로 교체하기 위함. 캘린더/주간 뷰 토글,
 * 필터 로직, 페이지네이션, /api/web/tournaments 호출은 기존 그대로 유지.
 *
 * 상위(tournaments-content.tsx)는 이미 필터·페이지네이션 처리가 끝난
 * paginatedTournaments 배열만 내려주면 됨. photoMap도 동일 전달.
 *
 * 시안 대비:
 * - 2열 grid (모바일 1열) — 시안: `gridTemplateColumns:'repeat(2, 1fr)'`
 * - 카드 좌측: 포스터(있으면 banner_url) or accent 그라디언트 블록(140px)
 * - 카드 우측: 상태 배지 + 태그 + 제목 + 날짜/장소/참가비 + 진행바
 * - 6상태 칩: 전체/접수중/마감임박/진행중/접수예정/종료 — 시안 순서 동일
 *
 * 데이터 원칙:
 * - API 응답(TournamentFromApi)은 그대로 사용. 새 필드 요구 금지.
 * - 6상태는 DB status를 클라이언트에서 매핑 (기존 STATUS_TAB_MAP 확장)
 *   · 접수중 = registration/registration_open/active/published/open/opening_soon
 *   · 마감임박 = registration_closed  OR  접수중 + registration_end_at이 7일 이내
 *   · 진행중 = in_progress/live/ongoing/group_stage
 *   · 접수예정 = draft/upcoming
 *   · 종료 = completed/ended/closed/cancelled
 * ============================================================ */

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants/divisions";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";
import { formatShortDate } from "@/lib/utils/format-date";

// tournaments-content에서 가져오는 것과 동일 — import 순환 피하려고 로컬에 재선언
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
  // 마감임박 계산에 필요하면 옵션으로 받음(현재 API는 start_date/end_date만 내려줌)
  registration_end_at?: string | null;
}

// 4상태 탭 — 2026-05-03 사용자 결정:
// - "마감임박" 탭 제거 → 카드 뱃지로 표시 (registration_end_at 기준 7일 이내)
// - "접수예정" 탭 제거 → 프리미엄 큐 (현재 listTournaments 에서도 제외)
export const V2_MATCH_TABS = [
  "전체",
  "접수중",
  "진행중",
  "종료",
] as const;
export type V2MatchTab = (typeof V2_MATCH_TABS)[number];

// 카드 상태 (deriveV2Status 반환) — 탭과 분리 (마감임박/접수예정은 탭 X but 카드 라벨 O)
type CardStatus = "접수중" | "마감임박" | "진행중" | "접수예정" | "종료";

// 상태 배지 매핑 — 시안 L7~9 (ok=green, red=accent-red, ghost=gray, soft=blue)
const STATUS_BADGE: Record<CardStatus, { label: string; className: string }> = {
  접수중: { label: "접수중", className: "badge badge--ok" },
  마감임박: { label: "마감임박", className: "badge badge--red" },
  진행중: { label: "진행중", className: "badge badge--red" },
  접수예정: { label: "접수예정", className: "badge badge--soft" },
  종료: { label: "종료", className: "badge badge--ghost" },
};

// accent 로테이션 — 포스터 없는 카드의 그라디언트 좌측 블록 색상
// tournament-row.tsx의 Home 섹션 로테이션과 동일 톤 유지
const FALLBACK_ACCENTS = [
  "var(--accent)",             // BDR Red
  "var(--cafe-blue, #2563eb)", // blue
  "#f59e0b",                   // amber
  "#10b981",                   // emerald
];

/**
 * 개별 대회 카드 status → v2 6상태 매핑
 *
 * 왜 유틸로 분리?
 *  - 상위 탭 필터와 카드 배지가 동일한 규칙을 써야 하므로 단일 소스로 유지.
 *  - 마감임박은 DB status 하나로 결정 안 됨 → registration_end_at 기준 동적 계산.
 */
export function deriveV2Status(t: TournamentFromApi): CardStatus {
  const st = (t.status ?? "").toLowerCase();

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
    // registration_closed는 이미 마감 직전 상태
    if (st === "registration_closed") return "마감임박";

    // registration_end_at이 있으면 7일 이내 여부 계산
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

/* ---------- 포스터/그라디언트 좌측 블록 ---------- */
function PosterBlock({
  photoUrl,
  accent,
  level,
  title,
}: {
  photoUrl?: string | null;
  accent: string;
  level: string;
  title: string;
}) {
  // photoUrl === undefined: 로딩 중 (스켈레톤 펄스)
  // photoUrl === null / "": 사진 없음 → accent 그라디언트
  // photoUrl 존재: 배경 이미지
  if (photoUrl === undefined) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 148,
          background: "var(--bg-alt)",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
    );
  }

  if (photoUrl) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 148,
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }

  // 시안 L46~54: 포스터 없을 때 그라디언트 + 레벨 약어 + 제목 분해
  return (
    <div
      style={{
        background: `linear-gradient(155deg, ${accent}, ${accent}CC 50%, #000 130%)`,
        color: "#fff",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 148,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 시안의 줄무늬 오버레이 — 질감 추가 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          background: "repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 14px)",
        }}
      />
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: ".12em",
          opacity: 0.85,
          position: "relative",
        }}
      >
        {level}
      </div>
      <div style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            wordBreak: "keep-all",
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

/* ---------- 개별 대회 카드 ---------- */
function V2TournamentCard({
  tournament: t,
}: {
  tournament: TournamentFromApi;
  photoUrl?: string | null; // 호환성 유지 (호출처 변경 최소화) — 사용 X
  accent?: string;
}) {
  const v2Status = deriveV2Status(t);
  const badge = STATUS_BADGE[v2Status];

  // 종별 라벨 1개만 — 칩 역할
  const categoryLabel =
    Object.entries(t.categories ?? {})
      .filter(([, v]) => v === true)
      .map(([key]) => CATEGORIES[key as keyof typeof CATEGORIES]?.label ?? key)
      .filter(Boolean)[0] ?? null;

  // 날짜 포맷: 시작~종료일
  const dateStr = t.start_date
    ? t.end_date && t.end_date !== t.start_date
      ? `${formatShortDate(t.start_date)} ~ ${formatShortDate(t.end_date)}`
      : formatShortDate(t.start_date)
    : null;

  // D-day 계산 (시작일 기준, 미래만)
  const dDay = t.start_date
    ? Math.ceil(
        (new Date(t.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;
  const dDayLabel =
    dDay === null
      ? null
      : dDay > 0
        ? `D-${dDay}`
        : dDay === 0
          ? "D-DAY"
          : v2Status === "진행중"
            ? "진행중"
            : null;

  // 도시 (venue_name 제외 — "남양주시" 같은 단순 표기)
  const cityShort = t.city ?? null;

  // 참가비 — 라벨 제거 (숫자만)
  const hasFee = t.entry_fee && Number(t.entry_fee) > 0;
  const feeText = hasFee
    ? `${Math.round(Number(t.entry_fee) / 10000)}만원`
    : "무료";

  // 진행바 데이터
  const maxTeams = t.max_teams ?? 0;
  const progressPct =
    maxTeams > 0 ? Math.min((t.team_count / maxTeams) * 100, 100) : 0;
  const isFull = maxTeams > 0 && t.team_count >= maxTeams;

  // CTA 라벨
  const ctaLabel =
    v2Status === "접수중" || v2Status === "마감임박"
      ? "신청"
      : v2Status === "진행중"
        ? "라이브"
        : "상세";

  return (
    // 2026-05-03: 컴팩트 카드 — 좌측 포스터 제거, 1열 본문, 4행 (칩/제목/메타/CTA)
    <Link
      href={`/tournaments/${t.id}`}
      prefetch={true}
      className="card"
      style={{
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        minWidth: 0,
      }}
    >
      {/* 1행: 상태 + 디비전 칩 + D-day (우측) */}
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span className={badge.className}>{badge.label}</span>
        {categoryLabel && (
          <span className="badge badge--ghost" style={{ fontSize: 10 }}>
            {categoryLabel}
          </span>
        )}
        {dDayLabel && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              fontWeight: 700,
              color:
                v2Status === "진행중"
                  ? "var(--cafe-blue, #2563eb)"
                  : v2Status === "마감임박"
                    ? "var(--accent)"
                    : "var(--ink-mute)",
              fontFamily: "var(--ff-mono)",
            }}
          >
            {dDayLabel}
          </span>
        )}
      </div>

      {/* 2행: 대회명 (1줄 ellipsis) */}
      <div
        style={{
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: "-0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.3,
        }}
      >
        {t.name}
      </div>

      {/* 3행: 메타 (날짜 · 도시 · 참가비) */}
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-mute)",
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
          minHeight: 16,
        }}
      >
        {dateStr && <span>{dateStr}</span>}
        {dateStr && cityShort && <span style={{ opacity: 0.4 }}>·</span>}
        {cityShort && <span>{cityShort}</span>}
        {(dateStr || cityShort) && <span style={{ opacity: 0.4 }}>·</span>}
        <span style={{ fontWeight: 600, color: "var(--ink-soft)" }}>
          {feeText}
        </span>
      </div>

      {/* 4행: 진행바 + 카운트 + CTA (한 줄 통합) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: "auto",
          paddingTop: 4,
        }}
      >
        {maxTeams > 0 ? (
          <>
            <div
              style={{
                flex: 1,
                height: 4,
                background: "var(--bg-alt)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  background:
                    v2Status === "마감임박"
                      ? "var(--accent)"
                      : "var(--cafe-blue, #2563eb)",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-mute)",
                fontFamily: "var(--ff-mono)",
                whiteSpace: "nowrap",
              }}
            >
              {t.team_count}/{maxTeams}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, fontSize: 11, color: "var(--ink-mute)" }}>
            {t.team_count}팀
          </div>
        )}
        <span
          className="btn btn--sm btn--primary"
          style={{
            pointerEvents: "none",
            opacity: isFull && v2Status !== "진행중" ? 0.6 : 1,
            fontSize: 12,
            padding: "4px 12px",
          }}
        >
          {ctaLabel}
        </span>
      </div>
    </Link>
  );
}

/* ---------- 메인: 6상태 칩 + 카드 그리드 ---------- */
interface V2TournamentListProps {
  tournaments: TournamentFromApi[];
  photoMap?: Record<string, string | null>;
  activeTab: V2MatchTab;
  onTabChange: (tab: V2MatchTab) => void;
  emptyMessage?: string;
  counts?: Partial<Record<V2MatchTab, number>>;
  // 2026-05-03: 탭 우측에 렌더할 toolbar (View toggle + 검색 + 필터) — KindTabBar 와 동일 패턴
  toolbar?: React.ReactNode;
}

export function V2TournamentList({
  tournaments,
  photoMap,
  activeTab,
  onTabChange,
  emptyMessage,
  counts,
  toolbar,
}: V2TournamentListProps) {
  const shown = tournaments;

  return (
    <div>
      {/* 2026-05-03: .games-toolbar 패턴 — segmented 좌측 fill + toolbar 우측 고정 */}
      <div className="games-toolbar">
        <div className="games-segmented" role="tablist">
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
                className={
                  isActive
                    ? "games-segmented__btn is-active"
                    : "games-segmented__btn"
                }
              >
                <span className="games-segmented__label">{tab}</span>
                {count !== undefined && count > 0 && (
                  <span className="games-segmented__count">{count}</span>
                )}
              </button>
            );
          })}
        </div>
        {toolbar && (
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {toolbar}
          </div>
        )}
      </div>

      {/* 카드 그리드: 데스크톱 2열, 모바일 1열 */}
      {shown.length === 0 ? (
        // 빈 상태 — 기존과 동일한 메시지 톤
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 48,
              color: "var(--ink-dim)",
              display: "block",
              marginBottom: 12,
            }}
          >
            emoji_events
          </span>
          <p style={{ fontSize: 14, color: "var(--ink-mute)", marginBottom: 16 }}>
            {emptyMessage ?? "해당 조건의 대회가 없습니다."}
          </p>
          <Link
            href="/tournaments"
            className="btn btn--sm btn--primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              search
            </span>
            대회 찾아보기
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            // 2026-05-03: 컴팩트 카드 — 280px 최소폭 (이전 340px) → 한 행 카드 수 ↑
            // 모바일 1열 → 640px↑ 2~3열, 1280px↑ 4열 (auto-fill + minmax)
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            // grid stretch 시 빈 공간 발생 → start 정렬 (카드 자연 높이 유지)
            alignItems: "start",
            gap: 14,
          }}
        >
          {shown.map((t, idx) => {
            // accent 로테이션 — 4색 순환으로 시각 변주
            const accent = FALLBACK_ACCENTS[idx % FALLBACK_ACCENTS.length];
            const photoUrl =
              photoMap === undefined
                ? undefined
                : (photoMap[t.venue_name ?? t.city ?? ""] ?? null);
            return (
              <V2TournamentCard
                key={t.id}
                tournament={t}
                photoUrl={photoUrl}
                accent={accent}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
