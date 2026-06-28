"use client";

// ============================================================
// referee-console/verify/_verify.tsx — 자격·서류 검증 (클라). 정본 RF_VERIFY SchemaList + 검증 모달.
//   서버에서 refereeCertificate(전역) 실 매핑된 rows 를 받아 SchemaList 렌더.
//   - 행 클릭 → 검증 토글 모달(읽기 드로어 대신 mutation 진입점).
//   - mutation = adminFetch PATCH /api/web/admin/referee-certificates/[id]/verify { verified }.
//     · 위험 액션(검증 확정/해제) 2단계 확인.
//     · 실패 시 모달에 사유 가시화(403 cross-association 등 화면 노출).
//   - 성공 → router.refresh()(서버 재조회).
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

// 정본 RF_VERIFY cols 1:1.
const COLS: SchemaCol[] = [
  { key: "ref", label: "심판", w: "minmax(0,1.6fr)", type: "avatar" },
  { key: "doc", label: "서류", w: "minmax(0,1.4fr)", type: "muted" },
  { key: "issued", label: "발급일", w: "minmax(0,1fr)", type: "mono" },
  { key: "expire", label: "만료", w: "minmax(0,1fr)", type: "mono" },
  { key: "status", label: "검증", w: "100px", align: "center", type: "badge" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

export type RfVerifyRow = SchemaRow & {
  certId: string;
  verified: boolean;
  doc: string;
  issued: string;
  expire: string;
};

export function VerifyList({ rows }: { rows: RfVerifyRow[] }) {
  const router = useRouter();

  const [target, setTarget] = React.useState<RfVerifyRow | null>(null);
  const [confirming, setConfirming] = React.useState(false); // 확인 단계
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function openRow(r: SchemaRow) {
    setTarget(r as RfVerifyRow);
    setConfirming(false);
    setError(null);
  }
  function close() {
    if (busy) return;
    setTarget(null);
    setConfirming(false);
    setError(null);
  }

  async function applyVerify(nextVerified: boolean) {
    if (!target || busy) return;
    setBusy(true);
    setError(null);
    try {
      // 기존 엔드포인트 재사용 — body { verified }(boolean 단일단어).
      await adminFetch(
        `/api/web/admin/referee-certificates/${target.certId}/verify`,
        { method: "PATCH", body: { verified: nextVerified } }
      );
      setBusy(false);
      setTarget(null);
      setConfirming(false);
      router.refresh();
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof AdminApiError
          ? e.message
          : "검증 상태 변경에 실패했습니다. 다시 시도해주세요."
      );
    }
  }

  // 다음 동작 = 현재 미검증이면 "검증 승인", 검증됨이면 "검증 해제".
  const nextVerified = target ? !target.verified : true;

  const schema: Schema = {
    head: "자격·서류 검증",
    sub: "전 협회 심판 자격증의 검증 상태를 확인하고 승인합니다.",
    cols: COLS,
    rows,
  };

  return (
    <>
      <SchemaList schema={schema} eyebrow="심판 콘솔" onRow={openRow} />

      <Modal
        open={target !== null}
        onClose={close}
        title="자격증 검증"
        sub={target ? `${target.name} · ${target.doc}` : undefined}
      >
        {target && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, color: "var(--ink-mute)" }}>
                현재 상태
              </span>
              <Badge tone={(target.tone as never) || "grey"}>
                {target.badge}
              </Badge>
            </div>

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

            {confirming ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.5 }}>
                  이 자격증을{" "}
                  <b>{nextVerified ? "검증 승인" : "검증 해제"}</b> 처리할까요?
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn
                    variant={nextVerified ? "primary" : "danger"}
                    onClick={() => applyVerify(nextVerified)}
                    disabled={busy}
                  >
                    {busy ? "처리 중..." : "확인"}
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
              <div style={{ display: "flex", gap: 10 }}>
                <Btn
                  variant={nextVerified ? "primary" : "danger"}
                  icon={nextVerified ? "badge-check" : "x"}
                  onClick={() => {
                    setConfirming(true);
                    setError(null);
                  }}
                >
                  {nextVerified ? "검증 승인" : "검증 해제"}
                </Btn>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
