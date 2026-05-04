"use client";

/**
 * PasswordInput — 비밀번호 입력 + 보기/숨기기 토글 버튼 통합 컴포넌트
 *
 * 글로벌 룰 (2026-05-04 사용자 결정): 모든 프로젝트의 비밀번호 입력란은
 * 보기 버튼 의무 (Material Symbols visibility / visibility_off).
 *
 * 사용 예시:
 * ```tsx
 * <PasswordInput
 *   name="password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   placeholder="8자 이상"
 *   autoComplete="new-password"  // 가입: new-password / 로그인: current-password
 *   required
 * />
 * ```
 *
 * autoComplete 룰:
 * - 가입 (signup): "new-password" — 브라우저 자동완성 차단 (의도)
 * - 로그인 (login): "current-password" — 저장된 비밀번호 자동완성 활성
 * - 비밀번호 변경 (current/new): "current-password" / "new-password" 분리
 */

import { useState, type InputHTMLAttributes } from "react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** 입력란 className. 미지정 시 기본 "input" 클래스 (BDR-current 토큰) */
  className?: string;
}

export function PasswordInput({ className, style, ...rest }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        {...rest}
        type={show ? "text" : "password"}
        className={className ?? "input"}
        style={{ paddingRight: 44, ...style }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
        // 이유: tabIndex=-1 — Tab 이동 시 input 다음에 보기 버튼이 아닌 다음 필드로 자연스럽게 이동
        tabIndex={-1}
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: 0,
          padding: 6,
          cursor: "pointer",
          color: "var(--ink-mute)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20 }}
          aria-hidden="true"
        >
          {show ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}
