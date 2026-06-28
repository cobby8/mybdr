"use client";

// ============================================================
// referee-console/assignments/_assignments.tsx — 배정 현황 (클라). 정본 RF_ASSIGN SchemaList.
//   서버에서 refereeAssignment(전역) 실 매핑된 rows 를 받아 SchemaList 렌더.
//   - 행 클릭 → 읽기전용 상세 드로어(SchemaList 기본 openDetail).
//   - ⚠ 배정 mutation(수동배정/상태변경)은 본 화면 범위 제외 = 읽기 드로어만(PM 결정).
//     사유: 기존 배정 엔드포인트 IDOR 가 super 자동선택 협회 외 403 → 후속 결정.
// ============================================================

import React from "react";
import {
  SchemaList,
  type Schema,
  type SchemaCol,
  type SchemaRow,
} from "@/components/admin-v2";

// 정본 RF_ASSIGN cols 기반(crew→역할, 모델 단위 적응).
const COLS: SchemaCol[] = [
  { key: "ref", label: "심판", w: "minmax(0,1.4fr)", type: "avatar" },
  { key: "game", label: "경기", w: "minmax(0,1.8fr)", type: "muted" },
  { key: "when", label: "일시", w: "minmax(0,1.2fr)", type: "mono" },
  { key: "court", label: "코트", w: "minmax(0,1fr)", type: "muted" },
  { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

export type RfAssignRow = SchemaRow & {
  game: string;
  when: string;
  court: string;
};

export function AssignmentsList({ rows }: { rows: RfAssignRow[] }) {
  const schema: Schema = {
    head: "배정 현황",
    sub: "전 협회 경기별 심판 배정 상태를 확인합니다.",
    cols: COLS,
    rows,
  };
  // rowHref/onRow 없음 → 읽기전용 상세 드로어(배정 mutation 은 후속).
  return <SchemaList schema={schema} eyebrow="심판 콘솔" />;
}
