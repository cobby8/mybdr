"use client";

// ============================================================
// _shell.tsx — V2Shell: 백오피스 셸 (route 기반 nav)
//   정본 hub-data.jsx HUB_NAV 11콘솔 구조를 1:1 구성. 정적 HTML 데모의
//   client-state 페이지 전환을 Next route 전환으로 적응(시각/IA 동일).
//
//   11 레일 섹션:
//     ① 운영          ② 유저 콘솔      ③ 매칭 콘솔      ④ 커뮤니티 콘솔
//     ⑤ 코트 콘솔     ⑥ 대회 콘솔      ⑦ 심판 콘솔      ⑧ 협력업체 콘솔
//     ⑨ 마케팅 콘솔   ⑩ 정산·플랜      ⑪ 시스템
//
//   하위메뉴 라우트:
//     - 실존 라우트: 직접 연결
//     - 미빌드 하위메뉴: /v2/soon?c=<id> 플레이스홀더 (mock 0)
//     - 대회 콘솔 (/v2/ta/*): TaShell 전용 레이어로 전환
//     - 심판 콘솔 (/referee-console/*): super_admin 전용 레이어로 전환
// ============================================================

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell, type AdminUser, type NavItem } from "@/components/admin-v2";
import { LogoutButton } from "./_logout-button";

// 정본 HUB_NAV — { label } 그룹 / { id } 내부 링크
// 미빌드 하위메뉴: /v2/soon?c=<id> (준비중 플레이스홀더, mock 0)
const NAV: NavItem[] = [
  // ① 운영
  { label: "운영" },
  { id: "dash", icon: "layout-dashboard", text: "관리자 홈" },
  { id: "logs", icon: "list",             text: "활동 로그" },

  // ② 유저 콘솔
  { label: "유저 콘솔" },
  { id: "userMembers", icon: "user",       text: "사용자" },
  { id: "userTeams",   icon: "users",      text: "팀" },
  { id: "userOrgs",    icon: "building-2", text: "단체" },

  // ③ 매칭 콘솔
  { label: "매칭 콘솔" },
  { id: "matchGuest",  icon: "user-plus",  text: "게스트 모집" },
  { id: "matchPickup", icon: "volleyball", text: "픽업게임" },
  { id: "matchScrim",  icon: "swords",     text: "연습경기" },

  // ④ 커뮤니티 콘솔
  { label: "커뮤니티 콘솔" },
  { id: "commBoard",  icon: "message-square", text: "게시판" },
  { id: "commHot",    icon: "flame",          text: "인기글" },
  { id: "commReport", icon: "flag",           text: "신고 검토" },
  { id: "commNews",   icon: "newspaper",      text: "BDR NEWS" },

  // ⑤ 코트 콘솔
  { label: "코트 콘솔" },
  { id: "courtIndoor",  icon: "building-2",   text: "실내코트" },
  { id: "courtOutdoor", icon: "map-pin",      text: "야외코트" },
  { id: "courtCheckin", icon: "check-circle", text: "체크인" },

  // ⑥ 대회 콘솔 (TaShell 레이어 — /v2/ta/* 진입 시 TaShell 전환)
  { label: "대회 콘솔" },
  { id: "tourDash",   icon: "layout-dashboard", text: "대시보드" },
  { id: "tourList",   icon: "trophy",           text: "대회 목록" },
  { id: "tourLeague", icon: "layers",           text: "정규대회" },
  { id: "tourTpl",    icon: "layout-template",  text: "템플릿" },

  // ⑦ 심판 콘솔 (super_admin 전용 /referee-console/* 레이어)
  { label: "심판 콘솔" },
  { id: "refAssign", icon: "clipboard-list", text: "배정" },
  { id: "refVerify", icon: "shield-check",   text: "검증" },
  { id: "refGrade",  icon: "star",           text: "등급" },
  { id: "refPay",    icon: "credit-card",    text: "수당 정산" },

  // ⑧ 협력업체 콘솔
  { label: "협력업체 콘솔" },
  { id: "partnerFac",    icon: "building-2",  text: "제휴 시설" },
  { id: "partnerCamp",   icon: "megaphone",   text: "캠페인" },
  { id: "partnerSettle", icon: "credit-card", text: "정산" },

  // ⑨ 마케팅 콘솔
  { label: "마케팅 콘솔" },
  { id: "mktCampaign", icon: "megaphone", text: "광고 캠페인" },
  { id: "mktPromo",    icon: "ticket",    text: "프로모션" },
  { id: "mktBanner",   icon: "image",     text: "배너 관리" },

  // ⑩ 정산·플랜
  { label: "정산·플랜" },
  { id: "payments", icon: "credit-card", text: "결제" },
  { id: "plans",    icon: "layers",      text: "요금제" },

  // ⑪ 시스템
  { label: "시스템" },
  { id: "categories",    icon: "layout-grid", text: "종별 관리" },
  { id: "seasonAwards",  icon: "award",       text: "시즌 시상" },
  { id: "mannerConsole", icon: "scale",       text: "매너 평가" },
  { id: "notifications", icon: "bell",        text: "알림" },
  { id: "settings",      icon: "settings",    text: "설정" },
  { id: "mypage",        icon: "user",        text: "마이페이지" },
  { id: "publicsite",    icon: "globe",       text: "공개 사이트" },
];

