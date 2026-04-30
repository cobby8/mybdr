"use client";

/* ============================================================
 * IdentityVerifyButton  (Phase 12-5 mock 모드)
 *
 * 왜:
 *  - Portone API 키 발급(12-6) 전이라, JS SDK 위젯 대신 mock 모달로 시뮬레이션.
 *  - UI 동선/API 연동/onVerified 콜백을 12-7 실 통합 전에 검증하기 위함.
 *  - 12-7 시점엔 본 컴포넌트 내부의 mock 모달을 Portone JS SDK `IMP.certification`
 *    호출로 교체. props 시그니처(initialVerified, onVerified)는 그대로 유지 → 부모 변경 0.
 *
 * 어떻게:
 *  - initialVerified=true: 회색 배경 + verified 아이콘 + "인증완료" 텍스트만 표시.
 *  - initialVerified=false: "본인인증" 버튼 → 클릭 시 mock 모달 오픈.
 *  - 모달에서 verified_name / verified_phone / verified_birth(선택) 입력 → POST 호출.
 *  - 성공 시 verified=true 로컬 state + onVerified 콜백으로 부모 form 갱신.
 *
 * 박제 룰 준수:
 *  - var(--*) 토큰만 (하드코딩 색상 0).
 *  - Material Symbols Outlined 아이콘 (verified).
 *  - radius 4px (.btn 클래스 + 인라인 borderRadius:4).
 *  - alert() 신규 0건 — 실패 시 인라인 errorText state 로 표시.
 * ============================================================ */

import { useState } from "react";

interface VerifiedPayload {
  verified_name: string;
  verified_phone: string;
}

interface Props {
  initialVerified: boolean;
  onVerified: (data: VerifiedPayload) => void;
}

export function IdentityVerifyButton({ initialVerified, onVerified }: Props) {
  // 인증 완료 여부 — 부모로부터 초기값 받고, POST 성공 시 true 로 전환
  const [verified, setVerified] = useState(initialVerified);
  const [showMock, setShowMock] = useState(false);
  // mock 모달 입력 3 필드
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 실패 메시지 — alert 대신 인라인 표시 (UX + 박제 룰)
  const [errorText, setErrorText] = useState<string | null>(null);

  // 인증 완료 상태 — 배지로 표시. 더 이상 버튼 노출 안 함.
  if (verified) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: "var(--ok)",
          fontWeight: 600,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          verified
        </span>
        인증완료
      </span>
    );
  }

  const handleSubmit = async () => {
    if (submitting) return;
    setErrorText(null);

    // 클라 가드 — 서버 검증과 별개로 즉시 피드백
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      setErrorText("실명을 입력해주세요.");
      return;
    }
    if (!trimmedPhone) {
      setErrorText("휴대폰 번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      // POST /api/web/identity/verify — withWebAuth 가드, 세션 쿠키 자동 첨부
      const res = await fetch("/api/web/identity/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verified_name: trimmedName,
          verified_phone: trimmedPhone,
          // 선택값 — 빈 문자열이면 undefined 로 보내 서버 z.optional() 매칭
          verified_birth: birth || undefined,
        }),
      });

      if (!res.ok) {
        // 서버 apiError 형태: { error: string }
        let msg = "인증에 실패했습니다. 다시 시도해주세요.";
        try {
          const data = await res.json();
          if (data?.error && typeof data.error === "string") msg = data.error;
        } catch {
          // ignore JSON 파싱 실패 (메시지 기본값 유지)
        }
        setErrorText(msg);
        return;
      }

      const data = await res.json();
      // 성공 — 부모 form 에 갱신 알림 + 로컬 verified=true 전환 + 모달 닫기
      onVerified({
        verified_name: data.verified_name ?? trimmedName,
        verified_phone: data.verified_phone ?? trimmedPhone,
      });
      setVerified(true);
      setShowMock(false);
    } catch (e) {
      // 네트워크 에러 — 디버깅용 console 만 남기고 인라인 메시지 표시
      console.error("[identity-verify]", e);
      setErrorText("네트워크 오류로 인증에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* 트리거 버튼 — settings 화면의 실명 readonly 옆에 인라인 배치 */}
      <button
        type="button"
        onClick={() => {
          setShowMock(true);
          setErrorText(null); // 모달 재오픈 시 직전 에러 초기화
        }}
        className="btn"
        style={{
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
          // 강조 — 미인증 상태 환기
          background: "var(--cafe-blue)",
          color: "var(--bg)",
          border: "1px solid var(--cafe-blue)",
          borderRadius: 4,
        }}
      >
        본인인증
      </button>

      {/* mock 모달 — overlay 클릭 시 닫힘, 내부 클릭은 stopPropagation */}
      {showMock && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="본인인증 (Mock)"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => !submitting && setShowMock(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              padding: 24,
              borderRadius: 4,
              maxWidth: 400,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "var(--ink)" }}>
              본인인증 (Mock)
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 16 }}>
              Portone 통합 전 임시 모달입니다. 실제 출시 시 SMS/PASS 인증으로 자동 교체됩니다.
            </p>

            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "block" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}>
                  실명 *
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  className="input"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>

              <label style={{ display: "block" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}>
                  휴대폰 번호 *
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  required
                  maxLength={20}
                  inputMode="numeric"
                  className="input"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>

              <label style={{ display: "block" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}>
                  생년월일 (선택)
                </span>
                <input
                  type="date"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                  className="input"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
            </div>

            {/* 인라인 에러 — alert() 대체 */}
            {errorText && (
              <p
                role="alert"
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "var(--accent)",
                }}
              >
                {errorText}
              </p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowMock(false)}
                className="btn"
                disabled={submitting}
                style={{
                  flex: 1,
                  borderRadius: 4,
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                // 필수 입력 비어있거나 제출 중이면 비활성
                disabled={!name.trim() || !phone.trim() || submitting}
                className="btn btn--primary"
                style={{
                  flex: 1,
                  borderRadius: 4,
                  opacity: !name.trim() || !phone.trim() || submitting ? 0.6 : 1,
                  cursor: submitting ? "wait" : "pointer",
                }}
              >
                {submitting ? "인증 중..." : "인증 완료"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
