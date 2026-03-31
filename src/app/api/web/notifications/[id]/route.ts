/**
 * DELETE /api/web/notifications/[id] — 알림 개별 삭제 API
 *
 * 로그인한 유저가 자신의 알림 1건을 삭제한다.
 * IDOR 방지: 반드시 해당 알림의 user_id가 세션 유저와 일치하는지 검증.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401);
  }

  const { id } = await params;
  const notifId = BigInt(id);

  try {
    // 해당 알림이 존재하고 본인 소유인지 확인
    const notification = await prisma.notifications.findUnique({
      where: { id: notifId },
      select: { user_id: true },
    });

    if (!notification) {
      return apiError("알림을 찾을 수 없습니다.", 404);
    }

    // IDOR 방지: 본인 알림만 삭제 가능
    if (notification.user_id.toString() !== session.sub) {
      return apiError("삭제 권한이 없습니다.", 403);
    }

    await prisma.notifications.delete({ where: { id: notifId } });

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("[notifications/delete] error:", error);
    return apiError("알림 삭제 중 오류가 발생했습니다.", 500);
  }
}
