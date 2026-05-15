"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - 통계 <Card> → div + 토큰 (3 카드 단순화)
// - 본문 <Card> wrapper 제거 / 상태 뱃지 → .badge--soft + 상태별 inline color
// 2026-05-15: Admin-5-B 박제 (BDR v2.14)
// - STATUS_STYLE(inline css) → STATUS_TONE (admin-stat-pill[data-tone] 매핑)
// - paid=ok / pending=warn / failed=err / cancelled=mute / refunded=info / partial_refunded=info
// - 비즈 로직 (fetch / filter / setSelected) 100% 보존

import { useState } from "react";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// (web) 시안 카드 패턴
const CARD_CLASS = "rounded-[var(--radius-card)] border p-4 sm:p-5";
const CARD_STYLE: React.CSSProperties = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-card)",
  boxShadow: "var(--shadow-card)",
};

// 서버에서 직렬화된 결제 타입
interface SerializedPayment {
  id: string;
  paymentCode: string;
  payableType: string;
  payableId: string;
  finalAmount: number;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  paid: "완료",
  failed: "실패",
  cancelled: "취소",
  refunded: "환불",
  // 부분 환불 — 결제 일부만 환불된 상태 (refund-policy: D-2~D-1 50% 등)
  partial_refunded: "부분 환불",
};

// 시안 v2.14 — admin-stat-pill[data-tone] 매핑
// (paid=ok / pending=warn / failed=err / cancelled=mute / refunded=info / partial_refunded=info)
const STATUS_TONE: Record<string, "ok" | "warn" | "err" | "info" | "mute"> = {
  pending: "warn",
  paid: "ok",
  failed: "err",
  cancelled: "mute",
  refunded: "info",
  // 부분 환불은 환불(info)과 같은 톤 유지 — 시각적 일관성
  partial_refunded: "info",
};

interface Props {
  payments: SerializedPayment[];
  stats: {
    totalCount: number;
    paidCount: number;
    totalPaid: number;
  };
}

export function AdminPaymentsContent({ payments, stats }: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedPayment | null>(null);

  const filtered =
    activeTab === "all"
      ? payments
      : payments.filter((p) => p.status === activeTab);

  const tabs = [
    { key: "all", label: "전체", count: payments.length },
    { key: "pending", label: "대기", count: payments.filter((p) => p.status === "pending").length },
    { key: "paid", label: "완료", count: payments.filter((p) => p.status === "paid").length },
    { key: "failed", label: "실패", count: payments.filter((p) => p.status === "failed").length },
  ];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      {/* 통계 카드 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className={CARD_CLASS} style={CARD_STYLE}>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>총 결제 건수</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl">{stats.totalCount.toLocaleString()}건</p>
        </div>
        <div className={CARD_CLASS} style={CARD_STYLE}>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>완료 건수</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl" style={{ color: "var(--color-success)" }}>{stats.paidCount.toLocaleString()}건</p>
        </div>
        <div className={CARD_CLASS} style={CARD_STYLE}>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>총 결제 금액</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl">{stats.totalPaid.toLocaleString()}원</p>
        </div>
      </div>

      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 축소된 테이블: 유저 / 금액 / 상태 / 날짜 (4칸) */}
      <div className="overflow-x-auto admin-table-wrap">
        {/* admin-table: 모바일 ≤720px 카드 변환 (globals.css [Admin Phase B]) */}
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-5 py-4 font-medium">유저</th>
              <th className="w-[120px] px-5 py-4 font-medium">금액</th>
              <th className="w-[80px] px-5 py-4 font-medium">상태</th>
              <th className="w-[90px] px-5 py-4 font-medium">날짜</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} onClick={() => setSelected(p)} className="cursor-pointer">
                <td data-primary="true" className="px-5 py-3">
                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {p.userName ?? "사용자"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {p.userEmail ?? "-"}
                  </p>
                </td>
                <td data-label="금액" className="px-5 py-3 font-semibold">
                  {p.finalAmount.toLocaleString()}원
                </td>
                <td data-label="상태" className="px-5 py-3">
                  {/* 시안 v2.14 — admin-stat-pill data-tone (미매치 시 mute 폴백) */}
                  <span className="admin-stat-pill" data-tone={STATUS_TONE[p.status] ?? "mute"}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </td>
                <td data-label="날짜" className="px-5 py-3" style={{ color: "var(--color-text-muted)" }}>
                  {fmtDate(p.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
          결제 내역이 없습니다.
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="결제 상세"
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="결제 정보"
              rows={[
                ["결제 코드", selected.paymentCode],
                ["유저", selected.userName ?? selected.userEmail ?? "-"],
                ["대상", `${selected.payableType}#${selected.payableId}`],
                ["금액", `${selected.finalAmount.toLocaleString()}원`],
                ["결제 방법", selected.paymentMethod ?? "-"],
                ["상태", (
                  // 시안 v2.14 — admin-stat-pill data-tone (ReactNode row)
                  <span className="admin-stat-pill" data-tone={STATUS_TONE[selected.status] ?? "mute"}>
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                )],
              ]}
            />
            <ModalInfoSection
              title="일시"
              rows={[["결제일", fmtDate(selected.createdAt)]]}
            />
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
