"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * 비밀번호 찾기 페이지 — 2026-06-07 Phase 7C-2 박제 (v2.27 AU3 ForgotView)
 *
 * 이유(왜):
 *   기존 forgot-password 는 "성공 메시지" 텍스트 박스만 있어 전송 후 사용자가
 *   다음 행동(메일함 확인 / 다른 이메일 재시도)을 안내받지 못했음. 시안 AU3 는
 *   전송 성공 시 mark_email_read 아이콘 + 안내 hero + "다른 이메일로 다시 보내기"
 *   를 제공 → 전송 후 이탈 방지.
 *
 * 어떻게:
 *   - 전송 성공(message 수신) 시 입력 폼 대신 결과 hero 렌더 (시안 au-result--mail 톤)
 *   - "다른 이메일로 다시 보내기" → 상태 초기화 후 입력 폼 복귀
 *   - 입력 폼은 send 아이콘 버튼 + 시안 톤으로 정리
 *
 * 보존 (데이터 패칭 0 변경):
 *   - handleSubmit / fetch("/api/web/auth/forgot-password") / 응답 message·reset_token
 *   - 개발용 devToken 표시 + /reset-password?token= 링크 (개발 흐름 유지)
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // 개발용: API 응답에 포함된 토큰을 보여준다
  const [devToken, setDevToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setDevToken("");

    try {
      const res = await fetch("/api/web/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "요청에 실패했습니다.");
      }

      setMessage(data.message);
      // 개발 환경에서 토큰이 응답에 포함된 경우
      if (data.reset_token) {
        setDevToken(data.reset_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 다른 이메일로 다시 보내기 — 결과 hero → 입력 폼 복귀 (상태 초기화)
  const handleRetry = () => {
    setMessage("");
    setDevToken("");
    setError("");
  };

  return (
    <div className="page" style={{ maxWidth: 520, paddingTop: 60, margin: "0 auto" }}>
      {/* 헤더 (시안 AuthBrand slogan="비밀번호 재설정" 톤) */}
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
        비밀번호 찾기
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          color: "var(--ink-mute)",
          textAlign: "center",
          fontSize: 14,
        }}
      >
        가입한 이메일로 재설정 링크를 보내드려요
      </p>

      <div className="card" style={{ padding: "28px 28px" }}>
        {/* 전송 성공 시: 결과 hero (시안 au-result--mail) — 입력 폼 대체 */}
        {message ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            {/* mark_email_read 아이콘 (시안 au-result__icon) */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                margin: "0 auto 14px",
                display: "grid",
                placeItems: "center",
                background: "var(--cafe-blue-soft)",
                color: "var(--cafe-blue)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 38 }}>
                mark_email_read
              </span>
            </div>
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: 20,
                fontWeight: 800,
                color: "var(--ink)",
              }}
            >
              메일을 확인하세요
            </h2>
            <p
              style={{
                margin: "0 0 18px",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--ink-mute)",
              }}
            >
              <strong style={{ color: "var(--ink)" }}>{email || "you@example.com"}</strong>
              로 비밀번호 재설정 링크를 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요.
            </p>

            {/* 개발용: 토큰 직접 표시 + 재설정 페이지 링크 (개발 흐름 보존) */}
            {devToken && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 12px",
                  borderRadius: 8,
                  textAlign: "left",
                  background: "var(--cafe-blue-soft)",
                  color: "var(--cafe-blue-deep)",
                  fontSize: 13,
                }}
              >
                <p style={{ margin: "0 0 6px", fontWeight: 700 }}>[개발용] 재설정 토큰:</p>
                <p
                  style={{
                    margin: "0 0 8px",
                    wordBreak: "break-all",
                    fontSize: 11,
                    color: "var(--ink-mute)",
                  }}
                >
                  {devToken}
                </p>
                <Link
                  href={`/reset-password?token=${devToken}`}
                  className="link"
                  style={{ fontWeight: 600, color: "var(--cafe-blue)" }}
                >
                  비밀번호 재설정 페이지로 이동
                </Link>
              </div>
            )}

            {/* 다른 이메일로 다시 보내기 (시안 au-btn--ghost) */}
            <button
              type="button"
              className="btn"
              onClick={handleRetry}
              style={{ width: "100%" }}
            >
              다른 이메일로 다시 보내기
            </button>
          </div>
        ) : (
          <>
            {/* 에러 메시지 */}
            {error && (
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
                {error}
              </div>
            )}

            {/* 이메일 입력 폼 */}
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <div className="label">이메일</div>
                <input
                  className="input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  style={{ marginTop: 6 }}
                />
              </div>
              {/* 전송 버튼 (시안 send 아이콘) */}
              <button
                type="submit"
                className="btn btn--primary btn--xl"
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {!loading && (
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    send
                  </span>
                )}
                {loading ? "전송 중..." : "재설정 링크 전송"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* 풋터: 로그인으로 돌아가기 (시안 au-foot) */}
      <div
        style={{
          textAlign: "center",
          marginTop: 18,
          fontSize: 13,
          color: "var(--ink-mute)",
        }}
      >
        <Link href="/login" style={{ color: "var(--ink-mute)", fontWeight: 600 }}>
          ← 로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
