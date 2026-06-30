"use client";

// ============================================================
// referee-console/bulk-verify/_bulk-verify.tsx — Excel 일괄 자격검증(클라)
//   레거시 (referee)/referee/admin/bulk-verify 박제 → admin-v2 디자인.
//   ★로직(raw fetch·FormData)은 레거시 verbatim — 디자인만 교체.
//     · POST /api/web/admin/bulk-verify/preview  (미리보기·FormData)
//     · POST /api/web/admin/bulk-verify/confirm  (검증 확정·JSON certificate_ids)
//   ★apiSuccess 는 래핑 0(데이터 직접 반환·snake_case)이라 res.json() 직접 접근 그대로 유효 — 레거시 보존.
//   ★adminFetch 미사용(FormData 비호환) → raw fetch + credentials:"include".
//   ★백엔드 0변경. admin-v2 키트(PageHead/Btn/Badge/Icon)·var(--*)/color-mix 토큰만 — 하드코딩 색 0.
// ============================================================

import React from "react";
import { PageHead, Btn, Badge, Icon, type BadgeTone } from "@/components/admin-v2";

// ── 타입 정의 (레거시 박제 — API 응답 snake_case) ──
type VerifyStatus = "matched" | "partial" | "no_match" | "already_verified";

type PreviewRow = {
  row_number: number;
  name: string;
  birth_date: string;
  phone: string;
  cert_type: string;
  cert_grade: string;
  status: VerifyStatus;
  message: string;
  certificate_id: number | null;
};

type PreviewSummary = {
  total: number;
  matched: number;
  partial: number;
  no_match: number;
  already_verified: number;
};

type PreviewResponse = {
  rows: PreviewRow[];
  summary: PreviewSummary;
};

type ConfirmResponse = {
  verified: number;
  skipped: number;
  errors: { id: number; reason: string }[];
  total_requested: number;
};

// 상태별 admin-v2 Badge tone + 라벨 (레거시 색상 → 토큰 tone 매핑).
const ROW_STATUS_BADGE: Record<VerifyStatus, { tone: BadgeTone; label: string }> = {
  matched: { tone: "ok", label: "매칭" },
  partial: { tone: "warn", label: "부분" },
  no_match: { tone: "danger", label: "불일치" },
  already_verified: { tone: "grey", label: "검증됨" },
};

// 에러 메시지 박스 — documents/_documents msgStyle("error")와 동일 컨벤션.
const errorBoxStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--danger)",
  background: "var(--danger-weak, color-mix(in srgb, var(--danger) 8%, transparent))",
  border: "1px solid var(--danger)",
  borderRadius: 10,
  padding: "10px 12px",
  fontFamily: "var(--ff)",
};

