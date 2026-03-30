/**
 * POST /api/web/push/subscribe
 *
 * 브라우저 푸시 구독 정보를 서버에 저장한다.
 * 프론트에서 PushManager.subscribe()로 받은 구독 객체를 전송하면
 * endpoint, p256dh, auth를 추출해 DB에 upsert한다.
 */
import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError, unauthorized } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  // 1) 인증 확인 — 로그인한 유저만 구독 가능
  const session = await getWebSession();
  if (!session) return unauthorized("로그인이 필요합니다.");

  try {
    const body = await req.json();

    // 2) 구독 객체 검증
    const { endpoint, keys } = body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return apiError("올바르지 않은 구독 정보입니다.", 400, "INVALID_SUBSCRIPTION");
    }

    // 3) upsert — 같은 유저+엔드포인트가 이미 있으면 키만 업데이트
    await prisma.push_subscriptions.upsert({
      where: {
        user_id_endpoint: {
          user_id: BigInt(session.sub),
          endpoint,
        },
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        user_id: BigInt(session.sub),
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return apiSuccess({ subscribed: true }, 201);
  } catch {
    return apiError("구독 저장에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
