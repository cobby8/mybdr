// ============================================================
// partner/page.tsx — 협력업체 대시보드 (정본 partner-pages Dashboard 1:1)
//   파트너 스코프 실집계(mock 0). 서버 컴포넌트 Prisma 직접 READ → 클라(_dashboard).
//   ★백엔드/DB 0변경 — count/aggregate/select 만. raw fetch 0.
//   - 시설 = court_infos(owner 스코프) / 캠페인 = ad_campaigns(partner 스코프).
//   - 데이터 0행(ad_campaigns/ad_placements 실데이터 0) → 0 표시 + 빈 막대/빈 활동.
//   - 과금(예산/소진/단가) 제외 — 통계(노출/클릭)만.
// ============================================================

import { prisma } from "@/lib/db/prisma";
import { getPartnerContext, fmtDate, campaignStatus, ctrPct, n } from "./_partner-data";
import { PartnerDashboard, type PtKpi, type PtBar, type PtActivity } from "./_dashboard";

export const dynamic = "force-dynamic";

// 최근 N개월 [시작,끝) + "N월" 라벨(서버 로컬 기준 — Vercel UTC 무방, 월 경계만 사용).
function lastMonths(count: number): { gte: Date; lt: Date; label: string }[] {
  const out: { gte: Date; lt: Date; label: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const gte = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const lt = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({ gte, lt, label: `${gte.getMonth() + 1}월` });
  }
  return out;
}

export default async function PartnerDashboardPage() {
  const ctx = await getPartnerContext();
  const partnerId = ctx?.partnerId ?? null;
  const ownerId = ctx?.ownerId ?? null;

  const months = lastMonths(8);

  // 파트너 스코프가 없으면(super 무소속) 전부 0/빈 — 실데이터 집계 생략.
  const [
    venueCount,
    campaignCount,
    campAgg,
    monthlyCounts,
    recent,
  ] = await Promise.all([
    ownerId
      ? prisma.court_infos.count({ where: { user_id: ownerId } })
      : Promise.resolve(0),
    partnerId
      ? prisma.ad_campaigns.count({ where: { partner_id: partnerId } })
      : Promise.resolve(0),
    // 노출/클릭 합(과금 필드 제외)
    partnerId
      ? prisma.ad_campaigns.aggregate({
          where: { partner_id: partnerId },
          _sum: { impressions: true, clicks: true },
        })
      : Promise.resolve(null),
    // 월별 신규 캠페인(created_at 기준) — 0 데이터면 전부 0 막대(빈상태).
    partnerId
      ? Promise.all(
          months.map((m) =>
            prisma.ad_campaigns.count({
              where: {
                partner_id: partnerId,
                created_at: { gte: m.gte, lt: m.lt },
              },
            })
          )
        )
      : Promise.resolve(months.map(() => 0)),
    // 최근 활동 = 최근 등록 캠페인(실데이터 파생 · mock 0)
    partnerId
      ? prisma.ad_campaigns.findMany({
          where: { partner_id: partnerId },
          orderBy: { created_at: "desc" },
          take: 6,
          select: {
            id: true,
            title: true,
            headline: true,
            status: true,
            created_at: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const impressions = campAgg?._sum.impressions ?? 0;
  const clicks = campAgg?._sum.clicks ?? 0;

  // KPI 4 — 과금/정산 제외, 실 카운트·통계만. delta 생략(과거 스냅샷 부재).
  const kpis: PtKpi[] = [
    { label: "등록 시설", value: n(venueCount), icon: "map-pin", tone: "primary" },
    { label: "운영 캠페인", value: n(campaignCount), icon: "megaphone", tone: "violet" },
    { label: "캠페인 노출", value: n(impressions), icon: "eye", tone: "ok" },
    { label: "평균 클릭률", value: ctrPct(impressions, clicks), icon: "mouse-pointer-click", tone: "warn" },
  ];

  const bars: PtBar[] = months.map((m, i) => ({
    m: m.label,
    v: monthlyCounts[i] ?? 0,
    soft: i === months.length - 1, // 이번달(진행중) 약하게
  }));

  // 최근 활동 = 최근 등록된 캠페인. 0건이면 AdListPanel 이 빈상태 안내.
  const activity: PtActivity[] = recent.map((c) => {
    const st = campaignStatus(c.status);
    return {
      id: c.id.toString(),
      icon: "megaphone",
      tone: st.tone,
      t: c.title || c.headline || "캠페인",
      s: `${st.label} · 등록 ${fmtDate(c.created_at)}`,
      time: fmtDate(c.created_at),
    };
  });

  return <PartnerDashboard kpis={kpis} bars={bars} activity={activity} />;
}
