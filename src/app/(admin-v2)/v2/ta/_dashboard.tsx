"use client";

// ============================================================
// ta/_dashboard.tsx — 대회 콘솔 대시보드 (클라). 정본 ta-pages Dashboard 1:1.
//   PageHead + KpiGrid + ad-cols(월별 개최 막대 + 최근 활동). 실값은 서버 props.
//   "새 대회 만들기" = 생성 마법사(R5) 미배선 → 준비 중 토스트(honest no-op).
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

export type TaKpi = { label: string; value: string; icon: string; tone: string };
export type TaBar = BarDatum;
export type TaActivity = ListItem;

export function Dashboard({
  kpis,
  bars,
  activity,
}: {
  kpis: TaKpi[];
  bars: TaBar[];
  activity: TaActivity[];
}) {
  const { toast } = useAdminShell();
  const year = new Date().getFullYear();

  return (
    <div>
      <PageHead
        eyebrow="대회 관리자"
        title="대시보드"
        sub="운영 중인 대회 현황과 최근 활동을 한눈에 확인합니다."
        actions={
          <Btn icon="plus" onClick={() => toast("대회 생성은 준비 중입니다")}>
            새 대회 만들기
          </Btn>
        }
      />

      <KpiGrid items={kpis as KpiItem[]} />

      <div className="ad-cols">
        <AdBarPanel
          title="월별 개최 대회"
          badge={`${year}년`}
          badgeTone="primary"
          data={bars}
        />
        <AdListPanel title="최근 활동" items={activity} />
      </div>
    </div>
  );
}
