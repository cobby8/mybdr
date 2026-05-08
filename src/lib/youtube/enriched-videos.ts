/**
 * 2026-05-09 — YouTube BDR uploads 영상 fetcher (단일 source).
 *
 * 도메인 컨텍스트 (Dev/live-youtube-embed-2026-05-09.md §3, §7):
 *   - BDR 채널의 최근 150건 (uploads playlist 3 페이지) 영상 메타 일괄 조회.
 *   - playlistItems(쿼터 1) + videos(쿼터 1) 2-step → search API(쿼터 100) 회피로 quota 99% 절약.
 *   - Redis 캐시 (서버리스 인스턴스 간 공유) + 인메모리 캐시 2단 구조.
 *   - 라이브 진행 중이면 TTL 5분 (실시간성), VOD 만이면 30분.
 *
 * 사용처:
 *   - GET /api/web/youtube/recommend — 홈 추천 영상 carousel
 *   - GET /api/web/tournaments/[id]/matches/[matchId]/youtube-stream/search — 매치 자동 검색 (PR2)
 *
 * 추출 사유:
 *   기존 recommend route 내부에 module-level 캐시 + 헬퍼 함수가 있어 search 라우트에서 재사용 불가.
 *   별도 lib 로 추출하면 두 라우트가 같은 캐시 (인메모리 + Redis) 를 공유 → quota / API call 추가 0.
 */

import { Redis } from "@upstash/redis";

// --- Redis 캐시 설정 ---
// Upstash Redis: 서버리스 인스턴스 간 캐시 공유용
// 환경변수 미설정 시 null -> 인메모리 캐시로 fallback
const hasRedisConfig =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (!hasRedisConfig) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisClient;
}

// Redis 캐시 키 (recommend route 와 동일 — 캐시 공유)
const REDIS_CACHE_KEY = "mybdr:youtube:enriched";
// Redis TTL: 기본 30분(1800초), 라이브 있으면 5분(300초)
const REDIS_TTL_DEFAULT = 1800;
const REDIS_TTL_LIVE = 300;

// BDR 채널 업로드 재생목록 ID
// channelId UC... → uploads playlist "UU" + channelId.slice(2)
const UPLOADS_PLAYLIST_ID = process.env.BDR_YOUTUBE_UPLOADS_PLAYLIST_ID ?? "";

// 모듈 인메모리 캐시 — 같은 인스턴스 내 즉시 조회용
let cachedResult: EnrichedVideo[] = [];
let cacheTimestamp = 0;
let cacheTTL = 30 * 60 * 1000; // 기본 30분

// 페이지네이션 최대 페이지 수 (50개 x 3페이지 = 최대 150개)
const MAX_PLAYLIST_PAGES = 3;

// 캐시 최대 수명: 1시간 (라이브 여부와 관계없이 강제 갱신)
const CACHE_MAX_AGE = 60 * 60 * 1000;

// --- 타입 정의 ---

interface PlaylistItem {
  snippet: {
    resourceId: { videoId: string };
    title: string;
    description: string;
    thumbnails: { high?: { url: string }; medium?: { url: string } };
    publishedAt: string;
  };
}

interface VideoDetailsItem {
  id: string;
  snippet: {
    liveBroadcastContent: "live" | "upcoming" | "none";
  };
  liveStreamingDetails?: {
    actualStartTime?: string;
    scheduledStartTime?: string;
    activeLiveChatId?: string;
  };
  statistics: {
    viewCount: string;
  };
  contentDetails?: {
    duration: string;
  };
}

// playlistItems + videos API 결과 합본 — 추천/검색 양쪽이 공통 사용
export interface EnrichedVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  liveBroadcastContent: "live" | "upcoming" | "none";
  viewCount: number;
  duration: string; // ISO 8601 (예: "PT54M40S", "PT10S")
}

// --- YouTube API 호출 ---

