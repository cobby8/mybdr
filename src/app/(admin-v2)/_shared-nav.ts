// ============================================================
// _shared-nav.ts — 11콘솔 공유 NAV (V2Shell + TaShell + RefereeShell 공용)
//   모든 어드민 콘솔이 동일한 레일을 렌더한다. route 진입점 무관.
//
//   배지 주입:
//     · V2Shell / TaShell → ADMIN_NAV = buildAdminNav() (배지 없음, 하위호환)
//     · RefereeShell       → buildAdminNav({ assign, apps, verify, settle })
//
//   ⑥ 대회 콘솔 (/v2/ta/* — TaShell 레이어):
//     tourDash/List/Orgs/League/Tpl
//
//   ⑦ 심판 콘솔 (/referee-console/* — RefereeShell 레이어, 16 items):
//     운영(대시/공고/일자별운영/배정현황/캘린더)
//     심판단(명단/일괄등록/신청관리/자격서류검증/일괄검증)
//     경기·평가(배정요청/평가리포트) + 정산(정산/등급수당) + 시스템(알림/설정)
// ============================================================

import type { NavItem } from "@/components/admin-v2";

// ──────────────────────────────────────────────
// 배지 인터페이스 (심판 콘솔 4종)
// ──────────────────────────────────────────────
export interface RefBadges {
  assign?: number; // 미확정 배정
  apps?: number;   // 대기 신청
  verify?: number; // 미검증 자격증
  settle?: number; // 지급 대기 정산
}

