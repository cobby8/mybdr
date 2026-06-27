// =====================================================================
// admin-v2/ta-console-nav.ts — 대회관리자 셸(M3 파일럿) 사이드바 네비 정의
//   정본: Dev/design/BDR v2.41-admin-toss/ta-pages.jsx 의 NAV(대회 콘솔 5메뉴)
//   - 운영: 대시보드 / 대회 목록
//   - 구성: 단체·주최 / 정규대회 / 템플릿
//   "내 공개 사이트"(external)는 nav 가 아니라 셸 footAction 으로 분리(정본/태스크 지시).
//   라우트는 전부 신규 (admin-v2)/v2/tournament-admin/* — 레거시 (admin)/tournament-admin 0접촉.
// =====================================================================

import type { AdminNavEntry } from "@/components/admin/sidebar";

// 대회관리자 콘솔 홈(대시보드) 경로 — brand/홈 링크 + exact 활성 기준.
export const TA_CONSOLE_HOME = "/v2/tournament-admin";

export const TA_CONSOLE_NAV: AdminNavEntry[] = [
  {
    type: "group",
    label: "운영",
    items: [
      // 대시보드 = 인덱스 라우트 → exact(하위 라우트에서 startsWith 로 같이 활성화되는 것 방지)
      {
        type: "item",
        href: "/v2/tournament-admin",
        label: "대시보드",
        icon: "dashboard",
        roles: "all",
        exact: true,
      },
      {
        type: "item",
        href: "/v2/tournament-admin/tournaments",
        label: "대회 목록",
        icon: "emoji_events",
        roles: "all",
      },
    ],
  },
  {
    type: "group",
    label: "구성",
    items: [
      {
        type: "item",
        href: "/v2/tournament-admin/organizations",
        label: "단체·주최",
        icon: "group",
        roles: "all",
      },
      {
        type: "item",
        href: "/v2/tournament-admin/series",
        // 용어 확정(v46): 시리즈 → 정규대회. 코드 키(series)는 라우트에 유지.
        label: "정규대회",
        icon: "layers",
        roles: "all",
      },
      {
        type: "item",
        href: "/v2/tournament-admin/templates",
        label: "템플릿",
        icon: "layout-template",
        roles: "all",
      },
    ],
  },
];
