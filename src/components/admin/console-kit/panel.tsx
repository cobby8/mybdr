// =====================================================================
// panel.tsx — 카드 래퍼 (v2.40 A2 박제)
//   박제 source: Dev/design/BDR v2.40/_admin-unified/au-kit.jsx (Panel)
//   .ts-card 위에 제목/보조/우측슬롯 헤더를 얹는 얇은 래퍼.
//
//   서버 컴포넌트 — 순수 표시. 시안의 pad(기본 24px)/right 슬롯 동일 지원.
// =====================================================================

import React from "react";

export type PanelProps = {
  title?: React.ReactNode; // 카드 제목(옵션)
  sub?: React.ReactNode; // 제목 아래 보조 설명(옵션)
  right?: React.ReactNode; // 헤더 우측 슬롯(옵션 — 버튼 등)
  pad?: number; // 내부 패딩(기본 24px, 시안 동일)
  style?: React.CSSProperties; // 추가 스타일(옵션)
  children?: React.ReactNode;
};

export function Panel({
  title,
  sub,
  right,
  pad = 24,
  style,
  children,
}: PanelProps) {
  return (
    <div className="ts-card" style={{ padding: pad, ...style }}>
      {(title || right) && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            // sub 가 있으면 헤더-본문 간격을 줄여 sub 가 자연스럽게 붙도록(시안 동일)
            marginBottom: sub ? 4 : 16,
          }}
        >
          {title && <div className="au-card-title">{title}</div>}
          {right}
        </div>
      )}
      {sub && <div className="au-card-sub">{sub}</div>}
      {children}
    </div>
  );
}
