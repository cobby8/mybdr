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
          entry_fee: tournament.entry_fee ? Number(tournament.entry_fee) : 0,
          auto_approve_teams: tournament.auto_approve_teams ?? false,
          registration_start_at: toDateTimeInput(tournament.registration_start_at),
          registration_end_at: toDateTimeInput(tournament.registration_end_at),
          organizer: tournament.organizer ?? "",
          host: tournament.host ?? "",
          sponsors: normalizeSponsorDrafts(tournament.sponsors, tournament.settings),
          gender: tournament.gender ?? "",
          game_time: tournament.game_time ?? "",
          game_ball: tournament.game_ball ?? "",
          game_method: tournament.game_method ?? "",
          game_rules: gameRules,
          description: tournament.description ?? "",
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
