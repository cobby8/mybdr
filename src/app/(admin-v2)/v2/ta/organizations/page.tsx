// ============================================================
// ta/organizations/page.tsx — 단체·주최 (정본 ta-pages Orgs 1:1)
//   레거시 동일 멤버십 기반(organization_members user_id + is_active) — "내가
//   운영하는 단체"만. 서버 Prisma 직접 READ → 클라(_orgs) 카드 그리드.
//   _count(series/members) 실집계 · 운영진 = owner/admin 멤버 수. jsonb 미접촉.
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { avColor } from "../_helpers";
import { OrgGrid, type TaOrgRow } from "./_orgs";

export const dynamic = "force-dynamic";

export default async function TaOrganizations() {
  const session = await getWebSession();
  const userId = session ? BigInt(session.sub) : BigInt(0);

  // 내가 활성 멤버인 단체(레거시 organizations 목록 패턴)
  const memberships = await prisma.organization_members.findMany({
    where: { user_id: userId, is_active: true },
    orderBy: { created_at: "desc" },
    take: 50,
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          region: true,
          status: true,
          _count: { select: { series: true, members: true } },
          // 운영진(대표/운영자) 수 산정용
          members: {
            where: { role: { in: ["owner", "admin"] } },
            select: { id: true },
          },
        },
      },
    },
  });

  const rows: TaOrgRow[] = memberships.map((m, i) => {
    const o = m.organization;
    return {
      id: o.id.toString(),
      name: o.name,
      type: o.region || "주최 단체",
      tournaments: o._count.series, // 정규대회(series) 수
      admins: o.members.length,
      members: o._count.members,
      verified: o.status === "approved",
      color: avColor(i),
    };
  });

  return <OrgGrid rows={rows} />;
}
