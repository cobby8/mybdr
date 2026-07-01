"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "@/contexts/toast-context";
// Phase 12 §G: 모바일 백버튼 (사용자 보고)
import { PageBackButton } from "@/components/shared/page-back-button";
// PR-1C-5 UC1: 대회 탭 카드 = MyRegistrationStatus compact 재사용 (위치 이동 ❌ / import 만)
import {
  MyRegistrationStatus,
  type NormalizedReg,
} from "@/app/(web)/tournaments/[id]/_components/my-registration-status";
// PR-1C-5: 시안 v2.20 .ma-filter chip row 박제
import "./_components/my-activity.css";

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
  // [M4 wave2] 종료 경기(game.status===3) + 본인 리포트 작성 여부. 평점 CTA 배너 노출 판정용.
  has_my_report: boolean;
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

// PR-3C-3 (TU5 "내 팀"): 내가 active 멤버인 팀 현황 — /api/web/me/activity?type=myteams
// ⚠️ "teams"(가입 신청 이력)와 다른 개념 — 이미 소속된 팀 목록.
// 팀 매너 평균 필드 없음(운영 DB 미집계 → hide). pending 3종은 운영진 팀만 실값.
type MyTeamItem = {
  id: string;
  role: string; // "captain" | "vice" | "manager" | "member" | (비표준 role)
  is_operator: boolean; // 운영진(captain/vice/manager 또는 captainId 본인) 여부
  last_activity_at: string | null; // 마지막 활동 (NULL → hide)
  pending_join: number; // BT1 가입 신청 pending (운영진 팀만 / 멤버 팀=0)
  pending_change: number; // BT2 멤버 변경 신청 pending
  pending_match: number; // BT5 받은 매치 신청 pending
  team: {
    id: string;
    uuid: string | null;
    name: string;
    logo_url: string | null;
    city: string | null;
    district: string | null;
    members_count: number;
    primary_color: string | null;
    secondary_color: string | null;
  };
};

// PR-2C-3 (BG2): 내 매너 집계 응답 타입 — /api/web/me/activity?type=manner
// ⚠️ flag "종류"(flag_kinds)만 / 개별 건수 필드 없음 (사용자 결재 — 건수 노출 ❌)
type MannerData = {
  avg: number; // 평균 평점 (0 = 평가 없음)
  total_evaluations: number; // 평가 받은 건수 (OK / flag별 건수만 ❌)
  flag_kinds: string[]; // 받은 flag 종류 (키워드만)
};

// PR-2C-3: 운영 flag → 한국어 라벨 + 이모지 맵.
// 이유: 시안 MANNER_FLAG_LABELS 는 시안 더미 flag(on_time/good_attitude 등)용이라
//      운영 DB 의 실제 flag(game-report.ts PLAYER_FLAGS 6종)와 키가 다르다.
//      운영 데이터 기준으로 재작성해야 키워드가 매칭된다(미매칭 시 flag 원문 노출).
// 운영 flags = 부정 신고만 6종 (positive flag 없음 → 부정 키워드만 표시).
const MANNER_FLAG_LABELS: Record<string, { label: string; emoji: string }> = {
  no_show: { label: "노쇼", emoji: "🚫" },
  late: { label: "지각", emoji: "⚠" },
  poor_manner: { label: "매너 불량", emoji: "⚠" },
  foul: { label: "과한 파울", emoji: "⚠" },
  verbal: { label: "언어 폭력", emoji: "🚫" },
  cheat: { label: "부정행위", emoji: "🚫" },
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

/* ============================================================
 * PR-1C-5 시안 v2.20: 상태 필터 (탭=도메인 / 필터=상태 공존)
 * ============================================================ */

// 상태 버킷 — 도메인별 상태값(games=number / tournaments·teams=string)을
// 4종 + 전체로 환산. page 의 counters 분류 기준과 동일.
type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";

// 필터 chip 정의 — 시안 ma-filter (전체 + 4 상태)
const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "검토중" },
  { key: "approved", label: "승인·확정" },
  { key: "rejected", label: "거절" },
  { key: "cancelled", label: "취소" },
];

