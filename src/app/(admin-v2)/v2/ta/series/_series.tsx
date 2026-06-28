"use client";

// ============================================================
// ta/series/_series.tsx — 정규대회 (클라). 정본 ta-pages Series 1:1.
//   PageHead + DataTable(로고/주기/회차/다음 대회/상태). 데이터는 서버 props.
//   "정규대회 만들기"·행 열기 = 미배선 → 준비 중 토스트.
// ============================================================

import React from "react";
import {
  PageHead,
  DataTable,
  Badge,
  Btn,
  Icon,
  useAdminShell,
  type DataCol,
  type DataRow,
} from "@/components/admin-v2";

export type TaSeriesRow = {
  id: string;
  name: string;
  org: string;
  cadence: string;
  editions: number;
  next: string;
  active: boolean;
  color: string;
};

const COLS: DataCol[] = [
  { key: "name", label: "정규대회", w: "minmax(0,2fr)" },
  { key: "cadence", label: "주기", w: "100px", align: "center" },
  { key: "editions", label: "회차", w: "84px", align: "center" },
  { key: "next", label: "다음 대회", w: "minmax(0,1fr)" },
  { key: "status", label: "상태", w: "92px", align: "center" },
  { key: "act", label: "", w: "60px", align: "right" },
];

export function SeriesList({ rows }: { rows: TaSeriesRow[] }) {
  const { toast } = useAdminShell();

  return (
    <div>
      <PageHead
        eyebrow="대회 관리자"
        title="정규대회"
        sub="정기적으로 반복 개최하는 정규대회를 묶어 관리합니다."
        actions={
          <Btn icon="plus" onClick={() => toast("정규대회 만들기는 준비 중입니다")}>
            정규대회 만들기
          </Btn>
        }
      />
      <DataTable
        cols={COLS}
        rows={rows as unknown as DataRow[]}
        onRow={(row) =>
          toast(`${(row as unknown as TaSeriesRow).name} 열기는 준비 중입니다`)
        }
        render={(row, k) => {
          const r = row as unknown as TaSeriesRow;
          if (k === "name")
            return (
              <div className="ad-cell-flex">
                <span
                  className="ad-card__logo"
                  style={{
                    background: r.color,
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    fontSize: 14,
                  }}
                >
                  {r.name.slice(0, 1)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="ad-cell-strong">{r.name}</div>
                  <div className="ad-cell-sub">{r.org}</div>
                </div>
              </div>
            );
          if (k === "cadence") return <Badge tone="grey">{r.cadence}</Badge>;
          if (k === "editions")
            return <span className="ad-cell-mono">{r.editions}회</span>;
          if (k === "next")
            return (
              <span
                className="ad-cell-mono"
                style={{
                  color: r.next === "미정" ? "var(--ink-dim)" : "var(--ink-soft)",
                }}
              >
                {r.next}
              </span>
            );
          if (k === "status")
            return (
              <span className="ad-statusline">
                <span className="ad-dot" data-tone={r.active ? "ok" : "mute"} />
                {r.active ? "운영중" : "중단"}
              </span>
            );
          if (k === "act")
            return (
              <button className="ad-iconbtn" style={{ marginLeft: "auto" }}>
                <Icon name="chevron-right" size={16} />
              </button>
            );
          return null;
        }}
      />
    </div>
  );
}
