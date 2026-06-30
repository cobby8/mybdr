// ============================================================
// (admin-v2)/referee-console/layout.tsx — 심판 콘솔 인증 게이트 + 셸 마운트 (R6-B · 4-3 권한개방)
//   ★스코프 = 전역(super/recorder) + 협회 admin 공존. 협회 admin 은 자기 협회만(page READ 필터).
//     · 레거시 `(referee)/referee/`가 URL `/referee` 점유 → 본 콘솔은 `/referee-console`.
//   - 인증: getWebSession → getRefereeAdminContext(전역 우선 판정 후 비-전역만 getAssociationAdmin).
//     · 미로그인 → buildLoginRedirect(원경로 복귀)
//     · 무권한(비admin·매핑부재) → no_permission redirect
//   - admin-v2 디자인시스템 CSS 를 여기서 import(세그먼트 스코프 = /referee-console/* 전용).
//     전 셀렉터 [data-admin="v2"] 스코프라 레거시/다른 콘솔과 충돌 0.
//   - 셸은 RefereeShell(심판 NAV) 마운트 — nav badge = 실 카운트(전역=전 협회 / 협회=자기 협회).
//   ⚠ 백엔드/DB/Prisma 0변경 · layout 가드 + page READ 필터만 · raw fetch 0.
// ============================================================

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getWebSession } from "@/lib/auth/web-session";
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

  // 2) 권한 게이트(4-3 개방) — 전역(super/recorder) OR 협회 admin(+매핑) 통과.
  //    ctx = getRefereeAdminContext = getRefereeScope 기반(전역 우선 판정 후 비-전역만 getAssociationAdmin).
  //    null = 무권한(비admin·매핑부재) → no_permission. 레거시 referee/admin/layout 차단 로직 이식.
  const ctx = await getRefereeAdminContext();
  if (!ctx) {
    redirect("/login?error=no_permission");
  }

  // 3) nav badge 용 실 카운트 — 협회 admin 은 자기 협회 심판만, 전역=전 협회 통합.
  //    3종 모두 referee 관계경유 필터(association_id). 배정=미확정/검증=미검증/정산=지급대기.
  const badgeWhere = ctx.isSuper
    ? {}
    : { referee: { association_id: ctx.associationId } };
  // 신청 관리(apps) 배지 = 대기(submitted) 신청 건수.
  //   ★스코프 경로가 다름: 신청은 referee 가 아닌 announcement.association_id 로 협회 판정.
  //   전역 super 는 필터 0(전 협회 통합).
  //   associationId 는 비-전역(협회 admin)에서 항상 존재(getRefereeScope 보장).
  //   타입상 bigint|null 이지만 announcement.association_id 는 non-null 컬럼 → 0n 폴백으로 좁힘.
  const appsWhere = ctx.isSuper
    ? { status: "submitted" }
    : {
        status: "submitted",
        announcement: { association_id: ctx.associationId ?? BigInt(0) },
      };
  const [assignBadge, verifyBadge, settleBadge, appsBadge] = await Promise.all([
    prisma.refereeAssignment.count({ where: { status: "assigned", ...badgeWhere } }),
    prisma.refereeCertificate.count({ where: { verified: false, ...badgeWhere } }),
    prisma.refereeSettlement.count({ where: { status: "pending", ...badgeWhere } }),
    prisma.assignmentApplication.count({ where: appsWhere }),
  ]);

  // 4) 셸 푸터 UserChip 표시 정보 — 전역=최고 관리자 / 협회=협회 관리자.
  const user: AdminUser = {
    name: ctx.name,
    role: ctx.isSuper ? "최고 관리자" : "협회 관리자",
    initial: ctx.name.slice(0, 1).toUpperCase(),
  };

  return (
    <RefereeShell
      user={user}
      assignBadge={assignBadge}
      verifyBadge={verifyBadge}
      settleBadge={settleBadge}
      appsBadge={appsBadge}
    >
      {children}
    </RefereeShell>
  );
}