// 단일 item → 상태 버킷 (allItems 분류 로직과 동일 — 도메인별 분기)
function itemBucket(item: GameItem | TournamentItem | TeamItem): StatusFilter {
  // games — status 가 number (0=대기 1=승인 2=거부)
  if (typeof item.status === "number") {
    if (item.status === 0) return "pending";
    if (item.status === 1) return "approved";
    if (item.status === 2) return "rejected";
    return "all";
  }
  // tournaments / teams — status 가 string
  const s = item.status;
  if (s === "pending") return "pending";
  if (s === "approved" || s === "registered") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "cancelled") return "cancelled";
  return "all";
}

// TournamentItem → NormalizedReg 변환 (MyRegistrationStatus compact 용)
// 운영 데이터에 없는 시안 필드는 폴백:
//  - division → "참가" (운영 TournamentItem 에 부문 정보 미포함)
//  - next_action → status 기반 안내 문구 (mock ❌ / 상태에서 도출)
function toNormalizedReg(item: TournamentItem): NormalizedReg {
  // 운영 status → 시안 StatusKey 매핑 (MyRegistrationStatus 와 동일 enum)
  const statusKey =
    item.status === "rejected"
      ? "rejected"
      : item.status === "cancelled"
        ? "completed"
        : item.status === "approved" || item.status === "registered"
          ? "approved"
          : "pending";

  // step_idx — 신청(0) → 대기(1) → 승인(2) (운영은 결제/진행 미구분 → 승인까지만)
  const stepIdx =
    statusKey === "approved" ? 2 : statusKey === "pending" ? 1 : 0;

  // next_action — 상태에서 도출 (데이터 없는 mock 문구 ❌)
  const nextAction =
    statusKey === "pending"
      ? "운영진 승인을 기다리는 중입니다"
      : statusKey === "approved"
        ? "참가가 확정되었습니다"
        : statusKey === "rejected"
          ? "신청이 거절되었습니다"
          : "";

  return {
    tn_name: item.tournament.name,
    division: "참가", // 운영 데이터 미포함 → 폴백
    team_name: item.team.name,
    status: statusKey,
    step_idx: stepIdx,
    next_action: nextAction,
    submitted_at: formatApplied(item.created_at),
  };
}

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

