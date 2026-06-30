// ============================================================
// referee-console/page.tsx — 배정 대시보드 (정본 referee-pages Dashboard 1:1)
//   ★글로벌 super 스코프 — 협회 필터 0(전 협회 통합 집계). mock 0.
//   서버 컴포넌트 Prisma 직접 READ(stats API 미경유 = snake 함정 원천차단) → 클라(_dashboard).
//   - KPI 4 = 활동 심판 / 이번달 배정 / 정산 대기(금액) / 미검증 자격.
//   - 월별 배정 막대(assigned_at) + 처리 대기(실 카운트 파생 · mock 0).
//   - 데이터 0행 → 0 표시 + 빈 막대 + 처리대기 Empty(정직).
// ============================================================

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { won, n, getRefereeScope } from "./_referee-data";
import {
  RefereeDashboard,
  type RfKpi,
  type RfBar,
  type RfQueue,
} from "./_dashboard";

export const dynamic = "force-dynamic";

// 최근 N개월 [시작,끝) + "N월" 라벨(월 경계만 사용 — 서버 TZ 무방).
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

export default async function RefereeDashboardPage() {
  // ★4-2 스코프 — 협회 admin 은 자기 협회 심판/배정/정산/자격증만 집계(누출 0).
  //   전역(super/recorder)=필터 0(전 협회 통합). 무권한=방어 차단(layout 이 이미 차단하나 2중 방어).
  const scope = await getRefereeScope();
  if (!scope) notFound();
  // referee 직접 컬럼 필터(referee.count 용).
  const refWhere = scope.isSuper ? {} : { association_id: scope.associationId };
  // assignment/settlement/certificate 관계 경유 필터(referee.association_id).
  const relWhere = scope.isSuper
    ? {}
    : { referee: { association_id: scope.associationId } };

  const months = lastMonths(8);
  const thisMonth = months[months.length - 1];

  const [
    activeReferees,
    monthAssignments,
    pendingSettleAgg,
    unverifiedCerts,
    pendingSettleCount,
    monthlyAssignCounts,
  ] = await Promise.all([
    // 활동 심판(스코프) — referee 직접 필터.
    prisma.referee.count({ where: { status: "active", ...refWhere } }),
    // 이번달 배정(assigned_at 기준·관계 필터)
    prisma.refereeAssignment.count({
      where: { assigned_at: { gte: thisMonth.gte, lt: thisMonth.lt }, ...relWhere },
    }),
    // 정산 대기 금액 합(pending + scheduled·관계 필터)
    prisma.refereeSettlement.aggregate({
      where: { status: { in: ["pending", "scheduled"] }, ...relWhere },
      _sum: { amount: true },
    }),
    // 미검증 자격증(관계 필터)
    prisma.refereeCertificate.count({ where: { verified: false, ...relWhere } }),
    // 지급 대기 정산 건수(처리대기 항목용·관계 필터)
    prisma.refereeSettlement.count({ where: { status: "pending", ...relWhere } }),
    // 월별 신규 배정(assigned_at·관계 필터) — 0 데이터면 전부 0 막대(빈상태)
    Promise.all(
      months.map((m) =>
        prisma.refereeAssignment.count({
          where: { assigned_at: { gte: m.gte, lt: m.lt }, ...relWhere },
        })
      )
    ),
  ]);

  const pendingSettleAmount = pendingSettleAgg._sum.amount ?? 0;

  // KPI 4 — delta 생략(과거 스냅샷 부재 · mock 0).
  const kpis: RfKpi[] = [
    {
      label: "이번달 배정",
      value: n(monthAssignments),
      icon: "clipboard-check",
      tone: "primary",
    },
    {
      label: "활동 심판",
      value: n(activeReferees),
      icon: "users",
      tone: "violet",
    },
    {
      label: "정산 대기",
      value: won(pendingSettleAmount),
      icon: "wallet",
      tone: "ok",
    },
    {
      label: "미검증 자격",
      value: n(unverifiedCerts),
      icon: "badge-check",
      tone: "warn",
    },
  ];

  const bars: RfBar[] = months.map((m, i) => ({
    m: m.label,
    v: monthlyAssignCounts[i] ?? 0,
    soft: i === months.length - 1, // 이번달(진행중) 약하게
  }));

  // 처리 대기 — 실 카운트 파생(0건이면 항목 제외 → 전부 0이면 Empty). mock 0.
  const queue: RfQueue[] = [];
  if (unverifiedCerts > 0) {
    queue.push({
      id: "cert",
      icon: "badge-check",
      tone: "warn",
      t: `자격증 검증 대기 ${unverifiedCerts}건`,
      s: "자격·서류 검증에서 처리하세요",
      time: "대기",
    });
  }
  if (pendingSettleCount > 0) {
    queue.push({
      id: "settle",
      icon: "wallet",
      tone: "primary",
      t: `정산 지급 대기 ${pendingSettleCount}건`,
      s: "정산에서 상태를 변경하세요",
      time: "대기",
    });
  }

  return <RefereeDashboard kpis={kpis} bars={bars} queue={queue} />;
}
