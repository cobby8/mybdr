import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * 파트너 캠페인 상세/수정 API
 * GET   /api/web/partner/campaigns/:id — 캠페인 상세
 * PATCH /api/web/partner/campaigns/:id — 캠페인 수정 (draft/pending_review만)
 */

// 파트너 멤버십 + 해당 캠페인 소유 확인 헬퍼
async function verifyCampaignOwnership(userId: bigint, campaignId: bigint) {
  const membership = await prisma.partner_members.findFirst({
    where: { user_id: userId, is_active: true },
    select: { partner_id: true, role: true },
  });
  if (!membership) return null;

  const campaign = await prisma.ad_campaigns.findUnique({
    where: { id: campaignId },
    include: {
      placements: true,
      partner: { select: { id: true, name: true } },
    },
  });

  // 캠페인이 내 파트너 소속인지 확인 (IDOR 방지)
  if (!campaign || campaign.partner_id !== membership.partner_id) return null;

  return { membership, campaign };
}

// 캠페인 상세 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const result = await verifyCampaignOwnership(BigInt(session.sub), BigInt(id));
  if (!result) return apiError("캠페인을 찾을 수 없습니다.", 404);

  const c = result.campaign;

  return apiSuccess({
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
    budget: c.budget ? Number(c.budget) : null,
    spent: c.spent ? Number(c.spent) : null,
    pricing_type: c.pricing_type,
    price_per_unit: c.price_per_unit ? Number(c.price_per_unit) : null,
    impressions: c.impressions,
    clicks: c.clicks,
    // CTR(클릭률) 계산: 노출 0이면 0%
    ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0.00",
    placements: c.placements.map((p) => ({
      id: p.id.toString(),
      placement: p.placement,
      priority: p.priority,
      is_active: p.is_active,
    })),
    partner_name: c.partner.name,
    created_at: c.created_at,
    updated_at: c.updated_at,
  });
}

// 캠페인 수정 — draft 또는 pending_review 상태에서만 수정 가능
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const result = await verifyCampaignOwnership(BigInt(session.sub), BigInt(id));
  if (!result) return apiError("캠페인을 찾을 수 없습니다.", 404);

  // owner/admin만 수정 가능
  if (result.membership.role === "member") {
    return apiError("수정 권한이 없습니다.", 403);
  }

  // 승인 이후(approved/paused/ended)에는 파트너가 직접 수정 불가 — 관리자에게 요청
  const editableStatuses = ["draft", "pending_review", "rejected"];
  if (!editableStatuses.includes(result.campaign.status)) {
    return apiError("이 상태에서는 수정할 수 없습니다. 관리자에게 문의하세요.", 403);
  }

  const body = await req.json();
  // 파트너가 수정 가능한 필드 목록
  const allowedFields = ["title", "headline", "description", "image_url", "link_url", "cta_text", "start_date", "end_date"];
  const data: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      // 날짜 필드는 Date 변환
      if ((field === "start_date" || field === "end_date") && body[field]) {
        data[field] = new Date(body[field]);
      } else {
        data[field] = body[field];
      }
    }
  }

  // 수정 후 다시 pending_review로 전환 (재심사 필요)
  if (result.campaign.status === "rejected") {
    data.status = "pending_review";
  }

  const updated = await prisma.ad_campaigns.update({
    where: { id: BigInt(id) },
    data,
  });

  return apiSuccess({ id: updated.id.toString(), status: updated.status });
}
