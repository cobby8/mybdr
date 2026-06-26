"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
}

function getInitial(nickname: string | null, email: string): string {
  const source = nickname?.trim() || email;
  return (source[0] ?? "?").toUpperCase();
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

  return (
    <div key={item.href}>
      <Link
        href={item.href}
        onClick={closeFn}
        className="ad-side-link"
        data-active={isActive ? "true" : "false"}
        data-child={isChild ? "true" : "false"}
      >
        <Icon name={toLucide(item.icon)} size={18} />
        <span>{item.label}</span>
      </Link>
      {item.children?.map((child) => renderMobileItem(child, pathname, closeFn, true))}
    </div>
  );
}

export function AdminMobileNav({ roles, scope = "default", user }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  const displayName = user ? user.nickname?.trim() || user.email.split("@")[0] : null;
  const initial = user ? getInitial(user.nickname, user.email) : null;
  const visibleStructure =
    scope === "tournament" ? getTournamentMobileStructure() : filterStructureByRoles(roles);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="관리자 메뉴 열기"
        className="ad-mobile-toggle"
        data-skin="toss"
      >
        <Icon name="menu" size={22} />
      </button>

      <div
        aria-hidden="true"
        onClick={close}
        className="ad-mobile-overlay"
        data-open={open ? "true" : "false"}
        data-skin="toss"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="관리자 메뉴"
        className="ad-mobile-drawer"
        data-open={open ? "true" : "false"}
        data-skin="toss"
      >
        <div className="ad-mobile-drawer__head">
          {user ? (
            <>
              <div className="ad-mobile-drawer__avatar">{initial}</div>
              <div className="ad-mobile-drawer__identity">
                <div className="ad-mobile-drawer__name">{displayName}</div>
                <div className="ad-mobile-drawer__email">{user.email}</div>
              </div>
            </>
          ) : (
            <Link href="/admin" onClick={close} className="ad-mobile-drawer__brand">
              <Image src="/images/logo.png" alt="BDR" width={90} height={26} className="h-6 w-auto" />
              <span className="ad-side-logo-badge">ADMIN</span>
            </Link>
          )}

          <button
            type="button"
            onClick={close}
            aria-label="메뉴 닫기"
            className="ad-mobile-close"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <nav className="ad-mobile-drawer__body">
          {visibleStructure.map((entry, index) => {
            if (entry.type === "item") {
              return (
                <div key={`item-${index}`} className="ad-side-group">
                  {renderMobileItem(entry, pathname, close)}
                </div>
              );
            }

            return (
              <div key={`group-${index}`} className="ad-side-group">
                <div className="ad-side-title">{entry.label}</div>
                {entry.items.map((item) => renderMobileItem(item, pathname, close))}
              </div>
            );
          })}
        </nav>

        <div className="ad-mobile-drawer__foot">
          <div className="ad-mobile-drawer__theme">
            <AdminThemeSwitch />
          </div>
          {user && (
            <Link href="/admin/me" onClick={close} className="ad-side-foot-link">
              <Icon name="circle-user" size={16} />
              마이페이지
            </Link>
          )}
          <Link href="/" onClick={close} className="ad-side-foot-link">
            <Icon name="arrow-left" size={16} />
            사이트로 돌아가기
          </Link>
          {user && <LogoutButton variant="drawer-card" onBeforeLogout={close} />}
        </div>
      </aside>
    </>
  );
}
