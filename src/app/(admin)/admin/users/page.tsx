import { prisma } from "@/lib/db/prisma";
import {
  updateUserRoleAction,
  updateUserStatusAction,
  toggleUserAdminAction,
  forceWithdrawUserAction,
  deleteUserAction,
  loadMoreUsersAction,
  // 2026-05-05: Phase A (상세 lazy fetch) + Step 2 (인라인 편집)
  getUserDetailAction,
  updateUserProfileAction,
} from "@/app/actions/admin-users";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminUsersTable } from "./admin-users-table";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { q, error } = await searchParams;

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { nickname: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const superAdminCount = await prisma.user.count({ where: { isAdmin: true } });

  // 2026-05-04: 정렬 변경 — 기존 [membershipType desc, createdAt desc] →
  //             [isAdmin desc, createdAt desc]
  //   사용자 요구: 슈퍼관리자 4명 맨 위 → 그 아래 가입일시 최신순
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ isAdmin: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        nickname: true,
        name: true,
        phone: true,
        membershipType: true,
        isAdmin: true,
        status: true,
        provider: true,
        uid: true,
        city: true,
        district: true,
        position: true,
        height: true,
        weight: true,
        bio: true,
        birth_date: true,
        profile_image_url: true,
        evaluation_rating: true,
        total_games_hosted: true,
        total_games_participated: true,
        last_login_at: true,
        createdAt: true,
        updatedAt: true,
        // 2026-05-05: 관리자 모달 강화 — 대회 출전 자격 필드
        is_elite: true,
        default_jersey_number: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  // BigInt, Date, Decimal을 직렬화 가능한 형태로 변환
  const serializedUsers = users.map((u) => ({
    ...u,
    id: u.id.toString(),
    evaluation_rating: u.evaluation_rating ? Number(u.evaluation_rating) : null,
    birth_date: u.birth_date?.toISOString() ?? null,
    last_login_at: u.last_login_at?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  // 부제: 검색 시에는 검색 결과 / 평소에는 전체 + 첫 N명 표시
  const subtitle = q
    ? `검색 결과 ${totalCount.toLocaleString()}명 · 슈퍼관리자 ${superAdminCount}/4`
    : `전체 ${totalCount.toLocaleString()}명 · 슈퍼관리자 ${superAdminCount}/4`;

  return (
    <div>
      <AdminPageHeader
        eyebrow="ADMIN · USERS"
        title="유저 관리"
        subtitle={subtitle}
        searchPlaceholder="닉네임/이메일 검색 (전체 DB)"
        searchName="q"
        searchDefaultValue={q ?? ""}
      />

      {error && (
        <div
          className="mb-4 rounded-[12px] px-4 py-3 text-sm"
          style={{
            background: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      <AdminUsersTable
        initialUsers={serializedUsers}
        totalCount={totalCount}
        searchQuery={q ?? null}
        loadMoreAction={loadMoreUsersAction}
        updateUserRoleAction={updateUserRoleAction}
        updateUserStatusAction={updateUserStatusAction}
        toggleUserAdminAction={toggleUserAdminAction}
        forceWithdrawAction={forceWithdrawUserAction}
        deleteAction={deleteUserAction}
        getDetailAction={getUserDetailAction}
        updateProfileAction={updateUserProfileAction}
      />
    </div>
  );
}
