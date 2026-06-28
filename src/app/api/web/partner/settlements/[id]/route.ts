import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * PATCH /api/web/partner/settlements/[id]
 *   파트너 정산 상태 전이 엔드포인트(R6-C 신규 모델 PartnerSettlement 전용).
 *
 * 이유(왜): 협력업체 콘솔에서 본인 파트너의 정산 입금을 확정(paid)/취소(cancelled).
 *          파트너 자가 스코프라 본인 partner 소속만 변경 가능(IDOR 가드). super 는 bypass.
 *
 * 상태 전이: pending → paid(입금완료) / pending → cancelled(취소).
 *           paid 전환 시 paid_at = now().
 *
 * 보안:
 *   - 로그인 필수
 *   - IDOR: settlement.partner_id == 내 활성 파트너 멤버십 partner_id (super bypass)
 */

export const dynamic = "force-dynamic";

// Zod4 — 옵션객체 금지. mutation 타깃 = paid/cancelled.
const patchSchema = z.object({
  status: z.enum(["paid", "cancelled"]),
});

function parseIdParam(idStr: string): bigint | null {
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  const settleId = parseIdParam(id);
  if (settleId === null) {
    return apiError("유효하지 않은 ID입니다.", 400, "BAD_REQUEST");
  }

  // body 파싱 + Zod 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }
  const { status: nextStatus } = parsed.data;

  try {
    const settlement = await prisma.partnerSettlement.findUnique({
      where: { id: settleId },
      select: { id: true, partner_id: true, status: true },
    });
    if (!settlement) {
      return apiError("정산을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // IDOR: super 는 bypass, 그 외엔 본인 활성 파트너 소속만.
    if (!isSuperAdmin(session)) {
      const membership = await prisma.partner_members.findFirst({
        where: {
          user_id: BigInt(session.sub),
          is_active: true,
          partner_id: settlement.partner_id,
        },
        select: { id: true },
      });
      if (!membership) {
        return apiError("이 정산에 접근할 수 없습니다.", 403, "FORBIDDEN");
      }
    }

    // 동일 상태 전이 거부
    if (settlement.status === nextStatus) {
      return apiError("현재 상태와 동일합니다.", 400, "SAME_STATUS");
    }

    // 전이: pending 에서만 paid/cancelled 가능.
    if (settlement.status !== "pending") {
      return apiError(
        "입금 예정(대기) 상태에서만 변경할 수 있습니다.",
        400,
        "INVALID_TRANSITION"
      );
    }

    const updated = await prisma.partnerSettlement.update({
      where: { id: settleId },
      data: {
        status: nextStatus,
        // paid 전환 시에만 입금 완료 시각 기록.
        ...(nextStatus === "paid" ? { paid_at: new Date() } : {}),
      },
      select: { id: true, status: true, paid_at: true, updated_at: true },
    });

    return apiSuccess({
      settlement: updated,
      previous_status: settlement.status,
    });
  } catch (error) {
    console.error("[partner/settlements/[id]] PATCH 실패:", error);
    return apiError("상태 변경에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
