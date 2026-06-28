"use client";

// ============================================================
// _console.tsx — R2-C 코트 콘솔(BO-4) 클라. 정본 bo-pages ConsolePage 1:1.
//   탭 2(실내/야외). court_infos.court_type 으로 분기. ⚠ 정본 partner(제휴) 탭은
//   DB 미지원(court_type partner 0건·partners 테이블 0건) → 제외(시안 회피).
//   리스트 데이터는 서버에서 실 Prisma 매핑되어 props 로 전달(추가 fetch 0).
// ============================================================

import React from "react";
import { SchemaList, type Schema, type SchemaCol, type SchemaRow } from "@/components/admin-v2";
import type { AdminBoCourtRow } from "@/lib/admin-v2/data";

// ── 컬럼 정의(정본 bo-data _court 1:1) ──
const COURT_COLS: SchemaCol[] = [
  { key: "court", label: "코트", w: "minmax(0,1.8fr)", type: "avatar" },
  { key: "region", label: "지역", w: "minmax(0,1fr)", type: "muted" },
  { key: "bookings", label: "월 예약", w: "92px", align: "center", type: "mono" },
  { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

const TABS = [
  { id: "indoor", label: "실내 코트" },
  { id: "outdoor", label: "야외 코트" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function CourtConsole({
  indoor,
  outdoor,
}: {
  indoor: AdminBoCourtRow[];
  outdoor: AdminBoCourtRow[];
}) {
  const [tab, setTab] = React.useState<TabId>("indoor");

  // ── 탭별 스키마(정본 _court head/sub 1:1) ──
  const schema: Schema = React.useMemo(() => {
    if (tab === "outdoor") {
      return {
        head: "야외 코트",
        sub: "야외·공원 농구 코트를 관리합니다.",
        addLabel: "코트 등록",
        cols: COURT_COLS,
        // avatar 컬럼 key="court" → SchemaList 는 r.name/r.sub/r.color 를 읽음
        rows: outdoor as unknown as SchemaRow[],
      };
    }
    return {
      head: "실내 코트",
      sub: "실내 체육관·전용 코트를 관리합니다.",
      addLabel: "코트 등록",
      cols: COURT_COLS,
      rows: indoor as unknown as SchemaRow[],
    };
  }, [tab, indoor, outdoor]);

  return (
    <div>
      <div className="bo-constabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="bo-constab"
            data-on={tab === t.id ? "true" : "false"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <SchemaList schema={schema} eyebrow="코트 콘솔" />
    </div>
  );
}
