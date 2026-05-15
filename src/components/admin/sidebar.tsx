"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
// 2026-05-02 (Admin-Web 시각 통합 v2 Phase 3) — admin 영역에서도 라이트/다크 토글 가능하도록 (web)와 같은 ThemeSwitch 마운트
import { ThemeSwitch } from "@/components/bdr-v2/theme-switch";

/* ============================================================
 * AdminSidebar — 좌측 사이드바 (Admin-2 박제 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin.jsx (AdminSidebar)
 * 박제 target: src/components/admin/sidebar.tsx
 *
 * 이유 (왜):
 *   - 시안 v2.14 의 `.admin-aside / .admin-aside__*` 시각 패턴 박제.
 *   - **props 시그니처 100% 보존** — `roles: AdminRole[]` 그대로.
 *     호출처 layout.tsx 1건 회귀 0.
 *   - navStructure / filterStructureByRoles / Next.js Link/usePathname
 *     패턴 100% 보존 (router 의존성 유지).
 *
 * 어떻게:
 *   1. <aside className="admin-aside"> 로 갈아입힘 (Tailwind → admin.css 클래스).
 *   2. 로고 영역 `.admin-aside__logo` 박제.
 *   3. 메뉴 `.admin-aside__group + .admin-aside__title + .admin-aside__link`
 *      (data-active / data-child 속성으로 시각 분기).
 *   4. 하단 `.admin-aside__foot + .admin-aside__foot-link` 박제.
 * ============================================================ */

// 권한별 메뉴 접근 정의
// "all" = 모든 관리자 권한에서 노출
export type AdminRole =
  | "super_admin"
  | "site_admin"
  | "tournament_admin"
  | "partner_member"
  | "org_member";

export interface AdminNavItem {
  type: "item";
  href: string;
  label: string;
  icon: string;
  roles: AdminRole[] | "all"; // 어떤 역할이 이 메뉴를 볼 수 있는지
  // 2026-05-04: 하위 메뉴 (예: 커뮤니티 → BDR NEWS)
  children?: AdminNavItem[];
}

export interface AdminNavGroup {
  type: "group";
  label: string; // 그룹 헤더 (시각적 구분용, 클릭 X)
  items: AdminNavItem[];
}

export type AdminNavEntry = AdminNavItem | AdminNavGroup;

