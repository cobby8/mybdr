"use client";

// ============================================================
// referee-console/members/_members.tsx — 심판 명단 (클라). 정본 RF_REFS SchemaList 1:1.
//   서버에서 referee(전역) 실 매핑된 rows 를 받아 SchemaList 렌더.
//   - 행 클릭 → 상세 페이지 `/referee-console/members/[id]` 로 이동(rowHref).
//   - "심판 사전 등록"(addLabel) → `/referee-console/members/new` 등록 폼으로 이동.
//     컷오버 4-4b: 레거시 (referee)/referee/admin/members 신규등록·상세를 v2 로 포팅.
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
    // 추가 버튼 → 사전 등록 폼(레거시 new 포팅). addHref 가 있으면 토스트 대신 페이지 이동.
    addLabel: "심판 사전 등록",
    addHref: "/referee-console/members/new",
    // 행 클릭 → 심판 상세 페이지(레거시 [id] 포팅). r.id = referee.id(string).
    rowHref: (r) => `/referee-console/members/${r.id}`,
    cols: COLS,
    rows,
  };
  return <SchemaList schema={schema} eyebrow="심판 콘솔" />;
}
