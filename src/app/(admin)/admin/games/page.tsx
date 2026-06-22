import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
// v2.40 A3-1a — 통합 콘솔 키트 StatRow(status 카운트 띠)
import { StatRow } from "@/components/admin/console-kit";
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

  const [games, totalCount, statusGroups] = await Promise.all([
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
        // 2026-05-29 PR-2C-9 (UD1 BG1) — 신청 현황 모달용 신청 목록 조회.
        // status: Int 0=대기 / 1=승인 / 2=거절 (game_applications.status 단일 진실, 2C-7 확정)
        game_applications: {
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            status: true,
            is_guest: true,
            created_at: true,
            approved_at: true,
            rejected_at: true,
            users: { select: { nickname: true, email: true } },
          },
        },
      },
    }),
    prisma.games.count({ where }),
    // v2.40 A3-1a — StatRow 통계 띠용 status 분포 집계.
    //   목록(take)·검색필터(where)와 별개로 "전체" 기준 status 분포를 보여주기 위해
    //   where 없이 groupBy 1건 추가 (새 route 아님·서버 SELECT 만·write 0).
    prisma.games.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  // status별 건수 맵 — game status: 1=모집중 / 2=확정 / 3=완료 / 4=취소 (null 은 1 로 합산·직렬화 기본값 일치)
  const statusCounts: Record<number, number> = {};
  for (const g of statusGroups) {
    const key = g.status ?? 1;
    statusCounts[key] = (statusCounts[key] ?? 0) + g._count._all;
  }

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
    // BG1 — 신청 현황: status 0/1/2 그대로 직렬화 (가짜 데이터 없음, 실데이터만)
    applications: g.game_applications.map((a) => ({
      id: String(a.id),
      status: a.status, // 0=대기 / 1=승인 / 2=거절
      isGuest: a.is_guest ?? false,
      applicantName: a.users?.nickname ?? a.users?.email ?? "-",
      createdAt: a.created_at.toISOString(),
      approvedAt: a.approved_at?.toISOString() ?? null,
      rejectedAt: a.rejected_at?.toISOString() ?? null,
    })),
    // BG1 — 대기(status=0) 신청 건수 (상단 배너 + 컬럼 표시용)
    pendingCount: g.game_applications.filter((a) => a.status === 0).length,
  }));

  const totalPages = Math.ceil(totalCount / pageSize);

  // v2.40 A3-1a — StatRow 통계 띠 항목 (전체 + status 분포·groupBy 실측).
  const statItems = [
    { icon: "volleyball", label: "전체", value: totalCount },
    { icon: "loader", label: "모집중", value: statusCounts[1] ?? 0 },
    { icon: "check", label: "확정", value: statusCounts[2] ?? 0 },
    { icon: "flag", label: "완료", value: statusCounts[3] ?? 0 },
    { icon: "x", label: "취소", value: statusCounts[4] ?? 0 },
  ];

  return (
    // Phase 1 — 페이지 루트에 data-skin="toss" opt-in
    <div data-skin="toss">
      {/* 2026-05-15 Admin-4-B 박제 — eyebrow + breadcrumbs 추가 (시안 AdminGames.jsx v2.9) */}
      <AdminPageHeader
        eyebrow="ADMIN · 콘텐츠"
        title="경기 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="제목, 장소 검색"
        searchDefaultValue={q ?? ""}
        breadcrumbs={[{ label: "ADMIN" }, { label: "콘텐츠" }, { label: "경기 관리" }]}
      />
      <StatRow items={statItems} />
      <AdminGamesContent
        games={serialized}
        updateStatusAction={updateGameStatusAction}
        pagination={{ page, pageSize, totalPages, totalCount }}
      />
    </div>
  );
}
