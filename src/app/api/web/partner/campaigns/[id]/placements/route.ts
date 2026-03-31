import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * 캠페인 배치(placement) 관리 API
 * GET  /api/web/partner/campaigns/:id/placements — 배치 목록
 * POST /api/web/partner/campaigns/:id/placements — 배치 추가
 *
 * placement 종류: feed | sidebar | court_top | list
 */

// 파트너 소속 + 캠페인 소유 확인
async function verifyAccess(userId: bigint, campaignId: bigint) {
  const membership = await prisma.partner_members.findFirst({
    where: { user_id: userId, is_active: true },
    select: { partner_id: true, role: true },
  });
  if (!membership) return null;

  const campaign = await prisma.ad_campaigns.findUnique({
    where: { id: campaignId },
    select: { id: true, partner_id: true, status: true },
  });

  if (!campaign || campaign.partner_id !== membership.partner_id) return null;

  return { membership, campaign };
}

// 배치 목록 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const result = await verifyAccess(BigInt(session.sub), BigInt(id));
  if (!result) return apiError("캠페인을 찾을 수 없습니다.", 404);

  const placements = await prisma.ad_placements.findMany({
    where: { campaign_id: BigInt(id) },
    orderBy: { priority: "desc" },
  });

  return apiSuccess(
    placements.map((p) => ({
      id: p.id.toString(),
      placement: p.placement,
      priority: p.priority,
      is_active: p.is_active,
      created_at: p.created_at,
    }))
  );
}

// 배치 추가
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const result = await verifyAccess(BigInt(session.sub), BigInt(id));
  if (!result) return apiError("캠페인을 찾을 수 없습니다.", 404);

  // owner/admin만 배치 추가 가능
  if (result.membership.role === "member") {
    return apiError("배치 추가 권한이 없습니다.", 403);
  }

  const body = await req.json();
  const { placement, priority } = body;

  // 허용된 placement 값 검증
  const validPlacements = ["feed", "sidebar", "court_top", "list"];
  if (!placement || !validPlacements.includes(placement)) {
    return apiError(`placement는 ${validPlacements.join(", ")} 중 하나여야 합니다.`, 400);
  }

  // 같은 캠페인에 같은 placement 중복 방지
  const existing = await prisma.ad_placements.findFirst({
    where: { campaign_id: BigInt(id), placement },
  });
  if (existing) {
    return apiError("이미 해당 위치에 배치가 존재합니다.", 409);
  }

  const created = await prisma.ad_placements.create({
    data: {
      campaign_id: BigInt(id),
      placement,
      priority: priority ?? 0,
      is_active: true,
    },
  });

  return apiSuccess({ id: created.id.toString(), placement: created.placement }, 201);
}
