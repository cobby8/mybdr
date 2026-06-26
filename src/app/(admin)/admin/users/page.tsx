import { prisma } from "@/lib/db/prisma";
import {
  updateUserRoleAction,
  updateUserStatusAction,
  toggleUserAdminAction,
  forceWithdrawUserAction,
  deleteUserAction,
  loadMoreUsersAction,
  // 2026-05-05: Phase A (상세 lazy fetch) + Step 2 (긴급 변경 3필드 + 사유) + Phase B (배번 수정)
  getUserDetailAction,
  updateUserProfileAction,
  updateTournamentPlayerJerseyAction,
} from "@/app/actions/admin-users";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminUsersTable } from "./admin-users-table";
// Phase 1 (Toss 전환) — Material Symbols → lucide(<Icon>)
import { Icon } from "@/components/admin-toss";
// v2.40 A3-2a — 통합 콘솔 키트(통계 띠). Hero 4-stat 을 키트 StatRow 로 통일.
import { StatRow } from "@/components/admin/console-kit";
// 6.1C-5(PA1) 박제: 본인 자기 정지 가드 표시용 — 현재 로그인 슈퍼관리자 식별
import { getWebSession } from "@/lib/auth/web-session";
// 2026-06-13 PR-PERM-DISPLAY §2-4 — 부제 슈퍼관리자 상한 하드코딩 "4" → 단일 source.
import { MAX_SUPER_ADMINS } from "@/lib/auth/roles";

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

  // 6.1C-5(PA1) 박제: 현재 로그인 슈퍼관리자 id (본인 자기 정지 가드 표시용)
  //   session.sub = userId(string). 본인 행은 액션 버튼 대신 "본인" 읽기전용 표시
  const session = await getWebSession();
  const currentUserId = session?.sub ?? null;

  // 6.1C-5(PA1) 박제: Hero 4-stat 실측용 status groupBy (1 쿼리)
  //   왜: 시안 Hero(전체/활성/정지/관리자) 카운트는 첫 50명이 아닌 전체 DB 기준이어야 정확
  //   where 미적용(전체 기준) — superAdminCount/totalCount 와 동일 전체 통계 컨텍스트
  const statusGroups = await prisma.user.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  // status 값별 카운트 맵 (null/기타 status 는 정지로 미분류 — 활성/정지만 노출)
  const activeCount =
    statusGroups.find((g) => g.status === "active")?._count._all ?? 0;
  const suspendedCount =
    statusGroups.find((g) => g.status === "suspended")?._count._all ?? 0;

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
        // 2026-05-05: 관리자 모달 강화 — 대회 출전 자격 필드 (선출 여부)
        // 2026-05-05 PR1: default_jersey_number 제거 — team_members.jersey_number 단일 source
        is_elite: true,
        // 2026-06-12 PR-RECORDER-AUDIT — admin_role 가시화 (recorder_admin 등 칩 표시).
        //   loadMoreUsersAction select 와 반드시 일치 (drift 방지). string|null — 직렬화 추가 불필요.
        admin_role: true,
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
    ? `검색 결과 ${totalCount.toLocaleString()}명 · 슈퍼관리자 ${superAdminCount}/${MAX_SUPER_ADMINS}`
    : `전체 ${totalCount.toLocaleString()}명 · 슈퍼관리자 ${superAdminCount}/${MAX_SUPER_ADMINS}`;

  return (
    // Phase 1 — 페이지 루트에 data-skin="toss" opt-in (Toss 리스킨 영역)
    <div data-skin="toss">
      {/* 2026-05-15 Admin-5-A 박제 — eyebrow 한국어화 + breadcrumbs + actions
          시안 source: Dev/design/BDR-current/screens/AdminUsers.jsx (line 319~343)
          - eyebrow: "ADMIN · USERS" → "ADMIN · 사용자" (시안 카피 박제) */}
      <AdminPageHeader
        eyebrow="ADMIN · 사용자"
        title="유저 관리"
        subtitle={subtitle}
        searchPlaceholder="닉네임/이메일 검색 (전체 DB)"
        searchName="q"
        searchDefaultValue={q ?? ""}
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "사용자" },
          { label: "유저 관리" },
        ]}
        actions={
          <Link href="/admin/game-reports" className="ts-btn ts-btn--secondary ts-btn--sm">
            <Icon name="flag" size={14} />
            신고 검토로
          </Link>
        }
      />

      {/* v2.40 A3-2a — Hero 4-stat 을 키트 StatRow 로 통일 (전체/활성/정지/관리자)
          카운트는 기존 실측 그대로 재사용 (totalCount / status groupBy / superAdminCount) — 신규 쿼리 0. */}
      <StatRow
        items={[
          { icon: "users", label: "전체", value: totalCount.toLocaleString() },
          { icon: "user-check", label: "활성", value: activeCount.toLocaleString() },
          { icon: "user-x", label: "정지", value: suspendedCount.toLocaleString() },
          { icon: "shield", label: "관리자", value: superAdminCount.toLocaleString() },
        ]}
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
        currentUserId={currentUserId}
        loadMoreAction={loadMoreUsersAction}
        updateUserRoleAction={updateUserRoleAction}
        updateUserStatusAction={updateUserStatusAction}
        toggleUserAdminAction={toggleUserAdminAction}
        forceWithdrawAction={forceWithdrawUserAction}
        deleteAction={deleteUserAction}
        getDetailAction={getUserDetailAction}
        updateProfileAction={updateUserProfileAction}
        updateJerseyAction={updateTournamentPlayerJerseyAction}
      />
    </div>
  );
}
