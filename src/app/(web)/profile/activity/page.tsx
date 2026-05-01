"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "@/contexts/toast-context";
// Phase 12 §G: 모바일 백버튼 (사용자 보고)
import { PageBackButton } from "@/components/shared/page-back-button";

/* ============================================================
 * /profile/activity — 내 활동 통합 뷰 (W4 M4)
 *
 * 이유: 기존에는 "내 대회 참가 이력", "내 경기 신청", "내 팀 가입 신청"이
 *      각기 다른 경로/페이지/UI로 흩어져 있었다. 사용자 멘탈 모델은
 *      "내가 뭘 신청했더라?" 단일. 3개 탭으로 통합해 진입 비용을 낮춘다.
 *
 * 구조: client 컴포넌트. `?tab=tournaments|games|teams` 로 탭 상태 보존.
 *      탭 전환 시 해당 type만 /api/web/me/activity 로 fetch.
 *
 * M7 4번 연동: 팀 탭의 pending 카드에 "신청 취소" 빠른 액션
 *            (DELETE /api/web/teams/[id]/my-application — M7에서 신설).
 *
 * ⚠️ apiSuccess 래핑 없음 + snake_case 자동 변환 (errors.md 6회차 가드):
 *    응답은 { items: [...] } 최상위. 각 item의 필드는 snake_case로 접근.
 * ============================================================ */

type Tab = "tournaments" | "games" | "teams";

// 탭별 아이템 타입 — API 응답 구조(snake_case)와 일치
type TournamentItem = {
  id: string;
  status: string; // "pending" | "approved" | "rejected" | ...
  created_at: string;
  tournament: {
    id: string;
    name: string;
    start_date: string | null;
    venue_name: string | null;
    city: string | null;
    status: string | null;
  };
  team: { id: string; uuid: string | null; name: string };
};

type GameItem = {
  id: string;
  status: number; // 0=대기, 1=승인, 2=거부
  created_at: string;
  game: {
    id: string;
    uuid: string | null;
    title: string | null;
    scheduled_at: string | null;
    venue_name: string | null;
    city: string | null;
    status: number;
  } | null;
};

type TeamItem = {
  id: string;
  status: string; // "pending" | "approved" | "rejected"
  created_at: string;
  rejection_reason: string | null;
  team: {
    id: string;
    uuid: string | null;
    name: string;
    city: string | null;
    district: string | null;
  };
};

// 탭 탭바 정의 — 순서: 경기(가장 빈번) → 대회 → 팀
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "games", label: "내 경기 신청", icon: "sports_basketball" },
  { key: "tournaments", label: "내 대회 신청", icon: "emoji_events" },
  { key: "teams", label: "내 팀 가입", icon: "groups" },
];

// 한국어 상태 라벨 — 각 도메인이 상태값 형태가 달라 분리
const GAME_APP_STATUS: Record<number, { label: string; tone: "warn" | "success" | "error" | "muted" }> = {
  0: { label: "대기", tone: "warn" },
  1: { label: "승인", tone: "success" },
  2: { label: "거부", tone: "error" },
};
const STRING_STATUS: Record<string, { label: string; tone: "warn" | "success" | "error" | "muted" }> = {
  pending: { label: "대기", tone: "warn" },
  approved: { label: "승인", tone: "success" },
  rejected: { label: "거부", tone: "error" },
  registered: { label: "등록", tone: "success" },
  cancelled: { label: "취소", tone: "muted" },
};

function StatusBadge({ tone, label }: { tone: "warn" | "success" | "error" | "muted"; label: string }) {
  // CSS 변수 기반 배지 — 하드코딩 색상 금지 (CLAUDE.md)
  // 토큰 매핑 정정 (2026-04-29):
  //   --color-success→--ok, --color-error→--danger, --color-primary→--accent,
  //   --color-surface-bright→--bg-card, --color-text-muted→--ink-mute
  const bg =
    tone === "success"
      ? "color-mix(in srgb, var(--ok) 15%, transparent)"
      : tone === "error"
        ? "color-mix(in srgb, var(--danger) 15%, transparent)"
        : tone === "warn"
          ? "color-mix(in srgb, var(--accent) 15%, transparent)"
          : "var(--bg-card)";
  const fg =
    tone === "success"
      ? "var(--ok)"
      : tone === "error"
        ? "var(--danger)"
        : tone === "warn"
          ? "var(--accent)"
          : "var(--ink-mute)";
  return (
    <span
      className="inline-flex shrink-0 items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: bg, color: fg, borderRadius: 4 }}
    >
      {label}
    </span>
  );
}

