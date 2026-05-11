/**
 * 2026-05-12 Phase 4 행정 메뉴 — 대회 운영자 변경 API.
 *
 * 진입: super_admin 만
 * 동작: Tournament.organizerId UPDATE + admin_logs severity=warning 박제
 *
 * body: { newOrganizerId: string, reason: string (>=5자) }
 * 응답: apiSuccess({ ok: true, previousOrganizerId, newOrganizerId })
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { adminLog } from "@/lib/admin/log";

type Ctx = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  newOrganizerId: z.string().regex(/^\d+$/, "userId 는 숫자 문자열"),
  reason: z.string().trim().min(5, "변경 사유는 최소 5자").max(500),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  if (!isSuperAdmin(session)) return apiError("권한이 없습니다.", 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return apiError("잘못된 요청입니다.", 400); }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 입력입니다.", 422);
  }
  const { newOrganizerId, reason } = parsed.data;

  // 대회 + 현 운영자 fetch
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true, organizerId: true },
  });
  if (!tournament) return apiError("대회를 찾을 수 없습니다.", 404);

  const newOrganizerBigInt = BigInt(newOrganizerId);
  if (tournament.organizerId === newOrganizerBigInt) {
    return apiError("현 운영자와 동일합니다.", 422);
  }

  // 신규 운영자 존재 + active 검증
  const newOrganizer = await prisma.user.findUnique({
    where: { id: newOrganizerBigInt },
    select: { id: true, nickname: true, email: true, status: true },
  });
  if (!newOrganizer) return apiError("신규 운영자 사용자가 존재하지 않습니다.", 404);
  if (newOrganizer.status !== "active") {
    return apiError("신규 운영자가 비활성 상태입니다.", 422);
  }

  const previousOrganizerId = tournament.organizerId;

  // UPDATE
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { organizerId: newOrganizerBigInt },
  });

  // admin_logs (severity=warning — 운영자 이관은 위험 작업)
  await adminLog("tournament.transfer_organizer", "Tournament", {
    description: `${tournament.name} (${tournamentId}) 운영자 이관: ${previousOrganizerId} → ${newOrganizerId} / 사유: ${reason}`,
    previousValues: { organizerId: previousOrganizerId.toString() },
    changesMade: { organizerId: newOrganizerId, reason },
    severity: "warning",
  });

  return apiSuccess({
    ok: true,
    previousOrganizerId: previousOrganizerId.toString(),
    newOrganizerId,
  });
}
