/* ============================================================
 * /api/web/courts/[id]/bookings — 회원용 코트 예약 API (Phase A)
 *
 * GET  : 특정 일자의 활성 슬롯 목록 조회 (예약 가능 시간 표시용)
 * POST : 신규 예약 생성 (FOR UPDATE 락 + 충돌 검사 + 즉시 confirmed)
 *
 * Phase A 정책:
 *   - 결제 미도입 → final_amount = 0, status = "confirmed" 즉시 확정
 *   - amount/discount 는 향후 Phase B/D 를 위해 컬럼만 유지 (현재는 0 또는 시간당 요금 그대로)
 *
 * apiSuccess 자동 snake_case 변환 (errors.md 6회차 가드):
 *   클라이언트는 본 응답을 snake_case 로 접근. raw curl 검증 권장.
 * ============================================================ */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  acquireBookingLock,
  checkConflict,
  listActiveBookings,
  validateBookingTime,
} from "@/lib/courts/booking-conflict";

// 1시간 = 3600s × 1000ms
const ONE_HOUR_MS = 60 * 60 * 1000;

// 허용 purpose 값 (시안 4종)
const PURPOSES = ["pickup", "team", "scrim", "private"] as const;

// 예약 생성 요청 스키마
const CreateBookingSchema = z.object({
  // ISO 8601 (UTC). 클라이언트에서 KST 슬롯을 UTC 로 변환해 전송
  start_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
  duration_hours: z.number().int().min(1).max(4),
  purpose: z.enum(PURPOSES).default("pickup"),
  expected_count: z.number().int().min(1).max(100).optional(),
});

// ─────────────────────────────────────────────
// GET — 특정 일자의 활성 슬롯 목록
//   ?date=YYYY-MM-DD (KST 기준) — 미지정시 오늘
//   응답: { court: {...}, day: ISO, bookings: [{ start_at, end_at, status, purpose }, ...] }
// ─────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtInfoId = BigInt(id);

  // 코트 존재 + booking_mode 검사
  // 이유: external/none 모드 코트의 슬롯 조회는 의미 없음 → 명시적 에러
  const court = await prisma.court_infos.findUnique({
    where: { id: courtInfoId },
    select: {
      id: true,
      name: true,
      booking_mode: true,
      booking_fee_per_hour: true,
      operating_hours: true,
      rental_url: true,
    },
  });
  if (!court) return apiError("존재하지 않는 코트입니다", 404, "NOT_FOUND");

  // ?date 파싱 (KST). 클라이언트가 "2026-04-26" 형태로 전달
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  // KST 자정~익일 자정 구간을 UTC 로 변환 (UTC = KST - 9h)
  const dayStartKst = dateParam
    ? new Date(`${dateParam}T00:00:00+09:00`)
    : new Date(new Date().toLocaleDateString("en-US", { timeZone: "Asia/Seoul" }));
  // dateParam 미지정 시: 오늘 KST 자정 — JS Date 의 timezone 처리 한계로 dayStart 는 안전한 형태로 강제
  if (!dateParam) {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    dayStartKst.setTime(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate()
      ) - kstOffset
    );
  }
  const dayEndKst = new Date(dayStartKst.getTime() + 24 * ONE_HOUR_MS);

  const bookings = await prisma.court_bookings.findMany({
    where: {
      court_info_id: courtInfoId,
      status: { in: ["confirmed", "pending", "blocked"] },
      start_at: { lt: dayEndKst },
      end_at: { gt: dayStartKst },
    },
    select: {
      id: true,
      start_at: true,
      end_at: true,
      duration_hours: true,
      status: true,
      purpose: true,
    },
    orderBy: { start_at: "asc" },
  });

  return apiSuccess({
    court: {
      id: court.id.toString(),
      name: court.name,
      booking_mode: court.booking_mode,
      booking_fee_per_hour: court.booking_fee_per_hour
        ? Number(court.booking_fee_per_hour)
        : null,
      operating_hours: court.operating_hours,
      rental_url: court.rental_url,
    },
    day: dayStartKst.toISOString(),
    bookings: bookings.map((b) => ({
      id: b.id.toString(),
      start_at: b.start_at.toISOString(),
      end_at: b.end_at.toISOString(),
      duration_hours: b.duration_hours,
      status: b.status,
      purpose: b.purpose,
    })),
  });
}

