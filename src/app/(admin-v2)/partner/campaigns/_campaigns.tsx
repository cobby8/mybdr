"use client";

// ============================================================
// partner/campaigns/_campaigns.tsx — 캠페인 목록 (클라). 정본 partner-pages SchemaList(PT_CAMPAIGNS) 1:1.
//   서버에서 ad_campaigns(partner 스코프) 실 매핑된 rows 를 받아 SchemaList 렌더.
//   - 행 클릭 → 캠페인 상세(/partner/campaigns/[id]) 라우트 이동.
//   - ⚠ "캠페인 생성"(addLabel) 생략 — 생성 폼은 정본 협력 콘솔 범위 외(R6-A) → 시연 미배선. 보고.
//   - ⚠ 과금(예산/소진/단가) 컬럼 제외 — 통계(노출/클릭률)만(광고 과금 로직 미구현).
// ============================================================

import React from "react";
import {
  SchemaList,
  type Schema,
  type SchemaCol,
  type SchemaRow,
} from "@/components/admin-v2";

// 정본 PT_CAMPAIGNS cols 1:1 (과금 컬럼 없음 — 정본도 노출/클릭률만)
const COLS: SchemaCol[] = [
  { key: "name", label: "캠페인", w: "minmax(0,2fr)", type: "title" },
  { key: "slot", label: "노출 영역", w: "minmax(0,1.2fr)", type: "muted" },
  { key: "period", label: "기간", w: "minmax(0,1.3fr)", type: "mono" },
  { key: "imp", label: "노출", w: "92px", align: "center", type: "mono" },
  { key: "ctr", label: "클릭률", w: "84px", align: "center", type: "mono" },
  { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
];

export type PtCampaignRow = SchemaRow & {
  slot: string;
  period: string;
  imp: string;
  ctr: string;
};

export function CampaignsList({ rows }: { rows: PtCampaignRow[] }) {
  const schema: Schema = {
    head: "캠페인",
    sub: "운영 중인 프로모션·배너 캠페인의 성과를 확인합니다.",
    cols: COLS,
    // 행 클릭 → 상세 라우트 이동(SchemaList rowHref)
    rowHref: (r) => `/partner/campaigns/${r.id}`,
    rows,
  };
  return <SchemaList schema={schema} eyebrow="협력업체 콘솔" />;
}
