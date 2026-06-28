"use client";

// ============================================================
// referee-console/settlements/_settlements.tsx — 정산 (클라). 정본 RF_SETTLE SchemaList + 상태변경 모달.
//   서버에서 refereeSettlement(전역) 실 매핑된 rows 를 받아 SchemaList 렌더.
//   - 행 클릭 → 상태변경 모달(읽기 드로어 대신 mutation 진입점).
//   - mutation = adminFetch PATCH /api/web/referee-admin/settlements/[id]/status { status }.
//     · body camel→snake 변환(단일단어 status 라 동일) · 위험 액션은 2단계 확인.
//     · 실패 시 모달에 사유 가시화(errors.md 정산모달 패턴 — 403/서류부족 등 화면 노출).
//   - 성공 → router.refresh()(서버 재조회 · 낙관적 갱신 미사용 = 정합 우선).
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

// 정본 RF_SETTLE cols 1:1 (경기 수 col 은 1배정=1정산이라 제외, 나머지 보존).
const COLS: SchemaCol[] = [
  { key: "ref", label: "심판", w: "minmax(0,1.6fr)", type: "avatar" },
  { key: "amount", label: "수당", w: "minmax(0,1fr)", type: "money" },
  { key: "period", label: "정산 기준일", w: "minmax(0,1.2fr)", type: "mono" },
  { key: "status", label: "상태", w: "100px", align: "center", type: "badge" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

export type RfSettleRow = SchemaRow & {
  settlementId: string;
  statusCode: string;
  amount: string;
  period: string;
};

// 상태 전이 화이트리스트(서버 TRANSITIONS 와 동일 — UI 노출용).
const TRANSITIONS: Record<string, string[]> = {
  pending: ["scheduled", "cancelled"],
  scheduled: ["paid", "pending", "cancelled"],
  paid: ["refunded"],
  cancelled: ["pending"],
  refunded: ["pending"],
};

// 전이 버튼 라벨/톤.
const STATUS_LABEL: Record<string, string> = {
  pending: "대기로 되돌림",
  scheduled: "지급 예정 등록",
  paid: "지급 완료",
  cancelled: "정산 취소",
  refunded: "환수 처리",
};
// 위험 액션(별도 확인 강조) — 지급 완료/환수.
const RISKY = new Set(["paid", "refunded"]);

export function SettlementsList({ rows }: { rows: RfSettleRow[] }) {
  const router = useRouter();

  // 모달 상태: 선택된 행 / 확인 대기 중인 전이 / 처리중 / 에러.
  const [target, setTarget] = React.useState<RfSettleRow | null>(null);
  const [pending, setPending] = React.useState<string | null>(null); // 확인 대기 status
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function openRow(r: SchemaRow) {
    setTarget(r as RfSettleRow);
    setPending(null);
    setError(null);
  }
  function close() {
    if (busy) return;
    setTarget(null);
    setPending(null);
    setError(null);
  }

  async function applyStatus(status: string) {
    if (!target || busy) return;
    setBusy(true);
    setError(null);
    try {
      // 기존 엔드포인트 재사용 — body { status }(단일단어라 camel/snake 동일).
      await adminFetch(
        `/api/web/referee-admin/settlements/${target.settlementId}/status`,
        { method: "PATCH", body: { status } }
      );
      setBusy(false);
      setTarget(null);
      setPending(null);
      router.refresh(); // 서버 재조회로 상태 정합
    } catch (e) {
      // 실패 사유를 모달에 가시화(403 cross-association / 서류부족 / 전이불가 등).
      setBusy(false);
      setError(
        e instanceof AdminApiError
          ? e.message
          : "상태 변경에 실패했습니다. 다시 시도해주세요."
      );
    }
  }

  const allowed = target ? TRANSITIONS[target.statusCode] ?? [] : [];

  const schema: Schema = {
    head: "정산",
    sub: "전 협회 심판 수당 정산 내역을 확인하고 상태를 변경합니다.",
    cols: COLS,
    rows,
  };

  return (
    <>
      {/* 행 클릭 → 상태변경 모달(onRow) */}
      <SchemaList schema={schema} eyebrow="심판 콘솔" onRow={openRow} />

      <Modal
        open={target !== null}
        onClose={close}
        title="정산 상태 변경"
        sub={
          target
            ? `${target.name} · ${target.amount}`
            : undefined
        }
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

            {/* 에러 사유 가시화(403/서류부족/전이불가 등) */}
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

            {/* 2단계 확인 — 전이 선택 → 확인 */}
            {pending ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.5 }}>
                  정말 <b>{STATUS_LABEL[pending] ?? pending}</b>
                  {RISKY.has(pending) ? " 처리하시겠습니까? 되돌리기 어려운 작업입니다." : " 하시겠습니까?"}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn
                    variant={RISKY.has(pending) ? "danger" : "primary"}
                    onClick={() => applyStatus(pending)}
                    disabled={busy}
                  >
                    {busy ? "처리 중..." : "확인"}
                  </Btn>
                  <Btn
                    variant="secondary"
                    onClick={() => setPending(null)}
                    disabled={busy}
                  >
                    취소
                  </Btn>
                </div>
              </div>
            ) : allowed.length === 0 ? (
              <div style={{ fontSize: 14, color: "var(--ink-mute)" }}>
                현재 상태에서 변경 가능한 작업이 없습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 13.5, color: "var(--ink-mute)" }}>
                  변경할 상태를 선택하세요.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allowed.map((s) => (
                    <Btn
                      key={s}
                      variant={RISKY.has(s) ? "danger" : "secondary"}
                      size="sm"
                      onClick={() => {
                        setPending(s);
                        setError(null);
                      }}
                    >
                      {STATUS_LABEL[s] ?? s}
                    </Btn>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
