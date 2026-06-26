import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { PageHead, StatRow } from "@/components/admin/console-kit";
import { AdminTournamentsContent } from "./admin-tournaments-content";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const VALID_PAGE_SIZES = [10, 20, 30];

const TO_TAB_KEY: Record<string, string> = {
  draft: "draft",
  upcoming: "draft",
  registration: "registration",
  registration_open: "registration",
  active: "registration",
  published: "registration",
  open: "registration",
  opening_soon: "registration",
  registration_closed: "registration",
  in_progress: "in_progress",
  live: "in_progress",
  ongoing: "in_progress",
  group_stage: "in_progress",
  completed: "completed",
  ended: "completed",
  closed: "completed",
  cancelled: "completed",
};

function toTabKey(status: string | null | undefined) {
  return TO_TAB_KEY[status ?? "draft"] ?? "draft";
}

export default async function AdminTournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const { q, page: pageParam, pageSize: pageSizeParam } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const parsedPageSize = parseInt(pageSizeParam ?? "", 10);
  const pageSize = VALID_PAGE_SIZES.includes(parsedPageSize)
    ? parsedPageSize
    : DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  const keyword = q?.trim();

  const where = keyword
    ? { name: { contains: keyword, mode: "insensitive" as const } }
    : undefined;

  const [tournaments, totalCount, statusGroups] = await Promise.all([
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
        _count: {
          select: { tournamentTeams: true, tournamentMatches: true },
        },
        users_tournaments_organizer_idTousers: {
          select: { nickname: true, email: true },
        },
      },
    }),
    prisma.tournament.count({ where }),
    prisma.tournament.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {
    draft: 0,
    registration: 0,
    in_progress: 0,
    completed: 0,
  };
  for (const group of statusGroups) {
    const key = toTabKey(group.status);
    statusCounts[key] = (statusCounts[key] ?? 0) + group._count._all;
  }

  const serialized = tournaments.map((t) => ({
    id: t.id.toString(),
    name: t.name,
    format: t.format,
    status: toTabKey(t.status),
    startDate: t.startDate?.toISOString() ?? null,
    endDate: t.endDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    isPublic: t.is_public ?? true,
    teamCount: t._count.tournamentTeams,
    matchCount: t._count.tournamentMatches,
    organizerName: t.users_tournaments_organizer_idTousers?.nickname ?? null,
    organizerEmail: t.users_tournaments_organizer_idTousers?.email ?? null,
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const statItems = [
    { icon: "trophy", label: "전체 대회", value: totalCount },
    { icon: "file-pen", label: "준비중", value: statusCounts.draft, tone: "primary" as const },
    { icon: "clipboard-list", label: "접수중", value: statusCounts.registration, tone: "warn" as const },
    { icon: "play", label: "진행중", value: statusCounts.in_progress, tone: "ok" as const },
    { icon: "flag", label: "종료", value: statusCounts.completed },
  ];

  return (
    <div data-skin="toss" className="adm-page">
      <PageHead
        eyebrow="백오피스 · v2.41 Toss"
        icon="trophy"
        title="대회 목록"
        sub={`${totalCount}개의 대회를 운영 워크스페이스 기준으로 관리합니다.`}
        actions={
          <Link
            href="/tournament-admin/tournaments/new/wizard"
            className="ts-btn ts-btn--primary"
          >
            새 대회 만들기
          </Link>
        }
      />

      <form className="ad-toolbar" action="/admin/tournaments">
        <div className="ad-search">
          <input
            name="q"
            defaultValue={keyword ?? ""}
            placeholder="대회명 검색"
          />
        </div>
        <input type="hidden" name="pageSize" value={pageSize} />
        <button type="submit" className="ts-btn ts-btn--secondary ts-btn--sm">
          검색
        </button>
        {keyword && (
          <Link href="/admin/tournaments" className="ts-btn ts-btn--ghost ts-btn--sm">
            초기화
          </Link>
        )}
      </form>

      <StatRow items={statItems} />

      <AdminTournamentsContent
        tournaments={serialized}
        pagination={{ page, pageSize, totalPages, totalCount }}
      />
    </div>
  );
}
