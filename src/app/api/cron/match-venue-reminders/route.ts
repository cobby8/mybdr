import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import {
  normalizeCoordinate,
  resolveVenueNavigation,
  type VenueNavigationTarget,
} from "@/lib/maps/navigation-links";

type TeamRecipientSource = {
  registered_by_id: bigint | null;
  team: {
    name: string | null;
    captainId: bigint | null;
    manager_id: bigint | null;
  };
  players: Array<{
    userId: bigint | null;
    claimed_user_id: bigint | null;
  }>;
} | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function textFrom(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readPlaceTarget(place: unknown): VenueNavigationTarget | null {
  if (!isRecord(place)) return null;
  const name = textFrom(place.name);
  if (!name) return null;
  return {
    name,
    address: textFrom(place.address) ?? textFrom(place.region),
    lat: normalizeCoordinate(place.lat),
    lng: normalizeCoordinate(place.lng),
    mapUrl: textFrom(place.mapUrl) ?? textFrom(place.map_url),
    routeUrl: textFrom(place.routeUrl) ?? textFrom(place.route_url),
  };
}

function findVenueTarget(
  places: Prisma.JsonValue | null,
  matchVenueName: string | null,
  fallbackVenueName: string | null,
  fallbackVenueAddress: string | null,
): VenueNavigationTarget {
  const placeRows = Array.isArray(places) ? places : [];
  const placeTargets = placeRows
    .map(readPlaceTarget)
    .filter((place): place is VenueNavigationTarget => Boolean(place));
  const venueName = matchVenueName?.trim();
  const matched =
    (venueName
      ? placeTargets.find((place) => {
          const name = place.name?.trim();
          return Boolean(name && (name === venueName || venueName.includes(name)));
        })
      : null) ?? placeTargets[0] ?? null;

  return {
    ...matched,
    name: venueName || matched?.name || fallbackVenueName || null,
    address: matched?.address || fallbackVenueAddress || null,
  };
}

function collectRecipients(source: TeamRecipientSource, recipientIds: Set<bigint>) {
  if (!source) return;
  if (source.registered_by_id) recipientIds.add(source.registered_by_id);
  if (source.team.captainId) recipientIds.add(source.team.captainId);
  if (source.team.manager_id) recipientIds.add(source.team.manager_id);
  for (const player of source.players) {
    if (player.userId) recipientIds.add(player.userId);
    if (player.claimed_user_id) recipientIds.add(player.claimed_user_id);
  }
}

function formatKstDateTime(value: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const now = new Date();
  const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const buffer = 30 * 60 * 1000;
  const windowStart = new Date(threeHoursLater.getTime() - buffer);
  const windowEnd = new Date(threeHoursLater.getTime() + buffer);

  const matches = await prisma.tournamentMatch.findMany({
    where: {
      scheduledAt: { gte: windowStart, lte: windowEnd },
      status: { in: ["scheduled", "ready"] },
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
    select: {
      id: true,
      tournamentId: true,
      scheduledAt: true,
      venue_name: true,
      court_number: true,
      tournament: {
        select: {
          name: true,
          places: true,
          venue_name: true,
          venue_address: true,
        },
      },
      homeTeam: {
        select: {
          registered_by_id: true,
          team: { select: { name: true, captainId: true, manager_id: true } },
          players: {
            where: { is_active: true },
            select: { userId: true, claimed_user_id: true },
          },
        },
      },
      awayTeam: {
        select: {
          registered_by_id: true,
          team: { select: { name: true, captainId: true, manager_id: true } },
          players: {
            where: { is_active: true },
            select: { userId: true, claimed_user_id: true },
          },
        },
      },
    },
  });

  if (matches.length === 0) {
    return apiSuccess({
      success: true,
      notificationsSent: 0,
      matchesProcessed: 0,
      sent_at: now.toISOString(),
    });
  }

  const existing = await prisma.notifications.findMany({
    where: {
      notification_type: NOTIFICATION_TYPES.MATCH_VENUE_REMINDER,
      notifiable_type: "TournamentMatch",
      notifiable_id: { in: matches.map((match) => match.id) },
    },
    select: { user_id: true, notifiable_id: true },
  });
  const sentKeys = new Set(
    existing.map((notification) => `${notification.user_id}:${notification.notifiable_id?.toString()}`),
  );

  const inputs: Parameters<typeof createNotificationBulk>[0] = [];

  for (const match of matches) {
    if (!match.scheduledAt) continue;

    const recipientIds = new Set<bigint>();
    collectRecipients(match.homeTeam, recipientIds);
    collectRecipients(match.awayTeam, recipientIds);
    if (recipientIds.size === 0) continue;

    const venueTarget = findVenueTarget(
      match.tournament.places,
      match.venue_name,
      match.tournament.venue_name,
      match.tournament.venue_address,
    );
    const links = resolveVenueNavigation(venueTarget);
    const actionUrl = links.routeUrl ?? `/tournaments/${match.tournamentId}`;
    const teamLabel = [
      match.homeTeam?.team.name ?? "홈팀",
      match.awayTeam?.team.name ?? "원정팀",
    ].join(" vs ");
    const timeLabel = formatKstDateTime(match.scheduledAt);
    const venueLabel = [links.label, match.court_number].filter(Boolean).join(" ");

    for (const userId of recipientIds) {
      const key = `${userId}:${match.id.toString()}`;
      if (sentKeys.has(key)) continue;
      sentKeys.add(key);
      inputs.push({
        userId,
        notificationType: NOTIFICATION_TYPES.MATCH_VENUE_REMINDER,
        title: "오늘 경기장 길안내",
        content: `${match.tournament.name} · ${timeLabel} · ${venueLabel} · ${teamLabel}`,
        actionUrl,
        actionType: "open_navigation",
        notifiableType: "TournamentMatch",
        notifiableId: match.id,
        metadata: {
          tournament_id: match.tournamentId,
          match_id: match.id.toString(),
          venue_name: links.label,
          venue_address: links.address,
          map_url: links.mapUrl,
          route_url: links.routeUrl,
        },
      });
    }
  }

  if (inputs.length > 0) {
    await createNotificationBulk(inputs);
  }

  return apiSuccess({
    success: true,
    notificationsSent: inputs.length,
    matchesProcessed: matches.length,
    sent_at: now.toISOString(),
  });
}