// PR-2C-3 (BG2): 매너 평균 → tone 색상.
// 시안 룰 그대로: 4.5+ = ok(녹) / 3.0~4.4 = warn(주황) / 3.0- = danger(빨)
// 토큰 매핑: 시안 --err → 운영 --danger (운영 globals.css 에 --err 없음)
function mannerToneColor(avg: number): string {
  if (avg >= 4.5) return "var(--ok)";
  if (avg >= 3.0) return "var(--warn)";
  return "var(--danger)";
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

  // PR-2C-3 (BG2): 내 매너 집계 — 탭과 무관하게 화면 상단 카드 + 카운트 한 줄에 사용.
  // null = 아직 로드 전 (로드 후엔 항상 객체 / 평가 0건도 avg:0 객체로 옴)
  const [manner, setManner] = useState<MannerData | null>(null);

  // PR-3C-3 (TU5 "내 팀"): 내가 active 멤버인 팀 목록 — 탭과 무관(상단 단독 섹션).
  // null = 로드 전 (로드 후엔 배열 / 소속 팀 0개면 빈 배열 → 빈 상태 카드)
  const [myTeams, setMyTeams] = useState<MyTeamItem[] | null>(null);

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
        const [g, t, te, m, mt] = await Promise.all([
          fetch("/api/web/me/activity?type=games", { credentials: "include" }).then((r) =>
            r.ok ? (r.json() as Promise<{ items?: GameItem[] }>) : { items: [] },
          ),
          fetch("/api/web/me/activity?type=tournaments", { credentials: "include" }).then(
            (r) => (r.ok ? (r.json() as Promise<{ items?: TournamentItem[] }>) : { items: [] }),
          ),
          fetch("/api/web/me/activity?type=teams", { credentials: "include" }).then((r) =>
            r.ok ? (r.json() as Promise<{ items?: TeamItem[] }>) : { items: [] },
          ),
          // PR-2C-3 (BG2): 내 매너 집계 — manner 단일 객체 응답 (items 아님)
          fetch("/api/web/me/activity?type=manner", { credentials: "include" }).then((r) =>
            r.ok ? (r.json() as Promise<{ manner?: MannerData }>) : { manner: undefined },
          ),
          // PR-3C-3 (TU5): 내 팀 현황 — items 배열 응답
          fetch("/api/web/me/activity?type=myteams", { credentials: "include" }).then((r) =>
            r.ok ? (r.json() as Promise<{ items?: MyTeamItem[] }>) : { items: [] },
          ),
        ]);
        if (cancelled) return;
        setCache({
          games: Array.isArray(g.items) ? g.items : [],
          tournaments: Array.isArray(t.items) ? t.items : [],
          teams: Array.isArray(te.items) ? te.items : [],
        });
        // manner 응답 반영 (없으면 null 유지 → 카드/카운트 숨김)
        setManner(m.manner ?? null);
        // PR-3C-3: 내 팀 반영 (없으면 빈 배열 → 빈 상태 카드)
        setMyTeams(Array.isArray(mt.items) ? mt.items : []);
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

  // [M4 wave2] 평점 미작성 종료 경기 — status===3(완료) && !has_my_report.
  //   왜: 상단 평점 CTA 배너는 이 건이 1개 이상일 때만 노출(DATA-BINDING §3-D). 평점 작성 후
  //       다음 fetch 에서 has_my_report=true 가 되어 자연 소멸. 첫 건으로 report 딥링크.
  const unratedEndedGames = cache.games.filter(
    (g) => g.game?.status === 3 && !g.has_my_report,
  );

  // PR-1C-5 시안 v2.20: 상태 필터 (탭과 공존 — 탭=도메인 / 필터=상태)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // 현재 탭 항목을 상태 버킷별로 카운트 (chip 옆 숫자)
  const filterCounts: Record<StatusFilter, number> = {
    all: items.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  };
  for (const it of items) {
    const b = itemBucket(it);
    if (b !== "all") filterCounts[b] += 1;
  }

  // 필터 적용된 리스트 — "전체" 면 그대로, 아니면 버킷 일치만
  const filteredItemsRaw =
    statusFilter === "all"
      ? items
      : (items as (GameItem | TournamentItem | TeamItem)[]).filter(
          (it) => itemBucket(it) === statusFilter,
        );

  // PR-2C-3 (BG6): 내 경기 탭만 상태별 정렬 적용.
  // 의뢰서 §3-UC1-1 정렬: 🟡 승인대기(0) 상단 → 🟢 확정(1) → ❌ 취소·거부(2) 하단.
  // 같은 상태 안에서는 created_at 역순(신청 시각 최신 우선 — API 가 이미 desc 정렬).
  // (대회·팀 탭은 기존 동작 보존 — 정렬 변경 ❌)
  const GAME_STATUS_ORDER: Record<number, number> = { 0: 0, 1: 1, 2: 2 };
  const filteredItems =
    tab === "games"
      ? [...(filteredItemsRaw as GameItem[])].sort(
          (a, b) =>
            (GAME_STATUS_ORDER[a.status] ?? 9) - (GAME_STATUS_ORDER[b.status] ?? 9),
        )
      : filteredItemsRaw;

  function changeTab(next: Tab) {
    if (next === tab) return;
    setStatusFilter("all"); // 탭 전환 시 필터 초기화 (다른 도메인 필터 잔존 방지)
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
          {/* PR-2C-3 §3-UC1-3: 상단 카운트 한 줄 — 내 대회 N · 내 경기 M · 평균 매너 X.Y
              매너는 평가 1건 이상일 때만 노출 (mock ❌ / 0건이면 "평균 매너" 생략) */}
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 4 }}>
            내 대회{" "}
            <strong style={{ color: "var(--ink)" }}>{counts.tournaments}</strong> · 내 경기{" "}
            <strong style={{ color: "var(--ink)" }}>{counts.games}</strong>
            {/* PR-3C-3: 내 팀 K — 소속 팀 1개 이상일 때만 노출 (0이면 생략) */}
            {myTeams && myTeams.length > 0 && (
              <>
                {" "}
                · 내 팀{" "}
                <strong style={{ color: "var(--accent)" }}>{myTeams.length}</strong>
              </>
            )}
            {manner && manner.total_evaluations > 0 && (
              <>
                {" "}
                · 평균 매너{" "}
                <strong style={{ color: mannerToneColor(manner.avg) }}>
                  {manner.avg.toFixed(1)}
                </strong>
              </>
            )}
          </div>
        </div>
      </div>

      {/* [M4 wave2] 평점 CTA 배너 — 평가 미작성 종료 경기가 1건 이상일 때만(작성 시 소멸).
          loading 끝난 뒤에만 판정(초기 빈 배열로 깜빡임 방지). */}
      {!loading && unratedEndedGames.length > 0 && (
        <RatingCtaBanner games={unratedEndedGames} />
      )}

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

      {/* PR-3C-3 (TU5 "내 팀"): 내가 소속(active)인 팀 현황 — 탭과 무관 단독 섹션.
          loading 끝 + myTeams 응답 도착 시 노출. 소속 0개면 빈 상태 카드.
          매너 카드 위(가장 상단)에 배치 — 시안 v2.21 "내 팀" 섹션 우선순위. */}
      {!loading && myTeams && <MyTeamsSection teams={myTeams} />}

      {/* PR-2C-3 (BG2): 내 매너 카드 — 탭과 무관(본인 매너 종합). 탭 콘텐츠 위 배치.
          loading 끝 + manner 응답 도착 시에만 노출. 평가 0건도 카드(빈 상태)로 노출 */}
      {!loading && manner && <MannerCard data={manner} />}

      {/* PR-1C-5 시안 v2.20: 상태 필터 chip row (.ma-filter)
          탭=도메인 선택 / 필터=상태 선택 공존. loading 중에는 미노출 */}
      {!loading && items.length > 0 && (
        <div className="ma-filter" role="group" aria-label="상태 필터">
          {STATUS_FILTERS.map((f) => {
            const n = filterCounts[f.key];
            // 카운트 0 인 상태 chip 은 숨김 (전체는 항상 노출)
            if (f.key !== "all" && n === 0) return null;
            return (
              <button
                key={f.key}
                type="button"
                className={`ma-filter__chip${statusFilter === f.key ? " is-on" : ""}`}
                aria-pressed={statusFilter === f.key}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
                <span className="ma-filter__count">{n}</span>
              </button>
            );
          })}
        </div>
      )}

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
      ) : filteredItems.length === 0 ? (
        /* 필터 적용 후 0건 — 해당 상태 신청 없음 안내 (전체로 복귀 유도) */
        <div
          className="py-12 text-center text-sm"
          style={{ color: "var(--ink-mute)" }}
        >
          해당 상태의 신청 내역이 없습니다.
        </div>
      ) : tab === "tournaments" ? (
        /* PR-1C-5: 대회 탭 = MyRegistrationStatus compact 재사용 (시안 의도)
           compact 카드는 자체 border/padding → 컨테이너 없이 gap stack */
        <div className="flex flex-col gap-2.5">
          {(filteredItems as TournamentItem[]).map((it) => (
            <MyRegistrationStatus
              key={it.id}
              variant="compact"
              reg={toNormalizedReg(it)}
              onOpenTn={() => router.push(`/tournaments/${it.tournament.id}`)}
            />
          ))}
        </div>
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
            (filteredItems as GameItem[]).map((it, i, arr) => (
              <GameCard
                key={it.id}
                item={it}
                isLast={i === arr.length - 1}
              />
            ))}
          {tab === "teams" &&
            (filteredItems as TeamItem[]).map((it, i, arr) => (
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
 * [M4 wave2] 평점 CTA 배너 — 평가 미작성 종료 경기 유도
 *
 * 이유: 종료된 경기의 평점(매너/MVP)을 작성하면 매칭 신뢰도가 올라간다.
 *      "status===3 && !has_my_report" 건이 있을 때만 노출, 작성 시(다음 fetch) 소멸.
 *
 * 동작: 첫 미평가 경기로 report 딥링크(여러 건이면 "외 N건" 안내). uuid 앞 8자 = 상세 라우트 규칙.
 * 디자인: var(--*) 토큰만 · Material Symbols · 좌측 accent 강조선 · 44px 터치.
 * ============================================================ */
function RatingCtaBanner({ games }: { games: GameItem[] }) {
  const first = games[0];
  const g = first.game;
  // GameCard 와 동일한 report 딥링크 규칙(uuid 앞 8자 → 상세). report 하위 경로로 연결.
  const slug = g?.uuid ? g.uuid.slice(0, 8) : g?.id ?? null;
  const href = slug ? `/games/${slug}/report` : "/profile/activity";
  const extra = games.length - 1;

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 18px",
        marginBottom: 18,
        // accent 연한 배경 + 좌측 강조선 (하드코딩 hex 0 — 토큰만)
        background: "color-mix(in srgb, var(--accent) 8%, transparent)",
        borderLeft: "3px solid var(--accent)",
        borderRadius: 4,
        textDecoration: "none",
        color: "inherit",
        minHeight: 44,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0 }}
        aria-hidden
      >
        rate_review
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
          평가하지 않은 경기가 있어요
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {g?.title ?? "경기"}
          {extra > 0 ? ` 외 ${extra}건` : ""} · 함께 뛴 선수를 평가해주세요
        </div>
      </div>
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 20, color: "var(--ink-dim)", flexShrink: 0 }}
        aria-hidden
      >
        arrow_forward
      </span>
    </Link>
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
          color: "var(--ink-on-brand)",
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

