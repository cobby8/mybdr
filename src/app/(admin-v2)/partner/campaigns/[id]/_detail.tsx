"use client";

// ============================================================
// partner/campaigns/[id]/_detail.tsx — 캠페인 상세 (클라). 정본 partner-pages CampaignDetail 1:1.
//   backlink + PageHead + KpiGrid + 노출 영역(placements) 패널. 실값은 서버 props.
//   - KPI 3 = 총 노출 / 클릭 / 클릭률. ★과금(예산/소진/단가/전환) 제외 — 통계만.
//   - 주차별 노출 막대(정본) 제외 — 시계열 데이터 부재(mock 0) → 실 placements 패널만.
//   - 수정/일시중지 = 정본 시연 → 준비 중 토스트(honest no-op). PATCH 폼은 R6-A 범위 외.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import {
  PageHead,
  KpiGrid,
  AdListPanel,
  Btn,
  Icon,
  useAdminShell,
  type KpiItem,
  type ListItem,
} from "@/components/admin-v2";

export type CampaignDetailData = {
  id: string;
  title: string;
  meta: string;
  kpis: KpiItem[];
  placements: ListItem[];
};

export function CampaignDetail({ data }: { data: CampaignDetailData }) {
  const router = useRouter();
  const { toast } = useAdminShell();

  return (
    <div>
      <button
        className="ad-backlink"
        onClick={() => router.push("/partner/campaigns")}
      >
        <Icon name="arrow-left" size={16} />
        캠페인 목록
      </button>

      <PageHead
        eyebrow="협력업체 콘솔"
        title={data.title}
        sub={data.meta}
        actions={
          <>
            <Btn
              variant="secondary"
              icon="pencil"
              size="sm"
              onClick={() => toast("캠페인 수정은 준비 중입니다")}
            >
              수정
            </Btn>
            <Btn
              variant="secondary"
              icon="pause"
              size="sm"
              onClick={() => toast("캠페인 일시중지는 준비 중입니다")}
            >
              일시중지
            </Btn>
          </>
        }
      />

      <KpiGrid items={data.kpis} />

      <div className="ad-cols">
        <AdListPanel title="노출 영역" items={data.placements} />
      </div>
    </div>
  );
}
