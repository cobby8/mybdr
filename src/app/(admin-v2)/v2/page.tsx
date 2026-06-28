// ============================================================
// (admin-v2)/v2/page.tsx — R2-A 백오피스 관리자 홈(대시보드)
//   정본 bo-pages.jsx Dashboard 1:1: PageHead + KpiGrid + AdBarPanel +
//   AdListPanel + ConsoleLaunch. ⚠ mock 0 — 전 지표 실 Prisma 집계(READ).
//   서버 컴포넌트에서 집계 → 클라 컴포넌트(KpiGrid 등)에 실값 주입.
//   백엔드 0변경(SELECT/count 만 · 신규 endpoint 0).
// ============================================================

import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import {
  PageHead,
  KpiGrid,
  AdBarPanel,
  AdListPanel,
  Icon,
  type KpiItem,
  type BarDatum,
  type ListItem,
} from "@/components/admin-v2";

export const dynamic = "force-dynamic";

// 최근 6개월 [시작,끝) 범위 + "N월" 라벨 생성
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

// 운영 콘솔 바로가기 카드(정본 ConsoleLaunch)
const LAUNCH = [
  { href: "/tournament-admin", icon: "trophy", t: "대회 콘솔", d: "대회 목록·단체·정규대회·템플릿", ext: true },
  { href: "/v2/soon?c=referee", icon: "gavel", t: "심판 콘솔", d: "배정·검증·등급·수당 정산", ext: false },
  { href: "/v2/soon?c=partner", icon: "handshake", t: "협력업체 콘솔", d: "파트너 시설·캠페인·정산", ext: false },
];

export default async function AdminV2Dashboard() {
  const months = lastMonths(6);

  // KPI 카운트(4) + 월별 신규가입(6) 병렬 — 전부 실 count(SELECT)
  const [totalUsers, activeTeams, pendingOrgs, suspendedUsers, monthlyCounts] =
    await Promise.all([
      prisma.user.count(),
      prisma.team.count({ where: { status: "active" } }),
      prisma.organizations.count({ where: { status: "pending" } }),
      prisma.user.count({ where: { status: "suspended" } }),
      Promise.all(
        months.map((m) =>
          prisma.user.count({ where: { createdAt: { gte: m.gte, lt: m.lt } } })
        )
      ),
    ]);

  const kpis: KpiItem[] = [
    { label: "전체 회원", value: totalUsers.toLocaleString(), icon: "users", tone: "primary" },
    { label: "활성 팀", value: activeTeams.toLocaleString(), icon: "shield", tone: "ok" },
    { label: "인증 대기 단체", value: pendingOrgs.toLocaleString(), icon: "building-2", tone: "warn" },
    { label: "정지 회원", value: suspendedUsers.toLocaleString(), icon: "user-x", tone: "danger" },
  ];

  const bars: BarDatum[] = months.map((m, i) => ({
    m: m.label,
    v: monthlyCounts[i],
    soft: i === months.length - 1, // 이번달(진행중) 약하게
  }));

  // 처리 대기 — 실 카운트만 노출(0건은 숨김 = mock 금지)
  const queue: ListItem[] = [];
  if (pendingOrgs > 0)
    queue.push({ id: "orgs", icon: "building-2", tone: "primary", t: `단체 인증 요청 ${pendingOrgs}건`, s: "유저 콘솔 · 단체", time: "" });
  if (suspendedUsers > 0)
    queue.push({ id: "susp", icon: "user-x", tone: "danger", t: `정지 회원 ${suspendedUsers}명`, s: "유저 콘솔 · 사용자", time: "" });

  return (
    <div>
      <PageHead
        eyebrow="MyBDR · 전국 농구 매칭 플랫폼"
        title="관리자 홈"
        sub="플랫폼 전체 지표·처리 대기 항목과 운영 콘솔을 한 곳에서 관리합니다."
        actions={
          <Link href="/v2/analytics" className="ts-btn ts-btn--secondary">
            <Icon name="bar-chart-3" size={17} />
            상세 분석
          </Link>
        }
      />

      <KpiGrid items={kpis} />

      <div className="ad-cols">
        <AdBarPanel title="월별 신규 가입" badge="최근 6개월" badgeTone="ok" data={bars} />
        <AdListPanel
          title="처리 대기"
          badge={String(queue.length)}
          badgeTone="warn"
          items={queue}
        />
      </div>

      {/* 운영 콘솔 바로가기(ConsoleLaunch) */}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-mute)", letterSpacing: "0.02em", marginBottom: 12 }}>
          운영 콘솔 바로가기
        </div>
        <div className="bo-launchgrid">
          {LAUNCH.map((c) => (
            <Link key={c.href} href={c.href} className="bo-launch">
              <span className="bo-launch__ic">
                <Icon name={c.icon} size={20} />
              </span>
              <span className="bo-launch__body">
                <span className="bo-launch__t">{c.t}</span>
                <span className="bo-launch__d">{c.d}</span>
              </span>
              <Icon name="arrow-up-right" size={16} style={{ color: "var(--ink-dim)", flex: "0 0 auto" }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
