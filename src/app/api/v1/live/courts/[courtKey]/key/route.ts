import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError, unauthorized, forbidden } from "@/lib/api/response";
import { extractToken } from "@/lib/api/middleware";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { decodeCourtKey, signCourtKey, getReadSecret } from "@/lib/live/court-key";

/**
 * GET /api/v1/live/courts/:courtKey/key
 *
 * 앱/운영자 → 서버. **JWT 인증**(비공개 — PUBLIC 등록 금지).
 * 해당 courtKey 의 읽기 key(HMAC)를 계산해 오버레이 URL과 함께 반환.
 *
 * 권한: courtKey 안의 tournamentId 로 그 대회의 주최자/기록원(또는 super_admin)인지 확인.
 *   (require-recorder 는 matchId 기반이라 코트키엔 부적합 → 여기선 tournamentId 로 직접 확인)
 *
 * 응답: 200 { court_key, key, url }   (apiSuccess → snake_case 변환됨: courtKey→court_key)
 *   url = 오버레이가 폴링할 전체 경로(쿼리에 key 포함). 운영자가 그대로 OBS 에 붙여 쓰면 됨.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courtKey: string }> }
) {
  try {
    const { courtKey } = await params;

    // 1) JWT 검증
    const token = extractToken(req);
    if (!token) return unauthorized();
    const payload = await verifyToken(token);
    if (!payload) return unauthorized("Token expired or invalid");

    // 2) courtKey 형식 검증 + tournamentId 추출
    const parts = decodeCourtKey(courtKey);
    if (!parts) return apiError("유효하지 않은 코트키입니다.", 400);

    // 3) 대회 권한 확인 (super_admin은 통과)
    if (payload.role !== "super_admin") {
      const userId = BigInt(payload.sub);
      const isOrganizer = await prisma.tournament.findFirst({
        where: { id: parts.tournamentId, organizerId: userId },
        select: { id: true },
      });
      if (!isOrganizer) {
        const recorder = await prisma.tournament_recorders.findFirst({
          where: { tournamentId: parts.tournamentId, recorderId: userId, isActive: true },
          select: { id: true },
        });
        if (!recorder) return forbidden("이 대회의 기록원 권한이 없습니다.");
      }
    }

    // 4) HMAC key 계산 (secret 미설정 시 명확한 에러)
    let key: string;
    try {
      getReadSecret(); // 미설정이면 throw
      key = signCourtKey(courtKey);
    } catch {
      return apiError("서버 설정 오류: SCOREBOARD_READ_SECRET 미설정", 500);
    }

    // 5) 오버레이 폴링 URL 조립 (운영자가 OBS 브라우저소스에 붙임)
    const url = `/api/v1/live/courts/${courtKey}/scoreboard?key=${key}`;

    return apiSuccess({ courtKey, key, url });
  } catch (err) {
    console.error("[GET /api/v1/live/courts/[courtKey]/key]", err);
    return apiError("Internal server error", 500);
  }
}
