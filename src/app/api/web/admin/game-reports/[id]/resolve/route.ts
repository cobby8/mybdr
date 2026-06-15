/**
 * POST /api/web/admin/game-reports/[id]/resolve — 경기 평가(신고) 처리 (S1, 관리자 전용)
 *
 * body: { action: "resolve" | "dismiss", memo?: string, notify?: boolean }
 *
 * - resolve  : status submitted → resolved  (처리 완료)
 * - dismiss  : status submitted → dismissed (반려/기각)
 *
 * 가드: getWebSession + isSuperAdmin → 비통과 403 (Admin Console 콘솔 표준 가드).
 * 검증: Zod (action 화이트리스트 + memo/notify 옵션).
 * 감사: adminLog("game_report.resolve" | "game_report.dismiss", ...).
 *
 * memo 는 game_reports 에 저장 컬럼이 없음(스키마 실측) → adminLog.changesMade 에만 박제(감사 추적용).
 * notify 는 (A) 보류 — 파라미터만 수신, 실제 알림 발송 0. 후속 NotificationType 정비 시 발송.
 *
 * apiSuccess 는 응답 키를 자동 snake_case 변환 → 프론트 접근자도 snake_case (errors.md 2026-04-17).
 * schema 변경 0 / api/v1 미접촉 / status update 외 부수효과 0.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";

type RouteCtx = { params: Promise<{ id: string }> };

// action → 전환 후 status 매핑(화이트리스트). 이 2종 외 값은 Zod 단계에서 거부.
const bodySchema = z.object({
  action: z.enum(["resolve", "dismiss"]),
  memo: z.string().trim().max(2000).optional(),
  notify: z.boolean().optional(), // (A) 보류 — 수신만, 발송 0
});

// action → DB status 매핑
const STATUS_BY_ACTION: Record<"resolve" | "dismiss", string> = {
  resolve: "resolved",
  dismiss: "dismissed",
};

export async function POST(req: NextRequest, { params }: RouteCtx) {
  // ── super_admin 가드(콘솔 표준) ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { id } = await params;
  const reportId = BigInt(id);

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
  const { action, memo } = parsed.data;

  // ── 대상 조회 — submitted 상태만 처리 가능(중복 처리 방어) ──
  const report = await prisma.game_reports.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report) {
    return apiError("존재하지 않는 경기 평가입니다", 404, "NOT_FOUND");
  }
  if (report.status !== "submitted") {
    return apiError(`이미 ${report.status} 상태인 평가입니다`, 400, "INVALID_STATE");
  }

  const nextStatus = STATUS_BY_ACTION[action];

  // ── status 전환 ──
  await prisma.game_reports.update({
    where: { id: reportId },
    data: { status: nextStatus },
  });

  // ── 감사 로그(memo 는 컬럼 부재 → 여기에만 박제) ──
  await adminLog(`game_report.${action}`, "GameReport", {
    resourceId: report.id.toString(),
    description: `경기 평가 ${action === "resolve" ? "처리 완료" : "반려"} #${report.id}`,
    changesMade: { status: nextStatus, memo: memo ?? null },
  });

  // notify === true 라도 (A) 보류 — 발송 0. 후속 NotificationType 정비 시 createNotification 호출 위치.

  return apiSuccess({ id: report.id.toString(), status: nextStatus });
}
