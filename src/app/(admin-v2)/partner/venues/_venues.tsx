"use client";

// ============================================================
// partner/venues/_venues.tsx — 내 시설 + 대관 편집 (클라). 정본 partner-pages SchemaList(PT_VENUES) 1:1.
//   서버에서 court_infos(owner 스코프) 실 매핑된 rows 를 받아 SchemaList 렌더.
//   - 행 클릭 → 대관 편집 Modal(레거시 partner-admin/venue 폼 로직 포팅).
//   - ⚠ "시설 등록"(addLabel) 생략 — 파트너 자가 등록 불가(코트 등록=운영자). 정직.
//   - ★편집 = PATCH /api/web/partner/venue { court_info_id, rental_available, rental_url, fee, contact_phone, description }.
//     · mutation = adminFetch(camel→snake 자동변환) → 성공 시 router.refresh().
//     · 영업시간(operating_hours)은 운영자 관리 영역 → 편집 폼에선 읽기전용 표시(레거시 동일).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import {
  SchemaList,
  Modal,
  Btn,
  type Schema,
  type SchemaCol,
  type SchemaRow,
} from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// 정본 PT_VENUES cols 1:1
const COLS: SchemaCol[] = [
  { key: "court", label: "시설", w: "minmax(0,2fr)", type: "avatar" },
  { key: "type", label: "유형", w: "96px", align: "center", type: "badge" },
  { key: "hours", label: "운영 시간", w: "minmax(0,1.1fr)", type: "muted" },
  { key: "bookings", label: "월 예약", w: "84px", align: "center", type: "mono" },
  { key: "rate", label: "가동률", w: "84px", align: "center", type: "mono" },
  { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

export type PtVenueRow = SchemaRow & {
  hours: string;
  bookings: string;
  rate: string;
  // 편집 폼 raw 필드(camelCase) — 서버 page.tsx 에서 snake → camel 단일 매핑.
  // (court_infos 에 contact_phone 컬럼 부재 → 연락처 편집 제외)
  rentalAvailable: boolean;
  rentalUrl: string;
  fee: number | null;
  description: string;
};

// 편집 폼 상태(입력 친화 — fee/available 은 문자열 보관 후 전송 시 변환)
type VenueForm = {
  rentalAvailable: string; // "true" | "false"
  rentalUrl: string;
  fee: string;
  description: string;
};

export function VenuesList({ rows }: { rows: PtVenueRow[] }) {
  const router = useRouter();

  const [target, setTarget] = React.useState<PtVenueRow | null>(null);
  const [form, setForm] = React.useState<VenueForm>({
    rentalAvailable: "true",
    rentalUrl: "",
    fee: "",
    description: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 행 클릭 → 해당 시설 값으로 폼 초기화 후 모달 오픈.
  function openRow(r: SchemaRow) {
    const v = r as PtVenueRow;
    setTarget(v);
    setForm({
      rentalAvailable: String(v.rentalAvailable),
      rentalUrl: v.rentalUrl,
      fee: v.fee != null ? String(v.fee) : "",
      description: v.description,
    });
    setError(null);
  }
  function close() {
    if (busy) return;
    setTarget(null);
    setError(null);
  }
  function setField<K extends keyof VenueForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // 저장 — adminFetch PATCH. courtInfoId → court_info_id 자동 변환.
  async function handleSave() {
    if (!target || busy) return;
    // 대관 비용 정수화(빈값/유효하지 않으면 null) — 서버 BigInt 변환 방어
    const feeNum = Number(form.fee);
    const feeInt =
      form.fee.trim() && Number.isFinite(feeNum) ? Math.trunc(feeNum) : null;
    setBusy(true);
    setError(null);
    try {
      await adminFetch("/api/web/partner/venue", {
        method: "PATCH",
        body: {
          courtInfoId: target.id, // 어떤 코트를 수정할지 지정(필수)
          rentalAvailable: form.rentalAvailable === "true",
          rentalUrl: form.rentalUrl || null,
          // 정수만 전송 — 서버 BigInt(fee) 가 소수/NaN 에서 throw 하므로 trunc + 유효성 가드
          fee: feeInt,
          description: form.description || null,
        },
      });
      setBusy(false);
      setTarget(null);
      router.refresh(); // 서버 재조회(수정값 반영)
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof AdminApiError
          ? e.message
          : "대관 정보 저장에 실패했습니다. 다시 시도해주세요."
      );
    }
  }

  const schema: Schema = {
    head: "내 시설",
    sub: "등록한 코트·시설의 운영 상태를 확인하고 대관 정보를 수정합니다.",
    cols: COLS,
    rows,
  };

  return (
    <>
      {/* onRow → 읽기 드로어 대신 편집 Modal 진입 */}
      <SchemaList schema={schema} eyebrow="협력업체 콘솔" onRow={openRow} />

      <Modal
        open={target !== null}
        onClose={close}
        title="대관 정보 수정"
        sub={target ? `${target.name}${target.sub ? " · " + target.sub : ""}` : undefined}
        foot={
          <>
            <Btn variant="secondary" onClick={close} disabled={busy}>
              취소
            </Btn>
            <Btn icon="check" onClick={handleSave} disabled={busy}>
              {busy ? "저장 중..." : "저장"}
            </Btn>
          </>
        }
      >
        {target && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            <div className="ts-field">
              <label className="ts-field__label">대관 가능 여부</label>
              <select
                className="ts-select"
                value={form.rentalAvailable}
                onChange={(e) => setField("rentalAvailable", e.target.value)}
              >
                <option value="true">가능</option>
                <option value="false">불가</option>
              </select>
            </div>

            <div className="ts-field">
              <label className="ts-field__label">대관 신청 URL</label>
              <input
                type="url"
                className="ts-input"
                value={form.rentalUrl}
                onChange={(e) => setField("rentalUrl", e.target.value)}
                placeholder="https://booking.example.com"
              />
            </div>

            <div className="ts-field">
              <label className="ts-field__label">대관 비용 (원)</label>
              <input
                type="number"
                className="ts-input"
                value={form.fee}
                onChange={(e) => setField("fee", e.target.value)}
                placeholder="시간당 대관료"
              />
            </div>

            <div className="ts-field">
              <label className="ts-field__label">시설 소개</label>
              <textarea
                className="ts-input ts-textarea"
                style={{ resize: "none" }}
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="시설 안내 문구"
              />
            </div>

            {/* 영업 시간 — 운영자 관리 영역(읽기전용 표시, 레거시 동일) */}
            <div className="ts-field" style={{ marginBottom: 0 }}>
              <label className="ts-field__label">운영 시간 (읽기전용)</label>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--ink-mute)",
                  padding: "11px 14px",
                  background: "var(--grey-50, #f7f8fa)",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                }}
              >
                {target.hours || "등록된 영업시간 정보가 없습니다."}
              </div>
              <div className="ts-field__hint">
                운영 시간은 코트 운영자가 관리합니다.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
