"use client";

import { useEffect, useState } from "react";
import { captureException } from "@/lib/utils/error-tracker";

// 글로벌 에러 페이지: 예상치 못한 에러 발생 시 Next.js가 자동으로 이 컴포넌트를 보여줌
// "use client" 필수 — 에러 바운더리는 클라이언트 컴포넌트여야 함
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // super_admin / dev 환경 판정 상태 — 진단 details 박스 노출 여부 결정
  // 이유: 운영 사용자에게 stack trace 노출하면 보안 정보 누출.
  //       super_admin 또는 NODE_ENV !== "production" 에서만 상세 표시.
  const [showDetails, setShowDetails] = useState(false);

  // 에러 발생 시 추적 서비스에 자동 보고
  useEffect(() => {
    captureException(error, {
      context: "error.tsx",
      extra: { digest: error.digest },
    });

    // dev 환경이면 즉시 상세 표시 (네트워크 호출 불필요)
    // 이유: 로컬/Vercel preview 에서 항상 디버깅 가능해야 함
    if (process.env.NODE_ENV !== "production") {
      setShowDetails(true);
      return;
    }

    // 운영 환경: /api/web/me 로 role 조회 — super_admin 이면 상세 노출
    // 이유: error.tsx 가 client component 라 cookie 직접 검사 불가 → fetch 로 세션 정보 받음
    fetch("/api/web/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        // apiSuccess(data) = NextResponse.json(data) 직접 반환 (래핑 X).
        // /api/web/me 응답: { id, email, name, role, ... } — top level role 확인.
        const role = res?.role;
        if (role === "super_admin") {
          setShowDetails(true);
        }
      })
      .catch(() => {
        // 세션 조회 실패는 무시 — 일반 사용자 화면 유지
      });
  }, [error]);

  return (
    <div
      style={{
        // 화면 전체를 차지하는 중앙 정렬 레이아웃
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        // CSS 변수로 테마 색상 적용 (다크/라이트 자동 대응)
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text-primary)",
      }}
    >
      {/* Material Symbols 에러 아이콘 */}
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "64px",
          color: "var(--color-error)",
          marginBottom: "16px",
        }}
      >
        error
      </span>

      <h1
        style={{
          fontSize: "24px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        문제가 발생했습니다
      </h1>

      <p
        style={{
          fontSize: "15px",
          color: "var(--color-text-secondary)",
          marginBottom: "24px",
          textAlign: "center",
          maxWidth: "360px",
          lineHeight: "1.5",
        }}
      >
        일시적인 오류가 발생했습니다. 아래 버튼을 눌러 다시 시도하거나, 잠시 후 다시 방문해주세요.
      </p>

      {/* reset() 호출 시 React가 에러 바운더리를 초기화하고 컴포넌트를 다시 렌더링 */}
      <button
        onClick={reset}
        style={{
          padding: "10px 24px",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-text-on-primary)",
          border: "none",
          borderRadius: "4px", // pill 금지, 4px 규칙
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        다시 시도
      </button>

      {/*
        super_admin / dev 전용 상세 박스
        이유: 운영에서 에러가 잡혀도 일반 사용자에게는 안 보이고, 디버깅 권한자만 stack 확인 가능.
        details 태그 = 클릭으로 펼침/접힘 (기본 닫힌 상태) — 화면 차지 최소화.
      */}
      {showDetails && (
        <details
          style={{
            marginTop: "32px",
            padding: "16px",
            backgroundColor: "var(--color-elevated)",
            borderRadius: "8px",
            maxWidth: "720px",
            width: "100%",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              userSelect: "none",
            }}
          >
            에러 상세 (관리자용)
          </summary>
          <pre
            style={{
              marginTop: "12px",
              fontSize: "12px",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "var(--color-text-primary)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {error.message}
            {error.digest && `\ndigest: ${error.digest}`}
            {error.stack && `\n\n${error.stack.split("\n").slice(0, 8).join("\n")}`}
          </pre>
        </details>
      )}
    </div>
  );
}
