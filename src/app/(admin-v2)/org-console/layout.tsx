// ============================================================
// (admin-v2)/org-console/layout.tsx — 단체 Self-Serve 콘솔 인증 게이트 + 셸 마운트 (P1)
//   ★partner/layout.tsx 서버 게이트 패턴 미러(브리프 §3-3).
//   - 인증: getWebSession → organization_members(owner/admin, is_active) 소속 or super_admin.
//     · 미로그인 → buildLoginRedirect(원경로 복귀)
//     · 비로그인 아님 + 미소속(owner/admin 아님) + 비-super → "/" redirect (member 는 공개
//       단체사이트로만 열람 — 콘솔 진입 불가)
//     · super_admin 무소속 → 첫 단체를 미리보기 컨텍스트로 자동 선택(스위처는 후속)
//   - admin-v2 디자인시스템 CSS 를 여기서 import(세그먼트 스코프 = /org-console/* 전용).
//     전 셀렉터 [data-admin="v2"] 스코프라 레거시/다른 콘솔과 충돌 0.
//   ⚠ 백엔드/DB/Prisma 0변경(READ 만) · 레거시 0 import · raw fetch 0.
// ============================================================

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getWebSession } from "@/lib/auth/web-session";
import { buildLoginRedirect } from "@/lib/auth/redirect";
import type { AdminUser } from "@/components/admin-v2";
import { getOrgContext } from "./_org-data";
import { OrgShell } from "./_org-shell";

// admin-v2 디자인시스템 CSS (세그먼트 스코프 — /org-console/* 라우트에서만 번들 포함)
import "../../../styles/admin-v2/toss.css";
import "../../../styles/admin-v2/admin-pages.css";
import "../../../styles/admin-v2/org-console.css";

export default async function OrgConsoleLayout({ children }: { children: React.ReactNode }) {
  // 1) 인증 — 미로그인 시 원래 경로로 복귀하도록 redirect 쿼리에 담음.
  const session = await getWebSession();
  if (!session) {
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/org-console";
    const search = h.get("x-search") ?? "";
    redirect(buildLoginRedirect(pathname, search));
  }

  // 2) 단체 스코프 확정(owner/admin 소속 or super 무소속 미리보기).
  const ctx = await getOrgContext();
  // 일반 유저 + owner/admin 미소속 → 콘솔 진입 불가(member 는 공개 단체사이트로만 열람).
  if (!ctx) {
    redirect("/");
  }

  // 3) 셸 푸터 UserChip 표시 정보(단체명 · 역할 라벨).
  const roleLabel = ctx.role === "owner" ? "단체 관리자(대표)" : ctx.role === "admin" ? "단체 관리자" : "최고 관리자";
  const user: AdminUser = {
    name: ctx.orgName,
    role: roleLabel,
    initial: ctx.orgName.slice(0, 1).toUpperCase(),
  };

  return (
    <OrgShell user={user} brand={ctx.orgName}>
      {children}
    </OrgShell>
  );
}