export function RefereeBulkVerify() {
  // 단계: idle → previewing → previewed → confirming → confirmed (레거시 동일).
  const [step, setStep] = React.useState<
    "idle" | "previewing" | "previewed" | "confirming" | "confirmed"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<PreviewResponse | null>(null);
  const [confirmResult, setConfirmResult] = React.useState<ConfirmResponse | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── 1단계: 파일 업로드 → 미리보기 (레거시 verbatim) ──
  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setErrorMsg("파일을 선택해주세요.");
      return;
    }
    // 확장자 검증.
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setErrorMsg("xlsx 파일만 업로드 가능합니다.");
      return;
    }

    setStep("previewing");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/web/admin/bulk-verify/preview", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        // apiSuccess는 데이터 직접 반환(래핑 0) — { rows, summary } 직접 접근(레거시 보존).
        const data = (await res.json()) as PreviewResponse;
        setPreview(data);
        setStep("previewed");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "파일 처리에 실패했습니다.");
        setStep("idle");
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStep("idle");
    }
  };

  // ── 2단계: 검증 확정 (레거시 verbatim) ──
  const handleConfirm = async () => {
    if (!preview) return;

    // matched인 행의 certificate_id만 수집.
    const certIds = preview.rows
      .filter((r) => r.status === "matched" && r.certificate_id !== null)
      .map((r) => r.certificate_id as number);

    if (certIds.length === 0) {
      setErrorMsg("검증할 대상이 없습니다.");
      return;
    }

    setStep("confirming");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/web/admin/bulk-verify/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificate_ids: certIds }),
      });

      if (res.ok) {
        const data = (await res.json()) as ConfirmResponse;
        setConfirmResult(data);
        setStep("confirmed");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "일괄 검증에 실패했습니다.");
        setStep("previewed");
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStep("previewed");
    }
  };

  // ── 처음으로 리셋 (레거시 verbatim) ──
  const handleReset = () => {
    setStep("idle");
    setPreview(null);
    setConfirmResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <PageHead
        eyebrow="심판 콘솔"
        title="Excel 일괄 검증"
        sub="Excel 파일로 심판 자격증을 한 번에 검증합니다."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {/* 에러 배너 */}
        {errorMsg && <div style={errorBoxStyle}>{errorMsg}</div>}

        {/* 1단계: 파일 업로드 */}
        {(step === "idle" || step === "previewing") && (
          <section className="ad-panel" style={{ padding: "18px 20px" }}>
            <div className="ad-panel__title" style={{ marginBottom: 12 }}>
              1단계 · 파일 업로드
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 12.5,
                color: "var(--ink-soft)",
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>필수 헤더</strong>: 이름, 생년월일,
                전화번호, 자격증종류, 자격등급
              </p>
              <p style={{ margin: 0, color: "var(--ink-mute)" }}>
                xlsx 파일, 최대 5MB, 500행 이내
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
                marginTop: 16,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                style={{ fontSize: 13, color: "var(--ink)", fontFamily: "var(--ff)" }}
              />
              <Btn
                variant="primary"
                size="sm"
                icon="file-up"
                disabled={step === "previewing"}
                onClick={handleFileUpload}
              >
                {step === "previewing" ? "분석 중..." : "미리보기"}
              </Btn>
            </div>
          </section>
        )}

        {/* 2단계: 미리보기 결과 */}
        {(step === "previewed" || step === "confirming") && preview && (
          <>
            {/* 요약 통계 */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 12,
              }}
            >
              <StatCard label="총 행" value={preview.summary.total} />
              <StatCard label="매칭" value={preview.summary.matched} color="var(--ok)" />
              <StatCard label="부분 매칭" value={preview.summary.partial} color="var(--warn)" />
              <StatCard label="불일치" value={preview.summary.no_match} color="var(--danger)" />
              <StatCard
                label="이미 검증됨"
                value={preview.summary.already_verified}
                color="var(--ink-mute)"
              />
            </section>

            {/* 상세 테이블 */}
            <div className="ad-panel" style={{ padding: 0, overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  fontFamily: "var(--ff)",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["행", "이름", "생년월일", "자격증", "상태", "메시지"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--ink-mute)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.row_number} style={{ borderBottom: "1px solid var(--border)" }}>
                      <Td color="var(--ink-mute)">{row.row_number}</Td>
                      <Td color="var(--ink)">{row.name}</Td>
                      <Td color="var(--ink-soft)">{row.birth_date}</Td>
                      <Td color="var(--ink-soft)">
                        {row.cert_type} {row.cert_grade}
                      </Td>
                      <td style={{ padding: "8px 12px" }}>
                        <Badge tone={ROW_STATUS_BADGE[row.status].tone}>
                          {ROW_STATUS_BADGE[row.status].label}
                        </Badge>
                      </td>
                      <Td color="var(--ink-mute)">{row.message}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 확정/취소 버튼 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Btn
                variant="primary"
                icon="circle-check"
                disabled={step === "confirming" || preview.summary.matched === 0}
                onClick={handleConfirm}
              >
                {step === "confirming"
                  ? "처리 중..."
                  : `${preview.summary.matched}건 검증 확정`}
              </Btn>
              <Btn variant="secondary" disabled={step === "confirming"} onClick={handleReset}>
                취소
              </Btn>
            </div>
          </>
        )}

        {/* 3단계: 완료 */}
        {step === "confirmed" && confirmResult && (
          <section className="ad-panel" style={{ padding: "28px 20px", textAlign: "center" }}>
            <span style={{ display: "inline-flex", justifyContent: "center" }}>
              <Icon name="circle-check-big" size={48} color="var(--ok)" />
            </span>
            <h2 style={{ marginTop: 14, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
              일괄 검증 완료
            </h2>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 14,
                color: "var(--ink-soft)",
              }}
            >
              <p style={{ margin: 0 }}>검증 완료: {confirmResult.verified}건</p>
              <p style={{ margin: 0 }}>건너뜀 (이미 검증됨): {confirmResult.skipped}건</p>
              {confirmResult.errors.length > 0 && (
                <p style={{ margin: 0, color: "var(--danger)" }}>
                  오류: {confirmResult.errors.length}건
                </p>
              )}
            </div>
            <div style={{ marginTop: 20 }}>
              <Btn variant="primary" icon="rotate-ccw" onClick={handleReset}>
                다시 업로드
              </Btn>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── 하위 컴포넌트 ──

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="ad-panel" style={{ padding: "14px 12px", textAlign: "center" }}>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--ink-mute)",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 22,
          fontWeight: 800,
          color: color ?? "var(--ink)",
          fontFamily: "var(--ff-mono)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Td({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <td style={{ padding: "8px 12px", color: color ?? "var(--ink)", whiteSpace: "nowrap" }}>
      {children}
    </td>
  );
}
