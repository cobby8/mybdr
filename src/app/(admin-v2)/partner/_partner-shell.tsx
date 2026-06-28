"use client";

// ============================================================
// partner/_partner-shell.tsx — PartnerShell: 협력업체 콘솔 셸 (R6-A · route 기반 nav)
//   정본 partner-pages.jsx 의 PartnerApp NAV(협력업체 콘솔, brandSub="협력업체 콘솔")를
//   1:1 구성. 정본은 client-state 페이지 전환(setPage) → 여기선 Next route 전환으로 적응.
//   ★백오피스 V2Shell / 대회 콘솔 TaShell 과 별개 콘솔 — 같은 AdminShell 컴포넌트를
//     다른 nav/brandSub/인증으로 마운트(파트너 페르소나). 다른 콘솔 무영향.
//   - 정본 NAV: 운영(대시보드/내 시설) · 마케팅(캠페인) · 정산.
//   - 시설/캠페인 badge = 실 카운트(layout 집계 props). 0 이면 미표시(정직).
//   - 정산 = R6-C 대기 → 진입 시 "준비 중" placeholder(라우트는 존재 · 데드링크 0).
// ============================================================

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell, type AdminUser, type NavItem } from "@/components/admin-v2";
import { LogoutButton } from "./_logout-button";

// 내부 콘솔 id → 라우트
const TARGET: Record<string, string> = {
  dash: "/partner",
  venues: "/partner/venues",
  campaigns: "/partner/campaigns",
  settle: "/partner/settle",
};

export function PartnerShell({
  user,
  brand,
  venueCount,
  campaignCount,
  children,
}: {
  user: AdminUser;
  brand: string;
  venueCount: number;
  campaignCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 정본 NAV — 운영 + 마케팅 + 정산. 실 카운트 > 0 일 때만 badge 노출.
  const nav: NavItem[] = [
    { label: "운영" },
    { id: "dash", icon: "layout-dashboard", text: "대시보드" },
    {
      id: "venues",
      icon: "map-pin",
      text: "내 시설",
      ...(venueCount > 0 ? { badge: venueCount } : {}),
    },
    { label: "마케팅" },
    {
      id: "campaigns",
      icon: "megaphone",
      text: "캠페인",
      ...(campaignCount > 0 ? { badge: campaignCount } : {}),
    },
    { label: "정산" },
    { id: "settle", icon: "wallet", text: "정산" },
  ];

  // 현재 경로 → 활성 nav id (캠페인 상세는 부모 "campaigns" 활성)
  const active =
    pathname === "/partner"
      ? "dash"
      : pathname.startsWith("/partner/venues")
      ? "venues"
      : pathname.startsWith("/partner/campaigns")
      ? "campaigns"
      : pathname.startsWith("/partner/settle")
      ? "settle"
      : "";

  const onNav = (id: string) => {
    router.push(TARGET[id] ?? "/partner");
  };

  return (
    <AdminShell
      brand={brand}
      brandSub="협력업체 콘솔"
      nav={nav}
      active={active}
      onNav={onNav}
      user={user}
      home="/partner"
      isHome={pathname === "/partner"}
      footAction={<LogoutButton />}
    >
      {children}
    </AdminShell>
  );
}
