/**
 * POST /api/web/push/unsubscribe
 *
 * 푸시 구독을 해제한다.
 * 프론트에서 endpoint를 보내면 해당 구독을 DB에서 삭제한다.
 */
import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError, unauthorized } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  // 1) 인증 확인
  const session = await getWebSession();
  if (!session) return unauthorized("로그인이 필요합니다.");

  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return apiError("endpoint가 필요합니다.", 400, "INVALID_REQUEST");
    }

    // 2) 해당 유저의 구독 삭제 (다른 유저의 구독은 건드리지 않음)
    await prisma.push_subscriptions.deleteMany({
      where: {
        user_id: BigInt(session.sub),
        endpoint,
      },
    });

    return apiSuccess({ unsubscribed: true });
  } catch {
    return apiError("구독 해제에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
