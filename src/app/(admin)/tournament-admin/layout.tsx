import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
// 2026-05-12 로그인 redirect 통합 — 비로그인 → 로그인 페이지 후 원래 tournament-admin 페이지 복귀
import { buildLoginRedirect } from "@/lib/auth/redirect";
// 2026-05-12 hotfix — CopyLinkButton 등 client component 가 useToast 호출 → (admin) 영역에 ToastProvider 부재로 throw.
// (web)/(score-sheet) layout 과 동일 패턴으로 ToastProvider mount.
import { ToastProvider } from "@/contexts/toast-context";

/**
 * 대회 관리 레이아웃 — 서버 컴포넌트로 권한 검증 수행.
 * 2026-05-04 (사용자 요청): (web) 그룹 → (admin) 그룹으로 이동. admin sidebar + mobile nav 적용.
 * URL 경로 (`/tournament-admin/...`) 는 그대로 유지 (라우트 그룹은 URL 미반영).
 *
 * role: tournament_admin 또는 super_admin 만 접근 가능 (admin/layout.tsx 와 동일 권한 체크).
 * 미로그인 또는 권한 부족 시 홈으로 리다이렉트.
 *
 * UI: v2.41/v2.42 Toss standalone workspace. 운영/생성/수정 시안은 전역 관리자
 * sidebar 없이 full-width 로 동작하므로 이 레이아웃은 인증/권한 wrapper 만 담당한다.
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
  const userId = BigInt(session.sub);
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipType: true, isAdmin: true, admin_role: true },
  });
  const isSuperAdmin =
    dbUser?.isAdmin === true ||
    dbUser?.admin_role === "super_admin" ||
    session.role === "super_admin" ||
    session.admin_role === "super_admin";
  const isTournamentAdmin =
    (dbUser?.membershipType ?? 0) >= 3 || session.role === "tournament_admin";

  if (!isTournamentAdmin && !isSuperAdmin) {
    redirect("/login?error=no_permission");
  }

  return (
    <ToastProvider>
      <div data-skin="toss" className="min-h-screen">
        <main>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
