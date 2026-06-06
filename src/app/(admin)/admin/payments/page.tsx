import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPaymentsContent } from "./admin-payments-content";

export const dynamic = "force-dynamic";

// 결제 관리 — 서버 컴포넌트: 데이터 패칭만 담당
export default async function AdminPaymentsPage() {
  const [payments, statsRaw] = await Promise.all([
    prisma.payments
      .findMany({
        orderBy: { created_at: "desc" },
        take: 50,
        include: { users: { select: { nickname: true, email: true } } },
      })
      .catch(() => []),
    prisma.payments
      .groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { final_amount: true },
      })
      .catch(() => []),
  ]);

  // 6.2C-5(BA1) Hero 4-stat 실집계 — 기존 groupBy 재사용 (추가 쿼리 0)
  // refund_wait 탭은 시안 mock(DB status 미존재) → 집계/탭 모두 제외 (mock 0 lock)
  const totalPaid = statsRaw.find((s) => s.status === "paid")?._sum.final_amount ?? 0;
  const paidCount = statsRaw.find((s) => s.status === "paid")?._count._all ?? 0;
  const failedCount = statsRaw.find((s) => s.status === "failed")?._count._all ?? 0;
  const refundedCount = statsRaw.find((s) => s.status === "refunded")?._count._all ?? 0;
  // 환불 합계 — refunded + partial_refunded 의 final_amount 합 (환불액 컬럼 대신 결제액 기준, Hero 표시용)
  const refundedSum =
    Number(statsRaw.find((s) => s.status === "refunded")?._sum.final_amount ?? 0) +
    Number(statsRaw.find((s) => s.status === "partial_refunded")?._sum.final_amount ?? 0);

  // 직렬화 — BA1 환불 모달용 toss_payment_key / refunded_at 추가 (조회 컬럼 변경 0)
  const serialized = payments.map((p) => ({
    id: p.id.toString(),
    paymentCode: p.payment_code,
    payableType: p.payable_type,
    payableId: p.payable_id.toString(),
    finalAmount: Number(p.final_amount),
    paymentMethod: p.payment_method,
    status: p.status,
    createdAt: new Date(p.created_at).toISOString(),
    refundedAt: p.refunded_at ? new Date(p.refunded_at).toISOString() : null,
    tossPaymentKey: p.toss_payment_key,
    userName: p.users?.nickname ?? null,
    userEmail: p.users?.email ?? null,
  }));

  return (
    <div>
      <AdminPageHeader
        // 시안 v2.14 — eyebrow + breadcrumbs (Admin-5-B 박제)
        eyebrow="ADMIN · 비즈니스"
        title="결제 관리"
        subtitle={`전체 ${payments.length}건`}
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "비즈니스" },
          { label: "결제" },
        ]}
      />
      <AdminPaymentsContent
        payments={serialized}
        stats={{
          totalCount: payments.length,
          paidCount,
          totalPaid: Number(totalPaid),
          failedCount,
          refundedCount,
          refundedSum,
        }}
      />
    </div>
  );
}
