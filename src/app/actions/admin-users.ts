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
        // 2026-05-05: page.tsx select 와 일치 (drift 방지)
        is_elite: true,
        default_jersey_number: true,
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

// ────────────────────────────────────────────────────────────────────────────────
// 2026-05-05: 관리자 유저 상세 조회 — 팀/토너먼트/활동 통계 lazy fetch
//   왜: 유저 모달 열 때 list select 에 없는 관계 데이터 (소속팀/대회/활동) 노출
//   어떻게: 모달 마운트 시 client 가 호출 → state 에 보유 → 추가 섹션 렌더
//   권한: super_admin (다른 액션과 동일)
//   주의: 50명 prefetch 는 무거움 → on-demand 가 맞음
// ────────────────────────────────────────────────────────────────────────────────
export async function getUserDetailAction(userId: string): Promise<{
  teams: Array<{
    id: string;
    name: string;
    role: string | null;
    position: string | null;
    jerseyNumber: number | null;
    isCaptain: boolean;
    status: string | null;
    joined_at: string | null;
  }>;
  tournaments: Array<{
    tournamentId: string;
    tournamentName: string;
    teamName: string | null;
    startDate: string | null;
    status: string | null;
    jerseyNumber: number | null;
  }>;
  activity: {
    posts: number;
    comments: number;
    lastPostAt: string | null;
    lastCommentAt: string | null;
  };
  subscription: {
    membershipType: number;
    status: string | null;
    startedAt: string | null;
    expiresAt: string | null;
  };
}> {
  await requireSuperAdmin();
  const id = BigInt(userId);

  const [teams, tournaments, postsCount, lastPost, commentsCount, lastComment, user] =
    await Promise.all([
      // 1) 소속 팀 + 캡틴 여부
      prisma.teamMember.findMany({
        where: { userId: id },
        orderBy: [{ status: "asc" }, { joined_at: "desc" }],
        select: {
          id: true,
          jerseyNumber: true,
          role: true,
          position: true,
          status: true,
          joined_at: true,
          team: { select: { id: true, name: true, captainId: true } },
        },
        take: 20,
      }),
      // 2) 토너먼트 참가 — 최근 10건
      prisma.tournamentTeamPlayer.findMany({
        where: { userId: id, is_active: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jerseyNumber: true,
          tournamentTeam: {
            select: {
              team: { select: { name: true } },
              tournament: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  status: true,
                },
              },
            },
          },
        },
        take: 10,
      }),
      // 3) 커뮤니티 글 수 + 최근 1건 (작성일 추출용)
      prisma.community_posts.count({ where: { user_id: id } }),
      prisma.community_posts.findFirst({
        where: { user_id: id },
        orderBy: { created_at: "desc" },
        select: { created_at: true },
      }),
      // 4) 댓글 수 + 최근 1건
      prisma.comments.count({ where: { user_id: id } }),
      prisma.comments.findFirst({
        where: { user_id: id },
        orderBy: { created_at: "desc" },
        select: { created_at: true },
      }),
      // 5) 구독 상태
      prisma.user.findUnique({
        where: { id },
        select: {
          membershipType: true,
          subscription_status: true,
          subscription_started_at: true,
          subscription_expires_at: true,
        },
      }),
    ]);

  return {
    teams: teams.map((m) => ({
      id: m.team.id.toString(),
      name: m.team.name,
      role: m.role,
      position: m.position,
      jerseyNumber: m.jerseyNumber,
      isCaptain: m.team.captainId === id,
      status: m.status,
      joined_at: m.joined_at?.toISOString() ?? null,
    })),
    tournaments: tournaments.map((p) => ({
      tournamentId: p.tournamentTeam.tournament.id,
      tournamentName: p.tournamentTeam.tournament.name,
      teamName: p.tournamentTeam.team?.name ?? null,
      startDate: p.tournamentTeam.tournament.startDate?.toISOString() ?? null,
      status: p.tournamentTeam.tournament.status,
      jerseyNumber: p.jerseyNumber,
    })),
    activity: {
      posts: postsCount,
      comments: commentsCount,
      lastPostAt: lastPost?.created_at?.toISOString() ?? null,
      lastCommentAt: lastComment?.created_at?.toISOString() ?? null,
    },
    subscription: {
      membershipType: user?.membershipType ?? 0,
      status: user?.subscription_status ?? null,
      startedAt: user?.subscription_started_at?.toISOString() ?? null,
      expiresAt: user?.subscription_expires_at?.toISOString() ?? null,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// 2026-05-05: 관리자 유저 프로필 인라인 편집 — 일괄 update
//   왜: 부적절한 닉네임 강제 변경 / 연락처 보정 / 대회 출전 자격 (is_elite) 직접 조정
//   어떻게: FormData 받아서 빈 값은 무시 (null 허용 필드 한정), undefined 는 변경 X
//   권한: super_admin (다른 액션과 동일)
//   기록: admin_logs 에 변경 전/후 값 저장
//   안전: nickname 변경 시 unique 제약 없음 (DB 에서 nickname 은 unique 아님)
//        email 은 변경 불가 (unique + 인증 체계 영향) — 별도 액션 필요
// ────────────────────────────────────────────────────────────────────────────────
const EDITABLE_TEXT_FIELDS = ["nickname", "name", "phone", "city", "district", "position", "bio"] as const;
const EDITABLE_INT_FIELDS = ["height", "weight", "default_jersey_number"] as const;

export async function updateUserProfileAction(formData: FormData): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  if (!userId) return { error: "user_id 누락" };

  const id = BigInt(userId);
  const prev = await prisma.user.findUnique({
    where: { id },
    select: {
      nickname: true,
      name: true,
      phone: true,
      birth_date: true,
      city: true,
      district: true,
      position: true,
      height: true,
      weight: true,
      bio: true,
      is_elite: true,
      default_jersey_number: true,
      email: true,
    },
  });

  if (!prev) return { error: "유저 없음" };

  // FormData → Partial<UpdateInput> 매핑 (빈 문자열은 null 로, 미전달은 undefined 로 — Prisma 가 무시)
  const data: Record<string, unknown> = {};

  for (const f of EDITABLE_TEXT_FIELDS) {
    const v = formData.get(f);
    if (v === null) continue; // 폼에 필드 자체가 없음 — 변경 X
    const s = String(v).trim();
    data[f] = s === "" ? null : s;
  }
  for (const f of EDITABLE_INT_FIELDS) {
    const v = formData.get(f);
    if (v === null) continue;
    const s = String(v).trim();
    if (s === "") data[f] = null;
    else {
      const n = parseInt(s, 10);
      if (!Number.isNaN(n)) data[f] = n;
    }
  }
  // birth_date — date input "YYYY-MM-DD"
  const birthRaw = formData.get("birth_date");
  if (birthRaw !== null) {
    const s = String(birthRaw).trim();
    data.birth_date = s === "" ? null : new Date(s);
  }
  // is_elite — checkbox "true" / 미전달
  const eliteRaw = formData.get("is_elite");
  if (eliteRaw !== null) {
    data.is_elite = eliteRaw === "true";
  }

  if (Object.keys(data).length === 0) return { error: "변경 사항 없음" };

  await prisma.user.update({
    where: { id },
    data,
  });

  // 변경 전/후 비교 추출 (실제 변경된 필드만 로그)
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const k of Object.keys(data)) {
    const before = (prev as unknown as Record<string, unknown>)[k];
    const after = data[k];
    if (before instanceof Date && after instanceof Date) {
      if (before.getTime() !== after.getTime()) {
        changes[k] = { before: before.toISOString(), after: after.toISOString() };
      }
    } else if (before !== after) {
      changes[k] = { before, after };
    }
  }

  await adminLog("user.profile_update", "User", {
    resourceId: userId,
    description: `${prev.email} 프로필 편집 (${Object.keys(changes).length}필드)`,
    previousValues: Object.fromEntries(
      Object.entries(changes).map(([k, v]) => [k, v.before]),
    ),
    changesMade: Object.fromEntries(
      Object.entries(changes).map(([k, v]) => [k, v.after]),
    ),
    severity: "info",
  });

  revalidatePath("/admin/users");
  return {};
}
