import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-admin-nav";
// 2026-05-12 로그인 redirect 통합 — 비로그인 → 로그인 페이지 후 원래 tournament-admin 페이지 복귀
import { buildLoginRedirect } from "@/lib/auth/redirect";
import { TournamentAdminNav } from "./_components/tournament-admin-nav";

// AdminSidebar/AdminMobileNav role 타입 (admin/layout.tsx 와 동일)
type AdminRole =
  | "super_admin"
  | "site_admin"
  | "tournament_admin"
  | "partner_member"
  | "org_member";

/**
 * 대회 관리 레이아웃 — 서버 컴포넌트로 권한 검증 수행.
 * 2026-05-04 (사용자 요청): (web) 그룹 → (admin) 그룹으로 이동. admin sidebar + mobile nav 적용.
 * URL 경로 (`/tournament-admin/...`) 는 그대로 유지 (라우트 그룹은 URL 미반영).
 *
 * role: tournament_admin 또는 super_admin 만 접근 가능 (admin/layout.tsx 와 동일 권한 체크).
 * 미로그인 또는 권한 부족 시 홈으로 리다이렉트.
 *
 * UI: admin sidebar (lg+) + AdminMobileNav (모바일) + TournamentAdminNav (sub-nav 대시보드/단체/내 대회/시리즈/템플릿).
 */
export default async function TournamentAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getWebSession();
  if (!session) {
    // 2026-05-12: 현재 tournament-admin 경로를 redirect 쿼리에 담아 로그인 후 자동 복귀.
    // middleware 가 `x-pathname` / `x-search` 헤더 주입 (`/tournament-admin/*` matcher) — fallback "/tournament-admin".
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/tournament-admin";
    const search = h.get("x-search") ?? "";
    redirect(buildLoginRedirect(pathname, search));
  }
  // 권한 부족: 에러 메시지 포함 로그인 페이지로 리다이렉트
  // 권한 부족 = 로그인 자체는 통과한 케이스 → redirect 쿼리 동봉 안 함 (다른 계정 로그인 권유).
  if (session.role !== "tournament_admin" && session.role !== "super_admin") {
    redirect("/login?error=no_permission");
  }

  // AdminSidebar 표시용 role 목록 — admin/layout.tsx 와 동일 패턴
  const roles: AdminRole[] = [];
  const userId = BigInt(session.sub);

  if (session.role === "super_admin") roles.push("super_admin");
  if (session.admin_role === "site_admin") roles.push("site_admin");
  if (session.role === "tournament_admin") roles.push("tournament_admin");

  // partner_member / org_member 체크 (super_admin 외)
  if (!roles.includes("super_admin")) {
    const [partnerMembership, orgMembership] = await Promise.all([
      prisma.partner_members.findFirst({
        where: { user_id: userId, is_active: true },
        select: { id: true },
      }),
      prisma.organization_members.findFirst({
        where: { user_id: userId, is_active: true },
        select: { id: true },
      }),
    ]);
    if (partnerMembership) roles.push("partner_member");
    if (orgMembership) roles.push("org_member");
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* 데스크톱 사이드바 (lg+) — admin/layout.tsx 와 동일 패턴 */}
      <div className="hidden lg:block">
        <AdminSidebar roles={roles} />
      </div>
      {/* 모바일 햄버거 + 드로어 (lg 미만) */}
      <div className="lg:hidden">
        <AdminMobileNav roles={roles} />
      </div>
      <main className="lg:ml-64">
        <div className="mx-auto max-w-7xl p-6 pt-16 lg:pt-6">
          {/* 대회 관리 sub-nav (대시보드/단체/내 대회/시리즈/템플릿) */}
          <TournamentAdminNav />
          {children}
        </div>
      </main>
    </div>
  );
}
