import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { updateTournamentStatusAction } from "@/app/actions/admin-tournaments";
import { toggleTournamentVisibilityAction } from "@/app/actions/admin-tournaments";
import { AdminTournamentsContent } from "./admin-tournaments-content";
// 2026-06-14 대회 삭제 — super_admin 여부 판단용 (Hard 삭제 옵션 노출 분기).
//   DELETE API(route.ts)와 동일 헬퍼(isSuperAdmin) 사용 → UI 노출 ↔ API 허용 판정 정합성 보장.
//   isSuperAdmin 은 session.role 또는 session.admin_role 둘 중 하나만 "super_admin" 이어도 true →
//   admin_role="super_admin" 사용자도 UI 에서 Hard 삭제 옵션을 보게 됨.
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const VALID_PAGE_SIZES = [10, 20, 30];

// FR-062: 대회 관리 (Admin) — 2026-05-04 "토너먼트 관리" → "대회 관리" 통일 (사용자 요청)
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

  // 2026-06-14 대회 삭제 — super_admin 여부 판단.
  //   AdminLayout 가 이미 인증/권한 가드를 통과시키므로 여기선 super_admin 분기만 계산.
  //   isSuperAdmin(session) 헬퍼는 DELETE API(route.ts)와 동일 source → UI/API 판정 일치.
  //   DB 조회 0 (세션 payload 의 role/admin_role 평가) — 추가 비용 없음.
  const auth = await getAuthUser();
  const isSuper =
    auth.state === "active" ? isSuperAdmin(auth.session) : false;

  return (
    <div>
      <AdminPageHeader
        title="대회 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="대회명 검색"
        searchDefaultValue={q ?? ""}
      />
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
