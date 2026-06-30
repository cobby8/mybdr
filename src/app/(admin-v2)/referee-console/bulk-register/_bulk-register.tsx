"use client";

// ============================================================
// referee-console/bulk-register/_bulk-register.tsx — Excel 일괄 사전 등록(클라)
//   레거시 (referee)/referee/admin/bulk-register 박제 → admin-v2 디자인.
//   ★로직(raw fetch·FormData·xlsx 템플릿)은 레거시 verbatim — 디자인만 교체.
//     · POST /api/web/referee-admin/bulk-register/preview  (미리보기·FormData)
//     · POST /api/web/referee-admin/bulk-register/confirm  (등록 확정·JSON)
//   ★apiSuccess 는 래핑 0(데이터 직접 반환·snake_case)이라 (json.data ?? json) 그대로 유효 — 레거시 보존.
//   ★adminFetch 미사용(FormData 비호환) → raw fetch + credentials:"include".
//   ★백엔드 0변경. admin-v2 키트(PageHead/Btn/Badge/Icon)·var(--*)/color-mix 토큰만 — 하드코딩 색 0.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import writeExcelFile from "write-excel-file/browser";
import { PageHead, Btn, Badge, Icon, type BadgeTone } from "@/components/admin-v2";
import {
  formatOfficialLevel,
  OFFICIAL_ROLE_LABELS,
  type OfficialRoleType,
} from "@/lib/referee/official-roles";

// ── 타입 정의 (레거시 박제 — API 응답 snake_case) ──
type MatchStatus = "matched" | "unmatched" | "duplicated" | "invalid";

type PreviewRow = {
  row_number: number;
  name: string;
  phone: string;
  birth_date: string | null;
  resident_id_last4: string | null;
  license_number: string | null;
  level: string | null;
  level_raw: string | null;
  role_type: OfficialRoleType;
  match_status: MatchStatus;
  match_user_id: string | null;
  match_user_name: string | null;
  error: string | null;
  resident_id: string | null;
};

type PreviewResponse = {
  total: number;
  matched: number;
  unmatched: number;
  duplicated: number;
  invalid: number;
  rows: PreviewRow[];
};

type ConfirmResponse = {
  created: number;
  matched: number;
  unmatched: number;
  skipped: { duplicated: number; invalid: number };
  match_errors: Array<{ referee_id: string; reason: string }>;
};

