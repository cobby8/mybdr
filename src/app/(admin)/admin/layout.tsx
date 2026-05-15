import { redirect } from "next/navigation";
import { headers } from "next/headers";
// 2026-05-15 Admin-2: AdminShell wrap ?꾩엯 ???쒖븞 v2.14 諛뺤젣
import { AdminShell } from "@/components/admin/admin-shell";
// 2026-05-11 admin 留덉씠?섏씠吏 Phase 1 ??沅뚰븳 ?ы띁 + ?곗긽??UserMenu
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getAdminRoles } from "@/lib/auth/admin-roles";
// 2026-05-12 濡쒓렇??redirect ?듯빀 ??鍮꾨줈洹몄씤 ??濡쒓렇???섏씠吏 ???먮옒 admin ?섏씠吏 蹂듦?
import { buildLoginRedirect } from "@/lib/auth/redirect";
import { UserMenu } from "./_components/user-menu";

/**
 * Admin ?덉씠?꾩썐: 沅뚰븳蹂??묎렐 ?쒖뼱 + AdminShell wrap (Admin-2 諛뺤젣 2026-05-15)
 *
 * 諛뺤젣 source: Dev/design/BDR-current/components-admin.jsx (AdminShell)
 *
 * 沅뚰븳 留ㅽ듃由?뒪:
 * - super_admin: ?꾩껜 硫붾돱
 * - site_admin (admin_role): ?좎?/肄뷀듃/而ㅻ??덊떚/寃쎄린/?/遺꾩꽍
 * - tournament_admin (membershipType=3): ??쒕낫??+ ??뚭?由?留곹겕
 * - partner_member: DB partner_members ?뚯냽 ?뺤씤
 * - org_member: DB organization_members ?뚯냽 ?뺤씤
 *
 * 2026-05-15 Admin-2: AdminShell wrap ?꾩엯.
 *   - 湲곗〈 Tailwind 諛뺤젣 (hidden lg:block / lg:ml-64 / ...) ??AdminShell ??admin.css ?대옒?? *   - UserMenu ??topbarRight slot ???듯빀 (PC topbar ?곗륫 / 紐⑤컮?쇱? AdminShell ??AdminMobileNav 媛 泥섎━)
 *   - ?먯떇 ?섏씠吏 props ?쒓렇?덉쿂 蹂寃?0 ??紐⑤뱺 admin ?섏씠吏 ?뚭? 0
 *
 * 2026-05-11 refactor: 沅뚰븳 怨꾩궛 濡쒖쭅 ??src/lib/auth/admin-roles.ts (getAdminRoles).
 *   - admin 留덉씠?섏씠吏 (`/admin/me`) ? ?숈씪 source ?ъ슜 ???뺥빀??蹂댁옣
 *   - React.cache ?곸슜 ??媛숈? ?붿껌?먯꽌 layout + 留덉씠?섏씠吏 ?숈떆 ?몄텧?대룄 DB SELECT 1?? *   - ?몄쬆 ?먮쫫??`getAuthUser()` ?⑥씪 吏꾩엯?먯쑝濡??듯빀 (5/5 諛뺤젣 猷?
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) ?몄쬆 ?⑥씪 吏꾩엯????JWT verify + DB user.status 遺꾧린 + 荑좏궎 ?먮룞 cleanup (5/5 諛뺤젣)
  const auth = await getAuthUser();
  if (auth.state !== "active" || !auth.user || !auth.session) {
    // 2026-05-12: ?꾩옱 admin 寃쎈줈瑜?redirect 荑쇰━???댁븘 濡쒓렇?????먮룞 蹂듦?.
    // middleware 媛 `x-pathname` / `x-search` ?ㅻ뜑 二쇱엯 (`/admin/*` matcher) ??fallback "/admin".
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/admin";
    const search = h.get("x-search") ?? "";
    redirect(buildLoginRedirect(pathname, search));
  }

  // 2) 沅뚰븳 留ㅽ듃由?뒪 ??admin-roles ?ы띁 (留덉씠?섏씠吏? ?숈씪 source)
  const summary = await getAdminRoles(auth.user.id, auth.session);

  // 3) ?꾨Т 愿由???븷???놁쑝硫??묎렐 遺덇? ???먮윭 硫붿떆吏? ?④퍡 濡쒓렇???섏씠吏濡?  //    沅뚰븳 遺議?= 濡쒓렇???먯껜???듦낵??耳?댁뒪 ??redirect 荑쇰━ ?숇큺 ????(?ㅻⅨ 怨꾩젙 濡쒓렇??沅뚯쑀).
  if (summary.roles.length === 0) {
    redirect("/login?error=no_permission");
  }

  // AdminShell 諛뺤젣 ??sidebar + mobile drawer + topbar + main ?듯빀 wrap (?쒖븞 v2.14)
  //   roles: 沅뚰븳 ?꾪꽣 (AdminSidebar / AdminMobileNav ?먮룞 遺꾧린)
  //   user: 紐⑤컮???쒕줈???곷떒 ?ъ슜??移대뱶??(?듭뀡)
  //   topbarRight: PC ?곷떒 ?곗륫 UserMenu ??紐⑤컮?쇱? AdminMobileNav 媛 泥섎━?섎?濡?lg+ ?쒖젙 ?쒖떆
  //   hideHeader: ?먯떇 ?섏씠吏媛 ?먯껜 ?ㅻ뜑 諛뺤젣 (?꾩옱 紐⑤뱺 admin ?섏씠吏媛 AdminPageHeader 吏곸젒 ?몄텧)
  return (
    <AdminShell
      roles={summary.roles}
      user={{
        nickname: auth.user.nickname,
        email: auth.session.email,
      }}
      hideHeader
      topbarRight={
        // PC topbar ?곗륫 UserMenu ??紐⑤컮?쇱? admin.css 媛 .admin-topbar ?곗륫???꾨쾭嫄??먮━濡??먯쑀
        <div className="hidden lg:flex">
          <UserMenu
            nickname={auth.user.nickname}
            email={auth.session.email}
          />
        </div>
      }
    >
      {children}
    </AdminShell>
  );
}
