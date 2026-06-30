// ============================================================
// (admin-v2)/v2/analytics/page.tsx — R2-A 상세 분석(관리자 홈 하위)
//   정본 bo-pages.jsx Analytics 구조: back링크 + PageHead + KpiGrid + AdBarPanel.
//   ⚠ mock 0 — 실 Prisma 집계만. "기능별 활동 비중"(breakdown)은 실데이터
//      출처 없음 → 미배선(보고). 가입 추이/총계만 실값.
//   2026-06-30 컷오버 보강: 레거시 (admin)/admin/analytics 누락 지표 8종 추가
//     (이번 달 대회/경기/게시글 + 전체 대회/경기/코트/게시글/앰배서더).
//     백엔드 0변경 — 서버 Prisma 직접 count READ만(레거시 쿼리 1:1·.catch 방어 동일).
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

  const [
    totalUsers,
    newThisMonth,
    activeTeams,
    approvedOrgs,
    monthlyCounts,
    // ── 컷오버 보강: 레거시 (admin)/admin/analytics 누락 집계 (Prisma 1:1·READ만) ──
    // 이번 달 통계
    thisMonthTournaments, // 이번 달 신규 대회
    thisMonthGames, // 이번 달 신규 경기
    thisMonthPosts, // 이번 달 게시글(published)
    // 전체 통계
    totalTournaments, // 전체 대회
    totalGames, // 전체 경기
    totalCourts, // 등록 코트
    totalPosts, // 전체 커뮤니티 게시글(published)
    activeAmbassadors, // 활동중 앰배서더
    pendingAmbassadors, // 대기중 앰배서더
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.team.count({ where: { status: "active" } }),
    prisma.organizations.count({ where: { status: "approved" } }),
    Promise.all(
      months.map((m) =>
        prisma.user.count({ where: { createdAt: { gte: m.gte, lt: m.lt } } })
      )
    ),
    // 레거시와 동일 필드/조건. 레거시 .catch(()=>0) 방어 패턴까지 1:1 복제.
    prisma.tournament.count({ where: { createdAt: { gte: startOfMonth } } }).catch(() => 0),
    prisma.games.count({ where: { created_at: { gte: startOfMonth } } }).catch(() => 0),
    prisma.community_posts.count({ where: { status: "published", created_at: { gte: startOfMonth } } }).catch(() => 0),
    prisma.tournament.count().catch(() => 0),
    prisma.games.count().catch(() => 0),
    prisma.court_infos.count().catch(() => 0),
    prisma.community_posts.count({ where: { status: "published" } }).catch(() => 0),
    prisma.court_ambassadors.count({ where: { status: "active" } }).catch(() => 0),
    prisma.court_ambassadors.count({ where: { status: "pending" } }).catch(() => 0),
  ]);

  const kpis: KpiItem[] = [
    { label: "전체 회원", value: totalUsers.toLocaleString(), icon: "users", tone: "primary" },
    { label: "이번달 신규", value: newThisMonth.toLocaleString(), icon: "user-plus", tone: "ok" },
    { label: "활성 팀", value: activeTeams.toLocaleString(), icon: "shield", tone: "violet" },
    { label: "인증 단체", value: approvedOrgs.toLocaleString(), icon: "building-2", tone: "warn" },
  ];

  // 이번 달 활동 KPI(레거시 1번째 StatRow 누락분 — 가입은 위 "이번달 신규"로 이미 표시)
  const monthKpis: KpiItem[] = [
    { label: "이번 달 대회", value: thisMonthTournaments.toLocaleString(), icon: "trophy", tone: "ok" },
    { label: "이번 달 경기", value: thisMonthGames.toLocaleString(), icon: "volleyball", tone: "ok" },
    { label: "이번 달 게시글", value: thisMonthPosts.toLocaleString(), icon: "file-pen", tone: "ok" },
  ];

  // 전체 현황 KPI(레거시 2번째 StatRow 누락분 — 전체 회원은 위 KPI로 이미 표시)
  const totalKpis: KpiItem[] = [
    { label: "전체 대회", value: totalTournaments.toLocaleString(), icon: "trophy", tone: "primary" },
    { label: "전체 경기", value: totalGames.toLocaleString(), icon: "activity", tone: "primary" },
    { label: "등록 코트", value: totalCourts.toLocaleString(), icon: "map-pin", tone: "violet" },
    { label: "커뮤니티 게시글", value: totalPosts.toLocaleString(), icon: "message-square", tone: "warn" },
    // 레거시와 동일하게 활동/대기를 한 카드에 함께 표기
    { label: "앰배서더 (활동/대기)", value: `${activeAmbassadors} / ${pendingAmbassadors}`, icon: "megaphone", tone: "warn" },
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
        sub="회원 · 대회 · 경기 · 코트 · 커뮤니티 · 앰배서더 지표와 가입 추이를 분석합니다."
      />
      <KpiGrid items={kpis} />

      {/* 이번 달 활동(레거시 1번째 StatRow 보강) */}
      <div className="ad-section">
        <div className="ad-section-label">이번 달 활동</div>
        <KpiGrid items={monthKpis} />
      </div>

      {/* 전체 현황(레거시 2번째 StatRow 보강) */}
      <div className="ad-section">
        <div className="ad-section-label">전체 현황</div>
        <KpiGrid items={totalKpis} />
      </div>

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
