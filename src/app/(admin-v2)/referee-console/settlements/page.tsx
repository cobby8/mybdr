// ============================================================
// referee-console/settlements/page.tsx — 정산 (정본 referee-pages RF_SETTLE 1:1)
//   ★글로벌 super 스코프 — 협회 필터 0(전 협회 정산 통합). READ = Prisma 직접.
//   ★mutation = 상태변경(확인모달). 기존 엔드포인트 재사용:
//     PATCH /api/web/referee-admin/settlements/[id]/status { status }(snake·단일단어).
//   ⚠ cross-association 한계: 기존 IDOR 가드가 super 자동선택 협회 외 403 →
//     mutation 실패 시 모달에 사유 가시화(데이터 ~0행이라 실사용 무영향). 백엔드 0변경.
//   - 데이터 0행 → SchemaList Empty(mock 0).
// ============================================================

import { prisma } from "@/lib/db/prisma";
import {
  refereeName,
  settleStatusBadge,
  won,
  fmtDate,
  avColor,
} from "../_referee-data";
import { SettlementsList, type RfSettleRow } from "./_settlements";

export const dynamic = "force-dynamic";

export default async function RefereeSettlementsPage() {
  // 전역 정산 목록(협회 필터 0) — 최근 생성 우선.
  const settlements = await prisma.refereeSettlement.findMany({
    orderBy: { created_at: "desc" },
    take: 200,
    select: {
      id: true,
      amount: true,
      status: true,
      created_at: true,
      paid_at: true,
      referee: {
        select: { registered_name: true, verified_name: true },
      },
    },
  });

  const rows: RfSettleRow[] = settlements.map((s, i) => {
    const stt = settleStatusBadge(s.status);
    return {
      id: s.id.toString(),
      settlementId: s.id.toString(),
      statusCode: s.status,
      name: refereeName(s.referee),
      sub: stt.label,
      color: avColor(i),
      amount: won(s.amount),
      period: fmtDate(s.paid_at ?? s.created_at),
      badge: stt.label,
      tone: stt.tone,
    };
  });

  return <SettlementsList rows={rows} />;
}
