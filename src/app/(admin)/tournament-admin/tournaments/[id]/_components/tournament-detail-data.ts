import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";
import { calculateSetupProgress, canPublish } from "@/lib/tournaments/setup-status";
import {
  getTournamentDefaultMode,
  getTournamentMatchStats,
} from "@/lib/tournaments/recording-mode";
import { normalizeGameRules } from "@/lib/tournaments/game-rules";
import { countCategoryDivisions } from "@/lib/tournaments/division-rule-sync";
import { normalizeSponsors } from "@/lib/utils/sponsors";
import type { DateRow, Venue } from "../../new/wizard/_components/ct-schedule-venue";
import type {
  SetupFormState,
  StatusTone,
  TournamentWorkspaceProps,
} from "./TournamentWorkspace";

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

function normalizeSponsorDrafts(sponsors: unknown, settings: unknown): SetupFormState["sponsors"] {
  // sponsors 컬럼을 형태 무관하게 읽어 이름 배열로 변환(현재 콤마 String 기준 기존과 동일).
  //   하류는 string[]("names")를 기대하고 아래에서 push 도 하므로 .map(s=>s.name) 으로 맞춘다.
  const names = normalizeSponsors(sponsors).map((s) => s.name);
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
    naming: "num",
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

export async function getTournamentWorkspaceProps(
  id: string,
  redirectPath = `/tournament-admin/tournaments/${id}`,
): Promise<TournamentWorkspaceProps> {
  const session = await getWebSession();
  if (!session) redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);

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

  return {
    tournamentId: id,
    progress,
    publishGate,
    matchStats,
    defaultRecordingMode: defaultMode,
    setup: {
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
    },
    summary: {
      statusLabel: TOURNAMENT_STATUS_LABEL[status] ?? status,
      statusTone: STATUS_TONE[status] ?? "mute",
      teamCount: tournament._count.tournamentTeams,
      maxTeams: tournament.maxTeams,
      matchCount: tournament._count.tournamentMatches,
      divisionCount,
      siteConfigured: !!site,
      sitePublished: !!site?.isPublished,
      siteSubdomain: site?.subdomain ?? null,
    },
  };
}
