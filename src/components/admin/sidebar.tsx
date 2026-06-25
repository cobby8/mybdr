"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
// 2026-05-02 (Admin-Web 시각 통합 v2 Phase 3) — admin 영역에서도 라이트/다크 토글 가능하도록 (web)와 같은 ThemeSwitch 마운트
import { ThemeSwitch } from "@/components/bdr-v2/theme-switch";
// Phase 1 (Toss 전환) — Material Symbols → lucide-react. kit Icon 경유(kebab name).
import { Icon } from "@/components/admin-toss";

// Phase 1 — Material Symbols 아이콘명 → lucide kebab 아이콘명 매핑.
//   navStructure 의 icon 값(Material 명)을 1:1 로 lucide 명으로 바꿔 <Icon> 에 넘긴다.
//   메뉴 정의(navStructure)는 그대로 두고 렌더 시점에만 변환 → 라우팅/구조 불변.
const SIDEBAR_ICON: Record<string, string> = {
  dashboard: "layout-dashboard",
  emoji_events: "trophy",
  manage_accounts: "user-cog",
  sports_basketball: "volleyball", // lucide 에 basketball/dribbble 부재 → 구기 아이콘 volleyball 로 대체
  groups: "users",
  location_on: "map-pin",
  forum: "message-square",
  newspaper: "newspaper",
  group: "users",
  report: "flag",
  lightbulb: "lightbulb",
  payments: "credit-card",
  credit_card: "credit-card",
  campaign: "megaphone",
  handshake: "handshake",
  analytics: "bar-chart-3",
  settings: "settings",
  // A1 IA 재편 — 시스템 그룹 "알림" 항목 아이콘 (Material notifications → lucide bell)
  notifications: "bell",
  bot: "bot",
  // Track B 종별 관리 — 그리드형 카테고리 뷰 아이콘
  grid_view: "layout-grid",
  add_circle: "circle-plus",
  list_alt: "list",
  storefront: "store",
  account_circle: "circle-user",
  arrow_back: "arrow-left",
};

