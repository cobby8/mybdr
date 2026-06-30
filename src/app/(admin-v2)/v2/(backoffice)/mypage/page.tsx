// ============================================================
// (admin-v2)/v2/(backoffice)/mypage/page.tsx — 컷오버 관리자 마이페이지
//   레거시 (admin)/admin/me 의 v2 포팅(본인 계정·권한·알림·건의·활동 7카드).
//   ⚠ 백엔드 0변경 — 전부 READ(getAdminRoles 헬퍼 + Prisma findUnique/findMany/
//     count). 본인 데이터만 SELECT(IDOR 0·userId 키 필터)·mutation 0·신규 API 0.
//   클라 직렬화: bigint→string / Date→ISO string(레거시 직렬화 패턴 1:1).
// ============================================================

import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { getAdminRoles } from "@/lib/auth/admin-roles";
import { prisma } from "@/lib/db/prisma";
import { MyPageConsole, type MyPageData } from "./_mypage";

export const dynamic = "force-dynamic";

export const metadata = { title: "마이페이지 | BDR Admin" };

export default async function AdminV2MyPage() {
  // 인증 — v2 layout 이 이미 게이트하지만 본인 id 확보 + 직접진입 대비 이중 가드
  const session = await getWebSession();
  if (!session) redirect("/login");

  const userId = BigInt(session.sub);

  // 권한 매트릭스 + User 상세 + admin_logs + notifications + suggestions 병렬 READ
  //   전부 본인 데이터만(IDOR 0). 레거시 me/page.tsx 와 동일 쿼리.
  const [
    summary,
    userDetails,
    adminLogs,
    notificationUnreadCount,
    recentNotifications,
    suggestionPendingCount,
    recentSuggestions,
  ] = await Promise.all([
    getAdminRoles(userId, session),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        createdAt: true,
        profile_image_url: true,
        identity_method: true,
      },
    }),
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
    prisma.notifications.count({ where: { user_id: userId, status: "unread" } }),
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
    prisma.suggestions.count({ where: { assigned_to_id: userId, status: "pending" } }),
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

  if (!userDetails) redirect("/login");

  // ── 클라 직렬화(bigint→string / Date→ISO) ──
  const data: MyPageData = {
    user: {
      id: userDetails.id.toString(),
      nickname: userDetails.nickname,
      email: userDetails.email,
      createdAtIso: userDetails.createdAt.toISOString(),
      profileImageUrl: userDetails.profile_image_url,
    },
    identityMethod: userDetails.identity_method,
    notifications: {
      unreadCount: notificationUnreadCount,
      items: recentNotifications.map((n) => ({
        id: n.id.toString(),
        type: n.notification_type,
        status: n.status,
        title: n.title,
        createdAtIso: n.created_at.toISOString(),
      })),
    },
    suggestions: {
      pendingCount: suggestionPendingCount,
      items: recentSuggestions.map((s) => ({
        id: s.id.toString(),
        title: s.title,
        category: s.category,
        status: s.status,
        priority: s.priority,
        createdAtIso: s.created_at.toISOString(),
      })),
    },
    roles: {
      superAdmin: summary.superAdmin,
      siteAdmin: summary.siteAdmin,
      tournamentAdmin: summary.tournamentAdmin,
      recorderAdmin: summary.recorderAdmin,
      tournamentAdminMembers: summary.tournamentAdminMembers.map((t) => ({
        tournamentId: t.tournamentId,
        tournamentName: t.tournamentName ?? null,
        role: t.role ?? null,
        status: t.tournamentStatus ?? null,
        startDateIso: t.tournamentStartDate ? t.tournamentStartDate.toISOString() : null,
        endDateIso: t.tournamentEndDate ? t.tournamentEndDate.toISOString() : null,
      })),
      tournamentRecorders: summary.tournamentRecorders.map((t) => ({
        tournamentId: t.tournamentId,
        tournamentName: t.tournamentName ?? null,
        status: t.tournamentStatus ?? null,
        startDateIso: t.tournamentStartDate ? t.tournamentStartDate.toISOString() : null,
        endDateIso: t.tournamentEndDate ? t.tournamentEndDate.toISOString() : null,
      })),
      partnerMember: summary.partnerMember
        ? { name: summary.partnerMember.partnerName, role: summary.partnerMember.role }
        : null,
      orgMember: summary.orgMember
        ? { name: summary.orgMember.organizationName, role: summary.orgMember.role }
        : null,
      associationAdmin: summary.associationAdmin
        ? { name: summary.associationAdmin.associationName, role: summary.associationAdmin.role }
        : null,
    },
    adminLogs: adminLogs.map((log) => ({
      id: log.id.toString(),
      action: log.action,
      resourceType: log.resource_type,
      description: log.description,
      severity: log.severity,
      createdAtIso: log.created_at.toISOString(),
    })),
  };

  return <MyPageConsole data={data} />;
}
