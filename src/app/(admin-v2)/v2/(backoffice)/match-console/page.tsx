// ============================================================
// (admin-v2)/v2/match-console/page.tsx — 컷오버 ② 매칭 콘솔(목록)
//   매칭 = 픽업/게스트/연습 경기 관리(레거시 /admin/games 의 v2 포팅).
//   ⚠ 백엔드 0변경 — 리스트 READ 는 서버 컴포넌트 Prisma 단일 매핑(snake→camel 1곳).
//     검색(?q)·페이징(skip/take)·status 분포(groupBy) 전부 레거시 page.tsx 와 동일 쿼리.
//     mutation 은 기존 server action(updateGameStatusAction) 그대로 호출(신규 API 0).
// ============================================================

import { prisma } from "@/lib/db/prisma";
import { updateGameStatusAction } from "@/app/actions/admin-games";
import { MatchConsole } from "./_console";
import type { SerializedGame } from "./_console";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const VALID_PAGE_SIZES = [10, 20, 30];

export default async function AdminV2MatchConsole({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const { q, page: pageParam, pageSize: pageSizeParam } = await searchParams;

  // 페이지/페이지크기 파싱 — 레거시와 동일 가드(기본 20, 허용 10/20/30)
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = VALID_PAGE_SIZES.includes(parseInt(pageSizeParam ?? "", 10))
    ? parseInt(pageSizeParam!, 10)
    : DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  // 검색 — 제목/장소 부분일치(레거시 동일). q 없으면 where 미적용
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { venue_name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  // 목록 / 전체건수 / status 분포 3쿼리 병렬 — 전부 READ(write 0)
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
        // 신청 현황 모달용 — game_applications.status Int 0=대기 / 1=승인 / 2=거절
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
    // 통계 띠(KpiGrid)용 — 목록(take)·검색(where)과 별개로 전체 기준 status 분포 집계.
    //   where 없이 groupBy 1건(서버 SELECT 만·write 0·신규 route 아님).
    prisma.games.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  // status별 건수 맵 — game status Int: 1=모집중 / 2=확정 / 3=완료 / 4=취소
  //   DB default 0(null 포함)은 1(모집중)로 합산(직렬화 기본값과 일치).
  const statusCounts: Record<number, number> = {};
  for (const g of statusGroups) {
    const key = g.status ?? 1;
    statusCounts[key] = (statusCounts[key] ?? 0) + g._count._all;
  }

  // ── snake → camel 단일 매핑(snake 함정 차단) ──
  const serialized: SerializedGame[] = games.map((g) => ({
    id: String(g.id),
    title: g.title,
    gameType: g.game_type, // Int 0=픽업 / 1=게스트 / 2=연습
    venueName: g.venue_name,
    city: g.city,
    scheduledAt: g.scheduled_at.toISOString(),
    currentParticipants: g.current_participants,
    maxParticipants: g.max_participants,
    status: g.status ?? 1, // null → 1(모집중)
    createdAt: g.created_at.toISOString(),
    hostName: g.users?.nickname ?? null,
    hostEmail: g.users?.email ?? "",
    // 신청 현황 — status 0/1/2 실데이터만 직렬화(가짜 데이터 없음)
    applications: g.game_applications.map((a) => ({
      id: String(a.id),
      status: a.status, // 0=대기 / 1=승인 / 2=거절
      isGuest: a.is_guest ?? false,
      applicantName: a.users?.nickname ?? a.users?.email ?? "-",
      createdAt: a.created_at.toISOString(),
      approvedAt: a.approved_at?.toISOString() ?? null,
      rejectedAt: a.rejected_at?.toISOString() ?? null,
    })),
    // 대기(status=0) 신청 건수 — 컬럼/배지 표시용
    pendingCount: g.game_applications.filter((a) => a.status === 0).length,
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <MatchConsole
      games={serialized}
      updateStatusAction={updateGameStatusAction}
      pagination={{ page, pageSize, totalPages, totalCount }}
      statusCounts={statusCounts}
      q={q ?? ""}
    />
  );
}
