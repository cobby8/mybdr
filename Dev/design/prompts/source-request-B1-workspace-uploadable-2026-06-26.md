# B1 TournamentWorkspace Source Package - Uploadable Markdown

Use this single Markdown file when Claude.ai rejects the source zip with "no importable files".

## Request

- Update B1 in _qa/current-src-inventory.md from the embedded source.
- Specify P0 B1 in _qa/reverse-bake-gap.md.
- Create _qa/bake-fix-checklist-B1.md.
- Do not propose runtime API, Prisma, or route changes.
- Treat the current source as reference only. The output should be a BDR-current reverse-bake plan/checklist, not direct source edits.

## PM Decision

- The v2.40 Toss-style admin console is not a long-term separate design system.
- Target direction: gradual BDR 13-rule reskin.
- For now, prioritize P0 reverse-bake. Console reskin is a separate later batch.

## Source Files


### File: src/app/(admin)/tournament-admin/layout.tsx

````tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-admin-nav";
// 2026-05-12 로그인 redirect 통합 — 비로그인 → 로그인 페이지 후 원래 tournament-admin 페이지 복귀
import { buildLoginRedirect } from "@/lib/auth/redirect";
// 2026-05-12 hotfix — CopyLinkButton 등 client component 가 useToast 호출 → (admin) 영역에 ToastProvider 부재로 throw.
// (web)/(score-sheet) layout 과 동일 패턴으로 ToastProvider mount.
import { ToastProvider } from "@/contexts/toast-context";

// AdminSidebar/AdminMobileNav role 타입 (admin/layout.tsx 와 동일)
type AdminRole =
  | "super_admin"
  | "site_admin"
  | "tournament_admin"
  | "partner_member"
  | "org_member";

/**
 * 대회 관리 레이아웃 — 서버 컴포넌트로 권한 검증 수행.
 * 2026-05-04 (사용자 요청): (web) 그룹 → (admin) 그룹으로 이동. admin sidebar + mobile nav 적용.
 * URL 경로 (`/tournament-admin/...`) 는 그대로 유지 (라우트 그룹은 URL 미반영).
 *
 * role: tournament_admin 또는 super_admin 만 접근 가능 (admin/layout.tsx 와 동일 권한 체크).
 * 미로그인 또는 권한 부족 시 홈으로 리다이렉트.
 *
 * UI: admin sidebar (lg+) + AdminMobileNav (모바일).
 */
export default async function TournamentAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getWebSession();
  if (!session) {
    // 2026-05-12: 현재 tournament-admin 경로를 redirect 쿼리에 담아 로그인 후 자동 복귀.
    // middleware 가 `x-pathname` / `x-search` 헤더 주입 (`/tournament-admin/*` matcher) — fallback "/tournament-admin".
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/tournament-admin";
    const search = h.get("x-search") ?? "";
    redirect(buildLoginRedirect(pathname, search));
  }
  // 권한 부족: 에러 메시지 포함 로그인 페이지로 리다이렉트
  // 권한 부족 = 로그인 자체는 통과한 케이스 → redirect 쿼리 동봉 안 함 (다른 계정 로그인 권유).
  const userId = BigInt(session.sub);
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipType: true, isAdmin: true, admin_role: true },
  });
  const isSuperAdmin =
    dbUser?.isAdmin === true ||
    dbUser?.admin_role === "super_admin" ||
    session.role === "super_admin" ||
    session.admin_role === "super_admin";
  const isTournamentAdmin =
    (dbUser?.membershipType ?? 0) >= 3 || session.role === "tournament_admin";

  if (!isTournamentAdmin && !isSuperAdmin) {
    redirect("/login?error=no_permission");
  }

  // AdminSidebar 표시용 role 목록 — admin/layout.tsx 와 동일 패턴
  const roles: AdminRole[] = [];
  if (isSuperAdmin) roles.push("super_admin");
  if (dbUser?.admin_role === "site_admin" || session.admin_role === "site_admin") {
    roles.push("site_admin");
  }
  if (isTournamentAdmin) roles.push("tournament_admin");

  // partner_member / org_member 체크 (super_admin 외)
  if (!roles.includes("super_admin")) {
    const [partnerMembership, orgMembership] = await Promise.all([
      prisma.partner_members.findFirst({
        where: { user_id: userId, is_active: true },
        select: { id: true },
      }),
      prisma.organization_members.findFirst({
        where: { user_id: userId, is_active: true },
        select: { id: true },
      }),
    ]);
    if (partnerMembership) roles.push("partner_member");
    if (orgMembership) roles.push("org_member");
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--color-background)]">
        {/* 데스크톱 사이드바 (lg+) — admin/layout.tsx 와 동일 패턴 */}
        <div className="hidden lg:block">
          <AdminSidebar roles={roles} />
        </div>
        {/* 모바일 햄버거 + 드로어 (lg 미만) */}
        <div className="lg:hidden">
          <AdminMobileNav roles={roles} scope="tournament" />
        </div>
        <main className="lg:ml-64">
          <div className="mx-auto max-w-[1600px] p-6 pt-16 lg:pt-6">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

````

### File: src/app/(admin)/tournament-admin/page.tsx

````tsx
import { redirect } from "next/navigation";

export default function TournamentAdminIndexPage() {
  redirect("/tournament-admin/tournaments");
}

````

### File: src/app/(admin)/tournament-admin/tournaments/page.tsx

````tsx
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminTournamentList,
  type AdminTournamentRow,
} from "./_components/admin-tournament-list";

export const dynamic = "force-dynamic";

/**
 * 본인 운영 대회 목록 — /tournament-admin/tournaments
 *
 * 2026-06-24 IA 단순화:
 *   - "대회 운영자 도구" 허브를 제거하고 대회 관리 목록을 진입점으로 고정.
 *   - 생성은 헤더의 단일 "+ 새 대회 만들기" 액션만 유지.
 *   - Prisma 쿼리 / super_admin 분기 / 권한 필터 = 비즈 0 변경.
 *
 * 2026-05-15 Admin-7-A 박제 (이전):
 *   - raw <h1> + Link → AdminPageHeader (eyebrow/breadcrumbs/actions)
 */

export default async function TournamentAdminTournamentsPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  // 2026-05-11 — 권한 시스템 정리 6번째 super_admin 우회 fix (사용자 결재 4건).
  // - super_admin: 모든 대회 표시 (제한 X)
  // - 일반 운영자: 본인이 organizer 인 대회 OR 위임받은 TAM (is_active) 대회 합산
  const isSuper = isSuperAdmin(session);
  const userId = BigInt(session.sub);

  const tournaments = await prisma.tournament
    .findMany({
      where: isSuper
        ? {}
        : {
            OR: [
              { organizerId: userId },
              { adminMembers: { some: { userId, isActive: true } } },
            ],
          },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  // 클라이언트 컴포넌트 직렬화 — BigInt id / Date 를 string 으로 변환 (새 fetch ❌)
  const rows: AdminTournamentRow[] = tournaments.map((t) => ({
    id: String(t.id),
    name: t.name,
    status: t.status ?? null,
    startDate: t.startDate ? t.startDate.toISOString() : null,
    format: t.format ?? null,
  }));

  // 헤더 라벨 분기 — super_admin 진입 시 "전체 대회" / 일반 "내 대회"
  const headerLabel = isSuper ? "전체 대회" : "내 대회";

  return (
    <div>
      {/* AdminPageHeader 보존 — 목록 화면의 단일 생성 CTA 만 노출 */}
      <AdminPageHeader
        eyebrow={`ADMIN · 대회 운영${isSuper ? " · SUPER" : ""}`}
        title={headerLabel}
        subtitle={`${isSuper ? "전체" : "내가 운영하는"} 대회를 상태별로 관리합니다.`}
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "대회 관리" },
          { label: headerLabel },
        ]}
        actions={
          <Link
            href="/tournament-admin/tournaments/new/wizard"
            className="btn btn--primary"
            style={{ textDecoration: "none" }}
          >
            + 새 대회 만들기
          </Link>
        }
      />

      {/* PR-1C-7: 상태 탭 + 검색 + 카드 list (클라이언트 필터 / 새 fetch ❌) */}
      <AdminTournamentList rows={rows} />
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx

````tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import {
  TOURNAMENT_FORMAT_LABEL,
  TOURNAMENT_STATUS_LABEL,
} from "@/lib/constants/tournament-status";
import { calculateSetupProgress, canPublish } from "@/lib/tournaments/setup-status";
import {
  getTournamentDefaultMode,
  getTournamentMatchStats,
} from "@/lib/tournaments/recording-mode";
import { normalizeGameRules } from "@/lib/tournaments/game-rules";
import { countCategoryDivisions } from "@/lib/tournaments/division-rule-sync";
import { TournamentWorkspace } from "./_components/TournamentWorkspace";
import type { DateRow, Venue } from "../new/wizard/_components/ct-schedule-venue";

export const dynamic = "force-dynamic";

type StatusTone = "ok" | "warn" | "info" | "mute" | "err";

const STATUS_TONE: Record<string, StatusTone> = {
  draft: "mute",
  upcoming: "mute",
  registration: "info",
  registration_open: "info",
  active: "info",
  published: "info",
  open: "info",
  opening_soon: "info",
  registration_closed: "warn",
  in_progress: "ok",
  live: "ok",
  ongoing: "ok",
  group_stage: "ok",
  completed: "mute",
  ended: "mute",
  closed: "mute",
  cancelled: "err",
};

function toDateInput(value: Date | null): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function toDateTimeInput(value: Date | null): string {
  if (!value) return "";
  return value.toISOString().slice(0, 16);
}

function getDateRange(startDate: Date | null, endDate: Date | null): string {
  if (!startDate) return "일정 미설정";
  const start = startDate.toLocaleDateString("ko-KR");
  const end = endDate?.toLocaleDateString("ko-KR");
  return end ? `${start} ~ ${end}` : start;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberFrom(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeSponsorDrafts(sponsors: string | null, settings: unknown) {
  const names = (sponsors ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const settingsObj = isRecord(settings) ? settings : {};
  const logoRows = Array.isArray(settingsObj.sponsor_logos)
    ? settingsObj.sponsor_logos
    : [];
  const logoByName = new Map<string, string>();
  for (const row of logoRows) {
    if (!isRecord(row)) continue;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const logoUrl = typeof row.logoUrl === "string"
      ? row.logoUrl
      : typeof row.logo_url === "string"
        ? row.logo_url
        : "";
    if (name && logoUrl) logoByName.set(name, logoUrl);
    if (name && !names.includes(name)) names.push(name);
  }

  return names.map((name, index) => ({
    id: `sp_${index}_${encodeURIComponent(name)}`,
    name,
    logoUrl: logoByName.get(name) ?? "",
  }));
}

function normalizeVenueDrafts(places: unknown, venueName: string | null, venueAddress: string | null): Venue[] {
  const rows = Array.isArray(places) ? places : [];
  const normalized = rows.flatMap((row, index): Venue[] => {
      if (!isRecord(row)) return [];
      const name = typeof row.name === "string" ? row.name.trim() : "";
      if (!name) return [];
      const rawCount = row.courtCount ?? row.court_count;
      const courtCount = typeof rawCount === "number" && Number.isFinite(rawCount)
        ? rawCount
        : 1;
      const naming: Venue["naming"] = row.naming === "alpha" ? "alpha" : "num";
      const provider = row.provider === "kakao" || row.provider === "google" ? row.provider : undefined;
      return [{
        id: typeof row.id === "string" ? row.id : `v_legacy_${index}`,
        name,
        region: typeof row.region === "string"
          ? row.region
          : typeof row.address === "string"
            ? row.address
            : "",
        courtCount,
        naming,
        provider,
        placeId: stringFrom(row.placeId ?? row.place_id),
        lat: numberFrom(row.lat),
        lng: numberFrom(row.lng),
        phone: stringFrom(row.phone),
        category: stringFrom(row.category),
        mapUrl: stringFrom(row.mapUrl ?? row.map_url),
        routeUrl: stringFrom(row.routeUrl ?? row.route_url),
      }];
    });

  if (normalized.length > 0) return normalized;
  if (!venueName) return [];
  return [{
    id: "v_legacy_0",
    name: venueName,
    region: venueAddress ?? "",
    courtCount: 1,
    naming: "num" as const,
  }];
}

function normalizeScheduleDateDrafts(scheduleDates: unknown): DateRow[] {
  if (!Array.isArray(scheduleDates)) return [];
  return scheduleDates
    .map((row, index) => {
      if (!isRecord(row)) return null;
      const date = typeof row.date === "string" ? row.date : "";
      if (!date) return null;
      const rawCourtIds = row.courtIds ?? row.court_ids;
      return {
        id: typeof row.id === "string" ? row.id : `dt_legacy_${index}`,
        date,
        courtIds: Array.isArray(rawCourtIds)
          ? rawCourtIds.filter((id): id is string => typeof id === "string")
          : [],
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

export default async function TournamentAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect(`/login?redirect=/tournament-admin/tournaments/${id}`);

  const userId = BigInt(session.sub);

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      _count: { select: { tournamentTeams: true, tournamentMatches: true } },
      tournamentSite: { select: { subdomain: true, isPublished: true } },
      divisionRules: {
        select: {
          id: true,
          code: true,
          label: true,
          format: true,
          settings: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tournament) notFound();

  if (session.role !== "super_admin") {
    const isOrganizer = tournament.organizerId === userId;
    if (!isOrganizer) {
      const member = await prisma.tournamentAdminMember.findFirst({
        where: { tournamentId: id, userId, isActive: true },
        select: { id: true },
      });
      if (!member) notFound();
    }
  }

  const site = tournament.tournamentSite[0] ?? null;
  const status = tournament.status ?? "draft";
  const divisionCount =
    tournament.divisionRules.length > 0
      ? tournament.divisionRules.length
      : countCategoryDivisions(tournament.categories);
  const progress = calculateSetupProgress(
    id,
    {
      name: tournament.name,
      startDate: tournament.startDate,
      venue_name: tournament.venue_name,
      places: tournament.places,
      series_id: tournament.series_id,
      maxTeams: tournament.maxTeams,
      entry_fee: tournament.entry_fee,
      auto_approve_teams: tournament.auto_approve_teams,
      settings: tournament.settings,
    },
    {
      divisionRules: tournament.divisionRules.map((rule) => ({
        format: rule.format,
        settings: rule.settings,
      })),
      hasTournamentSite: !!site,
      isSitePublished: !!site?.isPublished,
      matchesCount: tournament._count.tournamentMatches,
    },
  );
  const publishGate = canPublish(progress);
  const matchStats = await getTournamentMatchStats(id);
  const defaultMode = getTournamentDefaultMode({ settings: tournament.settings });
  const gameRules = normalizeGameRules(tournament.game_rules);
  const formatLabel =
    TOURNAMENT_FORMAT_LABEL[tournament.format ?? ""] ?? tournament.format ?? "토너먼트";
  const siteUrl = site?.subdomain ? `https://${site.subdomain}.mybdr.kr` : null;

  return (
    <div data-skin="toss" className="space-y-4">
      <header
        className="rounded-[var(--radius-card)] border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="admin-stat-pill" data-tone={STATUS_TONE[status] ?? "mute"}>
                {TOURNAMENT_STATUS_LABEL[status] ?? status}
              </span>
              <span className="admin-stat-pill" data-tone={site?.isPublished ? "ok" : "mute"}>
                {site?.isPublished ? "공개 중" : site ? "비공개" : "사이트 미생성"}
              </span>
              <span className="admin-stat-pill" data-tone={publishGate.ok ? "ok" : "warn"}>
                {publishGate.ok ? "공개 가능" : `필수 ${publishGate.missing.length}개 남음`}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-black leading-tight text-[var(--color-text-primary)] sm:text-2xl">
              {tournament.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {getDateRange(tournament.startDate, tournament.endDate)} · {formatLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] border px-3 py-2 text-sm font-semibold"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  backgroundColor: "var(--color-card)",
                }}
              >
                사이트로
              </a>
            )}
            <Link
              href="/tournament-admin/tournaments"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] border px-3 py-2 text-sm font-semibold"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
                backgroundColor: "var(--color-card)",
              }}
            >
              목록으로
            </Link>
          </div>
        </div>
      </header>

      <TournamentWorkspace
        tournamentId={id}
        progress={progress}
        publishGate={publishGate}
        matchStats={matchStats}
        defaultRecordingMode={defaultMode}
        setup={{
          name: tournament.name,
          status,
          startDate: toDateInput(tournament.startDate),
          endDate: toDateInput(tournament.endDate),
          venue_name: tournament.venue_name ?? "",
          venue_address: tournament.venue_address ?? "",
          maxTeams: tournament.maxTeams ?? 16,
          team_size: tournament.team_size ?? 5,
          roster_min: tournament.roster_min ?? 5,
          roster_max: tournament.roster_max ?? 12,
          entry_fee: tournament.entry_fee ? Number(tournament.entry_fee) : 0,
          allow_waiting_list: tournament.allow_waiting_list ?? false,
          waiting_list_cap: tournament.waiting_list_cap ?? null,
          auto_approve_teams: tournament.auto_approve_teams ?? false,
          registration_start_at: toDateTimeInput(tournament.registration_start_at),
          registration_end_at: toDateTimeInput(tournament.registration_end_at),
          bank_name: tournament.bank_name ?? "",
          bank_account: tournament.bank_account ?? "",
          bank_holder: tournament.bank_holder ?? "",
          fee_notes: tournament.fee_notes ?? "",
          organizer: tournament.organizer ?? "",
          host: tournament.host ?? "",
          sponsors: normalizeSponsorDrafts(tournament.sponsors, tournament.settings),
          gender: tournament.gender ?? "",
          game_time: tournament.game_time ?? "",
          game_ball: tournament.game_ball ?? "",
          game_method: tournament.game_method ?? "",
          game_rules: gameRules,
          rules: tournament.rules ?? "",
          prize_info: tournament.prize_info ?? "",
          description: tournament.description ?? "",
          logo_url: tournament.logo_url ?? "",
          banner_url: tournament.banner_url ?? "",
          places: normalizeVenueDrafts(tournament.places, tournament.venue_name, tournament.venue_address),
          schedule_dates: normalizeScheduleDateDrafts(tournament.schedule_dates),
        }}
        summary={{
          statusLabel: TOURNAMENT_STATUS_LABEL[status] ?? status,
          statusTone: STATUS_TONE[status] ?? "mute",
          teamCount: tournament._count.tournamentTeams,
          maxTeams: tournament.maxTeams,
          matchCount: tournament._count.tournamentMatches,
          divisionCount,
          siteConfigured: !!site,
          sitePublished: !!site?.isPublished,
          siteSubdomain: site?.subdomain ?? null,
        }}
      />
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_components/TournamentWorkspace.tsx

````tsx
"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import type { RecordingMode } from "@/lib/tournaments/recording-mode";
import type { SetupProgress } from "@/lib/tournaments/setup-status";
import { Icon } from "@/components/admin-toss";
import { ImageUploader } from "@/components/shared/image-uploader";
import { SetupChecklist } from "./SetupChecklist";
import {
  ScheduleVenue,
  allCourts,
  ctUid,
  serializeVenue,
  venueFromDraft,
  type DateRow,
  type Venue,
  type VenueDraft,
} from "../../new/wizard/_components/ct-schedule-venue";
import { CtGameSettings, type GameRules } from "../../new/wizard/_components/ct-game-settings";

type StatusTone = "ok" | "warn" | "info" | "mute" | "err";
type SectionId = "info" | "schedule" | "divisions" | "game" | "publish";
type PanelId = "teams" | "divisions" | "bracket" | "matches" | "recorders" | "admins" | "site";

type MatchStats = {
  total: number;
  paper: number;
  flutter: number;
  inProgress: number;
};

type SetupFormState = {
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  venue_name: string;
  venue_address: string;
  maxTeams: number;
  team_size: number;
  roster_min: number;
  roster_max: number;
  entry_fee: number;
  allow_waiting_list: boolean;
  waiting_list_cap: number | null;
  auto_approve_teams: boolean;
  registration_start_at: string;
  registration_end_at: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  fee_notes: string;
  organizer: string;
  host: string;
  sponsors: SponsorDraft[];
  gender: string;
  game_time: string;
  game_ball: string;
  game_method: string;
  game_rules: GameRules;
  rules: string;
  prize_info: string;
  description: string;
  logo_url: string;
  banner_url: string;
  places: Venue[];
  schedule_dates: DateRow[];
};

type SponsorDraft = {
  id: string;
  name: string;
  logoUrl: string;
};

type Props = {
  tournamentId: string;
  progress: SetupProgress;
  publishGate: { ok: boolean; missing: string[] };
  matchStats: MatchStats;
  defaultRecordingMode: RecordingMode;
  setup: SetupFormState;
  summary: {
    statusLabel: string;
    statusTone: StatusTone;
    teamCount: number;
    maxTeams: number | null;
    matchCount: number;
    divisionCount: number;
    siteConfigured: boolean;
    sitePublished: boolean;
    siteSubdomain: string | null;
  };
};

type PanelComponent = ComponentType<object>;

const TeamsPanel = dynamic(() => import("../_panels/teams-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const DivisionsPanel = dynamic(() => import("../_panels/divisions-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const BracketPanel = dynamic(() => import("../_panels/bracket-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const RecordersPanel = dynamic(() => import("../_panels/recorders-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const AdminsPanel = dynamic(() => import("../_panels/admins-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const SitePanel = dynamic(() => import("../_panels/site-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const MatchesPanel = dynamic(() => import("../_panels/matches-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
});

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: "info", label: "기본" },
  { id: "schedule", label: "일정" },
  { id: "divisions", label: "종별" },
  { id: "game", label: "경기" },
  { id: "publish", label: "접수·공개" },
];

const LEGACY_SECTION_MAP: Record<string, SectionId> = {
  setup: "info",
  teams: "publish",
  structure: "divisions",
  matches: "game",
  staff: "game",
};

const RECORDING_MODE_LABEL: Record<RecordingMode, string> = {
  flutter: "기록앱",
  paper: "전자기록지",
  manual: "수기",
};

function isFormDirty(form: SetupFormState, baseline: SetupFormState) {
  return (Object.keys(form) as Array<keyof SetupFormState>).some(
    (key) => form[key] !== baseline[key],
  );
}

function getScrollOffset() {
  if (typeof window === "undefined") return 96;
  return window.matchMedia("(max-width: 1023px)").matches ? 118 : 96;
}

function cleanSponsors(sponsors: SponsorDraft[]) {
  return sponsors
    .map((s) => ({ ...s, name: s.name.trim(), logoUrl: s.logoUrl.trim() }))
    .filter((s) => s.name);
}

function positiveInt(value: number | null | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

function nonNegativeNumber(value: number | null | undefined, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function FormGroupTitle({ title, flush = false }: { title: string; flush?: boolean }) {
  return (
    <div
      className={[
        "col-span-full border-t pt-3",
        flush ? "mt-0 border-t-0 pt-0" : "mt-1",
      ].join(" ")}
      style={{ borderColor: "var(--color-border)" }}
    >
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{title}</p>
    </div>
  );
}

export function TournamentWorkspace({
  tournamentId,
  progress,
  publishGate,
  matchStats,
  defaultRecordingMode,
  setup,
  summary,
}: Props) {
  const router = useRouter();
  const [active, setActive] = useState<SectionId>("info");
  const [openPanels, setOpenPanels] = useState<Set<PanelId>>(new Set());
  const [form, setForm] = useState(setup);
  const [lastSavedForm, setLastSavedForm] = useState(setup);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const siteUrl = summary.siteSubdomain ? `https://${summary.siteSubdomain}.mybdr.kr` : null;
  const courts = useMemo(() => allCourts(form.places), [form.places]);
  const dirty = useMemo(() => isFormDirty(form, lastSavedForm), [form, lastSavedForm]);
  const urgentCount =
    publishGate.missing.length +
    (summary.teamCount === 0 ? 1 : 0) +
    (summary.divisionCount === 0 ? 1 : 0) +
    (summary.matchCount === 0 ? 1 : 0);

  useEffect(() => {
    const rawHash = window.location.hash.replace("#", "");
    const hash = (LEGACY_SECTION_MAP[rawHash] ?? rawHash) as SectionId;
    if (SECTIONS.some((section) => section.id === hash)) {
      moveTo(hash, "auto");
    }
  }, []);

  function moveTo(id: SectionId, behavior: ScrollBehavior = "smooth") {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
    const target = document.getElementById(id);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top: Math.max(top, 0), behavior });
  }

  function openPanelAndMove(id: SectionId, panel?: PanelId) {
    if (panel) {
      setOpenPanels((current) => {
        const next = new Set(current);
        next.add(panel);
        return next;
      });
    }
    moveTo(id);
  }

  function togglePanel(id: PanelId) {
    setOpenPanels((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function patchForm<K extends keyof SetupFormState>(key: K, value: SetupFormState[K]) {
    setSaveState("idle");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setSponsors(next: SponsorDraft[]) {
    patchForm("sponsors", next);
  }

  function addVenue(draft: VenueDraft) {
    const venue = venueFromDraft(draft);
    if (!venue.name) return;
    if (form.places.some((item) => item.name === venue.name || (venue.placeId && item.placeId === venue.placeId))) {
      setMessage("이미 등록된 장소입니다.");
      setSaveState("error");
      return;
    }
    patchForm("places", [
      ...form.places,
      venue,
    ]);
  }

  function updateVenue(id: string, patch: Partial<Venue>) {
    patchForm(
      "places",
      form.places.map((venue) => (venue.id === id ? { ...venue, ...patch } : venue)),
    );
  }

  function removeVenue(id: string) {
    const nextPlaces = form.places.filter((venue) => venue.id !== id);
    const removedCourtPrefix = `${id}_c`;
    patchForm("places", nextPlaces);
    patchForm(
      "schedule_dates",
      form.schedule_dates.map((date) => ({
        ...date,
        courtIds: date.courtIds.filter((courtId) => !courtId.startsWith(removedCourtPrefix)),
      })),
    );
  }

  function syncDates(dateStrings: string[]) {
    const sorted = [...dateStrings].sort();
    const nextDates = sorted.map(
        (date) =>
          form.schedule_dates.find((item) => item.date === date) ?? {
            id: ctUid("dt"),
            date,
            courtIds: [],
          },
      );
    setSaveState("idle");
    setForm((current) => ({
      ...current,
      schedule_dates: nextDates,
      startDate: sorted[0] ?? "",
      endDate: sorted[sorted.length - 1] ?? "",
    }));
  }

  function removeDate(id: string) {
    const nextDates = form.schedule_dates.filter((date) => date.id !== id);
    const sorted = nextDates.map((date) => date.date).filter(Boolean).sort();
    setSaveState("idle");
    setForm((current) => ({
      ...current,
      schedule_dates: nextDates,
      startDate: sorted[0] ?? "",
      endDate: sorted[sorted.length - 1] ?? "",
    }));
  }

  function toggleDateCourt(dateId: string, courtId: string) {
    patchForm(
      "schedule_dates",
      form.schedule_dates.map((date) =>
        date.id === dateId
          ? {
              ...date,
              courtIds: date.courtIds.includes(courtId)
                ? date.courtIds.filter((id) => id !== courtId)
                : [...date.courtIds, courtId],
            }
          : date,
      ),
    );
  }

  async function saveSetup() {
    setSaving(true);
    setMessage("");
    setSaveState("idle");

    const sponsors = cleanSponsors(form.sponsors);
    const sponsorLogos = sponsors
      .filter((s) => s.logoUrl)
      .map((s) => ({ name: s.name, logoUrl: s.logoUrl }));
    const places = form.places
      .map(serializeVenue)
      .filter((place) => place.name);
    const scheduleDates = form.schedule_dates
      .map((date) => ({
        id: date.id,
        date: date.date,
        court_ids: date.courtIds,
      }))
      .filter((date) => date.date);
    const primaryVenue = places[0] ?? null;
    const venueName = primaryVenue ? primaryVenue.name : null;
    const venueAddress = primaryVenue ? primaryVenue.region || null : null;
    const teamSize = positiveInt(form.team_size, 5);
    const rosterMin = positiveInt(form.roster_min, 5);
    const rosterMax = positiveInt(form.roster_max, 12);
    const waitingListCap = form.allow_waiting_list
      ? positiveInt(form.waiting_list_cap, 0) || null
      : null;

    if (rosterMin > rosterMax) {
      setSaving(false);
      setSaveState("error");
      setMessage("최소 로스터 수는 최대 로스터 수보다 클 수 없습니다.");
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      venue_name: venueName,
      venue_address: venueAddress,
      maxTeams: Number(form.maxTeams) > 0 ? Number(form.maxTeams) : undefined,
      team_size: teamSize,
      roster_min: rosterMin,
      roster_max: rosterMax,
      entry_fee: nonNegativeNumber(form.entry_fee),
      allow_waiting_list: form.allow_waiting_list,
      waiting_list_cap: waitingListCap,
      auto_approve_teams: form.auto_approve_teams,
      registration_start_at: form.registration_start_at || null,
      registration_end_at: form.registration_end_at || null,
      bank_name: form.bank_name.trim() || null,
      bank_account: form.bank_account.trim() || null,
      bank_holder: form.bank_holder.trim() || null,
      fee_notes: form.fee_notes.trim() || null,
      organizer: form.organizer.trim() || null,
      host: form.host.trim() || null,
      sponsors: sponsors.map((s) => s.name).join(", "),
      gender: form.gender.trim() || null,
      game_time: form.game_time.trim() || null,
      game_ball: form.game_ball.trim() || null,
      game_method: form.game_method.trim() || null,
      game_rules: form.game_rules,
      rules: form.rules.trim() || null,
      prize_info: form.prize_info.trim() || null,
      description: form.description.trim() || null,
      logo_url: form.logo_url.trim() || null,
      banner_url: form.banner_url.trim() || null,
      places,
      schedule_dates: scheduleDates,
      settings: { sponsor_logos: sponsorLogos },
    };

    try {
      const res = await fetch(`/api/web/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
      setSaveState("saved");
      setMessage("저장 완료");
      setLastSavedForm(form);
      router.refresh();
    } catch (error) {
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function renderGlobalSave() {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {message && (
          <p className={saveState === "error" ? "text-sm text-[var(--color-error)]" : "text-sm text-[var(--color-success)]"}>
            {message}
          </p>
        )}
        <button type="button" className="ts-btn ts-btn--primary ts-btn--sm" onClick={saveSetup} disabled={saving}>
          {saving ? "저장 중" : "저장"}
        </button>
      </div>
    );
  }

  function renderDesktopSaveBar() {
    return (
      <div
        className="sticky bottom-3 z-30 ml-auto hidden w-fit max-w-full rounded-[12px] border px-3 py-2 shadow-lg lg:flex lg:items-center lg:gap-3"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-card) 94%, transparent)",
        }}
      >
        <div className="min-w-[180px] text-right">
          <p className="text-xs font-bold text-[var(--color-text-muted)]">저장 상태</p>
          <p className="truncate text-sm font-black text-[var(--color-text-primary)]">
            {saving ? "저장 중입니다" : dirty ? "변경사항이 있습니다" : saveState === "saved" ? "저장되었습니다" : message || "변경사항 없음"}
          </p>
        </div>
        <button type="button" className="ts-btn ts-btn--primary ts-btn--sm min-w-[96px]" onClick={saveSetup} disabled={saving}>
          {saving ? "저장 중" : "저장"}
        </button>
      </div>
    );
  }

  return (
    <div data-skin="toss" className="ct-page ct-page--workspace space-y-3 pb-24 lg:pb-0">
      <section className="ts-card ts-card--tight ct-workspace-summary">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
          <div className="min-w-0">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <OperationShortcut
                label="참가팀"
                value={`${summary.teamCount}${summary.maxTeams ? ` / ${summary.maxTeams}` : ""}`}
                helper={form.auto_approve_teams ? "자동 승인" : "승인 확인"}
                onClick={() => openPanelAndMove("publish", "teams")}
              />
              <OperationShortcut
                label="종별 설정"
                value={`${summary.divisionCount}개`}
                helper={summary.divisionCount > 0 ? "운영 방식 확인" : "설정 필요"}
                onClick={() => openPanelAndMove("divisions", "divisions")}
              />
              <OperationShortcut
                label="경기 운영"
                value={`${matchStats.total}경기`}
                helper={matchStats.inProgress > 0 ? `${matchStats.inProgress}경기 진행중` : "일정·기록 확인"}
                onClick={() => openPanelAndMove("game", "matches")}
              />
              <OperationShortcut
                label="공개 상태"
                value={summary.sitePublished ? "공개 중" : publishGate.ok ? "공개 가능" : `${urgentCount}개 확인`}
                helper={summary.siteConfigured ? "사이트 설정" : "사이트 필요"}
                onClick={() => openPanelAndMove("publish", "site")}
              />
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-[4px] bg-[var(--grey-100)]">
              <div
                className="h-full transition-all"
                style={{ width: `${percent}%`, backgroundColor: "var(--color-accent)" }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              진행률 {progress.completed}/{progress.total} · {publishGate.ok ? "공개 가능" : `${publishGate.missing.length}개 남음`}
            </p>
          </div>
          <div className="hidden lg:flex lg:flex-col lg:gap-2">
            <SectionNav active={active} onMove={moveTo} compact />
            {renderGlobalSave()}
          </div>
        </div>
      </section>

      <div
        className="sticky top-0 z-30 border-y py-1.5 backdrop-blur lg:hidden"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-background) 92%, transparent)",
        }}
      >
        <SectionNav active={active} onMove={moveTo} compact />
      </div>

      <div className="ct-grid ct-grid--2 ct-grid--workspace">
        <div className="ct-col space-y-3">
      <WorkspaceSection
        id="info"
        title="대회 정보"
        subtitle="기본 정보와 일정·장소를 함께 수정합니다."
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FormGroupTitle title="대회 정보" flush />
            <Field label="대회 이름" className="col-span-2">
              <input className="ts-input" value={form.name} onChange={(e) => patchForm("name", e.target.value)} />
            </Field>
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
            <div className="grid grid-cols-2 content-start gap-3 self-start">
              <Field label="주최">
                <input className="ts-input" value={form.organizer} onChange={(e) => patchForm("organizer", e.target.value)} />
              </Field>
              <Field label="주관">
                <input className="ts-input" value={form.host} onChange={(e) => patchForm("host", e.target.value)} />
              </Field>
              <div className="col-span-2">
                <SponsorEditor sponsors={form.sponsors} setSponsors={setSponsors} />
              </div>
            </div>
            <div id="schedule" className="scroll-mt-24">
              <ScheduleVenue
                embedded
                dates={form.schedule_dates}
                venues={form.places}
                courts={courts}
                syncDates={syncDates}
                removeDate={removeDate}
                addVenue={addVenue}
                updateVenue={updateVenue}
                removeVenue={removeVenue}
                toggleDateCourt={toggleDateCourt}
              />
            </div>
          </div>
          <div>
            <FormGroupTitle title="소개" />
            <Field label="대회 소개">
              <textarea
                className="ts-input min-h-24 resize-y"
                value={form.description}
                onChange={(e) => patchForm("description", e.target.value)}
                placeholder="대회 소개"
              />
            </Field>
          </div>
          <details
            className="border-t pt-3"
            style={{ borderColor: "var(--color-border)" }}
          >
            <summary className="min-h-[44px] cursor-pointer py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              대표 이미지 관리
            </summary>
            <div className="grid gap-3 md:grid-cols-[minmax(180px,0.42fr)_minmax(0,1fr)]">
              <ImageUploader
                value={form.logo_url}
                onChange={(url) => patchForm("logo_url", url)}
                bucket="tournament-images"
                path={`tournaments/${tournamentId}/logo`}
                label="대회 로고"
                aspectRatio="1/1"
                maxSizeMB={5}
              />
              <ImageUploader
                value={form.banner_url}
                onChange={(url) => patchForm("banner_url", url)}
                bucket="tournament-images"
                path={`tournaments/${tournamentId}/banner`}
                label="포스터/배너"
                aspectRatio="16/9"
                maxSizeMB={5}
              />
            </div>
          </details>
        </div>
      </WorkspaceSection>

      <WorkspaceSection
        id="game"
        title="경기 설정"
        subtitle="경기 규칙과 기록을 관리합니다."
      >
        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="경기 시간">
            <input className="ts-input" value={form.game_time} onChange={(e) => patchForm("game_time", e.target.value)} />
          </Field>
          <Field label="사용구">
            <input className="ts-input" value={form.game_ball} onChange={(e) => patchForm("game_ball", e.target.value)} />
          </Field>
          <Field label="경기 방식" className="col-span-2 md:col-span-1">
            <input className="ts-input" value={form.game_method} onChange={(e) => patchForm("game_method", e.target.value)} />
          </Field>
        </div>
        <div className="mb-3">
          <CtGameSettings value={form.game_rules} onChange={(next) => patchForm("game_rules", next)} />
        </div>
        <div className="mb-3 grid gap-3">
          <FormGroupTitle title="운영 안내" flush />
          <Field label="대회 규칙">
            <textarea
              className="ts-input min-h-24 resize-y"
              value={form.rules}
              onChange={(e) => patchForm("rules", e.target.value)}
              placeholder="대회 규칙"
            />
          </Field>
          <Field label="상금/시상 안내">
            <textarea
              className="ts-input min-h-20 resize-y"
              value={form.prize_info}
              onChange={(e) => patchForm("prize_info", e.target.value)}
              placeholder="상금 또는 시상 안내"
            />
          </Field>
        </div>
        <PanelSummary
          stats={[
            ["전체 경기", `${matchStats.total}`],
            ["기록 방식", RECORDING_MODE_LABEL[defaultRecordingMode]],
            ["기록앱", `${matchStats.flutter}`],
            ["종이", `${matchStats.paper}`],
            ["진행중", `${matchStats.inProgress}`],
          ]}
          panels={[
            ["matches", "경기 운영"],
            ["recorders", "기록원"],
            ["admins", "운영진"],
          ]}
          openPanels={openPanels}
          onToggle={togglePanel}
        />
        {openPanels.has("matches") && (
          <PanelFrame>
            <MatchesPanel
              tournamentId={tournamentId}
              defaultMode={defaultRecordingMode}
              matchStats={matchStats}
            />
          </PanelFrame>
        )}
        {openPanels.has("recorders") && (
          <PanelFrame>
            <RecordersPanel />
          </PanelFrame>
        )}
        {openPanels.has("admins") && (
          <PanelFrame>
            <AdminsPanel />
          </PanelFrame>
        )}
      </WorkspaceSection>

        </div>
        <div className="ct-col space-y-3">
      <WorkspaceSection id="divisions" title="종별·디비전" subtitle="종별과 대진을 관리합니다.">
        <PanelSummary
          stats={[
            ["종별", `${summary.divisionCount}`],
            ["대진 경기", `${summary.matchCount}`],
          ]}
          panels={[
            ["divisions", "종별 운영 방식"],
            ["bracket", "대진 생성"],
          ]}
          openPanels={openPanels}
          onToggle={togglePanel}
        />
        {openPanels.has("divisions") && (
          <PanelFrame>
            <DivisionsPanel />
          </PanelFrame>
        )}
        {openPanels.has("bracket") && (
          <PanelFrame>
            <BracketPanel />
          </PanelFrame>
        )}
      </WorkspaceSection>

      <WorkspaceSection
        id="publish"
        title="접수·공개"
        subtitle="참가 접수, 팀 기준, 공개 상태를 운영합니다."
      >
        <PanelSummary
          stats={[
            ["참가팀", `${summary.teamCount}${summary.maxTeams ? ` / ${summary.maxTeams}` : ""}`],
            ["승인", form.auto_approve_teams ? "자동" : "수동"],
            ["대기접수", form.allow_waiting_list ? "허용" : "미허용"],
            ["사이트", summary.siteConfigured ? "설정됨" : "미설정"],
            ["공개", summary.sitePublished ? "공개 중" : "비공개"],
            ["공개 가능", publishGate.ok ? "가능" : "대기"],
          ]}
          panels={[
            ["teams", "참가팀 관리"],
            ["site", "사이트 공개"],
          ]}
          openPanels={openPanels}
          onToggle={togglePanel}
        />
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ts-btn ts-btn--secondary ts-btn--sm mt-3"
          >
            공개 사이트 보기
          </a>
        )}
        {openPanels.has("teams") && (
          <PanelFrame>
            <TeamsPanel />
          </PanelFrame>
        )}
        {openPanels.has("site") && (
          <PanelFrame>
            <SitePanel />
          </PanelFrame>
        )}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <FormGroupTitle title="접수·결제" flush />
          <Field label="참가비">
            <input
              className="ts-input"
              type="number"
              min={0}
              value={form.entry_fee}
              onChange={(e) => patchForm("entry_fee", Number(e.target.value))}
            />
          </Field>
          <Field label="접수 시작" className="col-span-2 sm:col-span-1">
            <input
              className="ts-input"
              type="datetime-local"
              value={form.registration_start_at}
              onChange={(e) => patchForm("registration_start_at", e.target.value)}
            />
          </Field>
          <Field label="접수 종료" className="col-span-2 sm:col-span-1">
            <input
              className="ts-input"
              type="datetime-local"
              value={form.registration_end_at}
              onChange={(e) => patchForm("registration_end_at", e.target.value)}
            />
          </Field>
          <Field label="은행명">
            <input
              className="ts-input"
              value={form.bank_name}
              onChange={(e) => patchForm("bank_name", e.target.value)}
              placeholder="은행명"
            />
          </Field>
          <Field label="계좌번호">
            <input
              className="ts-input"
              value={form.bank_account}
              onChange={(e) => patchForm("bank_account", e.target.value)}
              placeholder="계좌번호"
            />
          </Field>
          <Field label="예금주">
            <input
              className="ts-input"
              value={form.bank_holder}
              onChange={(e) => patchForm("bank_holder", e.target.value)}
              placeholder="예금주"
            />
          </Field>
          <Field label="참가비 안내" className="col-span-2">
            <textarea
              className="ts-input min-h-20 resize-y"
              value={form.fee_notes}
              onChange={(e) => patchForm("fee_notes", e.target.value)}
              placeholder="입금 및 환불 안내"
            />
          </Field>
          <FormGroupTitle title="팀 설정" />
          <Field label="최대 팀 수">
            <input
              className="ts-input"
              type="number"
              min={1}
              value={form.maxTeams}
              onChange={(e) => patchForm("maxTeams", Number(e.target.value))}
            />
          </Field>
          <Field label="경기 인원">
            <input
              className="ts-input"
              type="number"
              min={1}
              value={form.team_size}
              onChange={(e) => patchForm("team_size", Number(e.target.value))}
            />
          </Field>
          <Field label="최소 선수">
            <input
              className="ts-input"
              type="number"
              min={1}
              value={form.roster_min}
              onChange={(e) => patchForm("roster_min", Number(e.target.value))}
            />
          </Field>
          <Field label="최대 선수">
            <input
              className="ts-input"
              type="number"
              min={1}
              value={form.roster_max}
              onChange={(e) => patchForm("roster_max", Number(e.target.value))}
            />
          </Field>
          <label className="flex min-h-[52px] items-center gap-3 rounded-[14px] bg-[var(--grey-50)] px-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.auto_approve_teams}
              onChange={(e) => patchForm("auto_approve_teams", e.target.checked)}
            />
            <span className="text-sm font-semibold text-[var(--ink)]">참가팀 자동 승인</span>
          </label>
          <label className="flex min-h-[52px] items-center gap-3 rounded-[14px] bg-[var(--grey-50)] px-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.allow_waiting_list}
              onChange={(e) => patchForm("allow_waiting_list", e.target.checked)}
            />
            <span className="text-sm font-semibold text-[var(--ink)]">대기 접수 허용</span>
          </label>
          {form.allow_waiting_list && (
            <Field label="대기팀 상한" className="col-span-2 sm:col-span-1">
              <input
                className="ts-input"
                type="number"
                min={1}
                value={form.waiting_list_cap ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  patchForm("waiting_list_cap", value ? Number(value) : null);
                }}
                placeholder="제한 없음"
              />
            </Field>
          )}
        </div>
        <details className="mt-3 rounded-[14px] bg-[var(--grey-50)] p-3">
          <summary className="min-h-[40px] cursor-pointer py-1.5 text-sm font-bold text-[var(--ink)]">
            공개 체크리스트
          </summary>
          <div className="mt-3">
            <SetupChecklist
              progress={progress}
              tournamentId={tournamentId}
              isSitePublished={summary.sitePublished}
              hasSite={summary.siteConfigured}
            />
          </div>
        </details>
      </WorkspaceSection>
        </div>
      </div>

      {renderDesktopSaveBar()}

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <div className="mx-auto flex max-w-[520px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[var(--color-text-muted)]">저장 상태</p>
            <p className="truncate text-sm font-black text-[var(--color-text-primary)]">
              {saving ? "저장 중입니다" : dirty ? "변경사항이 있습니다" : saveState === "saved" ? "저장되었습니다" : message || "변경사항 없음"}
            </p>
          </div>
          <button type="button" className="ts-btn ts-btn--primary min-w-[112px]" onClick={saveSetup} disabled={saving}>
            {saving ? "저장 중" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SponsorEditor({
  sponsors,
  setSponsors,
}: {
  sponsors: SponsorDraft[];
  setSponsors: (next: SponsorDraft[]) => void;
}) {
  const [name, setName] = useState("");

  function addSponsor() {
    const nextName = name.trim();
    if (!nextName) return;
    if (sponsors.some((s) => s.name.trim() === nextName)) return;
    setSponsors([...sponsors, { id: ctUid("sp"), name: nextName, logoUrl: "" }]);
    setName("");
  }

  function updateSponsor(id: string, patch: Partial<SponsorDraft>) {
    setSponsors(sponsors.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  return (
    <div className="ts-field">
      <span className="ts-field__label">후원사</span>
      <div className="flex gap-2">
        <input
          className="ts-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              addSponsor();
            }
          }}
          placeholder="후원사명"
        />
        <button type="button" className="ts-btn ts-btn--secondary shrink-0" onClick={addSponsor}>
          추가
        </button>
      </div>
      {sponsors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {sponsors.map((s) => (
            <div key={s.id} className="ct-sptile">
              <button
                type="button"
                className="ct-sptile__x"
                onClick={() => setSponsors(sponsors.filter((item) => item.id !== s.id))}
                aria-label="후원사 삭제"
              >
                <Icon name="x" size={13} />
              </button>
              <ImageUploader
                value={s.logoUrl}
                onChange={(url) => updateSponsor(s.id, { logoUrl: url })}
                bucket="tournament-assets"
                path="tournaments/sponsors"
                label="로고"
                aspectRatio="1/1"
              />
              <input
                className="ts-input mt-2 text-center"
                value={s.name}
                onChange={(e) => updateSponsor(s.id, { name: e.target.value })}
                aria-label="후원사명"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionNav({
  active,
  onMove,
  compact = false,
}: {
  active: SectionId;
  onMove: (id: SectionId) => void;
  compact?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!compact) return;
    const activeButton = rootRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');
    activeButton?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active, compact]);

  return (
    <div ref={rootRef} className={["ts-segment", compact ? "overflow-x-auto" : ""].join(" ")}>
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          aria-label={section.label}
          aria-current={active === section.id ? "true" : undefined}
          data-active={active === section.id}
          onClick={() => onMove(section.id)}
          className={[
            "ts-segment__btn whitespace-nowrap",
            compact ? "min-w-[84px] shrink-0 text-xs" : "",
          ].join(" ")}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}

function OperationShortcut({
  label,
  value,
  helper,
  onClick,
}: {
  label: string;
  value: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[12px] bg-[var(--grey-50)] p-2.5 text-left transition hover:bg-[var(--primary-weak)]"
    >
      <span className="min-w-0">
        <span className="block text-xs font-bold text-[var(--ink-mute)]">{label}</span>
        <span className="block truncate text-sm font-black text-[var(--ink)]">{value}</span>
        <span className="block truncate text-xs text-[var(--ink-mute)]">{helper}</span>
      </span>
    </button>
  );
}

function WorkspaceSection({
  id,
  title,
  subtitle,
  action,
  children,
}: {
  id: SectionId;
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="ts-card scroll-mt-24"
    >
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="ct-headicon">
            <Icon name="trophy" size={18} color="var(--primary)" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black text-[var(--ink)]">{title}</h2>
            <p className="mt-0.5 text-xs text-[var(--ink-mute)]">{subtitle}</p>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={["ts-field block", className].join(" ")}>
      <span className="ts-field__label">
        {label}
      </span>
      {children}
    </label>
  );
}

function Metric({ label, value, tone = "mute" }: { label: string; value: string; tone?: StatusTone }) {
  return (
    <div className="ct-metric rounded-[14px] bg-[var(--grey-50)] px-3 py-2">
      <p className="text-xs font-bold text-[var(--ink-mute)]">{label}</p>
      <p className="mt-0.5 text-sm font-black text-[var(--ink)]">
        {value}
        {tone !== "mute" && <span className="sr-only"> {tone}</span>}
      </p>
    </div>
  );
}

function PanelSummary({
  stats,
  panels,
  openPanels,
  onToggle,
}: {
  stats: Array<[string, string]>;
  panels: Array<[PanelId, string]>;
  openPanels: Set<PanelId>;
  onToggle: (id: PanelId) => void;
}) {
  return (
    <div className="ct-panel-summary">
      <div className="ct-panel-stats">
        {stats.map(([label, value]) => (
          <Metric key={label} label={label} value={value} />
        ))}
      </div>
      <div className="ct-panel-actions">
        {panels.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={[
              "ts-btn ts-btn--sm",
              openPanels.has(id) ? "ts-btn--primary" : "ts-btn--secondary",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelFrame({ children }: { children: ReactNode }) {
  return <div className="ta-panel-embed mt-3">{children}</div>;
}

function PanelLoading() {
  return (
    <div className="ct-emptybox mt-4">
      불러오는 중
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_components/NextStepCTA.tsx

````tsx
/**
 * 2026-05-16 PR-Admin-1 — 단계간 CTA (admin 흐름 §6.5 우선 1).
 *
 * 이유(왜):
 *   - admin-flow-audit-2026-05-16 §3 단계 4·7 단절 ("divisions → teams" / "bracket → matches"
 *     이동 시 SetupChecklist hub 로 다시 돌아가야 다음 단계 진입 가능 — §4 #18 영향도 H).
 *   - 페이지 footer 단일 카드 CTA 박제로 자연스러운 흐름 회복.
 *   - matches → null = PR-Admin-2 단일 순위전 trigger 로 흡수 (별 CTA 없음).
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-info) Navy 톤 / rounded-[4px] / lucide "arrow-right" (Track B-c)
 *   - 모바일 full-width / PC 우측 정렬 / 44px+ 터치 영역
 *
 * 사용:
 *   <NextStepCTA tournamentId={id} currentStep="divisions" />
 *
 * disabled 옵션 (선택):
 *   - 선행 단계 미완성 시 회색 톤 + 안내 메시지 노출
 */

"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";

// ─────────────────────────────────────────────────────────────────────────
// 단계 매핑 — 컴포넌트 내부 single source (admin-flow-audit §3 자연 흐름)
// ─────────────────────────────────────────────────────────────────────────

type Step = "divisions" | "teams" | "bracket" | "matches";

// next = 다음 단계 라우트 segment / label = CTA 라벨
// matches → null = PR-Admin-2 흡수 (단일 순위전 trigger 별도 박제)
const NEXT_STEP_MAP: Record<Step, { next: string; label: string } | null> = {
  divisions: { next: "teams", label: "다음: 팀 등록" },
  teams: { next: "bracket", label: "다음: 대진표 생성" },
  bracket: { next: "matches", label: "다음: 경기 관리" },
  matches: null,
};

type Props = {
  tournamentId: string;
  currentStep: Step;
  // 선행 단계 미완성 시 비활성화 (선택). 기본 = 활성.
  disabled?: boolean;
  // disabled 일 때 노출 (사유 안내 — 선택)
  disabledReason?: string;
};

export function NextStepCTA({
  tournamentId,
  currentStep,
  disabled = false,
  disabledReason,
}: Props) {
  // matches 단계 = 다음 CTA 없음 (PR-Admin-2 단일 trigger 로 흡수)
  const next = NEXT_STEP_MAP[currentStep];
  if (!next) return null;

  const hash = next.next === "teams" ? "teams" : next.next === "bracket" ? "structure" : "matches";
  const href = `/tournament-admin/tournaments/${tournamentId}#${hash}`;

  // 비활성 (선행 단계 미완성) — 회색 톤 + 안내 메시지
  if (disabled) {
    return (
      <Card className="mt-6 bg-[var(--color-elevated)]">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-1 rounded-[4px] px-4 py-3 text-sm font-semibold opacity-60"
            style={{
              backgroundColor: "var(--color-elevated)",
              color: "var(--color-text-muted)",
              minHeight: 44,
            }}
          >
            {/* Material lock → lucide lock */}
            <Icon name="lock" size={18} className="align-middle" />
            {next.label}
          </button>
          {disabledReason && (
            <p className="text-xs text-[var(--color-text-muted)] sm:ml-2">
              {disabledReason}
            </p>
          )}
        </div>
      </Card>
    );
  }

  // 활성 — BDR Navy (var(--color-info)) 톤 / arrow_forward 아이콘
  return (
    <Card className="mt-6">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href={href}
          className="inline-flex w-full items-center justify-center gap-1 rounded-[4px] px-4 py-3 text-sm font-semibold transition-colors sm:w-auto"
          style={{
            backgroundColor: "var(--color-info)",
            color: "#ffffff",
            minHeight: 44,
          }}
        >
          {next.label}
          {/* Material arrow_forward → lucide arrow-right */}
          <Icon name="arrow-right" size={18} className="align-middle" />
        </Link>
      </div>
    </Card>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_components/recording-mode-card.tsx

````tsx
"use client";

/**
 * 2026-05-11 — Phase 1 tournament-admin "기록 모드 설정" 카드.
 *
 * 사용자 결재:
 *   §1 위치 = tournament-admin 대시보드 카드
 *   §2 정책 = (c) 하이브리드 (대회 default + 매치별 override)
 *   §3 라디오 3개 = all / new_only / exclude_in_progress
 *
 * 동작:
 *   1. 모드 토글 (Flutter / 종이) — 현재 default 강조 표시
 *   2. scope 라디오 3개 (영향 매치 범위)
 *   3. 사유 textarea (5자 이상 — server-side zod 와 동일)
 *   4. 적용 버튼 → confirm modal (영향 매치 수 미리보기) → POST /bulk
 *   5. 응답 후 toast + 페이지 새로고침 (router.refresh)
 *
 * 디자인 룰:
 *   - var(--color-*) 토큰만 (CLAUDE.md §디자인 핵심)
 *   - Material Symbols Outlined (lucide-react ❌)
 *   - 모바일/PC 동일 — Card 컴포넌트 + 토글 + 라디오
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";

// 2026-06-22: "manual"(수기) 추가 — BDR 기록 시스템 미사용 대회.
type Mode = "flutter" | "paper" | "manual";
type Scope = "all" | "new_only" | "exclude_in_progress";

interface Props {
  tournamentId: string;
  defaultMode: Mode;
  matchStats: {
    total: number;
    paper: number;
    flutter: number;
    inProgress: number;
  };
}

// 라디오 옵션 메타 — 사용자에게 노출할 카피 + scope 키
const SCOPE_OPTIONS: Array<{ value: Scope; label: string; desc: string }> = [
  {
    value: "all",
    label: "모든 매치 일괄 적용",
    desc: "모든 매치의 기록 모드를 선택한 값으로 변경합니다.",
  },
  {
    value: "new_only",
    label: "미설정 경기만 적용",
    desc: "운영자가 한번도 모드를 지정하지 않은 매치만 변경합니다.",
  },
  {
    value: "exclude_in_progress",
    label: "진행 중 경기 제외",
    desc: "진행 중 경기를 제외한 나머지 경기만 변경합니다.",
  },
];

// 모드 라벨 매핑 — Flutter 기록앱 / 종이 기록지(웹) / 수기(BDR 미사용)
const MODE_LABEL: Record<Mode, string> = {
  flutter: "기록앱",
  paper: "전자기록지",
  manual: "수기",
};

// lucide 키트 이름 — Material videogame_asset/description 대체
const MODE_ICON: Record<Mode, string> = {
  flutter: "gamepad-2", // videogame_asset
  paper: "file-text", // description
  manual: "pencil", // 수기 — BDR 시스템 밖에서 손으로 기록
};

export function RecordingModeCard({
  tournamentId,
  defaultMode,
  matchStats,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // 사용자가 변경하려는 신규 모드 — 처음에는 현재 default 와 동일 표시
  const [selectedMode, setSelectedMode] = useState<Mode>(defaultMode);
  // 영향 범위 라디오 — 기본 "exclude_in_progress" (가장 안전)
  const [scope, setScope] = useState<Scope>("exclude_in_progress");
  // 사유 — 5자 이상 (server-side zod 동일 룰)
  const [reason, setReason] = useState("");
  // confirm modal 노출 여부
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 결과/에러 메시지 (inline 표시 — toast 라이브러리 없이)
  const [resultMsg, setResultMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 적용 버튼 클릭 — 사유 검증 후 confirm modal 열기
  const handleApplyClick = () => {
    setResultMsg(null);
    if (reason.trim().length < 5) {
      setResultMsg({
        type: "error",
        text: "변경 사유를 5자 이상 입력해주세요.",
      });
      return;
    }
    setConfirmOpen(true);
  };

  // confirm modal "변경 적용" 클릭 — 실제 POST 호출
  const handleConfirm = () => {
    setConfirmOpen(false);
    setResultMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/web/admin/tournaments/${tournamentId}/recording-mode/bulk`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: selectedMode,
              scope,
              reason: reason.trim(),
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          // 서버 에러 — error 키 (apiError 컨벤션 — string 또는 zod 첫 메시지)
          setResultMsg({
            type: "error",
            text:
              typeof data.error === "string"
                ? data.error
                : "모드 변경에 실패했습니다.",
          });
          return;
        }
        // 성공 — affected_count + mode 표시 (snake_case — apiSuccess 변환)
        setResultMsg({
          type: "success",
          text: `${data.affected_count}건 경기 기록 방식 변경 완료 (${MODE_LABEL[data.mode as Mode]})`,
        });
        // 사유 초기화 (다음 변경 위해)
        setReason("");
        // 페이지 새로고침 — server-side stats 재계산
        router.refresh();
      } catch (err) {
        console.error("[RecordingModeCard] fetch failed:", err);
        setResultMsg({
          type: "error",
          text: "네트워크 오류로 모드 변경에 실패했습니다.",
        });
      }
    });
  };

  return (
    <Card className="mb-6">
      {/* 헤더 — 아이콘 + 타이틀 */}
      <div className="mb-3 flex items-center gap-2">
        {/* Material tune → lucide sliders-horizontal */}
        <Icon name="sliders-horizontal" size={22} color="var(--color-primary)" />
        <h3 className="font-bold text-base">기록 모드 설정</h3>
      </div>

      {/* 현재 상태 요약 — 대회 default + 매치별 통계 */}
      <div
        className="mb-4 rounded-[var(--radius-card)] border p-3 text-sm"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-elevated)",
        }}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span style={{ color: "var(--color-text-secondary)" }}>대회 기본:</span>
          <span className="font-semibold">{MODE_LABEL[defaultMode]}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>총 {matchStats.total}건</span>
          <span>기록앱 {matchStats.flutter}건</span>
          <span>전자기록지 {matchStats.paper}건</span>
          {matchStats.inProgress > 0 && (
            <span style={{ color: "var(--color-primary)" }}>
              진행중 {matchStats.inProgress}건
            </span>
          )}
        </div>
      </div>

      {/* 모드 토글 — Flutter / 종이 2개 버튼 */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
          새 모드 선택
        </div>
        {/* 2026-06-22: 2지선다 → 3지선다(수기 추가). grid-cols-3 로 자연 확장 */}
        <div className="grid grid-cols-3 gap-2">
          {(["flutter", "paper", "manual"] as Mode[]).map((m) => {
            const active = selectedMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMode(m)}
                className="flex items-center justify-center gap-2 rounded-[12px] border px-3 py-2 text-sm font-semibold transition-colors"
                style={{
                  borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                  backgroundColor: active
                    ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                    : "var(--color-card)",
                  color: active ? "var(--color-primary)" : "var(--color-text-primary)",
                }}
                aria-pressed={active}
              >
                {/* MODE_ICON = lucide 키트 이름(gamepad-2/file-text) */}
                <Icon name={MODE_ICON[m]} size={18} />
                {MODE_LABEL[m]}
              </button>
            );
          })}
        </div>

        {/* 수기 모드 안내 — selectedMode="manual" 일 때만 의미 1줄 노출 */}
        {selectedMode === "manual" && (
          <div
            className="mt-2 flex items-start gap-1.5 rounded-[12px] p-2 text-xs"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--color-primary) 8%, transparent)",
              color: "var(--color-text-secondary)",
            }}
          >
            <Icon name="info" size={14} color="var(--color-primary)" />
            <span>
              수기 = 앱과 전자기록지를 사용하지 않는 방식입니다.
            </span>
          </div>
        )}
      </div>

      {/* 영향 범위 라디오 — 3개 옵션 */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
          적용 범위
        </div>
        <div className="space-y-2">
          {SCOPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-2 rounded-[12px] border p-2 text-sm transition-colors"
              style={{
                borderColor:
                  scope === opt.value
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                backgroundColor:
                  scope === opt.value
                    ? "color-mix(in srgb, var(--color-primary) 6%, transparent)"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="recording-mode-scope"
                value={opt.value}
                checked={scope === opt.value}
                onChange={() => setScope(opt.value)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold">{opt.label}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {opt.desc}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 사유 textarea — 5자 이상 (server-side zod) */}
      <div className="mb-4">
        <label
          className="mb-2 block text-xs font-semibold"
          style={{ color: "var(--color-text-secondary)" }}
          htmlFor="recording-mode-reason"
        >
          변경 사유 <span style={{ color: "var(--color-primary)" }}>*</span>
        </label>
        <textarea
          id="recording-mode-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="결승은 전자기록지 운영"
          className="ts-input min-h-[88px] text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
            color: "var(--color-text-primary)",
          }}
        />
        <div className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {reason.length} / 500자 (최소 5자)
        </div>
      </div>

      {/* 결과 메시지 (inline) */}
      {resultMsg && (
        <div
          className="mb-3 rounded-[12px] border p-2 text-sm"
          style={{
            borderColor:
              resultMsg.type === "success"
                ? "var(--color-success)"
                : "var(--color-primary)",
            backgroundColor:
              resultMsg.type === "success"
                ? "color-mix(in srgb, var(--color-success) 10%, transparent)"
                : "color-mix(in srgb, var(--color-primary) 10%, transparent)",
            color:
              resultMsg.type === "success"
                ? "var(--color-success)"
                : "var(--color-primary)",
          }}
        >
          {resultMsg.text}
        </div>
      )}

      {/* 적용 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleApplyClick}
          disabled={pending}
          className="ts-btn ts-btn--primary ts-btn--sm"
        >
          {pending ? "처리 중..." : "모드 변경 적용"}
        </button>
      </div>

      {/* Confirm modal — 영향 매치 수 미리보기 */}
      {confirmOpen && (
        <ConfirmModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
          selectedMode={selectedMode}
          scope={scope}
          matchStats={matchStats}
        />
      )}
    </Card>
  );
}

// confirm modal — server-side 정확한 영향 매치 수는 모르지만 (settings JSON 분기 필요),
// scope 라디오 룰에 따라 client-side 미리보기 산출 (대략값 — 실제 affected_count 는 응답에서 확인)
function ConfirmModal({
  onCancel,
  onConfirm,
  selectedMode,
  scope,
  matchStats,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  selectedMode: Mode;
  scope: Scope;
  matchStats: Props["matchStats"];
}) {
  // 미리보기 산출 — scope 별 대략 영향 매치 수
  // (현재 mode 와 다른 매치만 변경 — 정확한 수는 server-side audit 박제 시 확정)
  const previewCount = (() => {
    if (scope === "all") return matchStats.total;
    if (scope === "exclude_in_progress") return matchStats.total - matchStats.inProgress;
    // new_only — 정확한 수는 server-side (settings 에 recording_mode 키 없는 매치만)
    // client-side 추산 = total - (이미 명시된 매치) — 보수적으로 total 표시
    return matchStats.total;
  })();

  return (
    <div
      data-skin="toss"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-[24px] border p-5 shadow-[var(--sh-lg)]"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          {/* Material warning → lucide triangle-alert */}
          <Icon name="triangle-alert" size={22} color="var(--color-primary)" />
          <h4 className="font-bold">기록 방식 변경 확인</h4>
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          최대 <strong style={{ color: "var(--color-primary)" }}>{previewCount}건</strong>의 매치가{" "}
          <strong>{MODE_LABEL[selectedMode]}</strong> 방식으로 변경됩니다.
          <br />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            이미 같은 방식인 경기는 자동 제외됩니다.
          </span>
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="ts-btn ts-btn--secondary ts-btn--sm"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="ts-btn ts-btn--primary ts-btn--sm"
          >
            변경 적용
          </button>
        </div>
      </div>
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_components/recording-mode-trigger.tsx

````tsx
"use client";

/**
 * 2026-05-12 — 기록 모드 설정 트리거 (버튼 + 플로팅 모달).
 *
 * 변경 (사용자 요청):
 *   - 기존: RecordingModeCard 가 큰 카드로 페이지 차지
 *   - 변경: 작은 버튼 1개 + 클릭 시 플로팅 모달 (RecordingModeCard 그대로 모달 안)
 *
 * server props 그대로 전달 (matchStats / defaultMode).
 */

import { useState } from "react";
import { RecordingModeCard } from "./recording-mode-card";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";

type Mode = "flutter" | "paper" | "manual";

interface Props {
  tournamentId: string;
  defaultMode: Mode;
  matchStats: {
    total: number;
    paper: number;
    flutter: number;
    inProgress: number;
  };
}

export function RecordingModeTriggerClient({ tournamentId, defaultMode, matchStats }: Props) {
  const [open, setOpen] = useState(false);

  const modeLabel = defaultMode === "paper"
      ? "전자기록지"
      : defaultMode === "manual"
          ? "수기"
          : "기록앱";

  return (
    <>
      {/* 압축 버튼 — 우측 정렬 + accent 톤 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p
            className="text-xs font-semibold uppercase"
            style={{ color: "var(--color-text-muted)", letterSpacing: "0.04em" }}
          >
            기록 모드
          </p>
          <p className="text-sm">
            대회 기본: <span className="font-semibold">{modeLabel}</span>{" "}
            <span style={{ color: "var(--color-text-muted)" }}>
              · 총 {matchStats.total}건 (기록앱 {matchStats.flutter} / 전자기록지 {matchStats.paper}
              {matchStats.inProgress > 0 && ` / 진행중 ${matchStats.inProgress}`})
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ts-btn ts-btn--secondary ts-btn--sm"
        >
          {/* Material tune → lucide sliders-horizontal */}
          <Icon name="sliders-horizontal" size={16} className="align-middle mr-1" />
          기록 모드 설정
        </button>
      </div>

      {/* 플로팅 모달 */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative my-3 w-full max-w-3xl sm:my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ct-iconbtn absolute right-3 top-3 z-10"
              aria-label="닫기"
            >
              {/* Material close → lucide x */}
              <Icon name="x" size={24} />
            </button>
            {/* RecordingModeCard 그대로 wrap — 기능 100% 보존 */}
            <RecordingModeCard
              tournamentId={tournamentId}
              defaultMode={defaultMode}
              matchStats={matchStats}
            />
          </div>
        </div>
      )}
    </>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_components/setup-hub-mobile-sticky.tsx

````tsx
/**
 * 2026-05-28 PR-1C-9 (B1) — 셋업 hub 모바일 sticky 공개 버튼.
 *
 * 이유(왜):
 *   - 시안 AdminTournamentSetupHub 의 atsh-mobile-sticky 박제.
 *   - 운영 공개 게이트(PublishGate)는 체크리스트 본문 안 → 모바일에서 스크롤 내려야 보임.
 *   - 모바일(≤720px)에서 하단 고정 막대로 "공개까지 N개 남음" + 공개 버튼을 항상 노출.
 *   - PC(>720px)는 hidden — 기존 PublishGate 가 본문에서 처리 (중복 노출 방지).
 *
 * 데이터/API:
 *   - 새 fetch/API/Prisma 없음. 기존 POST /api/web/tournaments/[id]/site/publish 재사용
 *     (SetupChecklist > PublishGate 와 동일 엔드포인트).
 *   - 게이트 판정값(canPublish 결과)은 서버에서 산출돼 props 로 전달 (재계산 0).
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-*) 토큰만 / Material Symbols Outlined / 4px·chip 라운드 / 44px+ 터치
 *   - sm:hidden = 모바일 전용 (Tailwind sm 분기 640px ≈ 시안 720px 대응)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";

type Props = {
  tournamentId: string;
  // 공개 가능 여부 (canPublish 결과) — 서버 산출값 전달
  canPublish: boolean;
  // 미충족 필수 항목 수 (시안 "공개까지 N개 남음")
  missingCount: number;
  // 사이트 공개 상태 (이미 공개 중이면 sticky 미노출)
  isSitePublished: boolean;
  // 사이트 박제 여부 (미박제면 공개 버튼 대신 안내)
  hasSite: boolean;
};

export function SetupHubMobileSticky({
  tournamentId,
  canPublish,
  missingCount,
  isSitePublished,
  hasSite,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // 이미 공개 중이면 모바일 sticky 불필요 (본문 PublishGate 가 비공개 전환 담당)
  if (isSitePublished) return null;

  // 공개 활성 조건 = 사이트 박제됨 + 게이트 통과
  const enabled = hasSite && canPublish;

  // 공개 액션 — PublishGate 와 동일 엔드포인트 (새 fetch 아님)
  const handlePublish = async () => {
    if (!enabled || busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/site/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: true }),
        }
      );
      if (res.ok) {
        // 성공 시 서버 컴포넌트 재렌더링 (페이지 상태 갱신)
        router.refresh();
      }
      // 실패 시 본문 PublishGate 에서 상세 오류 노출 — 여기선 sticky 만 복귀
    } finally {
      setBusy(false);
    }
  };

  return (
    // 이유: 시안 atsh-mobile-sticky = 모바일 하단 고정. PC(sm 이상)는 hidden — 본문 게이트가 처리.
    <div
      className="sticky bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-2.5 border-t px-3.5 py-3 sm:hidden"
      style={{
        backgroundColor: "var(--color-elevated)",
        borderColor: "var(--color-border)",
        // 시안 box-shadow 0 -4px 12px — 토큰 부재 → rgba 음영(검정 알파, 색상 아닌 그림자)
        boxShadow: "0 -4px 12px rgba(0,0,0,0.18)",
      }}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-[var(--color-text-primary)]">
          {enabled ? "공개 준비 완료" : `공개까지 ${missingCount}개 남음`}
        </div>
        <div className="truncate text-[11.5px] text-[var(--color-text-muted)]">
          {hasSite
            ? "신청 정책 · 사이트 · 기록 · 대진"
            : "사이트를 먼저 박제하세요"}
        </div>
      </div>
      <button
        type="button"
        onClick={handlePublish}
        disabled={!enabled || busy}
        className="inline-flex items-center gap-1 rounded-[4px] px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          backgroundColor: enabled
            ? "var(--color-primary)"
            : "var(--color-elevated)",
          color: enabled ? "var(--color-on-primary)" : "var(--color-text-muted)",
          minHeight: 44, // 디자인 룰 44px+
        }}
      >
        {/* Material public/lock → lucide globe/lock */}
        <Icon name={enabled ? "globe" : "lock"} size={18} />
        {busy ? "공개 중..." : "공개"}
      </button>
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_components/SetupChecklist.tsx

````tsx
/**
 * 2026-05-13 UI-1 — 대회 셋업 체크리스트 hub.
 * 2026-05-13 UI-5 — 공개 게이트 도입 (클라이언트 컴포넌트로 전환).
 *
 * 이유(왜):
 *   - dashboard 의 8 메뉴 카드는 "어디서 뭘 해야하는지" 만 안내했지 "지금 어디까지 왔는지" 못 보여줌.
 *   - 체크리스트 카드 8개 + 상단 progress bar 로 "진행도 + 잠금 단계 + 진입 링크" 를 한 화면에 통합.
 *   - UI-5: 필수 7항목 ✅ 일 때만 공개 버튼 활성. 미충족 시 disabled + 사유 노출 (서버 가드 = /site/publish).
 *
 * 구성:
 *   1. 상단 progress bar (`completed / total` + %)
 *   2. 8 카드 (Link wrapper / status 별 색상 / 잠금 시 cursor-not-allowed)
 *   3. 공개 버튼 (canPublish 통과 시 활성 / 미통과 시 잠금 + 미충족 항목 안내) + 비공개 전환 버튼 (공개 중일 때)
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-*) 토큰만 / Material Symbols Outlined / 4px border-radius / 44px+ 터치
 *   - 색상: ✅ accent / 🔄 warning / ⚪ text-muted / 🔒 muted + opacity 0.6
 */

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  canPublish,
  type SetupProgress,
  type ChecklistItem,
  type ChecklistStatus,
} from "@/lib/tournaments/setup-status";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";

// ─────────────────────────────────────────────────────────────────────────
// status → 색상/아이콘 매핑 (단일 진실의 원천 — UI 룰 변경 시 한 곳만 수정)
// ─────────────────────────────────────────────────────────────────────────

// 카드 좌측 상태 아이콘 (lucide 키트 이름 — Material check_circle/pending/radio_button_unchecked/lock 대체)
const STATUS_ICON: Record<ChecklistStatus, string> = {
  complete: "circle-check", // check_circle
  in_progress: "clock", // pending
  empty: "circle", // radio_button_unchecked
  locked: "lock", // lock
};

// 카드 좌측 아이콘 색상 (CSS 변수)
const STATUS_COLOR: Record<ChecklistStatus, string> = {
  complete: "var(--color-accent)",
  in_progress: "var(--color-warning)",
  empty: "var(--color-text-muted)",
  locked: "var(--color-text-muted)",
};

// 카드 좌측 상태 라벨 (한국어 — 시각 안내)
const STATUS_LABEL: Record<ChecklistStatus, string> = {
  complete: "완료",
  in_progress: "진행 중",
  empty: "미설정",
  locked: "잠금",
};

// ─────────────────────────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────────────────────────

type Props = {
  progress: SetupProgress;
  // UI-5 공개 게이트 — POST /api/web/tournaments/[id]/site/publish 에 필요
  tournamentId: string;
  // 현재 사이트 공개 상태 (사이트 박제됐을 때만 의미. 미박제 시 false)
  isSitePublished: boolean;
  // 사이트 박제 여부 (false 면 공개 버튼 대신 "사이트 만들기" 링크)
  hasSite: boolean;
};

export function SetupChecklist({
  progress,
  tournamentId,
  isSitePublished,
  hasSite,
}: Props) {
  // 진행도 % (소수 1자리, 8개 기준이라 정수 가능 시 정수로 노출)
  const percent = Math.round((progress.completed / progress.total) * 100);

  // 공개 가드 — setup-status.ts 단일 source
  const gate = canPublish(progress);

  // ⭐ PR-1C-9 (B1) — 잠금 카드 클릭 시 toast 안내 (시안 atsh-toast 박제).
  //   사유: 운영 잠금 카드는 정적 div(클릭 무반응)였음 → 시안은 클릭 시 "선행 STEP 완료 후 진행" toast.
  //   toast = { step, deps } / 2.4초 후 자동 사라짐 (시안 동일 타이밍).
  const [toast, setToast] = useState<{ step: number; deps: number[] } | null>(
    null
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showLockToast = (step: number, deps: number[]) => {
    setToast({ step, deps });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  return (
    // 이유: 시안 atsh-toast 가 position:absolute 우하단 → 컨테이너 relative 기준점 필요.
    <section className="relative mb-6">
      {/* 상단 진행도 바 */}
      <div
        className="mb-4 rounded-[var(--radius-card)] border p-4"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
      >
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--color-text-primary)]">
            대회 셋업 진행도
          </span>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {progress.completed} / {progress.total}{" "}
            <span className="text-[var(--color-text-muted)]">({percent}%)</span>
          </span>
        </div>
        {/* 이유: progress bar = elevated track + accent fill. 높이 8px / 라운드 4px (디자인 룰). */}
        <div
          className="h-2 w-full overflow-hidden rounded-[4px]"
          style={{ backgroundColor: "var(--color-elevated)" }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percent}%`,
              backgroundColor: "var(--color-accent)",
            }}
          />
        </div>
      </div>

      {/* 체크리스트 8 카드 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {progress.items.map((item) => (
          <ChecklistCard
            key={item.key}
            item={item}
            // PR-1C-9 (B1): 잠금 카드 클릭 시 toast 안내 (선행 STEP 번호 전달)
            onLockClick={showLockToast}
          />
        ))}
      </div>

      {/* ⭐ UI-5 공개 게이트 영역 — 필수 항목 충족 여부에 따라 분기 */}
      <PublishGate
        gate={gate}
        tournamentId={tournamentId}
        isSitePublished={isSitePublished}
        hasSite={hasSite}
      />

      {/* ⭐ PR-1C-9 (B1) — 잠금 카드 클릭 toast (시안 atsh-toast 박제, 우하단 고정) */}
      {toast && (
        <div
          // 이유: 시안 atsh-toast = ink 배경 + 우하단 absolute. var(--color-*) 토큰만 사용.
          //   다크 기본이라 배경은 text-primary(대비 높은 ink) / 글자는 배경색(반전) — 항상 대비 확보.
          className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-[var(--radius-chip)] px-3 py-2 text-xs font-medium shadow-lg"
          style={{
            backgroundColor: "var(--color-text-primary)",
            color: "var(--bg)",
          }}
          role="status"
        >
          {/* Material lock → lucide lock */}
          <Icon name="lock" size={16} color="var(--color-warning)" />
          {toast.deps.map((d) => `${d}단계`).join(" · ")} 완료 후 {toast.step}단계
          진행 가능
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 공개 게이트 (UI-5)
// ─────────────────────────────────────────────────────────────────────────

function PublishGate({
  gate,
  tournamentId,
  isSitePublished,
  hasSite,
}: {
  gate: { ok: boolean; missing: string[] };
  tournamentId: string;
  isSitePublished: boolean;
  hasSite: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 공개 액션 (publish=true) — 게이트 통과 + 사이트 박제 시만 호출
  const handlePublish = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/site/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: true }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        // 서버 가드 위반 시 missing 배열 응답 — 사용자에게 노출
        const missing = Array.isArray(data?.missing)
          ? `: ${data.missing.join(", ")}`
          : "";
        throw new Error((data?.error ?? "공개 실패") + missing);
      }
      // 성공 — 서버 컴포넌트 재렌더링 (페이지 상태 갱신)
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setBusy(false);
    }
  };

  // 비공개 전환 액션 (publish=false) — 게이트 무관 (즉시 허용)
  const handleUnpublish = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/site/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: false }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "전환 실패");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setBusy(false);
    }
  };

  // 사이트 미박제 시 — 6번 카드의 link 로 우회 안내 (공개 버튼 자체 노출 안 함)
  if (!hasSite) {
    return (
      <div
        className="mt-4 rounded-[var(--radius-card)] border p-4 text-sm"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-elevated)",
          color: "var(--color-text-muted)",
        }}
      >
        {/* Material info → lucide info */}
        <Icon name="info" size={16} className="align-middle" />{" "}
        사이트를 먼저 박제하세요. (6단계 → 사이트 설정)
      </div>
    );
  }

  // 이미 공개 중 — 비공개 전환 버튼
  if (isSitePublished) {
    return (
      <div
        className="mt-4 rounded-[var(--radius-card)] border p-4"
        style={{
          // 이유: 공개 중 = 긍정 상태 → success tone (어두운 톤 살짝)
          borderColor: "color-mix(in srgb, var(--color-success) 30%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--color-success) 8%, transparent)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Material public → lucide globe */}
            <Icon name="globe" size={20} color="var(--color-success)" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              대회 사이트 공개 중
            </span>
          </div>
          <button
            onClick={handleUnpublish}
            disabled={busy}
            className="rounded-[4px] border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
            style={{
              borderColor:
                "color-mix(in srgb, var(--color-error) 30%, transparent)",
              color: "var(--color-error)",
              minHeight: 44, // 디자인 룰 44px+
            }}
          >
            {busy ? "처리 중..." : "비공개 전환"}
          </button>
        </div>
        {error && (
          <p
            className="mt-2 text-xs"
            style={{ color: "var(--color-error)" }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  // 비공개 + 게이트 통과 (필수 7항목 ✅) — 공개 버튼 활성
  if (gate.ok) {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={handlePublish}
          disabled={busy}
          className="rounded-[4px] px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-40"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-on-primary)",
            minHeight: 44,
          }}
        >
          {/* Material rocket_launch → lucide rocket */}
          <Icon name="rocket" size={18} className="align-middle mr-1" />
          {busy ? "공개 중..." : "대회 공개하기"}
        </button>
        {error && (
          <p className="text-xs" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}
        <p className="text-xs text-[var(--color-text-muted)]">
          공개 시 서브도메인 사이트로 누구나 접근 가능합니다. 언제든 비공개 전환
          가능.
        </p>
      </div>
    );
  }

  // 비공개 + 게이트 미통과 — 잠긴 버튼 + 미충족 항목 안내
  return (
    <div className="mt-4 flex flex-col gap-2">
      <button
        disabled
        className="cursor-not-allowed rounded-[4px] px-4 py-3 text-sm font-semibold"
        style={{
          backgroundColor: "var(--color-elevated)",
          color: "var(--color-text-muted)",
          minHeight: 44,
          opacity: 0.7,
        }}
      >
        {/* Material lock → lucide lock */}
        <Icon name="lock" size={18} className="align-middle mr-1" />
        공개 잠금 (필수 항목 미완료)
      </button>
      <div
        className="rounded-[4px] border p-3 text-sm"
        style={{
          // 이유: 안내 = warning tone (작업 필요 = 주의). var(--color-warning) 토큰 룰 11 준수.
          borderColor:
            "color-mix(in srgb, var(--color-warning) 30%, transparent)",
          backgroundColor:
            "color-mix(in srgb, var(--color-warning) 8%, transparent)",
        }}
      >
        <p className="mb-1 font-semibold text-[var(--color-text-primary)] inline-flex items-center">
          {/* Material warning → lucide triangle-alert */}
          <Icon name="triangle-alert" size={16} className="mr-1" />
          다음 항목을 완료해주세요
        </p>
        <ul className="ml-1 list-disc pl-4 text-[var(--color-text-muted)]">
          {gate.missing.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 개별 카드
// ─────────────────────────────────────────────────────────────────────────

function ChecklistCard({
  item,
  onLockClick,
}: {
  item: ChecklistItem;
  // PR-1C-9 (B1): 잠금 카드 클릭 시 부모 toast 트리거 (선행 STEP 번호 전달)
  onLockClick?: (step: number, deps: number[]) => void;
}) {
  const isLocked = item.status === "locked";
  // PR-1C-9 (B1): 시안 depends_on — 잠금 시 선행 STEP 번호 (없으면 빈 배열)
  const deps = item.dependsOn ?? [];

  // 이유: 잠금 카드는 클릭 비활성 (Link 미사용). non-locked 만 Link wrapper.
  const inner = (
    <div
      className="rounded-[var(--radius-card)] border p-4 transition-colors"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
        opacity: isLocked ? 0.6 : 1,
        cursor: isLocked ? "not-allowed" : "pointer",
        minHeight: 96, // 44px+ 터치 (디자인 룰)
      }}
    >
      <div className="flex items-start gap-3">
        {/* 좌측 상태 아이콘 */}
        <div
          className="flex-shrink-0"
          style={{ color: STATUS_COLOR[item.status] }}
          aria-label={STATUS_LABEL[item.status]}
        >
          {/* STATUS_ICON = lucide 키트 이름(circle-check/clock/circle/lock) */}
          <Icon name={STATUS_ICON[item.status]} size={28} />
        </div>

        {/* 본문 */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">
              {item.step}단계
            </span>
            {!item.required && (
              <span className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: "var(--color-elevated)",
                  color: "var(--color-text-muted)",
                }}
              >
                선택
              </span>
            )}
          </div>
          <h3 className="mb-1 font-semibold text-[var(--color-text-primary)]">
            {item.title}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">{item.summary}</p>
          {/* ⭐ PR-Admin-5 — progress 필드 표시 (통합 카드 #3 "종별 + 운영 방식" 진행도 bar)
              사유: 통합 카드는 status 만으로 진척 파악 어려움 (in_progress 일 때 N/M 시각화 필요).
              progress 미박제 카드 (다른 6 카드) 는 영향 0. */}
          {item.progress && item.progress.total > 0 && (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-[var(--color-text-muted)]">
                <span>운영방식 박제 진척</span>
                <span>
                  {item.progress.current} / {item.progress.total}
                </span>
              </div>
              {/* progress bar (통합 카드 전용) — 4px 라운드 / accent fill */}
              <div
                className="h-1.5 w-full overflow-hidden rounded-[4px]"
                style={{ backgroundColor: "var(--color-elevated)" }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(item.progress.current / item.progress.total) * 100}%`,
                    backgroundColor:
                      item.progress.current === item.progress.total
                        ? "var(--color-accent)"
                        : "var(--color-warning)",
                  }}
                />
              </div>
            </div>
          )}
          {/* 잠금 사유 (locked 시만) */}
          {isLocked && item.lockedReason && (
            <p
              className="mt-2 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {/* Material lock → lucide lock */}
              <Icon name="lock" size={14} className="align-middle" />{" "}
              {item.lockedReason}
            </p>
          )}
          {/* ⭐ PR-1C-9 (B1) — depends_on 시각화 (시안 atsh-item__dep 박제).
              잠금 + 선행 STEP 있을 때만 "N단계 완료 후 진행" link 아이콘 행 노출. */}
          {isLocked && deps.length > 0 && (
            <p
              className="mt-1 flex items-center gap-1 text-[11px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              {/* Material link → lucide link */}
              <Icon name="link" size={13} />
              {deps.map((d) => `${d}단계`).join(" · ")} 완료 후 진행
            </p>
          )}
        </div>

        {/* 우측 화살표 (non-locked 만) */}
        {!isLocked && (
          <div
            className="flex-shrink-0 self-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            {/* Material chevron_right → lucide chevron-right */}
            <Icon name="chevron-right" size={24} />
          </div>
        )}
      </div>
    </div>
  );

  // 잠금 = 클릭 시 toast (시안 atsh-item onClick) / 그 외 = Link
  // 이유(PR-1C-9 B1): 기존엔 정적 div(무반응) → 시안은 클릭 시 선행 STEP toast 안내.
  //   button 으로 감싸 onLockClick 호출 (deps 비어도 클릭은 가능 / toast 는 deps 있을 때 의미 있음).
  if (isLocked) {
    return (
      <button
        type="button"
        onClick={() => onLockClick?.(item.step, deps)}
        className="block w-full text-left"
        aria-label={`${item.title} (잠김)`}
      >
        {inner}
      </button>
    );
  }
  return (
    <Link href={item.link} className="block">
      {inner}
    </Link>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/admins-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PanelLoadingState } from "./panel-loading-state";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Admin = {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    nickname: string | null;
    email: string;
    profile_image_url: string | null;
  };
};

const ROLE_LABEL: Record<string, string> = {
  owner: "주최자",
  admin: "관리자",
  staff: "스태프",
  scorer: "기록원",
};

export default function TournamentAdminsPage() {
  const { id } = useParams<{ id: string }>();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/admins`);
      if (res.ok) setAdmins(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addAdmin = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");
      setEmail("");
      setSuccess(`${data.user?.nickname ?? email} 님을 추가했습니다.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAdding(false);
    }
  };

  const removeAdmin = async (adminId: string, name: string) => {
    if (!confirm(`${name} 님의 관리자 권한을 제거하시겠습니까?`)) return;
    try {
      await fetch(`/api/web/tournaments/${id}/admins/${adminId}`, { method: "DELETE" });
      await load();
    } catch { /* ignore */ }
  };

  if (loading) return <PanelLoadingState label="운영진 정보를 준비 중입니다." />;

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss">
      <div className="mb-6">
        <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">← 대회 관리</Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">관리자 관리</h1>
      </div>

      {/* 추가 폼 */}
      <Card className="mb-6">
        <h2 className="mb-4 text-base font-semibold">관리자 추가</h2>
        {/* 하드코딩 색상 → CSS 변수 토큰 (시맨틱 메시지: 실패/성공) */}
        {error && <p className="mb-3 text-sm text-[var(--color-error)]">{error}</p>}
        {success && <p className="mb-3 text-sm text-[var(--color-success)]">{success}</p>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            className="flex-1 rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") addAdmin();
            }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
          >
            <option value="admin">관리자</option>
            <option value="staff">스태프</option>
            <option value="scorer">기록원</option>
          </select>
          <Button onClick={addAdmin} disabled={adding || !email.trim()}>
            {adding ? "추가 중..." : "추가"}
          </Button>
        </div>
      </Card>

      {/* 관리자 목록 */}
      {admins.length === 0 ? (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-3xl">👥</div>
          추가된 관리자가 없습니다.
        </Card>
      ) : (
        <div className="space-y-2">
          {admins.map((admin) => (
            <Card key={admin.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* 2026-05-12 — admin 빨강 본문 금지 → info(Navy) 토큰 */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-elevated)] text-sm font-bold text-[var(--color-info)]">
                    {(admin.user.nickname ?? admin.user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{admin.user.nickname ?? "이름 없음"}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{admin.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[var(--color-elevated)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
                    {ROLE_LABEL[admin.role] ?? admin.role}
                  </span>
                  <button
                    onClick={() => removeAdmin(admin.id, admin.user.nickname ?? admin.user.email)}
                    className="text-xs text-[var(--color-error)] hover:underline"
                  >
                    제거
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/bracket-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// 2026-05-04 (P4) — 듀얼 조 배정 에디터 (16팀 → 4그룹 배정 + 페어링 모드 + 저장/생성)
import { DualGroupAssignmentEditor } from "../bracket/_components/dual-group-assignment-editor";
import { PanelLoadingState } from "./panel-loading-state";
import type { SemifinalPairingMode } from "@/lib/tournaments/dual-defaults";
// 2026-05-16 PR-Admin-1 — 단계간 CTA (페이지 footer "다음: 경기 관리 →")
import { NextStepCTA } from "../_components/NextStepCTA";
// 2026-05-16 PR-Admin-4 — 종별 단위 매치 generator trigger (DivisionBracketSections 헤더 박제)
import { DivisionGenerateButton } from "../_components/DivisionGenerateButton";

const MAX_FREE_VERSIONS = 3;

type TeamInfo = { id: string; team: { name: string; primaryColor: string | null } };

type Match = {
  id: string;
  roundName: string | null;
  round_number: number | null;
  bracket_position: number | null;
  match_number: number | null;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
  // Phase D: dual_tournament 5섹션 그룹핑 + 빈 슬롯 라벨 + 일정/장소 표시용
  // apiSuccess() 가 응답 키를 자동 snake_case 로 변환하므로,
  // 응답에 실제 도착하는 키 (snake_case) + 코드 안전성 위한 camelCase 폴백 둘 다 옵셔널 정의
  group_name?: string | null;
  settings?: {
    homeSlotLabel?: string | null;
    awaySlotLabel?: string | null;
    home_slot_label?: string | null;
    away_slot_label?: string | null;
    // 2026-05-12 — 강남구협회장배 D 진단: 6 종별 매치 안 division_code 박제 / 그룹핑 분기용
    division_code?: string | null;
  } | null;
  scheduledAt?: string | null;
  scheduled_at?: string | null;
  venue_name?: string | null;
  court_number?: string | null;
};

type ApprovedTeam = { id: string; seedNumber: number | null; team: { name: string } };

type BracketVersion = {
  id: string;
  version_number: number;
  created_at: string;
  is_active: boolean;
};

type BracketData = {
  canCreate: boolean;
  needsApproval: boolean;
  currentVersion: number;
  activeVersion: number | null;
  versions: BracketVersion[];
  matches: Match[];
  approvedTeams: ApprovedTeam[];
  /** 풀리그/토너먼트 UI 분기용 — API 가 함께 내려줌 */
  format: string | null;
  // 2026-05-04 (P4) — settings.bracket (dual 조 배정 + 페어링 모드 복원용)
  // apiSuccess() 자동 변환으로 settings 안 키는 snake_case 가능 — 옵셔널로 안전 분기
  settings?: {
    bracket?: {
      groupAssignment?: Record<string, Array<string | number>>;
      group_assignment?: Record<string, Array<string | number>>;
      semifinalPairing?: SemifinalPairingMode;
      semifinal_pairing?: SemifinalPairingMode;
    } | null;
  } | null;
  // 2026-05-16 PR-Admin-4 — 종별 단위 generator 버튼이 code → ruleId 매핑에 사용
  // 옵셔널: divisionRules 미박제 대회는 빈 배열 → 버튼 비노출
  divisionRules?: Array<{
    id: string;
    code: string;
    format: string | null;
  }>;
};

// 풀리그 계열 포맷 판별 — UI 분기용
function isLeagueFormat(fmt: string | null | undefined): boolean {
  return fmt === "round_robin" || fmt === "full_league" || fmt === "full_league_knockout";
}

// 듀얼토너먼트 포맷 판별 — Phase D 5섹션 그룹핑 분기용
function isDualFormat(fmt: string | null | undefined): boolean {
  return fmt === "dual_tournament";
}

// 2026-05-12 — 다중 종별 (division) 분기 헬퍼 (강남구협회장배 케이스).
// 매치 settings.division_code 가 2개 이상이면 division 우선 그룹핑.
// 단일 division (전통 dual_tournament 1대회) = DUAL_STAGES 5섹션 그대로 사용.
function getDivisionCode(m: Match): string | null {
  const s = (m.settings ?? {}) as Record<string, unknown>;
  return (s.division_code as string) ?? null;
}
function hasMultipleDivisions(matches: Match[]): boolean {
  const codes = new Set(matches.map(getDivisionCode).filter((c): c is string => !!c));
  return codes.size > 1;
}

// 일정 표시 — KST yyyy.MM.dd HH:mm
// 응답 키가 scheduled_at (snake_case) / scheduledAt (camelCase) 어느 쪽이든 안전 처리
function formatSchedule(m: { scheduledAt?: string | null; scheduled_at?: string | null }): string {
  const iso = m.scheduledAt ?? m.scheduled_at ?? null;
  if (!iso) return "일정 미정";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "일정 미정";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 장소 표시 — venue_name 있으면 우선, court_number 보조
function formatVenue(m: Match): string {
  const venue = m.venue_name?.trim();
  const court = m.court_number?.trim();
  if (venue && court) return `${venue} · ${court}`;
  if (venue) return venue;
  if (court) return court;
  return "장소 미정";
}

// 빈 팀 슬롯 라벨 — 팀 확정이면 팀명, 아니면 settings 의 슬롯 라벨, 그래도 없으면 "미정"
function slotLabel(team: TeamInfo | null, fallback: string | null | undefined): string {
  if (team) return team.team.name;
  if (fallback && fallback.trim()) return fallback;
  return "미정";
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  scheduled: "예정",
  in_progress: "진행 중",
  completed: "종료",
  cancelled: "취소",
  bye: "부전승",
};

export default function BracketAdminPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const generate = async (clear = false) => {
    if (clear && !confirm("기존 경기를 모두 삭제하고 재생성하시겠습니까?")) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "생성 실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setGenerating(false);
    }
  };

  const activate = async () => {
    setActivating(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`, { method: "PATCH" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "확정 실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setActivating(false);
    }
  };

  const updateMatchTeam = async (matchId: string, field: "homeTeamId" | "awayTeamId", value: string | null) => {
    setSavingMatch(matchId);
    try {
      await fetch(`/api/web/tournaments/${id}/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      await load();
    } catch { /* ignore */ } finally {
      setSavingMatch(null);
    }
  };

  if (loading) return <PanelLoadingState label="대진 정보를 준비 중입니다." />;

  // 풀리그는 라운드 개념이 없어 "1라운드 팀 배치 편집"을 숨긴다
  // 듀얼토너먼트는 27 매치를 5섹션으로 표시 — 기존 1라운드 편집/전체 목록 UI 숨기고 dual 전용 섹션 사용
  const isLeague = isLeagueFormat(data?.format);
  const isDual = isDualFormat(data?.format);
  // 1라운드 팀 배치 편집: single elim 만 노출 (league/dual 은 숨김)
  const round1Matches = isLeague || isDual ? [] : (data?.matches.filter((m) => m.round_number === 1) ?? []);
  const hasMatches = (data?.matches.length ?? 0) > 0;
  const versionUsed = data?.currentVersion ?? 0;
  const versionLimit = MAX_FREE_VERSIONS;
  const canGenerate = versionUsed < versionLimit;
  const isActivated = data?.activeVersion != null;
  // 풀리그 예상 경기 수 = n*(n-1)/2
  const approvedCount = data?.approvedTeams?.length ?? 0;
  const expectedLeagueMatches = approvedCount >= 2 ? (approvedCount * (approvedCount - 1)) / 2 : 0;

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in (하위 섹션·모달 DOM 상속)
    <div data-skin="toss">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/tournament-admin/tournaments/${id}`}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ← 대회 관리
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          {isLeague ? "풀리그 경기 생성" : "대진표 생성"}
        </h1>
        {isLeague && approvedCount >= 2 && !hasMatches && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            승인된 {approvedCount}팀 기준 총 {expectedLeagueMatches}경기가 생성됩니다.
            {/* Phase 2C: full_league_knockout이면 토너먼트 뼈대도 함께 생성됨을 안내 */}
            {data?.format === "full_league_knockout" && (
              <>
                {" "}
                <span className="text-[var(--color-text-secondary)]">
                  풀리그 경기와 토너먼트 뼈대가 함께 생성됩니다. (토너먼트 슬롯은 리그 완료 후 자동 채워집니다)
                </span>
              </>
            )}
          </p>
        )}
      </div>

      {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
      {error && (
        <div
          className="mb-4 rounded-[12px] px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* 버전 현황 */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">생성 횟수</p>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: versionLimit }).map((_, i) => (
                <div
                  key={i}
                  // 2026-05-12 — admin 빨강 본문 금지 (버전 사용량 dot) → info(Navy)
                  className={`h-3 w-8 rounded-full ${
                    i < versionUsed ? "bg-[var(--color-info)]" : "bg-[var(--color-border)]"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                {versionUsed}/{versionLimit} 사용
              </span>
            </div>
            {!canGenerate && (
              <p className="mt-1 text-xs text-[var(--color-error)]">
                슈퍼관리자 승인 후 추가 생성 가능합니다.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isActivated && (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] px-3 py-1 text-xs font-medium text-[var(--color-success)]">
                ✓ 확정됨 (v{data?.activeVersion})
              </span>
            )}
            {/* 2026-05-12 — pill 9999px ❌ + admin 빨강 본문 금지 룰 → rounded-[4px] + info(Navy) 토큰 */}
            {hasMatches && (
              <button
                onClick={activate}
                disabled={activating || isActivated}
                className="rounded-[4px] bg-[color-mix(in_srgb,var(--color-info)_8%,transparent)] px-4 py-2 text-sm font-medium text-[var(--color-info)] hover:bg-[color-mix(in_srgb,var(--color-info)_15%,transparent)] disabled:opacity-50"
              >
                {activating ? "처리 중..." : "최신 버전 확정"}
              </button>
            )}
            {hasMatches ? (
              <Button
                variant="secondary"
                onClick={() => generate(true)}
                disabled={generating || !canGenerate}
                className="text-sm"
              >
                {generating ? "생성 중..." : "재생성"}
              </Button>
            ) : (
              <Button
                onClick={() => generate(false)}
                disabled={generating || !canGenerate}
              >
                {generating ? "생성 중..." : isLeague ? "경기 자동 생성" : "대진표 생성"}
              </Button>
            )}
          </div>
        </div>

        {/* 버전 히스토리 */}
        {(data?.versions.length ?? 0) > 0 && (
          <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
            <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">버전 히스토리</p>
            <div className="flex flex-wrap gap-2">
              {data?.versions.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                    v.is_active
                      ? "bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]"
                      : "bg-[var(--color-elevated)] text-[var(--color-text-muted)]"
                  }`}
                >
                  <span className="font-medium">v{v.version_number}</span>
                  <span>{new Date(v.created_at).toLocaleDateString("ko-KR")}</span>
                  {v.is_active && <span>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 1라운드 팀 배치 편집 */}
      {round1Matches.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            1라운드 팀 배치 편집
          </h2>
          <div className="space-y-3">
            {round1Matches.map((match) => (
              <Card key={match.id} className={match.status === "bye" ? "opacity-60" : ""}>
                <div className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-center text-xs text-[var(--color-text-muted)]">
                    #{match.match_number ?? "-"}
                  </span>

                  {/* 홈팀 */}
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[var(--color-text-muted)]">홈팀</label>
                    <select
                      disabled={match.status === "bye" || savingMatch === match.id}
                      value={match.homeTeamId ?? ""}
                      onChange={(e) => updateMatchTeam(match.id, "homeTeamId", e.target.value || null)}
                      className="w-full rounded-[10px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
                    >
                      <option value="">미정</option>
                      {data?.approvedTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.team.name}</option>
                      ))}
                    </select>
                  </div>

                  <span className="mt-4 text-[var(--color-text-muted)]">vs</span>

                  {/* 원정팀 */}
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[var(--color-text-muted)]">원정팀</label>
                    <select
                      disabled={match.status === "bye" || savingMatch === match.id}
                      value={match.awayTeamId ?? ""}
                      onChange={(e) => updateMatchTeam(match.id, "awayTeamId", e.target.value || null)}
                      className="w-full rounded-[10px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
                    >
                      <option value="">미정</option>
                      {data?.approvedTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.team.name}</option>
                      ))}
                    </select>
                  </div>

                  {match.status === "bye" && (
                    <span className="mt-4 rounded-full bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                      부전승
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 2026-05-04 (P4) — dual_tournament + 매치 0건 → 조 배정 에디터 표시
          매치 생성된 5/2 영향 0 (hasMatches 가 true 면 진입 X) */}
      {!hasMatches && isDual && (data?.approvedTeams.length ?? 0) === 16 && (
        <DualGroupAssignmentEditor
          tournamentId={id}
          approvedTeams={data?.approvedTeams ?? []}
          // settings.bracket 의 groupAssignment 복원 — apiSuccess snake_case 변환 양쪽 폴백
          initialAssignment={
            (data?.settings?.bracket?.groupAssignment ??
              data?.settings?.bracket?.group_assignment) as
              | Record<"A" | "B" | "C" | "D", string[]>
              | undefined
          }
          initialPairing={
            data?.settings?.bracket?.semifinalPairing ??
            data?.settings?.bracket?.semifinal_pairing
          }
          onGenerate={() => generate(false)}
          onSaved={() => load()}
          generating={generating}
          canGenerate={canGenerate}
        />
      )}

      {/* Phase D: dual_tournament 일 때 5섹션 그룹핑 UI 우선 표시.
          2026-05-12 — 다중 종별 (예: 강남구협회장배 6종 × 매치들) 케이스 분기:
          settings.division_code 가 2개 이상이면 종별 우선 그룹핑 (DivisionBracketSections).
          그렇지 않으면 기존 단일 대회 5섹션 그룹핑. */}
      {hasMatches && isDual && hasMultipleDivisions(data?.matches ?? []) && (
        <DivisionBracketSections
          matches={data?.matches ?? []}
          tournamentId={id}
          // 2026-05-16 PR-Admin-4 — 종별 단위 generator 버튼이 ruleId 매핑 + refetch 에 사용
          divisionRules={data?.divisionRules ?? []}
          onDivisionGenerated={() => load()}
        />
      )}
      {hasMatches && isDual && !hasMultipleDivisions(data?.matches ?? []) && (
        <DualBracketSections
          matches={data?.matches ?? []}
          tournamentId={id}
        />
      )}

      {/* 전체 경기 목록 — single elim / 풀리그 등 dual 외 포맷 */}
      {hasMatches && !isDual && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              전체 경기 ({data?.matches.length}경기)
            </h2>
            <Link
              href={`/tournament-admin/tournaments/${id}#matches`}
              className="text-xs text-[var(--color-info)] hover:underline"
            >
              경기 관리로 이동 →
            </Link>
          </div>
          <div className="space-y-1.5">
            {Array.from(new Set(data?.matches.map((m) => m.round_number))).sort((a, b) => (a ?? 0) - (b ?? 0)).map((rn) => {
              const rMatches = data?.matches.filter((m) => m.round_number === rn) ?? [];
              return (
                <div key={rn ?? "x"}>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                    {rMatches[0]?.roundName ?? (rn != null ? `라운드 ${rn}` : "라운드 미정")}
                  </p>
                  {rMatches.map((m) => (
                    <div key={m.id} className="mb-1 flex items-center gap-2 rounded-[10px] bg-[var(--color-surface)] px-3 py-2 text-sm">
                      <span className="w-5 text-center text-xs text-[var(--color-text-muted)]">#{m.match_number ?? "-"}</span>
                      <span className={`flex-1 text-right font-medium ${m.homeTeamId == null ? "text-[var(--color-text-muted)]" : ""}`}>
                        {m.homeTeam?.team.name ?? "미정"}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">vs</span>
                      <span className={`flex-1 font-medium ${m.awayTeamId == null ? "text-[var(--color-text-muted)]" : ""}`}>
                        {m.awayTeam?.team.name ?? "미정"}
                      </span>
                      <span className={`text-xs ${STATUS_LABEL[m.status] ? "text-[var(--color-text-muted)]" : ""}`}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasMatches && (
        <Card className="py-16 text-center text-[var(--color-text-muted)]">
          <div className="mb-3 text-4xl">🏆</div>
          <p className="font-medium">
            {isLeague
              ? "생성된 경기가 없습니다"
              : isDual
                ? "듀얼토너먼트 대진표가 없습니다"
                : "대진표가 없습니다"}
          </p>
          <p className="mt-1 text-sm">
            승인된 팀 {approvedCount}팀이 있습니다.
            {isLeague && approvedCount >= 2 && (
              <> · 생성 시 {expectedLeagueMatches}경기가 만들어집니다.</>
            )}
            {isDual && approvedCount === 16 && (
              <> · 생성 시 27경기 (조별 16 + 조별최종 4 + 8강 4 + 4강 2 + 결승 1) 가 만들어집니다.</>
            )}
            {isDual && approvedCount !== 16 && (
              <> · 듀얼토너먼트는 정확히 16팀이 필요합니다.</>
            )}
          </p>
        </Card>
      )}

      {/* 2026-05-16 PR-Admin-1 — 단계간 CTA (admin-flow-audit §3 단계 7 단절 해소) */}
      <NextStepCTA tournamentId={id} currentStep="bracket" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Phase D: Dual Tournament 5섹션 그룹핑 컴포넌트
// 27 매치를 5단계로 명확히 보여줌 (조별 / 조별최종전 / 8강 / 4강 / 결승)
// 각 섹션 collapsed/expanded 토글 (UX 개선 — 27매치 한 화면 표시 시 길어짐)
// ────────────────────────────────────────────────────────────────────────────

// dual 5단계 메타 — round_number 매핑
type DualStage = {
  key: string;
  label: string;
  // 매치 필터 — round_number 배열
  rounds: number[];
  // 조별 추가 그룹핑 여부 (Stage 1 만 true)
  groupByGroup: boolean;
};

const DUAL_STAGES: DualStage[] = [
  { key: "stage1", label: "조별 미니 더블엘리미", rounds: [1, 2], groupByGroup: true },
  { key: "stage2", label: "조별 최종전 (2위 결정)", rounds: [3], groupByGroup: false },
  { key: "stage3", label: "8강", rounds: [4], groupByGroup: false },
  { key: "stage4", label: "4강", rounds: [5], groupByGroup: false },
  { key: "stage5", label: "결승", rounds: [6], groupByGroup: false },
];

function DualBracketSections({
  matches,
  tournamentId,
}: {
  matches: Match[];
  tournamentId: string;
}) {
  // 모든 섹션 기본 펼침. 사용자가 접고 싶을 때만 접도록.
  // 이유: 관리자가 점수 입력 시 한 번에 보여야 효율적
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 단계별 매치 분류 — 1회만 계산
  const stageMatches = DUAL_STAGES.map((stage) => ({
    ...stage,
    matches: matches.filter(
      (m) => m.round_number != null && stage.rounds.includes(m.round_number),
    ),
  }));

  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          듀얼토너먼트 ({matches.length}경기)
        </h2>
        <Link
          href={`/tournament-admin/tournaments/${tournamentId}#matches`}
          className="text-xs text-[var(--color-info)] hover:underline"
        >
          경기 관리로 이동 →
        </Link>
      </div>

      {stageMatches.map((stage) => {
        const isCollapsed = collapsed[stage.key] === true;
        const count = stage.matches.length;

        return (
          <Card key={stage.key} className="!p-0 overflow-hidden">
            {/* 섹션 헤더 — 클릭 시 토글 */}
            <button
              type="button"
              onClick={() => toggle(stage.key)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--color-elevated)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                  {stage.label}
                </span>
                <span className="rounded-full bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                  {count}경기
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                {isCollapsed ? "펼치기 ▼" : "접기 ▲"}
              </span>
            </button>

            {/* 섹션 본문 */}
            {!isCollapsed && (
              <div className="border-t border-[var(--color-border-subtle)] p-3">
                {stage.groupByGroup ? (
                  // Stage 1: A/B/C/D 4조 추가 그룹핑
                  <DualGroupedMatches matches={stage.matches} />
                ) : (
                  // Stage 2~5: 단순 리스트
                  <div className="space-y-2">
                    {stage.matches.length === 0 ? (
                      <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
                        해당 단계 경기가 없습니다.
                      </p>
                    ) : (
                      stage.matches.map((m) => <DualMatchCard key={m.id} match={m} />)
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// Stage 1 전용 — A/B/C/D 조별로 한번 더 묶기
function DualGroupedMatches({ matches }: { matches: Match[] }) {
  // 조 키 추출 (group_name 기준 — A/B/C/D 순)
  // 이유: generator 가 group_name 으로 구분 저장. round_number 만으로는 조 구분 불가
  const groupKeys = ["A", "B", "C", "D"] as const;

  return (
    <div className="space-y-3">
      {groupKeys.map((g) => {
        const groupMatches = matches
          .filter((m) => m.group_name === g)
          // round_number 1 (G1/G2) → 2 (승자전/패자전) 순 + match_number 보조 정렬
          .sort((a, b) => {
            const r = (a.round_number ?? 0) - (b.round_number ?? 0);
            if (r !== 0) return r;
            return (a.match_number ?? 0) - (b.match_number ?? 0);
          });

        if (groupMatches.length === 0) return null;

        return (
          <div key={g} className="rounded-[8px] bg-[var(--color-surface)] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {g}조 ({groupMatches.length}경기)
            </p>
            <div className="space-y-2">
              {groupMatches.map((m) => <DualMatchCard key={m.id} match={m} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 듀얼 전용 매치 카드 — HOME/AWAY + 빈 슬롯 라벨 + 일정/장소 + 점수
function DualMatchCard({ match }: { match: Match }) {
  // 빈 슬롯 라벨 — settings JSON 의 homeSlotLabel/awaySlotLabel
  // apiSuccess() 자동 변환으로 키가 home_slot_label / away_slot_label 일 가능성 모두 폴백
  const homeFallback = match.settings?.homeSlotLabel ?? match.settings?.home_slot_label;
  const awayFallback = match.settings?.awaySlotLabel ?? match.settings?.away_slot_label;
  const homeLabel = slotLabel(match.homeTeam, homeFallback);
  const awayLabel = slotLabel(match.awayTeam, awayFallback);
  const isHomeUndecided = match.homeTeam == null;
  const isAwayUndecided = match.awayTeam == null;
  // 점수 비교로 승패 표시 (status=completed 일 때만)
  // 향후 winner_team_id 기반 정확 판정으로 대체 가능
  const completed = match.status === "completed";
  const homeWon = completed && match.homeScore > match.awayScore;
  const awayWon = completed && match.awayScore > match.homeScore;

  return (
    <div className="rounded-[8px] bg-[var(--color-elevated)] p-3">
      {/* 상단 메타 — 매치번호 / 라운드명 / 상태 */}
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[var(--color-text-muted)]">
            #{match.match_number ?? "-"}
          </span>
          <span className="font-medium text-[var(--color-text-secondary)]">
            {match.roundName ?? (match.round_number != null ? `라운드 ${match.round_number}` : "라운드 미정")}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 ${
            completed
              ? "bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]"
              : match.status === "in_progress"
                ? "bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)] text-[var(--color-info)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
          }`}
        >
          {STATUS_LABEL[match.status] ?? match.status}
        </span>
      </div>

      {/* 일정 / 장소 — 모바일에서도 한 줄 유지 (작게) */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[var(--color-text-muted)]">
        <span>{formatSchedule(match)}</span>
        <span>·</span>
        <span>{formatVenue(match)}</span>
      </div>

      {/* 팀 + 점수 */}
      <div className="flex items-center gap-2">
        {/* HOME */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span
            className={`flex-1 truncate text-sm ${
              isHomeUndecided
                ? "italic text-[var(--color-text-muted)]"
                : homeWon
                  ? "font-bold text-[var(--color-text-primary)]"
                  : "font-medium text-[var(--color-text-primary)]"
            }`}
            title={homeLabel}
          >
            {homeLabel}
          </span>
          <span
            className={`min-w-[28px] text-right text-sm tabular-nums ${
              homeWon ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
            }`}
          >
            {completed ? match.homeScore : "-"}
          </span>
        </div>

        <span className="text-xs text-[var(--color-text-muted)]">vs</span>

        {/* AWAY */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span
            className={`min-w-[28px] text-sm tabular-nums ${
              awayWon ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
            }`}
          >
            {completed ? match.awayScore : "-"}
          </span>
          <span
            className={`flex-1 truncate text-sm ${
              isAwayUndecided
                ? "italic text-[var(--color-text-muted)]"
                : awayWon
                  ? "font-bold text-[var(--color-text-primary)]"
                  : "font-medium text-[var(--color-text-primary)]"
            }`}
            title={awayLabel}
          >
            {awayLabel}
          </span>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// 2026-05-12 — 다중 종별 (Division) 대진표 (강남구협회장배 D 진단 fix)
// ============================================================================
//
// 배경:
//   - format='dual_tournament' 대회에 6 종별 (i3-U9 / i2-U11 / i3-U11 / i2-U12 / i3w-U12 / i3-U14)
//     각각 매치 INSERT 됐지만 round_number / group_name 모두 null
//   - 기존 DUAL_STAGES (1~6 라운드) 매핑 실패 → 대진표 0/0/0/0/0 표시
//   - 매치 settings.division_code 만 박제 + roundName (자유 텍스트) 있음
//
// 해결:
//   - 종별 우선 그룹화 (6 종별 카드)
//   - 각 종별 안에서 roundName 으로 sub-그룹화 (예선 1경기 / 예선 2경기 / 결승 등)
//   - roundName 없으면 "기타" 그룹
function DivisionBracketSections({
  matches,
  tournamentId,
  divisionRules,
  onDivisionGenerated,
}: {
  matches: Match[];
  tournamentId: string;
  // 2026-05-16 PR-Admin-4 — divisionCode → ruleId/format 매핑 (DivisionGenerateButton 인자)
  divisionRules: Array<{ id: string; code: string; format: string | null }>;
  // 2026-05-16 PR-Admin-4 — 종별 단위 generator 성공 시 부모 load() 호출 (refetch)
  onDivisionGenerated?: () => void;
}) {
  // divisionCode → rule 빠른 조회용 Map (렌더 1회 빌드)
  const ruleByCode = new Map(divisionRules.map((r) => [r.code, r]));
  // 종별 collapsed/expanded 토글 (기본 펼침)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setCollapsed((prev) => ({ ...prev, [k]: !prev[k] }));
  // 2026-05-12 — 종별 단일 선택 필터 (운영자 격리 보기). null = 전체.
  const [divisionFilter, setDivisionFilter] = useState<string | null>(null);

  // 종별 그룹화 — division_code 기준
  const groupedByDivision = matches.reduce<Map<string, Match[]>>((map, m) => {
    const code = getDivisionCode(m) ?? "_no_division";
    if (!map.has(code)) map.set(code, []);
    map.get(code)!.push(m);
    return map;
  }, new Map());

  // 정렬 — 종별 코드 알파벳 순
  const divisionEntries = Array.from(groupedByDivision.entries()).sort(
    ([a], [b]) => a.localeCompare(b)
  );

  // 필터 적용 — 선택 종별 1개 또는 전체
  const visibleEntries = divisionFilter === null
    ? divisionEntries
    : divisionEntries.filter(([code]) => code === divisionFilter);

  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          종별 대진표 ({matches.length}경기 / {divisionEntries.length}종별)
        </h2>
        <Link
          href={`/tournament-admin/tournaments/${tournamentId}#matches`}
          className="text-xs text-[var(--color-info)] hover:underline"
        >
          경기 관리로 이동 →
        </Link>
      </div>

      {/* 2026-05-12 — 종별 필터 (전체 / 종별 1개 선택) */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDivisionFilter(null)}
          className={`rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
            divisionFilter === null
              ? "bg-[var(--color-info)] text-white"
              : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          전체 ({matches.length})
        </button>
        {divisionEntries.map(([code, divMatches]) => (
          <button
            key={code}
            type="button"
            onClick={() => setDivisionFilter(code)}
            className={`rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
              divisionFilter === code
                ? "bg-[var(--color-info)] text-white"
                : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {code === "_no_division" ? "종별 미지정" : code} ({divMatches.length})
          </button>
        ))}
      </div>

      {visibleEntries.map(([divCode, divMatches]) => {
        const isCollapsed = collapsed[divCode] === true;

        // 종별 안에서 roundName 으로 sub-그룹화
        const byRoundName = divMatches.reduce<Map<string, Match[]>>((m, match) => {
          const key = (match.roundName ?? "").trim() || "기타";
          if (!m.has(key)) m.set(key, []);
          m.get(key)!.push(match);
          return m;
        }, new Map());

        // roundName 정렬 — 자연어 순 (예선 1경기 < 예선 2경기 < ... < 결승)
        const roundEntries = Array.from(byRoundName.entries()).sort(([a], [b]) =>
          a.localeCompare(b, "ko-KR", { numeric: true })
        );

        return (
          <Card key={divCode} className="!p-0 overflow-hidden">
            {/* 종별 헤더 — 토글 + deep link */}
            <div className="flex w-full items-center justify-between px-4 py-3 hover:bg-[var(--color-elevated)] transition-colors">
              <button
                type="button"
                onClick={() => toggle(divCode)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                  {divCode === "_no_division" ? "종별 미지정" : divCode}
                </span>
                <span className="rounded-full bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                  {divMatches.length}경기
                </span>
              </button>
              <div className="flex items-center gap-2">
                {/* 2026-05-16 PR-Admin-4 — 종별 단위 매치 generator 버튼.
                    rule 매칭 + 지원 format 일 때만 노출 (DivisionGenerateButton 내부 가드 중복).
                    "_no_division" 매치는 ruleId 없으므로 버튼 비노출. */}
                {divCode !== "_no_division" && ruleByCode.has(divCode) && (
                  <DivisionGenerateButton
                    tournamentId={tournamentId}
                    ruleId={ruleByCode.get(divCode)!.id}
                    divisionCode={divCode}
                    divisionFormat={ruleByCode.get(divCode)!.format}
                    hasMatches={divMatches.length > 0}
                    onSuccess={onDivisionGenerated}
                  />
                )}
                {/* 2026-05-12 Phase 3.5-B — 종별 deep link → matches 페이지 자동 필터 */}
                {divCode !== "_no_division" && (
                  <Link
                    href={`/tournament-admin/tournaments/${tournamentId}#matches`}
                    className="text-xs text-[var(--color-info)] hover:underline"
                  >
                    경기 관리 →
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => toggle(divCode)}
                  className="text-xs text-[var(--color-text-muted)]"
                >
                  {isCollapsed ? "펼치기 ▼" : "접기 ▲"}
                </button>
              </div>
            </div>

            {/* 본문 — roundName 별 sub-그룹 */}
            {!isCollapsed && (
              <div className="border-t border-[var(--color-border-subtle)] p-3">
                {roundEntries.map(([roundName, rMatches]) => (
                  <div key={roundName} className="mb-3 last:mb-0">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                      {roundName} ({rMatches.length})
                    </p>
                    <div className="space-y-1">
                      {rMatches.map((m) => (
                        <DualMatchCard key={m.id} match={m} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/divisions-panel.tsx

````tsx
"use client";

/**
 * 2026-05-12 Phase 3.5 — 종별 운영 방식 설정 페이지.
 *
 * 배경 (사용자 보고 5/12):
 *   - 대진표 생성 전 종별마다 다른 진행 방식 (i3-U9 링크제 / i2-U11 듀얼 등) 설정 UI 없음
 *   - Tournament.format = 단일 enum → 종별 단위 박제 불가능
 *   - Phase 3.5 = TournamentDivisionRule.format + settings 컬럼 신설
 *
 * Workspace panel: /tournament-admin/tournaments/[id]#divisions
 *
 * 기능:
 *   - 종별 목록 (코드 / 라벨 / 학년 / 참가비)
 *   - 종별마다 format 드롭다운 (8 enum) — PATCH
 *   - 종별별 settings (groupCount / advanceCount / linkagePairs) JSON 입력
 *   - 저장 시 즉시 PATCH (낙관적 UI)
 *
 * 권한: canManageTournament (super_admin / organizer / TAM / 단체 admin)
 */

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";
// 2026-05-12 Phase 3.5-D — division format / settings 헬퍼 (lib 분리 → vitest 단위 검증 가능)
import {
  FORMAT_LABEL,
  showGroupSettings,
  showRankingFormat,
  shouldShowAdvancePerGroup,
  ADVANCE_PER_GROUP_DEFAULT,
  calculateTotalTeams,
} from "@/lib/tournaments/division-formats";
// 2026-06-22 F-2b — 디비전 일정(날짜/코트) 역참조 표시 헬퍼
import {
  resolveDivisionSchedule,
  allCourts,
  type ScheduleDateLite,
  type PlaceLite,
  type DivScheduleEntry,
} from "../divisions/_components/schedule-format";

interface DivisionRule {
  id: string;
  code: string;
  label: string;
  grade_min: number | null;
  grade_max: number | null;
  fee_krw: number;
  sort_order: number;
  format: string | null;
  settings: Record<string, unknown> | null;
}

type MasterCategory = {
  id: string;
  name: string;
  divisions: string[];
  ages: string[];
  sort_order: number;
};

type CurrentCategory = {
  category: string;
  divisions: Array<{
    name: string;
    cap: number | null;
    fee: number | null;
  }>;
};

// FORMAT_LABEL / showGroupSettings / showRankingFormat = lib/tournaments/division-formats.ts 로 이동 (Phase 3.5-D)
// 사유: server (route.ts) + client (page.tsx) 양쪽에서 동일 enum 사용 + vitest 단위 검증 가능.

export default function DivisionsSetupPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [rules, setRules] = useState<DivisionRule[]>([]);
  const [allowedFormats, setAllowedFormats] = useState<string[]>([]);
  const [masterCategories, setMasterCategories] = useState<MasterCategory[]>([]);
  const [currentCategories, setCurrentCategories] = useState<CurrentCategory[]>([]);
  // 2026-06-22 F-2b — 디비전 일정 역참조용 데이터(div_schedule 배열 + 룩업 소스)
  //   route 에서 map→배열로 변환해 내보내므로(디비전명 snake 변환 회피) 배열로 받는다.
  const [divSchedule, setDivSchedule] = useState<DivScheduleEntry[]>([]);
  const [scheduleDates, setScheduleDates] = useState<ScheduleDateLite[]>([]);
  const [places, setPlaces] = useState<PlaceLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  // 2026-05-12 Phase 3.5-C — 진출 매핑 수동 trigger
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [advanceResult, setAdvanceResult] = useState<{
    code: string;
    updated: number;
    skipped: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "조회 실패");
        setLoading(false);
        return;
      }
      setRules((json.rules ?? []) as DivisionRule[]);
      setAllowedFormats((json.allowed_formats ?? []) as string[]);
      setMasterCategories((json.master_categories ?? []) as MasterCategory[]);
      setCurrentCategories((json.current_categories ?? []) as CurrentCategory[]);
      // F-2b — 디비전 일정 역참조 데이터(배열·route 에서 map→배열 변환·snake)
      setDivSchedule(
        Array.isArray(json.div_schedule)
          ? (json.div_schedule as DivScheduleEntry[])
          : [],
      );
      setScheduleDates((json.schedule_dates ?? []) as ScheduleDateLite[]);
      setPlaces((json.places ?? []) as PlaceLite[]);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const isDivisionSelected = (category: string, division: string) =>
    currentCategories.some(
      (item) =>
        item.category === category &&
        item.divisions.some((current) => current.name === division),
    );

  const toggleDivision = (category: string, division: string) => {
    setSyncResult(null);
    setCurrentCategories((prev) => {
      const existing = prev.find((item) => item.category === category);
      if (!existing) {
        return [
          ...prev,
          { category, divisions: [{ name: division, cap: null, fee: null }] },
        ];
      }

      const selected = existing.divisions.some((item) => item.name === division);
      const nextDivisions = selected
        ? existing.divisions.filter((item) => item.name !== division)
        : [...existing.divisions, { name: division, cap: null, fee: null }];

      if (nextDivisions.length === 0) {
        return prev.filter((item) => item.category !== category);
      }

      return prev.map((item) =>
        item.category === category ? { ...item, divisions: nextDivisions } : item,
      );
    });
  };

  const updateDivisionNumber = (
    category: string,
    division: string,
    key: "cap" | "fee",
    value: string,
  ) => {
    const numberValue = value === "" ? null : Math.max(0, Number(value));
    setCurrentCategories((prev) =>
      prev.map((item) =>
        item.category === category
          ? {
              ...item,
              divisions: item.divisions.map((current) =>
                current.name === division
                  ? { ...current, [key]: numberValue }
                  : current,
              ),
            }
          : item,
      ),
    );
  };

  const getDivisionSchedule = (division: string) => {
    const entry = divSchedule.find((item) => item.division === division);
    return {
      dateId: entry?.date_id ?? "",
      courtId: entry?.court_id ?? "",
    };
  };

  const updateDivisionSchedule = (
    division: string,
    patch: Partial<Pick<DivScheduleEntry, "date_id" | "court_id">>,
  ) => {
    setSyncResult(null);
    setDivSchedule((prev) => {
      const existing = prev.find((item) => item.division === division);
      const next = {
        division,
        date_id: patch.date_id !== undefined ? patch.date_id : existing?.date_id,
        court_id: patch.court_id !== undefined ? patch.court_id : existing?.court_id,
      };
      const withoutCurrent = prev.filter((item) => item.division !== division);
      if (!next.date_id && !next.court_id) return withoutCurrent;
      return [...withoutCurrent, next];
    });
  };

  const syncDivisions = async () => {
    const categories = Object.fromEntries(
      currentCategories.map((item) => [
        item.category,
        item.divisions.map((division) => division.name),
      ]),
    );
    const divCaps = Object.fromEntries(
      currentCategories.flatMap((item) =>
        item.divisions
          .filter((division) => division.cap != null)
          .map((division) => [division.name, division.cap]),
      ),
    );
    const divFees = Object.fromEntries(
      currentCategories.flatMap((item) =>
        item.divisions
          .filter((division) => division.fee != null)
          .map((division) => [division.name, division.fee]),
      ),
    );
    const selectedDivisionNames = new Set(
      currentCategories.flatMap((item) =>
        item.divisions.map((division) => division.name),
      ),
    );
    const divScheduleMap = Object.fromEntries(
      divSchedule
        .filter(
          (entry) =>
            selectedDivisionNames.has(entry.division) &&
            entry.date_id &&
            entry.court_id,
        )
        .map((entry) => [
          entry.division,
          { dateId: entry.date_id, courtId: entry.court_id },
        ]),
    );

    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories, divCaps, divFees, divSchedule: divScheduleMap }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "종별 저장 실패");
        return;
      }

      setRules((json.rules ?? []) as DivisionRule[]);
      setCurrentCategories((json.current_categories ?? []) as CurrentCategory[]);
      setDivSchedule(
        Array.isArray(json.div_schedule)
          ? (json.div_schedule as DivScheduleEntry[])
          : [],
      );
      const result = json.sync_result;
      setSyncResult(
        result
          ? `저장 완료 · 신규 ${result.created ?? 0}건 · 갱신 ${result.updated ?? 0}건 · 삭제 ${result.deleted ?? 0}건`
          : "저장 완료",
      );
    } catch {
      setError("네트워크 오류");
    } finally {
      setSyncing(false);
    }
  };

  // 2026-05-12 Phase 3.5-C — 종별 진출 매핑 수동 실행
  const advanceDivision = async (ruleId: string, code: string) => {
    if (!confirm(`"${code}" 종별 진출 매핑을 실행하시겠어요?\n\n예선 순위를 기준으로 순위전 경기를 자동으로 채웁니다.`)) return;
    setAdvancingId(ruleId);
    setAdvanceResult(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules/${ruleId}/advance`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "매핑 실패");
        return;
      }
      setAdvanceResult({
        code: json.division_code,
        updated: json.updated,
        skipped: json.skipped,
      });
    } catch {
      setError("네트워크 오류");
    } finally {
      setAdvancingId(null);
    }
  };

  const updateRule = async (
    ruleId: string,
    patch: { format?: string | null; settings?: Record<string, unknown> }
  ) => {
    setSavingId(ruleId);
    setError(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules/${ruleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "저장 실패");
        return;
      }
      // 낙관적 갱신
      setRules((prev) =>
        prev.map((r) =>
          r.id === ruleId
            ? {
                ...r,
                format: patch.format ?? r.format,
                settings: patch.settings ?? r.settings,
              }
            : r
        )
      );
    } catch {
      setError("네트워크 오류");
    } finally {
      setSavingId(null);
    }
  };

  const courtOptions = allCourts(places);

  if (loading) {
    return (
      <div data-skin="toss" className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface)]" />
        <div className="h-32 animate-pulse rounded-lg bg-[var(--color-surface)]" />
      </div>
    );
  }

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss" className="space-y-4">

      {error && (
        <div
          className="rounded-[4px] border p-3 text-sm"
          style={{
            borderColor: "var(--color-error)",
            background: "color-mix(in srgb, var(--color-error) 8%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      <section className="rounded-[18px] bg-[var(--grey-50)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="ct-headicon">
              <Icon name="category" size={18} color="var(--primary)" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--ink)]">
                종별 구성
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-mute)]">
                대회 생성과 같은 종별 마스터를 사용합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={syncDivisions}
            disabled={syncing}
            className="ts-btn ts-btn--primary ts-btn--sm"
          >
            {syncing ? "저장 중..." : "종별 저장"}
          </button>
        </div>

        {syncResult && (
          <div
            className="mt-3 rounded-[4px] border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--color-success)",
              background: "color-mix(in srgb, var(--color-success) 8%, transparent)",
              color: "var(--color-success)",
            }}
          >
            {syncResult}
          </div>
        )}

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {masterCategories.map((category) => {
            const selected = currentCategories.find(
              (item) => item.category === category.name,
            );
            return (
              <div
                key={category.id}
                className="rounded-[16px] border bg-[var(--card)] p-3"
                style={{
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-[var(--ink)]">
                    {category.name}
                  </h3>
                  <span className="ts-badge ts-badge--grey">
                    {selected?.divisions.length ?? 0}개 선택
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {category.divisions.map((division) => {
                    const checked = isDivisionSelected(category.name, division);
                    return (
                      <button
                        key={division}
                        type="button"
                        onClick={() => toggleDivision(category.name, division)}
                        data-active={checked}
                        className="ts-chip"
                      >
                        {checked && <Icon name="check" size={14} />}
                        {division}
                      </button>
                    );
                  })}
                </div>

                {selected && selected.divisions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selected.divisions.map((division) => {
                      const schedule = getDivisionSchedule(division.name);
                      const selectedDate = scheduleDates.find(
                        (date) => date.id === schedule.dateId,
                      );
                      const availableCourts =
                        selectedDate?.court_ids?.length
                          ? courtOptions.filter((court) =>
                              selectedDate.court_ids?.includes(court.id),
                            )
                          : courtOptions;

                      return (
                        <div
                          key={division.name}
                          className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(92px,1fr)_88px_100px_minmax(128px,1.15fr)_minmax(136px,1.2fr)]"
                        >
                          <div className="flex min-h-[44px] items-center rounded-[12px] bg-[var(--grey-50)] px-3 text-sm font-semibold text-[var(--ink)]">
                            {division.name}
                          </div>
                          <input
                            type="number"
                            min={0}
                            value={division.cap ?? ""}
                            onChange={(e) =>
                              updateDivisionNumber(
                                category.name,
                                division.name,
                                "cap",
                                e.target.value,
                              )
                            }
                            className="ts-input min-h-[44px]"
                            placeholder="정원"
                          />
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={division.fee ?? ""}
                            onChange={(e) =>
                              updateDivisionNumber(
                                category.name,
                                division.name,
                                "fee",
                                e.target.value,
                              )
                            }
                            className="ts-input min-h-[44px]"
                            placeholder="참가비"
                          />
                          <select
                            value={schedule.dateId}
                            onChange={(e) =>
                              updateDivisionSchedule(division.name, {
                                date_id: e.target.value,
                                court_id: "",
                              })
                            }
                            className="ts-select min-h-[44px]"
                          >
                            <option value="">일정 선택</option>
                            {scheduleDates.map((date) => (
                              <option key={date.id} value={date.id}>
                                {date.date}
                              </option>
                            ))}
                          </select>
                          <select
                            value={schedule.courtId}
                            onChange={(e) =>
                              updateDivisionSchedule(division.name, {
                                court_id: e.target.value,
                              })
                            }
                            className="ts-select min-h-[44px]"
                          >
                            <option value="">체육관 선택</option>
                            {availableCourts.map((court) => (
                              <option key={court.id} value={court.id}>
                                {court.full}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {rules.length === 0 ? (
        /*
          2026-05-28 PR-1C-12 박제 — 시안 adv-empty (빈 상태 발견성 강화).
          사유: 운영 평면 텍스트 → 시안의 아이콘 + 종별 개념 안내 + 마법사 진입 CTA 로 보강.
          dashed border = 시안 adv-empty 점선 박스를 운영 토큰으로 치환.
        */
        <div className="ct-emptybox ct-emptybox--tall">
            {/* Material category → lucide layout-grid */}
            <Icon name="layout-grid" size={48} color="var(--color-text-muted)" />
            <div className="text-base font-bold text-[var(--ink)]">
              저장된 종별이 없습니다
            </div>
            <div className="max-w-md text-sm text-[var(--ink-mute)]">
              위에서 종별을 선택하고 저장하세요.
            </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rules.map((r) => (
            <article key={r.id} className="rounded-[18px] border bg-[var(--card)] p-4" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {/*
                    2026-05-28 PR-1C-12 박제 — 시안 adv-card__head (code 모노 칩 + 종별명).
                    사유: 운영 평면 "code (label)" → 시안의 code 모노 칩(blue-soft 배경) + 라벨로 시각 강화.
                    --color-info 8% 틴트 = 시안 adv-card__name 의 cafe-blue-soft 칩을 운영 토큰으로 치환.
                  */}
                  <p className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                    <span
                      className="rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        color: "var(--color-info)",
                        background: "color-mix(in srgb, var(--color-info) 12%, transparent)",
                      }}
                    >
                      {r.code}
                    </span>
                    {r.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {/* 2026-05-12 룰 변경: 어린 학년 자유 참가 — gradeMax 이하 표시 */}
                    {r.grade_max != null ? `${r.grade_max}학년 이하` : "학년 제한 없음"} · 참가비 {r.fee_krw.toLocaleString()}원
                  </p>
                  {/*
                    2026-06-22 F-2b — 디비전별 경기 날짜/코트 표시.
                    div_schedule 배열에서 division ↔ DivisionRule.label 우선 매칭, 없으면 code 폴백.
                    역참조 실패(매칭/값 부재/룩업 실패)는 "–" 로 graceful 표시.
                  */}
                  {(() => {
                    const { dateLabel, courtLabel } = resolveDivisionSchedule(
                      divSchedule,
                      r.label,
                      r.code,
                      scheduleDates,
                      places,
                    );
                    return (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}>
                          <Icon name="calendar" size={12} />
                          {dateLabel ?? "–"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}>
                          <Icon name="map-pin" size={12} />
                          {courtLabel ?? "–"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--color-text-muted)]">진행 방식:</label>
                  <select
                    value={r.format ?? ""}
                    disabled={savingId === r.id}
                    onChange={(e) =>
                      updateRule(r.id, { format: e.target.value || null })
                    }
                    className="ts-select min-w-[160px]"
                  >
                    <option value="">대회 방식 사용</option>
                    {allowedFormats.map((f) => (
                      <option key={f} value={f}>
                        {/* FORMAT_LABEL 타입 = DivisionFormat narrow → string indexing 위해 cast (런타임은 ?? f 폴백) */}
                        {(FORMAT_LABEL as Record<string, string>)[f] ?? f}
                      </option>
                    ))}
                  </select>
                  {savingId === r.id && (
                    <span className="text-xs text-[var(--color-text-muted)]">저장 중...</span>
                  )}
                </div>
              </div>

              {/* 2026-05-12 Phase 3.5-D — 조 크기 / 조 개수 입력 (풀리그 기반 진행 방식만) */}
              {showGroupSettings(r.format) && (
                <GroupSettingsInputs
                  ruleId={r.id}
                  format={r.format}
                  settings={r.settings}
                  saving={savingId === r.id}
                  onSave={(patch) => updateRule(r.id, { settings: patch })}
                />
              )}

              {/* 2026-05-12 Phase 3.5-C — 진출 매핑 수동 실행 */}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-[var(--color-text-muted)]">
                  예선 순위 기준 순위전 자동 매핑
                </p>
                <button
                  type="button"
                  onClick={() => advanceDivision(r.id, r.code)}
                  disabled={advancingId === r.id}
                  className="ts-btn ts-btn--secondary ts-btn--sm"
                >
                  {advancingId === r.id ? "실행 중..." : "진출 매핑 실행"}
                </button>
              </div>

              {/* 매핑 결과 — 해당 종별만 표시 */}
              {advanceResult && advanceResult.code === r.code && (
                <div
                  className="mt-2 rounded-[4px] border p-2 text-xs"
                  style={{
                    borderColor: "var(--color-success)",
                    background: "color-mix(in srgb, var(--color-success) 8%, transparent)",
                    color: "var(--color-success)",
                  }}
                >
                  매핑 완료 · 갱신 {advanceResult.updated}건 · 제외 {advanceResult.skipped}건
                </div>
              )}
            </article>
          ))}
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 2026-05-12 Phase 3.5-D — 조 설정 입력 컴포넌트 (group_size / group_count / ranking_format)
// ─────────────────────────────────────────────────────────────────────────
//
// 동작:
//   - 진행 방식이 풀리그 기반일 때만 노출 (showGroupSettings 가드)
//   - 입력값 변경 → onSave 호출 (debounce 없음 — onBlur 기준)
//   - 신규 enum (group_stage_with_ranking) 시 ranking_format select 추가 노출
//   - 빈 값 = undefined 박제 (settings JSON 에서 제외)
//
// 검증:
//   - 1~32 정수 (서버 zod 와 동일)
//   - 음수/소수/0 입력 시 input 자체가 거부 (min/max/step)
//
function GroupSettingsInputs(props: {
  ruleId: string;
  format: string | null;
  settings: Record<string, unknown> | null;
  saving: boolean;
  onSave: (settings: Record<string, unknown>) => void;
}) {
  const { format, settings, saving, onSave } = props;
  const isDualTournament = format === "dual_tournament";

  // 기존 settings 의 group_size / group_count / ranking_format / advance_per_group 추출 (legacy 키 호환)
  const initialGroupSize =
    typeof settings?.group_size === "number" ? settings.group_size : null;
  const initialGroupCount =
    typeof settings?.group_count === "number" ? settings.group_count : null;
  const initialRankingFormat =
    typeof settings?.ranking_format === "string"
      ? (settings.ranking_format as string)
      : "round_robin";
  // 2026-05-13 — 조별 본선 진출 팀 수 (default 2 = 생활체육 표준 1·2위 진출)
  const initialAdvancePerGroup =
    typeof settings?.advance_per_group === "number" ? settings.advance_per_group : null;

  // 로컬 상태 (input 입력값) — 빈 문자열 허용 (사용자가 일시적으로 비울 수 있음)
  const [groupSize, setGroupSize] = useState<string>(
    initialGroupSize != null ? String(initialGroupSize) : isDualTournament ? "4" : "",
  );
  const [groupCount, setGroupCount] = useState<string>(
    initialGroupCount != null ? String(initialGroupCount) : "",
  );
  const [rankingFormat, setRankingFormat] = useState<string>(initialRankingFormat);
  const [advancePerGroup, setAdvancePerGroup] = useState<string>(
    initialAdvancePerGroup != null ? String(initialAdvancePerGroup) : isDualTournament ? "2" : "",
  );

  // 총 팀 수 계산 (group_size × group_count) — division-formats.ts 헬퍼 사용
  const totalTeams = calculateTotalTeams(
    isDualTournament ? 4 : groupSize !== "" ? Number(groupSize) : null,
    groupCount !== "" ? Number(groupCount) : null,
  );
  const effectiveAdvancePerGroup = isDualTournament
    ? 2
    : advancePerGroup !== ""
      ? Number(advancePerGroup)
      : ADVANCE_PER_GROUP_DEFAULT;

  // 저장 트리거 — 기존 settings + 신규 키 머지 (legacy linkage_pairs / advanceCount 보존)
  const handleSave = () => {
    const next: Record<string, unknown> = { ...(settings ?? {}) };

    // group_size / group_count: 빈 값이면 키 삭제
    if (isDualTournament) next.group_size = 4;
    else if (groupSize === "") delete next.group_size;
    else next.group_size = Number(groupSize);

    if (groupCount === "") delete next.group_count;
    else next.group_count = Number(groupCount);

    // ranking_format: 신규 enum 일 때만 박제 (다른 format 은 의미 없음)
    if (showRankingFormat(format)) {
      next.ranking_format = rankingFormat;
    }

    // 2026-05-13 — advance_per_group: 조별리그→본선 enum (3개) 일 때만 박제
    // (group_stage_knockout / full_league_knockout / dual_tournament)
    if (shouldShowAdvancePerGroup(format)) {
      if (isDualTournament) next.advance_per_group = 2;
      else if (advancePerGroup === "") delete next.advance_per_group;
      else next.advance_per_group = Number(advancePerGroup);
    } else {
      // 노출 조건이 아닌 enum 으로 전환 시 기존 키 정리 (의미 없는 박제 잔존 방지)
      delete next.advance_per_group;
    }

    onSave(next);
  };

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      <label className="ts-field text-xs text-[var(--ink-mute)]">
        {isDualTournament ? "조 크기 (고정)" : "조 크기 (팀)"}
        <input
          type="number"
          min={1}
          max={32}
          step={1}
          value={isDualTournament ? "4" : groupSize}
          disabled={saving || isDualTournament}
          onChange={(e) => setGroupSize(e.target.value)}
          onBlur={handleSave}
          className="ts-input mt-1"
          placeholder="4"
        />
      </label>
      <label className="ts-field text-xs text-[var(--ink-mute)]">
        조 개수
        <input
          type="number"
          min={1}
          max={32}
          step={1}
          value={groupCount}
          disabled={saving}
          onChange={(e) => setGroupCount(e.target.value)}
          onBlur={handleSave}
          className="ts-input mt-1"
          placeholder="4"
        />
      </label>
      {/* 2026-05-13 — 신규 enum 만 ranking_format 영역 노출. 단, group_count <= 2 이면 드롭다운 대신 안내문 노출
          (사용자 결재 §B: 2조 이하 = 어떤 방식이든 단판 1경기로 자동 매핑됨)
          드롭다운 라벨도 한국식: "풀리그" / "토너먼트" */}
      {showRankingFormat(format) && (
        groupCount !== "" && Number(groupCount) <= 2 ? (
          // 조 2개 이하 — 단판 안내문 (드롭다운 숨김 / settings.ranking_format 기본값 round_robin 박제 유지)
          <div className="text-xs text-[var(--ink-mute)]">
            <span className="block font-medium text-[var(--ink)]">동순위전 방식</span>
            <p
              className="mt-1 rounded-[12px] bg-[var(--grey-50)] px-3 py-2 text-xs leading-relaxed"
            >
              각 동순위전이 단판 경기로 자동 진행됩니다 (조 개수가 2조 이하)
            </p>
          </div>
        ) : (
          // 조 3개 이상 — 풀리그 / 토너먼트 선택 드롭다운
          <label className="ts-field text-xs text-[var(--ink-mute)]">
            동순위전 방식
            <select
              value={rankingFormat}
              disabled={saving}
              onChange={(e) => setRankingFormat(e.target.value)}
              onBlur={handleSave}
              className="ts-select mt-1"
            >
              {/* 2026-05-13 라벨 한국식 통일 — "싱글 엘리미네이션" → "토너먼트" */}
              <option value="round_robin">풀리그</option>
              <option value="single_elimination">토너먼트</option>
            </select>
          </label>
        )
      )}
      {/* 2026-05-13 — 조별 본선 진출 팀 수 (group_stage_knockout / full_league_knockout / dual_tournament 만)
          사유: 조별리그/풀리그 → 본선 토너먼트 enum 만 의미 있음 (조 N위까지 본선 진출).
          UI: group_size 가 max 상한 (조 크기 초과 진출 불가). default 2 = 생활체육 표준 1·2위 */}
      {shouldShowAdvancePerGroup(format) && (
        <label className="ts-field text-xs text-[var(--ink-mute)]">
          {isDualTournament ? "조별 진출 팀 수 (고정)" : "조별 본선 진출 팀 수"}
          <input
            type="number"
            min={1}
            max={isDualTournament ? 4 : groupSize !== "" ? Number(groupSize) : 32}
            step={1}
            value={isDualTournament ? "2" : advancePerGroup}
            disabled={saving || isDualTournament}
            onChange={(e) => setAdvancePerGroup(e.target.value)}
            onBlur={handleSave}
            className="ts-input mt-1"
            placeholder={`${ADVANCE_PER_GROUP_DEFAULT}`}
          />
        </label>
      )}
      {/* 총 팀 수 + 총 본선 진출 팀 수 안내 — 모든 컬럼 가로 펼침 */}
      <p className="col-span-2 text-xs text-[var(--color-text-muted)] sm:col-span-3">
        {totalTeams != null
          ? `총 ${totalTeams}팀 (${groupSize} × ${groupCount})`
          : "조 크기 × 조 개수 = 총 팀 수"}
        {shouldShowAdvancePerGroup(format) && groupCount !== "" && (
          <>
            {" / "}
            총 본선 진출 ={" "}
            {effectiveAdvancePerGroup * Number(groupCount)}
            팀
          </>
        )}
      </p>
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/matches-panel.tsx

````tsx
"use client";

import type { RecordingMode } from "@/lib/tournaments/recording-mode";
import { RecordingModeTriggerClient } from "../_components/recording-mode-trigger";
import MatchesClient from "../matches/matches-client";

type Props = {
  tournamentId: string;
  defaultMode: RecordingMode;
  matchStats: {
    total: number;
    paper: number;
    flutter: number;
    inProgress: number;
  };
};

export default function MatchesPanel({ tournamentId, defaultMode, matchStats }: Props) {
  return (
    <div className="mt-4 space-y-4">
      <RecordingModeTriggerClient
        tournamentId={tournamentId}
        defaultMode={defaultMode}
        matchStats={matchStats}
      />
      <MatchesClient />
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/panel-loading-state.tsx

````tsx
"use client";

export function PanelLoadingState({ label = "불러오는 중입니다." }: { label?: string }) {
  return (
    <div data-skin="toss" className="ct-emptybox mt-4">
      {label}
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/recorders-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 2026-06-13 HOTFIX: GET 응답은 apiSuccess→convertKeysToSnakeCase 거쳐 snake_case.
//   camelCase(recorderId/isActive/createdAt)로 읽으면 전 행 undefined → 빈 목록 버그.
type Recorder = {
  id: string;
  recorder_id: string;
  is_active: boolean;
  created_at: string;
  recorder: {
    id: string;
    nickname: string | null;
    email: string;
    profile_image_url: string | null;
  };
};

// Track B-d — 경기별 기록자 배정용 매치 타입.
//   GET /matches 응답(snake_case). settings.recorder_id 가 경기별 배정된 기록자 userId(string).
type MatchRow = {
  id: string;
  // 2026-06-21 정합: GET /matches 응답은 apiSuccess→convertKeysToSnakeCase 거쳐 snake_case.
  //   Prisma 필드 roundName/scheduledAt 은 응답에서 round_name/scheduled_at 로 변환됨.
  //   camelCase 로 읽으면 round_name 라벨이 항상 fallback("라운드 N")으로만 떨어짐 → snake 로 교정.
  round_name: string | null;
  round_number: number | null;
  match_number: number | null;
  scheduled_at: string | null;
  venue_name: string | null;
  homeTeam: { team: { name: string } } | null;
  awayTeam: { team: { name: string } } | null;
  settings: { recorder_id?: string | null; division_code?: string | null; [k: string]: unknown } | null;
};

// 매치 settings 에서 경기별 배정된 기록자 userId 추출 (없으면 null).
function getMatchRecorderId(m: MatchRow): string | null {
  const s = m.settings as Record<string, unknown> | null;
  if (!s) return null;
  const rid = s.recorder_id;
  return rid != null && rid !== "" ? String(rid) : null;
}

export default function TournamentRecordersPage() {
  const { id } = useParams<{ id: string }>();
  const [recorders, setRecorders] = useState<Recorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Track B-d — 경기별 기록자 배정 state
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [matchError, setMatchError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/recorders`);
      if (res.ok) setRecorders(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  // Track B-d — 경기 목록 로드 (경기별 배정 현황 표시용)
  const loadMatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/matches`);
      if (res.ok) setMatches(await res.json());
    } catch { /* ignore */ } finally {
      setMatchesLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadMatches(); }, [loadMatches]);

  const addRecorder = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/recorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");
      setEmail("");
      setSuccess(`${data.recorder?.nickname ?? email} 님을 기록원으로 추가했습니다.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAdding(false);
    }
  };

  const removeRecorder = async (recorderId: string, name: string) => {
    if (!confirm(`${name} 님의 기록원 권한을 제거하시겠습니까?`)) return;
    try {
      await fetch(`/api/web/tournaments/${id}/recorders`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recorderId }),
      });
      await load();
    } catch { /* ignore */ }
  };

  const activeRecorders = recorders.filter((r) => r.is_active);

  // Track B-d — 경기별 기록자 배정/해제 (settings.recorder_id PATCH).
  //   recorderUserId="" → 해제. 풀 인원만 select 에 노출되므로 클라단 검증 추가 불요(서버 풀 검증 존재).
  const assignRecorder = async (matchId: string, recorderUserId: string) => {
    setAssigningId(matchId);
    setMatchError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${id}/matches/${matchId}/recorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // snake_case 키 — 서버가 body.recorder_id 로 수신
          body: JSON.stringify({ recorder_id: recorderUserId || null }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "배정 실패");
      // 낙관 갱신 — 해당 매치 settings.recorder_id 만 로컬 반영
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                settings: {
                  ...(m.settings ?? {}),
                  recorder_id: recorderUserId || null,
                },
              }
            : m
        )
      );
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "오류 발생");
      // 실패 시 서버 진실로 재동기화
      await loadMatches();
    } finally {
      setAssigningId(null);
    }
  };

  // Track B-d — 자동 배정 (풀 라운드로빈). 미배정 경기만 채움(overwrite=false).
  const autoAssign = async () => {
    if (activeRecorders.length === 0) {
      setMatchError("먼저 기록원 풀에 인원을 추가하세요.");
      return;
    }
    if (!confirm("미배정 경기에 기록원 풀을 순환 배정합니다. 진행할까요?")) return;
    setAutoAssigning(true);
    setMatchError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${id}/recorders/auto-assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overwrite: false }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "자동 배정 실패");
      await loadMatches(); // 서버 결과로 전체 재동기화
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAutoAssigning(false);
    }
  };

  // 기록자 userId → 표시명 매핑 (활성 풀에서 조회)
  const recorderNameById = (userId: string | null): string => {
    if (!userId) return "미배정";
    const found = activeRecorders.find((r) => r.recorder_id === userId);
    return found ? (found.recorder.nickname ?? found.recorder.email) : "(풀 외 인원)";
  };

  // 미배정 경기 수 (자동배정 버튼 보조 안내)
  const unassignedCount = matches.filter((m) => !getMatchRecorderId(m)).length;

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss" className="max-w-2xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href={`/tournament-admin/tournaments/${id}`}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ← 대회 관리
        </Link>
        <h1 className="text-xl font-bold">기록원 관리</h1>
      </div>

      {/* 기록원 추가 */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">기록원 추가</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          mybdr 가입 회원의 이메일로 기록원을 지정합니다. 기록원은 bdr_stat 앱으로 경기를 실시간 기록할 수 있습니다.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") addRecorder();
            }}
            className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
          />
          <Button onClick={addRecorder} disabled={adding || !email.trim()}>
            {adding ? "추가 중..." : "추가"}
          </Button>
        </div>
        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        {success && <p className="text-sm text-[var(--color-success)]">{success}</p>}
      </Card>

      {/* 기록원 목록 */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">
          현재 기록원 {activeRecorders.length > 0 && `(${activeRecorders.length}명)`}
        </h2>

        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">불러오는 중...</p>
        ) : activeRecorders.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">등록된 기록원이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {activeRecorders.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between p-3 bg-[var(--color-elevated)] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {r.recorder.profile_image_url ? (
                    <Image
                      src={r.recorder.profile_image_url}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                      unoptimized /* 외부 프로필 이미지 URL — 도메인이 다양 */
                    />
                  ) : (
                    /* 2026-05-12 — admin 빨강 본문 금지 → info(Navy) 토큰 */
                    <div className="w-8 h-8 rounded-full bg-[var(--color-info)]/10 flex items-center justify-center text-[var(--color-info)] text-xs font-bold">
                      {(r.recorder.nickname ?? r.recorder.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {r.recorder.nickname ?? r.recorder.email}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{r.recorder.email}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    removeRecorder(
                      r.recorder_id,
                      r.recorder.nickname ?? r.recorder.email
                    )
                  }
                  className="text-xs text-[var(--color-error)] hover:text-[var(--color-error)] px-2 py-1 rounded hover:bg-[var(--color-error)]/10"
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Track B-d — 경기별 기록자 배정 (settings.recorder_id).
          위 "기록원 풀"에 등록된 인원을 개별 경기에 배정한다. */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-[var(--color-text-primary)]">경기별 기록자 배정</h2>
          {/* 자동 배정 — 미배정 경기에 풀 라운드로빈 */}
          <Button
            variant="secondary"
            onClick={autoAssign}
            disabled={autoAssigning || activeRecorders.length === 0 || unassignedCount === 0}
            className="text-xs"
          >
            {autoAssigning ? "배정 중..." : "자동 배정"}
          </Button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          위 풀에 등록된 기록원을 각 경기에 지정합니다.
          {unassignedCount > 0 && ` 미배정 ${unassignedCount}경기.`}
        </p>

        {matchError && <p className="text-sm text-[var(--color-error)]">{matchError}</p>}

        {matchesLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">불러오는 중...</p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            등록된 경기가 없습니다. 대진표를 먼저 생성하세요.
          </p>
        ) : activeRecorders.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            먼저 기록원 풀에 인원을 추가하면 경기별 배정을 할 수 있습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => {
              const recorderId = getMatchRecorderId(m);
              // 라벨: 라운드/경기번호 + 대진(홈 vs 원정)
              const roundLabel =
                m.round_name ?? (m.round_number != null ? `라운드 ${m.round_number}` : "경기");
              const vsLabel = `${m.homeTeam?.team.name ?? "미정"} vs ${m.awayTeam?.team.name ?? "미정"}`;
              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-2 p-3 bg-[var(--color-elevated)] rounded-lg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {roundLabel}
                      {m.match_number != null && ` · #${m.match_number}`}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{vsLabel}</p>
                    {/* 현재 배정 상태 라벨 */}
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      배정:{" "}
                      <span className={recorderId ? "text-[var(--color-info)]" : ""}>
                        {recorderNameById(recorderId)}
                      </span>
                    </p>
                  </div>
                  {/* 기록자 select — 풀 활성 인원 + (미배정) */}
                  <select
                    value={recorderId ?? ""}
                    disabled={assigningId === m.id}
                    onChange={(e) => assignRecorder(m.id, e.target.value)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-50 sm:w-48"
                  >
                    <option value="">(미배정)</option>
                    {activeRecorders.map((r) => (
                      <option key={r.recorder_id} value={r.recorder_id}>
                        {r.recorder.nickname ?? r.recorder.email}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/site-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PanelLoadingState } from "./panel-loading-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// 2026-05-11: BDR 브랜드 hex hardcode 단일화
import { BDR_PRIMARY_HEX } from "@/lib/constants/colors";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

// 미리보기 시뮬레이션 — 사용자가 선택할 수 있는 사이트 템플릿의 미리보기용 hex.
// CSS 변수 (`var(--*)`) 미사용 의도: 미리보기 카드는 실제 사이트의 적용 결과를
// 시각적으로 시뮬레이션해야 함 → 사용자의 다크/라이트 모드 영향을 받지 않도록 고정 hex.
const TEMPLATES = [
  {
    slug: "classic-tournament",
    name: "Classic",
    desc: "깔끔한 화이트 배경의 모던 레이아웃",
    navBg: "#1B3C87",
    bg: "#F5F7FA",
    cardBg: "#FFFFFF",
  },
  {
    slug: "the-process",
    name: "Dark",
    desc: "강렬한 다크 배경의 대담한 스타일",
    navBg: "#1F2937",
    bg: "#0F172A",
    cardBg: "#1E293B",
  },
  {
    slug: "minimal-white",
    name: "Minimal",
    desc: "타이포그래피 중심의 미니멀한 느낌",
    navBg: "#FFFFFF",
    bg: "#FFFFFF",
    cardBg: "#F5F7FA",
  },
];

// 색상 팔레트 — 사용자가 대회 사이트 primary 색상으로 고를 수 있는 선택지.
// `BDR_PRIMARY_HEX` 만 lib/constants/colors.ts 단일 source 적용 (브랜드 원색은 단일 관리).
// 그 외 팔레트는 사용자 선택지 자체가 의도 → 별도 상수화 X.
const COLOR_PRESETS = [
  { hex: "#1B3C87", name: "토스 블루" },
  { hex: "#EF4444", name: "레드" },
  // 2026-05-11 fix — 기존 "오렌지" 라벨은 hex (#E31B23 = BDR Red) 와 불일치 → "BDR Red" 로 정정
  { hex: BDR_PRIMARY_HEX, name: "BDR Red" },
  { hex: "#22C55E", name: "그린" },
  { hex: "#8B5CF6", name: "퍼플" },
  { hex: "#FBBF24", name: "골드" },
  { hex: "#0EA5E9", name: "스카이" },
  { hex: "#1F2937", name: "다크" },
];

// ─── 타입 ─────────────────────────────────────────────────────────────────────

// 2026-05-15 (Snake-case sync fix) — apiSuccess() 가 응답 키를 자동 snake_case
// 변환하므로 GET /site 응답 = snake_case. 이전에 camelCase (isPublished) 로
// 정의해서 site?.isPublished = undefined → 발행 후 UI 전환 실패.
// errors.md "재발 5회" 패턴 6회째 회귀 차단.
type Site = {
  id: string;
  subdomain: string;
  is_published: boolean;
  primary_color: string | null;
  secondary_color: string | null;
  site_name: string | null;
  site_template_slug?: string | null;
};

// ─── 템플릿 미리보기 카드 ────────────────────────────────────────────────────

function TemplateMockup({
  template,
  accentColor,
}: {
  template: (typeof TEMPLATES)[0];
  accentColor: string;
}) {
  const nav = template.slug === "minimal-white" ? "#FFFFFF" : accentColor;
  const navTextColor = template.slug === "minimal-white" ? accentColor : "#FFFFFF";

  return (
    <div
      className="overflow-hidden rounded-md border-2 border-transparent"
      style={{ backgroundColor: template.bg, height: 120 }}
    >
      {/* 네비 */}
      <div
        className="flex h-7 items-center gap-1 px-2"
        style={{ backgroundColor: nav }}
      >
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.5 }} />
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.8 }} />
        <div className="ml-auto flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 w-4 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.5 }} />
          ))}
        </div>
      </div>
      {/* 히어로 */}
      <div className="mx-2 mt-2 h-5 rounded-lg" style={{ backgroundColor: accentColor, opacity: 0.15 }}>
        <div className="flex h-full items-center justify-center">
          <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.7 }} />
        </div>
      </div>
      {/* 콘텐츠 행 */}
      <div className="mx-2 mt-2 space-y-1.5">
        {[0.8, 0.5, 0.3].map((op, i) => (
          <div
            key={i}
            className="h-2 rounded-full"
            style={{ backgroundColor: template.cardBg, opacity: op, width: `${[80, 60, 45][i]}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export default function TournamentSitePage() {
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // 상태
  const [selectedTemplate, setSelectedTemplate] = useState("classic-tournament");
  const [selectedColor, setSelectedColor] = useState("#1B3C87");
  const [subdomain, setSubdomain] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`);
      if (res.ok) {
        // 2026-05-15 — 응답 = snake_case (apiSuccess 자동 변환). site_template relation 도 site_template 로 변환됨.
        const data: Site & { site_template?: { slug: string } | null } = await res.json();
        if (data?.id) {
          setSite(data);
          if (data.site_template?.slug) setSelectedTemplate(data.site_template.slug);
          if (data.primary_color) setSelectedColor(data.primary_color);
          if (data.subdomain) setSubdomain(data.subdomain);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // PATCH 저장 (템플릿 + 색상 + 서브도메인)
  const save = async (opts?: { andPublish?: boolean }) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: subdomain.trim().toLowerCase(),
          siteTemplateSlug: selectedTemplate,
          primaryColor: selectedColor,
          secondaryColor: selectedColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      await load();

      if (opts?.andPublish) {
        await togglePublish(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  };

  const togglePublish = async (forcePublish?: boolean) => {
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: forcePublish ?? !site?.is_published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setPublishing(false);
    }
  };

  const handleNextFromStep2 = async () => {
    // Step 2 → Step 3: subdomain 입력은 Step 3 에서 받음 → subdomain 있을 때만 중간 저장.
    // (2026-05-15 fix: subdomain 빈 상태 PATCH 시 BFF 가 400 "서브도메인이 필요합니다" 반환 → UX 차단.)
    if (subdomain.trim()) {
      const ok = await save();
      if (!ok) return;
    }
    setStep(3);
  };

  if (loading) return <PanelLoadingState label="사이트 설정을 준비 중입니다." />;

  // ─── 발행 완료 상태 ──────────────────────────────────────────────────────

  if (site?.is_published) {
    return (
      <div data-skin="toss">
        <div className="mb-6">
          <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            ← 대회 관리
          </Link>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">사이트 관리</h1>
        </div>

        {/* 발행 중 상태 카드 */}
        <div className="mb-6 rounded-md border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-success)]">● 사이트 공개 중</p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-[var(--color-text-primary)]">
                {site.subdomain}.mybdr.kr
              </p>
            </div>
            <div className="flex gap-2">
              {/* 2026-05-12 — pill 9999px ❌ → btn 클래스 (4px 라운딩 표준) */}
              <a
                href={`https://${site.subdomain}.mybdr.kr`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--sm"
              >
                방문하기 ↗
              </a>
              <button
                onClick={() => togglePublish(false)}
                disabled={publishing}
                className="rounded-[4px] border border-[var(--color-error)]/30 px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/5 disabled:opacity-50"
              >
                {publishing ? "처리 중..." : "비공개 전환"}
              </button>
            </div>
          </div>
        </div>

        {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
        {error && (
          <div
            className="mb-4 rounded-md px-4 py-3 text-sm"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
              color: "var(--color-error)",
            }}
          >
            {error}
          </div>
        )}

        {/* 수정 버튼들 */}
        <div className="grid gap-3 md:grid-cols-3">
          <button
            onClick={() => setStep(1)}
            className="rounded-md border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-2xl mb-2">🎨</p>
            <p className="font-semibold text-[var(--color-text-primary)]">템플릿 변경</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              {TEMPLATES.find((t) => t.slug === selectedTemplate)?.name ?? "Classic"}
            </p>
          </button>
          <button
            onClick={() => setStep(2)}
            className="rounded-md border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="mb-2 h-8 w-8 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: selectedColor }}
            />
            <p className="font-semibold text-[var(--color-text-primary)]">색상 변경</p>
            <p className="mt-0.5 font-mono text-sm text-[var(--color-text-muted)]">{selectedColor}</p>
          </button>
          <Link
            href={`/tournament-admin/tournaments/${id}#publish`}
            className="rounded-md border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-2xl mb-2">📄</p>
            <p className="font-semibold text-[var(--color-text-primary)]">공지 페이지</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">공지사항 작성</p>
          </Link>
        </div>

        {/* 스텝 1 오버레이 */}
        {step === 1 && (
          <Step1
            selected={selectedTemplate}
            accentColor={selectedColor}
            onChange={setSelectedTemplate}
            onNext={() => setStep(2)}
            onCancel={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step2
            selected={selectedColor}
            onChange={setSelectedColor}
            onNext={handleNextFromStep2}
            onBack={() => setStep(1)}
            saving={saving}
          />
        )}
      </div>
    );
  }

  // ─── 위자드 (3단계) ──────────────────────────────────────────────────────

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss">
      {/* 헤더 */}
      <div className="mb-8">
        <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          ← 대회 관리
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">사이트 만들기</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          3단계로 대회 전용 웹사이트를 만들어보세요
        </p>
      </div>

      {/* 진행 표시 */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              // 2026-05-12 — admin 빨강 본문 금지 (step indicator) → info(Navy)
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                step === s
                  ? "bg-[var(--color-info)] text-white"
                  : step > s
                  ? "bg-[var(--color-success)] text-white"
                  : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            <span
              className={`text-sm font-medium ${
                step === s ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              {["템플릿", "색상", "발행"][s - 1]}
            </span>
            {s < 3 && <div className="h-px w-8 bg-[var(--color-border)]" />}
          </div>
        ))}
      </div>

      {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
      {error && (
        <div
          className="mb-4 rounded-md px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* 단계별 컨텐츠 */}
      {step === 1 && (
        <Step1
          selected={selectedTemplate}
          accentColor={selectedColor}
          onChange={setSelectedTemplate}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2
          selected={selectedColor}
          onChange={setSelectedColor}
          onNext={handleNextFromStep2}
          onBack={() => setStep(1)}
          saving={saving}
        />
      )}

      {step === 3 && (
        <Step3
          subdomain={subdomain}
          onChange={setSubdomain}
          selectedTemplate={selectedTemplate}
          selectedColor={selectedColor}
          siteId={site?.id}
          saving={saving || publishing}
          onBack={() => setStep(2)}
          onPublish={async () => {
            const ok = await save({ andPublish: true });
            if (!ok) return;
          }}
          onSaveDraft={async () => {
            await save();
          }}
          error={error}
        />
      )}
    </div>
  );
}

// ─── 스텝 1: 템플릿 선택 ────────────────────────────────────────────────────

function Step1({
  selected,
  accentColor,
  onChange,
  onNext,
  onCancel,
}: {
  selected: string;
  accentColor: string;
  onChange: (slug: string) => void;
  onNext: () => void;
  onCancel?: () => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">템플릿 선택</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        대회 사이트의 전체 스타일을 선택하세요. 언제든지 변경할 수 있습니다.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.slug}
            onClick={() => onChange(tpl.slug)}
            className={`rounded-md border-2 p-4 text-left transition-all ${
              selected === tpl.slug
                ? "border-[var(--color-accent)] shadow-[0_0_0_4px_rgba(0,102,255,0.1)]"
                : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
            }`}
          >
            <TemplateMockup template={tpl} accentColor={accentColor} />
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--color-text-primary)]">{tpl.name}</p>
                {selected === tpl.slug && (
                  /* 2026-05-12 — 선택됨 ✓ = 긍정 결과 → success(Green) (룰 11 — 승자/긍정 = success) */
                  <span className="text-xs font-medium text-[var(--color-success)]">선택됨 ✓</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{tpl.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            취소
          </button>
        )}
        <Button onClick={onNext} className="ml-auto">
          다음: 색상 선택 →
        </Button>
      </div>
    </div>
  );
}

// ─── 스텝 2: 색상 선택 ──────────────────────────────────────────────────────

function Step2({
  selected,
  onChange,
  onNext,
  onBack,
  saving,
}: {
  selected: string;
  onChange: (hex: string) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">대표 색상 선택</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        사이트 네비게이션과 강조 색상으로 사용됩니다.
      </p>

      {/* 색상 팔레트 */}
      <div className="flex flex-wrap gap-4">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            title={c.name}
            className={`group relative flex flex-col items-center gap-2 ${
              selected === c.hex ? "" : "opacity-80 hover:opacity-100"
            }`}
          >
            <div
              className={`h-14 w-14 rounded-full shadow-md transition-transform ${
                selected === c.hex
                  ? "scale-110 ring-4 ring-[var(--color-accent)]/30 ring-offset-2"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
            />
            <span className="text-xs text-[var(--color-text-muted)]">{c.name}</span>
            {selected === c.hex && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg text-white drop-shadow">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 미리보기 */}
      <div className="mt-8 rounded-md border border-[var(--color-border)] p-4">
        <p className="mb-3 text-xs font-medium text-[var(--color-text-muted)]">미리보기</p>
        <div className="overflow-hidden rounded-md" style={{ height: 64 }}>
          <div
            className="flex h-10 items-center gap-2 px-4"
            style={{ backgroundColor: selected }}
          >
            <div className="h-5 w-5 rounded-full bg-white/20" />
            <div className="h-2 w-20 rounded-full bg-white/80" />
            <div className="ml-auto flex gap-2">
              {["홈", "팀", "일정", "결과"].map((l) => (
                <span key={l} className="text-xs text-white/80">{l}</span>
              ))}
            </div>
          </div>
          <div
            className="flex items-center justify-center"
            style={{ height: 24, backgroundColor: `${selected}15` }}
          >
            <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: selected, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          ← 이전
        </button>
        <Button onClick={onNext} disabled={saving}>
          {saving ? "저장 중..." : "다음: 주소 설정 →"}
        </Button>
      </div>
    </div>
  );
}

// ─── 스텝 3: 주소 설정 + 발행 ────────────────────────────────────────────────

function Step3({
  subdomain,
  onChange,
  selectedTemplate,
  selectedColor,
  siteId,
  saving,
  onBack,
  onPublish,
  onSaveDraft,
  error,
}: {
  subdomain: string;
  onChange: (v: string) => void;
  selectedTemplate: string;
  selectedColor: string;
  siteId?: string;
  saving: boolean;
  onBack: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  error: string;
}) {
  const tplName = TEMPLATES.find((t) => t.slug === selectedTemplate)?.name ?? "Classic";

  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">주소 설정 및 발행</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        대회 사이트 URL을 설정하고 바로 공개하거나 임시 저장할 수 있습니다.
      </p>

      {/* 요약 */}
      <div className="mb-6 grid gap-3 rounded-md bg-[var(--color-surface)] p-4 md:grid-cols-2">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">선택한 템플릿</p>
          <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{tplName}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">대표 색상</p>
          <div className="mt-1 flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
              {selectedColor}
            </span>
          </div>
        </div>
      </div>

      {/* URL 설정 */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
          사이트 주소 <span className="text-[var(--color-error)]">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-md border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            value={subdomain}
            onChange={(e) =>
              onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="my-tournament"
            autoFocus
          />
          <span className="whitespace-nowrap text-sm font-medium text-[var(--color-text-muted)]">
            .mybdr.kr
          </span>
        </div>
        {subdomain && (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            https://<span className="text-[var(--color-info)]">{subdomain}</span>.mybdr.kr
          </p>
        )}
      </div>

      {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
      {error && (
        <div
          className="mb-4 rounded-md px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          disabled={saving}
        >
          ← 이전
        </button>
        <div className="flex gap-3">
          {/* 2026-05-12 — pill 9999px ❌ → btn 클래스 (4px 라운딩 표준) */}
          <button
            onClick={onSaveDraft}
            disabled={saving || !subdomain.trim()}
            className="btn disabled:opacity-40"
          >
            {saving ? "저장 중..." : "임시 저장"}
          </button>
          <Button
            onClick={onPublish}
            disabled={saving || !subdomain.trim()}
            className="min-w-[120px]"
          >
            {saving ? "처리 중..." : "🚀 공개하기"}
          </Button>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        공개 후에도 언제든지 설정을 변경하거나 비공개로 전환할 수 있습니다
      </p>
    </div>
  );
}


````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/teams-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
// 2026-05-16 PR-Admin-1 — 단계간 CTA (페이지 footer "다음: 대진표 생성 →")
import { NextStepCTA } from "../_components/NextStepCTA";
// Track B-a Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";
import { PanelLoadingState } from "./panel-loading-state";

/* ---------- 타입 ---------- */

type Player = {
  id: string;
  player_name: string | null;
  phone: string | null;
  jersey_number: number | null;
  position: string | null;
  role: string | null;
  user_id: string | null;
  users: { id: string; nickname: string | null; phone: string | null; profile_image_url: string | null } | null;
};

type TournamentTeam = {
  id: string;
  status: string;
  seedNumber: number | null;
  groupName: string | null;
  createdAt: string;
  team: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
  players: { id: string; role: string }[];
};

/**
 * apply_token 진행 표 row (Phase 2-C IA 통합).
 * - team-applications API 응답의 토큰 정보를 tournamentTeam.id 로 매핑해서 표 컬럼 추가.
 * - applyTokenUrl: 만료 토큰은 null 처리 (API 가 만료 검사 후 노출).
 */
// 2026-05-11 Phase 3-D — 검토 보고서 §D 권장 4건 통합:
//   - appliedVia (admin / coach_token / self / null) — 등록 경로 배지
//   - appliedAt (신청 시각) — createdAt 보다 우선 표시
//   - waitingNumber — 대기접수 N번
//   - registeredBy — 일반 신청자 정보 (nickname / email)
type TokenInfo = {
  applyTokenUrl: string | null;
  applyTokenExpiresAt: string | null;
  managerName: string | null;
  managerPhone: string | null;
  appliedVia: string | null;
  appliedAt: string | null;
  waitingNumber: number | null;
  registeredBy: { nickname: string | null; email: string | null } | null;
  // Phase 3-F 옵션 A 신규
  category: string | null;
  paymentStatus: string | null;
  updatedAt: string;
};

type DivisionRuleOption = {
  code: string;
  label: string;
  cap: number | null;
};

/* ---------- 상수 ---------- */

const STATUS_LABEL: Record<string, string> = {
  pending: "대기 중",
  approved: "승인",
  rejected: "거절",
  withdrawn: "취소",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
  approved: "text-[var(--color-game-team)] bg-[var(--color-game-team)]/10",
  rejected: "text-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]",
  withdrawn: "text-[var(--color-text-muted)] bg-[var(--color-elevated)]",
};

/* ---------- 선수 추가 폼 초기값 ---------- */
const EMPTY_FORM = { player_name: "", phone: "", jersey_number: "", position: "" };

/* ---------- 메인 컴포넌트 ---------- */

export default function TournamentTeamsPage() {
  const { id } = useParams<{ id: string }>();
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [drawingDivision, setDrawingDivision] = useState<string | null>(null);

  // 선수 관리 상태
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  // Phase 2-C IA — apply_token 진행 표 통합
  // tokenMap: tournamentTeam.id → 토큰 URL/만료/코치정보
  // 이유(왜): 기존 API 응답에는 토큰 정보가 없어 별도 endpoint 호출 후 id 매핑.
  const [tokenMap, setTokenMap] = useState<Record<string, TokenInfo>>({});
  const [toast, setToast] = useState<string | null>(null);
  // Phase 3-F 옵션 A — Tournament 진행률 표시용 roster 룰
  const [rosterRule, setRosterRule] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  // 2026-05-12 Phase 4-B — 종별 룰 목록 (드롭다운용)
  const [divisionRules, setDivisionRules] = useState<DivisionRuleOption[]>([]);
  // 모달 inline 편집 상태 (코치 / 종별 / import)
  const [editingManager, setEditingManager] = useState(false);
  const [managerForm, setManagerForm] = useState({ name: "", phone: "" });
  const [showImportModal, setShowImportModal] = useState(false);

  // 토스트 자동 사라짐 (3초)
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* --- 팀 목록 로드 + 토큰 정보 병합 (Phase 2-C 통합) --- */
  const load = useCallback(async () => {
    try {
      // 1) 기존 팀/선수 정보 (시드/상태 관리용)
      //    API 응답이 snake_case 자동 변환되므로 camelCase interface 로 명시 매핑 (Invalid Date / 시드 누락 fix)
      const res = await fetch(`/api/web/tournaments/${id}/teams`);
      if (res.ok) {
        const raw = (await res.json()) as Array<{
          id: string;
          status: string;
          seed_number: number | null;
          group_name: string | null;
          created_at: string;
          team: {
            id: string; name: string;
            logo_url: string | null; primary_color: string | null;
          };
          players: Array<{ id: string; role: string }>;
        }>;
        const mapped: TournamentTeam[] = raw.map((t) => ({
          id: t.id,
          status: t.status,
          seedNumber: t.seed_number,
          groupName: t.group_name,
          createdAt: t.created_at,
          team: {
            id: t.team.id,
            name: t.team.name,
            logoUrl: t.team.logo_url,
            primaryColor: t.team.primary_color,
          },
          players: t.players,
        }));
        setTeams(mapped);
      }

      // 2) 토큰 정보 (apply_token URL + 만료) — 별도 endpoint
      //    응답은 snake_case (apiSuccess 자동 변환) — apply_token_url / apply_token_expires_at
      const tokenRes = await fetch(`/api/web/admin/tournaments/${id}/team-applications`);
      if (tokenRes.ok) {
        const json = await tokenRes.json();
        const next: Record<string, TokenInfo> = {};
        // apiSuccess 응답 = raw data (no { data: ... } wrapper). { teams: [...] } 형태.
        // 응답 key 가 snake_case 로 변환되므로 접근자도 snake_case 사용 (CLAUDE.md §보안 5번)
        const teamsArr = (json?.teams ?? []) as Array<{
          id: string;
          apply_token_url: string | null;
          apply_token_expires_at: string | null;
          manager_name: string | null;
          manager_phone: string | null;
          applied_via: string | null;
          applied_at: string | null;
          waiting_number: number | null;
          registered_by: { nickname: string | null; email: string | null } | null;
          category: string | null;
          payment_status: string | null;
          updated_at: string;
        }>;
        for (const row of teamsArr) {
          next[row.id] = {
            applyTokenUrl: row.apply_token_url,
            applyTokenExpiresAt: row.apply_token_expires_at,
            managerName: row.manager_name,
            managerPhone: row.manager_phone,
            appliedVia: row.applied_via,
            appliedAt: row.applied_at,
            waitingNumber: row.waiting_number,
            registeredBy: row.registered_by,
            category: row.category,
            paymentStatus: row.payment_status,
            updatedAt: row.updated_at,
          };
        }
        setTokenMap(next);
        // Tournament roster 룰 (페이지 단위 1회)
        setRosterRule({
          min: typeof json?.roster_min === "number" ? json.roster_min : null,
          max: typeof json?.roster_max === "number" ? json.roster_max : null,
        });
        // Phase 4-B 종별 룰 (드롭다운용)
        setDivisionRules((json?.division_rules ?? []) as DivisionRuleOption[]);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* --- 토큰 URL 복사 (clipboard + 토스트) --- */
  const copyTokenUrl = useCallback(
    async (url: string | null) => {
      if (!url) {
        showToast("토큰이 만료되었습니다. 재발급이 필요합니다.");
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        showToast("토큰 URL이 복사되었습니다");
      } catch {
        showToast("복사에 실패했습니다");
      }
    },
    [showToast],
  );

  /* --- 만료일 포맷 (YYYY.MM.DD) --- */
  const formatExpiry = (iso: string | null): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  /* --- 팀 상태 변경 --- */
  const updateStatus = async (teamId: string, status: string) => {
    setActionLoading(teamId);
    try {
      await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch { /* ignore */ } finally {
      setActionLoading(null);
    }
  };

  /* --- Track B-a: 납부 상태 변경 (paid 설정 시 입금→자동확정 트리거) --- */
  // 이유(왜): 운영자가 입금 확인 후 "납부"로 바꾸면 서버가 정원 가드 통과 시 자동으로 승인 처리한다.
  //   응답의 promoted / promote_reason 으로 결과(승격 / 정원초과 보류)를 토스트 안내한다.
  const updatePayment = async (teamId: string, paymentStatus: string) => {
    setActionLoading(teamId);
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: paymentStatus }),
      });
      // 응답 key 는 snake_case (apiSuccess 자동 변환) — promoted / promote_reason
      const json = await res.json().catch(() => null);
      if (paymentStatus === "paid" && json) {
        if (json.promoted) {
          showToast("입금 확인 — 참가 확정(승인)으로 자동 변경되었습니다.");
        } else if (json.promote_reason === "division_full") {
          showToast("입금 처리됨 — 단, 해당 종별 정원이 가득 차 자동 승인은 보류되었습니다.");
        } else {
          showToast("납부 상태가 변경되었습니다.");
        }
      } else {
        showToast("납부 상태가 변경되었습니다.");
      }
      await load();
    } catch {
      showToast("네트워크 오류");
    } finally {
      setActionLoading(null);
    }
  };

  /* --- Phase 4-B 옵션 B (모달 inline 액션 4건) --- */

  // 토큰 재발급
  const reissueToken = async (ttId: string) => {
    if (!confirm("토큰을 재발급하시겠습니까?\n기존 토큰 URL은 무효화됩니다.")) return;
    try {
      const res = await fetch(`/api/web/admin/tournaments/${id}/teams/${ttId}/reissue-token`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) return showToast(json.error ?? "재발급 실패");
      if (json.apply_token_url) {
        try { await navigator.clipboard.writeText(json.apply_token_url); } catch { /* ignore */ }
        showToast(`재발급 완료 — 링크가 복사되었습니다. (만료 ${new Date(json.expires_at).toLocaleDateString("ko-KR")})`);
      } else {
        showToast("재발급 완료");
      }
      await load();
    } catch { showToast("네트워크 오류"); }
  };

  // 코치 정보 변경
  const saveManager = async (ttId: string) => {
    try {
      const body: Record<string, string> = {};
      if (managerForm.name.trim()) body.managerName = managerForm.name.trim();
      // phone 빈 문자열 = null 처리 (zod 가 빈 값 허용)
      body.managerPhone = managerForm.phone.trim();
      const res = await fetch(`/api/web/admin/tournaments/${id}/teams/${ttId}/manager`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) return showToast(json.error ?? "저장 실패");
      showToast(json.changed ? "코치 정보 변경됨" : "변경 사항 없음");
      setEditingManager(false);
      await load();
    } catch { showToast("네트워크 오류"); }
  };

  // 종별 변경
  const changeCategory = async (ttId: string, category: string) => {
    if (!category) return;
    if (!confirm(`종별을 "${category}" 로 변경하시겠습니까?\n선수 명단의 division_code 도 일괄 변경됩니다.`)) return;
    try {
      const res = await fetch(`/api/web/admin/tournaments/${id}/teams/${ttId}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const json = await res.json();
      if (!res.ok) return showToast(json.error ?? "변경 실패");
      showToast(json.changed ? `종별: ${json.previous ?? "(없음)"} → ${json.current}` : "변경 사항 없음");
      await load();
    } catch { showToast("네트워크 오류"); }
  };

  /* --- 시드 배정 --- */
  const updateSeed = async (teamId: string, seed: number | null) => {
    try {
      await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedNumber: seed }),
      });
      await load();
    } catch { /* ignore */ }
  };

  const updateGroup = async (teamId: string, groupName: string | null) => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        showToast(json?.error ?? "조 변경 실패");
        return;
      }
      showToast(groupName ? `${groupName}조로 변경되었습니다.` : "조 편성이 해제되었습니다.");
      await load();
    } catch {
      showToast("네트워크 오류");
    }
  };

  const autoDrawDivision = async (
    rule: DivisionRuleOption,
    mode: "random" | "seeded" = "random",
  ) => {
    const ready = divisionReadiness.find((item) => item.code === rule.code);
    if (!ready || ready.approved < 2) {
      showToast("승인팀이 2팀 이상이어야 조편성을 할 수 있습니다.");
      return;
    }
    const modeLabel = mode === "seeded" ? "시드 반영" : "랜덤";
    if (!confirm(`${rule.label} 승인팀 ${ready.approved}팀을 ${modeLabel} 방식으로 조편성할까요?`)) {
      return;
    }
    setDrawingDivision(rule.code);
    try {
      const res = await fetch(`/api/web/admin/tournaments/${id}/division-draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisionCode: rule.code, mode }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "조편성 실패");
        return;
      }
      showToast(`${json.division_label ?? rule.label}: ${json.group_count ?? 0}개 조 편성 완료`);
      await load();
    } catch {
      showToast("네트워크 오류");
    } finally {
      setDrawingDivision(null);
    }
  };

  /* --- 선수 목록 로드 --- */
  const loadPlayers = async (teamId: string) => {
    setPlayersLoading(true);
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${teamId}/players`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      }
    } catch { /* ignore */ } finally {
      setPlayersLoading(false);
    }
  };

  /* --- 팀 카드 클릭 → 선수 목록 토글 --- */
  const toggleTeam = (teamId: string) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
      setPlayers([]);
      setShowAddForm(false);
    } else {
      setExpandedTeamId(teamId);
      setShowAddForm(false);
      setAddForm(EMPTY_FORM);
      loadPlayers(teamId);
    }
  };

  /* --- 선수 추가 --- */
  const handleAddPlayer = async () => {
    if (!expandedTeamId || !addForm.player_name.trim()) return;
    setAddLoading(true);
    try {
      const body: Record<string, unknown> = {
        player_name: addForm.player_name.trim(),
      };
      // 전화번호: 숫자만 추출
      if (addForm.phone.trim()) {
        body.phone = addForm.phone.replace(/[^0-9]/g, "");
      }
      // 등번호
      if (addForm.jersey_number.trim()) {
        body.jersey_number = Number(addForm.jersey_number);
      }
      // 포지션
      if (addForm.position.trim()) {
        body.position = addForm.position.trim();
      }

      const res = await fetch(`/api/web/tournaments/${id}/teams/${expandedTeamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setAddForm(EMPTY_FORM);
        setShowAddForm(false);
        await loadPlayers(expandedTeamId);
        await load(); // 팀 목록도 새로고침 (선수 수 반영)
      } else {
        const err = await res.json();
        alert(err.error ?? "선수 추가에 실패했습니다.");
      }
    } catch {
      alert("선수 추가에 실패했습니다.");
    } finally {
      setAddLoading(false);
    }
  };

  /* --- 선수 삭제 --- */
  const handleDeletePlayer = async (playerId: string) => {
    if (!expandedTeamId) return;
    if (!confirm("이 선수를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(
        `/api/web/tournaments/${id}/teams/${expandedTeamId}/players/${playerId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await loadPlayers(expandedTeamId);
        await load();
      }
    } catch { /* ignore */ }
  };

  /* --- 필터 + 통계 (Phase 3-D 검토 보고서 §D 통합) --- */
  // 코치 미입력 = appliedVia='admin' + players 0건 (운영자 박제 후 코치가 토큰으로 입력 안 함)
  const isCoachPending = (tt: TournamentTeam): boolean => {
    const t = tokenMap[tt.id];
    return t?.appliedVia === "admin" && tt.players.length === 0;
  };

  const filtered =
    filter === "all"
      ? teams
      : filter === "coach_pending"
        ? teams.filter(isCoachPending)
        : teams.filter((t) => t.status === filter);

  const counts = {
    all: teams.length,
    pending: teams.filter((t) => t.status === "pending").length,
    approved: teams.filter((t) => t.status === "approved").length,
    rejected: teams.filter((t) => t.status === "rejected").length,
    coach_pending: teams.filter(isCoachPending).length,
  };

  // 통계 카드 — 등록 경로별 분류 (Phase 3-D 권장 4)
  const viaStats = {
    admin: teams.filter((tt) => tokenMap[tt.id]?.appliedVia === "admin").length,
    coach_token: teams.filter((tt) => tokenMap[tt.id]?.appliedVia === "coach_token").length,
    self: teams.filter((tt) => tokenMap[tt.id]?.appliedVia === "self").length,
    null: teams.filter((tt) => !tokenMap[tt.id]?.appliedVia).length,
  };
  const approvedTeams = teams.filter((tt) => tt.status === "approved");
  const divisionReadiness = divisionRules.map((rule) => {
    const approved = approvedTeams.filter(
      (tt) => tokenMap[tt.id]?.category === rule.code,
    ).length;
    const total = teams.filter((tt) => tokenMap[tt.id]?.category === rule.code).length;
    const overCapacity = rule.cap != null && approved > rule.cap;
    return {
      ...rule,
      approved,
      total,
      overCapacity,
      ready: approved >= 2 && !overCapacity,
    };
  });
  const unassignedApprovedCount = approvedTeams.filter(
    (tt) => !tokenMap[tt.id]?.category,
  ).length;
  const readyDivisionCount = divisionReadiness.filter((item) => item.ready).length;

  if (loading) return <PanelLoadingState label="참가팀 정보를 준비 중입니다." />;

  return (
    <div data-skin="toss">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">&larr; 대회 관리</Link>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">참가팀 관리</h1>
          {/* Phase 2-C 안내 — 코치 토큰 URL 공유 시 비로그인으로 명단 입력 가능 */}
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            코치에게 토큰 URL을 공유하면 비로그인으로 명단 입력 가능합니다.
          </p>
        </div>
        {/* 2026-05-11 Phase 3-C — 토큰 발송 도구 (CSV 다운로드 + 메시지 일괄 복사) */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadTokenCsv(teams, tokenMap)}
            disabled={!aliveTokenCount(tokenMap)}
            className="btn btn--sm"
            title="모든 팀의 명단 입력 링크를 파일로 받기"
          >
            <Icon name="download" size={16} className="align-middle mr-1" />
            토큰 파일 받기 ({aliveTokenCount(tokenMap)})
          </button>
          <button
            type="button"
            onClick={() => copyAllTokenMessages(teams, tokenMap, showToast)}
            disabled={!aliveTokenCount(tokenMap)}
            className="btn btn--primary btn--sm"
            title="카톡 발송용 안내문 일괄 복사"
          >
            <Icon name="message-circle" size={16} className="align-middle mr-1" />
            카톡 문구 복사
          </button>
          {/* 2026-05-16 PR-Admin-2 — "순위전 자동 채우기" 버튼은 matches 페이지로 이동 박제됨 (AdvancePlayoffsButton).
              admin-flow §3 단계 10 = "예선 종료 → 순위전 진출" 은 matches 페이지가 자연스러운 위치. */}
        </div>
      </div>

      {/* 등록 경로 통계 카드 (Phase 3-D 권장 4 — 강남구 일괄 박제 vs 코치 신청 구분 시각화) */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ViaStatCard label="운영자 등록" count={viaStats.admin} icon="briefcase" />
        <ViaStatCard label="코치 신청" count={viaStats.coach_token} icon="id-card" />
        <ViaStatCard label="본인 신청" count={viaStats.self} icon="user" />
        <ViaStatCard label="경로 미상" count={viaStats.null} icon="circle-help" />
      </div>

      {/* 통계 탭 — status 분류 + 코치 미입력 (운영자 박제 + 코치 명단 0건)
          2026-05-12 — 탭 필터 pill 9999px ❌ + admin 빨강 본문 금지 룰 → rounded-[4px] + info(Navy) 활성 톤.
          count 뱃지 (rounded-full px-1.5 py-0.5) = 작은 정사각형 chip → 보존 (룰 10 예외) */}
      {divisionRules.length > 0 && (
        <section
          className="mb-4 rounded-[18px] border bg-[var(--card)] p-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[var(--ink)]">종별 배정 현황</h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                승인팀 기준 {readyDivisionCount}/{divisionRules.length}개 종별 대진 준비
              </p>
            </div>
            <Link
              href={`/tournament-admin/tournaments/${id}#bracket`}
              className="ts-btn ts-btn--secondary ts-btn--sm"
            >
              대진추첨으로
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {divisionReadiness.map((item) => (
              <div
                key={item.code}
                className="rounded-[14px] border bg-[var(--grey-50)] p-3"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--ink)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      전체 {item.total}팀 · 승인 {item.approved}
                      {item.cap != null ? ` / 정원 ${item.cap}` : ""}
                    </p>
                  </div>
                  <span
                    className="rounded-[8px] px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: item.overCapacity
                        ? "color-mix(in srgb, var(--color-error) 14%, transparent)"
                        : item.ready
                          ? "color-mix(in srgb, var(--color-success) 14%, transparent)"
                          : "var(--color-elevated)",
                      color: item.overCapacity
                        ? "var(--color-error)"
                        : item.ready
                          ? "var(--color-success)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {item.overCapacity ? "정원 초과" : item.ready ? "준비" : "대기"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => autoDrawDivision(item, "random")}
                    disabled={drawingDivision === item.code || item.approved < 2}
                    className="ts-btn ts-btn--secondary ts-btn--sm w-full"
                  >
                    {drawingDivision === item.code ? "조편성 중..." : "랜덤"}
                  </button>
                  <button
                    type="button"
                    onClick={() => autoDrawDivision(item, "seeded")}
                    disabled={drawingDivision === item.code || item.approved < 2}
                    className="ts-btn ts-btn--secondary ts-btn--sm w-full"
                  >
                    시드 반영
                  </button>
                </div>
              </div>
            ))}
            {unassignedApprovedCount > 0 && (
              <div
                className="rounded-[14px] border p-3"
                style={{
                  borderColor: "var(--color-warning)",
                  background: "color-mix(in srgb, var(--color-warning) 8%, transparent)",
                }}
              >
                <p className="text-sm font-bold text-[var(--ink)]">종별 미배정</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  승인팀 {unassignedApprovedCount}팀의 종별을 먼저 지정해야 합니다.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected", "coach_pending"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="ts-chip"
            data-active={filter === s}
          >
            {s === "all" ? "전체" : s === "coach_pending" ? "코치 미입력" : STATUS_LABEL[s]}
            <span className="rounded-[8px] bg-[var(--grey-100)] px-1.5 py-0.5 text-xs">{counts[s]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2 flex justify-center">
            <Icon name="volleyball" size={36} />
          </div>
          {filter === "all" ? "참가 신청한 팀이 없습니다." : `${STATUS_LABEL[filter]} 상태의 팀이 없습니다.`}
        </Card>
      ) : (
        // 2026-05-12 — 사용자 요청: 종별 그룹화 (i2-U11 / i3-U9 / i3w-U12 등 같은 종별 묶음)
        // 그룹 정렬 = 종 코드 알파벳 / 그룹 내 = 기존 filtered 순서 유지 (createdAt desc)
        // "종별 미지정" 팀 = "기타" 그룹으로 마지막
        (() => {
          const groups: Record<string, typeof filtered> = {};
          for (const tt of filtered) {
            const cat = tokenMap[tt.id]?.category ?? "기타";
            (groups[cat] ??= []).push(tt);
          }
          // 정렬 — 종 코드 알파벳 / "기타" 는 항상 마지막
          const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === "기타") return 1;
            if (b === "기타") return -1;
            return a.localeCompare(b);
          });
          return (
            <div className="space-y-6">
              {sortedKeys.map((cat) => (
                <section key={cat}>
                  {/* 종별 헤더 — accent 톤 작은 헤더 */}
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <h3
                      className="text-sm font-bold uppercase tracking-wide"
                      style={{ color: "var(--color-accent)", letterSpacing: "0.04em" }}
                    >
                      {cat}
                    </h3>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      ({groups[cat].length}팀)
                    </span>
                    <div
                      className="flex-1 border-t"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                  <div className="space-y-2">
                    {groups[cat].map((tt) => {
            // Phase 2-C — 토큰 정보 매핑 (tournamentTeam.id 기준)
            const token = tokenMap[tt.id];
            const tokenAlive = !!token?.applyTokenUrl;
            return (
            <Card key={tt.id}>
              {/* 팀 정보 행 */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div
                  className="flex min-w-0 cursor-pointer items-center gap-3"
                  onClick={() => toggleTeam(tt.id)}
                >
                  {/* 팀 색상 아이콘 — 정사각형(W=H) 원형은 룰 10에 따라 9999px 회피 → 50% */}
                  <div
                    className="h-10 w-10 rounded-[50%]"
                    style={{ backgroundColor: tt.team.primaryColor ?? "var(--color-primary)" }}
                  />
                  <div>
                    {/* 팀명 + 배지 (Phase 3-D 권장 1 — applied_via 배지) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{tt.team.name}</p>
                      <ViaBadge appliedVia={token?.appliedVia ?? null} />
                      <StatusBadge status={tt.status} />
                      {token?.waitingNumber && (
                        <span className="rounded-[8px] bg-[var(--color-warning)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
                          대기 {token.waitingNumber}번
                        </span>
                      )}
                      {isCoachPending(tt) && (
                        <span className="rounded-[8px] bg-[var(--color-info)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-info)]">
                          코치 입력 대기
                        </span>
                      )}
                    </div>
                    {/* 메타 정보 — 선수수 / 신청 시각 (applied_at 우선, fallback createdAt) / 코치 / 신청자 */}
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      선수 {tt.players.length}명 &middot;{" "}
                      {token?.appliedAt
                        ? `${new Date(token.appliedAt).toLocaleDateString("ko-KR")} 신청`
                        : `${new Date(tt.createdAt).toLocaleDateString("ko-KR")} 등록`}
                      {token?.managerName && <> &middot; 코치 {token.managerName}</>}
                      {token?.registeredBy?.nickname && (
                        <> &middot; 신청자 {token.registeredBy.nickname}</>
                      )}
                    </p>
                  </div>
                  {/* 펼침 화살표 */}
                  <Icon
                    name={expandedTeamId === tt.id ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="var(--color-text-muted)"
                  />
                </div>

                <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
                  {/* Phase 2-C — 토큰 URL 복사 버튼 */}
                  {/* 토큰 자체가 발급된 적이 없는 팀(직접 등록 등) = "-" / 만료 = "만료" 표시 */}
                  {token ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyTokenUrl(token.applyTokenUrl);
                      }}
                      disabled={!tokenAlive}
                      title={tokenAlive ? `만료: ${formatExpiry(token.applyTokenExpiresAt)}` : "토큰 만료됨"}
                      className={`ts-btn ts-btn--sm ${
                        tokenAlive
                          ? "ts-btn--secondary"
                          : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <Icon name={tokenAlive ? "copy" : "link-2-off"} size={14} />
                      {tokenAlive ? "링크 복사" : "만료"}
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]" title="토큰 미발급">—</span>
                  )}
                  {/* 시드 배정 */}
                  {tt.status === "approved" && (
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-[var(--color-text-muted)]">시드</label>
                      <input
                        type="number"
                        min={1}
                        defaultValue={tt.seedNumber ?? ""}
                        onBlur={(e) =>
                          updateSeed(tt.id, e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-16 rounded-[8px] border-none bg-[var(--color-elevated)] px-2 py-1 text-center text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/50"
                        placeholder="-"
                      />
                    </div>
                  )}

                  {/* 상태 뱃지 */}
                  {tt.status === "approved" && (
                    <label className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <span>조</span>
                      <input
                        defaultValue={tt.groupName ?? ""}
                        onBlur={(e) => {
                          const next = e.target.value.trim().toUpperCase();
                          if (next !== (tt.groupName ?? "")) updateGroup(tt.id, next || null);
                        }}
                        className="w-12 rounded-[8px] border-none bg-[var(--color-elevated)] px-2 py-1 text-center text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/50"
                        placeholder="-"
                      />
                    </label>
                  )}

                  <span className={`rounded-[8px] px-3 py-1 text-xs font-medium ${STATUS_COLOR[tt.status] ?? ""}`}>
                    {STATUS_LABEL[tt.status] ?? tt.status}
                  </span>

                  {/* 액션 버튼 */}
                  {tt.status === "pending" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(tt.id, "approved")}
                        disabled={actionLoading === tt.id}
                        className="ts-btn ts-btn--primary ts-btn--sm"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => updateStatus(tt.id, "rejected")}
                        disabled={actionLoading === tt.id}
                        className="ts-btn ts-btn--danger ts-btn--sm"
                      >
                        거절
                      </button>
                    </div>
                  )}
                  {tt.status === "approved" && (
                    <button
                      onClick={() => updateStatus(tt.id, "rejected")}
                      disabled={actionLoading === tt.id}
                      className="ts-btn ts-btn--danger ts-btn--sm"
                    >
                      거절
                    </button>
                  )}
                  {tt.status === "rejected" && (
                    <button
                      onClick={() => updateStatus(tt.id, "approved")}
                      disabled={actionLoading === tt.id}
                      className="ts-btn ts-btn--primary ts-btn--sm"
                    >
                      승인으로 변경
                    </button>
                  )}
                </div>
              </div>

              {/* 2026-05-12 Phase 3-E 후속 — 인라인 펼침 dead code 청소 완료.
                  선수 명단은 모달 (페이지 끝 TeamDetailModal) 에서 렌더링됨. */}
            </Card>
            );
          })}
                  </div>
                </section>
              ))}
            </div>
          );
        })()
      )}

      {/* Phase 4-B — 선수 일괄 import 모달 */}
      {showImportModal && expandedTeamId && (
        <ImportPlayersModal
          tournamentId={id}
          ttId={expandedTeamId}
          onClose={() => setShowImportModal(false)}
          onSuccess={(msg) => {
            setShowImportModal(false);
            showToast(msg);
            if (expandedTeamId) loadPlayers(expandedTeamId);
            load();
          }}
        />
      )}

      {/* Phase 2-C — 토스트 (화면 우상단 고정) */}
      {toast && (
        <div
          role="status"
          className="fixed top-20 right-4 z-50 rounded-[16px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--ink)] shadow-[var(--sh-md)] no-print"
          style={{ minWidth: 220 }}
        >
          {toast}
        </div>
      )}

      {/* 2026-05-11 Phase 3-E — 팀 상세 모달 (인라인 펼침 → 모달 전환 + 선수 명단 프린트) */}
      {expandedTeamId && (() => {
        const expandedTeam = teams.find((t) => t.id === expandedTeamId);
        if (!expandedTeam) return null;
        const token = tokenMap[expandedTeam.id];
        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-3 no-print sm:p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => { setExpandedTeamId(null); setPlayers([]); setShowAddForm(false); }}
          >
            <div
              id="team-detail-printable"
              className="relative my-3 w-full max-w-3xl rounded-[24px] border bg-[var(--card)] p-4 shadow-[var(--sh-lg)] sm:my-4 sm:p-6"
              style={{ borderColor: "var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 2026-05-12 — 닫기 X 버튼 우상단 절대 위치 (모달 표준 패턴) */}
              <button
                type="button"
                onClick={() => { setExpandedTeamId(null); setPlayers([]); setShowAddForm(false); }}
                className="ct-iconbtn absolute right-3 top-3 z-10 no-print"
                title="닫기"
                aria-label="닫기"
              >
                <Icon name="x" size={20} />
              </button>
              {/* 모달 헤더 — 팀 정보 + 액션 (프린트 / 닫기) — Phase 3-F 옵션 A 5건 통합
                  2026-05-11 모바일 최적화: 좁은 화면(<sm)에서 정보·액션 세로 분리 + 액션 wrap */}
              <div className="mb-4 flex flex-col gap-3 print-header sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold">{expandedTeam.team.name}</h2>
                    {/* 1. 신청 종별 — Phase 4-B: 드롭다운으로 변경 가능 */}
                    {divisionRules.length > 0 ? (
                      <select
                        value={token?.category ?? ""}
                        onChange={(e) => changeCategory(expandedTeam.id, e.target.value)}
                        className="rounded-[8px] px-2 py-0.5 text-[10px] font-semibold no-print"
                        style={{
                          background: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                          color: "var(--color-accent)",
                          letterSpacing: "0.04em",
                          border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
                        }}
                        title="종별 변경"
                      >
                        <option value="" disabled>종별 선택</option>
                        {divisionRules.map((d) => (
                          <option key={d.code} value={d.code}>{d.label}</option>
                        ))}
                      </select>
                    ) : (
                      token?.category && (
                        <span
                          className="rounded-[8px] px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                            color: "var(--color-accent)",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {token.category}
                        </span>
                      )
                    )}
                    <ViaBadge appliedVia={token?.appliedVia ?? null} />
                    <StatusBadge status={expandedTeam.status} />
                    {/* 3. 납부 상태 배지 (프린트 포함 표시) */}
                    <PaymentBadge status={token?.paymentStatus ?? null} />
                    {/* Track B-a — 납부 상태 인라인 변경 (paid 선택 시 입금→자동확정 트리거) */}
                    <select
                      value={token?.paymentStatus ?? "unpaid"}
                      onChange={(e) => updatePayment(expandedTeam.id, e.target.value)}
                      disabled={actionLoading === expandedTeam.id}
                      className="no-print rounded-[8px] border px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-card)",
                        color: "var(--color-text-secondary)",
                      }}
                      title="납부 상태 변경 (납부 선택 시 자동 승인)"
                    >
                      <option value="unpaid">미납</option>
                      <option value="paid">납부</option>
                      <option value="refunded">환불</option>
                    </select>
                    {token?.waitingNumber && (
                      <span className="rounded-[8px] bg-[var(--color-warning)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
                        대기 {token.waitingNumber}번
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {token?.appliedAt
                      ? `${new Date(token.appliedAt).toLocaleDateString("ko-KR")} 신청`
                      : `${new Date(expandedTeam.createdAt).toLocaleDateString("ko-KR")} 등록`}
                    {" "}· 코치{" "}
                    {editingManager ? (
                      <span className="no-print inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={managerForm.name}
                          onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                          placeholder="코치 이름"
                          className="w-24 rounded-[8px] border px-2 py-0.5 text-xs"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
                        />
                        <input
                          type="tel"
                          value={managerForm.phone}
                          onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
                          placeholder="010-XXXX-XXXX"
                          className="w-32 rounded-[8px] border px-2 py-0.5 text-xs"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
                        />
                        <button
                          type="button"
                          onClick={() => saveManager(expandedTeam.id)}
                          className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium text-white"
                          style={{ background: "var(--color-success)" }}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingManager(false)}
                          className="rounded-[8px] px-2 py-0.5 text-[10px]"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          취소
                        </button>
                      </span>
                    ) : (
                      <>
                        {token?.managerName ?? <span style={{ color: "var(--color-text-muted)" }}>(미입력)</span>}
                        {token?.managerPhone && (
                          <>
                            {" ("}
                            <a
                              href={`tel:${token.managerPhone.replace(/[^0-9+]/g, "")}`}
                              className="underline decoration-dotted underline-offset-2 hover:text-[var(--color-info)]"
                              style={{ color: "var(--color-info)" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {token.managerPhone}
                            </a>
                            {")"}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingManager(true);
                            setManagerForm({ name: token?.managerName ?? "", phone: token?.managerPhone ?? "" });
                          }}
                          className="ml-1 inline-flex no-print"
                          title="코치 정보 편집"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <Icon name="pencil" size={12} />
                        </button>
                      </>
                    )}
                    {token?.registeredBy?.nickname && <> · 신청자 {token.registeredBy.nickname}</>}
                  </p>
                  {/* 조 · 시드 변경 — Phase 3-F 옵션 A 후속: 시드 input 추가 */}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <label className="flex items-center gap-1 no-print">
                      <span>조</span>
                      <input
                        defaultValue={expandedTeam.groupName ?? ""}
                        onBlur={(e) => {
                          const next = e.target.value.trim().toUpperCase();
                          if (next !== (expandedTeam.groupName ?? "")) {
                            updateGroup(expandedTeam.id, next || null);
                          }
                        }}
                        className="w-12 rounded-[8px] border px-2 py-0.5 text-center text-xs focus:outline-none focus:ring-1"
                        style={{
                          borderColor: "var(--color-border)",
                          background: "var(--color-card)",
                          color: "var(--color-text-primary)",
                        }}
                        placeholder="-"
                      />
                    </label>
                    <label className="flex items-center gap-1 no-print">
                      <span>시드</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        defaultValue={expandedTeam.seedNumber ?? ""}
                        onBlur={(e) => {
                          const v = e.target.value ? Number(e.target.value) : null;
                          if (v !== (expandedTeam.seedNumber ?? null)) updateSeed(expandedTeam.id, v);
                        }}
                        className="w-14 rounded-[8px] border px-2 py-0.5 text-xs focus:outline-none focus:ring-1"
                        style={{
                          borderColor: "var(--color-border)",
                          background: "var(--color-card)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </label>
                  </div>
                  {/* 5. 토큰 만료일 + 마지막 갱신 시각 + Phase 4-B 재발급 버튼 */}
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    {token?.applyTokenExpiresAt && (
                      <span>
                        토큰 만료: {new Date(token.applyTokenExpiresAt).toLocaleDateString("ko-KR")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => reissueToken(expandedTeam.id)}
                      className="no-print inline-flex items-center gap-0.5 underline decoration-dotted underline-offset-2"
                      style={{ color: "var(--color-info)" }}
                      title="토큰 재발급"
                    >
                      <Icon name="refresh-cw" size={12} />
                      재발급
                    </button>
                    {token?.updatedAt && (
                      <span>
                        {token.appliedVia === "coach_token" ? "코치 입력" : "마지막 갱신"}: {formatUpdatedAt(token.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 no-print sm:flex-shrink-0">
                  {/* 1. URL 복사 버튼 */}
                  {token?.applyTokenUrl && (
                    <button
                      type="button"
                      onClick={() => copyTokenUrl(token.applyTokenUrl)}
                      className="btn btn--sm"
                      title={`토큰 만료: ${token.applyTokenExpiresAt ? new Date(token.applyTokenExpiresAt).toLocaleDateString("ko-KR") : "-"}`}
                    >
                      <Icon name="copy" size={16} className="align-middle mr-1" />
                      링크 복사
                    </button>
                  )}
                  {/* 2. 승인 / 거절 액션 (status 분기) */}
                  {expandedTeam.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatus(expandedTeam.id, "approved")}
                        disabled={actionLoading === expandedTeam.id}
                        className="btn btn--sm"
                        style={{ background: "var(--color-success)", color: "white", borderColor: "var(--color-success)" }}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(expandedTeam.id, "rejected")}
                        disabled={actionLoading === expandedTeam.id}
                        className="btn btn--sm"
                        style={{ background: "var(--color-error)", color: "white", borderColor: "var(--color-error)" }}
                      >
                        거절
                      </button>
                    </>
                  )}
                  {expandedTeam.status === "approved" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(expandedTeam.id, "rejected")}
                      disabled={actionLoading === expandedTeam.id}
                      className="btn btn--sm"
                      style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}
                    >
                      거절로 변경
                    </button>
                  )}
                  {expandedTeam.status === "rejected" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(expandedTeam.id, "approved")}
                      disabled={actionLoading === expandedTeam.id}
                      className="btn btn--sm"
                      style={{ color: "var(--color-success)", borderColor: "var(--color-success)" }}
                    >
                      승인으로 변경
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn--sm"
                    title="선수 명단 프린트"
                  >
                    <Icon name="printer" size={16} className="align-middle mr-1" />
                    프린트
                  </button>
                  {/* 닫기 X 버튼은 모달 우상단 absolute 로 이동 (위 button.absolute.right-3.top-3) */}
                </div>
              </div>

              {/* 선수 명단 헤더 + 4. 진행률 (rosterMin/Max 대비) */}
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">선수 명단 ({players.length}명)</h3>
                  <RosterProgressBadge
                    count={players.length}
                    min={rosterRule.min}
                    max={rosterRule.max}
                  />
                </div>
                <div className="flex flex-wrap gap-2 no-print">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="btn btn--sm"
                    title="카톡 명단 텍스트 일괄 입력"
                  >
                    <Icon name="clipboard-paste" size={16} className="align-middle mr-1" />
                    일괄 입력
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn--primary btn--sm"
                  >
                    <Icon name="user-plus" size={16} className="align-middle mr-1" />
                    선수 추가
                  </button>
                </div>
              </div>

              {/* 선수 추가 폼 */}
              {showAddForm && (
                <div className="mb-4 rounded-[16px] bg-[var(--grey-50)] p-4 no-print">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                      type="text"
                      placeholder="이름 *"
                      value={addForm.player_name}
                      onChange={(e) => setAddForm({ ...addForm, player_name: e.target.value })}
                      className="ts-input"
                    />
                    <input
                      type="text"
                      placeholder="전화번호"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      className="ts-input"
                    />
                    <input
                      type="number"
                      placeholder="등번호"
                      value={addForm.jersey_number}
                      onChange={(e) => setAddForm({ ...addForm, jersey_number: e.target.value })}
                      className="ts-input"
                    />
                    <input
                      type="text"
                      placeholder="포지션"
                      value={addForm.position}
                      onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                      className="ts-input"
                    />
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }}
                      className="btn btn--sm"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleAddPlayer}
                      disabled={addLoading || !addForm.player_name.trim()}
                      className="btn btn--primary btn--sm"
                    >
                      {addLoading ? "추가 중..." : "추가"}
                    </button>
                  </div>
                </div>
              )}

              {/* 선수 명단 테이블 */}
              {playersLoading ? (
                <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">불러오는 중...</p>
              ) : players.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">등록된 선수가 없습니다.</p>
              ) : (
                <>
                <div className="space-y-2 sm:hidden">
                  {players.map((p) => (
                    <div key={p.id} className="rounded-[16px] bg-[var(--grey-50)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--ink)]">
                            {p.jersey_number ? `${p.jersey_number}번 · ` : ""}{p.player_name ?? "-"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--ink-mute)]">
                            {(p as { birth_date?: string }).birth_date ?? "-"} · {(p as { school_name?: string }).school_name ?? "-"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--ink-mute)]">
                            보호자 {(p as { parent_name?: string }).parent_name ?? "-"} · {(p as { parent_phone?: string }).parent_phone ?? p.phone ?? "-"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePlayer(p.id)}
                          className="ct-iconbtn no-print"
                          title="선수 삭제"
                        >
                          <Icon name="trash-2" size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                        <th className="pb-2 pr-3">#</th>
                        <th className="pb-2 pr-3">이름</th>
                        <th className="pb-2 pr-3">생년월일</th>
                        <th className="pb-2 pr-3">학교</th>
                        <th className="pb-2 pr-3">포지션</th>
                        <th className="pb-2 pr-3">학부모</th>
                        <th className="pb-2 pr-3 no-print">연락처</th>
                        <th className="pb-2 no-print" />
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p) => (
                        <tr key={p.id} className="border-b border-[var(--color-border)]/50">
                          <td className="py-2 pr-3 text-[var(--color-text-muted)]">{p.jersey_number ?? "-"}</td>
                          <td className="py-2 pr-3 font-medium">{p.player_name ?? "-"}</td>
                          <td className="py-2 pr-3 text-[var(--color-text-muted)]">{(p as { birth_date?: string }).birth_date ?? "-"}</td>
                          <td className="py-2 pr-3 text-[var(--color-text-muted)]">{(p as { school_name?: string }).school_name ?? "-"}</td>
                          <td className="py-2 pr-3 text-[var(--color-text-muted)]">{p.position ?? "-"}</td>
                          <td className="py-2 pr-3 text-[var(--color-text-muted)]">{(p as { parent_name?: string }).parent_name ?? "-"}</td>
                          <td className="py-2 pr-3 text-[var(--color-text-muted)] no-print">
                            {(p as { parent_phone?: string }).parent_phone ?? p.phone ?? "-"}
                          </td>
                          <td className="py-2 text-right no-print">
                            <button
                              onClick={() => handleDeletePlayer(p.id)}
                              className="ct-iconbtn"
                              title="선수 삭제"
                            >
                              <Icon name="trash-2" size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}

              {/* 프린트 푸터 — 프린트 시에만 표시 */}
              <p className="mt-4 hidden text-xs text-[var(--color-text-muted)] print-only">
                ※ 본 명단은 운영자 어드민 (mybdr.kr) 에서 출력되었습니다. 출력일: {new Date().toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>
        );
      })()}

      {/* 프린트 전용 CSS — 모달만 표시 + 페이지 나머지 hide */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #team-detail-printable, #team-detail-printable * { visibility: visible; }
          #team-detail-printable { position: absolute; top: 0; left: 0; width: 100%; box-shadow: none; border: none; padding: 0; margin: 0; background: white; color: black; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      {/* 2026-05-16 PR-Admin-1 — 단계간 CTA (admin-flow-audit §3 단계 4 단절 해소) */}
      <NextStepCTA tournamentId={id} currentStep="teams" />
    </div>
  );
}

/* ============================================================
 * 2026-05-12 Phase 4-B (옵션 B 4번) — 선수 일괄 import 모달
 * - 카톡 명단 텍스트 붙여넣기 → 파싱 → 미리보기 → POST API
 * - 형식: 이름/생년월일/등번호/포지션/학교명/부모님성함/부모님연락처 (Phase 3-A 동일)
 * - overwrite 옵션 (기존 명단 삭제 후 INSERT)
 * ============================================================ */
function ImportPlayersModal({
  tournamentId,
  ttId,
  onClose,
  onSuccess,
}: {
  tournamentId: string;
  ttId: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [text, setText] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [strict, setStrict] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // 카톡 텍스트 파싱 (Phase 3-A team-apply-form 와 동일 형식)
  const parsePlayers = (raw: string) => {
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return { players: [], errors: ["붙여넣을 명단이 없습니다."] };
    const players: Array<Record<string, string | number | null>> = [];
    const errors: string[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split("/").map((s) => s.trim());
      if (parts.length < 2) {
        errors.push(`${idx + 1}줄: 형식 오류 (최소 이름/생년월일)`);
        return;
      }
      const [name, birth, jersey, position, school, parentName, parentPhone] = parts;
      // 생년월일 normalize
      const m = birth.match(/^(\d{4})[-./]?(\d{1,2})[-./]?(\d{1,2})$/);
      if (!m) {
        errors.push(`${idx + 1}줄 (${name}): 생년월일 형식 오류 "${birth}"`);
        return;
      }
      const normBirth = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
      // 연락처 normalize
      const phoneDigits = (parentPhone ?? "").replace(/\D/g, "");
      const normPhone =
        phoneDigits.length === 11
          ? `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 7)}-${phoneDigits.slice(7)}`
          : null;
      players.push({
        player_name: name,
        birth_date: normBirth,
        jersey_number: jersey ? Number(jersey) : null,
        position: position || null,
        school_name: school || null,
        parent_name: parentName || null,
        parent_phone: normPhone,
      });
    });
    return { players, errors };
  };

  const submit = async () => {
    setError(null);
    setParseError(null);
    const { players, errors } = parsePlayers(text);
    if (errors.length > 0) {
      setParseError(errors.join("\n"));
      return;
    }
    if (players.length === 0) {
      setParseError("파싱된 선수가 없습니다.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/web/admin/tournaments/${tournamentId}/teams/${ttId}/import-players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players, overwrite, strictDivisionRule: strict }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "DIVISION_VALIDATION_FAILED" && Array.isArray(json.errors)) {
          setError(`종별 검증 실패:\n${json.errors.map((e: { index: number; message: string }) => `${e.index + 1}번: ${e.message}`).join("\n")}`);
        } else {
          setError(json.error ?? "입력 실패");
        }
        setSubmitting(false);
        return;
      }
      const warningNote = Array.isArray(json.warnings) && json.warnings.length > 0
        ? ` (경고 ${json.warnings.length}건)` : "";
      onSuccess(`${json.inserted_count}명 입력${overwrite ? ` / ${json.deleted_count}명 삭제` : ""}${warningNote}`);
    } catch {
      setError("네트워크 오류");
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 no-print sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-[24px] border bg-[var(--card)] p-4 shadow-[var(--sh-lg)] sm:p-6"
        style={{ borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="ct-iconbtn absolute right-3 top-3"
          aria-label="닫기"
        >
          <Icon name="x" size={20} />
        </button>
        <h2 className="mb-4 text-lg font-bold">선수 일괄 입력</h2>
        <p className="mb-3 text-xs" style={{ color: "var(--ink-mute)" }}>
          한 줄에 한 명씩 입력합니다. 순서: 이름/생년월일/등번호/포지션/학교명/보호자/연락처
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={"홍길동/2017-05-16/7/가드/강남초등학교/홍판서/010-1234-5678\n김철수/2017.8.22/12/포워드/잠실초등학교/김보호자/010-9876-5432"}
          className="ts-input min-h-[220px] font-mono text-sm"
        />
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            <span>기존 명단 전체 삭제 후 입력</span>
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
            <span>종별 규칙 엄격 검증</span>
          </label>
        </div>
        {parseError && (
          <p className="mt-3 whitespace-pre-line text-xs" style={{ color: "var(--color-warning)" }}>
            {parseError}
          </p>
        )}
        {error && (
          <p className="mt-3 whitespace-pre-line text-sm" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="btn btn--sm">
            취소
          </button>
          <button type="button" onClick={submit} disabled={submitting || !text.trim()} className="btn btn--primary btn--sm">
            {submitting ? "처리 중..." : "일괄 입력 실행"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 2026-05-11 Phase 2-C 후속: AddTeamTokenModal 컴포넌트 제거.
//   - 강남구 36팀 일괄 INSERT 스크립트로 박제 완료 → 운영자 페이지 단건 발급 빈도 0.
//   - POST /api/web/admin/tournaments/[id]/team-applications endpoint 는 그대로 보존
//     (향후 비상 단건 케이스 또는 다른 운영 흐름에서 진입점 재추가 가능).

/* ============================================================
 * 2026-05-11 Phase 3-D — 등록 경로/상태/통계 배지 헬퍼
 * ============================================================ */

// 등록 경로 배지 — applied_via 값별 색상/라벨
function ViaBadge({ appliedVia }: { appliedVia: string | null }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    admin: { label: "운영자", bg: "var(--color-elevated)", fg: "var(--color-text-secondary)" },
    coach_token: { label: "코치", bg: "color-mix(in srgb, var(--color-info) 15%, transparent)", fg: "var(--color-info)" },
    self: { label: "본인", bg: "color-mix(in srgb, var(--color-success) 15%, transparent)", fg: "var(--color-success)" },
  };
  if (!appliedVia || !map[appliedVia]) {
    return (
      <span
        className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium"
        style={{ background: "var(--color-elevated)", color: "var(--color-text-muted)" }}
      >
        경로 미상
      </span>
    );
  }
  const cfg = map[appliedVia];
  return (
    <span
      className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
}

// 상태 배지 — status 값별 색상/라벨
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    pending: {
      label: "대기 중",
      bg: "color-mix(in srgb, var(--color-warning) 15%, transparent)",
      fg: "var(--color-warning)",
    },
    approved: {
      label: "승인",
      bg: "color-mix(in srgb, var(--color-success) 15%, transparent)",
      fg: "var(--color-success)",
    },
    rejected: {
      label: "거절",
      bg: "color-mix(in srgb, var(--color-error) 15%, transparent)",
      fg: "var(--color-error)",
    },
    waiting: {
      label: "대기접수",
      bg: "color-mix(in srgb, var(--color-info) 15%, transparent)",
      fg: "var(--color-info)",
    },
  };
  const cfg = map[status] ?? {
    label: status,
    bg: "var(--color-elevated)",
    fg: "var(--color-text-muted)",
  };
  return (
    <span
      className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
}

// 2026-05-11 Phase 3-F 옵션 A — 납부 상태 배지
function PaymentBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    paid: {
      label: "납부",
      bg: "color-mix(in srgb, var(--color-success) 15%, transparent)",
      fg: "var(--color-success)",
    },
    unpaid: {
      label: "미납",
      bg: "color-mix(in srgb, var(--color-warning) 15%, transparent)",
      fg: "var(--color-warning)",
    },
    waived: {
      label: "면제",
      bg: "color-mix(in srgb, var(--color-info) 15%, transparent)",
      fg: "var(--color-info)",
    },
    refunded: {
      label: "환불",
      bg: "var(--color-elevated)",
      fg: "var(--color-text-muted)",
    },
  };
  if (!status || !map[status]) return null;
  const cfg = map[status];
  return (
    <span
      className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
}

// 진행률 배지 — players.length vs roster_min/max
function RosterProgressBadge({
  count,
  min,
  max,
}: {
  count: number;
  min: number | null;
  max: number | null;
}) {
  if (min == null && max == null) return null;
  // 상태 분기: 부족 / 충족 / 초과
  let label: string;
  let color: string;
  if (min != null && count < min) {
    label = `${count} / ${min} 이상`;
    color = "var(--color-warning)";
  } else if (max != null && count > max) {
    label = `${count} / ${max} 초과`;
    color = "var(--color-error)";
  } else {
    label = `${count}${max ? ` / ${max}` : ""}`;
    color = "var(--color-success)";
  }
  return (
    <span
      className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium"
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}

// 마지막 갱신 시각 — 상대 시간 또는 절대 (1일 이상 = 절대)
function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return d.toLocaleDateString("ko-KR");
}

// 등록 경로 통계 카드 — accent 톤 단일 (conventions.md "admin 빨간색 본문 금지" 준수)
function ViaStatCard({ label, count, icon }: { label: string; count: number; icon: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[16px] border p-3"
      style={{ borderColor: "var(--border)", background: "var(--grey-50)" }}
    >
      <Icon name={icon} size={24} color="var(--color-accent)" />
      <div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
        <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
          {count}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
 * 2026-05-11 Phase 3-C — 토큰 발송 도구 (CSV 다운로드 + 카톡 메시지 일괄 복사)
 *
 * 자동 SMS 발송은 별 PR (채널 결정 필요 — 솔라피/알리고/카카오 비즈).
 * 본 fix = 즉시 가능한 빠른 옵션:
 *   - CSV 다운로드 → 엑셀로 열어 데이터 확인 + 일괄 카톡 발송 보조
 *   - 카톡 메시지 일괄 복사 → 클립보드에 팀별 안내문 일괄 → 단톡방 붙여넣기
 * ============================================================ */

// alive 토큰 수 (UI 버튼 disabled 가드용)
function aliveTokenCount(tokenMap: Record<string, TokenInfo>): number {
  return Object.values(tokenMap).filter((t) => !!t.applyTokenUrl).length;
}

// CSV 다운로드 — 운영자가 엑셀로 열어 검토 가능
function downloadTokenCsv(
  teams: TournamentTeam[],
  tokenMap: Record<string, TokenInfo>,
): void {
  // UTF-8 BOM 추가 (엑셀 한글 깨짐 회피 — Windows 표준)
  const BOM = "﻿";
  const header = "팀명,코치명,코치번호,토큰 URL,만료";
  const lines = [header];
  for (const tt of teams) {
    const token = tokenMap[tt.id];
    if (!token?.applyTokenUrl) continue;
    const expiry = token.applyTokenExpiresAt
      ? new Date(token.applyTokenExpiresAt).toLocaleDateString("ko-KR")
      : "";
    // CSV escape — 컴마/따옴표 포함 시 큰따옴표로 감싸고 내부 따옴표는 ""
    const cells = [
      tt.team.name,
      token.managerName ?? "",
      token.managerPhone ?? "",
      token.applyTokenUrl,
      expiry,
    ].map((c) => {
      const s = String(c);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    });
    lines.push(cells.join(","));
  }
  const csv = BOM + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `team-tokens-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 2026-05-16 PR-Admin-2 — Phase 3-B `advancePlaceholders` 헬퍼는 matches 페이지의
// AdvancePlayoffsButton 컴포넌트로 이동 + 흡수됨 (modal UI 포함 / load() refetch trigger).
// teams 페이지 헤더 버튼 제거에 따라 본 헬퍼도 deadcode → 제거.

// 카톡 메시지 일괄 복사 — 클립보드에 팀별 안내문 합쳐서 복사
function copyAllTokenMessages(
  teams: TournamentTeam[],
  tokenMap: Record<string, TokenInfo>,
  toast: (msg: string) => void,
): void {
  const blocks: string[] = [];
  for (const tt of teams) {
    const token = tokenMap[tt.id];
    if (!token?.applyTokenUrl) continue;
    const managerName = token.managerName ? `${token.managerName} 코치님` : `${tt.team.name} 코치님`;
    blocks.push(
      `[${tt.team.name}]\n` +
      `안녕하세요, ${managerName}.\n` +
      `참가팀 명단 입력 링크입니다.\n` +
      `${token.applyTokenUrl}\n` +
      `※ 링크는 일회용입니다. 한 번에 모든 선수 명단을 입력해주세요.`,
    );
  }
  if (blocks.length === 0) {
    toast("발송 가능한 토큰이 없습니다.");
    return;
  }
  const text = blocks.join("\n\n────────\n\n");
  navigator.clipboard
    .writeText(text)
    .then(() => toast(`${blocks.length}팀 메시지 복사 완료 — 단톡방에 붙여넣기`))
    .catch(() => toast("복사에 실패했습니다. 토큰 파일 받기를 사용하세요."));
}

````

### File: src/components/admin/sidebar.tsx

````tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
// 2026-05-02 (Admin-Web 시각 통합 v2 Phase 3) — admin 영역에서도 라이트/다크 토글 가능하도록 (web)와 같은 ThemeSwitch 마운트
import { ThemeSwitch } from "@/components/bdr-v2/theme-switch";
// Phase 1 (Toss 전환) — Material Symbols → lucide-react. kit Icon 경유(kebab name).
import { Icon } from "@/components/admin-toss";

// Phase 1 — Material Symbols 아이콘명 → lucide kebab 아이콘명 매핑.
//   navStructure 의 icon 값(Material 명)을 1:1 로 lucide 명으로 바꿔 <Icon> 에 넘긴다.
//   메뉴 정의(navStructure)는 그대로 두고 렌더 시점에만 변환 → 라우팅/구조 불변.
const SIDEBAR_ICON: Record<string, string> = {
  dashboard: "layout-dashboard",
  emoji_events: "trophy",
  manage_accounts: "user-cog",
  sports_basketball: "volleyball", // lucide 에 basketball/dribbble 부재 → 구기 아이콘 volleyball 로 대체
  groups: "users",
  location_on: "map-pin",
  forum: "message-square",
  newspaper: "newspaper",
  group: "users",
  report: "flag",
  lightbulb: "lightbulb",
  payments: "credit-card",
  credit_card: "credit-card",
  campaign: "megaphone",
  handshake: "handshake",
  analytics: "bar-chart-3",
  settings: "settings",
  // A1 IA 재편 — 시스템 그룹 "알림" 항목 아이콘 (Material notifications → lucide bell)
  notifications: "bell",
  bot: "bot",
  // Track B 종별 관리 — 그리드형 카테고리 뷰 아이콘
  grid_view: "layout-grid",
  add_circle: "circle-plus",
  list_alt: "list",
  storefront: "store",
  account_circle: "circle-user",
  arrow_back: "arrow-left",
};

// Material 명을 받아 lucide kebab 명으로 변환(미정의 시 원본 그대로 — Icon 이 빈 span 방어).
//   mobile-admin-nav 도 동일 변환을 쓰도록 export (메뉴 아이콘 일관성).
export function toLucide(name: string): string {
  return SIDEBAR_ICON[name] ?? name;
}

// 권한별 메뉴 접근 정의
// "all" = 모든 관리자 권한에서 노출
export type AdminRole =
  | "super_admin"
  | "site_admin"
  | "tournament_admin"
  | "partner_member"
  | "org_member";

export interface AdminNavItem {
  type: "item";
  href: string;
  hrefByRole?: Partial<Record<AdminRole, string>>;
  label: string;
  icon: string;
  roles: AdminRole[] | "all"; // 어떤 역할이 이 메뉴를 볼 수 있는지
  // 2026-05-04: 하위 메뉴 (예: 커뮤니티 → BDR NEWS)
  children?: AdminNavItem[];
}

export interface AdminNavGroup {
  type: "group";
  label: string; // 그룹 헤더 (시각적 구분용, 클릭 X)
  items: AdminNavItem[];
}

export type AdminNavEntry = AdminNavItem | AdminNavGroup;

// 2026-05-04: 메뉴 그룹화 — 18개 평면 → 6개 그룹 (사용자 요청)
// 2026-06-22: v2.40 통합 콘솔 Phase A1 — 6그룹 → 1단독 + 4그룹 IA 재편 (시안 방향)
//   변경 = "그룹 배치·라벨"만. 각 항목의 href / roles / children 은 100% 보존(라우트·권한 0 변경).
//   ┌ (단독) 대시보드
//   ├ 운영           : 대회 / 경기 / 팀 / 단체 / 코트
//   ├ 사용자·커뮤니티 : 유저 / 커뮤니티(+BDR NEWS) / 시즌 시상 / 신고 검토 / 건의사항
//   ├ 비즈니스       : 결제 / 요금제 / 광고 캠페인 / 파트너
//   ├ 시스템         : 분석 / 종별 / 알림 / 활동 로그 / 시스템 설정
//   └ (4그룹 밖) 외부 관리 : 협력업체 (별도 권한 partner_member)
//   흡수/이동: 시즌 시상·신고 검토 → 사용자·커뮤니티 / 단체·알림 = 라우트 존재했으나 메뉴 누락분 명시 추가.
//   BDR NEWS = 독립 항목 아님 → 커뮤니티 하위 sub-item 으로 유지(기존 그대로).
export const navStructure: AdminNavEntry[] = [
  // 대시보드 (단독 항목 — 그룹 헤더 없음)
  { type: "item", href: "/admin", label: "대시보드", icon: "dashboard", roles: "all" },

  // 그룹: 운영 — 대회 흐름 핵심 엔티티 (대회/경기/팀/단체/코트)
  {
    type: "group",
    label: "운영",
    items: [
      {
        type: "item",
        href: "/admin/tournaments",
        hrefByRole: { tournament_admin: "/tournament-admin/tournaments" },
        // 2026-05-04: "토너먼트" → "대회 관리" 통일 (사용자 요청).
        label: "대회 관리",
        icon: "emoji_events",
        roles: ["super_admin", "site_admin", "tournament_admin"],
      },
      { type: "item", href: "/admin/games", label: "경기 관리", icon: "sports_basketball", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/teams", label: "팀 관리", icon: "groups", roles: ["super_admin", "site_admin"] },
      // A1 — 단체 관리(/admin/organizations) 명시 추가 (라우트 기존 존재·메뉴 누락분).
      //   다른 운영 항목과 동일 권한(super_admin·site_admin).
      { type: "item", href: "/admin/organizations", label: "단체 관리", icon: "group", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/courts", label: "코트 관리", icon: "location_on", roles: ["super_admin", "site_admin"] },
    ],
  },

  // 그룹: 사용자·커뮤니티 — 유저 + 커뮤니티 콘텐츠 + 시상/신고/건의
  {
    type: "group",
    label: "사용자·커뮤니티",
    items: [
      { type: "item", href: "/admin/users", label: "유저 관리", icon: "group", roles: ["super_admin", "site_admin"] },
      {
        type: "item",
        href: "/admin/community",
        label: "커뮤니티",
        icon: "forum",
        roles: ["super_admin", "site_admin"],
        children: [
          // 2026-05-04: 알기자 (BDR NEWS) 검수 페이지를 커뮤니티 하위로 (사용자 요청)
          //   A1 — BDR NEWS 독립 항목 제거 방침에 부합(이미 커뮤니티 sub-item).
          {
            type: "item",
            href: "/admin/news",
            label: "BDR NEWS",
            icon: "newspaper",
            roles: ["super_admin", "site_admin"],
          },
        ],
      },
      // 시즌 시상(P1-b) — super_admin 직접 입력(올스타/감독/MVP코멘트/수비/매너 등)
      //   A1 — 콘텐츠 그룹 → 사용자·커뮤니티 그룹 이동(권한·href 동일).
      { type: "item", href: "/admin/season-awards", label: "시즌 시상", icon: "emoji_events", roles: ["super_admin"] },
      // A1 — 신고 검토(game-reports) → 사용자·커뮤니티 그룹 이동(권한·href 동일).
      { type: "item", href: "/admin/game-reports", label: "신고 검토", icon: "report", roles: ["super_admin"] },
      { type: "item", href: "/admin/suggestions", label: "건의사항", icon: "lightbulb", roles: ["super_admin"] },
    ],
  },

  // 그룹: 비즈니스 — 결제·요금제·광고·파트너
  {
    type: "group",
    label: "비즈니스",
    items: [
      { type: "item", href: "/admin/payments", label: "결제", icon: "credit_card", roles: ["super_admin"] },
      { type: "item", href: "/admin/plans", label: "요금제 관리", icon: "payments", roles: ["super_admin"] },
      { type: "item", href: "/admin/campaigns", label: "광고 캠페인", icon: "campaign", roles: ["super_admin", "partner_member"] },
      { type: "item", href: "/admin/partners", label: "파트너 관리", icon: "handshake", roles: ["super_admin"] },
    ],
  },

  // 그룹: 시스템 — 분석·종별·알림·로그·설정
  {
    type: "group",
    label: "시스템",
    items: [
      { type: "item", href: "/admin/analytics", label: "분석", icon: "analytics", roles: ["super_admin", "site_admin"] },
      // Track B 종별 마스터(/admin/categories) — super_admin 전용 (시스템 설정과 동일 가드)
      { type: "item", href: "/admin/categories", label: "종별 관리", icon: "grid_view", roles: ["super_admin"] },
      // A1 — 알림(/admin/notifications) 명시 추가 (라우트 기존 존재·메뉴 누락분). 발송 = super_admin 전용.
      { type: "item", href: "/admin/notifications", label: "알림", icon: "notifications", roles: ["super_admin"] },
      { type: "item", href: "/admin/agents", label: "에이전트", icon: "bot", roles: ["super_admin"] },
      { type: "item", href: "/admin/logs", label: "활동 로그", icon: "list_alt", roles: ["super_admin"] },
      { type: "item", href: "/admin/settings", label: "시스템 설정", icon: "settings", roles: ["super_admin"] },
    ],
  },

  // 그룹: 외부 관리 (별도 권한 — partner_member). 본 콘솔 4그룹 IA 밖 별도 항목.
  // 2026-06-24: tournament_admin 진입점은 별도 "대회 운영자 도구" 없이
  // "운영 > 대회 관리"에서 권한 있는 대회 목록으로 바로 진입.
  {
    type: "group",
    label: "외부 관리",
    items: [
      { type: "item", href: "/partner-admin", label: "협력업체 관리", icon: "storefront", roles: ["partner_member"] },
    ],
  },
];

// 역할 필터 — children 도 같이 필터링 (재귀)
// 2026-05-14 fix: parent self-blocked + child visible 케이스 누락 방지.
// 2026-06-24: hrefByRole 이 있으면 일반 운영자처럼 같은 메뉴명에 다른 랜딩이 필요한
//   케이스만 role-aware href 로 치환한다. super/site admin 은 전역 admin href 를 유지한다.
function filterItemByRoles(item: AdminNavItem, roles: AdminRole[]): AdminNavItem | null {
  // 1) children 을 먼저 재귀 필터 (parent 가시성 판단에 사용)
  const filteredChildren = item.children
    ?.map((c) => filterItemByRoles(c, roles))
    .filter((c): c is AdminNavItem => c !== null);
  const hasVisibleChildren = !!filteredChildren && filteredChildren.length > 0;

  // 2) self 가시성
  const selfVisible =
    item.roles === "all" || roles.some((r) => item.roles.includes(r));

  // 3) self / children 모두 차단 → 항목 제거 (기존 동작)
  if (!selfVisible && !hasVisibleChildren) return null;

  const hasGlobalAdminAccess = roles.includes("super_admin") || roles.includes("site_admin");
  const roleHref = hasGlobalAdminAccess
    ? null
    : roles.map((role) => item.hrefByRole?.[role]).find((href): href is string => !!href);

  // 4) self 차단 + child 노출 → parent href 를 child 첫 href 로 rewrite
  //    (UX: parent label/icon 유지 + click 시 권한 있는 child 페이지로 자연 진입)
  const effectiveHref =
    !selfVisible && hasVisibleChildren ? filteredChildren![0].href : roleHref ?? item.href;

  return { ...item, href: effectiveHref, children: filteredChildren };
}

// 2026-05-04: 그룹화된 구조에서 역할별 필터 (mobile-admin-nav 도 사용)
export function filterStructureByRoles(roles: AdminRole[]): AdminNavEntry[] {
  return navStructure
    .map((entry) => {
      if (entry.type === "item") {
        return filterItemByRoles(entry, roles);
      }
      // group: items 필터 후 빈 그룹은 제외
      const items = entry.items
        .map((it) => filterItemByRoles(it, roles))
        .filter((it): it is AdminNavItem => it !== null);
      if (items.length === 0) return null;
      return { ...entry, items };
    })
    .filter((e): e is AdminNavEntry => e !== null);
}

interface AdminSidebarProps {
  // 이 유저가 가진 관리 역할들 (복수 가능)
  roles: AdminRole[];
}

// 메뉴 항목 1개 렌더링 (children 들여쓰기 포함)
// 2026-05-04: (web) community-aside 패턴 (.aside__link + data-active) 적용 — 시각 통일
function renderItem(item: AdminNavItem, pathname: string, depth = 0) {
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);
  const indentStyle = depth > 0 ? { paddingLeft: 28 } : undefined;
  return (
    <div key={item.href}>
      <Link
        href={item.href}
        className="aside__link"
        data-active={isActive}
        style={indentStyle}
      >
        <span>
          {/* Phase 1 — Material Symbols → lucide(<Icon>). 메뉴 정의는 Material 명 유지, 렌더 시 변환 */}
          <Icon name={toLucide(item.icon)} size={18} />
          {item.label}
        </span>
      </Link>
      {/* children — 들여쓰기 (28px), 항상 노출 */}
      {item.children && item.children.length > 0 && (
        <div>
          {item.children.map((child) => renderItem(child, pathname, depth + 1))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebar({ roles }: AdminSidebarProps) {
  const pathname = usePathname();

  // 유저 역할에 맞는 메뉴만 필터링 (그룹 구조)
  const visibleStructure = filterStructureByRoles(roles);

  return (
    // 사이드바: CSS 변수 기반 배경/보더 (다크모드 자동 전환)
    // 2026-05-04: overflow-y-auto + flex-1 nav 로 메뉴 많아도 스크롤 가능 (사용자 요청)
    // Phase 1 — 셸 크롬(사이드바)에만 data-skin="toss" opt-in (공유 .admin-shell/.admin-main 엔 금지)
    <aside data-skin="toss" className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:flex">
      {/* 로고: BDR 이미지 + ADMIN 배지 */}
      <Link href="/admin" className="mb-6 flex items-center gap-3 px-3 shrink-0">
        <Image src="/images/logo.png" alt="BDR" width={120} height={36} className="h-9 w-auto" />
        <span className="rounded bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
          Admin
        </span>
      </Link>

      {/* 내비게이션 메뉴 — 그룹화 + 스크롤 가능
          2026-05-04: (web) community-aside 패턴 (.aside__title + .aside__link) 적용 */}
      <nav className="flex-1 overflow-y-auto pr-1 -mr-1">
        {visibleStructure.map((entry, idx) => {
          if (entry.type === "item") {
            return renderItem(entry, pathname);
          }
          // 그룹 — .aside__title 헤더 + items (community-aside 와 동일 클래스)
          return (
            <div key={`group-${idx}`}>
              <div className="aside__title">{entry.label}</div>
              {entry.items.map((item) => renderItem(item, pathname))}
            </div>
          );
        })}
      </nav>

      {/* 하단: 테마 토글 + 마이페이지 + 사이트로 돌아가기 */}
      {/* 2026-05-11 admin 마이페이지 Phase 1 — "마이페이지" 1줄 추가 (사이트로 돌아가기 위) */}
      <div className="mt-3 border-t border-[var(--color-border)] pt-3 shrink-0">
        {/* 테마 토글 — (web) AppNav 와 동일 컴포넌트 (라이트/다크 듀얼 라벨, theme-preference localStorage 키) */}
        <div className="px-3 pb-2">
          <ThemeSwitch />
        </div>
        {/* 마이페이지 — 사용자 결재 §7 (사이트로 돌아가기 위 / 가장 자연) */}
        <Link
          href="/admin/me"
          className="aside__link"
          data-active={pathname === "/admin/me" || pathname.startsWith("/admin/me/")}
        >
          <span>
            <Icon name="circle-user" size={18} />
            마이페이지
          </span>
        </Link>
        <Link href="/" className="aside__link">
          <span>
            <Icon name="arrow-left" size={18} />
            사이트로 돌아가기
          </span>
        </Link>
      </div>
    </aside>
  );
}

````

### File: src/components/admin/mobile-admin-nav.tsx

````tsx
"use client";

/* ============================================================
 * AdminMobileNav — 모바일 햄버거 + 드로어 (Admin-2 박제 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin.jsx (AdminMobileNav)
 * 박제 target: src/components/admin/mobile-admin-nav.tsx
 *
 * 이유 (왜):
 *   - 시안 v2.14 의 `.admin-mobile-toggle / .admin-mobile-overlay /
 *     .admin-mobile-drawer*` 시각 박제. (web) AppNav 와 일관된
 *     우측 슬라이드 드로어 + admin 영역 다크 토큰 자동 처리.
 *   - **props 시그니처 100% 보존** — `roles, user` 그대로. 호출처 0건 회귀.
 *   - ESC / 외부 클릭 / 라우트 이동 자동 닫힘 / body 스크롤 잠금 보존.
 *
 * 어떻게:
 *   1. 햄버거 = `.admin-mobile-toggle` (admin.css 가 모바일 fixed top-left 박제).
 *   2. 오버레이 = `.admin-mobile-overlay [data-open]` (시안 패턴 그대로).
 *   3. 드로어 = `.admin-mobile-drawer [data-open]` (우측 슬라이드).
 *   4. 메뉴 = `.admin-aside__link [data-active] [data-child]` (사이드바와 동일 클래스).
 * ============================================================ */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  filterStructureByRoles,
  toLucide,
  type AdminRole,
  type AdminNavItem,
} from "./sidebar";
// Phase 1 (Toss 전환) — Material Symbols → lucide-react (kit Icon, kebab name)
import { Icon } from "@/components/admin-toss";
// 2026-05-02 (Admin-Web 시각 통합 v2 Phase 3) — 모바일 admin 드로어에서도 테마 토글 가능
import { ThemeSwitch } from "@/components/bdr-v2/theme-switch";
// 2026-05-11 admin 마이페이지 Phase 1 — 드로어 상단 사용자 카드 + 로그아웃 통합
import { LogoutButton } from "@/app/(admin)/admin/_components/logout-button";

interface Props {
  roles: AdminRole[];
  scope?: "default" | "tournament";
  // 2026-05-11: 드로어 상단 사용자 카드용 — layout 에서 prop 전달
  user?: {
    nickname: string | null;
    email: string;
  };
}

// 이니셜 추출 (드로어 상단 아바타용)
function getInitial(nickname: string | null, email: string): string {
  const source = nickname?.trim() || email;
  return (source[0] ?? "?").toUpperCase();
}

// 메뉴 항목 1개 렌더링 (children 들여쓰기 + 클릭 시 드로어 닫기)
// 2026-05-15 Admin-2: 시안 `.admin-aside__link` 박제 클래스 사용 (사이드바와 동일)
function renderMobileItem(
  item: AdminNavItem,
  pathname: string,
  closeFn: () => void,
  isChild = false,
) {
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);
  return (
    <div key={item.href}>
      <Link
        href={item.href}
        onClick={closeFn}
        className="admin-aside__link"
        data-active={isActive ? "true" : "false"}
        data-child={isChild ? "true" : "false"}
      >
        {/* Phase 1 — Material Symbols → lucide(<Icon>). 메뉴 정의는 Material 명 유지, 렌더 시 변환 */}
        <Icon name={toLucide(item.icon)} size={18} />
        <span>{item.label}</span>
      </Link>
      {item.children && item.children.length > 0 && (
        <>
          {item.children.map((c) =>
            renderMobileItem(c, pathname, closeFn, true)
          )}
        </>
      )}
    </div>
  );
}

function getTournamentMobileStructure(): ReturnType<typeof filterStructureByRoles> {
  return [
    {
      type: "group",
      label: "대회 관리",
      items: [
        {
          type: "item",
          href: "/tournament-admin/tournaments",
          label: "내 대회",
          icon: "emoji_events",
          roles: "all",
        },
        {
          type: "item",
          href: "/tournament-admin/tournaments/new/wizard",
          label: "새 대회 만들기",
          icon: "add_circle",
          roles: "all",
        },
      ],
    },
  ];
}

export function AdminMobileNav({ roles, scope = "default", user }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // 드로어 상단 사용자 카드 표시용 (user prop 있을 때만)
  const displayName = user
    ? user.nickname?.trim() || user.email.split("@")[0]
    : null;
  const initial = user ? getInitial(user.nickname, user.email) : null;

  // tournament-admin 모바일은 실제 업무 진입점만 노출한다.
  const visibleStructure =
    scope === "tournament" ? getTournamentMobileStructure() : filterStructureByRoles(roles);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  // 페이지 이동 시 자동 닫힘
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // body 스크롤 잠금 (드로어 열림 시)
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  return (
    <>
      {/* 햄버거 버튼 — 시안 .admin-mobile-toggle (admin.css 모바일 fixed top-left)
          Phase 1 — 셸 크롬: data-skin="toss" opt-in */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="관리자 메뉴 열기"
        className="admin-mobile-toggle"
        data-skin="toss"
      >
        <Icon name="menu" size={22} />
      </button>

      {/* 오버레이 — 시안 .admin-mobile-overlay [data-open] (Phase 1: data-skin="toss") */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="admin-mobile-overlay"
        data-open={open ? "true" : "false"}
        data-skin="toss"
      />

      {/* 드로어 패널 — 시안 .admin-mobile-drawer [data-open] (우측 슬라이드)
          Phase 1 — 셸 크롬: data-skin="toss" opt-in */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="관리자 메뉴"
        className="admin-mobile-drawer"
        data-open={open ? "true" : "false"}
        data-skin="toss"
      >
        {/* 상단: 사용자 카드 + 닫기 — 시안 .admin-mobile-drawer__head */}
        <div className="admin-mobile-drawer__head">
          {user ? (
            <>
              <div className="admin-mobile-drawer__head-avatar">{initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="admin-mobile-drawer__head-name">{displayName}</div>
                <div className="admin-mobile-drawer__head-email">{user.email}</div>
              </div>
            </>
          ) : (
            // user 없으면 로고만 (시안 대체)
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
            >
              <Image
                src="/images/logo.png"
                alt="BDR"
                width={90}
                height={26}
                className="h-6 w-auto"
              />
              <span className="admin-aside__logo-badge">ADMIN</span>
            </Link>
          )}
          {/* 닫기 — 시안 .admin-detail-modal__close 재사용 (admin.css 정의) */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
            className="admin-detail-modal__close"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* 메뉴 — 시안 .admin-mobile-drawer__body */}
        <nav className="admin-mobile-drawer__body">
          {visibleStructure.map((entry, idx) => {
            if (entry.type === "item") {
              return (
                <div key={`item-${idx}`} className="admin-aside__group">
                  {renderMobileItem(entry, pathname, () => setOpen(false))}
                </div>
              );
            }
            // 그룹 — 시안 .admin-aside__title 헤더 + items
            return (
              <div key={`group-${idx}`} className="admin-aside__group">
                <div className="admin-aside__title">{entry.label}</div>
                {entry.items.map((item) =>
                  renderMobileItem(item, pathname, () => setOpen(false))
                )}
              </div>
            );
          })}
        </nav>

        {/* 하단: 테마 토글 + 마이페이지 + 사이트로 + 로그아웃 — 시안 .admin-mobile-drawer__foot */}
        <div className="admin-mobile-drawer__foot">
          <div style={{ padding: "4px 6px 6px", display: "flex", justifyContent: "center" }}>
            <ThemeSwitch />
          </div>
          {user && (
            <Link
              href="/admin/me"
              onClick={() => setOpen(false)}
              className="admin-aside__foot-link"
            >
              <Icon name="circle-user" size={16} />
              마이페이지
            </Link>
          )}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="admin-aside__foot-link"
          >
            <Icon name="arrow-left" size={16} />
            사이트로 돌아가기
          </Link>
          {/* 로그아웃 (drawer-card variant — 시안 박제 후속에서 마이그레이션) */}
          {user && (
            <LogoutButton
              variant="drawer-card"
              onBeforeLogout={() => setOpen(false)}
            />
          )}
        </div>
      </aside>
    </>
  );
}

````

### File: src/lib/tournaments/setup-status.ts

````ts
/**
 * 2026-05-13 UI-1 (대시보드 체크리스트 hub) — 대회 셋업 진행도 판정 헬퍼.
 * 2026-05-16 PR-Admin-5 — 8 항목 → 7 항목 통합 (#3 종별 정의 + #4 운영 방식 → 통합 #3 "종별 + 운영 방식").
 *
 * 이유(왜):
 *   - 운영자가 8 메뉴 카드 사이에서 "지금 뭘 해야 하는지" 파악이 어려움 (IA 진단 §3).
 *   - dashboard 를 체크리스트로 재구성 → 결정 7 항목의 진행도/잠금/요약을 한 화면에 노출.
 *   - 각 항목의 완료 여부 판정 로직을 page.tsx 에서 분리 → 단위 테스트 + 재사용.
 *   - PR-Admin-5: 종별 정의/운영 방식 두 카드는 같은 페이지(/divisions) → 운영자 클릭 2회 + 같은 페이지 진입 혼란 발생.
 *     통합 1 카드 + 진행도 ("정의 N건 / 운영방식 M건") 표시로 IA 단순화.
 *
 * 항목 7 개 (PM 명세 / PR-Admin-5 통합 후):
 *   1. 기본 정보   — name + startDate + venue_name
 *   2. 시리즈 연결 — series_id != null (선택이지만 단계로 노출)
 *   3. 종별 + 운영 방식 — divisionRules 1건 이상 + 모든 format 박제 + group_* 모드면 settings.group_size/group_count 박제
 *   4. 신청 정책   — maxTeams + entry_fee + auto_approve_teams 박제 (auto_approve 는 boolean — null 만 미설정)
 *   5. 사이트 설정 — tournamentSite 존재 + isPublished
 *   6. 기록 설정   — tournament.settings.default_recording_mode 박제
 *   7. 대진표 생성 — matches 1건 이상
 *
 * 잠금 조건 (통합 후 step 번호 한 단계씩 당김):
 *   - 3 종별 + 운영 방식 ← 1 기본 정보 선행
 *   - 5 사이트            ← 1 기본 정보 선행
 *   - 6 기록 설정         ← 3 종별 + 운영 방식 선행
 *   - 7 대진표            ← 3 종별 + 운영 방식 선행
 *
 * 공개 가드:
 *   - 필수 6 항목 (1·3·4·5·6·7) ALL ✅ 일 때 공개 가능 (2 시리즈 연결은 선택)
 */

import type { Prisma } from "@prisma/client";
import {
  ALLOWED_FORMATS,
  type DivisionFormat,
  showGroupSettings,
} from "@/lib/tournaments/division-formats";

// ─────────────────────────────────────────────────────────────────────────
// 입력 타입 — page.tsx 의 prisma include 와 1:1 매칭 (over-fetch 방지)
// ─────────────────────────────────────────────────────────────────────────

// 체크리스트 8 항목 판정에 필요한 최소 필드만 노출 (다른 곳에서 재사용 가능하도록).
export type ChecklistTournamentInput = {
  name: string;
  startDate: Date | null;
  venue_name: string | null;
  places?: Prisma.JsonValue | null;
  series_id: bigint | null;
  maxTeams: number | null;
  entry_fee: Prisma.Decimal | null;
  auto_approve_teams: boolean | null;
  settings: Prisma.JsonValue | null; // tournament.settings JSON (default_recording_mode 포함)
};

export type ChecklistDivisionRuleInput = {
  format: string | null;
  settings: Prisma.JsonValue | null;
};

export type ChecklistRelationInput = {
  divisionRules: ChecklistDivisionRuleInput[];
  hasTournamentSite: boolean;
  isSitePublished: boolean;
  matchesCount: number;
};

// ─────────────────────────────────────────────────────────────────────────
// 항목별 판정 함수 — 각 함수는 boolean 만 반환 (UI 책임 0)
// ─────────────────────────────────────────────────────────────────────────

function getConfiguredPlaceCount(places: Prisma.JsonValue | null | undefined): number {
  if (!Array.isArray(places)) return 0;
  return places.filter((place) => {
    if (!place || typeof place !== "object" || Array.isArray(place)) return false;
    const name = (place as Record<string, unknown>).name;
    return typeof name === "string" && name.trim().length > 0;
  }).length;
}

function hasConfiguredPlaces(places: Prisma.JsonValue | null | undefined): boolean {
  return getConfiguredPlaceCount(places) > 0;
}

/** 1. 기본 정보 — name (필수) + startDate + venue_name 또는 places 모두 박제. */
export function isBasicInfoComplete(t: ChecklistTournamentInput): boolean {
  // 이유: 생성/관리 모두 다중 체육관 places를 장소 source로 사용한다.
  return Boolean(t.name && t.startDate && (t.venue_name || hasConfiguredPlaces(t.places)));
}

/** 2. 시리즈 연결 — series_id null 아님 (선택 항목, 단계로만 노출). */
export function isSeriesLinked(t: ChecklistTournamentInput): boolean {
  return t.series_id != null;
}

/** 3. 종별 정의 — divisionRules 1건 이상 (대회는 최소 1종별 필요). */
export function areDivisionsDefined(rules: ChecklistDivisionRuleInput[]): boolean {
  return rules.length > 0;
}

/**
 * 4. 운영 방식 — 모든 divisionRules.format 박제 + 조 설정 필요 모드면 settings 채움.
 *
 * 이유:
 *   - format null = 종별 단위 진행 방식 미정 (대회 단위 fallback 가능하지만 UX 상 명시 권장).
 *   - group_stage_* / league_advancement 모드는 group_size / group_count 미박제면 대진표 생성 실패.
 *     → division-formats.ts 의 showGroupSettings() 가드 재사용 (룰 일관성).
 */
export function areDivisionRulesComplete(rules: ChecklistDivisionRuleInput[]): boolean {
  if (rules.length === 0) return false;
  return rules.every((r) => {
    // format null = 미설정 (대회 format fallback 이 가능하지만 체크리스트는 "명시 박제" 기준).
    if (!r.format) return false;
    // ALLOWED_FORMATS 에 속하지 않으면 invalid (보수적으로 미완료 취급).
    if (!ALLOWED_FORMATS.includes(r.format as DivisionFormat)) return false;
    // 조 설정 필요 모드 (group_stage_knockout / full_league_knockout / league_advancement / group_stage_with_ranking)
    // 인 경우 settings.group_size / settings.group_count 양쪽 박제 여부 검증.
    if (showGroupSettings(r.format as DivisionFormat)) {
      const s = r.settings;
      if (!s || typeof s !== "object" || Array.isArray(s)) return false;
      const obj = s as Record<string, unknown>;
      // snake_case 표준 + legacy camelCase fallback (division-formats.ts §2 와 동일 정책)
      const size = obj.group_size ?? obj.groupSize;
      const count = obj.group_count ?? obj.groupCount;
      if (typeof size !== "number" || size <= 0) return false;
      if (typeof count !== "number" || count <= 0) return false;
    }
    return true;
  });
}

/**
 * 5. 신청 정책 — maxTeams + entry_fee + auto_approve_teams 박제.
 *
 * 이유:
 *   - maxTeams null = 정원 미정 (대회 신청 페이지 노출 불가).
 *   - entry_fee null = 참가비 미박제 (0 == 무료 = 박제됨).
 *   - auto_approve_teams 는 boolean — null 만 미박제 (true / false 모두 박제).
 */
export function isRegistrationPolicyComplete(t: ChecklistTournamentInput): boolean {
  return t.maxTeams != null && t.entry_fee != null && t.auto_approve_teams != null;
}

/**
 * 6. 사이트 설정 — tournamentSite 존재 (박제됨) 여부만 검증.
 *
 * 이유 (2026-05-13 UI-5 공개 게이트 도입):
 *   - 기존: `hasTournamentSite && isPublished` (= 이미 공개돼야 ✅).
 *   - UI-5 의 공개 게이트는 "6번 ✅ 일 때 비로소 공개 가능" 흐름.
 *     → 6번이 "이미 공개" 를 요구하면 게이트 자체가 닭과 달걀 (체크리스트 = 0건도 통과 불가).
 *   - 따라서 6번 의미를 "사이트 박제 (subdomain/template 설정)" 로 좁히고, isPublished 는
 *     별도 status (체크리스트 hub 의 site 카드 summary + 공개 버튼 상태) 로 분리.
 *   - hub 의 공개 버튼은 isPublished=false → true 토글 책임 (canPublish 통과 시).
 */
export function isSiteConfigured(r: ChecklistRelationInput): boolean {
  return r.hasTournamentSite;
}

/** 7. 기록 설정 — tournament.settings.default_recording_mode 박제 ("flutter" or "paper"). */
export function isRecordingModeConfigured(t: ChecklistTournamentInput): boolean {
  const s = t.settings;
  if (!s || typeof s !== "object" || Array.isArray(s)) return false;
  const value = (s as Record<string, unknown>).default_recording_mode;
  // 명시적으로 "flutter" or "paper" 박제된 경우만 완료 (null/누락 = 미설정).
  return value === "flutter" || value === "paper";
}

/** 8. 대진표 생성 — matches 1건 이상. */
export function isBracketGenerated(r: ChecklistRelationInput): boolean {
  return r.matchesCount > 0;
}

// ─────────────────────────────────────────────────────────────────────────
// 진행도 종합 계산 — UI 에 전달할 ChecklistItem[] + 합계
// ─────────────────────────────────────────────────────────────────────────

export type ChecklistStatus = "complete" | "in_progress" | "empty" | "locked";

export type ChecklistItem = {
  key: string;
  step: number; // 1~7 (PR-Admin-5: 8→7 축소)
  title: string;
  summary: string; // 한 줄 요약 (예: "i3-U9 / i2-U11")
  status: ChecklistStatus;
  icon: string; // material symbols 이름
  link: string;
  required: boolean; // 공개 필수 항목 여부 (2 시리즈는 false, 나머지 true)
  lockedReason?: string; // status=locked 일 때 안내 문구
  // 2026-05-28 PR-1C-9 (B1) — 시안 depends_on 시각화용 선행 STEP 번호 배열.
  //   잠금 카드에 "N단계 완료 후 진행" link 표시 + 클릭 toast 안내에 사용.
  //   기존 잠금 판정 로직(!basic / !divsComplete)이 가리키는 선행 항목의 step 번호만 노출 — 판정 로직 변경 0.
  //   비잠금 카드 또는 선행 없는 카드 = 빈 배열 또는 undefined (표시 0).
  dependsOn?: number[];
  // 2026-05-16 PR-Admin-5 — UI 표시용 진행도 (예: 통합 #3 "종별 + 운영 방식" — "정의 4건 / 운영방식 2건").
  //   undefined 이면 status 만 표시 (기존 동작 유지).
  progress?: { current: number; total: number };
};

export type SetupProgress = {
  completed: number; // ✅ 개수 (locked 제외)
  total: number; // 7 (PR-Admin-5: 8→7 통합)
  items: ChecklistItem[];
  allRequiredComplete: boolean; // 공개 가드 (필수 6 항목 ALL ✅)
  missingRequiredTitles: string[]; // disabled 시 tooltip 용 ("기본 정보, 종별 + 운영 방식, ...")
};

/**
 * 7 항목 진행도 종합 (PR-Admin-5: 8→7 통합).
 *
 * @param tournamentId — 카드 href 생성용 (각 카드의 진입 링크 prefix)
 * @param t — Tournament row (필요 필드만)
 * @param r — relation 요약 (divisionRules / site / matchesCount)
 */
export function calculateSetupProgress(
  tournamentId: string,
  t: ChecklistTournamentInput,
  r: ChecklistRelationInput
): SetupProgress {
  const base = `/tournament-admin/tournaments/${tournamentId}`;

  // 선행 조건 boolean (잠금 조건 산출용) — 잠금 우선 평가.
  const basic = isBasicInfoComplete(t);
  const seriesLinked = isSeriesLinked(t);
  const divsDefined = areDivisionsDefined(r.divisionRules);
  const divsComplete = areDivisionRulesComplete(r.divisionRules);
  const regComplete = isRegistrationPolicyComplete(t);
  const siteComplete = isSiteConfigured(r);
  const recordingComplete = isRecordingModeConfigured(t);
  const bracketComplete = isBracketGenerated(r);

  // 통합 카드 #3 진행도 산출 — "정의 N건 / 운영방식 M건"
  //   - rulesWithFormat = format 박제된 종별 수 (운영방식 박제 진척)
  //   - 통합 카드 status = 종별 0 = empty / 일부 = in_progress / 모두 박제 = complete
  const rulesWithFormatCount = r.divisionRules.filter((d) => !!d.format).length;
  const totalDivisionsCount = r.divisionRules.length;

  // 요약 텍스트 헬퍼 (한 줄 — 모든 카드 동일 톤)
  const configuredPlaceCount = getConfiguredPlaceCount(t.places);
  const venueSummary = t.venue_name
    ? `장소: ${t.venue_name}`
    : configuredPlaceCount > 0
      ? `장소: ${configuredPlaceCount}곳`
      : "장소 미설정";
  const seriesSummary = seriesLinked ? "시리즈 연결됨" : "시리즈 미연결 (선택)";
  // 통합 카드 #3 "종별 + 운영 방식" summary
  //   - 종별 미정의 = "종별 미정의"
  //   - 종별 정의 + 모든 운영 방식 박제 = "종별 N건 모두 운영 방식 박제됨"
  //   - 종별 정의 + 일부 운영 방식 박제 = "종별 N건 / 운영방식 M건"
  const divsCombinedSummary = !divsDefined
    ? "종별 미정의"
    : divsComplete
      ? `종별 ${totalDivisionsCount}건 모두 운영 방식 박제됨`
      : `종별 ${totalDivisionsCount}건 / 운영방식 ${rulesWithFormatCount}건`;
  const regSummary = regComplete
    ? `최대 ${t.maxTeams}팀 · 참가비 ${Number(t.entry_fee).toLocaleString()}원`
    : "정원/참가비/자동승인 미박제";
  const siteSummary = r.hasTournamentSite
    ? r.isSitePublished
      ? "사이트 공개 중"
      : "사이트 박제됨 (비공개)"
    : "사이트 미생성";
  const recordingSummary = recordingComplete
    ? `기본 모드: ${(t.settings as Record<string, unknown>).default_recording_mode === "paper" ? "기록지" : "Flutter"}`
    : "기록 모드 미설정";
  const bracketSummary = bracketComplete
    ? `${r.matchesCount}경기 생성됨`
    : "대진표 미생성";

  // 7 항목 (PR-Admin-5 통합 후) — 잠금 조건 처리 포함.
  //   기존 #3 종별 정의 + #4 운영 방식 → 통합 #3 "종별 + 운영 방식" (key="divisions")
  //   기존 #5~#8 → #4~#7 step renumbering
  const items: ChecklistItem[] = [
    {
      key: "basic",
      step: 1,
      title: "기본 정보",
      summary: basic ? venueSummary : "이름·일정·장소 미박제",
      status: basic
        ? "complete"
        : statusFromAnyField(
            t.name,
            t.startDate,
            t.venue_name || (configuredPlaceCount > 0 ? "places" : null),
          ),
      icon: "info",
      link: `${base}#setup`,
      required: true,
    },
    {
      key: "series",
      step: 2,
      title: "시리즈 연결",
      summary: seriesSummary,
      status: seriesLinked ? "complete" : "empty",
      icon: "linked_services",
      link: `${base}#setup`,
      required: false, // 선택 항목
    },
    // ⭐ PR-Admin-5 통합 카드 — 종별 정의 + 운영 방식 (같은 페이지 = /divisions)
    //   사유: 운영자가 같은 페이지로 클릭 2회 진입 혼란 → 1 카드 + 진행도 표시 (정의 N건 / 운영방식 M건)
    //   status: divsComplete (= 종별 정의 ALL + 운영 방식 박제 ALL) 시만 complete
    //   progress: divsDefined 시 운영방식 진척 (rulesWithFormat / totalDivisions) 표시
    {
      key: "divisions",
      step: 3,
      title: "종별 + 운영 방식",
      summary: divsCombinedSummary,
      status: !basic
        ? "locked"
        : divsComplete
          ? "complete"
          : divsDefined
            ? "in_progress"
            : "empty",
      icon: "category",
      link: `${base}#structure`,
      required: true,
      lockedReason: !basic ? "기본 정보를 먼저 박제하세요" : undefined,
      // PR-1C-9 (B1): 잠금 시 선행 = 1단계 기본 정보 (잠금 판정 = !basic)
      dependsOn: !basic ? [1] : undefined,
      // 진행도 표시 — 종별 정의된 경우에만 (정의 0이면 progress undefined = 표시 0)
      progress: divsDefined
        ? { current: rulesWithFormatCount, total: totalDivisionsCount }
        : undefined,
    },
    {
      key: "registration",
      step: 4,
      title: "신청 정책",
      summary: regSummary,
      status: regComplete ? "complete" : "empty",
      icon: "how_to_reg",
      // 2026-05-13 UI-1.5 — wizard 의 RegistrationSettingsForm 영역(Step 2 = 참가 설정) 으로 바로 진입.
      //   ?step=N (1-based) 은 [id]/wizard/page.tsx 의 initialStep 로직이 0-based 로 변환해 적용.
      link: `${base}#setup`,
      required: true,
    },
    {
      key: "site",
      step: 5,
      title: "사이트 설정",
      summary: siteSummary,
      // 2026-05-13 UI-5: siteComplete (= hasTournamentSite) 면 ✅. isPublished 는 status 분리됨
      //   → 사이트 박제만 완료되면 5번 카드 ✅ (공개는 hub 의 공개 버튼이 별도 책임)
      status: !basic ? "locked" : siteComplete ? "complete" : "empty",
      icon: "language",
      link: `${base}#publish`,
      required: true,
      lockedReason: !basic ? "기본 정보를 먼저 박제하세요" : undefined,
      // PR-1C-9 (B1): 잠금 시 선행 = 1단계 기본 정보 (잠금 판정 = !basic)
      dependsOn: !basic ? [1] : undefined,
    },
    {
      key: "recording",
      step: 6,
      title: "기록 설정",
      summary: recordingSummary,
      status: !divsComplete ? "locked" : recordingComplete ? "complete" : "empty",
      icon: "edit_note",
      link: `${base}#matches`,
      required: true,
      lockedReason: !divsComplete ? "종별 + 운영 방식을 먼저 박제하세요" : undefined,
      // PR-1C-9 (B1): 잠금 시 선행 = 3단계 종별 + 운영 방식 (잠금 판정 = !divsComplete)
      dependsOn: !divsComplete ? [3] : undefined,
    },
    {
      key: "bracket",
      step: 7,
      title: "대진표 생성",
      summary: bracketSummary,
      status: !divsComplete ? "locked" : bracketComplete ? "complete" : "empty",
      icon: "account_tree",
      link: `${base}#structure`,
      required: true,
      lockedReason: !divsComplete ? "종별 + 운영 방식을 먼저 박제하세요" : undefined,
      // PR-1C-9 (B1): 잠금 시 선행 = 3단계 종별 + 운영 방식 (잠금 판정 = !divsComplete)
      dependsOn: !divsComplete ? [3] : undefined,
    },
  ];

  // 완료 개수 (locked 제외 — locked 는 "아직 시도 불가" 라 0 으로 카운트)
  const completed = items.filter((i) => i.status === "complete").length;

  // 공개 가드: 필수 7 항목 (required=true) 이 모두 complete 인지.
  const requiredItems = items.filter((i) => i.required);
  const allRequiredComplete = requiredItems.every((i) => i.status === "complete");
  const missingRequiredTitles = requiredItems
    .filter((i) => i.status !== "complete")
    .map((i) => i.title);

  return {
    completed,
    total: items.length,
    items,
    allRequiredComplete,
    missingRequiredTitles,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 2026-05-13 UI-5 공개 게이트 — 공개 가능 여부 판정 헬퍼
// ─────────────────────────────────────────────────────────────────────────

/**
 * 공개 가능 여부 (필수 7 항목 ALL ✅) 판정.
 *
 * 이유:
 *   - 클라이언트 (체크리스트 hub 의 공개 버튼) + 서버 (POST /site/publish 가드) 양쪽에서
 *     동일한 판정 로직을 단일 source 로 공유.
 *   - calculateSetupProgress() 이미 allRequiredComplete + missingRequiredTitles 산출 →
 *     이를 한 줄로 노출만 (재계산 0).
 *
 * @param progress — calculateSetupProgress() 반환값
 * @returns { ok, missing } — ok=true 면 공개 허용, missing 은 미충족 항목 title 배열
 */
export function canPublish(progress: SetupProgress): {
  ok: boolean;
  missing: string[];
} {
  return {
    ok: progress.allRequiredComplete,
    missing: [...progress.missingRequiredTitles],
  };
}

/**
 * 일부 필드만 박제된 경우 in_progress / 전혀 없으면 empty 판정 헬퍼.
 * (기본 정보 카드 — name 만 있고 startDate 없는 케이스 등을 in_progress 로 노출)
 */
function statusFromAnyField(...fields: Array<unknown>): ChecklistStatus {
  const filledCount = fields.filter((f) => f != null && f !== "").length;
  if (filledCount === 0) return "empty";
  if (filledCount === fields.length) return "complete";
  return "in_progress";
}

````

### File: src/lib/tournaments/game-rules.ts

````ts
export type QuarterTypeCode = "4Q" | "HALF";
export type ClockModeCode = "nonstop" | "dead";

export type TournamentGameRules = {
  quarterType: QuarterTypeCode;
  quarterMinutes: number;
  overtimeMinutes: number;
  lastScoreStopMin: number;
  totalQuarters: number;
  clockMode: ClockModeCode;
  foulLimit: number;
  teamFoulBonus: number;
  shotClockEnabled: boolean;
  firstHalfTimeouts: number;
  secondHalfTimeouts: number;
  timeoutDurationSeconds: number;
  shortBreakDurationSeconds: number;
  halftimeDurationSeconds: number;
  overtimeBreakDurationSeconds: number;
  autoIntervalTimerEnabled: boolean;
  homeColor: string;
  awayColor: string;
  vestProvided: boolean;
};

export type GameRulePreset = {
  label: string;
  quarterType: QuarterTypeCode;
  quarterMinutes: number;
  clockMode: ClockModeCode;
  firstHalfTimeouts: number;
  secondHalfTimeouts: number;
};

export const GAME_RULE_DEFAULTS: TournamentGameRules = {
  quarterType: "4Q",
  quarterMinutes: 10,
  overtimeMinutes: 5,
  lastScoreStopMin: 2,
  totalQuarters: 4,
  clockMode: "dead",
  foulLimit: 5,
  teamFoulBonus: 5,
  shotClockEnabled: true,
  firstHalfTimeouts: 2,
  secondHalfTimeouts: 3,
  timeoutDurationSeconds: 30,
  shortBreakDurationSeconds: 120,
  halftimeDurationSeconds: 300,
  overtimeBreakDurationSeconds: 120,
  autoIntervalTimerEnabled: true,
  homeColor: "#E31B23",
  awayColor: "#0F5FCC",
  vestProvided: false,
};

export const GAME_RULE_PRESETS: readonly GameRulePreset[] = [
  { label: "7분 4쿼터 · 논스톱", quarterType: "4Q", quarterMinutes: 7, clockMode: "nonstop", firstHalfTimeouts: 1, secondHalfTimeouts: 2 },
  { label: "7분 4쿼터 · 올데드", quarterType: "4Q", quarterMinutes: 7, clockMode: "dead", firstHalfTimeouts: 2, secondHalfTimeouts: 3 },
  { label: "6분 4쿼터 · 논스톱", quarterType: "4Q", quarterMinutes: 6, clockMode: "nonstop", firstHalfTimeouts: 1, secondHalfTimeouts: 1 },
  { label: "6분 4쿼터 · 올데드", quarterType: "4Q", quarterMinutes: 6, clockMode: "dead", firstHalfTimeouts: 1, secondHalfTimeouts: 2 },
  { label: "10분 4쿼터 · 논스톱", quarterType: "4Q", quarterMinutes: 10, clockMode: "nonstop", firstHalfTimeouts: 2, secondHalfTimeouts: 3 },
  { label: "10분 4쿼터 · 올데드", quarterType: "4Q", quarterMinutes: 10, clockMode: "dead", firstHalfTimeouts: 2, secondHalfTimeouts: 3 },
  { label: "10분 전후반 · 논스톱", quarterType: "HALF", quarterMinutes: 10, clockMode: "nonstop", firstHalfTimeouts: 1, secondHalfTimeouts: 1 },
  { label: "10분 전후반 · 올데드", quarterType: "HALF", quarterMinutes: 10, clockMode: "dead", firstHalfTimeouts: 1, secondHalfTimeouts: 2 },
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return asRecord(parsed);
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function pickString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

function pickNumber(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function pickBoolean(source: Record<string, unknown>, key: string): boolean | undefined {
  const value = source[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return undefined;
}

function clampInt(value: number | undefined, fallback: number, min: number, max: number) {
  if (value === undefined) return fallback;
  const rounded = Math.round(value);
  if (rounded < min || rounded > max) return fallback;
  return rounded;
}

function normalizeHex(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(withHash)
    ? withHash.toUpperCase()
    : fallback;
}

function normalizeQuarterType(source: Record<string, unknown>): QuarterTypeCode {
  const raw = pickString(source, "quarterType");
  if (raw === "HALF") return "HALF";
  if (raw === "4Q") return "4Q";
  return pickNumber(source, "totalQuarters") === 2 ? "HALF" : GAME_RULE_DEFAULTS.quarterType;
}

function normalizeClockMode(source: Record<string, unknown>): ClockModeCode {
  const raw = pickString(source, "clockMode")?.trim().toLowerCase();
  if (raw === "nonstop") return "nonstop";
  if (raw === "dead" || raw === "all_dead" || raw === "alldead") return "dead";
  return GAME_RULE_DEFAULTS.clockMode;
}

function intervalPreset(
  quarterType: QuarterTypeCode,
  quarterMinutes: number,
  clockMode: ClockModeCode,
) {
  if (quarterType !== "4Q") {
    return {
      shortBreakDurationSeconds: GAME_RULE_DEFAULTS.shortBreakDurationSeconds,
      halftimeDurationSeconds: GAME_RULE_DEFAULTS.halftimeDurationSeconds,
      overtimeBreakDurationSeconds: GAME_RULE_DEFAULTS.overtimeBreakDurationSeconds,
      autoIntervalTimerEnabled: GAME_RULE_DEFAULTS.autoIntervalTimerEnabled,
    };
  }
  if (quarterMinutes === 10 && clockMode === "dead") {
    return {
      shortBreakDurationSeconds: 120,
      halftimeDurationSeconds: 300,
      overtimeBreakDurationSeconds: 120,
      autoIntervalTimerEnabled: true,
    };
  }
  if (quarterMinutes === 6 || quarterMinutes === 7 || (quarterMinutes === 10 && clockMode === "nonstop")) {
    return {
      shortBreakDurationSeconds: 60,
      halftimeDurationSeconds: 180,
      overtimeBreakDurationSeconds: 120,
      autoIntervalTimerEnabled: true,
    };
  }
  return {
    shortBreakDurationSeconds: GAME_RULE_DEFAULTS.shortBreakDurationSeconds,
    halftimeDurationSeconds: GAME_RULE_DEFAULTS.halftimeDurationSeconds,
    overtimeBreakDurationSeconds: GAME_RULE_DEFAULTS.overtimeBreakDurationSeconds,
    autoIntervalTimerEnabled: GAME_RULE_DEFAULTS.autoIntervalTimerEnabled,
  };
}

export function applyGameRulePreset(
  current: TournamentGameRules,
  preset: GameRulePreset,
): TournamentGameRules {
  const interval = intervalPreset(preset.quarterType, preset.quarterMinutes, preset.clockMode);
  return {
    ...current,
    quarterType: preset.quarterType,
    quarterMinutes: preset.quarterMinutes,
    totalQuarters: preset.quarterType === "HALF" ? 2 : 4,
    clockMode: preset.clockMode,
    firstHalfTimeouts: preset.firstHalfTimeouts,
    secondHalfTimeouts: preset.secondHalfTimeouts,
    ...interval,
  };
}

export function normalizeGameRules(input?: unknown): TournamentGameRules {
  const source = asRecord(input);
  const quarterType = normalizeQuarterType(source);
  const clockMode = normalizeClockMode(source);
  const quarterMinutes = clampInt(
    pickNumber(source, "quarterMinutes"),
    GAME_RULE_DEFAULTS.quarterMinutes,
    1,
    20,
  );
  const interval = intervalPreset(quarterType, quarterMinutes, clockMode);

  return {
    quarterType,
    quarterMinutes,
    overtimeMinutes: clampInt(pickNumber(source, "overtimeMinutes"), GAME_RULE_DEFAULTS.overtimeMinutes, 1, 20),
    lastScoreStopMin: clampInt(pickNumber(source, "lastScoreStopMin"), GAME_RULE_DEFAULTS.lastScoreStopMin, 0, 2),
    totalQuarters: quarterType === "HALF" ? 2 : 4,
    clockMode,
    foulLimit: clampInt(pickNumber(source, "foulLimit"), GAME_RULE_DEFAULTS.foulLimit, 4, 6),
    teamFoulBonus: clampInt(pickNumber(source, "teamFoulBonus"), GAME_RULE_DEFAULTS.teamFoulBonus, 3, 7),
    shotClockEnabled:
      pickBoolean(source, "shotClockEnabled") ??
      pickBoolean(source, "shotClock") ??
      GAME_RULE_DEFAULTS.shotClockEnabled,
    firstHalfTimeouts: clampInt(
      pickNumber(source, "firstHalfTimeouts"),
      GAME_RULE_DEFAULTS.firstHalfTimeouts,
      0,
      4,
    ),
    secondHalfTimeouts: clampInt(
      pickNumber(source, "secondHalfTimeouts"),
      GAME_RULE_DEFAULTS.secondHalfTimeouts,
      0,
      4,
    ),
    timeoutDurationSeconds: clampInt(
      pickNumber(source, "timeoutDurationSeconds") ?? pickNumber(source, "timeoutDuration"),
      GAME_RULE_DEFAULTS.timeoutDurationSeconds,
      30,
      90,
    ),
    shortBreakDurationSeconds: clampInt(
      pickNumber(source, "shortBreakDurationSeconds"),
      interval.shortBreakDurationSeconds,
      0,
      1800,
    ),
    halftimeDurationSeconds: clampInt(
      pickNumber(source, "halftimeDurationSeconds"),
      interval.halftimeDurationSeconds,
      0,
      1800,
    ),
    overtimeBreakDurationSeconds: clampInt(
      pickNumber(source, "overtimeBreakDurationSeconds"),
      interval.overtimeBreakDurationSeconds,
      0,
      1800,
    ),
    autoIntervalTimerEnabled:
      pickBoolean(source, "autoIntervalTimerEnabled") ?? interval.autoIntervalTimerEnabled,
    homeColor: normalizeHex(source.homeColor, GAME_RULE_DEFAULTS.homeColor),
    awayColor: normalizeHex(source.awayColor, GAME_RULE_DEFAULTS.awayColor),
    vestProvided: pickBoolean(source, "vestProvided") ?? GAME_RULE_DEFAULTS.vestProvided,
  };
}

export function toGameRulesResponse(input?: unknown) {
  const rules = normalizeGameRules(input);
  return {
    game_rules: rules,
    game_rules_json: JSON.stringify(rules),
    quarter_minutes: rules.quarterMinutes,
    total_quarters: rules.totalQuarters,
    first_half_timeouts: rules.firstHalfTimeouts,
    second_half_timeouts: rules.secondHalfTimeouts,
  };
}

````

### File: src/lib/tournaments/division-rule-sync.ts

````ts
import type { Prisma } from "@prisma/client";

export type TournamentCategoryMap = Record<string, string[]>;
export type TournamentNumberMap = Record<string, number>;

export type DivisionRuleSeed = {
  code: string;
  label: string;
  feeKrw: number;
  sortOrder: number;
  format: string | null;
  settings: Prisma.InputJsonValue;
};

export type CategorySelectionItem = {
  category: string;
  divisions: Array<{
    name: string;
    cap: number | null;
    fee: number | null;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function uniqueText(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

export function normalizeCategoryMap(value: unknown): TournamentCategoryMap {
  if (!isRecord(value)) return {};

  const result: TournamentCategoryMap = {};
  for (const [rawCategory, rawDivisions] of Object.entries(value)) {
    const category = rawCategory.trim();
    if (!category || !Array.isArray(rawDivisions)) continue;

    const divisions = uniqueText(rawDivisions);
    if (divisions.length > 0) {
      result[category] = divisions;
    }
  }
  return result;
}

export function normalizeNumberMap(value: unknown): TournamentNumberMap {
  if (!isRecord(value)) return {};

  const result: TournamentNumberMap = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = rawKey.trim();
    const value =
      typeof rawValue === "number"
        ? rawValue
        : typeof rawValue === "string" && rawValue.trim() !== ""
          ? Number(rawValue)
          : NaN;

    if (!key || !Number.isFinite(value) || value < 0) continue;
    result[key] = Math.trunc(value);
  }
  return result;
}

export function countCategoryDivisions(value: unknown): number {
  return Object.values(normalizeCategoryMap(value)).reduce(
    (sum, divisions) => sum + divisions.length,
    0,
  );
}

export function toCategorySelectionItems(
  categoriesValue: unknown,
  divCapsValue: unknown,
  divFeesValue: unknown,
): CategorySelectionItem[] {
  const categories = normalizeCategoryMap(categoriesValue);
  const divCaps = normalizeNumberMap(divCapsValue);
  const divFees = normalizeNumberMap(divFeesValue);

  return Object.entries(categories).map(([category, divisions]) => ({
    category,
    divisions: divisions.map((name) => ({
      name,
      cap: divCaps[name] ?? null,
      fee: divFees[name] ?? null,
    })),
  }));
}

export function buildDivisionRuleSeedsFromCategories({
  categories,
  divFees,
  entryFee,
  format,
}: {
  categories: unknown;
  divFees?: unknown;
  entryFee?: number | null;
  format?: string | null;
}): DivisionRuleSeed[] {
  const normalizedCategories = normalizeCategoryMap(categories);
  const normalizedFees = normalizeNumberMap(divFees);
  const fallbackFee =
    typeof entryFee === "number" && Number.isFinite(entryFee) && entryFee >= 0
      ? Math.trunc(entryFee)
      : 0;

  const seen = new Set<string>();
  const seeds: DivisionRuleSeed[] = [];

  for (const [category, divisions] of Object.entries(normalizedCategories)) {
    for (const division of divisions) {
      if (seen.has(division)) continue;
      seen.add(division);
      seeds.push({
        code: division,
        label: division,
        feeKrw: normalizedFees[division] ?? fallbackFee,
        sortOrder: seeds.length,
        format: format ?? null,
        settings: { category },
      });
    }
  }

  return seeds;
}

````

### File: src/lib/services/tournament.ts

````ts
/**
 * Tournament Service — 대회 관련 비즈니스 로직 중앙화
 *
 * 라우트 핸들러/서버 컴포넌트에서 직접 prisma를 import하지 않고
 * 이 서비스를 통해 데이터에 접근한다.
 * Service 함수는 순수 데이터만 반환한다 (NextResponse 사용 금지).
 */
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { usableSubscriptionWhere } from "@/lib/membership/entitlements";
// Prisma namespace — Json 타입 호환용 InputJsonValue 캐스팅에 사용
import type { Prisma } from "@prisma/client";
// 대회 기록방식(풀스탯/전자기록지/수기) — my-tournaments 응답 default_recording_mode 산출용
import { getTournamentDefaultMode } from "@/lib/tournaments/recording-mode";
import { normalizeGameRules } from "@/lib/tournaments/game-rules";
import { buildDivisionRuleSeedsFromCategories } from "@/lib/tournaments/division-rule-sync";

// ---------------------------------------------------------------------------
// apiToken 발급 헬퍼 — Flutter 앱 대회 진입 토큰 (64자 hex)
// ---------------------------------------------------------------------------
// 2026-05-15 — 4차 뉴비리그 apiToken NULL 사고 (editions/ 라우트에서 누락) 후
// 단일 source 로 분리. tournament.create 직접 호출 경로는 모두 이 헬퍼 사용 필수.
// 사고 패턴: errors.md / lessons.md 박제.
export function generateApiToken(): string {
  return randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------------------
// Select 상수 — 동일 쿼리의 select 객체 중복을 제거한다
// ---------------------------------------------------------------------------

/** 홈페이지, 대회 목록 등에서 사용하는 최소 select */
export const TOURNAMENT_LIST_SELECT = {
  id: true,
  name: true,
  format: true,
  status: true,
  startDate: true,
  endDate: true,
  entry_fee: true,
  city: true,
  venue_name: true,
  maxTeams: true,
  divisions: true,  // 목록에서 종별 표시용
  categories: true,       // 종별 뱃지 표시용 (Json)
  division_tiers: true,   // 디비전 뱃지 표시용 (Json)
  _count: { select: { tournamentTeams: true } },
} as const;

/** 홈페이지 전용 간략 select (entry_fee, endDate 불필요) */
export const TOURNAMENT_HOME_SELECT = {
  id: true,
  name: true,
  format: true,
  status: true,
  startDate: true,
} as const;

/** 내 대회 목록 (Flutter API: my-tournaments) 에서 사용하는 select */
export const MY_TOURNAMENT_SELECT = {
  id: true,
  name: true,
  status: true,
  format: true,
  startDate: true,
  endDate: true,
  venue_name: true,
  venue_address: true,
  teams_count: true,
  matches_count: true,
  apiToken: true,
  logo_url: true,
  // 2026-06-22: 기록방식(default_recording_mode) 산출용 — settings JSON. Flutter '내 대회'
  //   목록이 '수기(manual)' 대회를 제외하는 데 사용(풀스탯/전자기록지만 노출).
  settings: true,
  tournament_series: { select: { name: true } },
  // 2026-06-22: 완료 경기 수(진행률 표시용) — Flutter 대회카드 "N/M 경기" 진행바.
  //   matches_count(전체)는 위 denormalized 컬럼, 완료수는 필터 카운트로 산출.
  _count: {
    select: {
      tournamentTeams: { where: { status: "approved" } },
      tournamentMatches: true,
    },
  },
} as const;

/** 관리자 상세 조회 include */
export const TOURNAMENT_DETAIL_INCLUDE = {
  tournamentSite: {
    select: {
      id: true,
      subdomain: true,
      isPublished: true,
      primaryColor: true,
      secondaryColor: true,
    },
  },
  adminMembers: {
    where: { isActive: true },
    select: { id: true, userId: true, role: true },
  },
  _count: {
    select: { tournamentTeams: true, tournamentMatches: true },
  },
} as const;

// ---------------------------------------------------------------------------
// 타입
// ---------------------------------------------------------------------------

export interface TournamentListFilters {
  status?: string;
  /** 맞춤 지역 필터 -- 여러 도시를 OR 조건으로 검색 (prefer=true 시 사용) */
  cities?: string[];
  /** 맞춤 종별 필터 -- Json 배열 교집합 매칭 (prefer=true 시 사용) */
  divisions?: string[];
  /** 맞춤 성별 필터 -- tournament.gender IN (...) 조건 (prefer=true 시 사용) */
  gender?: string[];
  take?: number;
  /** 조회자 유저 ID -- 해당 유저가 관계자인 비공개 대회도 포함 */
  viewerUserId?: bigint;
  /** 조회자가 super_admin이면 is_public 필터 무시 */
  viewerIsSuperAdmin?: boolean;
}

export interface CreateTournamentInput {
  name: string;
  organizerId: bigint;
  /**
   * 시리즈 ID (선택) — 지정 시 tournament.series_id 박제 + tournament_series.tournaments_count +1
   * $transaction 으로 원자적 처리.
   *
   * 2026-05-12 Phase B 정합성 가드 — 직접 createTournament 호출 path (wizard 외) 에서 series_id
   * 박제 자체가 안 되어 카운터 stale 사고 (series id=8 stored=0 / actual=12) 차단.
   *
   * 권한 검증은 호출자(route) 책임 — service 는 $transaction 안에서 단순 카운터 증가만 담당.
   */
  seriesId?: bigint | null;
  format?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  primaryColor?: string;
  secondaryColor?: string;
  subdomain?: string;
  // 접수 설정
  description?: string;
  registrationStartAt?: Date | null;
  registrationEndAt?: Date | null;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  categories?: Record<string, string[]>;
  divCaps?: Record<string, number>;
  divFees?: Record<string, number>;
  allowWaitingList?: boolean;
  waitingListCap?: number | null;
  entryFee?: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  feeNotes?: string;
  maxTeams?: number;
  teamSize?: number;
  rosterMin?: number;
  rosterMax?: number;
  autoApproveTeams?: boolean;
  // 대회 관리 확장 필드
  organizer?: string;
  host?: string;
  sponsors?: string;
  gameTime?: string;
  gameBall?: string;
  gameMethod?: string;
  // 장소(시안 새 대회 생성폼 확장형) — 코트수/명명/지역은 선택. DB는 자유 jsonb라 기존 {name,address}도 통과.
  places?: {
    id?: string;
    name: string;
    address?: string;
    region?: string;
    courtCount?: number;
    court_count?: number;
    naming?: "num" | "alpha";
    provider?: "kakao" | "google";
    placeId?: string;
    place_id?: string;
    lat?: number;
    lng?: number;
    phone?: string;
    category?: string;
    mapUrl?: string;
    map_url?: string;
    routeUrl?: string;
    route_url?: string;
  }[];
  gender?: string;
  rules?: string;
  prizeInfo?: string;
  // (가) 경기설정 — 시안 GAME_SETTINGS 12키 그대로 저장(jsonb 내부 camelCase 보존). 미전송 시 {}.
  gameRules?: Record<string, unknown>;
  // (나) 날짜↔코트 배정 — [{id,date,court_ids:[]}] 구조. 미전송 시 [].
  scheduleDates?: { id: string; date: string; court_ids: string[] }[];
  // 디자인 템플릿 + 이미지 URL
  designTemplate?: string;
  logoUrl?: string;
  bannerUrl?: string;
  // settings JSON — 포맷 세부설정(bracket)/문의 연락처 등 부가 설정 저장
  settings?: Record<string, unknown>;
}

export interface UpdateTournamentData {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// 내 대회 변환 헬퍼 (my-tournaments에서 사용하는 통일된 응답 형식)
// ---------------------------------------------------------------------------

type RawMyTournament = {
  id: string;
  name: string;
  status: string | null;
  format: string | null;
  startDate: Date | null;
  endDate: Date | null;
  venue_name: string | null;
  venue_address: string | null;
  teams_count: number | null;
  matches_count: number | null;
  apiToken: string | null;
  logo_url: string | null;
  tournament_series: { name: string } | null;
  _count?: { tournamentTeams: number; tournamentMatches: number } | null;
  settings: Prisma.JsonValue | null;
};

interface MyTournamentItem {
  id: string;
  name: string;
  status: string;
  format: string | null;
  start_date: string | null;
  end_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  team_count: number;
  match_count: number;
  completed_match_count: number;
  default_recording_mode: string; // "flutter" | "paper" | "manual" — 앱 '내 대회' 노출 판정
  series_name: string | null;
  role: string;
  can_edit: boolean;
  can_record: boolean;
  api_token: string | null;
  logo_url: string | null;
}

function toMyTournamentItem(
  t: RawMyTournament,
  role: string,
  canEdit: boolean
): MyTournamentItem {
  return {
    id: t.id,
    name: t.name,
    status: t.status ?? "draft",
    format: t.format,
    start_date: t.startDate?.toISOString() ?? null,
    end_date: t.endDate?.toISOString() ?? null,
    venue_name: t.venue_name,
    venue_address: t.venue_address,
    team_count: t._count?.tournamentTeams ?? 0,
    match_count: t._count?.tournamentMatches ?? 0,
    completed_match_count: 0,
    default_recording_mode: getTournamentDefaultMode({ settings: t.settings }),
    series_name: t.tournament_series?.name ?? null,
    role,
    can_edit: canEdit,
    can_record: true,
    api_token: t.apiToken,
    logo_url: t.logo_url,
  };
}

// ---------------------------------------------------------------------------
// Service 함수
// ---------------------------------------------------------------------------

/**
 * 대회 목록 (공개) — tournaments/page.tsx, 홈페이지에서 사용
 */
export async function listTournaments(filters: TournamentListFilters = {}) {
  const { status, cities, divisions, gender, take = 60, viewerUserId, viewerIsSuperAdmin } = filters;

  // where 조건을 동적으로 구성
  // 2026-05-03: draft + upcoming(접수예정) 제외 — 접수예정은 프리미엄 기능 큐로 보류
  const where: Record<string, unknown> = {
    status:
      status && status !== "all"
        ? status
        : { notIn: ["draft", "upcoming"] },
  };

  // 공개 여부 필터 — super_admin이 아닌 경우에만 적용
  // 비공개 대회(is_public=false)는 관계자(organizer/adminMember)인 경우에만 포함
  if (!viewerIsSuperAdmin) {
    const visibilityOr: unknown[] = [{ is_public: true }];
    if (viewerUserId !== undefined) {
      visibilityOr.push({ organizerId: viewerUserId });
      visibilityOr.push({
        adminMembers: { some: { userId: viewerUserId, isActive: true } },
      });
    }
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
      { OR: visibilityOr },
    ];
  }

  // 맞춤 지역(cities) 필터: 선택한 지역이거나 지역이 아직 미정(null)인 대회도 포함
  // AND로 감싸서 status 조건과 충돌하지 않도록 한다
  if (cities && cities.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
      {
        OR: [
          // 각 도시명에 대해 부분 매칭 (예: "서울" → "서울특별시" 매칭)
          ...cities.map(c => ({ city: { contains: c, mode: "insensitive" as const } })),
          { city: null },
        ],
      },
    ];
  }

  // 맞춤 종별(divisions) 필터: division_tiers 기준으로 교집합 매칭
  // preferred_divisions에는 "D3", "D7" 등 코드가 저장되고,
  // 대회의 division_tiers 필드에도 동일한 코드가 저장됨 (divisions 필드는 한국어 텍스트라 불일치)
  // division_tiers가 비어있거나 null인 대회도 포함 (아직 설정 안 된 대회)
  if (divisions && divisions.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
      {
        OR: [
          // division_tiers 배열에 선택한 코드 중 하나라도 포함된 대회
          ...divisions.map((div) => ({
            division_tiers: { path: [], array_contains: div },
          })),
          // division_tiers가 비어있거나 설정되지 않은 대회도 포함
          { division_tiers: { equals: [] } },
          { division_tiers: { equals: null } },
        ],
      },
    ];
  }

  // 맞춤 성별 필터: 선택한 성별이거나 성별이 아직 미정(null)인 대회도 포함
  if (gender && gender.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
      {
        OR: [
          { gender: { in: gender, mode: "insensitive" } },
          { gender: null },
        ],
      },
    ];
  }

  // 2026-05-03: 진행중 대회 최상단 우선 정렬 (사용자 요청).
  // Prisma orderBy 는 status priority 직접 미지원 → 메모리 정렬로 처리.
  // 1순위: status=in_progress (진행중) → 0
  // 2순위: status=registration_open (접수중) → 1
  // 3순위: 나머지 → 2
  // 같은 priority 안에서는 startDate desc.
  const rows = await prisma.tournament.findMany({
    where,
    take,
    select: TOURNAMENT_LIST_SELECT,
  });
  const priority = (s: string | null | undefined): number => {
    if (s === "in_progress") return 0;
    if (s === "registration_open") return 1;
    return 2;
  };
  rows.sort((a, b) => {
    const pa = priority(a.status);
    const pb = priority(b.status);
    if (pa !== pb) return pa - pb;
    const ta = a.startDate?.getTime() ?? 0;
    const tb = b.startDate?.getTime() ?? 0;
    return tb - ta;
  });
  return rows;
}

/**
 * 홈페이지용 다가오는 대회 (active/published/registration_open)
 */
export async function listUpcomingTournaments(take = 4) {
  return prisma.tournament.findMany({
    // 2026-05-15 — `in_progress` 추가 (home.ts L451 hero slide 와 정합).
    // 이전 박제는 진행 중 대회를 다가오는 대회 리스트에서 누락 → 강남구
    // 협회장배 유소년 대회 (5/16 시작, status=in_progress) 메인 미노출 사고.
    where: { is_public: true, status: { in: ["active", "published", "registration_open", "in_progress"] } },
    orderBy: { startDate: "asc" },
    take,
    select: TOURNAMENT_HOME_SELECT,
  });
}

/**
 * 대회 상세 조회 (관리자용 — include 포함)
 */
export async function getTournament(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: TOURNAMENT_DETAIL_INCLUDE,
  });
}

/**
 * 내 대회 목록 — 주최자 / admin member / 기록원 통합
 * hasAllAccess (super_admin / recorder_admin) 이면 모든 대회를 가져온다.
 *
 * 2026-05-16 — recorder_admin 흡수 (PR-RecorderAdmin-MyTournaments)
 *   기존: isSuperAdmin boolean 1개 → super_admin 만 모든 대회 노출
 *   신규: hasAllAccess boolean 1개 → super_admin OR recorder_admin 모두 모든 대회 노출
 *   호출처: `getMyTournaments(userId, isSuperAdmin(payload) || isRecorderAdmin(payload))`
 */
export async function getMyTournaments(
  userId: bigint,
  hasAllAccess: boolean
): Promise<MyTournamentItem[]> {
  // 1. 주최자로 만든 대회
  const ownedTournaments = await prisma.tournament.findMany({
    where: hasAllAccess ? {} : { organizerId: userId },
    select: MY_TOURNAMENT_SELECT,
    orderBy: { startDate: "desc" },
  });

  const resultMap = new Map<string, MyTournamentItem>(
    ownedTournaments.map((t) => [
      t.id,
      toMyTournamentItem(t, "organizer", true),
    ])
  );

  if (!hasAllAccess) {
    // 2. admin member로 등록된 대회
    const adminMembers = await prisma.tournamentAdminMember.findMany({
      where: { userId, isActive: true },
      include: { tournament: { select: MY_TOURNAMENT_SELECT } },
    });

    for (const m of adminMembers) {
      if (!resultMap.has(m.tournament.id)) {
        resultMap.set(
          m.tournament.id,
          toMyTournamentItem(
            m.tournament,
            m.role,
            m.role === "admin" || m.role === "editor"
          )
        );
      }
    }

    // 3. 기록원으로 배정된 대회
    const recorderAssignments = await prisma.tournament_recorders.findMany({
      where: { recorderId: userId, isActive: true },
      include: { tournament: { select: MY_TOURNAMENT_SELECT } },
    });

    for (const r of recorderAssignments) {
      if (!resultMap.has(r.tournament.id)) {
        resultMap.set(
          r.tournament.id,
          toMyTournamentItem(r.tournament, "recorder", false)
        );
      }
    }
  }

  const items = Array.from(resultMap.values());
  if (items.length === 0) return items;

  const completedCounts = await prisma.tournamentMatch.groupBy({
    by: ["tournamentId"],
    where: {
      tournamentId: { in: items.map((item) => item.id) },
      status: "completed",
    },
    _count: { _all: true },
  });
  const completedCountByTournament = new Map(
    completedCounts.map((row) => [row.tournamentId, row._count._all]),
  );

  return items.map((item) => ({
    ...item,
    completed_match_count: completedCountByTournament.get(item.id) ?? 0,
  }));
}

/**
 * 대회 생성
 *
 * 2026-05-12 Phase B 정합성 가드 — seriesId 입력 시 tournament_series.tournaments_count +1 통합.
 * 카운터 동기화는 $transaction 으로 원자적 처리 (대회 생성 또는 카운터 증가 둘 중 하나라도 실패 시
 * 전체 롤백 — 운영 카운터 stale 사고 차단).
 */
export async function createTournament(input: CreateTournamentInput) {
  const apiToken = generateApiToken();
  const gameRules = input.gameRules ? normalizeGameRules(input.gameRules) : undefined;

  // tournament.create data — series_id 가 있으면 함께 박제. 권한 검증은 호출자 책임.
  // Unchecked 변형 사용 — series_id (관계 connect 없이 raw FK) 박제 위해.
  const createData: Prisma.TournamentUncheckedCreateInput = {
    name: input.name,
    organizerId: input.organizerId,
    // seriesId null 이면 박제 안 함 (Prisma optional FK 자연 NULL).
    ...(input.seriesId != null ? { series_id: input.seriesId } : {}),
    apiToken,
    format: input.format ?? "single_elimination",
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    primary_color: input.primaryColor || "#E31B23",
    secondary_color: input.secondaryColor || "#E76F51",
    status: "draft",
    // 접수 설정
    description: input.description ?? null,
    registration_start_at: input.registrationStartAt ?? null,
    registration_end_at: input.registrationEndAt ?? null,
    venue_name: input.venueName ?? null,
    venue_address: input.venueAddress ?? null,
    city: input.city ?? null,
    // 대회 관리 확장 필드
    organizer: input.organizer ?? null,
    host: input.host ?? null,
    sponsors: input.sponsors ?? null,
    game_time: input.gameTime ?? null,
    game_ball: input.gameBall ?? null,
    game_method: input.gameMethod ?? null,
    places: input.places ?? undefined,
    // (가) 경기설정 jsonb — 시안 12키 그대로. 미전송 시 {} (스키마 @default 처리).
    ...(gameRules
      ? { game_rules: JSON.parse(JSON.stringify(gameRules)) as Prisma.InputJsonValue }
      : {}),
    // (나) 날짜↔코트 jsonb — [{id,date,court_ids:[]}]. 미전송 시 [] (스키마 @default 처리).
    ...(input.scheduleDates
      ? { schedule_dates: JSON.parse(JSON.stringify(input.scheduleDates)) as Prisma.InputJsonValue }
      : {}),
    gender: input.gender ?? null,
    rules: input.rules ?? input.rules ?? null,
    prize_info: input.prizeInfo ?? null,
    categories: input.categories ?? {},
    div_caps: input.divCaps ?? {},
    div_fees: input.divFees ?? {},
    allow_waiting_list: input.allowWaitingList ?? false,
    waiting_list_cap: input.waitingListCap ?? null,
    entry_fee: input.entryFee ?? 0,
    bank_name: input.bankName ?? null,
    bank_account: input.bankAccount ?? null,
    bank_holder: input.bankHolder ?? null,
    fee_notes: input.feeNotes ?? null,
    maxTeams: input.maxTeams ?? 16,
    team_size: input.teamSize ?? 5,
    roster_min: input.rosterMin ?? 5,
    roster_max: input.rosterMax ?? 12,
    auto_approve_teams: input.autoApproveTeams ?? false,
    // 디자인 템플릿 + 이미지 URL
    design_template: input.designTemplate ?? null,
    logo_url: input.logoUrl ?? null,
    banner_url: input.bannerUrl ?? null,
    // settings JSON — 클라이언트가 보낸 bracket/contact_phone 등을 그대로 저장
    // 빈 객체 기본값은 스키마에서 @default("{}") 처리
    // Prisma Json 타입은 readonly 구조를 요구하므로 JSON round-trip으로 호환 값 변환
    ...(input.settings
      ? { settings: JSON.parse(JSON.stringify(input.settings)) as Prisma.InputJsonValue }
      : {}),
  };

  const divisionRuleSeeds = buildDivisionRuleSeedsFromCategories({
    categories: input.categories,
    divFees: input.divFees,
    entryFee: input.entryFee ?? 0,
    format: input.format ?? "single_elimination",
  });

  // 대회 생성과 종별 운영 룰 생성을 한 트랜잭션으로 묶어 반쪽 생성 상태를 막는다.
  const tournament = await prisma.$transaction(async (tx) => {
    const created = await tx.tournament.create({ data: createData });

    if (divisionRuleSeeds.length > 0) {
      await tx.tournamentDivisionRule.createMany({
        data: divisionRuleSeeds.map((rule) => ({
          ...rule,
          tournamentId: created.id,
        })),
      });
    }

    if (input.seriesId != null) {
        await tx.tournament_series.update({
          where: { id: input.seriesId },
          data: { tournaments_count: { increment: 1 } },
        });
    }

    return created;
  });

  // 서브도메인이 있으면 TournamentSite 생성
  if (input.subdomain) {
    await prisma.tournamentSite.create({
      data: {
        tournamentId: tournament.id,
        subdomain: input.subdomain,
        isPublished: false,
        primaryColor: input.primaryColor || "#E31B23",
        secondaryColor: input.secondaryColor || "#E76F51",
      },
    });
  }

  return tournament;
}

/**
 * 대회 수정
 */
export async function updateTournament(id: string, data: UpdateTournamentData) {
  return prisma.tournament.update({
    where: { id },
    data,
  });
}

/**
 * 구독 검증 — 대회 생성 권한이 있는지 확인
 * true이면 생성 가능, false이면 구독 필요
 */
export async function hasCreatePermission(userId: bigint): Promise<boolean> {
  const sub = await prisma.user_subscriptions.findFirst({
    where: {
      user_id: userId,
      feature_key: "tournament_create",
      ...usableSubscriptionWhere(),
    },
  });
  return !!sub;
}

/**
 * 전체 데이터 다운로드 (Flutter 오프라인 동기화)
 */
export async function getTournamentFullData(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) return null;

  const [teams, players, matches, playerStats] = await Promise.all([
    prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: {
        team: {
          select: { name: true, primaryColor: true, secondaryColor: true },
        },
      },
    }),
    prisma.tournamentTeamPlayer.findMany({
      where: { tournamentTeam: { tournamentId } },
      // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
      include: { users: { select: { nickname: true, name: true } } },
    }),
    prisma.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.matchPlayerStat.findMany({
      where: { tournamentMatch: { tournamentId } },
    }),
  ]);

  return { tournament, teams, players, matches, playerStats };
}

/**
 * 대회 접근 권한 확인 — 주최자 / admin member / 기록원
 *
 * 2026-05-16 — recorder_admin 흡수 (PR-RecorderAdmin-FullData)
 *   - hasGlobalAccess=true 이면 DB 조회 0 으로 즉시 통과 (super_admin / recorder_admin 자동 흡수)
 *   - false 또는 미전달 시 기존 DB 검증 (organizer / TAM / recorder)
 *   - 호출처: `hasAccessToTournament(id, userId, isSuperAdmin(payload) || isRecorderAdmin(payload))`
 */
export async function hasAccessToTournament(
  tournamentId: string,
  userId: bigint,
  hasGlobalAccess = false
): Promise<boolean> {
  // 신규: super_admin / recorder_admin 등 전역 접근 권한자는 DB 조회 0 으로 즉시 통과
  if (hasGlobalAccess) return true;

  const [isOrganizer, adminMember, isRecorder] = await Promise.all([
    prisma.tournament.findFirst({
      where: { id: tournamentId, organizerId: userId },
    }),
    prisma.tournamentAdminMember.findFirst({
      where: { tournamentId, userId, isActive: true },
    }),
    prisma.tournament_recorders.findFirst({
      where: { tournamentId, recorderId: userId, isActive: true },
    }),
  ]);
  return !!(isOrganizer || adminMember || isRecorder);
}

````

### File: src/lib/validation/tournament.ts

````ts
import { z } from "zod";

export const subdomainCheckSchema = z.object({
  name: z
    .string()
    .min(3, "최소 3자 이상")
    .max(30, "최대 30자")
    .regex(/^[a-z0-9-]+$/, "영문 소문자, 숫자, 하이픈만 사용 가능"),
});

export type SubdomainCheckInput = z.infer<typeof subdomainCheckSchema>;

// 대회 수정 스키마 — 모든 필드 optional (partial update)
export const updateTournamentSchema = z
  .object({
    name: z.string().trim().min(1, "대회명을 입력하세요").max(100, "대회명은 100자 이하여야 합니다"),
    format: z.string(),
    // 빈 문자열("")도 허용 — datetime-local 입력 초기화 시 빈 문자열이 올 수 있음
    startDate: z.string().nullable().or(z.literal("")),
    endDate: z.string().nullable().or(z.literal("")),
    // 운영 DB legacy status 모두 허용 (tournament-status.ts §TOURNAMENT_STATUS_LABEL 정합)
    // 사유: 운영 대회는 published / registration / active / live 등 legacy 값 박혀있음.
    //   wizard 가 운영 status 를 그대로 PATCH 전송 → enum mismatch 422 차단. 단일 source 통일 (4종 매핑) 은 별 PR.
    status: z.enum([
      // 준비중
      "draft",
      "upcoming",
      // 접수중
      "registration",
      "registration_open",
      "active",
      "published",
      "open",
      "opening_soon",
      "registration_closed",
      // 진행중
      "in_progress",
      "live",
      "ongoing",
      "group_stage",
      // 종료
      "completed",
      "ended",
      "closed",
      "cancelled",
    ]),
    venue_name: z.string().nullable(),
    venue_address: z.string().nullable(),
    city: z.string().nullable(),
    district: z.string().nullable(),
    maxTeams: z.number().int().min(1, "최대 팀 수는 1 이상이어야 합니다"),
    team_size: z.number().int().min(1),
    roster_min: z.number().int().min(1),
    roster_max: z.number().int().min(1),
    entry_fee: z.number().min(0, "참가비는 0 이상이어야 합니다"),
    // 빈 문자열("")도 허용 — datetime-local 입력 초기화 시 빈 문자열이 올 수 있음
    registration_start_at: z.string().nullable().or(z.literal("")),
    registration_end_at: z.string().nullable().or(z.literal("")),
    description: z.string().max(5000, "설명은 5000자 이하여야 합니다").nullable(),
    rules: z.string().nullable(),
    prize_info: z.string().nullable(),
    is_public: z.boolean(),
    auto_approve_teams: z.boolean(),
    primary_color: z.string().nullable(),
    secondary_color: z.string().nullable(),
    // 접수 설정
    categories: z.record(z.string(), z.union([z.array(z.string()), z.boolean()])),
    div_caps: z.record(z.string(), z.number().int().min(0)),
    div_fees: z.record(z.string(), z.number().min(0)),
    allow_waiting_list: z.boolean(),
    waiting_list_cap: z.number().int().positive().nullable(),
    bank_name: z.string().nullable(),
    bank_account: z.string().nullable(),
    bank_holder: z.string().nullable(),
    fee_notes: z.string().nullable(),
    // 새 필드: 주최/주관/후원/성별/경기설정/장소
    organizer: z.string().nullable(),
    host: z.string().nullable(),
    sponsors: z.string().nullable(),
    gender: z.string().nullable(),
    game_time: z.string().nullable(),
    game_ball: z.string().nullable(),
    game_method: z.string().nullable(),
    game_rules: z.record(z.string(), z.unknown()).optional(),
    places: z.array(z.object({
      id: z.string().optional(),
      name: z.string(),
      address: z.string().optional(),
      region: z.string().optional(),
      courtCount: z.number().int().min(1).optional(),
      court_count: z.number().int().min(1).optional(),
      naming: z.enum(["num", "alpha"]).optional(),
      provider: z.enum(["kakao", "google"]).optional(),
      placeId: z.string().optional(),
      place_id: z.string().optional(),
      lat: z.number().finite().optional(),
      lng: z.number().finite().optional(),
      phone: z.string().optional(),
      category: z.string().optional(),
      mapUrl: z.string().optional(),
      map_url: z.string().optional(),
      routeUrl: z.string().optional(),
      route_url: z.string().optional(),
    })).nullable(),
    schedule_dates: z.array(z.object({
      id: z.string(),
      date: z.string(),
      court_ids: z.array(z.string()),
    })).nullable(),
    // 디자인 템플릿 + 이미지 URL
    design_template: z.enum(["basic", "poster", "logo", "photo"]).nullable(),
    logo_url: z.string().url().nullable().or(z.literal("")).or(z.null()),
    banner_url: z.string().url().nullable().or(z.literal("")).or(z.null()),
    court_bg_url: z.string().url().nullable().or(z.literal("")).or(z.null()),
    // settings JSON — contact_phone 등 부가 설정을 담는 범용 필드
    settings: z.record(z.string(), z.unknown()).optional(),
    // 소속 시리즈 — 운영자가 사후에 대회를 시리즈에 연결/분리할 수 있도록 PATCH 지원.
    // 이유: 기존엔 대회 생성 시 series_id 가 고정되어 운영자 셀프서비스로 단체 events 노출이 불가.
    // 값 의미: 문자열 ID = 해당 시리즈로 변경 / null = 분리 (모든 status 허용) / undefined = 무변경.
    // BigInt 변환은 route 핸들러에서 처리 (z.string 은 numeric 검증만 하지 않음 — DB 조회로 존재 검증).
    series_id: z.union([z.string(), z.null()]).optional(),
  })
  .partial()
  .refine(
    (data) => {
      if (data.roster_min !== undefined && data.roster_max !== undefined) {
        return data.roster_min <= data.roster_max;
      }
      return true;
    },
    { message: "최소 로스터 수가 최대 로스터 수보다 클 수 없습니다", path: ["roster_min"] }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: "시작일이 종료일보다 늦을 수 없습니다", path: ["startDate"] }
  );

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;

````
