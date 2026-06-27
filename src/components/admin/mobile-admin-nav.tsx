"use client";

import { type ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AdminBackRow,
  filterStructureByRoles,
  toLucide,
  type AdminNavEntry,
  type AdminNavItem,
  type AdminRole,
} from "./sidebar";
import { AdminThemeSwitch } from "@/components/admin/admin-theme-switch";
import { Icon } from "@/components/admin-toss";
import { LogoutButton } from "@/app/(admin)/admin/_components/logout-button";

interface Props {
  roles: AdminRole[];
  scope?: "default" | "tournament";
  user?: {
    nickname: string | null;
    email: string;
  };
  // M2.5 (v46 흡수) — 전부 옵셔널·기본 no-op(미전달 시 드로어 렌더 기존 동일).
  home?: string; // 관리자 홈 라우트(brand + BackRow 홈). 미전달 시 "/admin".
  isHome?: boolean; // isHome === false 일 때만 드로어 BackRow 렌더.
  footAction?: ReactNode; // 드로어 푸터 추가 슬롯.
}

function getInitial(nickname: string | null, email: string): string {
  const source = nickname?.trim() || email;
  return (source[0] ?? "?").toUpperCase();
}

// 역할 라벨 — 보유 역할 중 최상위 1개 한국어 (UserChip 부제용). sidebar.tsx getRoleLabel 과 동일 규칙.
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

// 현재 활성 탭 제목 — ts-topbar 표시용. pathname 에 가장 깊게 매칭되는 항목 라벨(children 포함).
function getActiveTitle(structure: AdminNavEntry[], pathname: string): string {
  let best = "";
  let bestLen = -1;
  const consider = (item: AdminNavItem) => {
    const matched =
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
    if (matched && item.href.length > bestLen) {
      best = item.label;
      bestLen = item.href.length;
    }
    item.children?.forEach(consider);
  };
  structure.forEach((entry) => {
    if (entry.type === "item") consider(entry);
    else entry.items.forEach(consider);
  });
  return best || "관리자";
}

function getTournamentMobileStructure(): AdminNavEntry[] {
  return [
    {
      type: "group",
      label: "대회 관리",
      items: [
        {
          type: "item",
          href: "/tournament-admin/tournaments",
          label: "내 대회",
          icon: "emoji_events",
          roles: "all",
        },
        {
          type: "item",
          href: "/tournament-admin/tournaments/new/wizard",
          label: "새 대회",
          icon: "add_circle",
          roles: "all",
        },
      ],
    },
  ];
}

