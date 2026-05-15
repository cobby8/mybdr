import { redirect } from "next/navigation";
import { headers } from "next/headers";
// 2026-05-15 Admin-2: AdminShell wrap 도입 — 시안 v2.14 박제
import { AdminShell } from "@/components/admin/admin-shell";
// 2026-05-11 admin 마이페이지 Phase 1 — 권한 헬퍼 + 우상단 UserMenu
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getAdminRoles } from "@/lib/auth/admin-roles";
// 2026-05-12 로그인 redirect 통합 — 비로그인 → 로그인 페이지 후 원래 admin 페이지 복귀
import { buildLoginRedirect } from "@/lib/auth/redirect";
import { UserMenu } from "./_components/user-menu";

/**
 * Admin 레이아웃: 권한별 접근 제어 + AdminShell wrap (Admin-2 박제 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin.jsx (AdminShell)
 *
 * 권한 매트릭스:
 * - super_admin: 전체 메뉴
 * - site_admin (admin_role): 유저/코트/커뮤니티/경기/팀/분석
 * - tournament_admin (membershipType=3): 대시보드 + 대회관리 링크
 * - partner_member: DB partner_members 소속 확인
 * - org_member: DB organization_members 소속 확인
 *
 * 2026-05-15 Admin-2: AdminShell wrap 도입.
 *   - 기존 Tailwind 박제 (hidden lg:block / lg:ml-64 / ...) → AdminShell 안 admin.css 클래스
 *   - UserMenu 는 topbarRight slot 에 통합 (PC topbar 우측 / 모바일은 AdminShell 안 AdminMobileNav 가 처리)
 *   - 자식 페이지 props 시그니처 변경 0 — 모든 admin 페이지 회귀 0
 *
 * 2026-05-11 refactor: 권한 계산 로직 → src/lib/auth/admin-roles.ts (getAdminRoles).
 *   - admin 마이페이지 (`/admin/me`) 와 동일 source 사용 → 정합성 보장
 *   - React.cache 적용 → 같은 요청에서 layout + 마이페이지 동시 호출해도 DB SELECT 1회
 *   - 인증 흐름도 `getAuthUser()` 단일 진입점으로 통합 (5/5 박제 룰)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) 인증 단일 진입점 — JWT verify + DB user.status 분기 + 쿠키 자동 cleanup (5/5 박제)
  const auth = await getAuthUser();
  if (auth.state !== "active" || !auth.user || !auth.session) {
    // 2026-05-12: 현재 admin 경로를 redirect 쿼리에 담아 로그인 후 자동 복귀.
    // middleware 가 `x-pathname` / `x-search` 헤더 주입 (`/admin/*` matcher) — fallback "/admin".
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/admin";
    const search = h.get("x-search") ?? "";
    redirect(buildLoginRedirect(pathname, search));
  }

  // 2) 권한 매트릭스 — admin-roles 헬퍼 (마이페이지와 동일 source)
  const summary = await getAdminRoles(auth.user.id, auth.session);

  // 3) 아무 관리 역할도 없으면 접근 불가 → 에러 메시지와 함께 로그인 페이지로
  //    권한 부족 = 로그인 자체는 통과한 케이스 → redirect 쿼리 동봉 안 함 (다른 계정 로그인 권유).
  if (summary.roles.length === 0) {
    redirect("/login?error=no_permission");
  }

  // AdminShell 박제 — sidebar + mobile drawer + topbar + main 통합 wrap (시안 v2.14)
  //   roles: 권한 필터 (AdminSidebar / AdminMobileNav 자동 분기)
  //   user: 모바일 드로어 상단 사용자 카드용 (옵션)
  //   topbarRight: PC 상단 우측 UserMenu — 모바일은 AdminMobileNav 가 처리하므로 lg+ 한정 표시
  //   hideHeader: 자식 페이지가 자체 헤더 박제 (현재 모든 admin 페이지가 AdminPageHeader 직접 호출)
  return (
    <AdminShell
      roles={summary.roles}
      user={{
        nickname: auth.user.nickname,
        email: auth.session.email,
      }}
      hideHeader
      topbarRight={
        // PC topbar 우측 UserMenu — 모바일은 admin.css 가 .admin-topbar 우측을 햄버거 자리로 점유
        <div className="hidden lg:flex">
          <UserMenu
            nickname={auth.user.nickname}
            email={auth.session.email}
          />
        </div>
      }
    >
      {children}
    </AdminShell>
  );
}
