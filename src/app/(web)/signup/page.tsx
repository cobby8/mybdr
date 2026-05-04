"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signupAction } from "@/app/actions/auth";
import { PasswordInput } from "@/components/ui/password-input";

// 이유: OAuth 콜백 실패 시 ?error=... 쿼리로 진입 → 사용자에게 안내 (기존 패턴 유지)
const OAUTH_ERRORS: Record<string, string> = {
  kakao_token: "카카오 로그인에 실패했습니다.",
  kakao_fail: "카카오 로그인 중 오류가 발생했습니다.",
  naver_token: "네이버 로그인에 실패했습니다.",
  naver_fail: "네이버 로그인 중 오류가 발생했습니다.",
  google_token: "구글 로그인에 실패했습니다.",
  google_fail: "구글 로그인 중 오류가 발생했습니다.",
};

/**
 * 회원가입 — 2026-05-04 가입 흐름 통합 (F1)
 *
 * 이유(왜):
 *   기존 3-step 위저드 (계정 + 프로필 + 활동환경) 가입 직후 바로 모든 정보를 받느라
 *   가입 이탈률 증가. 사용자 결정 = 가입 단계는 "이메일 + 비밀번호 + 닉네임 + 약관"
 *   4 항목으로 압축, 포지션·키·등번호·지역·실력·게임유형은 가입 이후 /profile/edit 에서
 *   천천히 입력하도록 흐름 통합.
 *
 * 어떻게:
 *   - useState<1|2|3>(step) 제거 → 단일 폼
 *   - Step 2 (포지션·키·등번호) UI 전체 제거
 *   - Step 3 (지역·실력·게임유형) UI 전체 제거
 *   - 진행 인디케이터 (1·2·3) + "이전/다음" 버튼 → "가입하기" 단일 버튼
 *   - hidden inputs 6건 제거 (position/height/jersey_number/preferred_regions/skill_level/preferred_game_types)
 *   - 상수 / state / 토글 헬퍼 모두 제거
 *
 * 보존:
 *   - PasswordInput + autoComplete (username/new-password) — 자동완성 차단 (직전 commit d248e50)
 *   - OAuth 3종 (kakao/naver/google) — 가입 흐름 무관, callback 변경 0
 *   - signupAction → /login?signup=success redirect (자동 로그인 ❌, 직전 commit d248e50)
 */
