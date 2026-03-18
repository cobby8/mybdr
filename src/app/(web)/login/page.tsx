"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, signupAction, devLoginAction } from "@/app/actions/auth";

const OAUTH_ERRORS: Record<string, string> = {
  kakao_token: "카카오 로그인에 실패했습니다.",
  kakao_fail: "카카오 로그인 중 오류가 발생했습니다.",
  naver_token: "네이버 로그인에 실패했습니다.",
  naver_fail: "네이버 로그인 중 오류가 발생했습니다.",
  google_token: "구글 로그인에 실패했습니다.",
  google_fail: "구글 로그인 중 오류가 발생했습니다.",
};

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, null);
  const [signupState, signupFormAction, signupPending] = useActionState(signupAction, null);
  const [devState, devFormAction, devPending] = useActionState(devLoginAction, null);
  const searchParams = useSearchParams();

  const oauthError = searchParams.get("error");
  const isLogin = mode === "login";
  const error = isLogin ? loginState?.error : signupState?.error;
  const pending = isLogin ? loginPending : signupPending;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="mb-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="BDR" className="mx-auto mb-2 h-16 w-auto" />
        <p className="text-sm text-[#6B7280]">농구인을 위한 농구 플랫폼</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* OAuth 에러 */}
        {oauthError && OAUTH_ERRORS[oauthError] && (
          <div className="rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {OAUTH_ERRORS[oauthError]}
          </div>
        )}

        {/* 간편 로그인 */}
        <div className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
          <p className="mb-4 text-center text-sm font-medium text-[#6B7280]">간편 로그인</p>
          <div className="flex flex-col gap-2.5">
            {/* 카카오 */}
            <a
              href="/api/auth/login?provider=kakao"
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FEE500", color: "#191919" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 1C4.58 1 1 3.8 1 7.2c0 2.2 1.46 4.13 3.66 5.23l-.93 3.42c-.08.3.26.54.52.36L8.1 13.6c.3.03.6.05.9.05 4.42 0 8-2.8 8-6.25S13.42 1 9 1" fill="#191919"/></svg>
              <span className="text-sm font-semibold">카카오로 시작하기</span>
            </a>
            {/* 네이버 */}
            <a
              href="/api/auth/login?provider=naver"
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#03C75A", color: "#FFFFFF" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10.85 8.55L4.92 0H0v16h5.15V7.45L11.08 16H16V0h-5.15v8.55z" fill="white"/></svg>
              <span className="text-sm font-semibold">네이버로 시작하기</span>
            </a>
            {/* 구글 */}
            <a
              href="/api/auth/login?provider=google"
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-[#E8ECF0] bg-white transition-colors hover:bg-[#F5F7FA]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              <span className="text-sm font-medium text-[#374151]">Google로 시작하기</span>
            </a>
          </div>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E8ECF0]" />
          <span className="text-xs text-[#9CA3AF]">또는</span>
          <div className="h-px flex-1 bg-[#E8ECF0]" />
        </div>

        {/* 이메일 로그인/회원가입 */}
        <div className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
          {/* 탭 */}
          <div className="mb-4 flex rounded-full bg-[#F5F7FA] p-1">
            <button type="button" onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${isLogin ? "bg-[#1B3C87] text-white" : "text-[#6B7280]"}`}>
              이메일 로그인
            </button>
            <button type="button" onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${!isLogin ? "bg-[#1B3C87] text-white" : "text-[#6B7280]"}`}>
              회원가입
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-[10px] bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</div>
          )}

          {isLogin ? (
            <form action={loginFormAction} className="space-y-2.5">
              <input name="email" type="email" required placeholder="이메일"
                className="w-full rounded-[12px] border border-[#E8ECF0] bg-white px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B3C87]/50" />
              <input name="password" type="password" required placeholder="비밀번호"
                className="w-full rounded-[12px] border border-[#E8ECF0] bg-white px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B3C87]/50" />
              <button type="submit" disabled={pending}
                className="w-full rounded-[12px] bg-[#1B3C87] py-3 text-sm font-semibold text-white transition-all hover:bg-[#142D6B] active:scale-[0.98] disabled:opacity-50">
                {pending ? "로그인 중..." : "로그인"}
              </button>
            </form>
          ) : (
            <form action={signupFormAction} className="space-y-2.5">
              <input name="email" type="email" required placeholder="이메일"
                className="w-full rounded-[12px] border border-[#E8ECF0] bg-white px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B3C87]/50" />
              <input name="nickname" type="text" required placeholder="닉네임"
                className="w-full rounded-[12px] border border-[#E8ECF0] bg-white px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B3C87]/50" />
              <input name="password" type="password" required minLength={8} placeholder="비밀번호 (8자 이상)"
                className="w-full rounded-[12px] border border-[#E8ECF0] bg-white px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B3C87]/50" />
              <input name="password_confirm" type="password" required minLength={8} placeholder="비밀번호 확인"
                className="w-full rounded-[12px] border border-[#E8ECF0] bg-white px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B3C87]/50" />
              <button type="submit" disabled={pending}
                className="w-full rounded-[12px] bg-[#E31B23] py-3 text-sm font-semibold text-white transition-all hover:bg-[#C8101E] active:scale-[0.98] disabled:opacity-50">
                {pending ? "가입 중..." : "회원가입"}
              </button>
            </form>
          )}
        </div>

        {/* Dev 로그인 */}
        {process.env.NODE_ENV !== "production" && (
          <form action={devFormAction} className="text-center">
            <button type="submit" disabled={devPending}
              className="text-xs text-[#9CA3AF] underline hover:text-[#6B7280] disabled:opacity-50">
              {devPending ? "..." : "Dev 자동 로그인"}
            </button>
            {devState?.error && <p className="mt-1 text-xs text-red-400">{devState.error}</p>}
          </form>
        )}

        <p className="text-center text-[10px] text-[#9CA3AF]">
          가입 시 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의합니다.
        </p>
      </div>
    </div>
  );
}
