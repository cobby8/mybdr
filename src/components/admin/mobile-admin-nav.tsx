"use client";

/* ============================================================
 * AdminMobileNav ??紐⑤컮???꾨쾭嫄?+ ?쒕줈??(Admin-2 諛뺤젣 2026-05-15)
 *
 * 諛뺤젣 source: Dev/design/BDR-current/components-admin.jsx (AdminMobileNav)
 * 諛뺤젣 target: src/components/admin/mobile-admin-nav.tsx
 *
 * ?댁쑀 (??:
 *   - ?쒖븞 v2.14 ??`.admin-mobile-toggle / .admin-mobile-overlay /
 *     .admin-mobile-drawer*` ?쒓컖 諛뺤젣. (web) AppNav ? ?쇨??? *     ?곗륫 ?щ씪?대뱶 ?쒕줈??+ admin ?곸뿭 ?ㅽ겕 ?좏겙 ?먮룞 泥섎━.
 *   - **props ?쒓렇?덉쿂 100% 蹂댁〈** ??`roles, user` 洹몃?濡? ?몄텧泥?0嫄??뚭?.
 *   - ESC / ?몃? ?대┃ / ?쇱슦???대룞 ?먮룞 ?ロ옒 / body ?ㅽ겕濡??좉툑 蹂댁〈.
 *
 * ?대뼸寃?
 *   1. ?꾨쾭嫄?= `.admin-mobile-toggle` (admin.css 媛 紐⑤컮??fixed top-left 諛뺤젣).
 *   2. ?ㅻ쾭?덉씠 = `.admin-mobile-overlay [data-open]` (?쒖븞 ?⑦꽩 洹몃?濡?.
 *   3. ?쒕줈??= `.admin-mobile-drawer [data-open]` (?곗륫 ?щ씪?대뱶).
 *   4. 硫붾돱 = `.admin-aside__link [data-active] [data-child]` (?ъ씠?쒕컮? ?숈씪 ?대옒??.
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
// 2026-05-02 (Admin-Web ?쒓컖 ?듯빀 v2 Phase 3) ??紐⑤컮??admin ?쒕줈?댁뿉?쒕룄 ?뚮쭏 ?좉? 媛??import { ThemeSwitch } from "@/components/bdr-v2/theme-switch";
// 2026-05-11 admin 留덉씠?섏씠吏 Phase 1 ???쒕줈???곷떒 ?ъ슜??移대뱶 + 濡쒓렇?꾩썐 ?듯빀
import { LogoutButton } from "@/app/(admin)/admin/_components/logout-button";

interface Props {
  roles: AdminRole[];
  // 2026-05-11: ?쒕줈???곷떒 ?ъ슜??移대뱶????layout ?먯꽌 prop ?꾨떖
  user?: {
    nickname: string | null;
    email: string;
  };
}

// ?대땲??異붿텧 (?쒕줈???곷떒 ?꾨컮???
function getInitial(nickname: string | null, email: string): string {
  const source = nickname?.trim() || email;
  return (source[0] ?? "?").toUpperCase();
}

// 硫붾돱 ??ぉ 1媛??뚮뜑留?(children ?ㅼ뿬?곌린 + ?대┃ ???쒕줈???リ린)
// 2026-05-15 Admin-2: ?쒖븞 `.admin-aside__link` 諛뺤젣 ?대옒???ъ슜 (?ъ씠?쒕컮? ?숈씪)
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
  // ?쒕줈???곷떒 ?ъ슜??移대뱶 ?쒖떆??(user prop ?덉쓣 ?뚮쭔)
  const displayName = user
    ? user.nickname?.trim() || user.email.split("@")[0]
    : null;
  const initial = user ? getInitial(user.nickname, user.email) : null;

  // ?좎? ??븷??留욌뒗 硫붾돱留??꾪꽣留?(sidebar ? ?숈씪 ??洹몃９??援ъ“)
  const visibleStructure = filterStructureByRoles(roles);

  // ESC ?ㅻ줈 ?リ린
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  // ?섏씠吏 ?대룞 ???먮룞 ?ロ옒
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // body ?ㅽ겕濡??좉툑 (?쒕줈???대┝ ??
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
      {/* ?꾨쾭嫄?踰꾪듉 ???쒖븞 .admin-mobile-toggle (admin.css 紐⑤컮??fixed top-left) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="愿由ъ옄 硫붾돱 ?닿린"
        className="admin-mobile-toggle"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* ?ㅻ쾭?덉씠 ???쒖븞 .admin-mobile-overlay [data-open] */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="admin-mobile-overlay"
        data-open={open ? "true" : "false"}
      />

      {/* ?쒕줈???⑤꼸 ???쒖븞 .admin-mobile-drawer [data-open] (?곗륫 ?щ씪?대뱶) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="愿由ъ옄 硫붾돱"
        className="admin-mobile-drawer"
        data-open={open ? "true" : "false"}
      >
        {/* ?곷떒: ?ъ슜??移대뱶 + ?リ린 ???쒖븞 .admin-mobile-drawer__head */}
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
            // user ?놁쑝硫?濡쒓퀬留?(?쒖븞 ?泥?
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
          {/* ?リ린 ???쒖븞 .admin-detail-modal__close ?ъ궗??(admin.css ?뺤쓽) */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="硫붾돱 ?リ린"
            className="admin-detail-modal__close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 硫붾돱 ???쒖븞 .admin-mobile-drawer__body */}
        <nav className="admin-mobile-drawer__body">
          {visibleStructure.map((entry, idx) => {
            if (entry.type === "item") {
              return (
                <div key={`item-${idx}`} className="admin-aside__group">
                  {renderMobileItem(entry, pathname, () => setOpen(false))}
                </div>
              );
            }
            // 洹몃９ ???쒖븞 .admin-aside__title ?ㅻ뜑 + items
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

        {/* ?섎떒: ?뚮쭏 ?좉? + 留덉씠?섏씠吏 + ?ъ씠?몃줈 + 濡쒓렇?꾩썐 ???쒖븞 .admin-mobile-drawer__foot */}
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
              留덉씠?섏씠吏
            </Link>
          )}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="admin-aside__foot-link"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            ?ъ씠?몃줈 ?뚯븘媛湲?          </Link>
          {/* 濡쒓렇?꾩썐 (drawer-card variant ???쒖븞 諛뺤젣 ?꾩냽?먯꽌 留덉씠洹몃젅?댁뀡) */}
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
