"use client";

/* ============================================================
 * MockIdentityModal (5/8 본인인증 mock 자체 입력 폴백)
 *
 * 왜:
 *  - PortOne 콘솔 채널 발급 전 (이번 주 내 활성화 예정) 사용자가 onboarding 1단계에서
 *    빨간 에러 ("본인인증 설정이 완료되지 않았습니다") 로 막히는 문제 해결.
 *  - channel key 환경변수 미설정 = mock 모드 → 자체 입력 폼으로 임시 통과 허용.
 *  - PortOne 활성화 = 환경변수 추가 1회 → 자동 정식 SDK 호출 모드 복귀.
 *
 * 어떻게:
 *  - ForceActionModal 패턴 카피 (max-width 460 / iOS 16px input / 다이얼로그 패턴).
 *  - 입력 3종 (실명 한글 / 휴대폰 / 생년월일 선택) 클라 검증 후
 *    POST /api/web/identity/mock-verify → user.identity_method='mock' 저장.
 *  - 디자인 톤 다운 = 회색 안내 박스 (var(--ink-mute) / var(--bg-elev)). 빨간 에러 색 X.
 *
 * 보안 가드:
 *  - 서버 endpoint 자체에 isIdentityGateEnabled() 가드 — PortOne 활성화 후 mock 우회 불가
 *  - 클라 검증은 UX 용 (서버에서 zod 재검증 필수)
 * ============================================================ */

import { useEffect, useState } from "react";
// 5/8 사이트 전역 input 컴포넌트 — conventions.md 박제 룰 (의무 사용)
import { PhoneInput } from "@/components/inputs/phone-input";
import { BirthDateInput } from "@/components/inputs/birth-date-input";

interface VerifiedPayload {
  verified_name: string;
  verified_phone: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onVerified: (data: VerifiedPayload) => void;
}

// 한글 실명 — 2~20자 (성씨 1자 + 이름 1자 이상). 서버 zod 와 동일 패턴
const NAME_PATTERN = /^[가-힣]{2,20}$/;

// 휴대폰 번호 — 010-XXXX-XXXX (PhoneInput 자동 포맷 결과). 하이픈 없는 입력은 PhoneInput 이 차단
const PHONE_PATTERN = /^010-\d{4}-\d{4}$/;

// 생년월일 — YYYY-MM-DD (5/8 사용자 결정: 선택 → 필수 변경)
const BIRTH_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// yyyy 검증 범위 — 1900 ~ 현재 연도 (서버 zod 가 final source of truth, 클라는 UX 가드)
const MIN_BIRTH_YEAR = 1900;
const MAX_BIRTH_YEAR = new Date().getFullYear();

