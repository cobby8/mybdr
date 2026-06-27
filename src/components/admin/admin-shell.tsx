import type { ReactNode } from "react";
import { AdminSidebar, type AdminRole } from "./sidebar";
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
  children,
}: AdminShellProps) {
  const hidden = sidebarVariant === "hidden";

  return (
    <div className={`ts-shell ${hidden ? "ts-shell--hidden-aside" : ""}`} data-skin="toss">
      {/* 배치1.5 — 계정(아바타/이름/역할/로그아웃)을 사이드바 푸터 UserChip 으로 이전.
          정본은 데스크톱 우상단 topbar 없음 → 데스크톱 ad-topbar 제거. user 를 사이드바로 전달. */}
      {!hidden && <AdminSidebar roles={roles} user={user} />}
      {!hidden && <AdminMobileNav roles={roles} user={user} />}

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
