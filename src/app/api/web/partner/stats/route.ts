import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/partner/stats
 * 파트너 대시보드 통계 — 캠페인 현황, 총 노출/클릭, CTR
 */
export async function GET() {
  const session = await getWebSession();
  if (!session) return apiError("Unauthorized", 401);

  const userId = BigInt(session.sub);

  // 파트너 멤버십 확인
  const membership = await prisma.partner_members.findFirst({
    where: { user_id: userId, is_active: true },
    select: { partner_id: true },
  });
  if (!membership) return apiError("파트너사에 소속되어 있지 않습니다.", 403);

  // 모든 캠페인의 통계를 집계
  const campaigns = await prisma.ad_campaigns.findMany({
    where: { partner_id: membership.partner_id },
    select: {
      status: true,
      impressions: true,
      clicks: true,
      budget: true,
      spent: true,
    },
  });

  // 상태별 캠페인 수 집계
  const statusCounts: Record<string, number> = {};
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalBudget = 0;
  let totalSpent = 0;

  for (const c of campaigns) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    totalImpressions += c.impressions;
    totalClicks += c.clicks;
    if (c.budget) totalBudget += Number(c.budget);
    if (c.spent) totalSpent += Number(c.spent);
  }

  // CTR 계산 (클릭률 = 클릭수 / 노출수 * 100)
  const ctr = totalImpressions > 0
    ? ((totalClicks / totalImpressions) * 100).toFixed(2)
    : "0.00";

  return apiSuccess({
    total_campaigns: campaigns.length,
    status_counts: statusCounts,
    total_impressions: totalImpressions,
    total_clicks: totalClicks,
    ctr,
    total_budget: totalBudget,
    total_spent: totalSpent,
  });
}
