import { prisma } from "@/lib/db/prisma";
import { PageHead, StatRow } from "@/components/admin/console-kit";
import { updateTournamentStatusAction } from "@/app/actions/admin-tournaments";
import { toggleTournamentVisibilityAction } from "@/app/actions/admin-tournaments";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
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
        _count: {
          select: { tournamentTeams: true, tournamentMatches: true },
        },
        users_tournaments_organizer_idTousers: {
          select: { nickname: true, email: true },
        },
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

  const auth = await getAuthUser();
  const isSuper =
    auth.state === "active" ? isSuperAdmin(auth.session) : false;

  const tabCounts: Record<string, number> = {
    draft: 0,
    registration: 0,
    in_progress: 0,
    completed: 0,
  };
  for (const t of serialized) {
    const key = TO_TAB_KEY[t.status ?? "draft"] ?? "draft";
    tabCounts[key] = (tabCounts[key] ?? 0) + 1;
  }

  const statItems = [
    { icon: "trophy", label: "전체", value: totalCount },
    { icon: "file-pen", label: "준비중", value: tabCounts.draft },
    { icon: "clipboard-list", label: "접수중", value: tabCounts.registration },
    { icon: "play", label: "진행중", value: tabCounts.in_progress },
    { icon: "flag", label: "종료", value: tabCounts.completed },
  ];

  return (
    <div data-skin="toss">
      <PageHead
        eyebrow="대회 관리자"
        icon="trophy"
        title="대회 목록"
        sub={`등록된 대회 ${totalCount}개를 관리합니다.`}
        actions={
          <a
            href="/tournament-admin/tournaments/new/wizard"
            className="ts-btn ts-btn--primary"
          >
            새 대회 만들기
          </a>
        }
      />

      <form className="ad-toolbar" action="/admin/tournaments">
        <div className="ad-search">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="대회명 검색"
          />
        </div>
        <input type="hidden" name="pageSize" value={pageSize} />
        <button type="submit" className="ts-btn ts-btn--secondary ts-btn--sm">
          검색
        </button>
        {q && (
          <a
            href="/admin/tournaments"
            className="ts-btn ts-btn--ghost ts-btn--sm"
          >
            초기화
          </a>
        )}
      </form>

      <StatRow items={statItems} />
      <AdminTournamentsContent
        tournaments={serialized}
        updateStatusAction={updateTournamentStatusAction}
        toggleVisibilityAction={toggleTournamentVisibilityAction}
        pagination={{ page, pageSize, totalPages, totalCount }}
        isSuperAdmin={isSuper}
      />
    </div>
  );
}
