import { prisma } from "@/lib/db/prisma";
import {
  createCourtAction,
  updateCourtAction,
  deleteCourtAction,
} from "@/app/actions/admin-courts";
import { AdminCourtsContent } from "./admin-courts-content";

export const dynamic = "force-dynamic";

// 코트 관리 — 서버 컴포넌트: 데이터 패칭만 담당
export default async function AdminCourtsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { address: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [
    courts,
    totalCount,
    pendingSuggestions,
    pendingAmbassadors,
    pendingSubmissions, // P1-a: 코트 신규 등록 제보(pending) 큐
    // 8C-6 박제 — VA1 hero stat 용 count-only 쿼리 (검색 q 무관 = 전체 현황 지표).
    //   액션/탭/모달 미생성 — 숫자만 hero strip 에 노출 (server count 추가 허용 범위).
    activeCourtsCount, // 활성 코트 수 (status=active)
    pendingCourtsCount, // 미승인 코트 수 (status=pending)
    pendingReportsCount, // 신고 pending 수 (court_reports.status=active = 미처리)
  ] = await Promise.all([
    prisma.court_infos.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        district: true,
        court_type: true,
        status: true,
        is_free: true,
        reviews_count: true,
        created_at: true,
      },
    }),
    prisma.court_infos.count({ where }),
    // 위키 수정 제안 중 대기 중인 것만 조회 (최신순 50건)
    prisma.court_edit_suggestions.findMany({
      where: { status: "pending" },
      orderBy: { created_at: "desc" },
      take: 50,
      include: {
        court_infos: { select: { id: true, name: true } },
        users: { select: { nickname: true } },
      },
    }),
    // 앰배서더 신청 전체 조회 (pending 우선, 최신순)
    prisma.court_ambassadors.findMany({
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
      take: 50,
      include: {
        user: { select: { id: true, nickname: true } },
        court_infos: { select: { id: true, name: true, city: true, district: true } },
      },
    }),
    // P1-a: 코트 제보 중 대기 중인 것만 조회(최신순 50건). 제보자 닉네임 포함
    prisma.court_submissions.findMany({
      where: { status: "pending" },
      orderBy: { created_at: "desc" },
      take: 50,
      include: {
        submitter: { select: { nickname: true } },
      },
    }),
    // 8C-6 hero stat count (3) — 전체 현황 지표라 검색 where 미적용
    prisma.court_infos.count({ where: { status: "active" } }),
    prisma.court_infos.count({ where: { status: "pending" } }),
    // court_reports.status = "active" = 미처리(pending) 신고. count 만 노출, 신고 탭/모달 없음
    prisma.court_reports.count({ where: { status: "active" } }),
  ]);

  // 직렬화
  const serialized = courts.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    address: c.address,
    city: c.city,
    district: c.district,
    courtType: c.court_type,
    status: c.status,
    isFree: c.is_free,
    reviewsCount: c.reviews_count,
    createdAt: c.created_at.toISOString(),
  }));

  // 위키 수정 제안 직렬화
  const serializedSuggestions = pendingSuggestions.map((s) => ({
    id: s.id.toString(),
    courtId: s.court_info_id.toString(),
    courtName: s.court_infos?.name ?? "코트",
    userId: s.user_id.toString(),
    nickname: s.users?.nickname ?? "사용자",
    changes: s.changes as Record<string, { old: unknown; new: unknown }>,
    reason: s.reason,
    status: s.status,
    createdAt: s.created_at.toISOString(),
  }));

  // P1-a 코트 제보 직렬화 (BigInt/Date → string, camelCase 프론트 props)
  const serializedSubmissions = pendingSubmissions.map((s) => ({
    id: s.id.toString(),
    userId: s.user_id.toString(),
    nickname: s.submitter?.nickname ?? "사용자",
    name: s.name,
    region: s.region,
    courtType: s.court_type,
    address: s.address,
    operatingHours: s.operating_hours,
    feeText: s.fee_text,
    amenities: Array.isArray(s.amenities) ? (s.amenities as string[]) : [],
    description: s.description,
    status: s.status,
    createdAt: s.created_at.toISOString(),
  }));

  // 앰배서더 직렬화
  const serializedAmbassadors = pendingAmbassadors.map((a) => ({
    id: a.id.toString(),
    userId: a.user_id.toString(),
    nickname: a.user?.nickname ?? "사용자",
    courtId: a.court_info_id.toString(),
    courtName: a.court_infos?.name ?? "코트",
    courtCity: a.court_infos?.city ?? "",
    courtDistrict: a.court_infos?.district ?? null,
    status: a.status,
    appointedAt: a.appointed_at?.toISOString() ?? null,
    revokedAt: a.revoked_at?.toISOString() ?? null,
    createdAt: a.created_at.toISOString(),
  }));

  return (
    // Phase 2A (Toss 전환) — 페이지 루트에 data-skin="toss" opt-in (content 는 DOM 상속)
    // v2.40 A3-1b — PageHead/StatRow 는 content(코트 관리 탭) 안에서 키트로 렌더.
    //   기존 count 4종(전체/활성/미승인/신고)을 props 로 전달만 함(서버 쿼리 0변경).
    <div data-skin="toss">
      <AdminCourtsContent
        courts={serialized}
        pendingSuggestions={serializedSuggestions}
        pendingAmbassadors={serializedAmbassadors}
        pendingSubmissions={serializedSubmissions}
        createCourtAction={createCourtAction}
        updateCourtAction={updateCourtAction}
        deleteCourtAction={deleteCourtAction}
        totalCount={totalCount}
        activeCourtsCount={activeCourtsCount}
        pendingCourtsCount={pendingCourtsCount}
        pendingReportsCount={pendingReportsCount}
      />
    </div>
  );
}