/* PR-1C-5: 기존 TournamentCard 제거 — 대회 탭이 MyRegistrationStatus compact 로 교체됨
 * (시안 v2.20 의도 / 의뢰서 §5 MyRegistrationStatus 재사용 핵심) */

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

/* ============================================================
 * PR-3C-3 (TU5) — 내 팀 섹션
 *
 * 이유: 내가 소속(active)된 팀 현황을 내 활동 화면 상단에서 한눈에.
 *      운영진(captain/vice/manager)인 팀은 처리 대기 건(가입/변경/매치)을
 *      칩으로 표시해 TU4(팀 관리 인박스)로의 진입점을 제공.
 *
 * 박제 원칙(mock ❌):
 *   - 팀 매너 평균: 운영 DB 미집계 → 표시 안 함(시안의 manner_avg 생략)
 *   - pending 칩: 운영진 팀만 실 count. 멤버 팀은 칩 없음(권한 밖 데이터 ❌)
 *   - last_activity_at NULL → "활동 기록" 줄 hide
 *
 * 시안: BDR-current/screens/MyActivity.jsx "내 팀" 섹션 (운영 토큰/Material Symbol).
 * ============================================================ */

// team_members.role → 한국어 라벨 + tone. 비표준 role 은 "멤버" fallback.
const ROLE_LABELS: Record<string, { label: string; isOperator: boolean }> = {
  captain: { label: "팀장", isOperator: true },
  vice: { label: "부팀장", isOperator: true },
  manager: { label: "매니저", isOperator: true },
  member: { label: "멤버", isOperator: false },
  player: { label: "선수", isOperator: false },
};

