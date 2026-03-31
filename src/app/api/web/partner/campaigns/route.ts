import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * 파트너 캠페인 API (셀프서비스)
 * GET  /api/web/partner/campaigns — 내 파트너의 캠페인 목록
 * POST /api/web/partner/campaigns — 캠페인 생성 (pending_review 상태)
 */

// 현재 유저의 파트너 멤버십 확인 헬퍼
async function getPartnerMembership(userId: bigint) {
  return prisma.partner_members.findFirst({
    where: { user_id: userId, is_active: true },
    include: { partner: { select: { id: true, status: true } } },
  });
}

// 내 파트너의 캠페인 목록 조회
export async function GET(req: NextRequest) {
  const session = await getWebSession();
  if (!session) return apiError("Unauthorized", 401);

  const membership = await getPartnerMembership(BigInt(session.sub));
  if (!membership) return apiError("파트너사에 소속되어 있지 않습니다.", 403);

  // status 필터 지원 (?status=draft 등)
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const campaigns = await prisma.ad_campaigns.findMany({
    where: {
      partner_id: membership.partner.id,
      ...(status ? { status } : {}),
    },
    orderBy: { created_at: "desc" },
    include: {
      _count: { select: { placements: true } },
    },
  });

  return apiSuccess(
    campaigns.map((c) => ({
      id: c.id.toString(),
      uuid: c.uuid,
      title: c.title,
      headline: c.headline,
      description: c.description,
      image_url: c.image_url,
      link_url: c.link_url,
      cta_text: c.cta_text,
      status: c.status,
      start_date: c.start_date,
      end_date: c.end_date,
      impressions: c.impressions,
      clicks: c.clicks,
      placements_count: c._count.placements,
      created_at: c.created_at,
    }))
  );
}

// 캠페인 생성 — 생성 시 pending_review 상태 (관리자 승인 필요)
export async function POST(req: NextRequest) {
  const session = await getWebSession();
  if (!session) return apiError("Unauthorized", 401);

  const membership = await getPartnerMembership(BigInt(session.sub));
  if (!membership) return apiError("파트너사에 소속되어 있지 않습니다.", 403);

  // owner 또는 admin만 캠페인 생성 가능
  if (membership.role === "member") {
    return apiError("캠페인 생성 권한이 없습니다.", 403);
  }

  // 파트너사가 승인 상태여야 캠페인 생성 가능
  if (membership.partner.status !== "approved") {
    return apiError("파트너사가 승인되지 않았습니다.", 403);
  }

  const body = await req.json();
  const { title, headline, link_url, description, image_url, cta_text, start_date, end_date } = body;

  // 필수 필드 검증
  if (!title || !headline || !link_url) {
    return apiError("title, headline, link_url은 필수입니다.", 400);
  }

  const campaign = await prisma.ad_campaigns.create({
    data: {
      partner_id: membership.partner.id,
      title,
      headline,
      link_url,
      description: description || null,
      image_url: image_url || null,
      cta_text: cta_text || "자세히 보기",
      // 핵심: 관리자 승인 대기 상태로 생성
      status: "pending_review",
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
    },
  });

  return apiSuccess({ id: campaign.id.toString(), uuid: campaign.uuid, status: campaign.status }, 201);
}
