// ============================================================
// partner/campaigns/page.tsx — 캠페인 목록 (정본 partner-pages PT_CAMPAIGNS 1:1)
//   ad_campaigns(partner 스코프) 서버 Prisma 직접 READ → SchemaList.
//   ★백엔드/DB 0변경 · raw fetch 0 · snake → 표시 단일 매핑.
//   - 데이터 0행(실데이터 0) → SchemaList Empty(빈상태).
//   - 과금(예산/소진/단가) 제외 — 노출/클릭률만.
// ============================================================

import { prisma } from "@/lib/db/prisma";
import {
  getPartnerContext,
  campaignStatus,
  placementLabel,
  fmtPeriod,
  ctrPct,
  n,
} from "../_partner-data";
import { CampaignsList, type PtCampaignRow } from "./_campaigns";

export const dynamic = "force-dynamic";

export default async function PartnerCampaignsPage() {
  const ctx = await getPartnerContext();
  const partnerId = ctx?.partnerId ?? null;

  const campaigns = partnerId
    ? await prisma.ad_campaigns.findMany({
        where: { partner_id: partnerId },
        orderBy: { created_at: "desc" },
        take: 200,
        select: {
          id: true,
          title: true,
          headline: true,
          status: true,
          start_date: true,
          end_date: true,
          impressions: true,
          clicks: true,
          placements: { select: { placement: true, is_active: true } },
        },
      })
    : [];

  const rows: PtCampaignRow[] = campaigns.map((c) => {
    const st = campaignStatus(c.status);
    // 노출 영역 = 활성 placement 라벨 join(없으면 "—")
    const activeSlots = c.placements
      .filter((p) => p.is_active)
      .map((p) => placementLabel(p.placement));
    const slot = activeSlots.length ? activeSlots.join(", ") : "—";
    return {
      id: c.id.toString(),
      name: c.title || c.headline || "캠페인",
      sub: c.headline || undefined,
      slot,
      period: fmtPeriod(c.start_date, c.end_date),
      imp: n(c.impressions),
      ctr: ctrPct(c.impressions, c.clicks),
      // badge 셀(status) = r.badge/r.tone 참조
      badge: st.label,
      tone: st.tone,
    };
  });

  return <CampaignsList rows={rows} />;
}
