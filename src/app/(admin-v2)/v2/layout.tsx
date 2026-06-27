// ============================================================
// (admin-v2)/v2/layout.tsx — admin-v2 인증 레이아웃 (R1 토대)
//   - 인증/권한: tournament-admin/layout.tsx 패턴 복제
//     (getWebSession + membershipType≥3/super_admin + buildLoginRedirect)
//   - admin-v2 스코프 CSS import (세그먼트 한정 — /v2/* 에서만 로드)
//   - AdminShell 마운트(V2Shell 클라 래퍼) → children 을 셸 내부에 렌더
//   ⚠ 레거시(components/admin·admin-toss·toss-admin.css) 0 import.
//      신규 CSS 는 전 셀렉터가 [data-admin="v2"] 스코프 → 레거시와 충돌 0.
// ============================================================

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { buildLoginRedirect } from "@/lib/auth/redirect";
import { V2Shell } from "./_shell";

// admin-v2 디자인시스템 CSS (세그먼트 스코프 — /v2/* 라우트에서만 번들 포함)
import "../../../styles/admin-v2/toss.css";
import "../../../styles/admin-v2/admin-pages.css";

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

  const name = session.name || "관리자";
  const role = isSuperAdmin ? "최고 관리자" : "대회 관리자";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <V2Shell user={{ name, role, initial }}>{children}</V2Shell>
  );
}
