// ============================================================
// partner/campaigns/[id]/page.tsx — 캠페인 상세 (정본 partner-pages CampaignDetail 1:1)
//   ad_campaigns(+placements) 서버 Prisma 직접 READ. ★IDOR 가드 — 본인 파트너 캠페인만
//   (campaign.partner_id == ctx.partnerId), super 는 전체 열람. 불일치/부재 → notFound.
//   ★백엔드/DB 0변경 · raw fetch 0 · snake → 표시 단일 매핑.
//   - 과금(예산/소진/단가/전환) 제외 — KPI = 노출/클릭/클릭률만.
// ============================================================

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  getPartnerContext,
  campaignStatus,
  placementLabel,
  fmtPeriod,
  ctrPct,
  n,
} from "../../_partner-data";
import { CampaignDetail, type CampaignDetailData } from "./_detail";
import type { KpiItem, ListItem } from "@/components/admin-v2";

export const dynamic = "force-dynamic";

// placement 코드 → 아이콘(정본 slots 아이콘 톤)
const PLACEMENT_ICON: Record<string, string> = {
  feed: "layout-template",
  sidebar: "panel-right",
  court_top: "map-pin",
  list: "list",
};

export default async function PartnerCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getPartnerContext();

  // id 파싱 방어(비정상 id → notFound)
  let campaignId: bigint;
  try {
    campaignId = BigInt(id);
  } catch {
    notFound();
  }

  const c = await prisma.ad_campaigns.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      partner_id: true,
      title: true,
      headline: true,
      status: true,
      start_date: true,
      end_date: true,
      impressions: true,
      clicks: true,
      placements: {
        select: { id: true, placement: true, priority: true, is_active: true },
        orderBy: { priority: "desc" },
      },
    },
  });

  // 부재 or 소유권 불일치(비-super) → notFound(존재 은닉, 정본 API 동일)
  if (!c) notFound();
  if (!ctx?.isSuper && (!ctx?.partnerId || c.partner_id !== ctx.partnerId)) {
    notFound();
  }

  const st = campaignStatus(c.status);
  const activeSlots = c.placements
    .filter((p) => p.is_active)
    .map((p) => placementLabel(p.placement));
  const slotMeta = activeSlots.length ? activeSlots.join(", ") : "노출 영역 미설정";

  // KPI 3 — 과금 제외, 통계만. delta 생략(과거 스냅샷 부재).
  const kpis: KpiItem[] = [
    { label: "총 노출", value: n(c.impressions), icon: "eye", tone: "violet" },
    { label: "클릭", value: n(c.clicks), icon: "mouse-pointer-click", tone: "primary" },
    { label: "클릭률", value: ctrPct(c.impressions, c.clicks), icon: "percent", tone: "ok" },
  ];

  // 노출 영역 = 실 placements(0건이면 AdListPanel 빈상태). bar 모드 아님(실 비중 데이터 부재).
  const placements: ListItem[] = c.placements.map((p) => ({
    id: p.id.toString(),
    icon: PLACEMENT_ICON[p.placement] ?? "layout-template",
    tone: p.is_active ? "ok" : "grey",
    t: placementLabel(p.placement),
    s: `우선순위 ${p.priority}`,
    time: p.is_active ? "활성" : "비활성",
  }));

  const data: CampaignDetailData = {
    id: c.id.toString(),
    title: c.title || c.headline || "캠페인",
    meta: `${slotMeta} · ${fmtPeriod(c.start_date, c.end_date)} · ${st.label}`,
    kpis,
    placements,
  };

  return <CampaignDetail data={data} />;
}
