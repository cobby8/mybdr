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
    <div className={`ad-shell ${hidden ? "ad-shell--hidden-aside" : ""}`} data-skin="toss">
      {!hidden && <AdminSidebar roles={roles} />}
      {!hidden && <AdminMobileNav roles={roles} user={user} />}

      <main className="ad-main">
        <div className="ad-topbar">
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {topbarLeft}
          </div>
          {topbarRight}
        </div>

        <div className="ad-main__inner">
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
