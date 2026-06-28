// ============================================================
// (admin-v2)/referee-console/layout.tsx — 심판 콘솔 인증 게이트 + 셸 마운트 (R6-B)
//   ★스코프 = 글로벌 super-admin. 레거시 협회별 심판 admin(`/referee/admin`)과 별개.
//     · 레거시 `(referee)/referee/`가 URL `/referee` 점유 → 본 콘솔은 `/referee-console`.
//   - 인증: getWebSession → isSuperAdmin(session) only(전역). 협회 멤버십 불요.
//     · 미로그인 → buildLoginRedirect(원경로 복귀)
//     · 비-super → no_permission redirect (협회 admin 은 레거시 콘솔로)
//   - admin-v2 디자인시스템 CSS 를 여기서 import(세그먼트 스코프 = /referee-console/* 전용).
//     전 셀렉터 [data-admin="v2"] 스코프라 레거시/다른 콘솔과 충돌 0.
//   - 셸은 RefereeShell(심판 NAV) 마운트 — nav badge = 실 카운트(전역·협회필터 0).
//   ⚠ 백엔드/DB/Prisma 0변경 · 레거시 0 import · raw fetch 0.
// ============================================================

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";
import { buildLoginRedirect } from "@/lib/auth/redirect";
import type { AdminUser } from "@/components/admin-v2";
import { getRefereeAdminContext } from "./_referee-data";
import { RefereeShell } from "./_referee-shell";

// admin-v2 디자인시스템 CSS (세그먼트 스코프 — /referee-console/* 라우트에서만 번들 포함)
import "../../../styles/admin-v2/toss.css";
import "../../../styles/admin-v2/admin-pages.css";

export const dynamic = "force-dynamic";

export default async function RefereeConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) 인증 — 미로그인 시 원래 경로로 복귀하도록 redirect 쿼리에 담음.
  const session = await getWebSession();
  if (!session) {
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/referee-console";
    const search = h.get("x-search") ?? "";
    redirect(buildLoginRedirect(pathname, search));
  }

  // 2) 글로벌 super-admin 게이트 — 비-super 차단(협회 admin 은 레거시 /referee/admin).
  if (!isSuperAdmin(session)) {
    redirect("/login?error=no_permission");
  }

  // 3) 셸 표시용 컨텍스트(닉네임) — super 확정 후라 항상 존재.
  const ctx = await getRefereeAdminContext();

  // 4) nav badge 용 실 카운트(전역 · 협회 필터 0).
  //    배정 = 미확정(assigned) / 검증 = 미검증 자격증 / 정산 = 지급 대기.
  const [assignBadge, verifyBadge, settleBadge] = await Promise.all([
    prisma.refereeAssignment.count({ where: { status: "assigned" } }),
    prisma.refereeCertificate.count({ where: { verified: false } }),
    prisma.refereeSettlement.count({ where: { status: "pending" } }),
  ]);

  // 5) 셸 푸터 UserChip 표시 정보.
  const user: AdminUser = {
    name: ctx?.name ?? "심판 운영",
    role: "최고 관리자",
    initial: (ctx?.name ?? "심").slice(0, 1).toUpperCase(),
  };

  return (
    <RefereeShell
      user={user}
      assignBadge={assignBadge}
      verifyBadge={verifyBadge}
      settleBadge={settleBadge}
    >
      {children}
    </RefereeShell>
  );
}
