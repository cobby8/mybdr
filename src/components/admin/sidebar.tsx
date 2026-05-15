"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
// 2026-05-02 (Admin-Web ?쒓컖 ?듯빀 v2 Phase 3) ??admin ?곸뿭?먯꽌???쇱씠???ㅽ겕 ?좉? 媛?ν븯?꾨줉 (web)? 媛숈? ThemeSwitch 留덉슫??import { ThemeSwitch } from "@/components/bdr-v2/theme-switch";

/* ============================================================
 * AdminSidebar ??醫뚯륫 ?ъ씠?쒕컮 (Admin-2 諛뺤젣 2026-05-15)
 *
 * 諛뺤젣 source: Dev/design/BDR-current/components-admin.jsx (AdminSidebar)
 * 諛뺤젣 target: src/components/admin/sidebar.tsx
 *
 * ?댁쑀 (??:
 *   - ?쒖븞 v2.14 ??`.admin-aside / .admin-aside__*` ?쒓컖 ?⑦꽩 諛뺤젣.
 *   - **props ?쒓렇?덉쿂 100% 蹂댁〈** ??`roles: AdminRole[]` 洹몃?濡?
 *     ?몄텧泥?layout.tsx 1嫄??뚭? 0.
 *   - navStructure / filterStructureByRoles / Next.js Link/usePathname
 *     ?⑦꽩 100% 蹂댁〈 (router ?섏〈???좎?).
 *
 * ?대뼸寃?
 *   1. <aside className="admin-aside"> 濡?媛덉븘?낇옒 (Tailwind ??admin.css ?대옒??.
 *   2. 濡쒓퀬 ?곸뿭 `.admin-aside__logo` 諛뺤젣.
 *   3. 硫붾돱 `.admin-aside__group + .admin-aside__title + .admin-aside__link`
 *      (data-active / data-child ?띿꽦?쇰줈 ?쒓컖 遺꾧린).
 *   4. ?섎떒 `.admin-aside__foot + .admin-aside__foot-link` 諛뺤젣.
 * ============================================================ */

// 沅뚰븳蹂?硫붾돱 ?묎렐 ?뺤쓽
// "all" = 紐⑤뱺 愿由ъ옄 沅뚰븳?먯꽌 ?몄텧
export type AdminRole =
  | "super_admin"
  | "site_admin"
  | "tournament_admin"
  | "partner_member"
  | "org_member";

export interface AdminNavItem {
  type: "item";
  href: string;
  label: string;
  icon: string;
  roles: AdminRole[] | "all"; // ?대뼡 ??븷????硫붾돱瑜?蹂????덈뒗吏
  // 2026-05-04: ?섏쐞 硫붾돱 (?? 而ㅻ??덊떚 ??BDR NEWS)
  children?: AdminNavItem[];
}

export interface AdminNavGroup {
  type: "group";
  label: string; // 洹몃９ ?ㅻ뜑 (?쒓컖??援щ텇?? ?대┃ X)
  items: AdminNavItem[];
}

export type AdminNavEntry = AdminNavItem | AdminNavGroup;