// id → 라우트 매핑
// soon 처리: 미빌드 하위메뉴 → /v2/soon?c=<id> (mock 0, 준비중 플레이스홀더)
const TARGET: Record<string, string> = {
  // ① 운영
  dash:          "/v2",
  logs:          "/v2/logs",
  // ② 유저 콘솔
  userMembers:   "/v2/user-console",
  userTeams:     "/v2/soon?c=user-teams",    // 미빌드
  userOrgs:      "/v2/soon?c=user-orgs",     // 미빌드
  // ③ 매칭 콘솔
  matchGuest:    "/v2/match-console",
  matchPickup:   "/v2/soon?c=match-pickup",  // 미빌드
  matchScrim:    "/v2/soon?c=match-scrim",   // 미빌드
  // ④ 커뮤니티 콘솔
  commBoard:     "/v2/community-console",
  commHot:       "/v2/soon?c=comm-hot",      // 미빌드
  commReport:    "/v2/soon?c=comm-report",   // 미빌드
  commNews:      "/v2/news-console",
  // ⑤ 코트 콘솔
  courtIndoor:   "/v2/court-console",
  courtOutdoor:  "/v2/soon?c=court-outdoor", // 미빌드
  courtCheckin:  "/v2/soon?c=court-checkin", // 미빌드
  // ⑥ 대회 콘솔 (TaShell 레이어)
  tourDash:      "/v2/ta",
  tourList:      "/v2/ta/tournaments",
  tourLeague:    "/v2/ta/series",
  tourTpl:       "/v2/ta/templates",
  // ⑦ 심판 콘솔 (referee-console 레이어)
  refAssign:     "/referee-console/assignments",
  refVerify:     "/referee-console/verify",
  refGrade:      "/referee-console/grades",
  refPay:        "/referee-console/settlements",
  // ⑧ 협력업체 콘솔
  partnerFac:    "/v2/partner-console",
  partnerCamp:   "/v2/soon?c=partner-camp",    // 미빌드
  partnerSettle: "/v2/soon?c=partner-settle",  // 미빌드
  // ⑨ 마케팅 콘솔
  mktCampaign:   "/v2/marketing-console",
  mktPromo:      "/v2/soon?c=mkt-promo",    // 미빌드
  mktBanner:     "/v2/soon?c=mkt-banner",   // 미빌드
  // ⑩ 정산·플랜
  payments:      "/v2/payments",
  plans:         "/v2/plans",
  // ⑪ 시스템
  categories:    "/v2/categories",
  seasonAwards:  "/v2/season-awards",
  mannerConsole: "/v2/manner-console",
  notifications: "/v2/notifications",
  settings:      "/v2/settings",
  mypage:        "/v2/mypage",
  publicsite:    "/v2/public-site",
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
    // ① 운영
    pathname === "/v2"
      ? "dash"
      : pathname.startsWith("/v2/logs")
      ? "logs"
      // ② 유저 콘솔
      : pathname.startsWith("/v2/user-console")
      ? "userMembers"
      // ③ 매칭 콘솔
      : pathname.startsWith("/v2/match-console")
      ? "matchGuest"
      // ④ 커뮤니티 콘솔
      : pathname.startsWith("/v2/news-console")
      ? "commNews"
      : pathname.startsWith("/v2/community-console")
      ? "commBoard"
      // ⑤ 코트 콘솔
      : pathname.startsWith("/v2/court-console")
      ? "courtIndoor"
      // ⑥ 대회 콘솔 (/v2/ta/* — TaShell 레이어, 진입 시 TaShell 이 렌더됨)
      : pathname.startsWith("/v2/ta/tournaments")
      ? "tourList"
      : pathname.startsWith("/v2/ta/series")
      ? "tourLeague"
      : pathname.startsWith("/v2/ta/templates")
      ? "tourTpl"
      : pathname.startsWith("/v2/ta")
      ? "tourDash"
      // ⑦ 심판 콘솔
      : pathname.startsWith("/referee-console/assignments")
      ? "refAssign"
      : pathname.startsWith("/referee-console/verify") || pathname.startsWith("/referee-console/bulk-verify")
      ? "refVerify"
      : pathname.startsWith("/referee-console/grades")
      ? "refGrade"
      : pathname.startsWith("/referee-console/settlements")
      ? "refPay"
      // ⑧ 협력업체 콘솔
      : pathname.startsWith("/v2/partner-console")
      ? "partnerFac"
      // ⑨ 마케팅 콘솔
      : pathname.startsWith("/v2/marketing-console")
      ? "mktCampaign"
      // ⑩ 정산·플랜
      : pathname.startsWith("/v2/payments")
      ? "payments"
      : pathname.startsWith("/v2/plans")
      ? "plans"
      // ⑪ 시스템
      : pathname.startsWith("/v2/categories")
      ? "categories"
      : pathname.startsWith("/v2/season-awards")
      ? "seasonAwards"
      : pathname.startsWith("/v2/manner-console")
      ? "mannerConsole"
      : pathname.startsWith("/v2/notifications")
      ? "notifications"
      : pathname.startsWith("/v2/settings")
      ? "settings"
      : pathname.startsWith("/v2/mypage")
      ? "mypage"
      : pathname.startsWith("/v2/public-site")
      ? "publicsite"
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
