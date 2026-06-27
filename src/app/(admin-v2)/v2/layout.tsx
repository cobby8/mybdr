import { redirect } from "next/navigation";
import { headers } from "next/headers";
// 인증 — tournament-admin/layout.tsx 패턴 복제(getWebSession + buildLoginRedirect).
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { buildLoginRedirect } from "@/lib/auth/redirect";
// 셸/토스트 — 기존 자산 재사용(PR-1.5 정합본: 사이드바 푸터 UserChip·로그아웃 보존).
import { ToastProvider } from "@/contexts/toast-context";
import { AdminShell } from "@/components/admin/admin-shell";
import type { AdminRole } from "@/components/admin/sidebar";
// M3 — 대회관리자 콘솔 네비(5메뉴) + 홈 경로.
import { TA_CONSOLE_NAV, TA_CONSOLE_HOME } from "@/components/admin-v2/ta-console-nav";
import { Icon } from "@/components/admin-toss";

/**
 * (admin-v2) 그린필드 셸 레이아웃 — `/v2/*` 전 페이지 wrap.
 *
 * 왜 (이유):
 *   - 그린필드 리빌딩 M2 토대셋. 레거시 (admin)/tournament-admin 은 미접촉,
 *     `(admin-v2)` 새 route group 으로 병행 → 영역별 검증 후 디렉토리 스왑 교체.
 *   - 루트 middleware 없음(M1 점검). 보호는 세그먼트 레이아웃(서버컴포넌트)이 담당 →
 *     본 레이아웃이 tournament-admin 인증 패턴을 그대로 복제한다.
 *
 * 방법 (어떻게):
 *   1) getWebSession() — 미인증 시 buildLoginRedirect(x-pathname) 로 로그인 후 복귀.
 *   2) 권한 — membershipType>=3(대회관리자) 또는 super_admin. 부족 시 no_permission.
 *   3) AdminShell 마운트(roles 필터 사이드바 + 계정 푸터/로그아웃). data-skin="toss" 는
 *      AdminShell 루트가 제공.
 *
 * M3 파일럿(대회관리자 셸 5화면)이 이 위에 올라간다.
 */
export default async function AdminV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) 인증 — getWebSession()
  const session = await getWebSession();
  if (!session) {
    // proxy.ts 가 x-pathname/x-search 를 모든 경로에 주입 → 로그인 후 원래 v2 경로 복귀.
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/v2";
    const search = h.get("x-search") ?? "";
    redirect(buildLoginRedirect(pathname, search));
  }

  // 2) 권한 매트릭스 — tournament-admin/layout.tsx 와 동일 기준(복제)
  const userId = BigInt(session.sub);
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      membershipType: true,
      isAdmin: true,
      admin_role: true,
      nickname: true,
      email: true,
    },
  });
  const isSuperAdmin =
    dbUser?.isAdmin === true ||
    dbUser?.admin_role === "super_admin" ||
    session.role === "super_admin" ||
    session.admin_role === "super_admin";
  const isTournamentAdmin =
    (dbUser?.membershipType ?? 0) >= 3 || session.role === "tournament_admin";

  if (!isTournamentAdmin && !isSuperAdmin) {
    // 권한 부족(로그인은 통과) → 다른 계정 로그인 권유. redirect 쿼리 미동봉.
    redirect("/login?error=no_permission");
  }

  // 3) AdminShell roles — 대회관리자 파일럿 기준 사이드바 nav 필터.
  const roles: AdminRole[] = [];
  if (isSuperAdmin) roles.push("super_admin");
  if (isTournamentAdmin) roles.push("tournament_admin");

  return (
    <ToastProvider>
      {/* AdminShell 루트가 data-skin="toss" + 사이드바(UserChip/로그아웃)/모바일 드로어 제공.
          M3 — 대회관리자 콘솔: 커스텀 nav(5메뉴) + brandSub + 홈 + footAction("내 공개 사이트").
          nav 전달 → roles 기반 navStructure 대신 콘솔 5메뉴 렌더(M2.5 opt-in 패턴). */}
      <AdminShell
        roles={roles}
        user={{
          nickname: dbUser?.nickname ?? session.name ?? null,
          email: dbUser?.email ?? session.email,
        }}
        hideHeader
        nav={TA_CONSOLE_NAV}
        brandSub="대회 콘솔"
        home={TA_CONSOLE_HOME}
        footAction={
          // 내 공개 사이트 열기 — 외부 링크만(PR-5 공개사이트 별도 트랙). 새 탭.
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="ts-cancelbtn"
            style={{ textDecoration: "none" }}
          >
            <Icon name="globe" size={16} />
            <span>내 공개 사이트 열기</span>
          </a>
        }
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
