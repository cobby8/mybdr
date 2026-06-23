import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
// v2.40 A3-1a — 통합 콘솔 키트 StatRow(status 카운트 띠)
import { StatRow } from "@/components/admin/console-kit";
import { updateTeamStatusAction } from "@/app/actions/admin-teams";
import { AdminTeamsContent } from "./admin-teams-content";

export const dynamic = "force-dynamic";

// 팀 관리 — 서버 컴포넌트: 데이터 패칭만 담당
export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { city: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [teams, totalCount, statusGroups] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        city: true,
        members_count: true,
        wins: true,
        losses: true,
        draws: true,
        status: true,
        createdAt: true,
        users_teams_captain_idTousers: {
          select: { nickname: true, email: true },
        },
      },
    }),
    prisma.team.count({ where }),
    // 2026-05-29 PR-3C-6 TA1 박제 — Hero status 통계 띠용 전체 분포 집계.
    // 목록(take:50)·검색필터(where)와 별개로 "전체 96팀" 기준 status 분포를
    // 정확히 보여주기 위해 where 없이 groupBy 1건 추가 (새 route 아님, server 조회).
    prisma.team.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  // status별 건수 맵 — 실측: active 84 / inactive 8 / merged 2 / dissolved 2
  const statusCounts: Record<string, number> = {};
  for (const g of statusGroups) {
    // status가 null인 레코드는 "active"로 합산 (직렬화 기본값과 일치)
    statusCounts[g.status ?? "active"] =
      (statusCounts[g.status ?? "active"] ?? 0) + g._count._all;
  }

  // v2.40 A3-1a — StatRow 통계 띠 항목 (실 status 값만·0건은 hide·기존 statusGroups 재사용).
  //   icon = 키트 StatRow 아이콘(lucide). 라벨/실측값은 기존 TA1 박제 그대로.
  const statusStats: { key: string; label: string; icon: string }[] = [
    { key: "active", label: "활동중", icon: "circle-check" },
    { key: "inactive", label: "비활성", icon: "circle-x" },
    { key: "merged", label: "통합됨", icon: "git-merge" },
    { key: "dissolved", label: "해산됨", icon: "circle-minus" },
  ];
  const statItems = statusStats
    .filter((s) => (statusCounts[s.key] ?? 0) > 0) // 0건은 띠에서 숨김(mock 금지)
    .map((s) => ({ icon: s.icon, label: s.label, value: statusCounts[s.key] ?? 0 }));

  // 직렬화
  const serialized = teams.map((t) => ({
    id: t.id.toString(),
    name: t.name,
    city: t.city,
    membersCount: t.members_count ?? 0,
    wins: t.wins ?? 0,
    losses: t.losses ?? 0,
    draws: t.draws ?? 0,
    status: t.status ?? "active",
    createdAt: t.createdAt.toISOString(),
    captainName: t.users_teams_captain_idTousers?.nickname ?? null,
    captainEmail: t.users_teams_captain_idTousers?.email ?? null,
  }));

  return (
    // Phase 2A (Toss 전환) — 페이지 루트에 data-skin="toss" opt-in (content 는 DOM 상속)
    <div data-skin="toss">
      {/* 2026-05-15 Admin-4-B 박제 — eyebrow + breadcrumbs 추가 (시안 AdminTeams.jsx v2.9) */}
      <AdminPageHeader
        eyebrow="ADMIN · 콘텐츠"
        title="팀 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="팀명, 도시 검색"
        searchDefaultValue={q ?? ""}
        breadcrumbs={[{ label: "ADMIN" }, { label: "콘텐츠" }, { label: "팀 관리" }]}
      />

      {/* v2.40 A3-1a — TA1 status 통계 띠를 키트 StatRow 로 통일(실값만·0건 hide·mock 금지). */}
      {statItems.length > 0 && <StatRow items={statItems} />}

      <AdminTeamsContent
        teams={serialized}
        updateStatusAction={updateTeamStatusAction}
      />
    </div>
  );
}
