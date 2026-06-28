// ============================================================
// (admin-v2)/partner/layout.tsx — 협력업체 콘솔 인증 게이트 + 셸 마운트 (R6-A)
//   ★파트너 페르소나 인증 — /v2/layout(tournament-admin 게이트) 과 별개.
//     파트너는 tournament_admin 이 아니므로 /v2 그룹에 못 올림 → 자체 라우트.
//   - 인증: getWebSession → partner_members(is_active) 소속 or super_admin.
//     · 미로그인 → buildLoginRedirect(원경로 복귀)
//     · 비로그인 아님 + 미소속 + 비-super → no_permission redirect
//   - admin-v2 디자인시스템 CSS 를 여기서 import(세그먼트 스코프 = /partner/* 전용).
//     전 셀렉터 [data-admin="v2"] 스코프라 레거시/다른 콘솔과 충돌 0.
//   - 셸은 PartnerShell(협력 NAV) 마운트 — nav badge = 실 시설/캠페인 카운트.
//   ⚠ 백엔드/DB/Prisma 0변경 · 레거시 0 import · raw fetch 0.
// ============================================================

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { buildLoginRedirect } from "@/lib/auth/redirect";
import type { AdminUser } from "@/components/admin-v2";
import { getPartnerContext } from "./_partner-data";
import { PartnerShell } from "./_partner-shell";

// admin-v2 디자인시스템 CSS (세그먼트 스코프 — /partner/* 라우트에서만 번들 포함)
import "../../../styles/admin-v2/toss.css";
import "../../../styles/admin-v2/admin-pages.css";

export default async function PartnerConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) 인증 — 미로그인 시 원래 경로로 복귀하도록 redirect 쿼리에 담음.
  const session = await getWebSession();
  if (!session) {
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/partner";
    const search = h.get("x-search") ?? "";
    redirect(buildLoginRedirect(pathname, search));
  }

  // 2) 파트너 스코프 확정(소속 멤버 or super 무소속).
  const ctx = await getPartnerContext();
  // 비-super 이면서 소속 파트너가 없으면 접근 불가(파트너 콘솔은 파트너 전용).
  if (!ctx || (!ctx.partnerId && !ctx.isSuper)) {
    redirect("/login?error=no_permission");
  }

  // 3) nav badge 용 실 카운트(시설 = owner 코트 / 캠페인 = partner 캠페인).
  const [venueCount, campaignCount] = await Promise.all([
    ctx.ownerId
      ? prisma.court_infos.count({ where: { user_id: ctx.ownerId } })
      : Promise.resolve(0),
    ctx.partnerId
      ? prisma.ad_campaigns.count({ where: { partner_id: ctx.partnerId } })
      : Promise.resolve(0),
  ]);

  // 4) 셸 푸터 UserChip 표시 정보(소속 파트너명 / 역할 라벨).
  const user: AdminUser = {
    name: ctx.partnerName,
    // super 가 소속 없이 진입한 경우만 "최고 관리자", 그 외 파트너는 "시설 운영사"(정본).
    role: ctx.isSuper && !ctx.partnerId ? "최고 관리자" : "시설 운영사",
    initial: ctx.partnerName.slice(0, 1).toUpperCase(),
  };

  return (
    <PartnerShell
      user={user}
      brand={ctx.partnerName}
      venueCount={venueCount}
      campaignCount={campaignCount}
    >
      {children}
    </PartnerShell>
  );
}
