"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - 통계 <Card> → div + 토큰 (3 카드 단순화)
// - 본문 <Card> wrapper 제거 / 상태 뱃지 → .badge--soft + 상태별 inline color
// 2026-05-15: Admin-5-B 박제 (BDR v2.14)
// - STATUS_STYLE(inline css) → STATUS_TONE (ad-pill[data-tone] 매핑)
// - paid=ok / pending=warn / failed=err / cancelled=mute / refunded=info / partial_refunded=info
// - 비즈 로직 (fetch / filter / setSelected) 100% 보존
// 2026-05-31: Phase 6.2C-5 BA1 박제 (BDR v2.25 · Option A)
// - Hero 4-stat (이번달 결제액 / 성공 건수 / 환불 합계 / 실패 건수) 3카드 → 4카드 실집계
// - 4탭 (성공 paid / 실패 failed / 환불됨 refunded / 환불대기) — refund_wait 는 시안 mock(DB status 미존재) → 제외, 실재 status 만
// - 환불 모달 신설: 기존 refund API(POST /api/web/payments/[id]/refund) 실호출. 신규 mutation 0
// - ⚠️ IDOR 제약: refund API 는 본인 결제만 환불 허용(payment.user_id === ctx.userId). admin 이 타인 결제 환불 시 API 가 403 반환 → 모달에 에러 메시지로 자연 표시(가짜 성공 mock ❌). 추후 admin-scoped 환불은 API 확장 필요(금전 민감, 별도 과제)

import { useState } from "react";
import { useRouter } from "next/navigation";
// Phase 2A (Toss 전환) — Material Symbols → lucide(<Icon>) 키트
import { Icon } from "@/components/admin-toss";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";
import {
  DataTable,
  PrimaryCell,
  StatRow,
  StatusBadge,
  Toolbar,
  type Column,
} from "@/components/admin/console-kit";

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
  refundedAt: string | null;
  tossPaymentKey: string | null;
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

// 시안 v2.14 — ad-pill[data-tone] 매핑
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

const STATUS_META = Object.fromEntries(
  Object.entries(STATUS_LABEL).map(([key, label]) => [
    key,
    {
      label,
      tone:
        STATUS_TONE[key] === "err"
          ? "danger"
          : STATUS_TONE[key] === "mute"
            ? "grey"
            : STATUS_TONE[key] === "info"
              ? "primary"
              : STATUS_TONE[key],
    },
  ])
) as Record<
  string,
  { label: string; tone: "ok" | "warn" | "danger" | "primary" | "grey" }
>;

interface Props {
  payments: SerializedPayment[];
  stats: {
    totalCount: number;
    paidCount: number;
    totalPaid: number;
    failedCount: number;
    refundedCount: number;
    refundedSum: number;
  };
}

