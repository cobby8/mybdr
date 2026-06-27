import type { ReactNode } from "react";
import { AdminSidebar, type AdminRole, type AdminNavEntry } from "./sidebar";
import { AdminMobileNav } from "./mobile-admin-nav";
import { AdminPageHeader } from "./admin-page-header";

interface AdminShellProps {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string; onClick?: () => void }[];
  sidebarVariant?: "default" | "hidden";
  roles: AdminRole[];
  user?: {
    nickname: string | null;
    email: string;
  };
  hideHeader?: boolean;
  // ── M2.5 v46 셸 패턴 흡수 (전부 옵셔널·기본 no-op → 레거시 미전달 시 렌더 동일) ──
  // 관리자 홈 라우트. brand 로고 + BackRow "관리자 홈" 버튼 링크. 미전달 시 sidebar 내부 기본 "/admin".
  home?: string;
  // 홈 화면 여부. isHome === false(명시 전달) 일 때만 BackRow 렌더. 미전달(undefined)=레거시→BackRow 미렌더.
  isHome?: boolean;
  // 사이드바 푸터 추가 슬롯(예: "내 공개 사이트 열기" 취소/위험 버튼). 미전달 시 미렌더.
  footAction?: ReactNode;
  // M3 (대회관리자 셸) — 커스텀 네비/브랜드 부제. opt-in. 미전달 시 roles 기반 기존 렌더(레거시 0 영향).
  nav?: AdminNavEntry[];
  brandSub?: string;
  children: ReactNode;
}

export function AdminShell({
  title,
  eyebrow,
  subtitle,
  actions,
  breadcrumbs: _breadcrumbs,
  sidebarVariant = "default",
  roles,
  user,
  hideHeader = false,
  home,
  isHome,
  footAction,
  nav,
  brandSub,
  children,
}: AdminShellProps) {
  const hidden = sidebarVariant === "hidden";

  return (
    <div className={`ts-shell ${hidden ? "ts-shell--hidden-aside" : ""}`} data-skin="toss">
      {/* 배치1.5 — 계정(아바타/이름/역할/로그아웃)을 사이드바 푸터 UserChip 으로 이전.
          정본은 데스크톱 우상단 topbar 없음 → 데스크톱 ad-topbar 제거. user 를 사이드바로 전달. */}
      {/* M2.5 — home/isHome/footAction 옵셔널 전달. 미전달 시 sidebar/mobile-nav 가 기존 렌더 유지(레거시 동일). */}
      {!hidden && (
        <AdminSidebar
          roles={roles}
          user={user}
          home={home}
          isHome={isHome}
          footAction={footAction}
          nav={nav}
          brandSub={brandSub}
        />
      )}
      {!hidden && (
        <AdminMobileNav
          roles={roles}
          user={user}
          home={home}
          isHome={isHome}
          footAction={footAction}
          nav={nav}
        />
      )}

      <main className="ts-main">
        <div className="ts-main__inner">
          {!hideHeader && title && (
            <AdminPageHeader
              title={title}
              eyebrow={eyebrow}
              subtitle={subtitle}
              actions={actions}
            />
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
