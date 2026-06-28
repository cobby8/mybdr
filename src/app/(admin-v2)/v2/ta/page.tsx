// ============================================================
// ta/page.tsx — 대회 콘솔 대시보드 (정본 ta-pages Dashboard 1:1)
//   organizer-scoped 실집계(mock 0). 서버 컴포넌트 Prisma 직접 READ →
//   클라(_dashboard)에 실값 주입. 백엔드/DB 0변경(count/aggregate/select 만).
//   scope = organizer_id OR TournamentAdminMember(active) — M3 viewer-aware 갭 교정.
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";
import { tournamentStatus, fmtDate } from "./_helpers";
import type { TaKpi, TaBar, TaActivity } from "./_dashboard";
import { Dashboard } from "./_dashboard";

export const dynamic = "force-dynamic";

// 최근 N개월 [시작,끝) + "N월" 라벨
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

export default async function TaDashboard() {
  const session = await getWebSession();
  const userId = session ? BigInt(session.sub) : BigInt(0);
  const isSuper = isSuperAdmin(session);

  // organizer-scope where (super = 전체)
  const scope = isSuper
    ? {}
    : {
        OR: [
          { organizerId: userId },
          { adminMembers: { some: { userId, isActive: true } } },
        ],
      };

  const months = lastMonths(8);
  const thisMonth = months[months.length - 1];

  const [
    runningCount,
    pendingCount,
    orgCount,
    thisMonthTeams,
    monthlyCounts,
    recent,
  ] = await Promise.all([
    // 운영 중 대회 / 접수 대기(접수중)
    prisma.tournament.count({ where: { ...scope, status: "in_progress" } }),
    prisma.tournament.count({ where: { ...scope, status: "published" } }),
    // 등록 단체(내가 활성 멤버인 단체)
    prisma.organization_members.count({
      where: { user_id: userId, is_active: true },
    }),
    // 이번달 참가팀 합(teams_count 캐시 합)
    prisma.tournament.aggregate({
      where: { ...scope, startDate: { gte: thisMonth.gte, lt: thisMonth.lt } },
      _sum: { teams_count: true },
    }),
    // 월별 개최 대회(startDate 기준)
    Promise.all(
      months.map((m) =>
        prisma.tournament.count({
          where: { ...scope, startDate: { gte: m.gte, lt: m.lt } },
        })
      )
    ),
    // 최근 활동(최근 등록 대회)
    prisma.tournament.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        createdAt: true,
        edition_number: true,
      },
    }),
  ]);

  const kpis: TaKpi[] = [
    { label: "운영 중 대회", value: runningCount.toLocaleString(), icon: "trophy", tone: "primary" },
    { label: "이번달 참가팀", value: (thisMonthTeams._sum.teams_count ?? 0).toLocaleString(), icon: "users", tone: "ok" },
    { label: "접수 대기", value: pendingCount.toLocaleString(), icon: "clock", tone: "warn" },
    { label: "등록 단체", value: orgCount.toLocaleString(), icon: "building-2", tone: "violet" },
  ];

  const bars: TaBar[] = months.map((m, i) => ({
    m: m.label,
    v: monthlyCounts[i],
    soft: i === months.length - 1, // 이번달(진행중) 약하게
  }));

  // 최근 활동 = 최근 등록된 대회(실데이터 파생). mock 0.
  const activity: TaActivity[] = recent.map((t) => {
    const st = tournamentStatus(t.status);
    const edition = t.edition_number ? ` · ${t.edition_number}회` : "";
    return {
      id: t.id,
      icon: "trophy",
      tone: st.tone,
      t: t.name,
      s: `${st.label}${edition} · 개최 ${fmtDate(t.startDate)}`,
      time: fmtDate(t.createdAt),
    };
  });

  return <Dashboard kpis={kpis} bars={bars} activity={activity} />;
}
