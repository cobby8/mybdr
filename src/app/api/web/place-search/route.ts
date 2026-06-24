import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { kakaoMapUrl, kakaoRouteUrl } from "@/lib/maps/navigation-links";

interface CacheEntry {
  results: PlaceResult[];
  expiresAt: number;
}

interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  provider?: "kakao" | "google";
  lat?: number;
  lng?: number;
  phone?: string;
  category?: string;
  map_url?: string;
  route_url?: string;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000;

if (typeof globalThis !== "undefined") {
  const existing = (globalThis as Record<string, unknown>).__placeSearchCacheCleanup;
  if (!existing) {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of searchCache) {
        if (entry.expiresAt < now) searchCache.delete(key);
      }
    }, 5 * 60 * 1000);
    if (interval.unref) interval.unref();
    (globalThis as Record<string, unknown>).__placeSearchCacheCleanup = true;
  }
}

async function searchKakaoPlaces(query: string, apiKey: string): Promise<PlaceResult[] | null> {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "8");
  url.searchParams.set("sort", "accuracy");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });
  if (!res.ok) {
    console.error("[PlaceSearch] Kakao search failed:", res.status);
    return null;
  }

  const data = await res.json();
  return (data.documents ?? [])
    .map((p: {
      id?: string;
      place_name?: string;
      road_address_name?: string;
      address_name?: string;
      x?: string;
      y?: string;
      phone?: string;
      category_name?: string;
      place_url?: string;
    }) => {
      const name = p.place_name?.trim() ?? "";
      const address = (p.road_address_name || p.address_name || "").trim();
      const lat = Number(p.y);
      const lng = Number(p.x);
      const hasCoordinate = Number.isFinite(lat) && Number.isFinite(lng);

      return {
        place_id: p.id ?? `${name}:${address}`,
        provider: "kakao" as const,
        name,
        address,
        lat: hasCoordinate ? lat : undefined,
        lng: hasCoordinate ? lng : undefined,
        phone: p.phone || undefined,
        category: p.category_name || undefined,
        map_url: p.place_url || (hasCoordinate ? kakaoMapUrl(name, lat, lng) : undefined),
        route_url: hasCoordinate ? kakaoRouteUrl(name, lat, lng) : undefined,
      };
    })
    .filter((p: PlaceResult) => p.name);
}

async function searchGooglePlaces(query: string, apiKey: string): Promise<PlaceResult[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "ko");
  url.searchParams.set("components", "country:kr");
  url.searchParams.set("types", "establishment");

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error("[PlaceSearch] Google autocomplete failed:", res.status);
    return [];
  }

  const data = await res.json();
  return (data.predictions ?? []).slice(0, 5).map((p: {
    place_id: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
    description?: string;
  }) => ({
    place_id: p.place_id,
    provider: "google" as const,
    name: p.structured_formatting?.main_text ?? p.description ?? "",
    address: p.structured_formatting?.secondary_text ?? "",
  }));
}

export async function GET(request: NextRequest) {
  const kakaoRestKey = process.env.KAKAO_REST_API_KEY ?? process.env.KAKAO_CLIENT_ID;
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!kakaoRestKey && !googleApiKey) return NextResponse.json({ results: [] });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await checkRateLimit(
    `place-search:${ip}`,
    { maxRequests: 30, windowMs: RATE_LIMITS.api.windowMs },
  );
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests", results: [] },
      { status: 429 },
    );
  }

  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query || query.length < 2 || query.length > 100) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(
      { results: cached.results },
      { headers: { "Cache-Control": "public, max-age=1800" } },
    );
  }

  try {
    const results =
      (kakaoRestKey ? await searchKakaoPlaces(query, kakaoRestKey) : null) ??
      (googleApiKey ? await searchGooglePlaces(query, googleApiKey) : []);

    searchCache.set(cacheKey, { results, expiresAt: Date.now() + CACHE_TTL });

    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, max-age=1800" } },
    );
  } catch (error) {
    console.error("[PlaceSearch] Error:", error);
    return NextResponse.json({ results: [] });
  }
}
