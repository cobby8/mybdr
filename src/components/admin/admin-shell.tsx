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
  topbarLeft?: ReactNode;
  topbarRight?: ReactNode;
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
  topbarLeft,
  topbarRight,
  hideHeader = false,
  children,
}: AdminShellProps) {
  const hidden = sidebarVariant === "hidden";

  return (
    <div className={`ts-shell ${hidden ? "ts-shell--hidden-aside" : ""}`} data-skin="toss">
      {!hidden && <AdminSidebar roles={roles} />}
      {!hidden && <AdminMobileNav roles={roles} user={user} />}

      <main className="ts-main">
        {/* 데스크톱 우상단 토픽바(UserMenu). 시안 ts-topbar 는 모바일 전용(display:none@desktop)이라
            여기에 적용하면 데스크톱 계정 메뉴가 사라짐 → 회귀 0 위해 topbar 는 후속 배치에서 처리
            (UserMenu 를 ts-sidebar__foot 로 이전 후 ts-topbar 정합). 이번 배치는 셸/사이드바만. */}
        <div className="ad-topbar">
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {topbarLeft}
          </div>
          {topbarRight}
        </div>

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
