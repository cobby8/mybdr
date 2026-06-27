"use client";

import { SkelTable } from "@/components/admin-toss";

export function PanelLoadingState({ label = "불러오는 중입니다." }: { label?: string }) {
  return (
    <div className="op-panel-flow">
      <p className="tp-desc">{label}</p>
      <SkelTable rows={4} />
    </div>
  );
}
