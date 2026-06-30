"use client";

// ============================================================
// referee-console/_referee-shell.tsx — RefereeShell: 심판 콘솔 셸 (R6-B · route 기반 nav)
//   정본 referee-pages.jsx 의 RefereeApp NAV(심판 콘솔, brandSub="심판 콘솔")를
//   1:1 구성. 정본은 client-state 페이지 전환(setPage) → 여기선 Next route 전환으로 적응.
//   ★백오피스 V2Shell / 대회 콘솔 TaShell / 협력 PartnerShell 과 별개 콘솔.
//     같은 AdminShell 컴포넌트를 다른 nav/brandSub/인증(글로벌 super)으로 마운트.
//   - 정본 NAV 12: 운영(대시보드/배정현황/배정캘린더) · 심판단(심판명단/신청관리/자격검증)
//     · 경기·평가(배정요청/평가리포트) · 정산(정산/등급수당) · 시스템(알림/설정).
//   - 배선 6화면(대시보드/배정현황/심판명단/정산/자격검증/설정) = 실라우트.
//   - 미배선 6화면(캘린더/신청관리/배정요청/평가/등급/알림) = "준비 중" placeholder 라우트.
//   - badge = 실 카운트(layout 집계 props). 0 이면 미표시(정직).
// ============================================================

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell, type AdminUser, type NavItem } from "@/components/admin-v2";
import { LogoutButton } from "./_logout-button";

// 내부 콘솔 id → 라우트 (배선 6 + 미배선 6 placeholder)
const TARGET: Record<string, string> = {
  dash: "/referee-console",
  assign: "/referee-console/assignments",
  calendar: "/referee-console/calendar",
  refs: "/referee-console/members",
  bulkReg: "/referee-console/bulk-register",
  apps: "/referee-console/apps",
  verify: "/referee-console/verify",
  bulkVerify: "/referee-console/bulk-verify",
  requests: "/referee-console/requests",
  evals: "/referee-console/evals",
  settle: "/referee-console/settlements",
  grades: "/referee-console/grades",
  noti: "/referee-console/noti",
  settings: "/referee-console/settings",
};

export function RefereeShell({
  user,
  assignBadge,
  verifyBadge,
  settleBadge,
  children,
}: {
  user: AdminUser;
  assignBadge: number; // 미확정 배정(assigned)
  verifyBadge: number; // 미검증 자격증
  settleBadge: number; // 지급 대기 정산
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 정본 NAV 12 — 실 카운트 > 0 일 때만 badge 노출.
  const nav: NavItem[] = [
    { label: "운영" },
    { id: "dash", icon: "layout-dashboard", text: "대시보드" },
    {
      id: "assign",
      icon: "clipboard-check",
      text: "배정 현황",
      ...(assignBadge > 0 ? { badge: assignBadge } : {}),
    },
    { id: "calendar", icon: "calendar-days", text: "배정 캘린더" },
    { label: "심판단" },
    { id: "refs", icon: "users", text: "심판 명단" },
    // 컷오버 4-4c: 레거시 bulk-register/bulk-verify 를 v2 로 포팅. Excel 일괄 처리 2화면.
    { id: "bulkReg", icon: "file-up", text: "일괄 등록" },
    { id: "apps", icon: "inbox", text: "신청 관리" },
    {
      id: "verify",
      icon: "badge-check",
      text: "자격·서류 검증",
      ...(verifyBadge > 0 ? { badge: verifyBadge } : {}),
    },
    { id: "bulkVerify", icon: "file-check", text: "일괄 검증" },
    { label: "경기·평가" },
    { id: "requests", icon: "send", text: "배정 요청" },
    { id: "evals", icon: "star", text: "평가 리포트" },
    { label: "정산" },
    {
      id: "settle",
      icon: "wallet",
      text: "정산",
      ...(settleBadge > 0 ? { badge: settleBadge } : {}),
    },
    { id: "grades", icon: "layers", text: "등급·수당" },
    { label: "시스템" },
    { id: "noti", icon: "bell", text: "알림" },
    { id: "settings", icon: "settings", text: "설정" },
  ];

  // 현재 경로 → 활성 nav id.
  const active = (() => {
    if (pathname === "/referee-console") return "dash";
    const seg = pathname.replace("/referee-console/", "").split("/")[0];
    const map: Record<string, string> = {
      assignments: "assign",
      calendar: "calendar",
      members: "refs",
      "bulk-register": "bulkReg",
      apps: "apps",
      verify: "verify",
      "bulk-verify": "bulkVerify",
      requests: "requests",
      evals: "evals",
      settlements: "settle",
      grades: "grades",
      noti: "noti",
      settings: "settings",
    };
    return map[seg] ?? "";
  })();

  const onNav = (id: string) => {
    router.push(TARGET[id] ?? "/referee-console");
  };

  return (
    <AdminShell
      brand="MyBDR"
      brandSub="심판 콘솔"
      nav={nav}
      active={active}
      onNav={onNav}
      user={user}
      home="/referee-console"
      isHome={pathname === "/referee-console"}
      footAction={<LogoutButton />}
    >
      {children}
    </AdminShell>
  );
}
