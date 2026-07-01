"use client";

// ============================================================
// _shell.tsx — V2Shell: 백오피스 셸 (route 기반 nav)
//   11콘솔 NAV/TARGET/getAdminActive → _shared-nav.ts 에서 import.
//   TaShell(_ta-shell.tsx)과 동일한 레일을 렌더한다 (cross-console 통합).
// ============================================================

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell, type AdminUser } from "@/components/admin-v2";
import { LogoutButton } from "./_logout-button";
import { ADMIN_NAV, ADMIN_TARGET, getAdminActive } from "../_shared-nav";

export function V2Shell({
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