// 1단계: playlistItems API 로 채널 최근 영상 ID 목록 가져오기
// nextPageToken 으로 최대 maxPages 페이지(50개 x 3 = 150개)까지
// Search API(200쿼터) 대신 playlistItems(1쿼터/페이지)로 쿼터 절약.
async function fetchPlaylistItems(apiKey: string, maxPages: number = MAX_PLAYLIST_PAGES): Promise<PlaylistItem[]> {
  if (!UPLOADS_PLAYLIST_ID) {
    console.error("[youtube] BDR_YOUTUBE_UPLOADS_PLAYLIST_ID not configured");
    return [];
  }

  const allItems: PlaylistItem[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${UPLOADS_PLAYLIST_ID}&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ""}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.error("[youtube] PlaylistItems fetch failed (page %d):", page, res.status);
      break; // 실패한 페이지 이후는 포기
    }

    const data = await res.json();
    allItems.push(...(data.items ?? []));

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return allItems;
}

// 2단계: videos API 로 라이브/통계 상세 정보 가져오기 (50건씩 청크)
async function fetchVideoDetails(
  videoIds: string[],
  apiKey: string,
): Promise<VideoDetailsItem[]> {
  if (videoIds.length === 0) return [];

  const ids = videoIds.join(",");
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,statistics,contentDetails&id=${ids}&key=${apiKey}`,
    { signal: AbortSignal.timeout(5000) },
  );
  if (!res.ok) {
    console.error("[youtube] Videos API fetch failed:", res.status);
    return [];
  }
  const data = await res.json();
  return data.items ?? [];
}

/**
 * BDR uploads playlist 의 최근 150건 영상을 풍부한 메타와 함께 반환.
 * 캐시 우선순위: 인메모리(같은 인스턴스) → Redis(서버리스 공유) → YouTube API 직접 호출.
 * 라이브 영상이 있으면 TTL 5분, 없으면 30분.
 *
 * 호출처가 캐시 무효화 필요 시 forceRefresh:true 전달 (현재 미사용 — 대비).
 */
export async function fetchEnrichedVideos(
  apiKey: string,
  options?: { forceRefresh?: boolean },
): Promise<EnrichedVideo[]> {
  const forceRefresh = options?.forceRefresh ?? false;

  // 1) 인메모리 캐시 확인
  if (!forceRefresh) {
    const cacheAge = Date.now() - cacheTimestamp;
    if (cachedResult.length > 0 && cacheAge < cacheTTL && cacheAge < CACHE_MAX_AGE) {
      return cachedResult;
    }
  }

  // 2) Redis 캐시 확인
  const redis = getRedis();
  if (!forceRefresh && redis) {
    try {
      const cached = await redis.get<EnrichedVideo[]>(REDIS_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        // Redis → 인메모리 hydrate
        cachedResult = cached;
        cacheTimestamp = Date.now();
        const hasLive = cached.some((v) => v.liveBroadcastContent === "live");
        cacheTTL = hasLive ? 5 * 60 * 1000 : 30 * 60 * 1000;
        return cached;
      }
    } catch (err) {
      // Redis 장애 시 무시 (graceful degradation)
      console.error("[youtube] Redis get failed, proceeding with API:", err);
    }
  }

  // 3) YouTube API 직접 호출
  const items = await fetchPlaylistItems(apiKey);
  if (items.length === 0) return [];

  // videoId 50개 단위 청크 → 일괄 details
  const videoIds = items.map((item) => item.snippet.resourceId.videoId);
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }
  const details = (
    await Promise.all(chunks.map((chunk) => fetchVideoDetails(chunk, apiKey)))
  ).flat();

  const detailMap = new Map<string, VideoDetailsItem>();
  for (const d of details) {
    detailMap.set(d.id, d);
  }

  // upcoming(예정) 은 시청 불가라 제외
  const enriched: EnrichedVideo[] = [];
  for (const item of items) {
    const vid = item.snippet.resourceId.videoId;
    const detail = detailMap.get(vid);
    const broadcastStatus = detail?.snippet?.liveBroadcastContent ?? "none";

    if (broadcastStatus === "upcoming") continue;

    enriched.push({
      videoId: vid,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.medium?.url ??
        "",
      publishedAt: item.snippet.publishedAt,
      liveBroadcastContent: broadcastStatus,
      viewCount: parseInt(detail?.statistics?.viewCount ?? "0", 10),
      duration: detail?.contentDetails?.duration ?? "PT0S",
    });
  }

  // 라이브 있으면 TTL 단축
  const hasLive = enriched.some((v) => v.liveBroadcastContent === "live");
  cacheTTL = hasLive ? 5 * 60 * 1000 : 30 * 60 * 1000;

  // 인메모리 캐시
  cachedResult = enriched;
  cacheTimestamp = Date.now();

  // Redis 캐시 (fire-and-forget)
  if (redis && enriched.length > 0) {
    const redisTTL = hasLive ? REDIS_TTL_LIVE : REDIS_TTL_DEFAULT;
    redis.set(REDIS_CACHE_KEY, enriched, { ex: redisTTL }).catch((err) => {
      console.error("[youtube] Redis set failed:", err);
    });
  }

  return enriched;
}

/**
 * 단일 video_id 의 메타데이터 조회 (POST 검증용 — 실존 + 라이브 상태).
 * 캐시 데이터에 있으면 재사용, 없으면 /videos API 1회 호출 (쿼터 1).
 *
 * 사용처: POST /youtube-stream — 운영자가 수동 등록한 video_id 가 진짜 존재하는지 검증.
 */
export async function fetchVideoMeta(
  videoId: string,
  apiKey: string,
): Promise<EnrichedVideo | null> {
  // 1) 캐시 hit 체크 (recommend 가 미리 채워둠)
  if (cachedResult.length > 0) {
    const cached = cachedResult.find((v) => v.videoId === videoId);
    if (cached) return cached;
  }

  // 2) /videos API 1회 호출 (쿼터 1)
  const details = await fetchVideoDetails([videoId], apiKey);
  if (details.length === 0) return null;
  const detail = details[0];

  // playlistItems 데이터 없이 응답 — title/description/thumbnail 은 videos snippet 에서 직접 추출 필요.
  // videos 응답에는 snippet.title/description/thumbnails 있음 (확장 호출 필요).
  // 현재 fetchVideoDetails 는 part=snippet 포함하지만 title 안 빼냄 → 보완 호출.
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const data = await res.json();
  const item = (data.items ?? [])[0];
  if (!item) return null;

  const broadcastStatus = detail.snippet?.liveBroadcastContent ?? "none";
  if (broadcastStatus === "upcoming") {
    // upcoming 은 시청 불가지만 등록은 허용 (라이브 시작 전 prewire). 별도 status 처리.
  }

  return {
    videoId,
    title: item.snippet?.title ?? "",
    description: item.snippet?.description ?? "",
    thumbnail:
      item.snippet?.thumbnails?.high?.url ??
      item.snippet?.thumbnails?.medium?.url ??
      "",
    publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
    liveBroadcastContent: broadcastStatus,
    viewCount: parseInt(detail.statistics?.viewCount ?? "0", 10),
    duration: detail.contentDetails?.duration ?? "PT0S",
  };
}

// --- ISO 8601 Duration 파싱 (재사용 export) ---

// YouTube duration 형식(ISO 8601)을 초 단위로 변환
// 예: "PT54M40S" → 3280, "PT1H7M36S" → 4056, "PT10S" → 10
export function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// --- video_id 추출 / 검증 유틸 ---

// YouTube URL 패턴 → video_id 11자 추출
// 지원: youtube.com/watch?v=XXX / youtu.be/XXX / youtube.com/embed/XXX / youtube.com/live/XXX / youtube-nocookie.com/embed/XXX
// video_id 만 직접 입력 (11자) 도 허용.
export function extractVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 직접 입력 — 11자 영숫자/언더스코어/하이픈
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // URL 패턴
  // 1) youtu.be/XXX
  let match = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (match) return match[1];

  // 2) youtube.com/watch?v=XXX (?v= 위치 무관)
  match = trimmed.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (match) return match[1];

  // 3) youtube.com/embed/XXX or youtube-nocookie.com/embed/XXX
  match = trimmed.match(/\/embed\/([A-Za-z0-9_-]{11})/);
  if (match) return match[1];

  // 4) youtube.com/live/XXX (라이브 전용 URL)
  match = trimmed.match(/\/live\/([A-Za-z0-9_-]{11})/);
  if (match) return match[1];

  // 5) youtube.com/shorts/XXX (혹시 모르는 경우 — 일반적으로 리젝트 권장이나 video_id 자체는 유효)
  match = trimmed.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
  if (match) return match[1];

  return null;
}
