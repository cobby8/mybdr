"use client";

/* ============================================================
 * AdminMobileNav — 모바일 햄버거 + 드로어 (Admin-2 박제 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin.jsx (AdminMobileNav)
 * 박제 target: src/components/admin/mobile-admin-nav.tsx
 *
 * 이유 (왜):
 *   - 시안 v2.14 의 `.admin-mobile-toggle / .admin-mobile-overlay /
 *     .admin-mobile-drawer*` 시각 박제. (web) AppNav 와 일관된
 *     우측 슬라이드 드로어 + admin 영역 다크 토큰 자동 처리.
 *   - **props 시그니처 100% 보존** — `roles, user` 그대로. 호출처 0건 회귀.
 *   - ESC / 외부 클릭 / 라우트 이동 자동 닫힘 / body 스크롤 잠금 보존.
 *
 * 어떻게:
 *   1. 햄버거 = `.admin-mobile-toggle` (admin.css 가 모바일 fixed top-left 박제).
 *   2. 오버레이 = `.admin-mobile-overlay [data-open]` (시안 패턴 그대로).
 *   3. 드로어 = `.admin-mobile-drawer [data-open]` (우측 슬라이드).
 *   4. 메뉴 = `.admin-aside__link [data-active] [data-child]` (사이드바와 동일 클래스).
 * ============================================================ */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  filterStructureByRoles,
  type AdminRole,
  type AdminNavItem,
} from "./sidebar";
// 2026-05-02 (Admin-Web 시각 통합 v2 Phase 3) — 모바일 admin 드로어에서도 테마 토글 가능
import { ThemeSwitch } from "@/components/bdr-v2/theme-switch";
// 2026-05-11 admin 마이페이지 Phase 1 — 드로어 상단 사용자 카드 + 로그아웃 통합
import { LogoutButton } from "@/app/(admin)/admin/_components/logout-button";

interface Props {
  roles: AdminRole[];
  // 2026-05-11: 드로어 상단 사용자 카드용 — layout 에서 prop 전달
  user?: {
    nickname: string | null;
    email: string;
  };
}

// 이니셜 추출 (드로어 상단 아바타용)
function getInitial(nickname: string | null, email: string): string {
  const source = nickname?.trim() || email;
  return (source[0] ?? "?").toUpperCase();
}

// 메뉴 항목 1개 렌더링 (children 들여쓰기 + 클릭 시 드로어 닫기)
// 2026-05-15 Admin-2: 시안 `.admin-aside__link` 박제 클래스 사용 (사이드바와 동일)
function renderMobileItem(
  item: AdminNavItem,
  pathname: string,
  closeFn: () => void,
  isChild = false,
) {
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);
  return (
    <div key={item.href}>
      <Link
        href={item.href}
        onClick={closeFn}
        className="admin-aside__link"
        data-active={isActive ? "true" : "false"}
        data-child={isChild ? "true" : "false"}
      >
        <span className="material-symbols-outlined">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
      {item.children && item.children.length > 0 && (
        <>
          {item.children.map((c) =>
            renderMobileItem(c, pathname, closeFn, true)
          )}
        </>
      )}
    </div>
  );
}

export function AdminMobileNav({ roles, user }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // 드로어 상단 사용자 카드 표시용 (user prop 있을 때만)
  const displayName = user
    ? user.nickname?.trim() || user.email.split("@")[0]
    : null;
  const initial = user ? getInitial(user.nickname, user.email) : null;

  // 유저 역할에 맞는 메뉴만 필터링 (sidebar 와 동일 — 그룹화 구조)
  const visibleStructure = filterStructureByRoles(roles);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  // 페이지 이동 시 자동 닫힘
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // body 스크롤 잠금 (드로어 열림 시)
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  return (
    <>
      {/* 햄버거 버튼 — 시안 .admin-mobile-toggle (admin.css 모바일 fixed top-left) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="관리자 메뉴 열기"
        className="admin-mobile-toggle"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* 오버레이 — 시안 .admin-mobile-overlay [data-open] */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="admin-mobile-overlay"
        data-open={open ? "true" : "false"}
      />

      {/* 드로어 패널 — 시안 .admin-mobile-drawer [data-open] (우측 슬라이드) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="관리자 메뉴"
        className="admin-mobile-drawer"
        data-open={open ? "true" : "false"}
      >
        {/* 상단: 사용자 카드 + 닫기 — 시안 .admin-mobile-drawer__head */}
        <div className="admin-mobile-drawer__head">
          {user ? (
            <>
              <div className="admin-mobile-drawer__head-avatar">{initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="admin-mobile-drawer__head-name">{displayName}</div>
                <div className="admin-mobile-drawer__head-email">{user.email}</div>
              </div>
            </>
          ) : (
            // user 없으면 로고만 (시안 대체)
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
            >
              <Image
                src="/images/logo.png"
                alt="BDR"
                width={90}
                height={26}
                className="h-6 w-auto"
              />
              <span className="admin-aside__logo-badge">ADMIN</span>
            </Link>
          )}
          {/* 닫기 — 시안 .admin-detail-modal__close 재사용 (admin.css 정의) */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
            className="admin-detail-modal__close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 메뉴 — 시안 .admin-mobile-drawer__body */}
        <nav className="admin-mobile-drawer__body">
          {visibleStructure.map((entry, idx) => {
            if (entry.type === "item") {
              return (
                <div key={`item-${idx}`} className="admin-aside__group">
                  {renderMobileItem(entry, pathname, () => setOpen(false))}
                </div>
              );
            }
            // 그룹 — 시안 .admin-aside__title 헤더 + items
            return (
              <div key={`group-${idx}`} className="admin-aside__group">
                <div className="admin-aside__title">{entry.label}</div>
                {entry.items.map((item) =>
                  renderMobileItem(item, pathname, () => setOpen(false))
                )}
              </div>
            );
          })}
        </nav>

        {/* 하단: 테마 토글 + 마이페이지 + 사이트로 + 로그아웃 — 시안 .admin-mobile-drawer__foot */}
        <div className="admin-mobile-drawer__foot">
          <div style={{ padding: "4px 6px 6px", display: "flex", justifyContent: "center" }}>
            <ThemeSwitch />
          </div>
          {user && (
            <Link
              href="/admin/me"
              onClick={() => setOpen(false)}
              className="admin-aside__foot-link"
            >
              <span className="material-symbols-outlined">account_circle</span>
              마이페이지
            </Link>
          )}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="admin-aside__foot-link"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            사이트로 돌아가기
          </Link>
          {/* 로그아웃 (drawer-card variant — 시안 박제 후속에서 마이그레이션) */}
          {user && (
            <LogoutButton
              variant="drawer-card"
              onBeforeLogout={() => setOpen(false)}
            />
          )}
        </div>
      </aside>
    </>
  );
}
