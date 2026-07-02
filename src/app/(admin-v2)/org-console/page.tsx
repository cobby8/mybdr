// ============================================================
// org-console/page.tsx — 단체 콘솔 대시보드 (정본 org-pages Dashboard 1:1)
//   단체 스코프 실집계(mock 0). 서버 컴포넌트 Prisma 직접 READ → 클라(_dashboard).
//   ★백엔드/DB 0변경 — count 만. raw fetch 0.
//   - 멤버수 = organization_members(is_active) / 시리즈수 = tournament_series(organization_id) /
//     진행중 대회수 = tournament(status="in_progress" · 소속 시리즈, ta 콘솔 화이트리스트 1:1).
// ============================================================

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getOrgContext } from "./_org-data";
import { Dashboard } from "./_dashboard";

export const dynamic = "force-dynamic";

export default async function OrgConsoleDashboardPage() {
  const ctx = await getOrgContext();
  // layout 이 이미 게이트했지만, 방어적으로 재확인(경로 직접 접근 등).
  if (!ctx) redirect("/");

  const orgId = ctx.orgId;

  const [memberCount, seriesCount, ongoingCount] = orgId
    ? await Promise.all([
        prisma.organization_members.count({ where: { organization_id: orgId, is_active: true } }),
        prisma.tournament_series.count({ where: { organization_id: orgId } }),
        prisma.tournament.count({
          where: { status: "in_progress", tournament_series: { organization_id: orgId } },
        }),
      ])
    : [0, 0, 0];

  return (
    <Dashboard
      orgId={orgId ? orgId.toString() : null}
      orgName={ctx.orgName}
      memberCount={memberCount}
      seriesCount={seriesCount}
      ongoingCount={ongoingCount}
    />
  );
}
