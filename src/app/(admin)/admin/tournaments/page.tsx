import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
// v2.40 A3-1a — 통합 콘솔 키트 StatRow(status 카운트 띠)
import { StatRow } from "@/components/admin/console-kit";
import { updateTournamentStatusAction } from "@/app/actions/admin-tournaments";
import { toggleTournamentVisibilityAction } from "@/app/actions/admin-tournaments";
import { AdminTournamentsContent } from "./admin-tournaments-content";

// 상태코드 → 탭키 정규화 (StatRow 카운트 파생용 — content 와 동일 매핑)
const TO_TAB_KEY: Record<string, string> = {
  draft: "draft", upcoming: "draft",
  registration: "registration", registration_open: "registration", active: "registration",
  published: "registration", open: "registration", opening_soon: "registration", registration_closed: "registration",
  in_progress: "in_progress", live: "in_progress", ongoing: "in_progress", group_stage: "in_progress",
  completed: "completed", ended: "completed", closed: "completed", cancelled: "completed",
};
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

  // v2.40 A3-1a — StatRow 카운트(현재 페이지 직렬화 데이터 기준 클라 파생·추가 SELECT 0).
  //   status 별 분포를 탭키로 정규화해 합산. 페이지 단위(take) 기준이라 "현재 페이지" 분포.
  const tabCounts: Record<string, number> = { draft: 0, registration: 0, in_progress: 0, completed: 0 };
  for (const t of serialized) {
    const k = TO_TAB_KEY[t.status ?? "draft"] ?? "draft";
    tabCounts[k] = (tabCounts[k] ?? 0) + 1;
  }
  const statItems = [
    { icon: "trophy", label: "전체", value: totalCount },
    { icon: "file-pen", label: "준비중", value: tabCounts.draft },
    { icon: "clipboard-list", label: "접수중", value: tabCounts.registration },
    { icon: "play", label: "진행중", value: tabCounts.in_progress },
    { icon: "flag", label: "종료", value: tabCounts.completed },
  ];

  return (
    // Phase 1 — 페이지 루트에 data-skin="toss" opt-in (목록·상태 화면만 — 대회관리 리빌딩은 트랙B)
    <div data-skin="toss">
      <AdminPageHeader
        title="대회 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="대회명 검색"
        searchDefaultValue={q ?? ""}
      />
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