// 마지막 활동 시각 → "M월 D일" 짧은 표기 (NULL 이면 호출부에서 hide)
function formatActivityDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

// 팀 로고 자리표시 — 로고 없으면 팀 색상 그라디언트 + 이니셜(디자인 룰: 이미지 없으면 대체)
function TeamLogo({
  logoUrl,
  name,
  color1,
  color2,
}: {
  logoUrl: string | null;
  name: string;
  color1: string | null;
  color2: string | null;
}) {
  const initial = name.trim().charAt(0) || "T";
  // 원형 — 정사각형 W=H 이므로 50% 허용(디자인 룰 §4-1: pill 9999px 회피용 50% OK)
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        width={40}
        height={40}
        style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // 색상 없으면 토큰 폴백 — 하드코딩 금지 룰 준수
        background: `linear-gradient(135deg, ${color1 || "var(--accent)"}, ${color2 || "var(--cafe-blue)"})`,
        color: "var(--ink-on-brand)",
        fontWeight: 800,
        fontSize: 16,
        fontFamily: "var(--ff-display)",
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function MyTeamsSection({ teams }: { teams: MyTeamItem[] }) {
  return (
    <section
      className="card"
      style={{
        padding: "16px 18px",
        border: "1px solid var(--border)",
        borderRadius: 4,
        background: "var(--bg-card)",
        marginBottom: 12,
      }}
    >
      {/* 헤더: groups 아이콘 + "내 팀" + 팀 수 + 팀 관리 링크 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: teams.length > 0 ? 12 : 0,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "var(--ink)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "var(--accent)" }}
            aria-hidden
          >
            groups
          </span>
          내 팀
          {teams.length > 0 && (
            <span
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                fontWeight: 600,
                fontFamily: "var(--ff-mono)",
              }}
            >
              {teams.length}팀
            </span>
          )}
        </h3>
        {teams.length > 0 && (
          <Link
            href="/teams"
            style={{ fontSize: 12, color: "var(--ink-mute)", textDecoration: "none" }}
          >
            팀 찾기 →
          </Link>
        )}
      </div>

      {teams.length === 0 ? (
        // 빈 상태 — 소속 팀 0개 (mock 데이터 ❌ / CTA 만)
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "20px 0 8px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--ink-mute)", margin: 0 }}>
            아직 가입한 팀이 없어요
          </p>
          <Link
            href="/teams"
            className="inline-flex items-center gap-1"
            style={{
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: "var(--accent)",
              color: "var(--ink-on-brand)",
              borderRadius: 4,
              textDecoration: "none",
            }}
          >
            팀 둘러보기
            <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden>
              arrow_forward
            </span>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {teams.map((t) => (
            <MyTeamRow key={t.id} item={t} />
          ))}
        </div>
      )}
    </section>
  );
}

// 개별 팀 행 — 로고 + 팀명/role + 메타 + pending 칩(운영진만) + 상세/관리 링크
function MyTeamRow({ item }: { item: MyTeamItem }) {
  const roleInfo = ROLE_LABELS[item.role] ?? { label: "멤버", isOperator: false };
  const location = [item.team.city, item.team.district].filter(Boolean).join(" ");
  const activity = formatActivityDate(item.last_activity_at);
  const hasPending =
    item.pending_join > 0 || item.pending_change > 0 || item.pending_match > 0;
  const href = `/teams/${item.team.uuid ?? item.team.id}`;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "10px 0",
        borderTop: "1px solid var(--border)",
      }}
    >
      <TeamLogo
        logoUrl={item.team.logo_url}
        name={item.team.name}
        color1={item.team.primary_color}
        color2={item.team.secondary_color}
      />

      <div style={{ minWidth: 0 }}>
        {/* 팀명 + role 배지 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.team.name}
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: "1px 7px",
              borderRadius: 4,
              // 운영진 = accent 톤 / 멤버 = 중립 톤 (정의된 토큰만 사용)
              backgroundColor: roleInfo.isOperator
                ? "color-mix(in srgb, var(--accent) 14%, transparent)"
                : "color-mix(in srgb, var(--ink-mute) 12%, transparent)",
              color: roleInfo.isOperator ? "var(--accent)" : "var(--ink-mute)",
            }}
          >
            {roleInfo.label}
          </span>
        </div>

        {/* 메타: 지역 · 멤버수 · 마지막 활동(NULL 이면 생략) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 3,
            fontSize: 11.5,
            color: "var(--ink-mute)",
            flexWrap: "wrap",
          }}
        >
          {location && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden>
                place
              </span>
              {location}
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden>
              groups
            </span>
            {item.team.members_count}명
          </span>
          {activity && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden>
                schedule
              </span>
              {activity} 활동
            </span>
          )}
        </div>

        {/* pending 칩 — 운영진 팀만 실 count (BT1 가입 / BT2 변경 / BT5 매치) */}
        {hasPending && (
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            {item.pending_join > 0 && (
              <PendingChip icon="how_to_reg" label={`가입 ${item.pending_join}`} tone="accent" />
            )}
            {item.pending_change > 0 && (
              <PendingChip icon="edit_note" label={`변경 ${item.pending_change}`} tone="blue" />
            )}
            {item.pending_match > 0 && (
              <PendingChip icon="handshake" label={`매치 ${item.pending_match}`} tone="blue" />
            )}
          </div>
        )}
      </div>

      {/* 우측: 운영진 = 관리 / 멤버 = 상세 (라우트는 동일 팀 상세로 — 관리 탭은 팀 상세 내부) */}
      <Link
        href={href}
        className="btn btn--sm"
        style={{ textDecoration: "none", whiteSpace: "nowrap" }}
      >
        {roleInfo.isOperator ? "관리" : "상세"}
      </Link>
    </div>
  );
}

// pending 칩 — accent(가입) / blue(변경·매치) 두 톤
function PendingChip({
  icon,
  label,
  tone,
}: {
  icon: string;
  label: string;
  tone: "accent" | "blue";
}) {
  const color = tone === "accent" ? "var(--accent)" : "var(--cafe-blue)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 4,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden>
        {icon}
      </span>
      {label}
    </span>
  );
}

