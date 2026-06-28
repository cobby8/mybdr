"use client";

// ============================================================
// referee-console/members/_members.tsx — 심판 명단 (클라). 정본 RF_REFS SchemaList 1:1.
//   서버에서 referee(전역) 실 매핑된 rows 를 받아 SchemaList 렌더.
//   - 행 클릭 → 읽기전용 상세 드로어(SchemaList 기본 openDetail).
//   - ⚠ "심판 등록"(addLabel) 생략 — 사전등록은 협회 admin(레거시) 소관. 글로벌 콘솔은 READ.
// ============================================================

import React from "react";
import {
  SchemaList,
  type Schema,
  type SchemaCol,
  type SchemaRow,
} from "@/components/admin-v2";

// 정본 RF_REFS cols 1:1 (평점 col 은 평가모델 부재 → 제외, 정본 나머지 보존).
const COLS: SchemaCol[] = [
  { key: "ref", label: "심판", w: "minmax(0,1.8fr)", type: "avatar" },
  { key: "grade", label: "등급", w: "92px", align: "center", type: "badge" },
  { key: "region", label: "활동 지역", w: "minmax(0,1.2fr)", type: "muted" },
  { key: "games", label: "배정", w: "84px", align: "center", type: "mono" },
  { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

export type RfMemberRow = SchemaRow & {
  region: string;
  games: number;
};

export function MembersList({ rows }: { rows: RfMemberRow[] }) {
  const schema: Schema = {
    head: "심판 명단",
    sub: "전 협회 활동 심판의 등급·지역·배정 현황을 확인합니다.",
    cols: COLS,
    rows,
  };
  // rowHref/onRow 없음 → SchemaList 기본(읽기전용 상세 드로어).
  return <SchemaList schema={schema} eyebrow="심판 콘솔" />;
}
