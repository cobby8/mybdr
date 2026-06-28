// ============================================================
// (admin-v2)/v2/analytics/page.tsx — R2-A 상세 분석(관리자 홈 하위)
//   정본 bo-pages.jsx Analytics 구조: back링크 + PageHead + KpiGrid + AdBarPanel.
//   ⚠ mock 0 — 실 Prisma 집계만. "기능별 활동 비중"(breakdown)은 실데이터
//      출처 없음 → 미배선(보고). 가입 추이/총계만 실값.
// ============================================================

import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import {
  PageHead,
  KpiGrid,
  AdBarPanel,
  Icon,
  type KpiItem,
  type BarDatum,
} from "@/components/admin-v2";

export const dynamic = "force-dynamic";

function lastMonths(n: number): { gte: Date; lt: Date; label: string }[] {
  const out: { gte: Date; lt: Date; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const gte = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const lt = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({ gte, lt, label: `${gte.getMonth() + 1}월` });
  }
  return out;
}

export default async function AdminV2Analytics() {
  const months = lastMonths(7);
  const startOfMonth = months[months.length - 1].gte;

  const [totalUsers, newThisMonth, activeTeams, approvedOrgs, monthlyCounts] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.team.count({ where: { status: "active" } }),
      prisma.organizations.count({ where: { status: "approved" } }),
      Promise.all(
        months.map((m) =>
          prisma.user.count({ where: { createdAt: { gte: m.gte, lt: m.lt } } })
        )
      ),
    ]);

  const kpis: KpiItem[] = [
    { label: "전체 회원", value: totalUsers.toLocaleString(), icon: "users", tone: "primary" },
    { label: "이번달 신규", value: newThisMonth.toLocaleString(), icon: "user-plus", tone: "ok" },
    { label: "활성 팀", value: activeTeams.toLocaleString(), icon: "shield", tone: "violet" },
    { label: "인증 단체", value: approvedOrgs.toLocaleString(), icon: "building-2", tone: "warn" },
  ];

  const bars: BarDatum[] = months.map((m, i) => ({
    m: m.label,
    v: monthlyCounts[i],
    soft: i === months.length - 1,
  }));

  return (
    <div>
      <Link href="/v2" className="ad-backlink">
        <Icon name="arrow-left" size={16} />
        관리자 홈
      </Link>
      <PageHead
        eyebrow="관리자 콘솔 · 관리자 홈"
        title="상세 분석"
        sub="플랫폼 사용 지표를 분석합니다."
      />
      <KpiGrid items={kpis} />
      <div className="ad-cols">
        <AdBarPanel title="신규 가입 추이" badge="MAU" badgeTone="primary" data={bars} />
        <div className="ad-panel" style={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <div style={{ textAlign: "center", color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6 }}>
            <Icon name="pie-chart" size={28} style={{ color: "var(--ink-dim)" }} />
            <div style={{ marginTop: 8, fontWeight: 700 }}>기능별 활동 비중</div>
            <div style={{ marginTop: 4 }}>집계 데이터 연결 준비 중</div>
          </div>
        </div>
      </div>
    </div>
  );
}
