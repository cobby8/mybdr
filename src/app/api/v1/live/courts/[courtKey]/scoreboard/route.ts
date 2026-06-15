import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { decodeCourtKey, verifyReadKey } from "@/lib/live/court-key";
import { resolveLiveMatch } from "@/lib/live/resolve-live-match";

/**
 * GET /api/v1/live/courts/:courtKey/scoreboard?key=<hmac>
 *
 * 오버레이(OBS 브라우저소스) → 서버 읽기. **공개 라우트**(헤더 인증 없음).
 * - 보호: ?key= HMAC(courtKey 서명). OBS 브라우저소스는 헤더 주입 불가 → URL 쿼리 토큰.
 * - resolve: courtKey 디코딩 → 그 코트의 in_progress 매치 1건 → live_scoreboards.payload.
 *
 * 응답:
 *   200 payload(JSON 통짜 — camelCase 보존, snake 변환 우회)  [+ ambiguous:true 동시2경기]
 *   204 No Content  — 라이브 매치 없음(쉬는시간) 또는 payload 아직 push 안 됨 → 오버레이 투명/숨김
 *   400 courtKey 형식 오류
 *   403 key 불일치
 *
 * CORS: 이 GET/OPTIONS 응답에만 Access-Control-Allow-Origin: * 부착(읽기 전용·key 보호).
 *   (POST·key 발급은 단일 origin/JWT 유지 — next.config 에서 이 경로만 * 로 오버라이드)
 */

// 공개·읽기 전용 CORS 헤더(이 라우트 응답에 직접 부착)
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // 폴링이라 절대 캐시 금지
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

function emptyResponse(status: number) {
  // 204/40x 빈 본문 응답에도 CORS 헤더는 부착(오버레이 fetch 가 cross-origin)
  return new NextResponse(null, { status, headers: CORS_HEADERS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courtKey: string }> }
) {
  try {
    const { courtKey } = await params;

    // 1) courtKey 디코딩
    const parts = decodeCourtKey(courtKey);
    if (!parts) return emptyResponse(400);

    // 2) key(HMAC) 검증 — timing-safe
    const key = req.nextUrl.searchParams.get("key") ?? "";
    if (!verifyReadKey(courtKey, key)) return emptyResponse(403);

    // 3) 그 코트의 in_progress 매치 resolve
    const resolved = await resolveLiveMatch(parts);
    if (!resolved) return emptyResponse(204); // 쉬는시간 → 투명

    // 4) 해당 매치의 최신 payload 조회
    const row = await prisma.liveScoreboard.findUnique({
      where: { matchId: resolved.matchId },
      select: { payload: true },
    });
    if (!row || row.payload === null) return emptyResponse(204); // 아직 push 없음

    // ★payload 를 그대로 반환(camelCase 보존·snake 변환 우회).
    //   동시 2경기면 ambiguous 메타를 합쳐 운영 경고(오버레이는 무시 가능).
    const payloadObj =
      typeof row.payload === "object" && row.payload !== null && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {};
    const out = resolved.ambiguous ? { ...payloadObj, ambiguous: true } : payloadObj;

    return NextResponse.json(out, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error("[GET /api/v1/live/courts/[courtKey]/scoreboard]", err);
    return emptyResponse(500);
  }
}

// CORS 프리플라이트
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
