"use client";

/* ============================================================
 * AdminShell — admin 영역 wrapper (Admin-1 Phase · 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin.jsx (AdminShell)
 * 박제 target: src/components/admin/admin-shell.tsx
 *
 * 이유: 시안 v2.14 박제 — admin 페이지의 sidebar + topbar + main wrapper
 *      통합. 기존 src/app/(admin)/admin/layout.tsx 는 Tailwind 직접 박제
 *      되어 있어 Admin-2 진입 시 본 컴포넌트로 점진 교체 (본 PR = 컴포넌트
 *      배치만, layout 교체는 Admin-2 결재 후).
 *
 * 사용:
 *   <AdminShell title="..." eyebrow="..." subtitle="..." actions={<.../>}>
 *     {children}
 *   </AdminShell>
 *
 * Variant:
 *   - default — sidebar + topbar + main (기본)
 *   - hidden  — wizard 풀스크린 (sidebar 숨김 / topbar 최소화)
 *
 * AdminShell 은 시안 박제 그대로 — AdminSidebar / AdminMobileNav / AdminPageHeader
 * 자식 위임. 기존 sidebar.tsx 등 운영 컴포넌트는 그대로 호출 (props 시그니처
 * 보존 — Admin-2 진입 시 본 Shell 안에서 호출되도록 layout 측 갱신).
 * ============================================================ */

import { useState, type ReactNode } from "react";
import { AdminSidebar, type AdminRole } from "./sidebar";
import { AdminMobileNav } from "./mobile-admin-nav";
import { AdminPageHeader } from "./admin-page-header";

interface AdminShellProps {
  // 페이지 헤더
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string; onClick?: () => void }[];
  // Shell variant
  sidebarVariant?: "default" | "hidden"; // hidden = wizard 풀스크린 모드
  // 사이드바 권한
  roles: AdminRole[];
  // 모바일 드로어 사용자 카드용 (옵션)
  user?: {
    nickname: string | null;
    email: string;
  };
  // 상단 바 좌/우 슬롯 (옵션 — 시안 박제)
  topbarLeft?: ReactNode;
  topbarRight?: ReactNode;
  // 헤더 숨김 (커스텀 헤더가 필요한 페이지용)
  hideHeader?: boolean;
  children: ReactNode;
}

export function AdminShell({
  title,
  eyebrow,
  subtitle,
  actions,
  breadcrumbs: _breadcrumbs, // 시안 박제 — AdminPageHeader 갱신 시 wiring
  sidebarVariant = "default",
  roles,
  user,
  topbarLeft,
  topbarRight,
  hideHeader = false,
  children,
}: AdminShellProps) {
  // 모바일 드로어 open 상태 — 본 Shell 안에서 관리 (시안 박제 그대로)
  const [_mobileOpen, _setMobileOpen] = useState(false);
  const hidden = sidebarVariant === "hidden";

  return (
    // admin-shell 클래스 — admin.css 박제 (시안 그대로)
    <div className={`admin-shell ${hidden ? "admin-shell--hidden-aside" : ""}`}>
      {/* 사이드바 — hidden variant 시 미렌더 */}
      {!hidden && <AdminSidebar roles={roles} />}
      {/* 모바일 햄버거 + 드로어 — hidden variant 시 미렌더 */}
      {!hidden && <AdminMobileNav roles={roles} user={user} />}

      <main className="admin-main">
        {/* 상단 바 — 좌(검색/breadcrumb 등) / 우(사용자/액션) 슬롯 */}
        <div className="admin-topbar">
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {topbarLeft}
          </div>
          {topbarRight}
        </div>

        {/* 메인 콘텐츠 영역 — max-width 1280px (시안 admin-main-maxw) */}
        <div className="admin-main__inner">
          {/* 페이지 헤더 — hideHeader 시 미렌더 (커스텀 헤더 페이지용) */}
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
