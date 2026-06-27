"use client";

// ============================================================
// _shell.tsx — V2Shell 클라 래퍼 (R1 토대)
//   AdminShell(정본 셸)에 샘플 nav + active 상태를 주입하고 children 을
//   셸 main 내부에 렌더. 인증은 부모 layout(서버)에서 처리.
//   R2 에서는 이 nav 를 영역별 실제 메뉴로 교체해 토대를 재사용.
// ============================================================

import React from "react";
import { AdminShell, Btn, type AdminUser, type NavItem } from "@/components/admin-v2";

// 토대 데모 nav — 그룹 헤더 / 내부 링크(badge) / 외부 콘솔 링크(arrow-up-right) 3종 시연
const NAV: NavItem[] = [
  { label: "토대 데모" },
  { id: "overview", icon: "layout-dashboard", text: "쇼케이스", badge: "1" },
  { id: "tables", icon: "table", text: "테이블 · 스키마" },
  { id: "forms", icon: "sliders-horizontal", text: "설정 · 폼" },
  { label: "외부 콘솔" },
  { href: "/admin", icon: "shield", text: "레거시 백오피스" },
];

export function V2Shell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const [active, setActive] = React.useState("overview");
  return (
    <AdminShell
      brand="BDR 관리자"
      brandSub="admin-v2 토대"
      nav={NAV}
      active={active}
      onNav={setActive}
      user={user}
      home="/v2"
      isHome={false}
      footAction={
        <Btn variant="ghost" size="sm" block icon="log-out">
          로그아웃
        </Btn>
      }
    >
      {children}
    </AdminShell>
  );
}
