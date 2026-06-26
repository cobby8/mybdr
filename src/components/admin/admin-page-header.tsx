import { type ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  searchPlaceholder?: string;
  searchName?: string;
  searchDefaultValue?: string;
  actions?: ReactNode;
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
  const hasSearch = !!searchPlaceholder;
  const hasActions = hasSearch || !!actions;

  return (
    <header className="ts-ph">
      <div className="ts-ph__row">
        <div style={{ minWidth: 0 }}>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="ts-ph__eyebrow" style={{ gap: 6 }}>
              {breadcrumbs.map((b, i) => (
                <span key={`${b.label}-${i}`}>
                  {i > 0 && <span style={{ opacity: 0.4, marginRight: 6 }}>/</span>}
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
          {eyebrow && <div className="ts-ph__eyebrow">{eyebrow}</div>}
          <div className="ts-ph__title">{title}</div>
          {subtitle && <div className="ts-ph__sub">{subtitle}</div>}
        </div>

        {hasActions && (
          <div className="ts-ph__actions">
            {hasSearch && (
              <form method="GET" className="flex gap-2 flex-1 sm:flex-initial">
                <input
                  name={searchName}
                  defaultValue={searchDefaultValue ?? ""}
                  placeholder={searchPlaceholder}
                  className="ts-input flex-1 sm:flex-initial"
                  style={{ minWidth: 0 }}
                />
                <button type="submit" className="ts-btn ts-btn--primary ts-btn--sm shrink-0">
                  검색
                </button>
              </form>
            )}
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
