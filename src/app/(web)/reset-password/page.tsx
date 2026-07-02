"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
// 시안 정본과 동일하게 비밀번호 입력은 PasswordInput(보기 토글 통합) 사용
import { PasswordInput } from "@/components/ui/password-input";

/**
 * /reset-password — 비밀번호 재설정 (token 기반)
 *
 * DS v4 전면 리박제 (PR-PUBF-A):
 *  - 시안 정본 `Dev/design/BDR-current/screens/PasswordReset.jsx` 구조·토큰 반영
 *    (.page/.card/.input/.btn--primary + 4단계 indicator + 강도 미터 + 완료 hero).
 *  - 구 토큰(--color-계열)·--color-on-accent 전량 제거 → DS v4 신토큰(--accent, --ink 계열, --ink-on-brand 등).
 *
 * ⚠️ 백엔드 무변경 (UI만):
 *  - 이메일-링크(token) 방식 그대로. URL 쿼리 token으로 새 비밀번호 설정.
 *  - 시안의 step 1(이메일)·2(코드)는 forgot-password에서 완료된 상태로 표시(✓).
 *    본 페이지는 step 3(새 비번 입력) → step 4(완료)만 활성화.
 *  - API: /api/web/auth/reset-password POST { token, password } — 로직 동일.
 *  - 성공 → 3초 후 /login 자동 이동.
 */
export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 시안 박제: 비밀번호 강도 (0~4 → 5단계 라벨)
  // 길이 8+, 대문자, 숫자, 특수문자 4가지 평가 (로직 무변경)
  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["매우 약함", "약함", "보통", "강함", "매우 강함"][strength];
  // 시안 색상 매핑: err/err/warn/ok/ok — 이 코드베이스엔 --err 미정의 → --danger 사용
  const strengthColor = [
    "var(--danger)",
    "var(--danger)",
    "var(--warn)",
    "var(--ok)",
    "var(--ok)",
  ][strength];

  // 4단계 indicator 정의 (시안 박제)
  const steps = [
    { n: 1, l: "이메일 확인" },
    { n: 2, l: "인증 코드" },
    { n: 3, l: "새 비밀번호" },
    { n: 4, l: "완료" },
  ];
  // 현재 단계: token 없으면 1(안내) / success면 4 / 그 외 3
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

  // 4단계 progress indicator (시안 박제 — DS v4 토큰)
  const StepIndicator = () => (
    <div style={{ display: "flex", marginBottom: 24, padding: "0 10px" }}>
      {steps.map((s, i) => {
        const reached = currentStep >= s.n;
        const passed = currentStep > s.n;
        return (
          <div key={s.n} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* 단계 원 — 도달 시 포인트색(accent) 배경 + ink-on-brand 글자 */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: reached ? "var(--accent)" : "var(--bg-alt)",
                  color: reached ? "var(--ink-on-brand)" : "var(--ink-dim)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 800,
                  fontSize: 11,
                }}
              >
                {passed ? "✓" : s.n}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: reached ? "var(--ink)" : "var(--ink-dim)",
                }}
              >
                {s.l}
              </div>
            </div>
            {/* 단계 연결선 — 통과 시 accent */}
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: passed ? "var(--accent)" : "var(--border)",
                  margin: "0 6px",
                  marginBottom: 14,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // 헤더 (MyBDR 로고 + 서브 카피)
  const Header = ({ sub }: { sub: string }) => (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <div
        style={{
          fontFamily: "var(--ff-display)",
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          marginBottom: 4,
          color: "var(--ink)",
        }}
      >
        MyBDR
      </div>
      <h1 style={{ margin: "14px 0 4px", fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>
        비밀번호 재설정
      </h1>
      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-mute)" }}>{sub}</p>
    </div>
  );

  // 토큰이 없으면 안내 메시지 (step 1로 표시)
  if (!token) {
    return (
      <div className="page" style={{ maxWidth: 520, margin: "0 auto", paddingTop: 40 }}>
        <Header sub="가입할 때 쓴 이메일로 인증 코드를 보내드려요." />
        <StepIndicator />

        <div className="card" style={{ padding: "28px 32px", textAlign: "center" }}>
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--danger)", fontSize: 40, marginBottom: 8, display: "block" }}
          >
            error
          </span>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
            잘못된 접근입니다
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--ink-soft)" }}>
            비밀번호 재설정 링크가 유효하지 않습니다.
          </p>
          <Link
            href="/forgot-password"
            style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-blue)", textDecoration: "underline" }}
          >
            비밀번호 찾기로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 520, margin: "0 auto", paddingTop: 40 }}>
      <Header sub="새 비밀번호를 입력해주세요." />
      <StepIndicator />

      <div className="card" style={{ padding: "28px 32px" }}>
        {success ? (
          /* step 4: 완료 hero (시안 박제) */
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "color-mix(in oklab, var(--ok) 16%, transparent)",
                color: "var(--ok)",
                display: "grid",
                placeItems: "center",
                fontSize: 40,
                margin: "0 auto 18px",
                fontWeight: 900,
              }}
            >
              ✓
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>
              변경 완료
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--ink-mute)" }}>
              새 비밀번호로 로그인해주세요.
            </p>
            <Link href="/login" className="btn btn--primary btn--xl" style={{ display: "inline-flex" }}>
              로그인 화면으로
            </Link>
          </div>
        ) : (
          <>
            {/* 에러 메시지 */}
            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "var(--accent-soft)",
                  color: "var(--danger)",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {/* step 3: 새 비밀번호 입력 폼 */}
            <form onSubmit={handleSubmit}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ink-dim)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                새 비밀번호
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상, 영문·숫자·기호"
                autoComplete="new-password"
                required
                minLength={8}
                autoFocus
              />

              {/* 비밀번호 강도 미터 (시안 박제) */}
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 4,
                          background: i < strength ? strengthColor : "var(--border)",
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColor, fontWeight: 700 }}>
                    {strengthLabel}
                  </div>
                </div>
              )}

              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ink-dim)",
                  display: "block",
                  marginBottom: 6,
                  marginTop: 16,
                }}
              >
                비밀번호 확인
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 다시 입력"
                autoComplete="new-password"
                required
                minLength={8}
              />
              {confirmPassword && password !== confirmPassword && (
                <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 4, fontWeight: 700 }}>
                  비밀번호가 일치하지 않습니다
                </div>
              )}

              {/* 비밀번호 요구사항 안내 (시안 박제) */}
              <div
                style={{
                  marginTop: 18,
                  padding: "10px 12px",
                  background: "var(--bg-alt)",
                  borderRadius: 4,
                  fontSize: 11,
                  color: "var(--ink-soft)",
                  lineHeight: 1.7,
                }}
              >
                <b>비밀번호 요구사항</b>
                <br />· 8자 이상 · 영문 대소문자 포함 · 숫자 1개 이상 · 특수문자 권장
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--xl"
                style={{ width: "100%", marginTop: 20 }}
                disabled={
                  loading ||
                  strength < 3 ||
                  password !== confirmPassword ||
                  password.length < 8
                }
              >
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </form>
          </>
        )}
      </div>

      {!success && (
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12 }}>
          <Link href="/login" style={{ color: "var(--cafe-blue)", fontWeight: 600 }}>
            ← 로그인으로 돌아가기
          </Link>
        </div>
      )}
    </div>
  );
}