function renderMobileItem(
  item: AdminNavItem,
  pathname: string,
  closeFn: () => void,
  isChild = false,
) {
  const isActive =
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

  // M2.5 (v46 흡수) — 외부 콘솔 링크: <Link> 대신 <a target> + arrow-up-right. 기존 navStructure 항목은 미설정.
  if (item.external) {
    return (
      <a
        key={item.href}
        href={item.href}
        onClick={closeFn}
        className="ts-navlink"
        title={item.label}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        style={isChild ? { paddingLeft: 28 } : undefined}
      >
        <Icon name={toLucide(item.icon)} size={18} />
        <span>{item.label}</span>
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
        onClick={closeFn}
        className="ts-navlink"
        data-active={isActive ? "true" : "false"}
        // 자식 항목 들여쓰기(28px) — 데스크톱 sidebar renderItem 과 동일(ts-navlink 에 data-child CSS 부재).
        style={isChild ? { paddingLeft: 28 } : undefined}
      >
        <Icon name={toLucide(item.icon)} size={18} />
        <span>{item.label}</span>
      </Link>
      {item.children?.map((child) => renderMobileItem(child, pathname, closeFn, true))}
    </div>
  );
}

export function AdminMobileNav({ roles, scope = "default", user, home, isHome, footAction }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  // M2.5 — 홈 라우트(미전달 시 "/admin" = 기존 brand href 동일) + BackRow opt-in 여부
  const homeHref = home ?? "/admin";
  const showBackRow = isHome === false;
  const displayName = user ? user.nickname?.trim() || user.email.split("@")[0] : null;
  const initial = user ? getInitial(user.nickname, user.email) : null;
  const roleLabel = getRoleLabel(roles);
  const visibleStructure =
    scope === "tournament" ? getTournamentMobileStructure() : filterStructureByRoles(roles);
  // ts-topbar 활성 탭 제목 (모바일 상단바)
  const activeTitle = getActiveTitle(visibleStructure, pathname);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const myActive =
    pathname === "/admin/me" || pathname.startsWith("/admin/me/") ? "true" : "false";

  return (
    <>
      {/* 모바일 토픽바 — 햄버거 + 활성 탭 제목. ts-topbar=display:none@desktop, flex@≤900px(56px 고정).
          배치1.5에서 데스크톱 topbar 제거로 비던 ts-main padding-top:56px 영역을 채운다. */}
      <header className="ts-topbar" data-skin="toss">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="관리자 메뉴 열기"
          className="ts-mtoggle"
        >
          <Icon name="menu" size={20} />
        </button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{activeTitle}</div>
      </header>

      {/* 오버레이 — 열렸을 때만 렌더(정본 패턴) */}
      {open && (
        <div aria-hidden="true" onClick={close} className="ts-overlay" data-skin="toss" />
      )}

      {/* 드로어 — ts-drawer(280px, 좌측 슬라이드). head 인라인 + ts-sidebar__nav + ts-sidebar__foot
          (ts-drawer__head/__body/__foot 클래스는 CSS 부재 → 정본 jsx 와 동일 구조 사용). */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="관리자 메뉴"
        className="ts-drawer"
        data-open={open ? "true" : "false"}
        data-skin="toss"
      >
        {/* head — 브랜드(BDR 로고+ADMIN) + 닫기 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingRight: 12,
          }}
        >
          <Link href={homeHref} onClick={close} className="ts-sidebar__brand">
            <Image src="/images/logo.png" alt="BDR" width={100} height={30} className="h-7 w-auto" />
            <span className="rounded bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="메뉴 닫기"
            className="ts-mtoggle"
            style={{ background: "transparent" }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* M2.5 — BackRow: isHome===false 일 때만 brand 아래 렌더(드로어). 레거시(미전달)는 미렌더. */}
        {showBackRow && <AdminBackRow homeHref={homeHref} />}

        {/* body — nav (ts-sidebar__label 헤더 + ts-navlink 링크). navStructure/권한필터/children 보존. */}
        <nav className="ts-sidebar__nav overflow-y-auto">
          {visibleStructure.map((entry, index) => {
            if (entry.type === "item") {
              return <div key={`item-${index}`}>{renderMobileItem(entry, pathname, close)}</div>;
            }

            return (
              <div key={`group-${index}`}>
                <div className="ts-sidebar__label">{entry.label}</div>
                {entry.items.map((item) => renderMobileItem(item, pathname, close))}
              </div>
            );
          })}
        </nav>

        {/* foot — 데스크톱 사이드바 푸터와 동등(기능 손실 0): UserChip + 테마 + 마이페이지 + 사이트복귀 + 로그아웃.
            모바일에선 데스크톱 사이드바가 숨겨지므로 계정/로그아웃의 유일 경로. */}
        <div className="ts-sidebar__foot">
          {user && (
            <Link
              href="/admin/me"
              onClick={close}
              className="ts-userchip"
              data-active={myActive}
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
          <div className="px-3 pb-2">
            <AdminThemeSwitch />
          </div>
          {user && (
            <Link href="/admin/me" onClick={close} className="ts-navlink" data-active={myActive}>
              <Icon name="circle-user" size={18} />
              <span>마이페이지</span>
            </Link>
          )}
          <Link href="/" onClick={close} className="ts-navlink">
            <Icon name="arrow-left" size={18} />
            <span>사이트로 돌아가기</span>
          </Link>
          {user && <LogoutButton variant="drawer-card" onBeforeLogout={close} />}
          {/* M2.5 (v46 흡수) — 드로어 푸터 추가 슬롯. 미전달 시 null → 렌더 0. */}
          {footAction}
        </div>
      </aside>
    </>
  );
}
