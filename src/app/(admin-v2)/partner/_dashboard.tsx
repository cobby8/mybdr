"use client";

// ============================================================
// partner/_dashboard.tsx — 협력업체 대시보드 (클라). 정본 partner-pages Dashboard 1:1.
//   PageHead + KpiGrid + ad-cols(월별 막대 + 최근 활동). 실값은 서버 props.
//   - KPI 4 = 등록 시설 / 운영 캠페인 / 캠페인 노출 / 평균 클릭률.
//     ★과금(예산/소진/단가) 제외 — 통계(노출/클릭)만(광고 과금 로직 미구현).
//     ★정산 KPI 제외 — 정산 모델 부재(R6-C). 정본 "정산 예정" 자리에 시설/통계로 대체.
//   - delta(증감) 생략 — 과거 스냅샷 부재(mock 0).
//   - "월간 리포트" = 정본 시연 → 준비 중 토스트(honest no-op).
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

export type PtKpi = { label: string; value: string; icon: string; tone: string };
export type PtBar = BarDatum;
export type PtActivity = ListItem;

export function PartnerDashboard({
  kpis,
  bars,
  activity,
}: {
  kpis: PtKpi[];
  bars: PtBar[];
  activity: PtActivity[];
}) {
  const { toast } = useAdminShell();
  const year = new Date().getFullYear();

  return (
    <div>
      <PageHead
        eyebrow="협력업체 콘솔 · v2.41 (Toss)"
        title="파트너 대시보드"
        sub="내 시설 운영과 캠페인 성과를 한눈에 확인합니다."
        actions={
          <Btn
            variant="secondary"
            icon="download"
            onClick={() => toast("월간 리포트 내보내기는 준비 중입니다")}
          >
            월간 리포트
          </Btn>
        }
      />

      <KpiGrid items={kpis as KpiItem[]} />

      <div className="ad-cols">
        <AdBarPanel
          title="월별 신규 캠페인"
          badge={`${year}년`}
          badgeTone="primary"
          data={bars}
        />
        <AdListPanel title="최근 활동" items={activity} />
      </div>
    </div>
  );
}