// 2026-05-04: 메뉴 그룹화 — 18개 평면 → 6개 그룹 (사용자 요청)
// 그룹: 운영 / 콘텐츠 / 사용자 / 비즈니스 / 시스템 / 외부 관리
// 커뮤니티 children = BDR NEWS (사용자 요청)
export const navStructure: AdminNavEntry[] = [
  // 운영 (단독 항목 — 그룹 헤더 없음)
  { type: "item", href: "/admin", label: "대시보드", icon: "dashboard", roles: "all" },

  // 그룹: 콘텐츠
  {
    type: "group",
    label: "콘텐츠",
    items: [
      {
        type: "item",
        href: "/admin/tournaments",
        // 2026-05-04: "토너먼트" → "대회 관리" 통일 (사용자 요청).
        label: "대회 관리",
        icon: "emoji_events",
        roles: ["super_admin", "site_admin"],
        // 2026-05-04: 대회 관리자(tournament_admin) 전용 진입점을 sub-item 으로 통합.
        // 이전 외부 관리 그룹에 별도 위치 → "대회 관리" 메뉴 안으로 삽입 (사용자 요청).
        children: [
          {
            type: "item",
            href: "/tournament-admin",
            label: "대회 운영자 도구",
            icon: "manage_accounts",
            roles: ["super_admin", "site_admin", "tournament_admin"],
          },
        ],
      },
      { type: "item", href: "/admin/games", label: "경기 관리", icon: "sports_basketball", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/teams", label: "팀 관리", icon: "groups", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/courts", label: "코트 관리", icon: "location_on", roles: ["super_admin", "site_admin"] },
      {
        type: "item",
        href: "/admin/community",
        label: "커뮤니티",
        icon: "forum",
        roles: ["super_admin", "site_admin"],
        children: [
          // 2026-05-04: 알기자 (BDR NEWS) 검수 페이지를 커뮤니티 하위로 (사용자 요청)
          {
            type: "item",
            href: "/admin/news",
            label: "BDR NEWS",
            icon: "newspaper",
            roles: ["super_admin", "site_admin"],
          },
        ],
      },
    ],
  },

  // 그룹: 사용자
  {
    type: "group",
    label: "사용자",
    items: [
      { type: "item", href: "/admin/users", label: "유저 관리", icon: "group", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/game-reports", label: "신고 검토", icon: "report", roles: ["super_admin"] },
      { type: "item", href: "/admin/suggestions", label: "건의사항", icon: "lightbulb", roles: ["super_admin"] },
    ],
  },

  // 그룹: 비즈니스
  {
    type: "group",
    label: "비즈니스",
    items: [
      { type: "item", href: "/admin/plans", label: "요금제 관리", icon: "payments", roles: ["super_admin"] },
      { type: "item", href: "/admin/payments", label: "결제", icon: "credit_card", roles: ["super_admin"] },
      { type: "item", href: "/admin/campaigns", label: "광고 캠페인", icon: "campaign", roles: ["super_admin", "partner_member"] },
      { type: "item", href: "/admin/partners", label: "파트너 관리", icon: "handshake", roles: ["super_admin"] },
    ],
  },

  // 그룹: 시스템
  {
    type: "group",
    label: "시스템",
    items: [
      { type: "item", href: "/admin/analytics", label: "분석", icon: "analytics", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/settings", label: "시스템 설정", icon: "settings", roles: ["super_admin"] },
      { type: "item", href: "/admin/logs", label: "활동 로그", icon: "list_alt", roles: ["super_admin"] },
    ],
  },

  // 그룹: 외부 관리 (별도 권한 — partner_member)
  // 2026-05-04: tournament_admin 진입점은 "콘텐츠 > 대회 관리 > 대회 운영자 도구" sub-item 으로 통합 (사용자 요청).
  {
    type: "group",
    label: "외부 관리",
    items: [
      { type: "item", href: "/partner-admin", label: "협력업체 관리", icon: "storefront", roles: ["partner_member"] },
    ],
  },
];

// 역할 필터 — children 도 같이 필터링 (재귀)
// 2026-05-14 fix: parent self-blocked + child visible 케이스 누락 (tournament_admin
//   사용자에게 "대회 운영자 도구" 진입점이 통째로 사라지던 회귀). 이제는 children 1개
//   이상 visible 이면 parent 도 노출 + parent href 를 visible child 의 첫 href 로 rewrite
//   (parent click 시 자동으로 권한 있는 child 페이지로 진입 — 권한 없는 parent href 차단 회피).
function filterItemByRoles(item: AdminNavItem, roles: AdminRole[]): AdminNavItem | null {
  // 1) children 을 먼저 재귀 필터 (parent 가시성 판단에 사용)
  const filteredChildren = item.children
    ?.map((c) => filterItemByRoles(c, roles))
    .filter((c): c is AdminNavItem => c !== null);
  const hasVisibleChildren = !!filteredChildren && filteredChildren.length > 0;

  // 2) self 가시성
  const selfVisible =
    item.roles === "all" || roles.some((r) => item.roles.includes(r));

  // 3) self / children 모두 차단 → 항목 제거 (기존 동작)
  if (!selfVisible && !hasVisibleChildren) return null;

  // 4) self 차단 + child 노출 → parent href 를 child 첫 href 로 rewrite
  //    (UX: "대회 관리" label/icon 유지 + click 시 권한 있는 /tournament-admin 으로 자연 진입)
  const effectiveHref =
    !selfVisible && hasVisibleChildren ? filteredChildren![0].href : item.href;

  return { ...item, href: effectiveHref, children: filteredChildren };
}

// 2026-05-04: 그룹화된 구조에서 역할별 필터 (mobile-admin-nav 도 사용)
export function filterStructureByRoles(roles: AdminRole[]): AdminNavEntry[] {
  return navStructure
    .map((entry) => {
      if (entry.type === "item") {
        return filterItemByRoles(entry, roles);
      }
      // group: items 필터 후 빈 그룹은 제외
      const items = entry.items
        .map((it) => filterItemByRoles(it, roles))
        .filter((it): it is AdminNavItem => it !== null);
      if (items.length === 0) return null;
      return { ...entry, items };
    })
    .filter((e): e is AdminNavEntry => e !== null);
}

interface AdminSidebarProps {
  // 이 유저가 가진 관리 역할들 (복수 가능)
  roles: AdminRole[];
}

// 메뉴 항목 1개 렌더링 (children = data-child 속성으로 들여쓰기 시각)
// 2026-05-15 Admin-2: `.admin-aside__link` 시안 박제 클래스로 갈아입힘
function renderItem(item: AdminNavItem, pathname: string, isChild = false) {
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);
  return (
    <div key={item.href}>
      <Link
        href={item.href}
        className="admin-aside__link"
        data-active={isActive ? "true" : "false"}
        data-child={isChild ? "true" : "false"}
      >
        {/* Material Symbol 아이콘 — admin.css 가 사이즈/색상 자동 처리 */}
        <span className="material-symbols-outlined">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
      {/* children — admin.css 의 data-child="true" 가 padding-left 38px 자동 박제 */}
      {item.children && item.children.length > 0 && (
        <>
          {item.children.map((child) => renderItem(child, pathname, true))}
        </>
      )}
    </div>
  );
}

export function AdminSidebar({ roles }: AdminSidebarProps) {
  const pathname = usePathname();

  // 유저 역할에 맞는 메뉴만 필터링 (그룹 구조)
  const visibleStructure = filterStructureByRoles(roles);

  return (
    // 시안 박제 — admin.css `.admin-aside` 박제 (≥1024 fixed left)
    // hidden lg:flex 는 admin.css 의 @media (max-width: 1024px) display:none 으로 처리
    <aside className="admin-aside">
      {/* 로고 — 시안 .admin-aside__logo */}
      <Link
        href="/admin"
        className="admin-aside__logo"
        style={{ textDecoration: "none" }}
      >
        <Image src="/images/logo.png" alt="BDR" width={100} height={28} className="h-7 w-auto" />
        <span className="admin-aside__logo-badge">ADMIN</span>
      </Link>

      {/* 내비게이션 메뉴 — 그룹화 + 스크롤 가능 */}
      <nav className="admin-aside__nav">
        {visibleStructure.map((entry, idx) => {
          if (entry.type === "item") {
            return (
              <div key={`item-${idx}`} className="admin-aside__group">
                {renderItem(entry, pathname)}
              </div>
            );
          }
          // 그룹 — 시안 .admin-aside__title 헤더 + items
          return (
            <div key={`group-${idx}`} className="admin-aside__group">
              <div className="admin-aside__title">{entry.label}</div>
              {entry.items.map((item) => renderItem(item, pathname))}
            </div>
          );
        })}
      </nav>

      {/* 하단: 테마 토글 + 마이페이지 + 사이트로 돌아가기 */}
      {/* 2026-05-15 Admin-2: 시안 .admin-aside__foot + .admin-aside__foot-link 박제 */}
      <div className="admin-aside__foot">
        {/* 테마 토글 — (web) AppNav 와 동일 컴포넌트 (라이트/다크 듀얼 라벨) */}
        <div style={{ padding: "4px 6px 6px", display: "flex", justifyContent: "center" }}>
          <ThemeSwitch />
        </div>
        {/* 마이페이지 — 사용자 결재 §7 */}
        <Link href="/admin/me" className="admin-aside__foot-link">
          <span className="material-symbols-outlined">account_circle</span>
          마이페이지
        </Link>
        <Link href="/" className="admin-aside__foot-link">
          <span className="material-symbols-outlined">arrow_back</span>
          사이트로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