// Material 명을 받아 lucide kebab 명으로 변환(미정의 시 원본 그대로 — Icon 이 빈 span 방어).
//   mobile-admin-nav 도 동일 변환을 쓰도록 export (메뉴 아이콘 일관성).
export function toLucide(name: string): string {
  return SIDEBAR_ICON[name] ?? name;
}

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
  hrefByRole?: Partial<Record<AdminRole, string>>;
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
// 2026-06-22: v2.40 통합 콘솔 Phase A1 — 6그룹 → 1단독 + 4그룹 IA 재편 (시안 방향)
//   변경 = "그룹 배치·라벨"만. 각 항목의 href / roles / children 은 100% 보존(라우트·권한 0 변경).
//   ┌ (단독) 대시보드
//   ├ 운영           : 대회 / 경기 / 팀 / 단체 / 코트
//   ├ 사용자·커뮤니티 : 유저 / 커뮤니티(+BDR NEWS) / 시즌 시상 / 신고 검토 / 건의사항
//   ├ 비즈니스       : 결제 / 요금제 / 광고 캠페인 / 파트너
//   ├ 시스템         : 분석 / 종별 / 알림 / 활동 로그 / 시스템 설정
//   └ (4그룹 밖) 외부 관리 : 협력업체 (별도 권한 partner_member)
//   흡수/이동: 시즌 시상·신고 검토 → 사용자·커뮤니티 / 단체·알림 = 라우트 존재했으나 메뉴 누락분 명시 추가.
//   BDR NEWS = 독립 항목 아님 → 커뮤니티 하위 sub-item 으로 유지(기존 그대로).
export const navStructure: AdminNavEntry[] = [
  // 대시보드 (단독 항목 — 그룹 헤더 없음)
  { type: "item", href: "/admin", label: "대시보드", icon: "dashboard", roles: "all" },

  // 그룹: 운영 — 대회 흐름 핵심 엔티티 (대회/경기/팀/단체/코트)
  {
    type: "group",
    label: "운영",
    items: [
      {
        type: "item",
        href: "/admin/tournaments",
        hrefByRole: { tournament_admin: "/tournament-admin/tournaments" },
        // 2026-05-04: "토너먼트" → "대회 관리" 통일 (사용자 요청).
        label: "대회 관리",
        icon: "emoji_events",
        roles: ["super_admin", "site_admin", "tournament_admin"],
      },
      { type: "item", href: "/admin/games", label: "경기 관리", icon: "sports_basketball", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/teams", label: "팀 관리", icon: "groups", roles: ["super_admin", "site_admin"] },
      // A1 — 단체 관리(/admin/organizations) 명시 추가 (라우트 기존 존재·메뉴 누락분).
      //   다른 운영 항목과 동일 권한(super_admin·site_admin).
      { type: "item", href: "/admin/organizations", label: "단체 관리", icon: "group", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/courts", label: "코트 관리", icon: "location_on", roles: ["super_admin", "site_admin"] },
    ],
  },

  // 그룹: 사용자·커뮤니티 — 유저 + 커뮤니티 콘텐츠 + 시상/신고/건의
  {
    type: "group",
    label: "사용자·커뮤니티",
    items: [
      { type: "item", href: "/admin/users", label: "유저 관리", icon: "group", roles: ["super_admin", "site_admin"] },
      {
        type: "item",
        href: "/admin/community",
        label: "커뮤니티",
        icon: "forum",
        roles: ["super_admin", "site_admin"],
        children: [
          // 2026-05-04: 알기자 (BDR NEWS) 검수 페이지를 커뮤니티 하위로 (사용자 요청)
          //   A1 — BDR NEWS 독립 항목 제거 방침에 부합(이미 커뮤니티 sub-item).
          {
            type: "item",
            href: "/admin/news",
            label: "BDR NEWS",
            icon: "newspaper",
            roles: ["super_admin", "site_admin"],
          },
        ],
      },
      // 시즌 시상(P1-b) — super_admin 직접 입력(올스타/감독/MVP코멘트/수비/매너 등)
      //   A1 — 콘텐츠 그룹 → 사용자·커뮤니티 그룹 이동(권한·href 동일).
      { type: "item", href: "/admin/season-awards", label: "시즌 시상", icon: "emoji_events", roles: ["super_admin"] },
      // A1 — 신고 검토(game-reports) → 사용자·커뮤니티 그룹 이동(권한·href 동일).
      { type: "item", href: "/admin/game-reports", label: "신고 검토", icon: "report", roles: ["super_admin"] },
      { type: "item", href: "/admin/suggestions", label: "건의사항", icon: "lightbulb", roles: ["super_admin"] },
    ],
  },

  // 그룹: 비즈니스 — 결제·요금제·광고·파트너
  {
    type: "group",
    label: "비즈니스",
    items: [
      { type: "item", href: "/admin/payments", label: "결제", icon: "credit_card", roles: ["super_admin"] },
      { type: "item", href: "/admin/plans", label: "요금제 관리", icon: "payments", roles: ["super_admin"] },
      { type: "item", href: "/admin/campaigns", label: "광고 캠페인", icon: "campaign", roles: ["super_admin", "partner_member"] },
      { type: "item", href: "/admin/partners", label: "파트너 관리", icon: "handshake", roles: ["super_admin"] },
    ],
  },

  // 그룹: 시스템 — 분석·종별·알림·로그·설정
  {
    type: "group",
    label: "시스템",
    items: [
      { type: "item", href: "/admin/analytics", label: "분석", icon: "analytics", roles: ["super_admin", "site_admin"] },
      // Track B 종별 마스터(/admin/categories) — super_admin 전용 (시스템 설정과 동일 가드)
      { type: "item", href: "/admin/categories", label: "종별 관리", icon: "grid_view", roles: ["super_admin"] },
      // A1 — 알림(/admin/notifications) 명시 추가 (라우트 기존 존재·메뉴 누락분). 발송 = super_admin 전용.
      { type: "item", href: "/admin/notifications", label: "알림", icon: "notifications", roles: ["super_admin"] },
      { type: "item", href: "/admin/agents", label: "에이전트", icon: "bot", roles: ["super_admin"] },
      { type: "item", href: "/admin/logs", label: "활동 로그", icon: "list_alt", roles: ["super_admin"] },
      { type: "item", href: "/admin/settings", label: "시스템 설정", icon: "settings", roles: ["super_admin"] },
    ],
  },

  // 그룹: 외부 관리 (별도 권한 — partner_member). 본 콘솔 4그룹 IA 밖 별도 항목.
  // 2026-06-24: tournament_admin 진입점은 별도 "대회 운영자 도구" 없이
  // "운영 > 대회 관리"에서 권한 있는 대회 목록으로 바로 진입.
  {
    type: "group",
    label: "외부 관리",
    items: [
      { type: "item", href: "/partner-admin", label: "협력업체 관리", icon: "storefront", roles: ["partner_member"] },
    ],
  },
];

// 역할 필터 — children 도 같이 필터링 (재귀)
// 2026-05-14 fix: parent self-blocked + child visible 케이스 누락 방지.
// 2026-06-24: hrefByRole 이 있으면 일반 운영자처럼 같은 메뉴명에 다른 랜딩이 필요한
//   케이스만 role-aware href 로 치환한다. super/site admin 은 전역 admin href 를 유지한다.
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

  const hasGlobalAdminAccess = roles.includes("super_admin") || roles.includes("site_admin");
  const roleHref = hasGlobalAdminAccess
    ? null
    : roles.map((role) => item.hrefByRole?.[role]).find((href): href is string => !!href);

  // 4) self 차단 + child 노출 → parent href 를 child 첫 href 로 rewrite
  //    (UX: parent label/icon 유지 + click 시 권한 있는 child 페이지로 자연 진입)
  const effectiveHref =
    !selfVisible && hasVisibleChildren ? filteredChildren![0].href : roleHref ?? item.href;

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
          {/* Phase 1 — Material Symbols → lucide(<Icon>). 메뉴 정의는 Material 명 유지, 렌더 시 변환 */}
          <Icon name={toLucide(item.icon)} size={18} />
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
    // Phase 1 — 셸 크롬(사이드바)에만 data-skin="toss" opt-in (공유 .admin-shell/.admin-main 엔 금지)
    <aside data-skin="toss" className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:flex">
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
            <Icon name="circle-user" size={18} />
            마이페이지
          </span>
        </Link>
        <Link href="/" className="aside__link">
          <span>
            <Icon name="arrow-left" size={18} />
            사이트로 돌아가기
          </span>
        </Link>
      </div>
    </aside>
  );
}
