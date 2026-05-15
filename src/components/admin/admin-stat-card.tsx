"use client";

/* ============================================================
 * AdminStatCard — 통계 카드 (Admin-1 Phase · 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin.jsx (AdminStatCard)
 * 박제 target: src/components/admin/admin-stat-card.tsx
 *
 * 이유: admin 대시보드 / 분석 페이지에서 사용. label / value / delta(증감)
 *      + 클릭/링크 진입 옵션. 다크모드 자동 (admin.css [data-theme="dark"]).
 *
 * 시안 시그니처 (jsx) 박제:
 *   - label: 카드 상단 라벨 (대문자 우대 — admin.css 자동 처리)
 *   - value: 큰 숫자 (display 폰트 — Archivo)
 *   - icon: Material Symbol (옵션)
 *   - delta: 증감 라벨 (예: "+12%")
 *   - trend: 'up' | 'down' | 'flat' — 증감 색상 (ok/danger/mute)
 *   - link/onClick: 진입 트리거 (있으면 cursor pointer + hover border accent)
 *   - skeleton: 로딩 상태 (skel pulse animation)
 *
 * 기존 운영의 StatCard 와 동거 — 시안 prefix admin- 로 명확히 분리.
 * ============================================================ */

import { type ReactNode } from "react";

interface AdminStatCardProps {
  label: string;
  value: string | number | ReactNode;
  icon?: string; // Material Symbol 이름
  delta?: string; // 예: "+12%" / "-3건"
  trend?: "up" | "down" | "flat";
  // 클릭/링크 진입 트리거 — 있으면 cursor pointer + hover border
  onClick?: () => void;
  // 로딩 상태 — head/value/delta 자리 skel pulse
  skeleton?: boolean;
}

export function AdminStatCard({
  label,
  value,
  icon,
  delta,
  trend = "flat",
  onClick,
  skeleton,
}: AdminStatCardProps) {
  // 스켈레톤 분기 — admin.css .admin-stat--skel 자동 pulse
  if (skeleton) {
    return (
      <div className="admin-stat admin-stat--skel">
        <div className="admin-stat__head"></div>
        <div className="admin-stat__value"></div>
        <div className="admin-stat__delta"></div>
      </div>
    );
  }

  // 클릭 가능 시 button, 그렇지 않으면 div — 시안 박제 패턴
  const isInteractive = !!onClick;

  // 공통 props
  const className = "admin-stat";
  const dataLink = isInteractive ? "true" : "false";

  // 내부 콘텐츠 — 공통화
  const content = (
    <>
      <div className="admin-stat__head">
        {icon && (
          <span className="material-symbols-outlined" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>
      <div className="admin-stat__value">{value}</div>
      {delta && (
        <div className="admin-stat__delta" data-trend={trend}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">
            {trend === "up" ? "trending_up" : trend === "down" ? "trending_down" : "trending_flat"}
          </span>
          {delta}
        </div>
      )}
    </>
  );

  // 인터랙티브 시 button (a11y / 키보드 진입 지원)
  if (isInteractive) {
    return (
      <button
        type="button"
        className={className}
        data-link={dataLink}
        onClick={onClick}
        // border:0 + background 인라인 — 시안 박제 (button 기본 reset)
        style={{ border: 0, background: "var(--bg-card)" }}
      >
        {content}
      </button>
    );
  }

  // 비인터랙티브 시 div
  return (
    <div className={className} data-link={dataLink}>
      {content}
    </div>
  );
}
