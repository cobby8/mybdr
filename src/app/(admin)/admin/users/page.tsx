import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { updateUserRoleAction, updateUserStatusAction, toggleUserAdminAction, forceWithdrawUserAction, deleteUserAction } from "@/app/actions/admin-users";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminUsersTable } from "./admin-users-table";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; error?: string }>;
}) {
  const { page: pageStr, q, error } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where = q
    ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { nickname: { contains: q, mode: "insensitive" as const } }] }
    : undefined;

  const superAdminCount = await prisma.user.count({ where: { isAdmin: true } });

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ membershipType: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip,
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
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const from = skip + 1;
  const to = Math.min(skip + users.length, totalCount);

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

  return (
    <div>
      <AdminPageHeader
        eyebrow="ADMIN · USERS"
        title="유저 관리"
        subtitle={`전체 ${totalCount.toLocaleString()}명${totalCount > 0 ? ` · ${from}–${to}번째` : ""} · 슈퍼관리자 ${superAdminCount}/4`}
        searchPlaceholder="닉네임/이메일 검색"
        searchName="q"
        searchDefaultValue={q ?? ""}
      />

      {error && (
        <div
          className="mb-4 rounded-[12px] px-4 py-3 text-sm"
          style={{ background: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}
        >
          {error}
        </div>
      )}

      <AdminUsersTable
        users={serializedUsers}
        updateUserRoleAction={updateUserRoleAction}
        updateUserStatusAction={updateUserStatusAction}
        toggleUserAdminAction={toggleUserAdminAction}
        forceWithdrawAction={forceWithdrawUserAction}
        deleteAction={deleteUserAction}
      />

      {/* 페이지네이션 — (web) .btn 패턴 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}
              className="btn btn--sm"
            >
              이전
            </Link>
          )}
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{page} / {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}
              className="btn btn--sm"
            >
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