// ─────────────────────────────────────────────
// POST — 신규 예약 생성
//   Body: { start_at, duration_hours, purpose, expected_count? }
//   응답: { booking: { id, start_at, end_at, status, final_amount, ... } }
// ─────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ① 인증
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtInfoId = BigInt(id);
  const userId = BigInt(session.sub);

  // ② Body 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("요청 본문이 올바르지 않습니다", 400, "INVALID_BODY");
  }
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("입력값을 확인해주세요", 400, "VALIDATION_ERROR");
  }
  const { start_at, duration_hours, purpose, expected_count } = parsed.data;

  // ③ 시간 정합성 검사
  const startAt = new Date(start_at);
  if (Number.isNaN(startAt.getTime())) {
    return apiError("시작 시각이 올바르지 않습니다", 400);
  }
  const timeError = validateBookingTime(startAt, duration_hours);
  if (timeError) return apiError(timeError, 400, "INVALID_TIME");
  const endAt = new Date(startAt.getTime() + duration_hours * ONE_HOUR_MS);

  // ④ 코트 + booking_mode 사전 검증 (트랜잭션 밖)
  const court = await prisma.court_infos.findUnique({
    where: { id: courtInfoId },
    select: { id: true, booking_mode: true, booking_fee_per_hour: true },
  });
  if (!court) return apiError("존재하지 않는 코트입니다", 404, "NOT_FOUND");
  if (court.booking_mode !== "internal") {
    // internal 모드만 시스템 내 예약 가능. external/none 은 대관 신청 X
    return apiError(
      "이 코트는 자체 예약을 지원하지 않습니다",
      400,
      "BOOKING_NOT_SUPPORTED"
    );
  }

  // ⑤ 트랜잭션: advisory lock → 충돌 검사 → INSERT
  // 이유: 동시 요청 race condition 방지. lock 은 court_info_id 단위라 다른 코트와 무관.
  try {
    const created = await prisma.$transaction(async (tx) => {
      await acquireBookingLock(tx, courtInfoId);

      const conflict = await checkConflict(tx, courtInfoId, startAt, endAt);
      if (conflict.hasConflict) {
        // 트랜잭션 내부에서 throw → 외부 catch 로 409 변환
        const err = new Error("CONFLICT") as Error & {
          code: string;
          conflicting?: typeof conflict.conflictingBooking;
        };
        err.code = "SLOT_CONFLICT";
        err.conflicting = conflict.conflictingBooking;
        throw err;
      }

      // 금액 계산 — Phase A 는 final_amount=0 강제 (무료 MVP)
      const feePerHour = court.booking_fee_per_hour
        ? Number(court.booking_fee_per_hour)
        : 0;
      const amount = feePerHour * duration_hours;
      // Phase A: 결제 미도입이라 final_amount=0. amount 는 표시용으로만 저장 (Phase B 진입 시 활용)
      const finalAmount = 0;

      return tx.court_bookings.create({
        data: {
          court_info_id: courtInfoId,
          user_id: userId,
          start_at: startAt,
          end_at: endAt,
          duration_hours,
          purpose,
          expected_count: expected_count ?? null,
          amount,
          discount_amount: 0,
          final_amount: finalAmount,
          platform_fee: 0,
          // Phase A: 결제 없으므로 즉시 confirmed
          status: "confirmed",
        },
        select: {
          id: true,
          start_at: true,
          end_at: true,
          duration_hours: true,
          purpose: true,
          status: true,
          amount: true,
          final_amount: true,
          expected_count: true,
        },
      });
    });

    return apiSuccess(
      {
        booking: {
          id: created.id.toString(),
          start_at: created.start_at.toISOString(),
          end_at: created.end_at.toISOString(),
          duration_hours: created.duration_hours,
          purpose: created.purpose,
          status: created.status,
          amount: Number(created.amount),
          final_amount: Number(created.final_amount),
          expected_count: created.expected_count,
        },
      },
      201
    );
  } catch (error) {
    // 충돌 에러 → 409
    const err = error as Error & {
      code?: string;
      conflicting?: { id: string; start_at: Date; end_at: Date; status: string };
    };
    if (err.code === "SLOT_CONFLICT") {
      return apiError(
        "이미 예약된 시간대입니다",
        409,
        "SLOT_CONFLICT",
        err.conflicting
          ? {
              conflicting_start_at: err.conflicting.start_at.toISOString(),
              conflicting_end_at: err.conflicting.end_at.toISOString(),
              conflicting_status: err.conflicting.status,
            }
          : undefined
      );
    }
    console.error("[POST /api/web/courts/[id]/bookings] error:", err.message);
    return apiError("예약 처리 중 오류가 발생했습니다", 500, "INTERNAL_ERROR");
  }
}
