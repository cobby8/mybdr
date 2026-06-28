"use client";

// ============================================================
// referee-console/_dashboard.tsx — 배정 대시보드 (클라). 정본 referee-pages Dashboard 1:1.
//   PageHead + KpiGrid + ad-cols(월별 배정 막대 + 처리 대기). 실값은 서버 props.
//   - "주간 리포트" = 정본 시연 → 준비 중 토스트(honest no-op).
//   - 처리 대기 0건 → AdListPanel 이 빈상태 안내(빈 패널 차단).
// ============================================================

import React from "react";
import {
  PageHead,
  KpiGrid,
  AdBarPanel,
  AdListPanel,
  Btn,
  useAdminShell,
  type KpiItem,
  type BarDatum,
  type ListItem,
} from "@/components/admin-v2";

export type RfKpi = { label: string; value: string; icon: string; tone: string };
export type RfBar = BarDatum;
export type RfQueue = ListItem;

export function RefereeDashboard({
  kpis,
  bars,
  queue,
}: {
  kpis: RfKpi[];
  bars: RfBar[];
  queue: RfQueue[];
}) {
  const { toast } = useAdminShell();
  const year = new Date().getFullYear();

  return (
    <div>
      <PageHead
        eyebrow="심판 콘솔 · v2.41 (Toss)"
        title="배정 대시보드"
        sub="전 협회 심판 배정 현황과 처리 대기 항목을 확인합니다."
        actions={
          <Btn
            variant="secondary"
            icon="download"
            onClick={() => toast("주간 리포트 내보내기는 준비 중입니다")}
          >
            주간 리포트
          </Btn>
        }
      />

      <KpiGrid items={kpis as KpiItem[]} />

      <div className="ad-cols">
        <AdBarPanel
          title="월별 배정"
          badge={`${year}년`}
          badgeTone="primary"
          data={bars}
        />
        <AdListPanel title="처리 대기" items={queue} />
      </div>
    </div>
  );
}