// ──────────────────────────────────────────────
// 11콘솔 NAV 빌더 (AdminShell nav prop)
//   badges 미전달 → V2Shell/TaShell (배지 없음)
//   badges 전달   → RefereeShell    (배지 주입)
// ──────────────────────────────────────────────
export function buildAdminNav(badges?: RefBadges): NavItem[] {
  const b = badges ?? {};

  return [
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

    // ⑥ 대회 콘솔 (/v2/ta/* 레이어 — TaShell 이 렌더됨)
    { label: "대회 콘솔" },
    { id: "tourDash",   icon: "layout-dashboard", text: "대시보드" },
    { id: "tourList",   icon: "trophy",           text: "대회 목록" },
    { id: "tourOrgs",   icon: "building-2",       text: "단체·주최" },
    { id: "tourLeague", icon: "layers",           text: "정규대회" },
    { id: "tourTpl",    icon: "layout-template",  text: "템플릿" },

    // ⑦ 심판 콘솔 (/referee-console/* 레이어 — 16 items, 배지 동적 주입)
    { label: "심판 콘솔" },
    // 운영 그룹
    { id: "refDash",     icon: "layout-dashboard", text: "대시보드" },
    { id: "refAnnounce", icon: "megaphone",         text: "배정 공고" },
    { id: "refPools",    icon: "calendar-range",    text: "일자별 운영" },
    {
      id: "refAssign", icon: "clipboard-check", text: "배정 현황",
      ...(b.assign && b.assign > 0 ? { badge: b.assign } : {}),
    },
    { id: "refCalendar", icon: "calendar-days", text: "배정 캘린더" },
    // 심판단 그룹
    { id: "refMembers",    icon: "users",      text: "심판 명단" },
    { id: "refBulkReg",    icon: "file-up",    text: "일괄 등록" },
    {
      id: "refApps", icon: "inbox", text: "신청 관리",
      ...(b.apps && b.apps > 0 ? { badge: b.apps } : {}),
    },
    {
      id: "refVerify", icon: "badge-check", text: "자격·서류 검증",
      ...(b.verify && b.verify > 0 ? { badge: b.verify } : {}),
    },
    { id: "refBulkVerify", icon: "file-check", text: "일괄 검증" },
    // 경기·평가 그룹
    { id: "refRequests", icon: "send", text: "배정 요청" },
    { id: "refEvals",    icon: "star", text: "평가 리포트" },
    // 정산 그룹
    {
      id: "refSettle", icon: "wallet", text: "정산",
      ...(b.settle && b.settle > 0 ? { badge: b.settle } : {}),
    },
    { id: "refGrades", icon: "layers", text: "등급·수당" },
    // 시스템 그룹
    { id: "refNoti",     icon: "bell",     text: "알림" },
    { id: "refSettings", icon: "settings", text: "설정" },

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
}

// 편의 export — V2Shell/TaShell 하위호환 (배지 없음)
export const ADMIN_NAV: NavItem[] = buildAdminNav();

// ──────────────────────────────────────────────
// id → 라우트 매핑 (55 entries)
// soon 처리: 미빌드 하위메뉴 → /v2/soon?c=<id>
// ──────────────────────────────────────────────
export const ADMIN_TARGET: Record<string, string> = {
  // ① 운영
  dash:          "/v2",
  logs:          "/v2/logs",
  // ② 유저 콘솔 (서브라우트 실연결 — /teams·/orgs 각 탭 직접 진입)
  userMembers:   "/v2/user-console",
  userTeams:     "/v2/user-console/teams",
  userOrgs:      "/v2/user-console/orgs",
  // ③ 매칭 콘솔
  matchGuest:    "/v2/match-console",
  matchPickup:   "/v2/soon?c=match-pickup",
  matchScrim:    "/v2/soon?c=match-scrim",
  // ④ 커뮤니티 콘솔
  commBoard:     "/v2/community-console",
  commHot:       "/v2/soon?c=comm-hot",
  commReport:    "/v2/soon?c=comm-report",
  commNews:      "/v2/news-console",
  // ⑤ 코트 콘솔
  courtIndoor:   "/v2/court-console",
  courtOutdoor:  "/v2/soon?c=court-outdoor",
  courtCheckin:  "/v2/soon?c=court-checkin",
  // ⑥ 대회 콘솔 (TaShell 레이어)
  tourDash:      "/v2/ta",
  tourList:      "/v2/ta/tournaments",
  tourOrgs:      "/v2/ta/organizations",
  tourLeague:    "/v2/ta/series",
  tourTpl:       "/v2/ta/templates",
  // ⑦ 심판 콘솔 (referee-console 레이어 — 16 routes)
  refDash:       "/referee-console",
  refAnnounce:   "/referee-console/announcements",
  refPools:      "/referee-console/pools",
  refAssign:     "/referee-console/assignments",
  refCalendar:   "/referee-console/calendar",
  refMembers:    "/referee-console/members",
  refBulkReg:    "/referee-console/bulk-register",
  refApps:       "/referee-console/apps",
  refVerify:     "/referee-console/verify",
  refBulkVerify: "/referee-console/bulk-verify",
  refRequests:   "/referee-console/requests",
  refEvals:      "/referee-console/evals",
  refSettle:     "/referee-console/settlements",
  refGrades:     "/referee-console/grades",
  refNoti:       "/referee-console/noti",
  refSettings:   "/referee-console/settings",
  // ⑧ 협력업체 콘솔
  partnerFac:    "/v2/partner-console",
  partnerCamp:   "/v2/soon?c=partner-camp",
  partnerSettle: "/v2/soon?c=partner-settle",
  // ⑨ 마케팅 콘솔
  mktCampaign:   "/v2/marketing-console",
  mktPromo:      "/v2/soon?c=mkt-promo",
  mktBanner:     "/v2/soon?c=mkt-banner",
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

// ──────────────────────────────────────────────
// pathname → 활성 nav id
// ──────────────────────────────────────────────
export function getAdminActive(pathname: string): string {
  // ① 운영
  if (pathname === "/v2") return "dash";
  if (pathname.startsWith("/v2/logs")) return "logs";
  // ② 유저 콘솔 (더 구체적인 경로 먼저)
  if (pathname.startsWith("/v2/user-console/teams")) return "userTeams";
  if (pathname.startsWith("/v2/user-console/orgs"))  return "userOrgs";
  if (pathname.startsWith("/v2/user-console"))        return "userMembers";
  // ③ 매칭 콘솔
  if (pathname.startsWith("/v2/match-console")) return "matchGuest";
  // ④ 커뮤니티 콘솔 (news-console 먼저)
  if (pathname.startsWith("/v2/news-console")) return "commNews";
  if (pathname.startsWith("/v2/community-console")) return "commBoard";
  // ⑤ 코트 콘솔
  if (pathname.startsWith("/v2/court-console")) return "courtIndoor";
  // ⑥ 대회 콘솔 (더 구체적인 경로 먼저)
  if (pathname.startsWith("/v2/ta/tournaments"))   return "tourList";
  if (pathname.startsWith("/v2/ta/organizations")) return "tourOrgs";
  if (pathname.startsWith("/v2/ta/series"))        return "tourLeague";
  if (pathname.startsWith("/v2/ta/templates"))     return "tourTpl";
  if (pathname.startsWith("/v2/ta"))               return "tourDash";
  // ⑦ 심판 콘솔 (/referee-console/* — 더 구체적인 경로 먼저)
  if (pathname === "/referee-console")                       return "refDash";
  if (pathname.startsWith("/referee-console/announcements")) return "refAnnounce";
  if (pathname.startsWith("/referee-console/pools"))         return "refPools";
  if (pathname.startsWith("/referee-console/assignments"))   return "refAssign";
  if (pathname.startsWith("/referee-console/calendar"))      return "refCalendar";
  if (pathname.startsWith("/referee-console/members"))       return "refMembers";
  if (pathname.startsWith("/referee-console/bulk-register")) return "refBulkReg";
  if (pathname.startsWith("/referee-console/apps"))          return "refApps";
  if (pathname.startsWith("/referee-console/bulk-verify"))   return "refBulkVerify";
  if (pathname.startsWith("/referee-console/verify"))        return "refVerify";
  if (pathname.startsWith("/referee-console/requests"))      return "refRequests";
  if (pathname.startsWith("/referee-console/evals"))         return "refEvals";
  if (pathname.startsWith("/referee-console/settlements"))   return "refSettle";
  if (pathname.startsWith("/referee-console/grades"))        return "refGrades";
  if (pathname.startsWith("/referee-console/noti"))          return "refNoti";
  if (pathname.startsWith("/referee-console/settings"))      return "refSettings";
  // ⑧ 협력업체 콘솔
  if (pathname.startsWith("/v2/partner-console")) return "partnerFac";
  // ⑨ 마케팅 콘솔
  if (pathname.startsWith("/v2/marketing-console")) return "mktCampaign";
  // ⑩ 정산·플랜
  if (pathname.startsWith("/v2/payments")) return "payments";
  if (pathname.startsWith("/v2/plans"))    return "plans";
  // ⑪ 시스템
  if (pathname.startsWith("/v2/categories"))     return "categories";
  if (pathname.startsWith("/v2/season-awards"))  return "seasonAwards";
  if (pathname.startsWith("/v2/manner-console")) return "mannerConsole";
  if (pathname.startsWith("/v2/notifications"))  return "notifications";
  if (pathname.startsWith("/v2/settings"))       return "settings";
  if (pathname.startsWith("/v2/mypage"))         return "mypage";
  if (pathname.startsWith("/v2/public-site"))    return "publicsite";
  return "";
}
