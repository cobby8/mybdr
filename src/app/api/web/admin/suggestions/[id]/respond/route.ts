/**
 * POST /api/web/admin/suggestions/[id]/respond — 건의/제안 처리 응답 (S1, 관리자 전용)
 *
 * body: { status: "in_progress" | "resolved" | "dismissed", admin_response?: string, notify?: boolean }
 *
 * suggestions 행을:
 *   - status            → 요청 상태(3종 화이트리스트)
 *   - admin_response    → 관리자 응답 본문(옵션)
 *   - responded_by_id   → 처리한 관리자(session.sub)
 *   - responded_at      → now
 * 로 갱신.
 *
 * 가드: getWebSession + isSuperAdmin → 비통과 403.
 * 검증: Zod (status 화이트리스트 + admin_response/notify 옵션).
 * 감사: adminLog("suggestion.respond", ...).
 *
 * notify 는 (A) 보류 — 파라미터만 수신, 실제 알림 발송 0. 후속 NotificationType 정비 시 발송.
 * apiSuccess 는 응답 키 자동 snake_case 변환 (errors.md 2026-04-17).
 * schema 변경 0 / api/v1 미접촉.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";

type RouteCtx = { params: Promise<{ id: string }> };

// status 화이트리스트 3종(in_progress/resolved/dismissed). 이 외 값은 Zod 단계에서 거부.
const bodySchema = z.object({
  status: z.enum(["in_progress", "resolved", "dismissed"]),
  admin_response: z.string().trim().max(5000).optional(),
  notify: z.boolean().optional(), // (A) 보류 — 수신만, 발송 0
});

export async function POST(req: NextRequest, { params }: RouteCtx) {
  // ── super_admin 가드(콘솔 표준) ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { id } = await params;
  const suggestionId = BigInt(id);
  const responderId = BigInt(session!.sub); // isSuperAdmin 통과 = session 존재 보장

  // ── Zod 검증 ──
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
  }
  const { status, admin_response } = parsed.data;

  // ── 대상 존재 확인 ──
  const suggestion = await prisma.suggestions.findUnique({
    where: { id: suggestionId },
    select: { id: true },
  });
  if (!suggestion) {
    return apiError("존재하지 않는 건의입니다", 404, "NOT_FOUND");
  }

  const now = new Date();

  // ── 응답 갱신: status + 응답본문 + 처리자/처리시각 ──
  await prisma.suggestions.update({
    where: { id: suggestionId },
    data: {
      status,
      admin_response: admin_response ?? null,
      responded_by_id: responderId,
      responded_at: now,
    },
  });

  // ── 감사 로그 ──
  await adminLog("suggestion.respond", "Suggestion", {
    resourceId: suggestion.id.toString(),
    description: `건의 처리(${status}) #${suggestion.id}`,
    changesMade: { status, admin_response: admin_response ?? null },
  });

  // notify === true 라도 (A) 보류 — 발송 0. 후속 NotificationType 정비 시 createNotification 호출 위치.

  return apiSuccess({ id: suggestion.id.toString(), status });
}
