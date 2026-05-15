import { type ReactNode } from "react";

/* ============================================================
 * AdminPageHeader — 관리자 페이지 공통 헤더 (Admin-2 박제 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin.jsx (AdminPageHeader)
 * 박제 target: src/components/admin/admin-page-header.tsx
 *
 * 이유 (왜):
 *   - 시안 v2.14 의 `.admin-pageheader` 시각 패턴 일관 박제 (eyebrow + h1
 *     display + subtitle + actions). admin.css 박제 클래스로 시각 갱신.
 *   - 호출처 22개 회귀 0 보장 — props 시그니처 100% 보존
 *     (title, subtitle, eyebrow, searchPlaceholder, searchName,
 *      searchDefaultValue, actions). breadcrumbs 만 옵션 신규 추가.
 *
 * 어떻게:
 *   1. JSX 구조를 시안 그대로: header.admin-pageheader > body + actions.
 *   2. breadcrumbs 옵션 (admin-pageheader__breadcrumbs).
 *   3. searchPlaceholder/searchName/searchDefaultValue 가 있으면 검색 form
 *      을 actions 영역 좌측에 박제 — 22개 호출처 보존.
 * ============================================================ */
interface AdminPageHeaderProps {
  title: string;
  subtitle?: string; // "전체 42개" 같은 부제
  eyebrow?: string; // (web) 패턴: title 위 작은 라벨 (예: "ADMIN · USERS")
  searchPlaceholder?: string;
  searchName?: string; // form input name (기본값 "q")
  searchDefaultValue?: string;
  actions?: ReactNode; // 우측 추가 버튼 등
  // 2026-05-15 Admin-2 박제 — 시안 breadcrumbs 옵션 (admin-pageheader__breadcrumbs)
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
  // 검색 form 노출 여부 — searchPlaceholder 있을 때만
  const hasSearch = !!searchPlaceholder;
  // actions 영역 노출 — 검색 또는 사용자 액션 1개라도 있을 때
  const hasActions = hasSearch || !!actions;

  return (
    // 시안 클래스 — admin.css `.admin-pageheader` 박제
    <header className="admin-pageheader">
      {/* 좌측: breadcrumbs + eyebrow + 제목 + 부제 */}
      <div className="admin-pageheader__body">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="admin-pageheader__breadcrumbs">
            {breadcrumbs.map((b, i) => (
              <span key={`${b.label}-${i}`}>
                {i > 0 && <span style={{ opacity: 0.4, marginRight: 6 }}>›</span>}
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

      {/* 우측: 검색 form (있을 때) + actions slot (호출처 보존) */}
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
                검색
              </button>
            </form>
          )}
          {actions}
        </div>
      )}
    </header>
  );
}
