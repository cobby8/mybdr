import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

/**
 * Place Photos Batch API — 여러 장소 사진을 한번에 조회
 *
 * 왜 batch API가 필요한가:
 * 기존 place-photo API는 카드 1개당 1번 호출 = 60개 카드면 60번 호출
 * 브라우저 동시 연결 제한(6개)에 걸려 폭포수(waterfall) 현상 발생
 * batch API로 1번 호출에 모든 장소 사진을 한번에 가져오면 극적으로 빨라짐
 *
 * POST /api/web/place-photos
 * Body: { queries: ["강남스포츠", "잠실체육관", ...] }
 * 응답: { results: { "강남스포츠": "photo_url", "잠실체육관": null } }
 */

// --- 인메모리 캐시: 기존 place-photo와 동일한 구조 (1시간 TTL) ---
interface CacheEntry {
  photoUrl: string | null;
  expiresAt: number;
}
const photoCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

// 5분마다 만료된 캐시 정리 (메모리 누수 방지)
if (typeof globalThis !== "undefined") {
  const existing = (globalThis as Record<string, unknown>).__placePhotosBatchCacheCleanup;
  if (!existing) {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of photoCache) {
        if (entry.expiresAt < now) photoCache.delete(key);
      }
    }, 5 * 60 * 1000);
    if (interval.unref) interval.unref();
    (globalThis as Record<string, unknown>).__placePhotosBatchCacheCleanup = true;
  }
}

// 단일 장소 사진 조회 (캐시 확인 → Google API 호출)
async function fetchPlacePhoto(query: string, apiKey: string): Promise<string | null> {
  const cacheKey = query.toLowerCase();

  // 캐시 히트 시 즉시 반환
  const cached = photoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.photoUrl;
  }

  try {
    // 1단계: Google Places Text Search로 장소 검색
    const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("language", "ko");

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      photoCache.set(cacheKey, { photoUrl: null, expiresAt: Date.now() + CACHE_TTL });
      return null;
    }

    const searchData = await searchRes.json();
    const photoRef = searchData.results?.[0]?.photos?.[0]?.photo_reference;

    if (!photoRef) {
      // 사진 없음도 캐시 (불필요한 재조회 방지)
      photoCache.set(cacheKey, { photoUrl: null, expiresAt: Date.now() + CACHE_TTL });
      return null;
    }

    // 2단계: Place Photo URL → redirect 따라가서 최종 URL 획득
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`;
    const photoRes = await fetch(photoUrl, { redirect: "follow" });
    const finalUrl = photoRes.url;

    photoCache.set(cacheKey, { photoUrl: finalUrl, expiresAt: Date.now() + CACHE_TTL });
    return finalUrl;
  } catch {
    photoCache.set(cacheKey, { photoUrl: null, expiresAt: Date.now() + CACHE_TTL });
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ results: {} });
  }

  // Rate limit: 분당 10회 (batch이므로 더 엄격하게)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await checkRateLimit(
    `place-photos-batch:${ip}`,
    { maxRequests: 10, windowMs: RATE_LIMITS.api.windowMs }
  );
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests", results: {} },
      { status: 429 }
    );
  }

  // 요청 바디 파싱
  let queries: string[];
  try {
    const body = await request.json();
    queries = body.queries;
    if (!Array.isArray(queries)) {
      return NextResponse.json({ results: {} });
    }
  } catch {
    return NextResponse.json({ results: {} });
  }

  // 유효한 장소명만 필터 + 중복 제거 (같은 장소를 여러 카드가 참조할 수 있음)
  const uniqueQueries = [...new Set(
    queries
      .filter((q): q is string => typeof q === "string" && q.trim().length >= 2 && q.trim().length <= 100)
      .map((q) => q.trim())
  )];

  // 최대 60개까지만 처리 (과도한 요청 방지)
  const limitedQueries = uniqueQueries.slice(0, 60);

  // 모든 장소를 병렬로 조회 (캐시 히트는 즉시, 미스만 Google API)
  const entries = await Promise.all(
    limitedQueries.map(async (query) => {
      const photoUrl = await fetchPlacePhoto(query, apiKey);
      return [query, photoUrl] as const;
    })
  );

  // 결과를 장소명 -> URL 맵으로 구성
  const results: Record<string, string | null> = {};
  for (const [query, photoUrl] of entries) {
    results[query] = photoUrl;
  }

  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
