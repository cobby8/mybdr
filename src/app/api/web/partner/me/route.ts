import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/partner/me
 * 현재 로그인 유저가 소속된 파트너사 정보를 반환한다.
 * partner_members 테이블에서 user_id로 소속 파트너를 찾는다.
 */
export async function GET() {
  // 로그인 확인
  const session = await getWebSession();
  if (!session) return apiError("Unauthorized", 401);

  const userId = BigInt(session.sub);

  // partner_members에서 현재 유저가 소속된 활성 파트너 조회
  const membership = await prisma.partner_members.findFirst({
    where: { user_id: userId, is_active: true },
    include: {
      partner: {
        include: {
          _count: { select: { campaigns: true, members: true } },
        },
      },
    },
  });

  // 소속 파트너가 없으면 404
  if (!membership) {
    return apiError("파트너사에 소속되어 있지 않습니다.", 404, "NO_PARTNER");
  }

  const p = membership.partner;

  return apiSuccess({
    id: p.id.toString(),
    uuid: p.uuid,
    name: p.name,
    logo_url: p.logo_url,
    website_url: p.website_url,
    contact_email: p.contact_email,
    contact_phone: p.contact_phone,
    status: p.status,
    description: p.description,
    // 현재 유저의 파트너 내 역할 (owner / admin / member)
    my_role: membership.role,
    campaigns_count: p._count.campaigns,
    members_count: p._count.members,
    created_at: p.created_at,
  });
}
