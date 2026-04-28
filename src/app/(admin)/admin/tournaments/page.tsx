import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { updateTournamentStatusAction } from "@/app/actions/admin-tournaments";
import { toggleTournamentVisibilityAction } from "@/app/actions/admin-tournaments";
import { AdminTournamentsContent } from "./admin-tournaments-content";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const VALID_PAGE_SIZES = [10, 20, 30];

// FR-062: 토너먼트 관리 (Admin)
export default async function AdminTournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const { q, page: pageParam, pageSize: pageSizeParam } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = VALID_PAGE_SIZES.includes(parseInt(pageSizeParam ?? "", 10))
    ? parseInt(pageSizeParam!, 10)
    : DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const where = q
    ? { name: { contains: q, mode: "insensitive" as const } }
    : undefined;

  const [tournaments, totalCount] = await Promise.all([
    prisma.tournament.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        format: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        is_public: true,
        _count: { select: { tournamentTeams: true, tournamentMatches: true } },
        users_tournaments_organizer_idTousers: { select: { nickname: true, email: true } },
      },
    }),
    prisma.tournament.count({ where }),
  ]);

  const serialized = tournaments.map((t) => ({
    id: t.id.toString(),
    name: t.name,
    format: t.format,
    status: t.status ?? "draft",
    startDate: t.startDate?.toISOString() ?? null,
    endDate: t.endDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    isPublic: t.is_public ?? true,
    teamCount: t._count.tournamentTeams,
    matchCount: t._count.tournamentMatches,
    organizerName: t.users_tournaments_organizer_idTousers?.nickname ?? null,
    organizerEmail: t.users_tournaments_organizer_idTousers?.email ?? null,
  }));

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <AdminPageHeader
        title="토너먼트 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="대회명 검색"
        searchDefaultValue={q ?? ""}
      />
      <AdminTournamentsContent
        tournaments={serialized}
        updateStatusAction={updateTournamentStatusAction}
        toggleVisibilityAction={toggleTournamentVisibilityAction}
        pagination={{ page, pageSize, totalPages, totalCount }}
      />
    </div>
  );
}
