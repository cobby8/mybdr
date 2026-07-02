"use client";

// ============================================================
// org-console/_org-shell.tsx — OrgShell: 단체 Self-Serve 콘솔 셸 (route 기반 nav)
//   정본 참조: org-pages.jsx OrgApp NAV(듀얼네비 · {label} 섹션 구분).
//   partner/_partner-shell.tsx 와 동일 패턴 — 정본은 client-state 페이지 전환(setPage) →
//   여기선 Next route 전환으로 적응.
//   ★8레일(멤버·임원·소속팀·회원신청·대회리그·하위단체·공지·회비정산)은 전부 ComingSoon 골격
//     (_coming-soon.tsx) — 이번 P1은 대시보드 · 단체 정보만 실동작.
// ============================================================

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell, type AdminUser, type NavItem } from "@/components/admin-v2";
import { LogoutButton } from "./_logout-button";

// 내부 콘솔 id → 라우트
const TARGET: Record<string, string> = {
  dash: "/org-console",
  profile: "/org-console/profile",
  members: "/org-console/members",
  officers: "/org-console/officers",
  teams: "/org-console/teams",
  applications: "/org-console/applications",
  leagues: "/org-console/leagues",
  suborgs: "/org-console/suborgs",
  notices: "/org-console/notices",
  billing: "/org-console/billing",
};

// 정본 NAV — 운영 / 회원·팀 / 경기·대회 / 정산 4섹션(org-pages.jsx 1:1).
const NAV: NavItem[] = [
  { label: "운영" },
  { id: "dash", icon: "layout-dashboard", text: "대시보드" },
  { id: "profile", icon: "building-2", text: "단체 정보" },
  { label: "회원·팀" },
  { id: "members", icon: "users", text: "멤버" },
  { id: "officers", icon: "contact-round", text: "임원" },
  { id: "teams", icon: "shield", text: "소속 팀" },
  { id: "applications", icon: "user-plus", text: "회원 신청" },
  { label: "경기·대회" },
  { id: "leagues", icon: "trophy", text: "대회·리그" },
  { id: "suborgs", icon: "network", text: "하위 단체" },
  { id: "notices", icon: "megaphone", text: "공지" },
  { label: "정산" },
  { id: "billing", icon: "wallet", text: "회비 정산" },
];

export function OrgShell({
  user,
  brand,
  children,
}: {
  user: AdminUser;
  brand: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 현재 경로 → 활성 nav id
  const active =
    pathname === "/org-console"
      ? "dash"
      : Object.entries(TARGET).find(([id, href]) => id !== "dash" && pathname.startsWith(href))?.[0] ?? "";

  const onNav = (id: string) => {
    router.push(TARGET[id] ?? "/org-console");
  };

  return (
    <AdminShell
      brand={brand}
      brandSub="단체 콘솔"
      nav={NAV}
      active={active}
      onNav={onNav}
      user={user}
      home="/org-console"
      isHome={pathname === "/org-console"}
      footAction={<LogoutButton />}
    >
      {children}
    </AdminShell>
  );
}
