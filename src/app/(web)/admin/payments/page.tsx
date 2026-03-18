import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  paid: "완료",
  failed: "실패",
  cancelled: "취소",
  refunded: "환불",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-[#FBBF24] bg-[rgba(251,191,36,0.1)]",
  paid: "text-[#4ADE80] bg-[rgba(74,222,128,0.1)]",
  failed: "text-[#EF4444] bg-[rgba(239,68,68,0.1)]",
  cancelled: "text-[#9CA3AF] bg-[#EEF2FF]",
  refunded: "text-[#60A5FA] bg-[rgba(96,165,250,0.1)]",
};

export default async function AdminPaymentsPage() {
  const [payments, stats] = await Promise.all([
    prisma.payments.findMany({
      orderBy: { created_at: "desc" },
      take: 50,
      include: { users: { select: { nickname: true, email: true } } },
    }).catch(() => []),
    prisma.payments.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { final_amount: true },
    }).catch(() => []),
  ]);

  const totalPaid = stats.find((s) => s.status === "paid")?._sum.final_amount ?? 0;
  const totalCount = payments.length;
  const paidCount = stats.find((s) => s.status === "paid")?._count._all ?? 0;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">결제 관리</h1>

      {/* 통계 카드 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-[#6B7280]">총 결제 건수</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl">{totalCount.toLocaleString()}건</p>
        </Card>
        <Card>
          <p className="text-xs text-[#6B7280]">완료 건수</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl text-[#4ADE80]">{paidCount.toLocaleString()}건</p>
        </Card>
        <Card>
          <p className="text-xs text-[#6B7280]">총 결제 금액</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl">
            {Number(totalPaid).toLocaleString()}원
          </p>
        </Card>
      </div>

      {/* 결제 목록 */}
      {payments.length === 0 ? (
        <Card className="py-12 text-center text-[#6B7280]">
          <div className="mb-2 text-3xl">💳</div>
          결제 내역이 없습니다.
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[130px]" />
                <col className="w-[155px]" />
                <col className="w-[135px]" />
                <col className="w-[105px]" />
                <col className="w-[90px]" />
                <col className="w-[75px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF2FF] text-left text-xs text-[#9CA3AF]">
                  <th className="pb-3 pr-4">결제 코드</th>
                  <th className="pb-3 pr-4">유저</th>
                  <th className="pb-3 pr-4">대상</th>
                  <th className="pb-3 pr-4">금액</th>
                  <th className="pb-3 pr-4">방법</th>
                  <th className="pb-3 pr-4">상태</th>
                  <th className="pb-3">일시</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id.toString()} className="border-b border-[#FFFFFF] hover:bg-[#EEF2FF]/50">
                    <td className="py-3 pr-4 font-mono text-xs text-[#9CA3AF]">
                      {p.payment_code.slice(0, 12)}...
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{p.users?.nickname ?? "사용자"}</div>
                      <div className="text-xs text-[#9CA3AF]">{p.users?.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-[#6B7280]">
                      {p.payable_type}#{p.payable_id.toString()}
                    </td>
                    <td className="py-3 pr-4 font-semibold">
                      {Number(p.final_amount).toLocaleString()}원
                    </td>
                    <td className="py-3 pr-4 text-[#6B7280]">
                      {p.payment_method ?? "-"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLOR[p.status] ?? "text-[#6B7280] bg-[#EEF2FF]"
                        }`}
                      >
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-[#9CA3AF]">
                      {new Date(p.created_at).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
