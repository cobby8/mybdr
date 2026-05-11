/**
 * Admin 마이페이지 — `/admin/me`
 *
 * 2026-05-11 — Phase 2 (관리 토너먼트 + 본인인증 + 최근 활동 추가).
 * 2026-05-11 — Phase 3 (알림 + 건의사항 + 비번 변경 진입점 추가).
 *
 * 표시 범위 (Phase 3 — 총 7 카드):
 *   1. 로그인 정보 (닉네임 / 이메일 / 가입일 / UID + 비번 변경 진입점) — Phase 1 + Phase 3
 *   2. 본인인증 상태 (mock / portone / null) — Phase 2
 *   3. 알림 (본인 미확인 카운트 + 최근 5건) — Phase 3 신규 ⭐
 *   4. 건의사항 (본인 배정 미처리 카운트 + 최근 5건) — Phase 3 신규 ⭐
 *   5. 권한 매트릭스 7종 (super/site/tournament_admin + TAM/recorder + partner/org) — Phase 1
 *   6. 관리 토너먼트 목록 (상태별 분리 + 5건 펼치기) — Phase 2
 *   7. 최근 admin 활동 (10건) — Phase 2
 *
 * 카드 배치 결정 사유 (사용자 결재):
 *   - 알림/건의사항 = "지금 처리할 일" 이라 상단 배치
 *   - 권한/관리 토너먼트/활동 = "참조 정보" 라 하단
 *
 * 인증 흐름:
 *   - getAuthUser() 단일 진입점 (5/5 박제) — state === "active" 만 통과.
 *   - AdminLayout 가 이미 redirect 처리하지만, 페이지 직접 진입 케이스 대비 가드 보강.
 *   - layout + 이 페이지가 같은 요청에서 호출 시 React.cache dedup (DB SELECT 1회).
 *
 * 데이터 fetch (Phase 3 — 추가 SELECT 4건 — notifications count/list + suggestions count/list):
 *   - getAdminRoles(userId, session) — 권한 매트릭스 (admin-roles.ts 헬퍼)
 *   - User 추가 SELECT — email / createdAt / profile_image_url + identity_method
 *   - admin_logs SELECT — 최근 10건
 *   - notifications count + 최근 5건 — Phase 3 신규
 *   - suggestions count + 최근 5건 — Phase 3 신규
 *   - 모두 본인 데이터만 SELECT (IDOR 0) — userId 키로 필터.
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
import {
  NotificationsCard,
  type NotificationRow,
} from "./_components/notifications-card";
import {
  SuggestionsCard,
  type SuggestionRow,
} from "./_components/suggestions-card";

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

  // 2) 권한 매트릭스 + User 추가 정보 + admin_logs + notifications + suggestions 병렬 SELECT
  // 이유:
  //   - getAuthUser 의 user = id/nickname/status 만 → 마이페이지에 email/createdAt/profile/identity_method 필요.
  //   - React.cache 덕분에 getAdminRoles 는 layout 과 dedup.
  //   - admin_logs LIMIT 10 = "최근 활동" 카드 표시용 (Phase 2).
  //   - notifications/suggestions = Phase 3 신규 — count + 최근 5건 각각.
  //   - 모든 SELECT 본인 데이터만 (IDOR 0) — userId 키로 필터.
  const [
    summary,
    userDetails,
    adminLogs,
    notificationUnreadCount,
    recentNotifications,
    suggestionPendingCount,
    recentSuggestions,
  ] = await Promise.all([
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
    // Phase 3 — notifications 본인 미확인 카운트
    // schema 박제 (1764 line): status @default("unread")
    prisma.notifications.count({
      where: { user_id: userId, status: "unread" },
    }),
    // Phase 3 — notifications 본인 최근 5건 (read/unread 모두)
    prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        notification_type: true,
        status: true,
        title: true,
        created_at: true,
        read_at: true,
      },
    }),
    // Phase 3 — suggestions 본인 배정 + pending 카운트
    // schema 박제 (1971 line): status @default("pending") / 1967: assigned_to_id BigInt?
    prisma.suggestions.count({
      where: { assigned_to_id: userId, status: "pending" },
    }),
    // Phase 3 — suggestions 본인 배정 최근 5건 (status 무관 — 모든 배정 건)
    // 이유: pending 만 표시하면 처리 완료된 최근 건 안 보임 → 배정된 전체 최근 5건 (status 뱃지로 구분)
    prisma.suggestions.findMany({
      where: { assigned_to_id: userId },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        priority: true,
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

  // 5) Phase 3 — notifications row 직렬화 (bigint id + snake_case → camelCase)
  // 이유: TS 컨벤션 박제 (architecture.md) — DB snake_case / 컴포넌트 props camelCase.
  const notificationRows: NotificationRow[] = recentNotifications.map((n) => ({
    id: n.id.toString(),
    notificationType: n.notification_type,
    status: n.status,
    title: n.title,
    createdAt: n.created_at,
    readAt: n.read_at,
  }));

  // 6) Phase 3 — suggestions row 직렬화
  const suggestionRows: SuggestionRow[] = recentSuggestions.map((s) => ({
    id: s.id.toString(),
    title: s.title,
    category: s.category,
    status: s.status,
    priority: s.priority,
    createdAt: s.created_at,
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
          내 로그인 정보, 알림, 건의사항, 관리자 권한, 관리 토너먼트, 최근 활동을 확인할 수 있습니다.
        </p>
      </header>

      {/* 1) 로그인 정보 카드 (+ Phase 3 비번 변경 진입점) */}
      <UserInfoCard
        user={{
          id: userDetails.id,
          nickname: userDetails.nickname,
          email: userDetails.email,
          createdAt: userDetails.createdAt,
          profileImageUrl: userDetails.profile_image_url,
        }}
      />

      {/* 2) 본인인증 상태 카드 — Phase 2 */}
      <IdentityStatusCard identityMethod={userDetails.identity_method} />

      {/* 3) 알림 카드 — Phase 3 신규 (지금 처리할 일 상단 배치) */}
      <NotificationsCard
        unreadCount={notificationUnreadCount}
        notifications={notificationRows}
      />

      {/* 4) 건의사항 카드 — Phase 3 신규 (지금 처리할 일 상단 배치) */}
      <SuggestionsCard
        pendingCount={suggestionPendingCount}
        suggestions={suggestionRows}
      />

      {/* 5) 권한 매트릭스 카드 */}
      <RoleMatrixCard roles={summary} />

      {/* 6) 관리 토너먼트 카드 — Phase 2 */}
      <ManagedTournamentsCard
        tournamentAdminMembers={summary.tournamentAdminMembers}
        tournamentRecorders={summary.tournamentRecorders}
      />

      {/* 7) 최근 admin 활동 카드 — Phase 2 */}
      <RecentActivityCard logs={adminLogRows} />
    </div>
  );
}
