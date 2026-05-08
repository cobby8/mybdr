"use client";

/* ============================================================
 * PhoneInput — 사이트 전역 휴대폰 입력 컴포넌트 (5/8 신규)
 *
 * 이유 (왜):
 *  - 사용자가 하이픈 포함 13자 ("010-1234-5678") 직접 입력 = UX 불편 + 형식 오류 빈발.
 *  - 사이트 전역 일관성 — 신규 작업부터 의무 사용 (conventions.md 박제).
 *  - 자동 포맷으로 형식 통일 → DB 저장 값 표준화 ("010-XXXX-XXXX" 단일 패턴).
 *
 * 어떻게:
 *  - 사용자 입력 → 숫자만 추출 (`/[^0-9]/g` 제거) → 11자리 제한 (slice 0..11)
 *  - 자동 하이픈 포맷:
 *    · 0~3자리: `XXX`
 *    · 4~7자리: `XXX-XXXX`
 *    · 8~11자리: `XXX-XXXX-XXXX`
 *  - onChange 콜백은 **포맷된 값** 전달 → 부모 state = DB 저장용 최종 형태
 *  - inputMode="numeric" — 모바일에서 숫자 키패드 자동 노출
 *
 * 룰 (사이트 전역 — conventions.md):
 *  - 신규 작업에서 휴대폰 입력 = 본 컴포넌트 의무 사용
 *  - `<input type="tel">` 직접 사용 금지
 *  - 11자리 제한 (slice 0..11)
 *  - placeholder 기본값 "숫자만 입력 (010XXXXXXXX)"
 *
 * 사용 예:
 *   const [phone, setPhone] = useState("");
 *   <PhoneInput value={phone} onChange={setPhone} required />
 * ============================================================ */

import type { InputHTMLAttributes } from "react";

/**
 * 숫자만 추출 후 11자리 제한 → 자동 하이픈 포맷
 *
 *  - 입력 "01012345678"  → 출력 "010-1234-5678"
 *  - 입력 "0101234"      → 출력 "010-1234"
 *  - 입력 "010"          → 출력 "010"
 *  - 입력 "abc010-12345" → 숫자만 추출 = "01012345" → "010-1234-5"
 */
function formatPhone(raw: string): string {
  // 숫자만 추출 + 11자리 제한 (한국 휴대폰 11자리 고정)
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 11);

  // 0~3자리 = 하이픈 없음
  if (digits.length <= 3) return digits;
  // 4~7자리 = XXX-XXXX
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  // 8~11자리 = XXX-XXXX-XXXX
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// HTMLInputElement props 확장 — value/onChange 만 시그니처 고정, 나머지는 그대로 통과
type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode" | "pattern"
> & {
  value: string;
  onChange: (val: string) => void;
};

export function PhoneInput({
  value,
  onChange,
  placeholder = "숫자만 입력 (010XXXXXXXX)",
  ...rest
}: PhoneInputProps) {
  return (
    <input
      // type="tel" — 모바일에서 휴대폰 키패드 우선 노출 (inputMode 와 함께)
      type="tel"
      // inputMode="numeric" — 모바일 숫자 키패드 강제 (iOS/Android 호환)
      inputMode="numeric"
      // pattern — HTML5 검증 (form 제출 시 브라우저 자동 검증)
      pattern="010-\d{4}-\d{4}"
      // 13자리 제한 (포맷된 형태 = "010-1234-5678" = 13자) — 추가 입력 시도 자동 차단
      maxLength={13}
      value={value}
      onChange={(e) => {
        // 포맷된 값을 부모에 전달 — 부모 state = DB 저장 최종 형태
        onChange(formatPhone(e.target.value));
      }}
      placeholder={placeholder}
      {...rest}
    />
  );
}
