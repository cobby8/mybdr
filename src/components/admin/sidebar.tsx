"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
// 2026-05-02 (Admin-Web 시각 통합 v2 Phase 3) — admin 영역에서도 라이트/다크 토글 가능하도록 (web)와 같은 ThemeSwitch 마운트
import { AdminThemeSwitch } from "@/components/admin/admin-theme-switch";
// Phase 1 (Toss 전환) — Material Symbols → lucide-react. kit Icon 경유(kebab name).
import { Icon } from "@/components/admin-toss";
// 2026-06-27 PR-1 배치1.5 — 푸터 UserChip 로그아웃 보존(우상단 UserMenu 제거분 흡수).
import { LogoutButton } from "@/app/(admin)/admin/_components/logout-button";

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
  // M2.5 (v46 흡수): 외부 콘솔 링크. true 면 <Link> 대신 <a href target> + arrow-up-right 아이콘 렌더.
  //   navStructure 의 기존 항목은 미설정 → 항상 내부 링크(레거시 렌더 동일). 신규 외부링크 항목만 opt-in.
  external?: boolean;
  // 외부 링크를 새 탭으로 열지 여부(external=true 일 때만 의미). 기본 false=현재 탭.
  openInNewTab?: boolean;
  // M3 (대회관리자 셸): 정확 일치 활성화. 인덱스/대시보드 항목(예: /v2/tournament-admin)이
  //   하위 라우트(/v2/tournament-admin/tournaments 등)에서도 startsWith 로 활성화되는 것을 막는다.
  //   기존 navStructure 항목은 미설정 → 기존 startsWith 동작 그대로(레거시 0 영향).
  exact?: boolean;
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
        // PR-4 4-A §6-2: 대회 목록 일원화 — 전 역할이 /tournament-admin/tournaments 로 진입.
        //   (구 /admin/tournaments 목록 제거. 상세 /admin/tournaments/[id] 는 직접 URL 유지.)
        href: "/tournament-admin/tournaments",
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
  // 2026-06-27 배치1.5 — 푸터 UserChip 표시용 (옵션). 미전달 시 UserChip 미렌더(회귀 0).
  user?: {
    nickname: string | null;
    email: string;
  };
  // M2.5 (v46 흡수) — 전부 옵셔널·기본 no-op. 미전달 시 기존 렌더 동일(레거시 0 영향).
  home?: string; // 관리자 홈 라우트(brand + BackRow 홈 버튼). 미전달 시 "/admin"(기존 brand href 동일).
  isHome?: boolean; // isHome === false 일 때만 BackRow 렌더. 미전달=BackRow 미렌더.
  footAction?: ReactNode; // 푸터 추가 슬롯. 미전달 시 미렌더.
  // M3 (대회관리자 셸) — 커스텀 네비/브랜드 부제. 전부 옵셔널·opt-in.
  //   nav 전달 시 roles 기반 navStructure 대신 이 트리를 렌더(서브콘솔 전용 메뉴).
  //   미전달 시 기존 filterStructureByRoles(roles) 렌더(레거시 0 영향).
  nav?: AdminNavEntry[];
  brandSub?: string; // 브랜드 로고 하단 부제(예: "대회 콘솔"). 미전달 시 미렌더.
}

// 이니셜 — 닉네임 우선, 없으면 이메일 첫 글자 (UserMenu/모바일 드로어와 동일 규칙)
function getInitial(nickname: string | null, email: string): string {
  const source = nickname?.trim() || email;
  return (source[0] ?? "?").toUpperCase();
}

// 역할 라벨 — 보유 역할 중 최상위 1개를 한국어로 표시 (UserChip 부제용)
function getRoleLabel(roles: AdminRole[]): string {
  const order: { role: AdminRole; label: string }[] = [
    { role: "super_admin", label: "최고 관리자" },
    { role: "site_admin", label: "사이트 관리자" },
    { role: "tournament_admin", label: "대회 관리자" },
    { role: "partner_member", label: "협력업체" },
    { role: "org_member", label: "단체 멤버" },
  ];
  return order.find((o) => roles.includes(o.role))?.label ?? "관리자";
}

