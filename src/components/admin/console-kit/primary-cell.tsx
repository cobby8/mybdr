// =====================================================================
// primary-cell.tsx — 좌측 아바타 + 제목/메타 셀 (v2.40 A2 박제)
//   박제 source: Dev/design/BDR v2.40/_admin-unified/ad-kit.jsx (PrimaryCell)
//   테이블 첫 컬럼(대표 식별자)에 쓰는 아바타(이니셜) + 제목 + 보조메타 셀.
//
//   서버 컴포넌트 — 순수 표시. accent=true 면 아바타가 primary 색.
// =====================================================================

import React from "react";

export type PrimaryCellProps = {
  initials?: React.ReactNode; // 아바타 이니셜(옵션 — 없으면 아바타 미표시)
  title: React.ReactNode; // 제목(필수)
  meta?: React.ReactNode; // 보조 메타(옵션)
  accent?: boolean; // 아바타 강조색(primary) 여부
};

export function PrimaryCell({ initials, title, meta, accent }: PrimaryCellProps) {
  return (
    <div className="ad-primary-cell">
      {initials != null && (
        <span className={"ad-av" + (accent ? " ad-av--p" : "")}>{initials}</span>
      )}
      {/* minWidth:0 — 말줄임 보장(시안 동일) */}
      <span style={{ minWidth: 0 }}>
        <div className="ad-primary-cell__title">{title}</div>
        {meta && <div className="ad-primary-cell__meta">{meta}</div>}
      </span>
    </div>
  );
}