export function MockIdentityModal({ open, onClose, onVerified }: Props) {
  // 입력 상태 — 열 때마다 초기화
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 열릴 때마다 입력 초기화 — 이전 입력 잔존 방지
  useEffect(() => {
    if (!open) return;
    setName("");
    setPhone("");
    setBirthDate("");
    setError(null);
    setSubmitting(false);
  }, [open]);

  if (!open) return null;

  function close() {
    if (submitting) return; // 처리 중 닫기 방지
    onClose();
  }

  /**
   * 클라 검증 — 빈 입력 / 패턴 미스 즉시 차단 (서버 도달 X)
   * 서버에서도 zod 동일 검증 재수행 (클라 신뢰 X)
   * 5/8 변경: 생년월일 선택 → 필수 + yyyy 1900~현재 연도 / mm 01~12 / dd 01~31 검증
   */
  function validateLocal(): string | null {
    if (!NAME_PATTERN.test(name.trim())) {
      return "실명을 한글 2~20자로 입력해 주세요.";
    }
    if (!PHONE_PATTERN.test(phone.trim())) {
      return "휴대폰 번호를 010-XXXX-XXXX 형식으로 입력해 주세요.";
    }
    // 5/8 — 생년월일 필수 (사용자 결정)
    const birth = birthDate.trim();
    if (!birth) {
      return "생년월일을 입력해 주세요.";
    }
    if (!BIRTH_PATTERN.test(birth)) {
      return "생년월일을 YYYY-MM-DD 형식으로 입력해 주세요.";
    }
    // yyyy/mm/dd 범위 검증 — UX 가드 (서버 zod 가 final)
    const [yStr, mStr, dStr] = birth.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    if (y < MIN_BIRTH_YEAR || y > MAX_BIRTH_YEAR) {
      return `생년월일 연도는 ${MIN_BIRTH_YEAR}~${MAX_BIRTH_YEAR} 사이여야 합니다.`;
    }
    if (m < 1 || m > 12) {
      return "생년월일의 월은 01~12 사이여야 합니다.";
    }
    if (d < 1 || d > 31) {
      return "생년월일의 일은 01~31 사이여야 합니다.";
    }
    return null;
  }

  // 제출 버튼 disabled 조건 — 모든 필수 필드 미입력 시 차단 (사용자 결정)
  const allRequiredFilled =
    name.trim().length > 0 && phone.trim().length > 0 && birthDate.trim().length > 0;

  async function handleSubmit() {
    if (submitting) return;
    setError(null);

    const localError = validateLocal();
    if (localError) {
      setError(localError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/web/identity/mock-verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          // 5/8 — 생년월일 필수 (사용자 결정), 항상 전송
          birth_date: birthDate.trim(),
        }),
      });

      if (!res.ok) {
        // 응답 envelope 표준 (apiError) — { error, code }
        let msg = "임시 인증 정보 저장에 실패했습니다.";
        try {
          const data = await res.json();
          // 503 = PortOne 활성화 후 mock 차단 / 409 = 이미 인증 / 400 = 검증 실패
          if (typeof data?.error === "string") msg = data.error;
        } catch {
          // ignore (non-json response)
        }
        setError(msg);
        setSubmitting(false);
        return;
      }

      // 성공 — apiSuccess 응답 키 자동 snake_case 변환됨 (errors.md 8회 재발 함정 회피)
      const data = await res.json();
      onVerified({
        verified_name: data.verified_name ?? name.trim(),
        verified_phone: data.verified_phone ?? phone.trim(),
      });
    } catch (e) {
      console.error("[mock-identity]", e);
      setError("임시 인증 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mock-identity-modal-title"
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          // ForceActionModal 동일 토큰 (디자인 일관성)
          background: "var(--color-card)",
          borderRadius: 8,
          padding: 20,
          maxWidth: 460,
          width: "100%",
          border: "1px solid var(--color-border)",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "var(--color-text-primary)",
        }}
      >
        <h2
          id="mock-identity-modal-title"
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 4,
            color: "var(--color-text-primary)",
          }}
        >
          임시 정보 입력 (출시 준비 중)
        </h2>

        {/* 안내 박스 — 회색 톤 (사용자 결정 Q2: B 톤 다운 / 노란 경고 X) */}
        <div
          style={{
            fontSize: 12,
            color: "var(--color-text-muted)",
            marginBottom: 16,
            padding: "10px 12px",
            background: "var(--color-elevated)",
            borderRadius: 4,
            border: "1px solid var(--color-border)",
            lineHeight: 1.55,
          }}
        >
          정식 본인인증은 곧 활성화됩니다. 임시 입력 정보는 정식 인증 시 자동 갱신됩니다.
        </div>

        {/* 실명 — 한글 2~20자 필수 */}
        <label style={{ display: "block", marginBottom: 12 }}>
          <span
            style={{
              fontSize: 13,
              color: "var(--color-text-primary)",
              display: "block",
              marginBottom: 4,
            }}
          >
            실명 (한글) <span style={{ color: "var(--color-error)" }}>*</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            disabled={submitting}
            maxLength={20}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid var(--color-border)",
              background: "var(--color-elevated)",
              color: "var(--color-text-primary)",
              // iOS 자동 줌 차단 (16px)
              fontSize: 16,
            }}
          />
        </label>

        {/* 휴대폰 번호 — 5/8 PhoneInput 적용 (사이트 전역 룰) */}
        <label style={{ display: "block", marginBottom: 12 }}>
          <span
            style={{
              fontSize: 13,
              color: "var(--color-text-primary)",
              display: "block",
              marginBottom: 4,
            }}
          >
            휴대폰 번호 <span style={{ color: "var(--color-error)" }}>*</span>
          </span>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            disabled={submitting}
            required
            // 자동 포맷 컴포넌트가 maxLength/inputMode/pattern 자동 부여 (placeholder 도 기본값 사용)
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid var(--color-border)",
              background: "var(--color-elevated)",
              color: "var(--color-text-primary)",
              // iOS 자동 줌 차단 (16px)
              fontSize: 16,
            }}
          />
        </label>

        {/* 생년월일 — 5/8 BirthDateInput 적용 (사이트 전역 룰) + 필수 변경 (사용자 결정) */}
        <label style={{ display: "block", marginBottom: 16 }}>
          <span
            style={{
              fontSize: 13,
              color: "var(--color-text-primary)",
              display: "block",
              marginBottom: 4,
            }}
          >
            생년월일 <span style={{ color: "var(--color-error)" }}>*</span>
          </span>
          <BirthDateInput
            value={birthDate}
            onChange={setBirthDate}
            disabled={submitting}
            required
            minYear={MIN_BIRTH_YEAR}
            maxYear={MAX_BIRTH_YEAR}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid var(--color-border)",
              background: "var(--color-elevated)",
              color: "var(--color-text-primary)",
              fontSize: 16,
            }}
          />
        </label>

        {error && (
          <p
            role="alert"
            style={{
              fontSize: 12,
              marginBottom: 12,
              color: "var(--color-error)",
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            className="btn"
            style={{ minWidth: 80 }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            // 5/8 — 모든 필수 필드 미입력 시에도 disabled (사용자 결정)
            disabled={submitting || !allRequiredFilled}
            className="btn"
            style={{
              minWidth: 100,
              background: "var(--cafe-blue)",
              color: "var(--bg)",
              borderColor: "var(--cafe-blue)",
              opacity: submitting || !allRequiredFilled ? 0.6 : 1,
              cursor: submitting
                ? "wait"
                : !allRequiredFilled
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {submitting ? "처리 중..." : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
