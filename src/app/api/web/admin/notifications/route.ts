/**
 * POST /api/web/admin/notifications — 관리자 알림 발송 API
 *
 * 관리자가 특정 대상(전체 / role별) 유저에게 시스템 알림을 일괄 발송한다.
 * super_admin만 접근 가능.
 *
 * body:
 * - title: string (필수)
 * - content: string (선택)
 * - target: "all" | "user" | "team_leader" | "super_admin" (기본: "all")
 * - action_url: string (선택, 알림 클릭 시 이동할 경로)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  // 관리자 인증 필수
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") {
    return apiError("관리자 권한이 필요합니다", 403, "FORBIDDEN");
  }

  let body: {
    title?: string;
    content?: string;
    target?: string;
    action_url?: string;
  };

  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const { title, content, target = "all", action_url } = body;

  // 제목 필수 검증
  if (!title || title.trim().length === 0) {
    return apiError("알림 제목은 필수입니다.", 400);
  }

  // 발송 대상: all=전체, admin=관리자, active=활성유저
  const validTargets = ["all", "admin", "active"];
  if (!validTargets.includes(target)) {
    return apiError("유효하지 않은 대상입니다.", 400);
  }

  try {
    // 대상 유저 ID 목록 조회 (User 모델에 role 없음, isAdmin으로 구분)
    const where =
      target === "admin"
        ? { isAdmin: true }
        : target === "active"
          ? { status: "active", isAdmin: { not: true } }
          : undefined;
    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (users.length === 0) {
      return apiError("대상 유저가 없습니다.", 404);
    }

    const now = new Date();

    // 알림 데이터 일괄 생성 (createMany로 한 번에 insert)
    const created = await prisma.notifications.createMany({
      data: users.map((u) => ({
        user_id: u.id,
        notification_type: "system.admin_broadcast",
        title: title.trim(),
        content: content?.trim() || null,
        action_url: action_url?.trim() || null,
        status: "unread",
        created_at: now,
        updated_at: now,
      })),
    });

    // 관리자 활동 로그 기록
    await prisma.admin_logs
      .create({
        data: {
          admin_id: BigInt(session.sub),
          action: "notification.broadcast",
          resource_type: "notification",
          description: `"${title.trim()}" 알림을 ${users.length}명에게 발송`,
          severity: "info",
          changes_made: { target, count: users.length },
          created_at: now,
          updated_at: now,
        },
      })
      .catch(() => null);

    return apiSuccess({ sent_count: created.count }, 201);
  } catch (error) {
    console.error("[admin/notifications] POST error:", error);
    return apiError("알림 발송 중 오류가 발생했습니다.", 500);
  }
}
