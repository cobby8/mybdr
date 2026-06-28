// ============================================================
// partner/settle/page.tsx — 정산 (준비 중 · R6-C 대기)
//   ★정산 모델(수익/수수료/정산액) 부재 → R6-A 제외(R6-C 신규모델 배치).
//   정본 PT_SETTLE(SchemaList)는 전부 mock 데이터 → 박제 금지(mock 0).
//   라우트는 존재(nav 데드링크 0) · 진입 시 "준비 중" placeholder.
// ============================================================

import { PageHead, Empty } from "@/components/admin-v2";

export const dynamic = "force-dynamic";

export default function PartnerSettlePage() {
  return (
    <div>
      <PageHead
        eyebrow="협력업체 콘솔"
        title="정산"
        sub="시설 대관·캠페인 수익의 정산 내역을 확인합니다."
      />
      <Empty
        icon="wallet"
        title="정산은 준비 중입니다"
        desc="정산 명세·수익 집계 기능은 다음 업데이트에서 제공됩니다."
      />
    </div>
  );
}
