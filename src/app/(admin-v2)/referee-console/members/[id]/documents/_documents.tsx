"use client";

// ============================================================
// referee-console/members/[id]/documents/_documents.tsx — 정산서류 관리(클라)
//   레거시 (referee)/referee/admin/members/[id]/documents 박제 → admin-v2 디자인.
//   ★로직(raw fetch·FormData·blob)은 레거시 verbatim — 디자인만 교체.
//     · GET   /api/web/referee-admin/documents?referee_id=  (목록)
//     · POST  /api/web/referee-admin/documents               (대리 업로드·FormData)
//     · POST  /api/web/referee-admin/documents/[id]/ocr      (OCR 실행)
//     · POST  /api/web/referee-admin/documents/[id]/ocr/confirm (OCR 확정)
//     · POST  /api/web/referee-admin/documents/print         (PDF·blob 다운로드)
//     · GET   /api/web/referee-admin/settings                (사무국장 여부 판정)
//   ★apiSuccess 는 래핑 0(데이터 직접 반환)이라 json 직접 접근 그대로 유효 — 레거시 보존.
//   ★adminFetch 미사용(FormData/blob 비호환) → raw fetch + credentials:"include".
//   ★백엔드 0변경. admin-v2 키트(PageHead/Btn/Badge/Icon)·var(--*) 토큰만 — 하드코딩 색 0.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { PageHead, Btn, Badge, Icon } from "@/components/admin-v2";

// ── 타입 정의 (레거시 박제 — API 응답 snake_case) ──
type DocumentMeta = {
  id: string;
  doc_type: string;
  file_size: number;
  file_type: string;
  ocr_status: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};

type OcrExtracted = Record<string, string | undefined>;

// ── 서류 종류별 정보 (레거시 박제 — 아이콘은 admin-v2 Icon=lucide 동일) ──
const DOC_CONFIGS = [
  {
    type: "certificate",
    icon: "award",
    label: "자격증 사본",
    description: "심판/경기원 자격증의 사본",
  },
  {
    type: "id_card",
    icon: "id-card",
    label: "신분증 사본",
    description: "주민등록증 또는 운전면허증 앞면",
  },
  {
    type: "bankbook",
    icon: "landmark",
    label: "통장 사본",
    description: "정산금 입금을 위한 통장 앞면",
  },
] as const;

// ── 은행 목록 (레거시 박제) ──
const BANK_OPTIONS = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "NH농협은행",
  "IBK기업은행",
  "SC제일은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "Sh수협은행",
  "광주은행",
  "전북은행",
  "경남은행",
  "대구은행",
  "부산은행",
  "제주은행",
  "KDB산업은행",
  "우체국",
  "새마을금고",
  "신협",
] as const;

// ── 공통 입력 스타일 (var 토큰만 — _new-form inputStyle 컨벤션 동일) ──
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--ink)",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "var(--ff)",
  outline: "none",
};

// 메시지 박스(성공/에러) 인라인 스타일 — _detail certError 와 동일 컨벤션(color-mix weak bg).
function msgStyle(type: "success" | "error"): React.CSSProperties {
  const base = type === "success" ? "var(--ok)" : "var(--danger)";
  const weak = type === "success" ? "var(--ok-weak)" : "var(--danger-weak)";
  return {
    fontSize: 12.5,
    color: base,
    background: weak,
    border: `1px solid ${base}`,
    borderRadius: 8,
    padding: "8px 12px",
    fontFamily: "var(--ff)",
  };
}

