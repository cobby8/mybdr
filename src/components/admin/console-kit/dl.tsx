// =====================================================================
// dl.tsx — 정의 목록 (key/value 행) (v2.40 A2 박제)
//   박제 source: Dev/design/BDR v2.40/_admin-unified/au-kit.jsx (DL)
//   드로어/상세에서 "라벨 — 값" 행을 반복 렌더. Drawer 요약에 주로 사용.
//
//   서버 컴포넌트 — 순수 표시. rows = [라벨, 값] 튜플 배열.
// =====================================================================

import React from "react";

export type DLRow = [React.ReactNode, React.ReactNode]; // [key, value]

export type DLProps = {
  rows: DLRow[];
};

export function DL({ rows }: DLProps) {
  return (
    <div className="au-dl">
      {rows.map(([k, v], i) => (
        <div className="au-dl__row" key={i}>
          <span className="au-dl__k">{k}</span>
          <span className="au-dl__v">{v}</span>
        </div>
      ))}
    </div>
  );
}
