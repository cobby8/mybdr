// ============================================================
// (admin-v2)/v2/layout.tsx — admin-v2 공통 인증 게이트 (R3 리팩터)
//   - 인증/권한만 담당(getWebSession + membershipType≥3/super_admin +
//     buildLoginRedirect). ★셸 마운트는 하지 않는다 → children 그대로 통과.
//   - 셸은 자식 그룹 레이아웃이 각각 마운트:
//       (backoffice)/layout.tsx → V2Shell (백오피스 NAV)
//       ta/layout.tsx           → TaShell (대회 콘솔 NAV)
//     이렇게 분리해야 백오피스 셸이 대회 콘솔에 중첩되지 않는다.
//   - admin-v2 스코프 CSS 는 여기서 import → /v2/* 전체(백오피스+대회콘솔)에 적용.
//   ⚠ 레거시(components/admin·admin-toss·toss-admin.css) 0 import.
//      신규 CSS 는 전 셀렉터가 [data-admin="v2"] 스코프 → 레거시와 충돌 0.
//   ⚠ 백오피스 회귀 0: 인증 로직은 종전과 동일, 셸 마운트 위치만 그룹 레이아웃으로 이동.
// ============================================================

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { buildLoginRedirect } from "@/lib/auth/redirect";

// admin-v2 디자인시스템 CSS (세그먼트 스코프 — /v2/* 라우트에서만 번들 포함)
import "../../../styles/admin-v2/toss.css";
import "../../../styles/admin-v2/admin-pages.css";
import "../../../styles/admin-v2/workspace.css";

export default async function AdminV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWebSession();
  if (!session) {
    // 비로그인 → 현재 경로를 redirect 쿼리에 담아 로그인 후 복귀
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/v2";
    const search = h.get("x-search") ?? "";
    redirect(buildLoginRedirect(pathname, search));
  }

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

  // 셸은 자식 그룹 레이아웃이 마운트 → 인증 통과 후 children 그대로 통과.
  return <>{children}</>;
}