export function RefereeDocuments({ refereeId }: { refereeId: string }) {
  const router = useRouter();

  const [documents, setDocuments] = React.useState<DocumentMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // PDF 출력 관련 상태.
  const [pdfGenerating, setPdfGenerating] = React.useState(false);
  const [pdfMessage, setPdfMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  // 현재 관리자의 역할 (사무국장 여부 판단용).
  const [adminRole, setAdminRole] = React.useState<string | null>(null);

  // ── 서류 목록 조회 (레거시 verbatim) ──
  const fetchDocuments = React.useCallback(async () => {
    try {
      const res = await fetch(
        `/api/web/referee-admin/documents?referee_id=${refereeId}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const json = await res.json();
        setDocuments(json);
        setErrorMsg(null);
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(
          (json as { error?: string }).error ?? "서류 목록을 불러올 수 없습니다."
        );
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [refereeId]);

  React.useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  // 관리자 역할 조회 (사무국장 여부 판단) — settings API { items, current_user_id } (레거시 verbatim).
  React.useEffect(() => {
    async function fetchAdminRole() {
      try {
        const res = await fetch("/api/web/referee-admin/settings", {
          credentials: "include",
        });
        if (res.ok) {
          const json = (await res.json()) as {
            items?: { user_id: number | string; role: string }[];
            current_user_id?: number | string;
          };
          if (json.items && json.current_user_id) {
            const me = json.items.find(
              (item) => String(item.user_id) === String(json.current_user_id)
            );
            setAdminRole(me?.role ?? null);
          }
        }
      } catch {
        // 역할 조회 실패 시 버튼 미표시 (안전하게).
      }
    }
    void fetchAdminRole();
  }, []);

  // 3종 서류 모두 등록 여부 확인.
  const allDocsRegistered = ["certificate", "id_card", "bankbook"].every(
    (type) => documents.some((d) => d.doc_type === type)
  );

  // 사무국장 여부 (document_print 권한).
  const canPrint = adminRole === "secretary_general";

  // ── PDF 다운로드 핸들러 (레거시 verbatim — blob 처리) ──
  const handlePdfDownload = async () => {
    setPdfGenerating(true);
    setPdfMessage(null);

    try {
      const res = await fetch("/api/web/referee-admin/documents/print", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referee_id: refereeId }),
      });

      if (res.ok) {
        // PDF blob 다운로드 트리거.
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Content-Disposition에서 파일명 추출 또는 기본값.
        const disposition = res.headers.get("Content-Disposition");
        const filenameMatch = disposition?.match(/filename="?(.+?)"?$/);
        a.download = filenameMatch?.[1] ?? `settlement-${refereeId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setPdfMessage({ type: "success", text: "PDF 다운로드가 시작되었습니다." });
      } else {
        const json = await res.json().catch(() => ({}));
        setPdfMessage({
          type: "error",
          text: (json as { error?: string }).error ?? "PDF 생성에 실패했습니다.",
        });
      }
    } catch {
      setPdfMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setPdfGenerating(false);
    }
  };

  const getDoc = (docType: string) =>
    documents.find((d) => d.doc_type === docType);

  return (
    <div>
      {/* 뒤로가기 — _detail 동일 패턴 */}
      <button
        type="button"
        onClick={() => router.push(`/referee-console/members/${refereeId}`)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink-mute)",
          fontFamily: "var(--ff)",
        }}
      >
        <Icon name="arrow-left" size={16} />
        심판 상세로
      </button>

      <PageHead
        eyebrow="심판 콘솔"
        title="정산 서류 관리"
        sub="심판의 정산 서류를 대리 업로드하고 OCR로 정보를 추출·확정합니다."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {/* 보안 안내 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 14px",
            background: "var(--primary-weak)",
            border: "1px solid var(--primary)",
            borderRadius: 10,
          }}
        >
          <Icon name="shield" size={18} color="var(--primary)" style={{ marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0, fontFamily: "var(--ff)" }}>
            서류는 암호화 저장됩니다. 이미지는 화면에 표시되지 않습니다.
          </p>
        </div>

        {/* 정산 서류 PDF 출력 (사무국장만 표시) */}
        {canPrint && !loading && (
          <div
            className="ad-panel"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <Icon name="printer" size={22} color="var(--ink-mute)" />
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                  정산 서류 PDF 출력
                </h3>
                <p style={{ fontSize: 12.5, color: "var(--ink-mute)", margin: "2px 0 0" }}>
                  {allDocsRegistered
                    ? "3종 서류가 모두 등록되어 있습니다. PDF로 출력할 수 있습니다."
                    : "서류 3종이 모두 등록되어야 출력할 수 있습니다."}
                </p>
              </div>
            </div>

            <Btn
              variant="primary"
              size="sm"
              icon="printer"
              disabled={!allDocsRegistered || pdfGenerating}
              onClick={handlePdfDownload}
            >
              {pdfGenerating ? "생성 중..." : "PDF 출력"}
            </Btn>
          </div>
        )}

        {/* PDF 출력 메시지 */}
        {pdfMessage && <div style={msgStyle(pdfMessage.type)}>{pdfMessage.text}</div>}

        {/* 에러 메시지 */}
        {errorMsg && <div style={msgStyle("error")}>{errorMsg}</div>}

        {/* 로딩 / 서류 카드 목록 */}
        {loading ? (
          <p style={{ padding: 32, textAlign: "center", fontSize: 13, color: "var(--ink-mute)" }}>
            불러오는 중...
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DOC_CONFIGS.map((config) => (
              <AdminDocumentCard
                key={config.type}
                config={config}
                doc={getDoc(config.type)}
                refereeId={refereeId}
                onRefresh={fetchDocuments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 관리자 서류 카드 컴포넌트 ──

function AdminDocumentCard({
  config,
  doc,
  refereeId,
  onRefresh,
}: {
  config: (typeof DOC_CONFIGS)[number];
  doc: DocumentMeta | undefined;
  refereeId: string;
  onRefresh: () => Promise<void>;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // OCR 관련 상태.
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const [ocrStatus, setOcrStatus] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [confirming, setConfirming] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

  // ── 대리 업로드 핸들러 (레거시 verbatim — FormData) ──
  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);
    setShowForm(false);
    setFormData({});
    setOcrStatus(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", config.type);
    fd.append("referee_id", refereeId);

    try {
      const res = await fetch("/api/web/referee-admin/documents", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (res.ok) {
        setMessage({ type: "success", text: "대리 업로드 완료!" });
        await onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: (json as { error?: string }).error ?? "업로드에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  };

  // ── OCR 실행 핸들러 (관리자용 API·레거시 verbatim) ──
  const handleOcr = async () => {
    if (!doc) return;
    setOcrLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/web/referee-admin/documents/${doc.id}/ocr`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const json = (await res.json()) as {
        ocr_status?: string;
        extracted?: OcrExtracted;
        message?: string;
      };

      if (res.ok) {
        setOcrStatus(json.ocr_status || null);
        const initial: Record<string, string> = {};
        if (json.extracted) {
          for (const [key, value] of Object.entries(json.extracted)) {
            if (value) initial[key] = value;
          }
        }
        setFormData(initial);
        setShowForm(true);

        if (json.ocr_status === "failed" || json.ocr_status === "skipped") {
          setMessage({
            type: "error",
            text: json.message || "자동 추출에 실패했습니다. 직접 입력해주세요.",
          });
        }
      } else {
        setMessage({
          type: "error",
          text: (json as { error?: string }).error ?? "OCR 처리에 실패했습니다.",
        });
        setShowForm(true);
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
      setShowForm(true);
    } finally {
      setOcrLoading(false);
    }
  };

  // ── OCR 결과 확정 (관리자용 confirm API·레거시 verbatim) ──
  const handleConfirm = async () => {
    if (!doc) return;
    setConfirming(true);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/web/referee-admin/documents/${doc.id}/ocr/confirm`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (res.ok) {
        setMessage({ type: "success", text: "정보가 저장되었습니다!" });
        setShowForm(false);
      } else {
        const json = await res.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: (json as { error?: string }).error ?? "저장에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setConfirming(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleUpload(file);
    }
    e.target.value = "";
  };

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isRegistered = !!doc;

  return (
    <div className="ad-panel" style={{ padding: "18px 20px" }}>
      {/* 카드 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Icon
            name={config.icon}
            size={22}
            color={isRegistered ? "var(--ok)" : "var(--ink-mute)"}
          />
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              {config.label}
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--ink-mute)", margin: "2px 0 0" }}>
              {config.description}
            </p>
          </div>
        </div>

        {/* 상태 뱃지 */}
        <Badge tone={isRegistered ? "ok" : "grey"} icon={isRegistered ? "circle-check" : undefined}>
          {isRegistered ? "등록완료" : "미등록"}
        </Badge>
      </div>

      {/* 등록 정보 */}
      {doc && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            marginTop: 12,
            fontSize: 12,
            color: "var(--ink-soft)",
          }}
        >
          <span>{formatDate(doc.created_at)}</span>
          <span>{formatFileSize(doc.file_size)}</span>
          <span>{doc.file_type}</span>
        </div>
      )}

      {/* 메시지 */}
      {message && (
        <div style={{ ...msgStyle(message.type), marginTop: 12 }}>{message.text}</div>
      )}

      {/* 액션 버튼 */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 16 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {isRegistered ? (
          <>
            {/* 정보 추출 버튼 */}
            <Btn variant="primary" size="sm" icon="scan-text" disabled={ocrLoading} onClick={handleOcr}>
              {ocrLoading ? "추출 중..." : "정보 추출"}
            </Btn>

            {/* 수동 입력 버튼 */}
            {!showForm && (
              <Btn
                variant="secondary"
                size="sm"
                icon="pencil"
                onClick={() => {
                  setShowForm(true);
                  setFormData({});
                }}
              >
                직접 입력
              </Btn>
            )}

            {/* 교체 버튼 */}
            <Btn
              variant="secondary"
              size="sm"
              icon="arrow-left-right"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "업로드 중..." : "교체"}
            </Btn>
          </>
        ) : (
          <Btn
            variant="primary"
            size="sm"
            icon="file-up"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "업로드 중..." : "대리 업로드"}
          </Btn>
        )}
      </div>

      {/* OCR 추출 결과 + 편집 폼 */}
      {showForm && isRegistered && (
        <div
          style={{
            marginTop: 16,
            padding: "14px 16px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon
              name={ocrStatus === "completed" ? "wand-sparkles" : "file-pen"}
              size={16}
              color="var(--ink-mute)"
            />
            <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              {ocrStatus === "completed"
                ? "자동 추출 결과 (확인 후 저장하세요)"
                : "정보를 직접 입력하세요"}
            </p>
          </div>

          {config.type === "certificate" && (
            <CertificateForm data={formData} onChange={updateField} />
          )}
          {config.type === "bankbook" && (
            <BankbookForm data={formData} onChange={updateField} />
          )}
          {config.type === "id_card" && (
            <IdCardForm data={formData} onChange={updateField} />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
            <Btn variant="primary" size="sm" icon="check" disabled={confirming} onClick={handleConfirm}>
              {confirming ? "저장 중..." : "확인 저장"}
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setFormData({});
              }}
            >
              취소
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 서류별 편집 폼 (레거시 박제) ──

function CertificateForm({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
      <FormField
        label="자격증 번호"
        value={data.cert_number || ""}
        onChange={(v) => onChange("cert_number", v)}
        placeholder="KBA-2023-12345"
      />
      <FormSelect
        label="유형"
        value={data.cert_type || ""}
        onChange={(v) => onChange("cert_type", v)}
        options={[
          { value: "referee", label: "심판" },
          { value: "game_official", label: "경기원" },
        ]}
      />
      <FormSelect
        label="등급"
        value={data.cert_grade || ""}
        onChange={(v) => onChange("cert_grade", v)}
        options={[
          { value: "국제", label: "국제" },
          { value: "S급", label: "S급" },
          { value: "A급", label: "A급" },
          { value: "B급", label: "B급" },
          { value: "1급", label: "1급" },
          { value: "2급", label: "2급" },
          { value: "3급", label: "3급" },
        ]}
      />
      <FormField
        label="발급기관"
        value={data.issuer || ""}
        onChange={(v) => onChange("issuer", v)}
        placeholder="대한농구협회"
      />
      <FormField
        label="발급일"
        value={data.issued_date || ""}
        onChange={(v) => onChange("issued_date", v)}
        type="date"
      />
    </div>
  );
}

function BankbookForm({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
      <FormSelect
        label="은행명"
        value={data.bank_name || ""}
        onChange={(v) => onChange("bank_name", v)}
        options={BANK_OPTIONS.map((b) => ({ value: b, label: b }))}
      />
      <FormField
        label="계좌번호"
        value={data.account_number || ""}
        onChange={(v) => onChange("account_number", v)}
        placeholder="000-0000-0000-00"
      />
      <FormField
        label="예금주"
        value={data.account_holder || ""}
        onChange={(v) => onChange("account_holder", v)}
        placeholder="홍길동"
      />
    </div>
  );
}

function IdCardForm({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 12, color: "var(--ink-mute)", margin: 0 }}>
        신분증은 보안상 자동 추출을 사용하지 않습니다. 직접 입력해주세요.
      </p>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <FormField
          label="이름"
          value={data.name || ""}
          onChange={(v) => onChange("name", v)}
          placeholder="홍길동"
        />
      </div>
    </div>
  );
}

// ── 공통 폼 필드 ──

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          marginBottom: 4,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--ink-mute)",
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          marginBottom: 4,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--ink-mute)",
        }}
      >
        {label}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        <option value="">선택하세요</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ── 유틸 함수 (레거시 박제) ──

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
