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
        // 2026-05-05 PR1: default_jersey_number 제거 — team_members 단일 source
        is_elite: true,
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
    playerId: string; // 2026-05-05: 배번 인라인 수정용
    tournamentId: string;
    tournamentName: string;
    teamName: string | null;
    startDate: string | null;
    status: string | null;
    jerseyNumber: number | null;
    role: string | null; // 2026-05-05: player 만 배번 누락 경고 표시
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
          role: true, // 2026-05-05: 배번 누락 경고를 role=player 만 적용
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
      playerId: p.id.toString(),
      tournamentId: p.tournamentTeam.tournament.id,
      tournamentName: p.tournamentTeam.tournament.name,
      teamName: p.tournamentTeam.team?.name ?? null,
      startDate: p.tournamentTeam.tournament.startDate?.toISOString() ?? null,
      status: p.tournamentTeam.tournament.status,
      jerseyNumber: p.jerseyNumber,
      role: p.role,
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
// 2026-05-05 (revised): 관리자 유저 프로필 긴급 변경 — 개인정보 보호 강화
//   왜 (개인정보 취급 방침 PIPA + GDPR 준수):
//     - 본인 정정권 우선 — name/phone/birth_date/city/district 등은 본인 수정
//     - 신원 정보 보호 — name/phone 변경은 위조/사고 위험
//     - 신체 민감정보 — height/weight 본인 입력 (관리자 변경 X)
//     - 본인 선호 — position/jersey 본인이 정확
//   허용 (운영 긴급, 3필드만):
//     - nickname: 부적절한 닉네임 강제 변경 (신고/차단어 처리)
//     - bio: 부적절한 소개글 강제 삭제
//     - is_elite: 대회 출전 자격 운영 검증 (선출/비선출 토글)
//   필수: 사유 입력 (admin_logs.description 에 박제 — 감사 추적)
//   기록: admin_logs severity=warning (긴급 변경)
// ────────────────────────────────────────────────────────────────────────────────
const ADMIN_EDITABLE_FIELDS = ["nickname", "bio", "is_elite"] as const;
type AdminEditableField = (typeof ADMIN_EDITABLE_FIELDS)[number];

export async function updateUserProfileAction(formData: FormData): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  const reason = (formData.get("reason") as string)?.trim();
  if (!userId) return { error: "user_id 누락" };
  if (!reason || reason.length < 5) {
    return { error: "변경 사유는 5자 이상 필수입니다 (감사 추적)" };
  }

  const id = BigInt(userId);
  const prev = await prisma.user.findUnique({
    where: { id },
    select: {
      nickname: true,
      bio: true,
      is_elite: true,
      email: true,
    },
  });

  if (!prev) return { error: "유저 없음" };

  // 3필드만 처리 — Prisma update input 타입 직접 구성 (string vs boolean 분리)
  const data: { nickname?: string; bio?: string | null; is_elite?: boolean } = {};

  // nickname — 빈 문자열 시 자동 닉네임 (user_<id>) 부여 (계정 식별 깨짐 방지)
  const nicknameRaw = formData.get("nickname");
  if (nicknameRaw !== null) {
    const s = String(nicknameRaw).trim();
    data.nickname = s === "" ? `user_${userId}` : s;
  }

  // bio — 빈 문자열 시 null (삭제)
  const bioRaw = formData.get("bio");
  if (bioRaw !== null) {
    const s = String(bioRaw).trim();
    data.bio = s === "" ? null : s;
  }

  // is_elite — checkbox "true" / 미전달 시 false 로 간주 (toggle)
  if (formData.has("is_elite_present")) {
    data.is_elite = formData.get("is_elite") === "true";
  }

  if (Object.keys(data).length === 0) return { error: "변경 사항 없음" };

  await prisma.user.update({
    where: { id },
    data,
  });

  // 변경 전/후 비교
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const k of Object.keys(data) as AdminEditableField[]) {
    const before = (prev as Record<string, unknown>)[k];
    const after = (data as Record<string, unknown>)[k];
    if (before !== after) {
      changes[k] = { before, after };
    }
  }

  await adminLog("user.profile_emergency_update", "User", {
    resourceId: userId,
    description: `${prev.email} 긴급 변경 (${Object.keys(changes).length}필드) — 사유: ${reason}`,
    previousValues: Object.fromEntries(
      Object.entries(changes).map(([k, v]) => [k, v.before]),
    ),
    changesMade: Object.fromEntries(
      Object.entries(changes).map(([k, v]) => [k, v.after]),
    ),
    severity: "warning", // 긴급 변경은 warning 톤
  });

  revalidatePath("/admin/users");
  return {};
}

// ────────────────────────────────────────────────────────────────────────────────
// 2026-05-05: 토너먼트 출전 선수 배번 수정 — admin 직접 입력
//   왜: 출전 선수 중 배번 미입력 케이스 (예: 다이나믹팀 6명 전원). 운영자가
//        모달에서 즉시 채울 수 있도록.
//   어떻게: TournamentTeamPlayer.jerseyNumber 만 update.
//        unique 제약 (tournamentTeamId + jerseyNumber) — 충돌 시 에러 반환.
//   권한: super_admin
//   기록: admin_logs severity=info
// ────────────────────────────────────────────────────────────────────────────────
export async function updateTournamentPlayerJerseyAction(
  playerId: string,
  jerseyNumber: number | null,
): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const id = BigInt(playerId);

  // 입력 검증
  if (jerseyNumber !== null) {
    if (!Number.isInteger(jerseyNumber) || jerseyNumber < 0 || jerseyNumber > 99) {
      return { error: "배번은 0~99 사이 정수" };
    }
  }

  const prev = await prisma.tournamentTeamPlayer.findUnique({
    where: { id },
    select: {
      jerseyNumber: true,
      tournamentTeamId: true,
      userId: true,
      tournamentTeam: {
        select: {
          team: { select: { name: true } },
          tournament: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!prev) return { error: "선수 없음" };
  if (prev.jerseyNumber === jerseyNumber) return { error: "동일 배번 — 변경 없음" };

  // 동일 팀 내 배번 충돌 확인 (unique 제약 사전 검증 — 친절한 에러 메시지)
  if (jerseyNumber !== null) {
    const conflict = await prisma.tournamentTeamPlayer.findFirst({
      where: {
        tournamentTeamId: prev.tournamentTeamId,
        jerseyNumber,
        NOT: { id },
      },
      select: { id: true },
    });
    if (conflict) {
      return { error: `같은 팀에 이미 #${jerseyNumber} 배번 사용 중` };
    }
  }

  await prisma.tournamentTeamPlayer.update({
    where: { id },
    data: { jerseyNumber },
  });

  await adminLog("tournament_player.jersey_update", "TournamentTeamPlayer", {
    resourceId: playerId,
    description: `${prev.tournamentTeam.tournament.name} - ${prev.tournamentTeam.team?.name ?? "?"} 배번 변경 (${prev.jerseyNumber ?? "없음"} → ${jerseyNumber ?? "없음"})`,
    previousValues: { jerseyNumber: prev.jerseyNumber },
    changesMade: { jerseyNumber },
    severity: "info",
  });

  // /admin/users 모달 lazy fetch 라 revalidate 직접 영향 X. 호출측에서 detail 재fetch.
  return {};
}
