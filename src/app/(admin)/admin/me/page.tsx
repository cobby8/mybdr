/**
 * Admin 마이페이지 — `/admin/me`
 *
 * 2026-05-11 — Phase 2 (관리 토너먼트 + 본인인증 + 최근 활동 추가).
 *
 * 표시 범위 (Phase 2 — Phase 1 + 신규 3 카드):
 *   1. 로그인 정보 (닉네임 / 이메일 / 가입일 / UID) — Phase 1
 *   2. 본인인증 상태 (mock / portone / null) — Phase 2 신규 ⭐
 *   3. 권한 매트릭스 7종 (super/site/tournament_admin + TAM/recorder + partner/org) — Phase 1
 *   4. 관리 토너먼트 목록 (상태별 분리 + 5건 펼치기) — Phase 2 신규 ⭐
 *   5. 최근 admin 활동 (10건) — Phase 2 신규 ⭐
 *
 * 인증 흐름:
 *   - getAuthUser() 단일 진입점 (5/5 박제) — state === "active" 만 통과.
 *   - AdminLayout 가 이미 redirect 처리하지만, 페이지 직접 진입 케이스 대비 가드 보강.
 *   - layout + 이 페이지가 같은 요청에서 호출 시 React.cache dedup (DB SELECT 1회).
 *
 * 데이터 fetch (Phase 2 — 추가 SELECT 2건):
 *   - getAdminRoles(userId, session) — 권한 매트릭스 (admin-roles.ts 헬퍼)
 *   - User 추가 SELECT — email / createdAt / profile_image_url + identity_method (Phase 2)
 *   - admin_logs SELECT — 최근 10건 (Phase 2 신규)
 *
 * server component (interactivity = 자식 UserMenu/LogoutButton/ManagedTournamentsCard 만 client).
 */

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getAdminRoles } from "@/lib/auth/admin-roles";
import { prisma } from "@/lib/db/prisma";
import { UserInfoCard } from "./_components/user-info-card";
import { RoleMatrixCard } from "./_components/role-matrix-card";
import { IdentityStatusCard } from "./_components/identity-status-card";
import { ManagedTournamentsCard } from "./_components/managed-tournaments-card";
import {
  RecentActivityCard,
  type AdminLogRow,
} from "./_components/recent-activity-card";

// Next.js 메타데이터 — admin 영역 페이지 타이틀
export const metadata = {
  title: "마이페이지 | BDR Admin",
};

export default async function AdminMyPage() {
  // 1) 인증 단일 진입점 — JWT verify + DB user.status 분기 + 쿠키 자동 cleanup (5/5 박제)
  const auth = await getAuthUser();
  if (auth.state !== "active" || !auth.user || !auth.session) {
    // layout 도 동일 가드 — 이중 안전망. 직접 진입 케이스 대비.
    redirect("/login");
  }

  const userId = auth.user.id;

  // 2) 권한 매트릭스 + User 추가 정보 + admin_logs 병렬 SELECT
  // 이유:
  //   - getAuthUser 의 user = id/nickname/status 만 → 마이페이지에 email/createdAt/profile/identity_method 필요.
  //   - React.cache 덕분에 getAdminRoles 는 layout 과 dedup.
  //   - admin_logs LIMIT 10 = "최근 활동" 카드 표시용 (Phase 2 신규).
  //   - 3건 모두 본인 데이터만 SELECT (IDOR 0) — userId 키로 필터.
  const [summary, userDetails, adminLogs] = await Promise.all([
    getAdminRoles(userId, auth.session),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        createdAt: true,
        profile_image_url: true,
        // Phase 2 — 본인인증 method (decisions.md [2026-05-08] mock/portone/null 박제 컬럼)
        identity_method: true,
      },
    }),
    // Phase 2 — admin_logs 최근 10건. 본인(admin_id = userId) 만 — 다른 admin 활동 노출 0.
    prisma.admin_logs.findMany({
      where: { admin_id: userId },
      orderBy: { created_at: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        resource_type: true,
        description: true,
        severity: true,
        created_at: true,
      },
    }),
  ]);

  // 3) user details 없음 = 비정상 (getAuthUser active 통과했으므로 사실상 일어나면 안 됨)
  // 안전 가드 — DB drift / race condition 케이스 redirect.
  if (!userDetails) {
    redirect("/login");
  }

  // 4) admin_logs row 직렬화 — bigint id → string (마이페이지 표시용)
  // 이유: client 컴포넌트로 props 전달 시 bigint 그대로면 Next.js serialization 에러.
  const adminLogRows: AdminLogRow[] = adminLogs.map((log) => ({
    id: log.id.toString(),
    action: log.action,
    resourceType: log.resource_type,
    description: log.description,
    severity: log.severity,
    createdAt: log.created_at,
  }));

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <header>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          마이페이지
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          내 로그인 정보, 관리자 권한, 관리 토너먼트, 최근 활동을 확인할 수 있습니다.
        </p>
      </header>

      {/* 1) 로그인 정보 카드 */}
      <UserInfoCard
        user={{
          id: userDetails.id,
          nickname: userDetails.nickname,
          email: userDetails.email,
          createdAt: userDetails.createdAt,
          profileImageUrl: userDetails.profile_image_url,
        }}
      />

      {/* 2) 본인인증 상태 카드 — Phase 2 신규 */}
      <IdentityStatusCard identityMethod={userDetails.identity_method} />

      {/* 3) 권한 매트릭스 카드 */}
      <RoleMatrixCard roles={summary} />

      {/* 4) 관리 토너먼트 카드 — Phase 2 신규 */}
      <ManagedTournamentsCard
        tournamentAdminMembers={summary.tournamentAdminMembers}
        tournamentRecorders={summary.tournamentRecorders}
      />

      {/* 5) 최근 admin 활동 카드 — Phase 2 신규 */}
      <RecentActivityCard logs={adminLogRows} />
    </div>
  );
}
