import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
// 2026-05-02 Phase A: 모바일 햄버거 + 드로어 (lg 미만 admin 메뉴 진입점)
import { AdminMobileNav } from "@/components/admin/mobile-admin-nav";
// 2026-05-11 admin 마이페이지 Phase 1 — 권한 헬퍼 + 우상단 UserMenu
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getAdminRoles } from "@/lib/auth/admin-roles";
import { UserMenu } from "./_components/user-menu";

/**
 * Admin 레이아웃: 권한별 접근 제어
 * - super_admin: 전체 메뉴
 * - site_admin (admin_role): 유저/코트/커뮤니티/경기/팀/분석
 * - tournament_admin (membershipType=3): 대시보드 + 대회관리 링크
 * - partner_member: DB partner_members 소속 확인
 * - org_member: DB organization_members 소속 확인
 *
 * 2026-05-11 refactor: 권한 계산 로직 → src/lib/auth/admin-roles.ts (getAdminRoles) 추출.
 *   - admin 마이페이지 (`/admin/me`) 와 동일 source 사용 → 정합성 보장.
 *   - React.cache 적용 → 같은 요청에서 layout + 마이페이지 동시 호출해도 DB SELECT 1회.
 *   - 인증 흐름도 `getAuthUser()` 단일 진입점으로 통합 (5/5 박제 룰).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) 인증 단일 진입점 — JWT verify + DB user.status 분기 + 쿠키 자동 cleanup (5/5 박제)
  const auth = await getAuthUser();
  if (auth.state !== "active" || !auth.user || !auth.session) {
    redirect("/login");
  }

  // 2) 권한 매트릭스 — admin-roles 헬퍼 (마이페이지와 동일 source)
  const summary = await getAdminRoles(auth.user.id, auth.session);

  // 3) 아무 관리 역할도 없으면 접근 불가 → 에러 메시지와 함께 로그인 페이지로
  if (summary.roles.length === 0) {
    redirect("/login?error=no_permission");
  }

  // 배경: 프론트 디자인 시스템과 동일한 CSS 변수 사용
  // 2026-05-04: 모바일 사이드바 노출 사고 fix —
  //   AdminSidebar 의 자체 className `hidden lg:flex` 만으로는 어떤 이유로 무효화 가능 (사용자 보고).
  //   layout 에서 명시적 wrapper div 로 viewport 분기 (CSS 안전망 이중화).
  // 2026-05-11: 우상단 UserMenu 추가 — 사용자 표시 + 마이페이지 + 로그아웃 진입점
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* 데스크톱 사이드바 (lg+) — wrapper hidden lg:block 로 강제 가드 */}
      <div className="hidden lg:block">
        <AdminSidebar roles={summary.roles} />
      </div>
      {/* 모바일 햄버거 + 드로어 (lg 미만) — wrapper lg:hidden 로 강제 가드
          드로어 상단 사용자 카드용으로 user 정보 prop 전달 */}
      <div className="lg:hidden">
        <AdminMobileNav
          roles={summary.roles}
          user={{
            nickname: auth.user.nickname,
            email: auth.session.email,
          }}
        />
      </div>
      {/* ml-64: 사이드바 w-64에 맞춤 (lg+ 만)
          모바일 pt-16: 햄버거 버튼 (top-3 left-3 + 40px) 자리 확보 */}
      <main className="lg:ml-64">
        {/* 우상단 UserMenu — PC 만 노출 (모바일은 드로어 상단에서 처리) */}
        <div className="hidden lg:flex justify-end px-6 pt-4">
          <UserMenu
            nickname={auth.user.nickname}
            email={auth.session.email}
          />
        </div>
        <div className="mx-auto max-w-7xl p-6 pt-16 lg:pt-2">{children}</div>
      </main>
    </div>
  );
}