export default function SignupPage() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  // 이유: 단일 폼 — 4 항목 모두 controlled input (state 동기화로 hidden input 불필요해졌으나
  //       value/onChange 패턴은 유지. name 속성으로 formData 자동 수신).
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [agreed, setAgreed] = useState(false);

  // 이유: 약관 미동의 시 클라이언트 차단 (서버 액션 도달 전 UX 차단). 서버 액션 자체는 약관 검증 없음.
  const [clientError, setClientError] = useState<string | null>(null);

  // 이유: signupAction 그대로 사용 — useActionState 로 서버 에러 수신
  const [serverState, formAction, pending] = useActionState(signupAction, null);

  // 이유: 약관 미동의 시 submit 차단. 그 외 검증 (이메일 형식 / 비번 8자 / 일치)은 서버 액션이 수행.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!agreed) {
      e.preventDefault();
      setClientError("이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }
    setClientError(null);
    // 약관 동의 시 form action (signupAction) 정상 진행
  }

  return (
    <div className="page" style={{ maxWidth: 520, paddingTop: 60, margin: "0 auto" }}>
      {/* 헤딩 */}
      <h1
        style={{
          margin: "0 0 6px",
          fontSize: 28,
          fontWeight: 800,
          textAlign: "center",
          letterSpacing: "-0.015em",
          color: "var(--ink)",
        }}
      >
        계정 만들기
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          color: "var(--ink-mute)",
          textAlign: "center",
          fontSize: 14,
        }}
      >
        이메일, 비밀번호, 닉네임만 있으면 시작할 수 있어요
      </p>

      {/* form action = signupAction. onSubmit 은 약관 동의 가드만 수행 */}
      <form action={formAction} onSubmit={handleSubmit}>
        <div className="card" style={{ padding: "28px 28px" }}>
          {/* OAuth 에러 표시 (있을 때만) */}
          {oauthError && OAUTH_ERRORS[oauthError] && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--accent-soft)",
                color: "var(--danger)",
                fontSize: 13,
              }}
            >
              {OAUTH_ERRORS[oauthError]}
            </div>
          )}

          {/* 클라이언트 가드 에러 (약관 미동의) */}
          {clientError && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--accent-soft)",
                color: "var(--danger)",
                fontSize: 13,
              }}
            >
              {clientError}
            </div>
          )}

          {/* 서버 액션 에러 */}
          {serverState?.error && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--accent-soft)",
                color: "var(--danger)",
                fontSize: 13,
              }}
            >
              {serverState.error}
            </div>
          )}

          {/* ─────────── 입력 필드 4종 ─────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div className="label">이메일</div>
              {/* autoComplete="username" — 클릭 시 dropdown 방식, 페이지 진입 자동 채움 차단 */}
              <input
                className="input"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ marginTop: 6 }}
              />
            </div>

            <div>
              <div className="label">비밀번호</div>
              {/* PasswordInput (보기 버튼 통합) + autoComplete="new-password" 자동완성 차단 */}
              <PasswordInput
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상"
                style={{ marginTop: 6 }}
              />
              <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>
                8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다
              </div>
            </div>

            <div>
              <div className="label">비밀번호 확인</div>
              <PasswordInput
                name="password_confirm"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
                style={{ marginTop: 6 }}
              />
            </div>

            <div>
              <div className="label">닉네임</div>
              {/* 2~20자 검증은 서버 액션이 수행 — 클라이언트는 UX 단순함 우선 */}
              <input
                className="input"
                name="nickname"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="2~20자"
                style={{ marginTop: 6 }}
              />
            </div>

            {/* 약관 동의 — 미동의 시 onSubmit 차단 */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                marginTop: 6,
                color: "var(--ink)",
              }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                <Link href="/terms" className="link" style={{ color: "var(--cafe-blue)" }}>
                  이용약관
                </Link>
                {" 및 "}
                <Link href="/privacy" className="link" style={{ color: "var(--cafe-blue)" }}>
                  개인정보처리방침
                </Link>
                에 동의합니다
              </span>
            </label>

            {/* 가입하기 단일 버튼 */}
            <button
              type="submit"
              className="btn btn--primary btn--xl"
              style={{ marginTop: 10 }}
              disabled={pending}
            >
              {pending ? "가입 중..." : "가입하기"}
            </button>

            {/* OAuth 3종 — 시안 외 보존 (간편 가입) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "8px 0 4px",
                color: "var(--ink-dim)",
                fontSize: 12,
              }}
            >
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              또는 간편 가입
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {/* 카카오 */}
              <a
                className="btn"
                href="/api/auth/login?provider=kakao"
                style={{ background: "#FEE500", borderColor: "#FEE500", color: "#000" }}
              >
                카카오
              </a>
              {/* 네이버 */}
              <a
                className="btn"
                href="/api/auth/login?provider=naver"
                style={{ background: "#03C75A", borderColor: "#03C75A", color: "#fff" }}
              >
                네이버
              </a>
              {/* 구글 */}
              <a
                className="btn"
                href="/api/auth/login?provider=google"
                style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
              >
                Google
              </a>
            </div>
          </div>
        </div>
      </form>

      {/* 풋터: 로그인 링크 */}
      <div
        style={{
          textAlign: "center",
          marginTop: 18,
          fontSize: 13,
          color: "var(--ink-mute)",
        }}
      >
        이미 계정이 있으신가요?{" "}
        <Link
          href="/login"
          style={{ color: "var(--cafe-blue)", fontWeight: 600 }}
        >
          로그인
        </Link>
      </div>
    </div>
  );
}
