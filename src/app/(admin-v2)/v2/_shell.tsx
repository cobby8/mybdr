"use client";

// ============================================================
// _shell.tsx — V2Shell: R2-A 백오피스 셸 (route 기반 nav)
//   정본 bo-pages.jsx 의 NAV(5콘솔 + 보조)를 1:1 구성. 정적 HTML 데모의
//   client-state 페이지 전환을 Next route 전환으로 적응(시각/IA 동일).
//   - 빌드된 화면: 관리자 홈(/v2) · 유저 콘솔(/v2/user-console) · 공개 사이트
//   - 미빌드(다음 증분): /v2/soon?c=<id> "준비 중" 플레이스홀더(mock 0)
//   - 외부 콘솔 런처: 대회=/tournament-admin(실존) · 심판/협력=준비 중
// ============================================================

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell, type AdminUser, type NavItem } from "@/components/admin-v2";
import { LogoutButton } from "./_logout-button";

// 정본 NAV — { label } 그룹 / { id } 내부 콘솔 / { href } 외부 런처
const NAV: NavItem[] = [
  { label: "운영" },
  { id: "dash", icon: "layout-dashboard", text: "관리자 홈" },
  { id: "logs", icon: "scroll-text", text: "활동 로그" },
  { label: "운영 콘솔" },
  { id: "userConsole", icon: "users", text: "유저 콘솔" },
  { href: "/v2/ta", icon: "trophy", text: "대회 콘솔" },
  { id: "matchConsole", icon: "swords", text: "매칭 콘솔" },
  { id: "communityConsole", icon: "message-square", text: "커뮤니티 콘솔" },
  { id: "courtConsole", icon: "map-pin", text: "코트 콘솔" },
  { href: "/v2/soon?c=referee", icon: "gavel", text: "심판 콘솔" },
  // 협력업체 콘솔 = super_admin 의 파트너사 승인·관리 콘솔(컷오버 포팅·soon 해제)
  { id: "partnerConsole", icon: "handshake", text: "협력업체 콘솔" },
  // 뉴스 콘솔 = 알기자(BDR NEWS) 운영자 검수 콘솔(컷오버 포팅)
  { id: "newsConsole", icon: "newspaper", text: "뉴스 콘솔" },
  // 매너 평가 콘솔 = super_admin 의 매너 신고 검토·통계 콘솔(컷오버 포팅·game-reports)
  { id: "mannerConsole", icon: "scale", text: "매너 평가" },
  { id: "marketingConsole", icon: "megaphone", text: "마케팅 콘솔" },
  { id: "publicsite", icon: "globe", text: "공개 사이트" },
  { label: "정산·플랜" },
  { id: "payments", icon: "credit-card", text: "결제" },
  { id: "plans", icon: "layers", text: "요금제" },
  { label: "시스템" },
  { id: "categories", icon: "layout-grid", text: "종별 관리" },
  // 시즌 시상 콘솔 = super_admin 의 시즌 시상 입력·관리 콘솔(컷오버 포팅·season-awards)
  { id: "seasonAwards", icon: "award", text: "시즌 시상" },
  { id: "notifications", icon: "bell", text: "알림" },
  { id: "settings", icon: "settings", text: "설정" },
  { id: "mypage", icon: "user", text: "마이페이지" },
];

// 내부 콘솔 id → 라우트. 미빌드는 /v2/soon?c=<id> 플레이스홀더.
const TARGET: Record<string, string> = {
  dash: "/v2",
  userConsole: "/v2/user-console",
  publicsite: "/v2/public-site",
  logs: "/v2/logs",
  matchConsole: "/v2/match-console",
  communityConsole: "/v2/community-console",
  courtConsole: "/v2/court-console",
  partnerConsole: "/v2/partner-console",
  newsConsole: "/v2/news-console",
  mannerConsole: "/v2/manner-console",
  marketingConsole: "/v2/marketing-console",
  payments: "/v2/payments",
  plans: "/v2/plans",
  categories: "/v2/categories",
  seasonAwards: "/v2/season-awards",
  notifications: "/v2/notifications",
  settings: "/v2/settings",
  mypage: "/v2/mypage",
};

export function V2Shell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 현재 경로 → 활성 nav id (pathname 만 사용 — Suspense 불필요)
  const active =
    pathname === "/v2"
      ? "dash"
      : pathname.startsWith("/v2/user-console")
      ? "userConsole"
      : pathname === "/v2/public-site"
      ? "publicsite"
      : pathname.startsWith("/v2/match-console")
      ? "matchConsole"
      : pathname.startsWith("/v2/community-console")
      ? "communityConsole"
      : pathname.startsWith("/v2/court-console")
      ? "courtConsole"
      : pathname.startsWith("/v2/partner-console")
      ? "partnerConsole"
      : pathname.startsWith("/v2/news-console")
      ? "newsConsole"
      : pathname.startsWith("/v2/manner-console")
      ? "mannerConsole"
      : pathname.startsWith("/v2/marketing-console")
      ? "marketingConsole"
      : pathname.startsWith("/v2/payments")
      ? "payments"
      : pathname.startsWith("/v2/plans")
      ? "plans"
      : pathname.startsWith("/v2/logs")
      ? "logs"
      : pathname.startsWith("/v2/categories")
      ? "categories"
      : pathname.startsWith("/v2/season-awards")
      ? "seasonAwards"
      : pathname.startsWith("/v2/notifications")
      ? "notifications"
      : pathname.startsWith("/v2/settings")
      ? "settings"
      : pathname.startsWith("/v2/mypage")
      ? "mypage"
      : "";

  const onNav = (id: string) => {
    const href = TARGET[id] ?? "/v2";
    router.push(href);
  };

  return (
    <AdminShell
      brand="MyBDR"
      brandSub="관리자 콘솔"
      nav={NAV}
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
