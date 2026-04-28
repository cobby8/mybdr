import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { updateGameStatusAction } from "@/app/actions/admin-games";
import { AdminGamesContent } from "./admin-games-content";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const VALID_PAGE_SIZES = [10, 20, 30];

export default async function AdminGamesPage({
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
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { venue_name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [games, totalCount] = await Promise.all([
    prisma.games.findMany({
      where,
      orderBy: { scheduled_at: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        game_type: true,
        venue_name: true,
        city: true,
        scheduled_at: true,
        current_participants: true,
        max_participants: true,
        status: true,
        created_at: true,
        users: { select: { nickname: true, email: true } },
      },
    }),
    prisma.games.count({ where }),
  ]);

  const serialized = games.map((g) => ({
    id: String(g.id),
    title: g.title,
    gameType: g.game_type,
    venueName: g.venue_name,
    city: g.city,
    scheduledAt: g.scheduled_at.toISOString(),
    currentParticipants: g.current_participants,
    maxParticipants: g.max_participants,
    status: g.status ?? 1,
    createdAt: g.created_at.toISOString(),
    hostName: g.users?.nickname ?? null,
    hostEmail: g.users?.email ?? "",
  }));

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <AdminPageHeader
        title="경기 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="제목, 장소 검색"
        searchDefaultValue={q ?? ""}
      />
      <AdminGamesContent
        games={serialized}
        updateStatusAction={updateGameStatusAction}
        pagination={{ page, pageSize, totalPages, totalCount }}
      />
    </div>
  );
}
