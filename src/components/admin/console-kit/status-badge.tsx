// =====================================================================
// status-badge.tsx — 상태값 → Badge 매핑 (v2.40 A2 박제)
//   박제 source: Dev/design/BDR v2.40/_admin-unified/au-kit.jsx (StatusBadge)
//   상태 코드(value)를 map 으로 룩업해 적절한 톤/라벨의 Badge 렌더.
//   예: map={{ paid:{tone:"ok",label:"입금완료"}, unpaid:{tone:"grey",label:"미입금"} }}
//
//   서버 컴포넌트 — 기존 admin-toss Badge(서버 가능)를 감싸는 얇은 래퍼.
//   value 가 map 에 없으면 null(렌더 안 함) — 시안 동일.
// =====================================================================

import React from "react";
import { Badge } from "@/components/admin-toss";
import type { BadgeTone } from "@/components/admin-toss";

// 상태 1개의 표시 규칙 — 톤 + 라벨(+옵션 아이콘)
export type StatusMeta = {
  tone?: BadgeTone;
  label: React.ReactNode;
  icon?: string;
};

export type StatusBadgeProps = {
  map: Record<string, StatusMeta>; // 상태코드 → 표시규칙
  value: string; // 현재 상태코드
};

export function StatusBadge({ map, value }: StatusBadgeProps) {
  const s = map[value];
  if (!s) return null; // 매핑 없으면 미표시(시안 동일)
  return (
    <Badge tone={s.tone} icon={s.icon}>
      {s.label}
    </Badge>
  );
}
