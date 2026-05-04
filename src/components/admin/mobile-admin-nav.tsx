"use client";

/* ============================================================
 * AdminMobileNav — 관리자페이지 모바일 햄버거 + 드로어 (Phase A, 2026-05-02)
 *
 * 배경: admin layout.tsx 의 사이드바가 lg(1024px) 미만 hidden 이라
 *      모바일/태블릿에서 admin 메뉴 접근 자체 불가. tournament_admin 이
 *      대회 현장에서 모바일로 접속 시 운영 차질 발생 가능.
 *
 * 해결 (Phase A 결정):
 *  (1) 햄버거 + 우측 드로어 (오버레이) — 2026-05-04 햄버거 우상단 이동 후 일관성
 *  (2) 클릭 시 우측에서 슬라이드 (web AppNav drawer 와 동일 방향)
 *  (3) 외부 영역 클릭 + 닫기 버튼 + ESC 키 + 페이지 이동 시 자동 닫힘
 *  (4) 햄버거: 페이지 상단 우측 고정 (lg:hidden) — 2026-05-04 (web) AppNav 와 동일 위치 정합
 *  (5) 활성 메뉴 표시: 데스크톱과 동일 (BDR Red 배경 + 흰 텍스트)
 *
 * 구조:
 *  - 햄버거 버튼: lg:hidden fixed top-3 right-3 z-50
 *  - 백드롭: lg:hidden fixed inset-0 bg-black/50 z-40 (open 시)
 *  - 드로어 패널: lg:hidden fixed right-0 top-0 z-50 h-screen w-72
 *                 transform transition-transform translate-x-(0 / 100%)
 *
 * AdminSidebar (sidebar.tsx) 와 메뉴 데이터 공유: navItems + filterMenuByRoles export 재사용.
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

interface Props {
  roles: AdminRole[];
}

// 2026-05-04: 메뉴 항목 1개 렌더링 (children 들여쓰기 + 클릭 시 드로어 닫기)
// (web) community-aside 패턴 (.aside__link + data-active) 적용 — 데스크톱 사이드바와 시각 통일
function renderMobileItem(
  item: AdminNavItem,
  pathname: string,
  closeFn: () => void,
  depth = 0,
) {
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);
  const indentStyle = depth > 0 ? { paddingLeft: 28 } : undefined;
  return (
    <div key={item.href}>
      <Link
        href={item.href}
        onClick={closeFn}
        className="aside__link"
        data-active={isActive}
        style={indentStyle}
      >
        <span>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>
          {item.label}
        </span>
      </Link>
      {item.children && item.children.length > 0 && (
        <div>
          {item.children.map((c) => renderMobileItem(c, pathname, closeFn, depth + 1))}
        </div>
      )}
    </div>
  );
}

export function AdminMobileNav({ roles }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
      {/* 햄버거 버튼 — 모바일/태블릿만 (lg 미만)
          2026-05-04: 좌상단 → 우상단 이동 (web AppNav 햄버거와 위치 정합) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="관리자 메뉴 열기"
        className="lg:hidden fixed top-3 right-3 z-30 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-colors hover:bg-[var(--color-elevated)]"
      >
        <span
          className="material-symbols-outlined text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          menu
        </span>
      </button>

      {/* 백드롭 — 외부 클릭으로 닫기 */}
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity"
        />
      )}

      {/* 드로어 패널 — 2026-05-04 우측 슬라이드 (햄버거 우상단 일관 + web AppNav 동일 방향) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="관리자 메뉴"
        className={`lg:hidden fixed right-0 top-0 z-50 flex h-screen w-72 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 상단: 로고 + 닫기 버튼 */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
          >
            <Image
              src="/images/logo.png"
              alt="BDR"
              width={100}
              height={30}
              className="h-7 w-auto"
            />
            <span className="rounded bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-elevated)]"
          >
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--color-text-primary)" }}
            >
              close
            </span>
          </button>
        </div>

        {/* 메뉴 — 활성 표시 데스크톱과 동일 (.aside__link[data-active=true])
            2026-05-04: 그룹화 + community-aside 패턴 적용 (.aside__title + .aside__link) */}
        <nav className="flex flex-1 flex-col overflow-y-auto pr-1 -mr-1">
          {visibleStructure.map((entry, idx) => {
            if (entry.type === "item") {
              return renderMobileItem(entry, pathname, () => setOpen(false));
            }
            // 그룹 — .aside__title 헤더 + items
            return (
              <div key={`group-${idx}`}>
                <div className="aside__title">{entry.label}</div>
                {entry.items.map((item) => renderMobileItem(item, pathname, () => setOpen(false)))}
              </div>
            );
          })}
        </nav>

        {/* 하단: 테마 토글 + 사이트로 돌아가기 */}
        <div className="border-t border-[var(--color-border)] pt-3">
          <div className="px-3 pb-2">
            <ThemeSwitch />
          </div>
          <Link href="/" onClick={() => setOpen(false)} className="aside__link">
            <span>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              사이트로 돌아가기
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}
