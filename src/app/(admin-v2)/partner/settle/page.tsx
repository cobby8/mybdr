// ============================================================
// partner/settle/page.tsx — 정산 (정본 partner-data PT_SETTLE 1:1 · R6-C)
//   ★파트너 스코프(partner_id == 내 partner). super 무소속 = 빈 목록. READ = Prisma 직접.
//   ★mutation = 입금완료(status=paid). 신규 엔드포인트:
//     PATCH /api/web/partner/settlements/[id] { status }(본인 IDOR 가드·super bypass).
//   - 데이터 0행 → SchemaList Empty(mock 0). PartnerSettlement = R6-C 신규 모델.
// ============================================================

import { prisma } from "@/lib/db/prisma";
import {
  getPartnerContext,
  won,
  periodLabel,
  settlementStatusBadge,
} from "../_partner-data";
import { SettleList, type PtSettleRow } from "./_settle";

export const dynamic = "force-dynamic";

export default async function PartnerSettlePage() {
  const ctx = await getPartnerContext();
  const partnerId = ctx?.partnerId ?? null;

  // 본인 파트너 정산만(스코프 없으면 빈 목록) — 최근 정산월 우선.
  const settlements = partnerId
    ? await prisma.partnerSettlement.findMany({
        where: { partner_id: partnerId },
        orderBy: [{ period_year: "desc" }, { period_month: "desc" }],
        take: 200,
        select: {
          id: true,
          period_year: true,
          period_month: true,
          booking_count: true,
          gross_amount: true,
          fee_amount: true,
          net_amount: true,
          status: true,
        },
      })
    : [];

  const rows: PtSettleRow[] = settlements.map((s) => {
    const stt = settlementStatusBadge(s.status);
    return {
      id: s.id.toString(),
      settleId: s.id.toString(),
      statusCode: s.status,
      // title 셀(month) = r.name / sub.
      name: periodLabel(s.period_year, s.period_month),
      sub: `${s.booking_count}건 대관`,
      // money/mono 셀.
      booking: won(s.gross_amount),
      fee: "−" + won(s.fee_amount), // 수수료는 음수 표기(양수 저장)
      net: won(s.net_amount),
      badge: stt.label,
      tone: stt.tone,
    };
  });

  return <SettleList rows={rows} />;
}
