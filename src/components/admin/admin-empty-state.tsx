"use client";

import { Icon } from "@/components/admin-toss";

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
    <div className="ad-empty">
      <div className="ad-empty__icon">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="ad-empty__title">{title}</h3>
      {description && <p className="ad-empty__desc">{description}</p>}
      {ctaLabel && onCta && (
        <div className="ad-empty__cta">
          <button type="button" className="ts-btn ts-btn--primary" onClick={onCta}>
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  );
}
