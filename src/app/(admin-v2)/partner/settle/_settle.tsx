"use client";

// ============================================================
// partner/settle/_settle.tsx — 정산 (클라). 정본 partner-data SchemaList(PT_SETTLE) 1:1 + 입금완료 모달.
//   서버에서 partnerSettlement(본인 파트너 스코프) 실 매핑된 rows 를 받아 SchemaList 렌더.
//   - 행 클릭 → 입금완료 모달(읽기 드로어 대신 mutation 진입점).
//   - mutation = adminFetch PATCH /api/web/partner/settlements/[id] { status: "paid" }.
//     · body camel→snake 변환(단일단어 status 라 동일) · 입금 확정 전 2단계 확인.
//     · 실패 시 모달에 사유 가시화(403 / 전이불가 등 화면 노출).
//   - 성공 → router.refresh()(서버 재조회 · 낙관적 갱신 미사용 = 정합 우선).
//   - 입금완료(paid)는 되돌리기 어려운 작업 → 위험 액션(danger) 강조.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import {
  SchemaList,
  Modal,
  Btn,
  Badge,
  type Schema,
  type SchemaCol,
  type SchemaRow,
} from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// 정본 PT_SETTLE cols 1:1 + 입금완료 진입용 act col.
const COLS: SchemaCol[] = [
  { key: "month", label: "정산월", w: "minmax(0,1fr)", type: "title" },
  { key: "booking", label: "대관 수익", w: "minmax(0,1fr)", type: "money" },
  { key: "fee", label: "수수료", w: "minmax(0,1fr)", type: "mono" },
  { key: "net", label: "정산액", w: "minmax(0,1fr)", type: "money" },
  { key: "status", label: "상태", w: "100px", align: "center", type: "badge" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

export type PtSettleRow = SchemaRow & {
  settleId: string;
  statusCode: string;
  booking: string;
  fee: string;
  net: string;
};

export function SettleList({ rows }: { rows: PtSettleRow[] }) {
  const router = useRouter();

  // 모달 상태: 선택된 행 / 확인 단계 진입 여부 / 처리중 / 에러.
  const [target, setTarget] = React.useState<PtSettleRow | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function openRow(r: SchemaRow) {
    setTarget(r as PtSettleRow);
    setConfirming(false);
    setError(null);
  }
  function close() {
    if (busy) return;
    setTarget(null);
    setConfirming(false);
    setError(null);
  }

  async function markPaid() {
    if (!target || busy) return;
    setBusy(true);
    setError(null);
    try {
      // 신규 엔드포인트 — body { status: "paid" }(단일단어라 camel/snake 동일).
      await adminFetch(`/api/web/partner/settlements/${target.settleId}`, {
        method: "PATCH",
        body: { status: "paid" },
      });
      setBusy(false);
      setTarget(null);
      setConfirming(false);
      router.refresh(); // 서버 재조회로 상태 정합
    } catch (e) {
      // 실패 사유를 모달에 가시화(403 / 전이불가 등).
      setBusy(false);
      setError(
        e instanceof AdminApiError
          ? e.message
          : "상태 변경에 실패했습니다. 다시 시도해주세요."
      );
    }
  }

  // 입금완료는 pending(입금 예정)에서만 가능.
  const canPay = target?.statusCode === "pending";

  const schema: Schema = {
    head: "정산",
    sub: "시설 대관·캠페인 수익의 정산 내역을 확인하고 입금을 확정합니다.",
    cols: COLS,
    rows,
  };

  return (
    <>
      {/* 행 클릭 → 입금완료 모달(onRow) */}
      <SchemaList schema={schema} eyebrow="협력업체 콘솔" onRow={openRow} />

      <Modal
        open={target !== null}
        onClose={close}
        title="정산 입금 확정"
        sub={target ? `${target.name} · 정산액 ${target.net}` : undefined}
      >
        {target && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 현재 상태 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, color: "var(--ink-mute)" }}>
                현재 상태
              </span>
              <Badge tone={(target.tone as never) || "grey"}>
                {target.badge}
              </Badge>
            </div>

            {/* 에러 사유 가시화 */}
            {error && (
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--danger)",
                  background: "var(--danger-weak, rgba(240,68,82,0.08))",
                  border: "1px solid var(--danger)",
                  borderRadius: 6,
                  padding: "10px 12px",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            {/* 입금완료 진입(pending 에서만) → 2단계 확인 */}
            {!canPay ? (
              <div style={{ fontSize: 14, color: "var(--ink-mute)" }}>
                입금 예정 상태에서만 입금을 확정할 수 있습니다.
              </div>
            ) : confirming ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.5 }}
                >
                  정말 <b>입금 완료</b> 처리하시겠습니까? 되돌리기 어려운
                  작업입니다.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="danger" onClick={markPaid} disabled={busy}>
                    {busy ? "처리 중..." : "입금 완료"}
                  </Btn>
                  <Btn
                    variant="secondary"
                    onClick={() => setConfirming(false)}
                    disabled={busy}
                  >
                    취소
                  </Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 13.5, color: "var(--ink-mute)" }}>
                  입금을 확정하면 상태가 "입금 완료"로 변경됩니다.
                </div>
                <div>
                  <Btn
                    variant="primary"
                    onClick={() => {
                      setConfirming(true);
                      setError(null);
                    }}
                  >
                    입금 완료 처리
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