export function AdminPaymentsContent({ payments, stats }: Props) {
  const router = useRouter();
  // 시안 BA1 기본 탭 = 성공(paid). refund_wait 는 mock 이라 제외 → paid 진입이 자연스러움
  const [activeTab, setActiveTab] = useState("paid");
  const [selected, setSelected] = useState<SerializedPayment | null>(null);

  // 환불 모달 상태 — refundTarget(대상 결제) / 사유 입력 / 처리중 / 에러
  const [refundTarget, setRefundTarget] = useState<SerializedPayment | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const filtered = payments.filter((p) => p.status === activeTab);

  // 시안 BA1 4탭 — 성공/실패/환불됨/환불대기.
  // 환불대기(refund_wait)는 시안 mock 으로 DB status 에 없음 → 탭에서 제외 (mock 0 lock).
  const tabs = [
    { id: "paid", label: "성공", n: stats.paidCount },
    { id: "failed", label: "실패", n: stats.failedCount },
    { id: "refunded", label: "환불됨", n: stats.refundedCount },
  ];

  const columns: Column<SerializedPayment>[] = [
    {
      key: "userName",
      label: "유저",
      width: "minmax(220px,1.5fr)",
      render: (p) => (
        <PrimaryCell
          initials={(p.userName ?? p.userEmail ?? "U").slice(0, 1)}
          title={p.userName ?? "사용자"}
          meta={p.userEmail ?? "-"}
          accent
        />
      ),
    },
    {
      key: "finalAmount",
      label: "금액",
      width: "140px",
      align: "right",
      render: (p) => `${p.finalAmount.toLocaleString()}원`,
    },
    {
      key: "status",
      label: "상태",
      width: "110px",
      align: "center",
      render: (p) => <StatusBadge map={STATUS_META} value={p.status} />,
    },
    {
      key: "createdAt",
      label: "날짜",
      width: "120px",
      hideSm: true,
      render: (p) => fmtDate(p.createdAt),
    },
    {
      key: "id",
      label: "액션",
      width: "140px",
      align: "right",
      render: (p) => (
        <span onClick={(e) => e.stopPropagation()}>
          {p.status === "paid" ? (
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => openRefund(p)}
            >
              <Icon name="arrow-left-right" size={16} />
              환불
            </button>
          ) : p.status === "refunded" && p.refundedAt ? (
            <span className="text-xs" style={{ color: "var(--ink-mute)" }}>
              환불 {fmtDate(p.refundedAt)}
            </span>
          ) : (
            <span className="text-xs" style={{ color: "var(--ink-mute)" }}>—</span>
          )}
        </span>
      ),
    },
  ];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  // 환불 모달 열기 — paid 상태 결제만 환불 가능 (refund API 와 동일 가드)
  const openRefund = (p: SerializedPayment) => {
    setRefundTarget(p);
    setRefundReason("");
    setRefundError(null);
  };

  const closeRefund = () => {
    if (refunding) return; // 처리 중에는 닫기 방지
    setRefundTarget(null);
    setRefundError(null);
  };

  // 환불 실행 — 기존 refund API 실호출 (신규 mutation 0)
  // ⚠️ IDOR: API 가 본인 결제만 허용. admin 이 타인 결제 환불 시 403 → catch 에서 에러 메시지로 자연 표시
  const submitRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    setRefundError(null);
    try {
      const res = await fetch(
        `/api/web/payments/${refundTarget.id}/refund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // refund API 는 body 미사용(사유 서버 고정) — 향후 사유 전달 확장 대비 키만 동봉
          body: JSON.stringify({ reason: refundReason }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 403(타인 결제) / 400(기한·상태) 등 API 에러를 그대로 노출 (가짜 성공 mock ❌)
        // apiError 응답 형태: { error: "<메시지>", code } → data.error 가 문자열
        const msg =
          typeof data?.error === "string"
            ? data.error
            : data?.message || "환불 처리에 실패했습니다.";
        throw new Error(msg);
      }
      // 성공 → 모달 닫고 서버 데이터 갱신 (force-dynamic 페이지 새로고침)
      setRefundTarget(null);
      router.refresh();
    } catch (e) {
      setRefundError(e instanceof Error ? e.message : "환불 처리에 실패했습니다.");
    } finally {
      setRefunding(false);
    }
  };

  return (
    <>
      {/* Hero 4-stat (시안 BA1 oa1-hero__stats 톤) — 이번달 결제액 자리에 총 결제액 사용(기간 필터 미구현) */}
      <StatRow
        items={[
          { icon: "wallet", label: "총 결제 금액", value: `${stats.totalPaid.toLocaleString()}원` },
          { icon: "check-circle-2", label: "성공 건수", value: `${stats.paidCount.toLocaleString()}건`, trend: "up", delta: "paid" },
          { icon: "rotate-ccw", label: "환불 합계", value: `${stats.refundedSum.toLocaleString()}원` },
          { icon: "x-circle", label: "실패 건수", value: `${stats.failedCount.toLocaleString()}건`, trend: "down", delta: "failed" },
        ]}
      />

      <Toolbar tabs={tabs} active={activeTab} onTab={setActiveTab} />

      <DataTable
        columns={columns}
        rows={filtered}
        keyField="id"
        onRowClick={setSelected}
        emptyTitle="결제 내역이 없습니다"
      />

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
                  <StatusBadge map={STATUS_META} value={selected.status} />
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

      {/*
        환불 모달 (시안 BA1) — 기존 refund API(POST /api/web/payments/[id]/refund) 실호출.
        ⚠️ IDOR 제약 (refund route.ts §본인 결제만 환불):
          API 는 payment.user_id === ctx.userId 인 경우만 환불 허용.
          → admin 이 "타인" 결제를 환불 시도하면 API 가 403("본인의 결제만 환불할 수 있습니다.") 반환.
          → 본 UI 는 그 403 응답을 refundError 로 그대로 노출 (가짜 성공 mock ❌).
          → 따라서 현재 admin 화면의 환불은 "관리자 본인 결제" 에 대해서만 실제 동작.
            admin-scoped(타인 결제) 환불은 API 확장(별도 권한 가드 + 토스 환불) 필요 — 금전 민감, 별도 과제.
      */}
      {refundTarget && (
        <AdminDetailModal
          isOpen={!!refundTarget}
          onClose={closeRefund}
          title="결제 환불"
          actions={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn--sm"
                onClick={closeRefund}
                disabled={refunding}
              >
                취소
              </button>
              {/* 위험 톤 — 운영 destructive 버튼 패턴(btn--sm + inline color-error) 재사용. 시안 BA1 "환불" 버튼 답습 */}
              <button
                type="button"
                className="btn btn--sm inline-flex items-center gap-1"
                style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
                onClick={submitRefund}
                disabled={refunding}
              >
                {/* currency_exchange → lucide arrow-left-right (환불/교환) */}
                <Icon name="arrow-left-right" size={16} />
                {refunding ? "처리 중…" : "환불 처리"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="환불 대상"
              rows={[
                ["결제 코드", refundTarget.paymentCode],
                ["유저", refundTarget.userName ?? refundTarget.userEmail ?? "-"],
                ["결제 항목", `${refundTarget.payableType}#${refundTarget.payableId}`],
                ["환불 금액", `${refundTarget.finalAmount.toLocaleString()}원`],
                ["결제일", fmtDate(refundTarget.createdAt)],
              ]}
            />

            {/* 환불 사유 입력 (사용자 안내용) — 현재 API 는 서버 고정 사유 사용, 키만 전달 */}
            <div>
              <label
                className="mb-1.5 block text-[11px] font-black uppercase tracking-widest"
                style={{ color: "var(--color-text-muted)" }}
              >
                환불 사유 (선택)
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="중복 결제, 예약 취소 등"
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-elevated)",
                  color: "var(--color-text-primary)",
                }}
                disabled={refunding}
              />
            </div>

            {/* 안내 — 환불은 토스페이먼츠 실연결 (운영 키 있을 때 실제 취소) */}
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              환불 시 토스페이먼츠 결제가 취소되고 결제 상태가 &lsquo;환불&rsquo;로 변경됩니다. (결제 후 7일 이내만 가능)
            </p>

            {/* API 에러(403 IDOR / 400 기한·상태 등) 자연 표시 */}
            {refundError && (
              <p
                className="rounded-md px-3 py-2 text-sm"
                style={{
                  color: "var(--color-error)",
                  backgroundColor:
                    "color-mix(in srgb, var(--color-error) 12%, transparent)",
                }}
              >
                {refundError}
              </p>
            )}
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
