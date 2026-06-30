"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// 사이트 전역 휴대폰 입력 컴포넌트 (conventions.md [2026-05-08] 룰 — 의무 사용)
import { PhoneInput } from "@/components/inputs/phone-input";

/**
 * /verify — 추가 인증 (전화번호/이메일)
 * PR-PUB-1-2 리스킨: BDR-current Verify.jsx 시안 1:1 박제.
 *  - 로직 100% 보존: send-code, complete, needsEmail/needsPhone, 카운트다운
 *  - Tailwind 클래스 → BDR DS 클래스 (.card/.label/.input/.btn)
 *  - --color-* 구 토큰 → DS v4 (--ink/--ink-mute/--ink-dim/--accent/--border 등)
 *  - Material Symbols Outlined 아이콘 유지 (lucide 금지)
 *  - 신규 fetch 0 / API 변경 0
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
  // 인증 코드 카운트다운(180초). 코드 발송 시점부터 시작 (시안 박제)
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

  // 전화번호 인증 코드 발송
  const sendCode = async () => {
    // PhoneInput 포맷된 값("010-1234-5678") → 하이픈 제거 후 API 전송
    const phoneDigits = phone.replace(/-/g, "");
    if (!phoneDigits.match(/^01[016789]\d{7,8}$/)) {
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
        body: JSON.stringify({ phone: phoneDigits }),
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
          // PhoneInput 포맷 → submit 시 하이픈 제거 (서버는 숫자만 기대)
          phone: needsPhone ? phone.replace(/-/g, "") : undefined,
          code: needsPhone ? verifyCode : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // 인증 완료 후 user 상태에 따라 redirect 분기
        //   profile_completed = false → /profile/complete
        //   onboarding_completed_at = null → /onboarding/setup
        //   모두 완료 → /
        try {
          const profileRes = await fetch("/api/web/profile", {
            credentials: "include",
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            // apiSuccess 자동 snake_case 변환 (errors.md 6회 재발 가드)
            const u = profile?.user;
            if (u && !u.profile_completed) {
              router.push("/profile/complete");
            } else if (u && !u.onboarding_completed_at) {
              router.push("/onboarding/setup");
            } else {
              router.push("/");
            }
          } else {
            router.push("/onboarding/setup");
          }
        } catch {
          router.push("/onboarding/setup");
        }
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
  // 진행 단계: input(1단계) → verify-phone(2단계)
  const stepActive = step === "verify-phone" ? 2 : 1;

  return (
    <div className="page" style={{ maxWidth: 480 }}>
      {/* 헤더: eyebrow + 타이틀 + 설명 (시안 Verify.jsx 1:1) */}
      <div className="eyebrow" style={{ marginBottom: 8 }}>온보딩 1/2 · VERIFY</div>
      <h1 style={{
        margin: "8px 0 6px",
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: "var(--ink)",
      }}>
        {needsPhone ? "전화번호 인증" : "이메일 인증"}
      </h1>
      <p style={{ color: "var(--ink-mute)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        {needsPhone
          ? "매치 신청·대회 알림을 받으려면 전화번호 인증이 필요해요. SMS로 6자리 인증번호를 보냅니다."
          : "서비스 알림 수신을 위해 이메일 인증이 필요해요."}
      </p>

      {/* 진행 표시줄 (시안 2단계 progress bar) */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        <div style={{
          flex: 1, height: 4,
          background: stepActive >= 1 ? "var(--cafe-blue)" : "var(--border)",
          borderRadius: 2,
        }} />
        <div style={{
          flex: 1, height: 4,
          background: stepActive >= 2 ? "var(--ok)" : "var(--border)",
          borderRadius: 2,
        }} />
      </div>

      {/* ── 1단계: 전화번호 입력 ── */}
      {needsPhone && step === "input" && (
        <div className="card" style={{ padding: "24px 26px" }}>
          {error && (
            <div style={{
              marginBottom: 14,
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--danger)",
              fontSize: 13,
            }}>
              {error}
            </div>
          )}
          <label className="label">휴대전화번호</label>
          {/* PhoneInput — 사이트 전역 의무 사용 컴포넌트 (conventions.md). className=input으로 DS v4 스타일 주입 */}
          <PhoneInput
            value={phone}
            onChange={(v) => setPhone(v)}
            autoFocus
            className="input"
          />
          <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 8, lineHeight: 1.6 }}>
            ※ 입력하신 번호는 본인 확인과 알림 외 목적으로 사용되지 않습니다.
          </div>
          {/* 이메일도 필요한 경우 같은 카드에 추가 */}
          {needsEmail && (
            <div style={{ marginTop: 14 }}>
              <label className="label">
                이메일{" "}
                <span style={{ fontWeight: 400, color: "var(--ink-dim)" }}>(선택)</span>
              </label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </div>
          )}
          <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
            <button
              className="btn btn--primary btn--xl"
              onClick={handleSubmit}
              disabled={sending || !phone}
            >
              {/* 발송 중 SMS 아이콘 숨김 — 텍스트만 (시안 패턴) */}
              {!sending && (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sms</span>
              )}
              {sending ? "발송 중..." : "인증번호 받기"}
            </button>
          </div>
        </div>
      )}

      {/* ── 2단계: 인증 코드 입력 ── */}
      {needsPhone && step === "verify-phone" && (
        <div className="card" style={{ padding: "24px 26px" }}>
          {error && (
            <div style={{
              marginBottom: 14,
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--danger)",
              fontSize: 13,
            }}>
              {error}
            </div>
          )}
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 6 }}>
            {phone} 으로 발송됨
          </div>
          {/* [개발 모드] 인증 코드 노출 — 경고 토큰 (semantic 일치) */}
          {sentCode && (
            <div style={{
              marginBottom: 10,
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--cafe-blue-deep)",
              fontSize: 12,
            }}>
              [개발 모드] 인증 코드: <strong>{sentCode}</strong>
            </div>
          )}
          <label className="label">인증번호 6자리</label>
          <input
            className="input"
            inputMode="numeric"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="000000"
            autoFocus
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 22,
              letterSpacing: ".4em",
              textAlign: "center",
            }}
          />
          {/* 남은 시간 + 재전송 한 줄 */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
            fontSize: 12,
            color: "var(--ink-mute)",
          }}>
            <span>
              남은 시간{" "}
              <b style={{ color: "var(--accent)", fontFamily: "var(--ff-mono)" }}>
                {fmt(secondsLeft)}
              </b>
            </span>
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              onClick={sendCode}
              disabled={sending}
            >
              재전송
            </button>
          </div>
          <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
            <button
              className="btn btn--primary btn--xl"
              type="button"
              disabled={saving || verifyCode.length < 6}
              onClick={handleSubmit}
            >
              {saving ? "확인 중..." : "인증 확인"}
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => {
                setStep("input");
                setVerifyCode("");
                setSentCode("");
              }}
              style={{ fontSize: 13 }}
            >
              번호 다시 입력
            </button>
          </div>
        </div>
      )}

      {/* ── 이메일만 필요한 경우 ── */}
      {!needsPhone && needsEmail && (
        <div className="card" style={{ padding: "24px 26px" }}>
          {error && (
            <div style={{
              marginBottom: 14,
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--danger)",
              fontSize: 13,
            }}>
              {error}
            </div>
          )}
          <label className="label">이메일</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            autoFocus
          />
          <div style={{ marginTop: 18 }}>
            <button
              className="btn btn--primary btn--xl"
              type="button"
              onClick={handleSubmit}
              disabled={saving || !email}
            >
              {saving ? "저장 중..." : "완료"}
            </button>
          </div>
        </div>
      )}

      {/* 나중에 (홈으로) — 이메일만 필요한 경우(skipable)에만 노출 */}
      {skipable && (
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            marginTop: 16,
            width: "100%",
            textAlign: "center",
            fontSize: 12,
            color: "var(--ink-mute)",
            background: "transparent",
            border: 0,
            cursor: "pointer",
          }}
        >
          나중에 (홈으로)
        </button>
      )}
    </div>
  );
}
