"use client";

// ============================================================
// partner/venues/_venues.tsx — 내 시설 (클라). 정본 partner-pages SchemaList(PT_VENUES) 1:1.
//   서버에서 court_infos(owner 스코프) 실 매핑된 rows 를 받아 SchemaList 렌더.
//   - 행 클릭 → 읽기전용 상세 드로어(SchemaList 기본 openDetail).
//   - ⚠ "시설 등록"(addLabel) 생략 — 파트너 자가 등록 불가(코트 등록=운영자). 정직.
//   - ⚠ 시설 편집 = PATCH /api/web/partner/venue 엔드포인트 실재하나 정본 협력 콘솔에
//     편집 폼 없음(레거시 별도 venue 페이지) → R6-A 는 읽기 + 상세 드로어. 보고.
// ============================================================

import React from "react";
import { SchemaList, type Schema, type SchemaCol, type SchemaRow } from "@/components/admin-v2";

// 정본 PT_VENUES cols 1:1
const COLS: SchemaCol[] = [
  { key: "court", label: "시설", w: "minmax(0,2fr)", type: "avatar" },
  { key: "type", label: "유형", w: "96px", align: "center", type: "badge" },
  { key: "hours", label: "운영 시간", w: "minmax(0,1.1fr)", type: "muted" },
  { key: "bookings", label: "월 예약", w: "84px", align: "center", type: "mono" },
  { key: "rate", label: "가동률", w: "84px", align: "center", type: "mono" },
  { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

export type PtVenueRow = SchemaRow & {
  hours: string;
  bookings: string;
  rate: string;
};

export function VenuesList({ rows }: { rows: PtVenueRow[] }) {
  const schema: Schema = {
    head: "내 시설",
    sub: "등록한 코트·시설의 운영 상태를 확인합니다.",
    cols: COLS,
    rows,
  };
  // rowHref/onRow 없음 → SchemaList 기본(읽기전용 상세 드로어).
  return <SchemaList schema={schema} eyebrow="협력업체 콘솔" />;
}