// 메뉴 항목 1개 렌더링 (children 들여쓰기 포함)
// PR-1 배치1: ts-navlink + data-active(Toss). 이전 community-aside(.aside__link) 패턴에서 전환.
function renderItem(item: AdminNavItem, pathname: string, depth = 0) {
  // M3 — exact 항목(대시보드 등 인덱스)은 정확 일치만 활성. 그 외는 기존 동작(/admin 특례 + startsWith).
  const isActive = item.exact
    ? pathname === item.href
    : item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);
  const indentStyle = depth > 0 ? { paddingLeft: 28 } : undefined;
  // M2.5 (v46 흡수) — 외부 콘솔 링크: <Link> 대신 <a target> + 우측 arrow-up-right 아이콘.
  //   navStructure 기존 항목은 external 미설정 → 항상 아래 내부 <Link> 분기(레거시 렌더 동일).
  if (item.external) {
    return (
      <a
        key={item.href}
        href={item.href}
        className="ts-navlink"
        title={item.label}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        style={indentStyle}
      >
        <span>
          <Icon name={toLucide(item.icon)} size={18} />
          {item.label}
        </span>
        <Icon
          name="arrow-up-right"
          size={14}
          style={{ marginLeft: "auto", color: "var(--ink-dim)" }}
        />
      </a>
    );
  }
  return (
    <div key={item.href}>
      <Link
        href={item.href}
        className="ts-navlink"
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

// M2.5 (v46 흡수) — BackRow: 사이드바 상단 "뒤로(history.back)" + "관리자 홈" 2버튼.
//   isHome === false(명시 전달) 일 때만 렌더. 데스크톱 사이드바 / 모바일 드로어 공용.
export function AdminBackRow({ homeHref }: { homeHref: string }) {
  return (
    <div className="ts-backrow">
      <button
        type="button"
        className="ts-backbtn"
        onClick={() => window.history.back()}
        title="이전 페이지로"
      >
        <Icon name="arrow-left" size={16} />
        <span>뒤로</span>
      </button>
      <Link href={homeHref} className="ts-backbtn" title="관리자 홈으로">
        <Icon name="home" size={16} />
        <span>관리자 홈</span>
      </Link>
    </div>
  );
}

export function AdminSidebar({ roles, user, home, isHome, footAction, nav, brandSub }: AdminSidebarProps) {
  const pathname = usePathname();

  // M3 — nav 가 전달되면(대회관리자 셸) 그 트리를 렌더, 아니면 기존 roles 필터(레거시 동일).
  const visibleStructure = nav ?? filterStructureByRoles(roles);

  // 배치1.5 — 푸터 UserChip 표시값 (user 미전달 시 미렌더)
  const displayName = user ? user.nickname?.trim() || user.email.split("@")[0] : null;
  const initial = user ? getInitial(user.nickname, user.email) : null;
  const roleLabel = getRoleLabel(roles);

  // M2.5 — 홈 라우트(미전달 시 "/admin" = 기존 brand href 와 동일) + BackRow 노출 여부(opt-in)
  const homeHref = home ?? "/admin";
  const showBackRow = isHome === false;

  return (
    // 사이드바: Toss ts-sidebar 셸 (PR-1 배치1 — ad/Tailwind → ts-*). 토큰은 [data-skin="toss"] 제공.
    // ts-sidebar = position:fixed 248px, lg(≤900px)에서 display:none (모바일은 AdminMobileNav 담당).
    <aside data-skin="toss" className="ts-sidebar">
      {/* M2.5 — BackRow: isHome===false(그린필드 서브화면 opt-in) 일 때만 brand 위에 렌더. 레거시(미전달)는 미렌더. */}
      {showBackRow && <AdminBackRow homeHref={homeHref} />}
      {/* 로고: BDR 이미지 + ADMIN 배지 — ts-sidebar__brand 컨테이너에 실로고 보존 */}
      <Link href={homeHref} className="ts-sidebar__brand">
        <Image src="/images/logo.png" alt="BDR" width={120} height={36} className="h-9 w-auto" />
        <span className="rounded bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
          Admin
        </span>
      </Link>

      {/* M3 — 브랜드 부제(예: "대회 콘솔"). 미전달 시 미렌더(레거시 동일). 토큰 var(--*) 사용. */}
      {brandSub && (
        <div
          style={{
            padding: "2px 12px 10px",
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--ink-mute)",
            letterSpacing: "-0.01em",
          }}
        >
          {brandSub}
        </div>
      )}

      {/* 내비게이션 메뉴 — 그룹화 + 스크롤 가능 (ts-sidebar__label 헤더 + ts-navlink 링크).
          flex-1 nav 에 overflow-y-auto 유지 — 메뉴 많아도 스크롤 (기존 동작 보존). */}
      <nav className="ts-sidebar__nav overflow-y-auto">
        {visibleStructure.map((entry, idx) => {
          if (entry.type === "item") {
            return renderItem(entry, pathname);
          }
          // 그룹 — ts-sidebar__label 헤더 + items (ts-navlink)
          return (
            <div key={`group-${idx}`}>
              <div className="ts-sidebar__label">{entry.label}</div>
              {entry.items.map((item) => renderItem(item, pathname))}
            </div>
          );
        })}
      </nav>

      {/* 하단: UserChip(계정) + 테마 토글 + 마이페이지 + 사이트로 돌아가기 + 로그아웃 */}
      {/* 2026-06-27 배치1.5 — 데스크톱 우상단 UserMenu 제거분을 푸터로 이전. 기존 항목과 공존. */}
      <div className="ts-sidebar__foot">
        {/* UserChip — 아바타(이니셜)+이름+역할+chevron. 클릭=마이페이지(/admin/me=계정 허브) 진입.
            정본 admin-shell.jsx UserChip 패턴(ts-userchip/ts-avatar). user 미전달 시 미렌더. */}
        {user && (
          <Link
            href="/admin/me"
            className="ts-userchip"
            data-active={pathname === "/admin/me" || pathname.startsWith("/admin/me/")}
          >
            <span className="ts-avatar">{initial}</span>
            <div style={{ textAlign: "left", lineHeight: 1.3, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {displayName}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{roleLabel}</div>
            </div>
            <Icon name="chevron-right" size={16} style={{ marginLeft: "auto", color: "var(--ink-dim)" }} />
          </Link>
        )}
        {/* 테마 토글 — (web) AppNav 와 동일 컴포넌트 (라이트/다크 듀얼 라벨, theme-preference localStorage 키) */}
        <div className="px-3 pb-2">
          <AdminThemeSwitch />
        </div>
        {/* 마이페이지 — 사용자 결재 §7 (사이트로 돌아가기 위 / 가장 자연) */}
        <Link
          href="/admin/me"
          className="ts-navlink"
          data-active={pathname === "/admin/me" || pathname.startsWith("/admin/me/")}
        >
          <span>
            <Icon name="circle-user" size={18} />
            마이페이지
          </span>
        </Link>
        <Link href="/" className="ts-navlink">
          <span>
            <Icon name="arrow-left" size={18} />
            사이트로 돌아가기
          </span>
        </Link>
        {/* 로그아웃 — 제거된 우상단 UserMenu 의 로그아웃 진입점 보존(기능 손실 0).
            LogoutButton 컴포넌트 재사용(POST /api/web/logout + full reload 로직 그대로). */}
        {user && <LogoutButton variant="drawer-card" />}
        {/* M2.5 (v46 흡수) — 푸터 추가 슬롯(예: "내 공개 사이트 열기"). 미전달 시 null → 렌더 0. */}
        {footAction}
      </div>
    </aside>
  );
}
