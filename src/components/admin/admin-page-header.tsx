import { type ReactNode } from "react";

/* ============================================================
 * AdminPageHeader ??愿由ъ옄 ?섏씠吏 怨듯넻 ?ㅻ뜑 (Admin-2 諛뺤젣 2026-05-15)
 *
 * 諛뺤젣 source: Dev/design/BDR-current/components-admin.jsx (AdminPageHeader)
 * 諛뺤젣 target: src/components/admin/admin-page-header.tsx
 *
 * ?댁쑀 (??:
 *   - ?쒖븞 v2.14 ??`.admin-pageheader` ?쒓컖 ?⑦꽩 ?쇨? 諛뺤젣 (eyebrow + h1
 *     display + subtitle + actions). admin.css 諛뺤젣 ?대옒?ㅻ줈 ?쒓컖 媛깆떊.
 *   - ?몄텧泥?22媛??뚭? 0 蹂댁옣 ??props ?쒓렇?덉쿂 100% 蹂댁〈
 *     (title, subtitle, eyebrow, searchPlaceholder, searchName,
 *      searchDefaultValue, actions). breadcrumbs 留??듭뀡 ?좉퇋 異붽?.
 *
 * ?대뼸寃?
 *   1. JSX 援ъ“瑜??쒖븞 洹몃?濡? header.admin-pageheader > body + actions.
 *   2. breadcrumbs ?듭뀡 (admin-pageheader__breadcrumbs).
 *   3. searchPlaceholder/searchName/searchDefaultValue 媛 ?덉쑝硫?寃??form
 *      ??actions ?곸뿭 醫뚯륫??諛뺤젣 ??22媛??몄텧泥?蹂댁〈.
 * ============================================================ */
interface AdminPageHeaderProps {
  title: string;
  subtitle?: string; // "?꾩껜 42媛? 媛숈? 遺??  eyebrow?: string; // (web) ?⑦꽩: title ???묒? ?쇰꺼 (?? "ADMIN 쨌 USERS")
  searchPlaceholder?: string;
  searchName?: string; // form input name (湲곕낯媛?"q")
  searchDefaultValue?: string;
  actions?: ReactNode; // ?곗륫 異붽? 踰꾪듉 ??  // 2026-05-15 Admin-2 諛뺤젣 ???쒖븞 breadcrumbs ?듭뀡 (admin-pageheader__breadcrumbs)
  breadcrumbs?: { label: string; onClick?: () => void }[];
}

export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  searchPlaceholder,
  searchName = "q",
  searchDefaultValue,
  actions,
  breadcrumbs,
}: AdminPageHeaderProps) {
  // 寃??form ?몄텧 ?щ? ??searchPlaceholder ?덉쓣 ?뚮쭔
  const hasSearch = !!searchPlaceholder;
  // actions ?곸뿭 ?몄텧 ??寃???먮뒗 ?ъ슜???≪뀡 1媛쒕씪???덉쓣 ??  const hasActions = hasSearch || !!actions;

  return (
    // ?쒖븞 ?대옒????admin.css `.admin-pageheader` 諛뺤젣
    <header className="admin-pageheader">
      {/* 醫뚯륫: breadcrumbs + eyebrow + ?쒕ぉ + 遺??*/}
      <div className="admin-pageheader__body">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="admin-pageheader__breadcrumbs">
            {breadcrumbs.map((b, i) => (
              <span key={`${b.label}-${i}`}>
                {i > 0 && <span style={{ opacity: 0.4, marginRight: 6 }}>??/span>}
                {b.onClick ? (
                  <a onClick={b.onClick} style={{ cursor: "pointer" }}>
                    {b.label}
                  </a>
                ) : (
                  <span style={{ color: "var(--ink)" }}>{b.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        {eyebrow && <div className="admin-pageheader__eyebrow">{eyebrow}</div>}
        {title && <h1 className="admin-pageheader__title">{title}</h1>}
        {subtitle && <p className="admin-pageheader__subtitle">{subtitle}</p>}
      </div>

      {/* ?곗륫: 寃??form (?덉쓣 ?? + actions slot (?몄텧泥?蹂댁〈) */}
      {hasActions && (
        <div className="admin-pageheader__actions">
          {hasSearch && (
            <form method="GET" className="flex gap-2 flex-1 sm:flex-initial">
              <input
                name={searchName}
                defaultValue={searchDefaultValue ?? ""}
                placeholder={searchPlaceholder}
                className="input flex-1 sm:flex-initial"
                style={{ minWidth: 0 }}
              />
              <button type="submit" className="btn btn--primary btn--sm shrink-0">
                寃??              </button>
            </form>
          )}
          {actions}
        </div>
      )}
    </header>
  );
}
