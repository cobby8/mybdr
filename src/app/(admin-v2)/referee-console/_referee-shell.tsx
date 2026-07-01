"use client";

// ============================================================
// referee-console/_referee-shell.tsx — RefereeShell: 심판 콘솔 셸 (R6-B · route 기반 nav)
//   ★ 2026-07-01 통합: 자체 5섹션 NAV(16 items) 폐기 →
//     _shared-nav.ts 의 buildAdminNav({ assign, apps, verify, settle }) 로 교체.
//     V2Shell/TaShell 과 동일한 11콘솔 레일을 렌더한다 (cross-console rail 통일).
//
//   배지 동적 주입 — layout.tsx 가 실 카운트를 props 로 전달:
//     assignBadge  미확정 배정 (refAssign 항목)
//     appsBadge    대기 신청  (refApps 항목)
//     verifyBadge  미검증 자격증 (refVerify 항목)
//     settleBadge  지급 대기 정산 (refSettle 항목)
//   0 이면 미표시(정직). V2Shell/TaShell에서는 배지 없음(하위호환).
//
//   권한 게이트: layout.tsx 의 super/협회admin 인증 미터치.
// ============================================================

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell, type AdminUser } from "@/components/admin-v2";
import { LogoutButton } from "./_logout-button";
import { buildAdminNav, ADMIN_TARGET, getAdminActive } from "../_shared-nav";

export function RefereeShell({
  user,
  assignBadge,
  verifyBadge,
  settleBadge,
  appsBadge,
  children,
}: {
  user: AdminUser;
  assignBadge: number; // 미확정 배정
  verifyBadge: number; // 미검증 자격증
  settleBadge: number; // 지급 대기 정산
  appsBadge: number;   // 대기(submitted) 신청
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 배지 주입 NAV — 0이면 미표시(layout 집계값 그대로)
  const nav = buildAdminNav({
    assign: assignBadge,
    apps:   appsBadge,
    verify: verifyBadge,
    settle: settleBadge,
  });

  const active = getAdminActive(pathname);

  const onNav = (id: string) => {
    router.push(ADMIN_TARGET[id] ?? "/v2");
  };

  return (
    <AdminShell
      brand="MyBDR"
      brandSub="관리자 콘솔"
      nav={nav}
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