// 매칭 상태별 admin-v2 Badge tone + 라벨 (레거시 색상 → 토큰 tone 매핑).
const ROW_STATUS_BADGE: Record<MatchStatus, { tone: BadgeTone; label: string }> = {
  matched: { tone: "ok", label: "매칭" },
  unmatched: { tone: "primary", label: "미매칭" },
  duplicated: { tone: "grey", label: "중복" },
  invalid: { tone: "danger", label: "오류" },
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

export function RefereeBulkRegister() {
  const router = useRouter();

  // 단계: idle → previewing → previewed → confirming → confirmed (레거시 동일).
  const [step, setStep] = React.useState<
    "idle" | "previewing" | "previewed" | "confirming" | "confirmed"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<PreviewResponse | null>(null);
  const [confirmResult, setConfirmResult] = React.useState<ConfirmResponse | null>(null);
  const [roleType, setRoleType] = React.useState<OfficialRoleType>("referee");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── 템플릿 다운로드 (레거시 verbatim — 클라에서 xlsx 생성) ──
  const handleTemplateDownload = async () => {
    const template = [
      ["이름", "전화번호", "생년월일", "주민등록번호", "자격증번호", "급수", "구분"],
      ["홍길동", "010-1234-5678", "1990-01-01", "900101-1234567", "KBA-001", "2급", "심판"],
      ["김경기", "010-2222-3333", "1985-06-15", "", "", "1급", "경기원"],
    ];
    try {
      await writeExcelFile(template, { sheet: "심판명단" }).toFile(
        "referee-bulk-template.xlsx"
      );
    } catch {
      setErrorMsg("템플릿 파일 생성에 실패했습니다.");
    }
  };

  // ── 1단계: 파일 업로드 → 미리보기 (레거시 verbatim) ──
  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setErrorMsg("파일을 선택해주세요.");
      return;
    }
    // 확장자 검증 — xlsx만 허용.
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setErrorMsg("xlsx 파일만 업로드 가능합니다.");
      return;
    }

    setStep("previewing");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("role_type", roleType);

      const res = await fetch("/api/web/referee-admin/bulk-register/preview", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        // apiSuccess는 데이터 직접 반환(래핑 0) — (json.data ?? json) 레거시 보존.
        const data = (json.data ?? json) as PreviewResponse;
        setPreview(data);
        setStep("previewed");
      } else {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: { message?: string } | string }).error ??
          "파일 처리에 실패했습니다.";
        setErrorMsg(
          typeof msg === "string" ? msg : msg?.message ?? "파일 처리에 실패했습니다."
        );
        setStep("idle");
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStep("idle");
    }
  };

  // ── 2단계: 등록 확정 (레거시 verbatim) ──
  const handleConfirm = async () => {
    if (!preview) return;

    // matched + unmatched만 보냄 (duplicated/invalid는 서버에서도 스킵).
    const targetRows = preview.rows.filter(
      (r) => r.match_status === "matched" || r.match_status === "unmatched"
    );
    if (targetRows.length === 0) {
      setErrorMsg("등록할 대상이 없습니다.");
      return;
    }

    setStep("confirming");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/web/referee-admin/bulk-register/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: targetRows }),
      });

      if (res.ok) {
        const json = await res.json();
        const data = (json.data ?? json) as ConfirmResponse;
        setConfirmResult(data);
        setStep("confirmed");
      } else {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: { message?: string } | string }).error ??
          "등록에 실패했습니다.";
        setErrorMsg(
          typeof msg === "string" ? msg : msg?.message ?? "등록에 실패했습니다."
        );
        setStep("previewed");
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStep("previewed");
    }
  };

  // ── 리셋 (레거시 verbatim) ──
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
        title="Excel 일괄 사전 등록"
        sub="심판/경기원 명단을 Excel 파일로 한 번에 등록하고, 기존 가입자와 자동 매칭합니다."
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
                <strong style={{ color: "var(--ink)" }}>필수 헤더</strong>: 이름, 전화번호
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>선택 헤더</strong>: 생년월일, 주민등록번호,
                자격증번호, 급수, 구분
              </p>
              <p style={{ margin: 0, color: "var(--ink-mute)" }}>
                xlsx 파일, 최대 5MB, 500행 이내
              </p>
              <p style={{ margin: 0, color: "var(--ink-mute)" }}>
                &quot;구분&quot; 컬럼이 비어있으면 아래에서 선택한 기본값으로 등록됩니다.
              </p>
            </div>

            {/* 기본 역할 선택 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)" }}>
                기본 역할
              </span>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  cursor: "pointer",
                  color: "var(--ink)",
                }}
              >
                <input
                  type="radio"
                  name="role_type"
                  value="referee"
                  checked={roleType === "referee"}
                  onChange={() => setRoleType("referee")}
                />
                심판
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  cursor: "pointer",
                  color: "var(--ink)",
                }}
              >
                <input
                  type="radio"
                  name="role_type"
                  value="game_official"
                  checked={roleType === "game_official"}
                  onChange={() => setRoleType("game_official")}
                />
                경기원
              </label>
            </div>

            {/* 파일 input + 버튼 */}
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
              <Btn
                variant="secondary"
                size="sm"
                icon="download"
                onClick={handleTemplateDownload}
              >
                템플릿 다운로드
              </Btn>
            </div>
          </section>
        )}

        {/* 2단계: 미리보기 결과 */}
        {(step === "previewed" || step === "confirming") && preview && (
          <>
            {/* 요약 카드 */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 12,
              }}
            >
              <StatCard label="총 행" value={preview.total} />
              <StatCard label="자동 매칭" value={preview.matched} color="var(--ok)" />
              <StatCard label="미매칭 (신규)" value={preview.unmatched} color="var(--primary)" />
              <StatCard label="중복" value={preview.duplicated} color="var(--ink-mute)" />
              <StatCard label="오류" value={preview.invalid} color="var(--danger)" />
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
                    {["행", "이름", "전화", "생년", "급수", "역할", "상태", "매칭된 유저", "비고"].map(
                      (h) => (
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
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.row_number} style={{ borderBottom: "1px solid var(--border)" }}>
                      <Td color="var(--ink-mute)">{row.row_number}</Td>
                      <Td color="var(--ink)">{row.name || "-"}</Td>
                      <Td color="var(--ink-soft)">{row.phone || "-"}</Td>
                      <Td color="var(--ink-soft)">{row.birth_date ?? "-"}</Td>
                      <Td color="var(--ink-soft)">
                        {row.level ? formatOfficialLevel(row.level) : row.level_raw ?? "-"}
                      </Td>
                      <Td color="var(--ink-soft)">
                        {OFFICIAL_ROLE_LABELS[row.role_type] ?? row.role_type}
                      </Td>
                      <td style={{ padding: "8px 12px" }}>
                        <Badge tone={ROW_STATUS_BADGE[row.match_status].tone}>
                          {ROW_STATUS_BADGE[row.match_status].label}
                        </Badge>
                      </td>
                      <Td color="var(--ink-soft)">{row.match_user_name ?? "-"}</Td>
                      <Td color="var(--ink-mute)">{row.error ?? "-"}</Td>
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
                disabled={step === "confirming" || preview.matched + preview.unmatched === 0}
                onClick={handleConfirm}
              >
                {step === "confirming"
                  ? "등록 중..."
                  : `${preview.matched + preview.unmatched}건 등록 확정`}
              </Btn>
              <Btn variant="secondary" disabled={step === "confirming"} onClick={handleReset}>
                취소
              </Btn>
            </div>
          </>
        )}

        {/* 3단계: 완료 */}
        {step === "confirmed" && confirmResult && (
          <section
            className="ad-panel"
            style={{ padding: "28px 20px", textAlign: "center" }}
          >
            <span style={{ display: "inline-flex", justifyContent: "center" }}>
              <Icon name="circle-check-big" size={48} color="var(--ok)" />
            </span>
            <h2 style={{ marginTop: 14, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
              일괄 등록 완료
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
              <p style={{ margin: 0 }}>등록 완료: {confirmResult.created}건</p>
              <p style={{ margin: 0 }}>자동 매칭: {confirmResult.matched}건</p>
              <p style={{ margin: 0 }}>매칭 대기: {confirmResult.unmatched}건</p>
              {(confirmResult.skipped.duplicated > 0 || confirmResult.skipped.invalid > 0) && (
                <p style={{ margin: 0, color: "var(--ink-mute)" }}>
                  스킵 — 중복 {confirmResult.skipped.duplicated}건 / 오류{" "}
                  {confirmResult.skipped.invalid}건
                </p>
              )}
              {confirmResult.match_errors.length > 0 && (
                <p style={{ margin: 0, color: "var(--danger)" }}>
                  매칭 오류: {confirmResult.match_errors.length}건 (등록은 완료)
                </p>
              )}
            </div>
            <div
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Btn
                variant="primary"
                icon="list"
                onClick={() => router.push("/referee-console/members")}
              >
                심판 목록 보기
              </Btn>
              <Btn variant="secondary" icon="rotate-ccw" onClick={handleReset}>
                다시 등록
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
