import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * PATCH /api/web/partner/venue
 * 파트너 소유 체육관의 대관 정보 수정
 *
 * 파트너가 등록한 court_infos 중 rental_available, fee 등을 업데이트한다.
 * body에 court_info_id를 포함하여 어떤 코트를 수정할지 지정한다.
 */
export async function PATCH(req: NextRequest) {
  const session = await getWebSession();
  if (!session) return apiError("Unauthorized", 401);

  const userId = BigInt(session.sub);

  // 파트너 멤버십 확인
  const membership = await prisma.partner_members.findFirst({
    where: { user_id: userId, is_active: true },
    select: { partner_id: true, role: true },
  });
  if (!membership) return apiError("파트너사에 소속되어 있지 않습니다.", 403);

  // owner/admin만 대관 정보 수정 가능
  if (membership.role === "member") {
    return apiError("대관 정보 수정 권한이 없습니다.", 403);
  }

  const body = await req.json();
  const { court_info_id, rental_available, rental_url, fee, operating_hours, description, contact_phone } = body;

  if (!court_info_id) {
    return apiError("court_info_id는 필수입니다.", 400);
  }

  // 해당 코트가 파트너 소유자(owner_id)가 등록한 코트인지 확인
  // partner의 owner_id가 court_infos의 user_id와 일치해야 함
  const partner = await prisma.partners.findUnique({
    where: { id: membership.partner_id },
    select: { owner_id: true },
  });

  const court = await prisma.court_infos.findUnique({
    where: { id: BigInt(court_info_id) },
    select: { id: true, user_id: true },
  });

  if (!court) return apiError("코트를 찾을 수 없습니다.", 404);

  // 파트너 소유자가 등록한 코트만 수정 가능
  if (!partner || court.user_id !== partner.owner_id) {
    return apiError("이 코트의 대관 정보를 수정할 권한이 없습니다.", 403);
  }

  // 허용된 필드만 업데이트
  const data: Record<string, unknown> = {};
  if (rental_available !== undefined) data.rental_available = Boolean(rental_available);
  if (rental_url !== undefined) data.rental_url = rental_url || null;
  if (fee !== undefined) data.fee = fee ? BigInt(fee) : null;
  if (operating_hours !== undefined) data.operating_hours = operating_hours;
  if (description !== undefined) data.description = description || null;
  if (contact_phone !== undefined) data.contact_phone = contact_phone || null;

  const updated = await prisma.court_infos.update({
    where: { id: court.id },
    data,
    select: {
      id: true,
      name: true,
      rental_available: true,
      rental_url: true,
      fee: true,
      operating_hours: true,
    },
  });

  return apiSuccess({
    id: updated.id.toString(),
    name: updated.name,
    rental_available: updated.rental_available,
    rental_url: updated.rental_url,
    fee: updated.fee ? Number(updated.fee) : null,
    operating_hours: updated.operating_hours,
  });
}
