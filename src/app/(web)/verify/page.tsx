"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /verify — 추가 인증 (전화번호/이메일)
 * v2(1) 시안 박제: 단계 progress + 카드 컨테이너 + 카운트다운 타이머
 *  - API/state/인증 흐름 100% 보존: send-code, complete, needsEmail/needsPhone
 *  - 시안의 phone → code → done 흐름을 input → verify-phone → 자동 라우팅에 매핑
 *  - 하드코딩 색상 금지 → var(--color-*) / Material Symbols 유지
 */
export default function VerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const missing = params.get("missing")?.split(",") ?? [];

  const needsEmail = missing.includes("email");
  const needsPhone = missing.includes("phone");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [step, setStep] = useState<"input" | "verify-phone">("input");
  const [sentCode, setSentCode] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // 시안 박제: 인증 코드 카운트다운(180초). 보낸 시점부터 시작
  const [secondsLeft, setSecondsLeft] = useState(180);

  // 코드 입력 단계 진입 시 1초 단위 카운트다운
  useEffect(() => {
    if (step !== "verify-phone") return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  // mm:ss 포맷 (시안 fmt 함수 박제)
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // 전화번호 인증 코드 발송 (실제 SMS 연동 전 앱 내 시뮬레이션)
  const sendCode = async () => {
    if (!phone.match(/^01[016789]\d{7,8}$/)) {
      setError("올바른 전화번호를 입력해주세요. (예: 01012345678)");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/web/verify/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setSentCode(data.code ?? ""); // 개발 환경에서는 코드를 반환
        setStep("verify-phone");
        setSecondsLeft(180); // 카운트다운 리셋
      } else {
        setError(data.error ?? "발송 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setSending(false);
    }
  };

  // 인증 코드 확인 + 프로필 저장
  const handleSubmit = async () => {
    if (needsPhone && step === "input") {
      sendCode();
      return;
    }

    if (needsPhone && step === "verify-phone" && verifyCode.length !== 6) {
      setError("6자리 인증 코드를 입력해주세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/web/verify/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: needsEmail ? email : undefined,
          phone: needsPhone ? phone : undefined,
          code: needsPhone ? verifyCode : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // M5 온보딩 압축: phone 인증 완료 → 미니멀 옵션 카드로 자연 진입
        router.push("/profile/complete");
      } else {
        setError(data.error ?? "저장 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  const skipable = !needsPhone; // 전화번호는 필수, 이메일은 건너뛰기 가능
  // 진행 단계: input(1단계) → verify-phone(1단계 진행 중) → done(2단계)
  // step 1 활성: 항상 / step 2 활성: verify-phone 단계
  const stepActive = step === "verify-phone" ? 2 : 1;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px]">
        {/* 헤더: eyebrow + 타이틀 + 설명 (시안 박제) */}
        <div
          className="mb-2 text-xs font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--color-text-muted)" }}
        >
          온보딩 1/2 · VERIFY
        </div>
        <h1
          className="mb-2 text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-heading)" }}
        >
          {needsPhone ? "전화번호 인증" : "이메일 인증"}
        </h1>
        <p
          className="mb-6 text-sm leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          {needsPhone
            ? "매치 신청·대회 운영 알림을 받으려면 전화번호 인증이 필요합니다. SMS로 6자리 인증번호를 발송합니다."
            : "서비스 알림 수신을 위해 이메일 인증이 필요합니다."}
        </p>

        {/* 시안 박제: 2단계 progress bar */}
        <div className="mb-6 flex gap-1.5">
          <div
            className="h-1 flex-1 rounded-[2px]"
            style={{
              backgroundColor:
                stepActive >= 1 ? "var(--color-accent)" : "var(--color-border)",
            }}
          />
          <div
            className="h-1 flex-1 rounded-[2px]"
            style={{
              backgroundColor:
                stepActive >= 2 ? "var(--color-accent)" : "var(--color-border)",
            }}
          />
        </div>

        <div
          className="rounded-[16px] border p-6 shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
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

          {/* 1단계: 전화번호 입력 */}
          {needsPhone && step === "input" && (
            <div className="space-y-3">
              <div>
                <label
                  className="mb-1.5 block text-xs font-bold"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  휴대전화번호 <span style={{ color: "var(--color-primary)" }}>*</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="01012345678"
                  maxLength={11}
                  autoFocus
                  className="w-full rounded-[12px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg)",
                    color: "var(--color-text-primary)",
                  }}
                />
                <div
                  className="mt-2 text-[11px] leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ※ 입력하신 번호는 본인 확인과 알림 외 목적으로 사용되지 않습니다.
                </div>
              </div>
              {needsEmail && (
                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    이메일{" "}
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      (선택)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full rounded-[12px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-bg)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={sending || !phone}
                className="w-full rounded-[12px] py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-on-accent)",
                }}
              >
                {sending ? "발송 중..." : "인증번호 받기"}
              </button>
            </div>
          )}

          {/* 2단계: 인증 코드 입력 */}
          {needsPhone && step === "verify-phone" && (
            <div className="space-y-3">
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                <span
                  className="font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {phone}
                </span>{" "}
                으로 발송됨
              </div>
              {/* [개발 모드] 인증 코드 노출 박스 — warning 토큰 (semantic 일치) */}
              {sentCode && (
                <div
                  className="rounded-[10px] px-3 py-2 text-xs"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--color-warning) 10%, transparent)",
                    color: "var(--color-warning)",
                  }}
                >
                  [개발 모드] 인증 코드:{" "}
                  <span className="font-bold">{sentCode}</span>
                </div>
              )}
              <div>
                <label
                  className="mb-1.5 block text-xs font-bold"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  인증번호 6자리
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full rounded-[12px] border px-4 py-3 text-center font-mono text-[22px] font-bold tracking-[0.4em] focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
              {/* 시안 박제: 카운트다운 + 재전송 */}
              <div
                className="flex items-center justify-between text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span>
                  남은 시간{" "}
                  <b
                    className="font-mono"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {fmt(secondsLeft)}
                  </b>
                </span>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending}
                  className="text-xs font-semibold underline-offset-2 hover:underline disabled:opacity-50"
                  style={{ color: "var(--color-accent)" }}
                >
                  재전송
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={saving || verifyCode.length !== 6}
                className="w-full rounded-[12px] py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-on-accent)",
                }}
              >
                {saving ? "확인 중..." : "인증 확인"}
              </button>
              <button
                onClick={() => {
                  setStep("input");
                  setVerifyCode("");
                  setSentCode("");
                }}
                className="w-full text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                번호 다시 입력
              </button>
            </div>
          )}

          {/* 이메일만 필요한 경우 */}
          {!needsPhone && needsEmail && (
            <div className="space-y-3">
              <div>
                <label
                  className="mb-1.5 block text-xs font-bold"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full rounded-[12px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={saving || !email}
                className="w-full rounded-[12px] py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-on-accent)",
                }}
              >
                {saving ? "저장 중..." : "완료"}
              </button>
            </div>
          )}
        </div>

        {skipable && (
          <button
            onClick={() => router.push("/")}
            className="mt-4 w-full text-center text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            나중에 (홈으로)
          </button>
        )}
      </div>
    </div>
  );
}
