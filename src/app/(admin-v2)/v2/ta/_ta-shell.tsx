"use client";

// ============================================================
// ta/_ta-shell.tsx — TaShell: 대회 콘솔 셸 (route 기반 nav)
//   ★ 2026-07-01 통합: 자체 2섹션 NAV(운영/구성) 폐기 →
//     _shared-nav.ts 의 11콘솔 ADMIN_NAV 로 교체.
//     V2Shell 과 동일한 레일이 렌더된다 (cross-console rail 통일).
//
//   ⑥ 대회 콘솔 하위메뉴 (기존 TaShell 항목 전부 포함):
//     tourDash   /v2/ta              대시보드
//     tourList   /v2/ta/tournaments  대회 목록
//     tourOrgs   /v2/ta/organizations 단체·주최
//     tourLeague /v2/ta/series       정규대회
//     tourTpl    /v2/ta/templates    템플릿
// ============================================================

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell, type AdminUser } from "@/components/admin-v2";
import { LogoutButton } from "./_logout-button";
import { ADMIN_NAV, ADMIN_TARGET, getAdminActive } from "../../_shared-nav";

export function TaShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const active = getAdminActive(pathname);

  const onNav = (id: string) => {
    router.push(ADMIN_TARGET[id] ?? "/v2");
  };

  return (
    <AdminShell
      brand="MyBDR"
      brandSub="관리자 콘솔"
      nav={ADMIN_NAV}
      active={active}
      onNav={onNav}
      user={user}
      home="/v2"
      isHome={pathname === "/v2"}
      footAction={<LogoutButton />}
    >
      {children}
    </AdminShell>
  );
}
