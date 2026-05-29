import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
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

  // TA1 통계 띠 항목 정의 (실 status 값만, 0건은 hide).
  // tone = admin-stat-pill 톤: active=ok / inactive=err / merged=info / dissolved=mute
  const statusStats: { key: string; label: string; tone: string }[] = [
    { key: "active", label: "활동중", tone: "ok" },
    { key: "inactive", label: "비활성", tone: "err" },
    { key: "merged", label: "통합됨", tone: "info" },
    { key: "dissolved", label: "해산됨", tone: "mute" },
  ];

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
    <div>
      {/* 2026-05-15 Admin-4-B 박제 — eyebrow + breadcrumbs 추가 (시안 AdminTeams.jsx v2.9) */}
      <AdminPageHeader
        eyebrow="ADMIN · 콘텐츠"
        title="팀 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="팀명, 도시 검색"
        searchDefaultValue={q ?? ""}
        breadcrumbs={[{ label: "ADMIN" }, { label: "콘텐츠" }, { label: "팀 관리" }]}
      />

      {/* 2026-05-29 PR-3C-6 TA1 박제 — Hero status 통계 띠.
          AdminPageHeader는 그대로 두고 아래에 실 status 분포 칩을 배치.
          0건 status는 미표시(hide), 실값이 들어오면 자동 표시(mock 금지). */}
      <div className="flex flex-wrap items-center gap-2 px-1 pb-4">
        {statusStats.map((s) => {
          const count = statusCounts[s.key] ?? 0;
          if (count === 0) return null; // 0건은 띠에서 숨김
          return (
            <span key={s.key} className="admin-stat-pill" data-tone={s.tone}>
              {s.label} {count}
            </span>
          );
        })}
      </div>

      <AdminTeamsContent
        teams={serialized}
        updateStatusAction={updateTeamStatusAction}
      />
    </div>
  );
}