// 날짜 포맷 — ISO string 또는 null
function formatWhen(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

// 신청 시각 (짧은 상대/절대 혼합)
function formatApplied(iso: string) {
  try {
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    if (diff < 60_000) return "방금 신청";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}분 전 신청`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}시간 전 신청`;
    if (diff < 7 * 86400_000) return `${Math.floor(diff / 86400_000)}일 전 신청`;
    return `${new Date(iso).toLocaleDateString("ko-KR")} 신청`;
  } catch {
    return "";
  }
}

export default function ProfileActivityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  // 현재 탭 — 쿼리 파라미터에서 파싱. 기본 games (사용 빈도 가장 높다고 가정)
  const rawTab = searchParams.get("tab");
  const tab: Tab =
    rawTab === "tournaments" ? "tournaments" : rawTab === "teams" ? "teams" : "games";

  // 3 탭 데이터 병렬 캐시 — 탭 전환 시 재fetch 없이 배지·리스트 즉시 표시
  // 캐시 목적: (1) 다른 탭에 몇 건 있는지 탭 바에 배지로 미리 보여주기
  //          (2) 탭 전환 시 로딩 스피너 깜빡임 제거
  const [cache, setCache] = useState<{
    games: GameItem[];
    tournaments: TournamentItem[];
    teams: TeamItem[];
  }>({ games: [], tournaments: [], teams: [] });
  const [loading, setLoading] = useState(true);

  // 단일 탭 refetch — cancel/action 후 해당 탭만 갱신
  const loadOne = useCallback(async (type: Tab) => {
    try {
      const res = await fetch(`/api/web/me/activity?type=${type}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = (await res.json()) as { items?: unknown };
      const items = Array.isArray(json.items) ? json.items : [];
      setCache((prev) => ({ ...prev, [type]: items as never }));
    } catch {
      // 무시 — 기존 캐시 유지
    }
  }, []);

  // 초기 1회: 3 탭 병렬 fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [g, t, te] = await Promise.all([
          fetch("/api/web/me/activity?type=games", { credentials: "include" }).then((r) =>
            r.ok ? (r.json() as Promise<{ items?: GameItem[] }>) : { items: [] },
          ),
          fetch("/api/web/me/activity?type=tournaments", { credentials: "include" }).then(
            (r) => (r.ok ? (r.json() as Promise<{ items?: TournamentItem[] }>) : { items: [] }),
          ),
          fetch("/api/web/me/activity?type=teams", { credentials: "include" }).then((r) =>
            r.ok ? (r.json() as Promise<{ items?: TeamItem[] }>) : { items: [] },
          ),
        ]);
        if (cancelled) return;
        setCache({
          games: Array.isArray(g.items) ? g.items : [],
          tournaments: Array.isArray(t.items) ? t.items : [],
          teams: Array.isArray(te.items) ? te.items : [],
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = cache[tab];
  const counts = {
    games: cache.games.length,
    tournaments: cache.tournaments.length,
    teams: cache.teams.length,
  };

  function changeTab(next: Tab) {
    if (next === tab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  /* 팀 가입 취소 — M7 DELETE API 재활용. pending 건에만 노출 */
  async function cancelTeamJoin(teamId: string) {
    if (!confirm("가입 신청을 취소할까요?")) return;
    try {
      const res = await fetch(`/api/web/teams/${teamId}/my-application`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        showToast(body.message ?? "신청이 취소되었습니다.", "success");
        await loadOne("teams"); // teams 탭만 refetch
      } else {
        showToast(body.error ?? "취소 중 오류가 발생했습니다.", "error");
      }
    } catch {
      showToast("네트워크 오류가 발생했습니다.", "error");
    }
  }

  // 시안 v2(1) MyActivity.jsx — 카운터 4종 계산
  // pending/approved/rejected/cancelled 등 도메인별 상태값을 일괄로 환산
  const allItems = [
    ...cache.games.map((g) => ({
      kind: "game" as const,
      pending: g.status === 0,
      approved: g.status === 1,
      rejected: g.status === 2,
      cancelled: false,
    })),
    ...cache.tournaments.map((t) => ({
      kind: "tournament" as const,
      pending: t.status === "pending",
      approved: t.status === "approved" || t.status === "registered",
      rejected: t.status === "rejected",
      cancelled: t.status === "cancelled",
    })),
    ...cache.teams.map((t) => ({
      kind: "team" as const,
      pending: t.status === "pending",
      approved: t.status === "approved",
      rejected: t.status === "rejected",
      cancelled: false,
    })),
  ];
  const pendingCount = allItems.filter((x) => x.pending).length;
  const approvedCount = allItems.filter((x) => x.approved).length;
  const rejectedCount = allItems.filter((x) => x.rejected).length;
  const cancelledCount = allItems.filter((x) => x.cancelled).length;

  return (
    // 시안 v2(1) 박제: page + 빵부스러기 + counters + filter chips + 카드 리스트
    <div className="page">
      {/* Phase 12 §G — 모바일 백버튼 (lg+ hidden) */}
      <PageBackButton fallbackHref="/profile" />
      {/* 시안 빵부스러기 */}
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 10,
        }}
      >
        <Link href="/profile" style={{ color: "var(--ink-mute)" }}>
          프로필
        </Link>{" "}
        › <span style={{ color: "var(--ink)" }}>내 활동</span>
      </div>

      {/* 시안 헤더: eyebrow + h1 + sub */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div className="eyebrow">내 활동 · MY ACTIVITY</div>
          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            신청한 모든 것
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            경기 · 대회 · 팀 가입 신청을 한 화면에서
          </div>
        </div>
      </div>

      {/* 시안 v2(1): counters 4종 (검토중 / 예정 / 완료 / 취소·거절)
          2026-05-02 모바일 분기: 모바일 2x2 → sm 1x4 (errors.md 04-29 안티패턴 회피) */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-[18px]"
      >
        {[
          { n: pendingCount, lbl: "검토중", tone: "var(--warn)" },
          { n: approvedCount, lbl: "승인·확정", tone: "var(--cafe-blue)" },
          { n: rejectedCount, lbl: "거절", tone: "var(--ink-mute)" },
          { n: cancelledCount, lbl: "취소", tone: "var(--ink-dim)" },
        ].map((c, i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: "14px 16px",
              borderTop: `3px solid ${c.tone}`,
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: "var(--bg-card)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 32,
                fontWeight: 900,
                lineHeight: 1,
                color: c.tone,
              }}
            >
              {c.n}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                marginTop: 4,
              }}
            >
              {c.lbl}
            </div>
          </div>
        ))}
      </div>

      {/* v2 탭 패턴: 경기 / 대회 / 팀
       * 왜 chip(btn--sm + cafe-blue 활성) 폐기:
       *  - 프로필 + 설정 전체 v2 탭 통일 작업의 일부
       *  - 아이콘 + uppercase 굵은체 chip 은 시각 노이즈가 큼
       *  - /teams/[id] TeamTabsV2 패턴과 일관성 확보
       * 보존:
       *  - count 배지 (옆에 mono 숫자) — 검토중/예정 갯수 가시성에 필수 */}
      <nav
        role="tablist"
        aria-label="활동 카테고리"
        className="-mx-4 mb-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex gap-1 overflow-x-auto px-4 scrollbar-none">
          {TABS.map((t) => {
            const active = tab === t.key;
            const count = counts[t.key];
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => changeTab(t.key)}
                /* v2 탭 패턴:
                 * - 텍스트 only (아이콘 제거)
                 * - px-3 py-3 → 약 44px 터치 타겟
                 * - 활성: 하단 3px accent border + font-semibold (TeamTabsV2 일관)
                 * - 카운트는 inline 숫자 (mono) 그대로 유지
                 * 토큰 매핑 정정: --color-primary 미정의 → --accent */
                className={`flex shrink-0 items-center gap-1.5 px-3 py-3 text-sm border-b-[3px] transition-colors bg-transparent cursor-pointer ${
                  active
                    ? "border-[var(--accent)] text-[var(--ink)] font-semibold"
                    : "border-transparent text-[var(--ink-mute)] hover:text-[var(--ink)] font-medium"
                }`}
              >
                {t.label}
                <span
                  style={{
                    fontFamily: "var(--ff-mono)",
                    opacity: 0.7,
                    fontSize: 12,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 본문 — 시안 v2(1)의 단일 카드(.card padding:0) 안에 borderBottom 행으로 묶음 */}
      {loading ? (
        <div
          className="py-12 text-center text-sm"
          style={{ color: "var(--ink-mute)" }}
        >
          불러오는 중...
        </div>
      ) : items.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            border: "1px solid var(--border)",
            borderRadius: 4,
            background: "var(--bg-card)",
          }}
        >
          {tab === "games" &&
            (items as GameItem[]).map((it, i, arr) => (
              <GameCard
                key={it.id}
                item={it}
                isLast={i === arr.length - 1}
              />
            ))}
          {tab === "tournaments" &&
            (items as TournamentItem[]).map((it, i, arr) => (
              <TournamentCard
                key={it.id}
                item={it}
                isLast={i === arr.length - 1}
              />
            ))}
          {tab === "teams" &&
            (items as TeamItem[]).map((it, i, arr) => (
              <TeamCard
                key={it.id}
                item={it}
                onCancel={cancelTeamJoin}
                isLast={i === arr.length - 1}
              />
            ))}
        </div>
      )}

      {/* 시안 v2(1): 하단 빠른 이동 버튼 행 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 16,
          flexWrap: "wrap",
        }}
      >
        <Link href="/games" className="btn" style={{ textDecoration: "none" }}>
          경기 찾기
        </Link>
        <Link
          href="/tournaments"
          className="btn"
          style={{ textDecoration: "none" }}
        >
          대회 찾기
        </Link>
        <Link href="/teams" className="btn" style={{ textDecoration: "none" }}>
          팀 찾기
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
 * 빈 상태 — 탭별 CTA 링크
 * ============================================================ */
function EmptyState({ tab }: { tab: Tab }) {
  const config: Record<Tab, { msg: string; cta: string; href: string; icon: string }> = {
    games: {
      msg: "아직 신청한 경기가 없어요",
      cta: "경기 둘러보기",
      href: "/games",
      icon: "sports_basketball",
    },
    tournaments: {
      msg: "아직 신청한 대회가 없어요",
      cta: "대회 보러 가기",
      href: "/tournaments",
      icon: "emoji_events",
    },
    teams: {
      msg: "아직 가입 신청한 팀이 없어요",
      cta: "팀 둘러보기",
      href: "/teams",
      icon: "groups",
    },
  };
  const c = config[tab];
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 text-center"
      style={{
        // 토큰 매핑 정정: --color-border→--border, --color-text-muted→--ink-mute
        border: "1px dashed var(--border)",
        borderRadius: 4,
        color: "var(--ink-mute)",
      }}
    >
      <span
        className="material-symbols-outlined text-4xl"
        style={{ color: "var(--ink-mute)" }}
        aria-hidden
      >
        {c.icon}
      </span>
      <p className="text-sm">{c.msg}</p>
      <Link
        href={c.href}
        className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-wide"
        style={{
          // 토큰 매핑 정정: --color-primary→--accent (BDR Red)
          backgroundColor: "var(--accent)",
          color: "#fff",
          borderRadius: 4,
        }}
      >
        {c.cta}
        <span className="material-symbols-outlined text-sm" aria-hidden>
          arrow_forward
        </span>
      </Link>
    </div>
  );
}

/* ============================================================
 * 카드 3종 — 공통 레이아웃 + 도메인별 info
 * ============================================================ */

// 시안 v2(1) 공용 행 스타일 — borderLeft accent + 좌측 아이콘 + 본문 + 우측 액션
// tone 매핑: warn → 검토중, success → 확정, error → 거절, muted → 취소·완료
function rowAccent(tone: "warn" | "success" | "error" | "muted"): string {
  switch (tone) {
    case "success":
      return "var(--ok)";
    case "error":
      return "var(--danger)";
    case "warn":
      return "var(--warn)";
    default:
      return "var(--ink-mute)";
  }
}

function GameCard({ item, isLast }: { item: GameItem; isLast: boolean }) {
  const st = GAME_APP_STATUS[item.status] ?? GAME_APP_STATUS[0];
  const g = item.game;
  const when = formatWhen(g?.scheduled_at);
  const href = g?.uuid ? `/games/${g.uuid.slice(0, 8)}` : g?.id ? `/games/${g.id}` : "#";
  return (
    <Link
      href={href}
      // 시안 v2(1): 4열 grid (40px 1fr auto auto) + borderBottom 행 + borderLeft accent
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr auto",
        gap: 14,
        alignItems: "center",
        padding: "14px 18px",
        borderBottom: isLast ? 0 : "1px solid var(--border)",
        borderLeft: `3px solid ${rowAccent(st.tone)}`,
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 22 }}>
        {/* 시안: kindIcon 농구공 → 우리는 Material Symbol */}
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 22, color: "var(--ink-mute)" }}
        >
          sports_basketball
        </span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <StatusBadge tone={st.tone} label={st.label} />
          {when && (
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontFamily: "var(--ff-mono)",
              }}
            >
              {when}
            </span>
          )}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--ink)",
          }}
        >
          {g?.title ?? "경기"}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-mute)",
          }}
        >
          {[g?.venue_name ?? g?.city, formatApplied(item.created_at)]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-dim)",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      />
    </Link>
  );
}

function TournamentCard({
  item,
  isLast,
}: {
  item: TournamentItem;
  isLast: boolean;
}) {
  const st = STRING_STATUS[item.status] ?? { label: item.status, tone: "muted" as const };
  const t = item.tournament;
  const when = formatWhen(t.start_date);
  const href = `/tournaments/${t.id}`;
  return (
    <Link
      href={href}
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr auto",
        gap: 14,
        alignItems: "center",
        padding: "14px 18px",
        borderBottom: isLast ? 0 : "1px solid var(--border)",
        borderLeft: `3px solid ${rowAccent(st.tone)}`,
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 22, color: "var(--ink-mute)" }}
        >
          emoji_events
        </span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <StatusBadge tone={st.tone} label={st.label} />
          {when && (
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontFamily: "var(--ff-mono)",
              }}
            >
              {when}
            </span>
          )}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--ink)",
          }}
        >
          {t.name}
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
          {[
            t.venue_name ?? t.city,
            `팀: ${item.team.name}`,
            formatApplied(item.created_at),
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-dim)",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      />
    </Link>
  );
}

function TeamCard({
  item,
  onCancel,
  isLast,
}: {
  item: TeamItem;
  onCancel: (teamId: string) => void;
  isLast: boolean;
}) {
  const st = STRING_STATUS[item.status] ?? { label: item.status, tone: "muted" as const };
  const isPending = item.status === "pending";
  const location = [item.team.city, item.team.district].filter(Boolean).join(" ");
  const href = `/teams/${item.team.uuid ?? item.team.id}`;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr auto",
        gap: 14,
        alignItems: "center",
        padding: "14px 18px",
        borderBottom: isLast ? 0 : "1px solid var(--border)",
        borderLeft: `3px solid ${rowAccent(st.tone)}`,
      }}
    >
      <div>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 22, color: "var(--ink-mute)" }}
        >
          groups
        </span>
      </div>
      {/* 좌측: 링크 영역 (이름/지역/신청 시각/거부 사유) */}
      <Link
        href={href}
        style={{
          minWidth: 0,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <StatusBadge tone={st.tone} label={st.label} />
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--ink)",
          }}
        >
          {item.team.name}
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
          {[location, formatApplied(item.created_at)]
            .filter(Boolean)
            .join(" · ") || "-"}
        </div>
        {item.status === "rejected" && item.rejection_reason && (
          <div
            style={{
              fontSize: 11,
              color: "var(--danger)",
              marginTop: 4,
            }}
          >
            사유: {item.rejection_reason}
          </div>
        )}
      </Link>
      {/* 우측: pending 시 취소 버튼 — M7 4번 */}
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-dim)",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {isPending && (
          <button
            type="button"
            className="btn btn--sm"
            onClick={(e) => {
              e.preventDefault();
              onCancel(item.team.id);
            }}
          >
            신청 취소
          </button>
        )}
      </div>
    </div>
  );
}