/* ============================================================
 * PR-2C-3 (BG2) — 내 매너 카드
 *
 * 이유: 본인이 받은 매너 평가를 한눈에. ★ 노출 룰 엄격(사용자 결재):
 *      평균 평점 + flag "종류"(키워드)만 노출. flag별 개별 건수 절대 ❌.
 *      (예 "노쇼 2회" 같은 건수 표시 금지 — 위축/낙인 방지)
 *
 * 데이터: data.flag_kinds 는 API 가 이미 distinct(Set) 처리한 "종류" 배열.
 *        이 컴포넌트에서도 건수는 일절 계산/표시하지 않는다.
 *
 * 시안: BDR-current/game-shared.jsx MannerCard 박제 (운영 토큰/인라인 매핑).
 * ============================================================ */
function MannerCard({ data }: { data: MannerData }) {
  const hasRatings = data.total_evaluations > 0;
  // 평균 색상 tone — 모듈 헬퍼 재사용 (헤더 카운트와 동일 기준)
  const toneColor = mannerToneColor(data.avg);

  return (
    <div
      className="card"
      style={{
        padding: "16px 18px",
        border: "1px solid var(--border)",
        borderRadius: 4,
        background: "var(--bg-card)",
        marginBottom: 12,
      }}
    >
      {/* 헤더: 제목 + "최근 50건 평균" 힌트 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "var(--ink)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "var(--accent)" }}
            aria-hidden
          >
            handshake
          </span>
          내 매너 평가
        </h3>
        <span
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
          title="최근 50건 평균"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14 }}
            aria-hidden
          >
            info
          </span>
          최근 50건 평균
        </span>
      </div>

      {hasRatings ? (
        <>
          {/* 큰 숫자 = 평균 평점 + tone 색상 분기 */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 40,
                fontWeight: 900,
                lineHeight: 1,
                color: toneColor,
              }}
            >
              {data.avg.toFixed(1)}
            </span>
            <span style={{ fontSize: 14, color: "var(--ink-mute)", fontWeight: 600 }}>
              / 5.0
            </span>
          </div>
          {/* 평가 받은 "횟수"는 노출 OK (flag별 건수만 ❌) */}
          <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 6 }}>
            {data.total_evaluations}명에게 평가 받음
          </div>

          {/* 받은 flag 종류 — 키워드만 (건수 표시 ❌) */}
          {data.flag_kinds.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  marginBottom: 6,
                }}
              >
                받은 평가 키워드{" "}
                <span style={{ color: "var(--ink-dim)", fontWeight: 500 }}>
                  (종류만 / 건수 ❌)
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {data.flag_kinds.map((f) => {
                  // 운영 flag → 라벨 매핑 (미정의 flag 는 원문 fallback)
                  const lab = MANNER_FLAG_LABELS[f] ?? { label: f, emoji: "·" };
                  return (
                    <span
                      key={f}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: 4,
                        // 부정 flag → danger 톤(연한 배경) — 운영은 부정 flag만
                        backgroundColor:
                          "color-mix(in srgb, var(--danger) 12%, transparent)",
                        color: "var(--danger)",
                      }}
                    >
                      {lab.emoji} {lab.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        // 빈 상태 — 평가 0건
        <div style={{ fontSize: 13, color: "var(--ink-mute)", padding: "8px 0" }}>
          아직 매너 평가가 없습니다. 더 많은 경기에 참가해보세요.
        </div>
      )}
    </div>
  );
}
