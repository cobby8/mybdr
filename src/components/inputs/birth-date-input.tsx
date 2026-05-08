"use client";

/* ============================================================
 * BirthDateInput — 사이트 전역 생년월일 입력 컴포넌트 (5/8 신규)
 *
 * 이유 (왜):
 *  - 기존 `<input type="date">` 의 함정:
 *    · yyyy 칸에 6자리 입력 가능 ("202412" 등) → 잘못된 날짜 통과 → 검증 실패 빈발
 *    · 브라우저별 UI 차이 (iOS/Android/Desktop 모두 다름)
 *    · 한국 사용자 직관성 ↓ (캘린더 widget 강제)
 *  - 사이트 전역 일관성 — 신규 작업부터 의무 사용 (conventions.md 박제).
 *  - 자동 포맷으로 yyyy 4자리 강제 → 입력 함정 원천 차단.
 *
 * 어떻게:
 *  - 사용자 입력 → 숫자만 추출 (`/[^0-9]/g` 제거) → 8자리 제한 (slice 0..8 = YYYYMMDD)
 *  - 자동 포맷:
 *    · 0~4자리: `YYYY`              → yyyy 4자리 제한 (5자리 입력 시도 자동 차단)
 *    · 5~6자리: `YYYY-MM`
 *    · 7~8자리: `YYYY-MM-DD`
 *  - onChange 콜백은 **포맷된 값** 전달 → 부모 state = DB 저장 최종 형태
 *  - 검증:
 *    · yyyy: 1900 ~ 현재 연도 (UI 가드 — 서버 zod 가 final source of truth)
 *    · mm: 01~12
 *    · dd: 01~31 (월별 정확도는 서버 zod 또는 추가 검증)
 *
 * 룰 (사이트 전역 — conventions.md):
 *  - 신규 작업에서 생년월일 입력 = 본 컴포넌트 의무 사용
 *  - `<input type="date">` 직접 사용 금지
 *  - yyyy 4자리 제한 (HTML date input 의 6자리 입력 함정 fix — 사용자 명시)
 *  - placeholder 기본값 "YYYY-MM-DD (숫자만 입력)"
 *
 * 사용 예:
 *   const [birth, setBirth] = useState("");
 *   <BirthDateInput value={birth} onChange={setBirth} required />
 * ============================================================ */

import type { InputHTMLAttributes } from "react";

/**
 * 숫자만 추출 후 8자리 제한 → 자동 하이픈 포맷
 *
 *  - 입력 "20000101"      → 출력 "2000-01-01"
 *  - 입력 "200001"        → 출력 "2000-01"
 *  - 입력 "2000"          → 출력 "2000"
 *  - 입력 "202412345"     → 숫자만 추출 + 8자리 제한 = "20241234" → "2024-12-34"
 *      (잘못된 dd=34 는 zod 가 거부 — UI 는 입력 가능, 검증은 제출 시)
 *  - 입력 "20240101extra" → 숫자만 = "20240101" → "2024-01-01"
 *
 * 핵심: yyyy 4자리 + mm 2자리 + dd 2자리 = 총 8자리 강제 (slice 0..8).
 *       사용자가 yyyy 칸에 5자리 이상 입력 시도해도 4자리 + 다음 자리는 mm 으로 자동 이동.
 */
function formatBirthDate(raw: string): string {
  // 숫자만 추출 + 8자리 제한 (YYYYMMDD = 8자리 고정)
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);

  // 0~4자리 = YYYY (yyyy 4자리 제한 핵심 — 5자리 시도 시 다음 자리는 mm 으로 자동 이동)
  if (digits.length <= 4) return digits;
  // 5~6자리 = YYYY-MM
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  // 7~8자리 = YYYY-MM-DD
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

// HTMLInputElement props 확장 — value/onChange 만 시그니처 고정
type BirthDateInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode" | "pattern"
> & {
  value: string;
  onChange: (val: string) => void;
  /** 최소 연도 — 기본 1900 */
  minYear?: number;
  /** 최대 연도 — 기본 현재 연도 */
  maxYear?: number;
};

export function BirthDateInput({
  value,
  onChange,
  placeholder = "YYYY-MM-DD (숫자만 입력)",
  minYear: _minYear,
  maxYear: _maxYear,
  ...rest
}: BirthDateInputProps) {
  // minYear/maxYear 은 서버 검증과 합 맞추기 위한 props — 클라 즉시 검증은 서버 zod refine 에 위임.
  // (현재는 props 만 받아 두고, 추후 inline 에러 메시지 추가 시 활용)
  void _minYear;
  void _maxYear;

  return (
    <input
      // type="text" — `<input type="date">` 함정 회피 (yyyy 6자리 입력 가능 문제 fix)
      // pattern + inputMode 로 모바일 숫자 키패드 노출 + form 검증 둘 다 충족
      type="text"
      // inputMode="numeric" — 모바일 숫자 키패드 (iOS/Android 호환)
      inputMode="numeric"
      // pattern — HTML5 검증 (form 제출 시 브라우저 자동 검증)
      pattern="\d{4}-\d{2}-\d{2}"
      // 10자리 제한 (포맷된 형태 = "YYYY-MM-DD" = 10자) — 추가 입력 시도 자동 차단
      maxLength={10}
      value={value}
      onChange={(e) => {
        onChange(formatBirthDate(e.target.value));
      }}
      placeholder={placeholder}
      {...rest}
    />
  );
}
