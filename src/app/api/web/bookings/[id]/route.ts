/* ============================================================
 * /api/web/bookings/[id] — 단일 예약 조회/취소 (Phase A)
 *
 * GET    : 본인 예약 상세 (또는 운영자가 자기 코트 예약 조회)
 * DELETE : 예약 취소 (예약자 본인 OR 해당 코트 운영자)
 *
 * 권한:
 *   - 예약자 본인 → 자기 예약 모두 조회/취소 가능
 *   - 코트 운영자 → 자기 코트의 모든 예약 조회/취소 가능 (강제 취소 + 사유 기록)
 *
 * Phase A 환불: 운영자 수동(D-B6=b) → status="cancelled" + cancellation_reason 기록만
 *               실제 PG 환불은 Phase C 자동화 도입 시 추가
 * ============================================================ */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { isCourtManager } from "@/lib/courts/court-manager-guard";

// 취소 요청 스키마
const CancelSchema = z.object({
  reason: z.string().max(200).optional(),
});

// 예약 + 권한 컨텍스트 조회 (재사용)
async function loadBookingWithPermission(
  bookingId: bigint,
  userId: bigint
): Promise<
  | { ok: true; booking: NonNullable<Awaited<ReturnType<typeof findBooking>>>; isOwner: boolean; isManager: boolean }
  | { ok: false; status: number; code: string; message: string }
> {
  const booking = await findBooking(bookingId);
  if (!booking) {
    return { ok: false, status: 404, code: "NOT_FOUND", message: "존재하지 않는 예약입니다" };
  }
  const isOwner = booking.user_id === userId;
  // 본인 예약이 아닐 때만 운영자 검사 (DB 쿼리 절약)
  const isManager = isOwner ? false : await isCourtManager(userId, booking.court_info_id);
  if (!isOwner && !isManager) {
    return { ok: false, status: 403, code: "FORBIDDEN", message: "이 예약을 처리할 권한이 없습니다" };
  }
  return { ok: true, booking, isOwner, isManager };
}

async function findBooking(bookingId: bigint) {
  return prisma.court_bookings.findUnique({
    where: { id: bookingId },
    include: {
      court: { select: { id: true, name: true, address: true, city: true, district: true } },
      user: { select: { id: true, nickname: true, name: true } },
    },
  });
}

// ─────────────────────────────────────────────
// GET — 단일 예약 조회
// ─────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError("유효하지 않은 예약 ID입니다", 400);
  const bookingId = BigInt(id);
  const userId = BigInt(session.sub);

  const result = await loadBookingWithPermission(bookingId, userId);
  if (!result.ok) return apiError(result.message, result.status, result.code);

  const b = result.booking;
  return apiSuccess({
    booking: {
      id: b.id.toString(),
      start_at: b.start_at.toISOString(),
      end_at: b.end_at.toISOString(),
      duration_hours: b.duration_hours,
      purpose: b.purpose,
      status: b.status,
      amount: Number(b.amount),
      final_amount: Number(b.final_amount),
      expected_count: b.expected_count,
      cancellation_reason: b.cancellation_reason,
      cancelled_at: b.cancelled_at?.toISOString() ?? null,
      created_at: b.created_at.toISOString(),
      court: {
        id: b.court.id.toString(),
        name: b.court.name,
        address: b.court.address,
        city: b.court.city,
        district: b.court.district,
      },
      user: {
        id: b.user.id.toString(),
        nickname: b.user.nickname,
        name: b.user.name,
      },
      // 권한 컨텍스트 (UI 분기용)
      can_cancel: result.isOwner || result.isManager,
      is_manager_view: result.isManager,
    },
  });
}

// ─────────────────────────────────────────────
// DELETE — 예약 취소
//   Body: { reason? } (선택, 최대 200자)
// ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError("유효하지 않은 예약 ID입니다", 400);
  const bookingId = BigInt(id);
  const userId = BigInt(session.sub);

  // Body 파싱 (DELETE 도 body 허용 — Next.js Edge/Node 모두 가능)
  let reason: string | undefined;
  try {
    const body = await req.json().catch(() => null);
    if (body) {
      const parsed = CancelSchema.safeParse(body);
      if (parsed.success) reason = parsed.data.reason;
    }
  } catch {
    // body 없는 DELETE 도 허용 — 이유 미기재 취소
  }

  const result = await loadBookingWithPermission(bookingId, userId);
  if (!result.ok) return apiError(result.message, result.status, result.code);

  // 이미 취소/환불/완료된 예약은 재취소 불가
  if (
    result.booking.status === "cancelled" ||
    result.booking.status === "refunded" ||
    result.booking.status === "completed"
  ) {
    return apiError(
      "이미 종료된 예약은 취소할 수 없습니다",
      400,
      "ALREADY_TERMINATED"
    );
  }

  // 취소 처리 — Phase A 는 PG 환불 미연동이라 status 만 변경
  // 운영자가 취소할 때는 reason 필수 권장 (강제는 아님)
  const cancelledAt = new Date();
  const updated = await prisma.court_bookings.update({
    where: { id: bookingId },
    data: {
      status: "cancelled",
      cancellation_reason:
        reason ??
        (result.isManager ? "운영자 취소" : "예약자 취소"),
      cancelled_at: cancelledAt,
    },
    select: {
      id: true,
      status: true,
      cancellation_reason: true,
      cancelled_at: true,
    },
  });

  return apiSuccess({
    booking: {
      id: updated.id.toString(),
      status: updated.status,
      cancellation_reason: updated.cancellation_reason,
      cancelled_at: updated.cancelled_at?.toISOString() ?? null,
    },
  });
}
