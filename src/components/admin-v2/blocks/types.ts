// =====================================================================
// admin-v2/blocks/types.ts — 정본 admin-blocks.jsx 스키마 타입(TS화)
//   박제 source: Dev/design/BDR v2.41-admin-toss/admin-blocks.jsx
//   SchemaList / renderSchemaCell 이 소비하는 schema/col/row 형상.
//   정본은 동적(window) 객체였으나 그린필드는 타입드로 명시(M2 토대셋).
// =====================================================================

import type { ReactNode } from "react";
import type { BadgeTone } from "@/components/admin-toss";

// 스키마 셀 렌더 타입 — renderSchemaCell 의 switch 분기와 1:1.
export type SchemaCellType =
  | "title"
  | "avatar"
  | "badge"
  | "status"
  | "mono"
  | "muted"
  | "money"
  | "actions";

// 컬럼 정의 — w 는 grid-template-columns 트랙(예: "1fr" | "120px").
export interface SchemaCol {
  key: string;
  label: ReactNode;
  type?: SchemaCellType;
  w?: string;
  align?: "left" | "center" | "right";
}

// 행 데이터 — name/sub/badge 등 표준 키 + col.key 로 접근하는 동적 셀 값.
export interface SchemaRow {
  id?: string | number;
  name: string;
  sub?: string;
  badge?: ReactNode; // badge 셀 표시값(없으면 col.key 값)
  tone?: BadgeTone; // badge 톤
  st?: string; // status 셀 라벨
  sttone?: string; // status dot 톤(ok/warn/danger/mute)
  color?: string; // avatar 배경(데이터 주입색 — 컴포넌트 하드코딩 아님)
  // 스키마 셀 값 — col.key 로 접근. 동적 키라 unknown 으로 둠.
  [key: string]: unknown;
}

// 리스트 페이지 스키마 — head/cols/rows + 진입맵(rowHref/addHref).
export interface SchemaDef {
  head: string;
  sub?: string;
  cols: SchemaCol[];
  rows: SchemaRow[];
  // 행 클릭 진입(정본 §9 진입맵): 문자열 또는 (row)=>url.
  //   없으면 onOpenDetail 콜백으로 읽기전용 상세 드로어를 연다.
  rowHref?: string | ((row: SchemaRow) => string);
  addLabel?: string;
  addHref?: string;
}

// 상세 드로어 payload(정본 openDetail 빌드 결과) — 소비처(M3)에서 렌더.
export interface SchemaDetailField {
  label: ReactNode;
  value: ReactNode;
}
export interface SchemaDetailPayload {
  eyebrow: string;
  title: string;
  sub?: string;
  badge?: ReactNode;
  tone?: string; // r.tone(BadgeTone) || r.sttone(string)
  fields: SchemaDetailField[];
}
