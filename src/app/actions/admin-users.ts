"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { adminLog } from "@/lib/admin/log";
import { MAX_SUPER_ADMINS } from "@/lib/auth/roles";

async function requireSuperAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") {
    throw new Error("권한이 없습니다.");
  }
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  const membershipType = parseInt(formData.get("membership_type") as string, 10);

  if (!userId || isNaN(membershipType) || membershipType < 0 || membershipType > 4) return;

  const prev = await prisma.user.findUnique({ where: { id: BigInt(userId) }, select: { membershipType: true, email: true } });

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { membershipType },
  });

  await adminLog("user.role_change", "User", {
    resourceId: userId,
    description: `${prev?.email ?? userId} 역할 변경`,
    previousValues: { membershipType: prev?.membershipType },
    changesMade: { membershipType },
  });

  revalidatePath("/admin/users");
}

export async function toggleUserAdminAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  const makeAdmin = formData.get("make_admin") === "true";

  if (!userId) return;

  // 슈퍼관리자 최대 4명 제한
  if (makeAdmin) {
    const count = await prisma.user.count({ where: { isAdmin: true } });
    if (count >= MAX_SUPER_ADMINS) {
      redirect(`/admin/users?error=${encodeURIComponent(`슈퍼관리자는 최대 ${MAX_SUPER_ADMINS}명까지 설정할 수 있습니다.`)}`);
    }
  }

  const prev = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { isAdmin: true, email: true },
  });

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { isAdmin: makeAdmin },
  });

  await adminLog("user.admin_change", "User", {
    resourceId: userId,
    description: `${prev?.email ?? userId} 슈퍼관리자 ${makeAdmin ? "지정" : "해제"}`,
    previousValues: { isAdmin: prev?.isAdmin },
    changesMade: { isAdmin: makeAdmin },
    severity: "warning",
  });

  revalidatePath("/admin/users");
}

export async function endPromotionAction(formData: FormData): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const membershipType = parseInt(formData.get("membership_type") as string, 10);
  if (isNaN(membershipType) || membershipType < 1 || membershipType > 3) {
    return { error: "유효하지 않은 플랜입니다." };
  }

  // subscription_expires_at = NULL 인 유저를 만료 처리 (프로모션 무료 → 만료)
  const count = await prisma.user.updateMany({
    where: {
      membershipType,
      subscription_expires_at: null,
    },
    data: {
      subscription_expires_at: new Date(),
    },
  });

  await adminLog("plan.promotion_ended", "Plan", {
    description: `멤버십 ${membershipType} 프로모션 종료 (${count.count}명 만료 처리)`,
    changesMade: { membershipType, affectedCount: count.count },
    severity: "warning",
  });

  revalidatePath("/admin/plans");
  return {};
}

export async function forceWithdrawUserAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  if (!userId) return;

  const user = await prisma.user.findUnique({ where: { id: BigInt(userId) }, select: { email: true, isAdmin: true } });
  if (!user) return;
  if (user.isAdmin) {
    redirect(`/admin/users?error=${encodeURIComponent("슈퍼관리자는 강제탈퇴할 수 없습니다.")}`);
  }

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: {
      status: "withdrawn",
      email: `withdrawn_${userId}_${Date.now()}@deleted.local`,
      nickname: `탈퇴유저_${userId}`,
      phone: null,
      provider: null,
      uid: null,
      profile_image_url: null,
    },
  });

  await adminLog("user.force_withdraw", "User", {
    resourceId: userId,
    description: `${user.email} 강제탈퇴 처리`,
    severity: "critical",
  });

  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  if (!userId) return;

  const user = await prisma.user.findUnique({ where: { id: BigInt(userId) }, select: { email: true, isAdmin: true } });
  if (!user) return;
  if (user.isAdmin) {
    redirect(`/admin/users?error=${encodeURIComponent("슈퍼관리자는 삭제할 수 없습니다.")}`);
  }

  await prisma.user.delete({ where: { id: BigInt(userId) } });

  await adminLog("user.delete", "User", {
    resourceId: userId,
    description: `${user.email} 완전 삭제`,
    severity: "critical",
  });

  revalidatePath("/admin/users");
}

export async function updateUserStatusAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  const status = formData.get("status") as string;

  if (!userId || !["active", "suspended"].includes(status)) return;

  const prev = await prisma.user.findUnique({ where: { id: BigInt(userId) }, select: { status: true, email: true } });

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { status },
  });

  await adminLog("user.status_change", "User", {
    resourceId: userId,
    description: `${prev?.email ?? userId} 상태 변경`,
    previousValues: { status: prev?.status },
    changesMade: { status },
    severity: status === "suspended" ? "warning" : "info",
  });

  revalidatePath("/admin/users");
}

// ────────────────────────────────────────────────────────────────────────────────
// 2026-05-04: 유저 더보기 (무한 스크롤) — server action
//   왜: 기존 page=N URL 페이지네이션을 더보기 버튼 누적 로딩으로 전환
//        검색이 첫 50명 안에서만 되는 것처럼 보이는 UX 문제 해결
//   어떻게: client (admin-users-table) 가 offset/q 보내면 PAGE_SIZE 만큼 추가 fetch
//   정렬: page.tsx 와 동일 — [{ isAdmin desc }, { createdAt desc }]
//        슈퍼관리자 4명 우선 → 그 아래 가입일시 최신순
//   권한: super_admin 만 (다른 액션과 동일)
// ────────────────────────────────────────────────────────────────────────────────
export async function loadMoreUsersAction(
  offset: number,
  q: string | null,
): Promise<{
  users: Array<Record<string, unknown>>;
  hasMore: boolean;
}> {
  await requireSuperAdmin();

  const PAGE_SIZE = 50;
  const safeOffset = Math.max(0, Math.floor(offset));
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { nickname: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ isAdmin: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip: safeOffset,
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

  // BigInt / Date / Decimal 직렬화 (page.tsx 와 동일 룰)
  const serialized = users.map((u) => ({
    ...u,
    id: u.id.toString(),
    evaluation_rating: u.evaluation_rating ? Number(u.evaluation_rating) : null,
    birth_date: u.birth_date?.toISOString() ?? null,
    last_login_at: u.last_login_at?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  const hasMore = safeOffset + serialized.length < totalCount;
  return { users: serialized, hasMore };
}