// 2026-05-04: 硫붾돱 洹몃９????18媛??됰㈃ ??6媛?洹몃９ (?ъ슜???붿껌)
// 洹몃９: ?댁쁺 / 肄섑뀗痢?/ ?ъ슜??/ 鍮꾩쫰?덉뒪 / ?쒖뒪??/ ?몃? 愿由?// 而ㅻ??덊떚 children = BDR NEWS (?ъ슜???붿껌)
export const navStructure: AdminNavEntry[] = [
  // ?댁쁺 (?⑤룆 ??ぉ ??洹몃９ ?ㅻ뜑 ?놁쓬)
  { type: "item", href: "/admin", label: "??쒕낫??, icon: "dashboard", roles: "all" },

  // 洹몃９: 肄섑뀗痢?  {
    type: "group",
    label: "肄섑뀗痢?,
    items: [
      {
        type: "item",
        href: "/admin/tournaments",
        // 2026-05-04: "?좊꼫癒쇳듃" ??"???愿由? ?듭씪 (?ъ슜???붿껌).
        label: "???愿由?,
        icon: "emoji_events",
        roles: ["super_admin", "site_admin"],
        // 2026-05-04: ???愿由ъ옄(tournament_admin) ?꾩슜 吏꾩엯?먯쓣 sub-item ?쇰줈 ?듯빀.
        // ?댁쟾 ?몃? 愿由?洹몃９??蹂꾨룄 ?꾩튂 ??"???愿由? 硫붾돱 ?덉쑝濡??쎌엯 (?ъ슜???붿껌).
        children: [
          {
            type: "item",
            href: "/tournament-admin",
            label: "????댁쁺???꾧뎄",
            icon: "manage_accounts",
            roles: ["super_admin", "site_admin", "tournament_admin"],
          },
        ],
      },
      { type: "item", href: "/admin/games", label: "寃쎄린 愿由?, icon: "sports_basketball", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/teams", label: "? 愿由?, icon: "groups", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/courts", label: "肄뷀듃 愿由?, icon: "location_on", roles: ["super_admin", "site_admin"] },
      {
        type: "item",
        href: "/admin/community",
        label: "而ㅻ??덊떚",
        icon: "forum",
        roles: ["super_admin", "site_admin"],
        children: [
          // 2026-05-04: ?뚭린??(BDR NEWS) 寃???섏씠吏瑜?而ㅻ??덊떚 ?섏쐞濡?(?ъ슜???붿껌)
          {
            type: "item",
            href: "/admin/news",
            label: "BDR NEWS",
            icon: "newspaper",
            roles: ["super_admin", "site_admin"],
          },
        ],
      },
    ],
  },

  // 洹몃９: ?ъ슜??  {
    type: "group",
    label: "?ъ슜??,
    items: [
      { type: "item", href: "/admin/users", label: "?좎? 愿由?, icon: "group", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/game-reports", label: "?좉퀬 寃??, icon: "report", roles: ["super_admin"] },
      { type: "item", href: "/admin/suggestions", label: "嫄댁쓽?ы빆", icon: "lightbulb", roles: ["super_admin"] },
    ],
  },

  // 洹몃９: 鍮꾩쫰?덉뒪
  {
    type: "group",
    label: "鍮꾩쫰?덉뒪",
    items: [
      { type: "item", href: "/admin/plans", label: "?붽툑??愿由?, icon: "payments", roles: ["super_admin"] },
      { type: "item", href: "/admin/payments", label: "寃곗젣", icon: "credit_card", roles: ["super_admin"] },
      { type: "item", href: "/admin/campaigns", label: "愿묎퀬 罹좏럹??, icon: "campaign", roles: ["super_admin", "partner_member"] },
      { type: "item", href: "/admin/partners", label: "?뚰듃??愿由?, icon: "handshake", roles: ["super_admin"] },
    ],
  },

  // 洹몃９: ?쒖뒪??  {
    type: "group",
    label: "?쒖뒪??,
    items: [
      { type: "item", href: "/admin/analytics", label: "遺꾩꽍", icon: "analytics", roles: ["super_admin", "site_admin"] },
      { type: "item", href: "/admin/settings", label: "?쒖뒪???ㅼ젙", icon: "settings", roles: ["super_admin"] },
      { type: "item", href: "/admin/logs", label: "?쒕룞 濡쒓렇", icon: "list_alt", roles: ["super_admin"] },
    ],
  },

  // 洹몃９: ?몃? 愿由?(蹂꾨룄 沅뚰븳 ??partner_member)
  // 2026-05-04: tournament_admin 吏꾩엯?먯? "肄섑뀗痢?> ???愿由?> ????댁쁺???꾧뎄" sub-item ?쇰줈 ?듯빀 (?ъ슜???붿껌).
  {
    type: "group",
    label: "?몃? 愿由?,
    items: [
      { type: "item", href: "/partner-admin", label: "?묐젰?낆껜 愿由?, icon: "storefront", roles: ["partner_member"] },
    ],
  },
];

// ??븷 ?꾪꽣 ??children ??媛숈씠 ?꾪꽣留?(?ш?)
// 2026-05-14 fix: parent self-blocked + child visible 耳?댁뒪 ?꾨씫 (tournament_admin
//   ?ъ슜?먯뿉寃?"????댁쁺???꾧뎄" 吏꾩엯?먯씠 ?듭㎏濡??щ씪吏???뚭?). ?댁젣??children 1媛?//   ?댁긽 visible ?대㈃ parent ???몄텧 + parent href 瑜?visible child ??泥?href 濡?rewrite
//   (parent click ???먮룞?쇰줈 沅뚰븳 ?덈뒗 child ?섏씠吏濡?吏꾩엯 ??沅뚰븳 ?녿뒗 parent href 李⑤떒 ?뚰뵾).
function filterItemByRoles(item: AdminNavItem, roles: AdminRole[]): AdminNavItem | null {
  // 1) children ??癒쇱? ?ш? ?꾪꽣 (parent 媛?쒖꽦 ?먮떒???ъ슜)
  const filteredChildren = item.children
    ?.map((c) => filterItemByRoles(c, roles))
    .filter((c): c is AdminNavItem => c !== null);
  const hasVisibleChildren = !!filteredChildren && filteredChildren.length > 0;

  // 2) self 媛?쒖꽦
  const selfVisible =
    item.roles === "all" || roles.some((r) => item.roles.includes(r));

  // 3) self / children 紐⑤몢 李⑤떒 ????ぉ ?쒓굅 (湲곗〈 ?숈옉)
  if (!selfVisible && !hasVisibleChildren) return null;

  // 4) self 李⑤떒 + child ?몄텧 ??parent href 瑜?child 泥?href 濡?rewrite
  //    (UX: "???愿由? label/icon ?좎? + click ??沅뚰븳 ?덈뒗 /tournament-admin ?쇰줈 ?먯뿰 吏꾩엯)
  const effectiveHref =
    !selfVisible && hasVisibleChildren ? filteredChildren![0].href : item.href;

  return { ...item, href: effectiveHref, children: filteredChildren };
}

// 2026-05-04: 洹몃９?붾맂 援ъ“?먯꽌 ??븷蹂??꾪꽣 (mobile-admin-nav ???ъ슜)
export function filterStructureByRoles(roles: AdminRole[]): AdminNavEntry[] {
  return navStructure
    .map((entry) => {
      if (entry.type === "item") {
        return filterItemByRoles(entry, roles);
      }
      // group: items ?꾪꽣 ??鍮?洹몃９? ?쒖쇅
      const items = entry.items
        .map((it) => filterItemByRoles(it, roles))
        .filter((it): it is AdminNavItem => it !== null);
      if (items.length === 0) return null;
      return { ...entry, items };
    })
    .filter((e): e is AdminNavEntry => e !== null);
}

interface AdminSidebarProps {
  // ???좎?媛 媛吏?愿由???븷??(蹂듭닔 媛??
  roles: AdminRole[];
}

// 硫붾돱 ??ぉ 1媛??뚮뜑留?(children = data-child ?띿꽦?쇰줈 ?ㅼ뿬?곌린 ?쒓컖)
// 2026-05-15 Admin-2: `.admin-aside__link` ?쒖븞 諛뺤젣 ?대옒?ㅻ줈 媛덉븘?낇옒
function renderItem(item: AdminNavItem, pathname: string, isChild = false) {
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);
  return (
    <div key={item.href}>
      <Link
        href={item.href}
        className="admin-aside__link"
        data-active={isActive ? "true" : "false"}
        data-child={isChild ? "true" : "false"}
      >
        {/* Material Symbol ?꾩씠肄???admin.css 媛 ?ъ씠利??됱긽 ?먮룞 泥섎━ */}
        <span className="material-symbols-outlined">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
      {/* children ??admin.css ??data-child="true" 媛 padding-left 38px ?먮룞 諛뺤젣 */}
      {item.children && item.children.length > 0 && (
        <>
          {item.children.map((child) => renderItem(child, pathname, true))}
        </>
      )}
    </div>
  );
}

export function AdminSidebar({ roles }: AdminSidebarProps) {
  const pathname = usePathname();

  // ?좎? ??븷??留욌뒗 硫붾돱留??꾪꽣留?(洹몃９ 援ъ“)
  const visibleStructure = filterStructureByRoles(roles);

  return (
    // ?쒖븞 諛뺤젣 ??admin.css `.admin-aside` 諛뺤젣 (??024 fixed left)
    // hidden lg:flex ??admin.css ??@media (max-width: 1024px) display:none ?쇰줈 泥섎━
    <aside className="admin-aside">
      {/* 濡쒓퀬 ???쒖븞 .admin-aside__logo */}
      <Link
        href="/admin"
        className="admin-aside__logo"
        style={{ textDecoration: "none" }}
      >
        <Image src="/images/logo.png" alt="BDR" width={100} height={28} className="h-7 w-auto" />
        <span className="admin-aside__logo-badge">ADMIN</span>
      </Link>

      {/* ?대퉬寃뚯씠??硫붾돱 ??洹몃９??+ ?ㅽ겕濡?媛??*/}
      <nav className="admin-aside__nav">
        {visibleStructure.map((entry, idx) => {
          if (entry.type === "item") {
            return (
              <div key={`item-${idx}`} className="admin-aside__group">
                {renderItem(entry, pathname)}
              </div>
            );
          }
          // 洹몃９ ???쒖븞 .admin-aside__title ?ㅻ뜑 + items
          return (
            <div key={`group-${idx}`} className="admin-aside__group">
              <div className="admin-aside__title">{entry.label}</div>
              {entry.items.map((item) => renderItem(item, pathname))}
            </div>
          );
        })}
      </nav>

      {/* ?섎떒: ?뚮쭏 ?좉? + 留덉씠?섏씠吏 + ?ъ씠?몃줈 ?뚯븘媛湲?*/}
      {/* 2026-05-15 Admin-2: ?쒖븞 .admin-aside__foot + .admin-aside__foot-link 諛뺤젣 */}
      <div className="admin-aside__foot">
        {/* ?뚮쭏 ?좉? ??(web) AppNav ? ?숈씪 而댄룷?뚰듃 (?쇱씠???ㅽ겕 ????쇰꺼) */}
        <div style={{ padding: "4px 6px 6px", display: "flex", justifyContent: "center" }}>
          <ThemeSwitch />
        </div>
        {/* 留덉씠?섏씠吏 ???ъ슜??寃곗옱 짠7 */}
        <Link href="/admin/me" className="admin-aside__foot-link">
          <span className="material-symbols-outlined">account_circle</span>
          留덉씠?섏씠吏
        </Link>
        <Link href="/" className="admin-aside__foot-link">
          <span className="material-symbols-outlined">arrow_back</span>
          ?ъ씠?몃줈 ?뚯븘媛湲?        </Link>
      </div>
    </aside>
  );
}
