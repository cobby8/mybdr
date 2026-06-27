// =====================================================================
// admin-v2/blocks/page-head.tsx — 페이지 헤더(정본 PageHead 박제)
//   박제 source: Dev/design/BDR v2.41-admin-toss/admin-shell.jsx window.PageHead
//   admin-toss 키트엔 없는 컴포넌트라 blocks 내부에 TS 박제.
//   ts-ph 클래스는 toss-admin.css([data-skin="toss"]) 실존.
//   훅 없음 → 서버/클라 공용(플레이스홀더 page.tsx 서버컴포넌트에서도 사용).
// =====================================================================

import type { ReactNode } from "react";

export interface PageHeadProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}

export function PageHead({ eyebrow, title, sub, actions }: PageHeadProps) {
  return (
    <div className="ts-ph">
      <div className="ts-ph__row">
        <div>
          {/* eyebrow/title/sub — 정본 마크업 1:1 */}
          {eyebrow && <div className="ts-ph__eyebrow">{eyebrow}</div>}
          <div className="ts-ph__title">{title}</div>
          {sub && <div className="ts-ph__sub">{sub}</div>}
        </div>
        {actions && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
        )}
      </div>
    </div>
  );
}
