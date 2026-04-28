"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * /reset-password — 비밀번호 재설정 (token 기반)
 *  v2(1) 시안 박제: 4단계 위저드 indicator + 비밀번호 강도 미터 (5단계)
 *
 * 흐름 보존:
 *  - URL 쿼리 token으로 새 비밀번호 설정 (1·2단계는 forgot-password에서 처리됨)
 *  - 본 페이지는 시안 step 3(새 비번 입력) → step 4(완료) 만 활성화
 *  - 시안의 step 1·2 indicator는 "완료(✓)" 상태로 표시 (forgot-password 통과 의미)
 *  - API: /api/web/auth/reset-password POST { token, password }
 *  - 성공 → 3초 후 /login 자동 이동
 */
export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 시안 박제: 비밀번호 강도 (0~4 → 5단계 라벨)
  // 길이 8+, 대문자, 숫자, 특수문자 4가지 평가
  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["매우 약함", "약함", "보통", "강함", "매우 강함"][strength];
  // 시안 색상 매핑: err / err / warning / success / success
  const strengthColor = [
    "var(--color-error)",
    "var(--color-error)",
    "var(--color-warning)",
    "var(--color-success)",
    "var(--color-success)",
  ][strength];

  // 4단계 indicator 정의 (시안 박제)
  // step 1: 이메일 확인 (forgot-password에서 완료)
  // step 2: 인증 코드 (forgot-password에서 완료)
  // step 3: 새 비밀번호 (현재 페이지)
  // step 4: 완료
  const steps = [
    { n: 1, l: "이메일 확인" },
    { n: 2, l: "인증 코드" },
    { n: 3, l: "새 비밀번호" },
    { n: 4, l: "완료" },
  ];
  // 현재 단계: token 있고 success 아니면 3, success면 4, token 없으면 1로 (안내 모드)
  const currentStep = !token ? 1 : success ? 4 : 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 최소 길이 확인
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/web/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "비밀번호 변경에 실패했습니다.");
      }

      setSuccess(true);
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 4단계 progress indicator (시안 박제)
  const StepIndicator = () => (
    <div className="mb-6 flex px-2">
      {steps.map((s, i) => {
        const reached = currentStep >= s.n;
        const passed = currentStep > s.n;
        return (
          <div key={s.n} className="flex flex-1 items-center">
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div
                className="grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] font-extrabold"
                style={{
                  backgroundColor: reached
                    ? "var(--color-accent)"
                    : "var(--color-bg-alt)",
                  color: reached ? "var(--color-on-accent)" : "var(--color-text-muted)",
                }}
              >
                {passed ? "✓" : s.n}
              </div>
              <div
                className="text-[10px] font-bold"
                style={{
                  color: reached
                    ? "var(--color-text-primary)"
                    : "var(--color-text-muted)",
                }}
              >
                {s.l}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className="mb-3.5 h-0.5 flex-1"
                style={{
                  backgroundColor: passed
                    ? "var(--color-accent)"
                    : "var(--color-border)",
                  margin: "0 6px",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // 토큰이 없으면 안내 메시지 (step 1로 표시)
  if (!token) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[520px]">
          {/* 헤더 */}
          <div className="mb-5 text-center">
            <div
              className="mb-1 text-[22px] font-black tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              MyBDR
            </div>
            <h1
              className="mt-3.5 mb-1 text-[22px] font-extrabold"
              style={{ color: "var(--color-text-primary)" }}
            >
              비밀번호 재설정
            </h1>
            <p
              className="m-0 text-[13px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              가입할 때 쓴 이메일로 인증 코드를 보내드려요.
            </p>
          </div>

          <StepIndicator />

          <div
            className="rounded-[16px] border p-7 text-center shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <span
              className="material-symbols-outlined mb-2 text-4xl"
              style={{ color: "var(--color-error)" }}
            >
              error
            </span>
            <h2
              className="mb-2 text-xl font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              잘못된 접근입니다
            </h2>
            <p
              className="mb-4 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              비밀번호 재설정 링크가 유효하지 않습니다.
            </p>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold underline"
              style={{ color: "var(--color-primary)" }}
            >
              비밀번호 찾기로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[520px]">
        {/* 헤더 (시안 박제) */}
        <div className="mb-5 text-center">
          <div
            className="mb-1 text-[22px] font-black tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            MyBDR
          </div>
          <h1
            className="mt-3.5 mb-1 text-[22px] font-extrabold"
            style={{ color: "var(--color-text-primary)" }}
          >
            비밀번호 재설정
          </h1>
          <p
            className="m-0 text-[13px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            새 비밀번호를 입력해주세요.
          </p>
        </div>

        {/* 4단계 indicator */}
        <StepIndicator />

        <div
          className="rounded-[16px] border px-8 py-7 shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          {/* step 4: 완료 화면 */}
          {success ? (
            <div className="py-5 text-center">
              <div
                className="mx-auto mb-4 grid h-[72px] w-[72px] place-items-center rounded-full text-[40px] font-black"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-success) 16%, transparent)",
                  color: "var(--color-success)",
                }}
              >
                ✓
              </div>
              <h2
                className="mb-1.5 text-xl font-extrabold"
                style={{ color: "var(--color-text-primary)" }}
              >
                변경 완료
              </h2>
              <p
                className="mb-6 text-[13px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                새 비밀번호로 로그인해주세요.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-[12px] px-6 py-3 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-on-accent)",
                }}
              >
                로그인 화면으로
              </Link>
            </div>
          ) : (
            <>
              {/* 에러 메시지 */}
              {error && (
                <div
                  className="mb-4 rounded-[10px] px-3 py-2 text-sm"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--color-error) 10%, transparent)",
                    color: "var(--color-error)",
                  }}
                >
                  {error}
                </div>
              )}

              {/* step 3: 새 비밀번호 입력 폼 */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    새 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8자 이상, 영문·숫자·기호"
                      autoFocus
                      className="w-full rounded-[12px] border px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: "var(--color-bg)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    {/* 비밀번호 표시/숨기기 토글 */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--color-text-muted)" }}
                      tabIndex={-1}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>

                  {/* 비밀번호 강도 미터 (시안 박제) */}
                  {password && (
                    <div className="mt-2">
                      <div className="mb-1 flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-[2px]"
                            style={{
                              backgroundColor:
                                i < strength
                                  ? strengthColor
                                  : "var(--color-border)",
                            }}
                          />
                        ))}
                      </div>
                      <div
                        className="text-[11px] font-bold"
                        style={{ color: strengthColor }}
                      >
                        {strengthLabel}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    비밀번호 확인
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    className="w-full rounded-[12px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-bg)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <div
                      className="mt-1 text-[11px] font-bold"
                      style={{ color: "var(--color-error)" }}
                    >
                      비밀번호가 일치하지 않습니다
                    </div>
                  )}
                </div>

                {/* 비밀번호 요구사항 안내 (시안 박제) */}
                <div
                  className="rounded-[4px] px-3 py-2.5 text-[11px] leading-relaxed"
                  style={{
                    backgroundColor: "var(--color-bg-alt)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <b>비밀번호 요구사항</b>
                  <br />· 8자 이상 · 영문 대소문자 포함 · 숫자 1개 이상 · 특수문자 권장
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    strength < 3 ||
                    password !== confirmPassword ||
                    password.length < 8
                  }
                  className="w-full rounded-[12px] py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-on-accent)",
                  }}
                >
                  {loading ? "변경 중..." : "비밀번호 변경"}
                </button>
              </form>
            </>
          )}
        </div>

        {!success && (
          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              ← 로그인으로 돌아가기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
