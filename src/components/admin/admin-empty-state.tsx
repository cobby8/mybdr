"use client";

/* ============================================================
 * AdminEmptyState — 빈 상태 카드 (Admin-1 Phase · 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin.jsx (AdminEmptyState)
 * 박제 target: src/components/admin/admin-empty-state.tsx
 *
 * 이유: admin 영역에서 "데이터가 없어요" / "검색 결과 없음" / "권한 없음"
 *      등 빈 상태를 시안 일관 박제. icon + title + description + CTA 버튼.
 *      AdminDataTable 의 empty/error 상태도 본 컴포넌트 호출.
 *
 * 시안 시그니처 박제:
 *   - icon: Material Symbol (기본 'inbox')
 *   - title: 필수 (예: "데이터가 없어요")
 *   - description: 보조 설명 (옵션)
 *   - ctaLabel + onCta: 액션 버튼 (옵션 — 둘 다 있을 때만 노출)
 *
 * btn btn--primary 글로벌 클래스 사용 (globals.css 정의).
 * ============================================================ */

interface AdminEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function AdminEmptyState({
  icon = "inbox",
  title,
  description,
  ctaLabel,
  onCta,
}: AdminEmptyStateProps) {
  return (
    // admin-empty 클래스 — admin.css 박제 (다크모드 border-strong 자동)
    <div className="admin-empty">
      <div className="admin-empty__icon">
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      </div>
      <h3 className="admin-empty__title">{title}</h3>
      {description && <p className="admin-empty__desc">{description}</p>}
      {/* CTA — label + onCta 둘 다 있을 때만 노출 (시안 박제) */}
      {ctaLabel && onCta && (
        <div className="admin-empty__cta">
          <button type="button" className="btn btn--primary" onClick={onCta}>
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  );
}
