import Link from "next/link";
import type { Metadata } from "next";

// SEO: 404 페이지 메타데이터
export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요 | MyBDR",
};

/* ============================================================
 * 404 NotFound — BDR v2 (1) screens/NotFound.jsx 1:1 박제 (Phase 9 P1-1a)
 *
 * 이유(왜):
 *   기존 Phase 5의 More.jsx L3-20 "에어볼!" 카피 → Phase 9 공식 시안
 *   (screens/NotFound.jsx 24줄)으로 재교체. 시안의 maxWidth:480, eyebrow,
 *   H1 카피("요청한 페이지를 찾을 수 없어요"), btn--ghost 도움말 패턴을
 *   1:1로 박제.
 *
 * 디자인 토큰:
 *   - color: var(--accent) 거대 404, var(--ink-mute) 본문
 *   - font: var(--ff-display) 거대 숫자
 *   - layout: .page + minHeight 60vh + grid placeItems center
 *
 * 버튼 라우팅 (시안 setRoute → Next.js Link):
 *   - 홈으로 (primary)  → /
 *   - 검색              → /search
 *   - 도움말 (ghost)    → /help
 *
 * 서버 컴포넌트: 시안에 useState/onClick 인터랙션 없음 → "use client" 불필요.
 * ============================================================ */
export default function NotFound() {
  return (
    <div
      className="page"
      style={{
        // 시안 그대로: 60vh 중앙 정렬
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
      }}
    >
      {/* 시안 maxWidth:480 컨테이너 */}
      <div style={{ maxWidth: 480 }}>
        {/* 거대 404 — 시안 fontSize:120, fontWeight:900, accent 컬러 */}
        <div
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "var(--accent)",
          }}
        >
          404
        </div>

        {/* EYEBROW — v2 공통 .eyebrow 클래스, 중앙 정렬 */}
        <div
          className="eyebrow"
          style={{ justifyContent: "center", marginTop: 8 }}
        >
          PAGE NOT FOUND
        </div>

        {/* 메인 카피 — 시안 24px/700, margin 14/0/10 */}
        <h1
          style={{
            margin: "14px 0 10px",
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          요청한 페이지를 찾을 수 없어요
        </h1>

        {/* 보조 설명 — 시안 lineHeight:1.7, marginBottom:24 */}
        <p
          style={{
            color: "var(--ink-mute)",
            fontSize: 14,
            lineHeight: 1.7,
            marginBottom: 24,
          }}
        >
          주소가 변경되었거나 삭제된 페이지일 수 있습니다.
          <br />
          홈으로 돌아가거나 검색을 통해 다시 찾아보세요.
        </p>

        {/* CTA 3버튼 — Primary 홈 / Default 검색 / Ghost 도움말 */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Primary CTA: 홈 */}
          <Link href="/" className="btn btn--primary">
            홈으로
          </Link>
          {/* 검색 → Phase 2 글로벌 검색 페이지 */}
          <Link href="/search" className="btn">
            검색
          </Link>
          {/* 도움말 → 시안 /help (ghost 스타일) */}
          <Link href="/help" className="btn btn--ghost">
            도움말
          </Link>
        </div>
      </div>
    </div>
  );
}
