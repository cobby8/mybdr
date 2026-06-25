export type VenueNavigationTarget = {
  name?: string | null;
  address?: string | null;
  region?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  mapUrl?: string | null;
  map_url?: string | null;
  routeUrl?: string | null;
  route_url?: string | null;
};

export type VenueNavigationLinks = {
  label: string;
  address: string;
  mapUrl: string | null;
  routeUrl: string | null;
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeCoordinate(value: unknown): number | undefined {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export function kakaoMapUrl(name: string, lat: number, lng: number): string {
  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
}

export function kakaoRouteUrl(name: string, lat: number, lng: number): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
}

export function kakaoSearchUrl(query: string): string {
  return `https://map.kakao.com/?q=${encodeURIComponent(query)}`;
}

export function resolveVenueNavigation(
  target: VenueNavigationTarget,
): VenueNavigationLinks {
  const rawLabel = cleanText(target.name);
  const label = rawLabel || "경기장";
  const address = cleanText(target.address) || cleanText(target.region);
  const lat = normalizeCoordinate(target.lat);
  const lng = normalizeCoordinate(target.lng);
  const mapUrl =
    cleanText(target.mapUrl) ||
    cleanText(target.map_url) ||
    (lat !== undefined && lng !== undefined ? kakaoMapUrl(label, lat, lng) : null);
  const routeUrl =
    cleanText(target.routeUrl) ||
    cleanText(target.route_url) ||
    (lat !== undefined && lng !== undefined
      ? kakaoRouteUrl(label, lat, lng)
      : rawLabel || address
        ? kakaoSearchUrl([rawLabel, address].filter(Boolean).join(" "))
        : null);

  return { label, address, mapUrl, routeUrl };
}
