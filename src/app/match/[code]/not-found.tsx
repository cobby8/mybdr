import Link from "next/link";

/**
 * 매치 코드 v4 deep link 404 페이지
 *
 * 발동 조건:
 * - 매치 코드 형식 오류 (`/match/INVALID` 등 정규식 미일치)
 * - 정규식은 통과하지만 DB 미존재 (`/match/26-XX-YY99-999` 등)
 *
 * 디자인: BDR-current 13룰 — `var(--*)` 토큰만 / 단순 fallback (AppNav 미렌더 — 루트 라우트)
 */
export default function MatchCodeNotFound() {
  return (
    <div
      style={{
        padding: "60px 20px",
        textAlign: "center",
        maxWidth: 600,
        margin: "0 auto",
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        color: "var(--color-text-primary)",
      }}
    >
      {/* 큰 코드명 — 디자인 토큰 보존 */}
      <h1 style={{ fontSize: 24, marginBottom: 12, fontWeight: 700 }}>
        매치를 찾을 수 없습니다
      </h1>
      <p
        style={{
          color: "var(--color-text-secondary)",
          marginBottom: 24,
          lineHeight: 1.6,
          fontSize: 14,
        }}
      >
        입력하신 매치 코드가 잘못되었거나, 매치가 삭제되었을 수 있습니다.
        <br />
        URL 의 코드를 다시 확인해주세요.
      </p>
      <div>
        <Link
          href="/"
          style={{
            color: "var(--color-accent)",
            textDecoration: "underline",
            fontSize: 14,
          }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
