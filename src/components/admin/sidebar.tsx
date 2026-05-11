"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
// 2026-05-02 (Admin-Web 시각 통합 v2 Phase 3) — admin 영역에서도 라이트/다크 토글 가능하도록 (web)와 같은 ThemeSwitch 마운트
import { ThemeSwitch } from "@/components/bdr-v2/theme-switch";

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
function filterItemByRoles(item: AdminNavItem, roles: AdminRole[]): AdminNavItem | null {
  const visible =
    item.roles === "all" || roles.some((r) => item.roles.includes(r));
  if (!visible) return null;
  // children 도 같은 룰로 필터
  const filteredChildren = item.children
    ?.map((c) => filterItemByRoles(c, roles))
    .filter((c): c is AdminNavItem => c !== null);
  return { ...item, children: filteredChildren };
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

// 메뉴 항목 1개 렌더링 (children 들여쓰기 포함)
// 2026-05-04: (web) community-aside 패턴 (.aside__link + data-active) 적용 — 시각 통일
function renderItem(item: AdminNavItem, pathname: string, depth = 0) {
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);
  const indentStyle = depth > 0 ? { paddingLeft: 28 } : undefined;
  return (
    <div key={item.href}>
      <Link
        href={item.href}
        className="aside__link"
        data-active={isActive}
        style={indentStyle}
      >
        <span>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>
          {item.label}
        </span>
      </Link>
      {/* children — 들여쓰기 (28px), 항상 노출 */}
      {item.children && item.children.length > 0 && (
        <div>
          {item.children.map((child) => renderItem(child, pathname, depth + 1))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebar({ roles }: AdminSidebarProps) {
  const pathname = usePathname();

  // 유저 역할에 맞는 메뉴만 필터링 (그룹 구조)
  const visibleStructure = filterStructureByRoles(roles);

  return (
    // 사이드바: CSS 변수 기반 배경/보더 (다크모드 자동 전환)
    // 2026-05-04: overflow-y-auto + flex-1 nav 로 메뉴 많아도 스크롤 가능 (사용자 요청)
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:flex">
      {/* 로고: BDR 이미지 + ADMIN 배지 */}
      <Link href="/admin" className="mb-6 flex items-center gap-3 px-3 shrink-0">
        <Image src="/images/logo.png" alt="BDR" width={120} height={36} className="h-9 w-auto" />
        <span className="rounded bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
          Admin
        </span>
      </Link>

      {/* 내비게이션 메뉴 — 그룹화 + 스크롤 가능
          2026-05-04: (web) community-aside 패턴 (.aside__title + .aside__link) 적용 */}
      <nav className="flex-1 overflow-y-auto pr-1 -mr-1">
        {visibleStructure.map((entry, idx) => {
          if (entry.type === "item") {
            return renderItem(entry, pathname);
          }
          // 그룹 — .aside__title 헤더 + items (community-aside 와 동일 클래스)
          return (
            <div key={`group-${idx}`}>
              <div className="aside__title">{entry.label}</div>
              {entry.items.map((item) => renderItem(item, pathname))}
            </div>
          );
        })}
      </nav>

      {/* 하단: 테마 토글 + 마이페이지 + 사이트로 돌아가기 */}
      {/* 2026-05-11 admin 마이페이지 Phase 1 — "마이페이지" 1줄 추가 (사이트로 돌아가기 위) */}
      <div className="mt-3 border-t border-[var(--color-border)] pt-3 shrink-0">
        {/* 테마 토글 — (web) AppNav 와 동일 컴포넌트 (라이트/다크 듀얼 라벨, theme-preference localStorage 키) */}
        <div className="px-3 pb-2">
          <ThemeSwitch />
        </div>
        {/* 마이페이지 — 사용자 결재 §7 (사이트로 돌아가기 위 / 가장 자연) */}
        <Link
          href="/admin/me"
          className="aside__link"
          data-active={pathname === "/admin/me" || pathname.startsWith("/admin/me/")}
        >
          <span>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_circle</span>
            마이페이지
          </span>
        </Link>
        <Link href="/" className="aside__link">
          <span>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            사이트로 돌아가기
          </span>
        </Link>
      </div>
    </aside>
  );
}
