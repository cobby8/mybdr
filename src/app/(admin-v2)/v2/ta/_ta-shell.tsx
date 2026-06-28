"use client";

// ============================================================
// ta/_ta-shell.tsx — TaShell: R3 대회 콘솔 셸 (route 기반 nav)
//   정본 ta-pages.jsx 의 TournamentAdminApp NAV(대회 콘솔, brandSub="대회 콘솔")를
//   1:1 구성. 정적 HTML 데모의 client-state 페이지 전환을 Next route 전환으로 적응.
//   ★백오피스 V2Shell 과 별개 콘솔 — 자체 NAV(운영/구성). 같은 AdminShell 컴포넌트를
//     다른 nav/brandSub 로 마운트 → 백오피스 무영향.
//   - 정본 NAV 6번째 "내 공개 사이트"(외부링크)는 단일 org 공개 URL 부재로 미배선 → 생략.
//     (데드링크 0 룰 준수 · 보고)
// ============================================================

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell, type AdminUser, type NavItem } from "@/components/admin-v2";
import { LogoutButton } from "./_logout-button";

// 정본 NAV — 운영(대시보드/대회 목록) + 구성(단체·주최/정규대회/템플릿)
const NAV: NavItem[] = [
  { label: "운영" },
  { id: "dash", icon: "layout-dashboard", text: "대시보드" },
  { id: "list", icon: "trophy", text: "대회 목록" },
  { label: "구성" },
  { id: "orgs", icon: "building-2", text: "단체·주최" },
  { id: "series", icon: "layers", text: "정규대회" },
  { id: "templates", icon: "layout-template", text: "템플릿" },
];

// 내부 콘솔 id → 라우트
const TARGET: Record<string, string> = {
  dash: "/v2/ta",
  list: "/v2/ta/tournaments",
  orgs: "/v2/ta/organizations",
  series: "/v2/ta/series",
  templates: "/v2/ta/templates",
};

export function TaShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 현재 경로 → 활성 nav id
  const active =
    pathname === "/v2/ta"
      ? "dash"
      : pathname.startsWith("/v2/ta/tournaments")
      ? "list"
      : pathname.startsWith("/v2/ta/organizations")
      ? "orgs"
      : pathname.startsWith("/v2/ta/series")
      ? "series"
      : pathname.startsWith("/v2/ta/templates")
      ? "templates"
      : "";

  const onNav = (id: string) => {
    router.push(TARGET[id] ?? "/v2/ta");
  };

  return (
    <AdminShell
      brand="MyBDR"
      brandSub="대회 콘솔"
      nav={NAV}
      active={active}
      onNav={onNav}
      user={user}
      home="/v2/ta"
      isHome={pathname === "/v2/ta"}
      footAction={<LogoutButton />}
    >
      {children}
    </AdminShell>
  );
}
