/* ============================================================
 * (web) 그룹 전용 not-found 페이지 — 대회 직전 §D-3 (Step 3)
 *
 * 왜 (web) 그룹 안에 두는가:
 *   - Next.js App Router 는 가장 가까운 not-found.tsx 를 적용.
 *   - 이 파일을 (web)/ 안에 두면 (web)/layout.tsx 가 자동으로 감싸 헤더/푸터가 그대로 노출됨.
 *   - 루트 not-found 는 (site) 서브도메인까지 영향 가므로 (web) 한정으로 분리.
 *
 * 박제 룰 준수:
 *   - var(--*) 토큰만, 하드코딩 색상 0건
 *   - Material Symbols Outlined (lucide-react 금지)
 *   - .btn 클래스 사용 (radius 4px 글로벌 룰 준수)
 *   - alert 신규 0건, API/data fetch 0건
 * ============================================================ */

import Link from "next/link";

export default function NotFoundPage() {
  return (
    // 좁은 컬럼(520px) + 상하 여백 — 본문 가독성 우선. 모바일에선 좌우 인라인 패딩으로 자연 축소.
    <div className="page" style={{ maxWidth: 520, margin: "60px auto", padding: "0 16px", textAlign: "center" }}>
      {/* 시안 톤: 큰 아이콘 1개 + 짧은 헤드라인 + 한 줄 안내. 농구 관련 search_off(검색 차단) 매핑 */}
      <span
        className="material-symbols-outlined"
        aria-hidden
        style={{ fontSize: 64, color: "var(--ink-mute)" }}
      >
        search_off
      </span>
      <h1
        style={{
          margin: "16px 0 8px",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.01em",
        }}
      >
        페이지를 찾을 수 없습니다
      </h1>
      <p
        style={{
          color: "var(--ink-mute)",
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        요청하신 페이지가 이동했거나 삭제되었을 수 있습니다.
      </p>
      {/* 빠른 진입 3 CTA — 메인(홈) 1 + 보조(경기/대회) 2. flex-wrap 으로 모바일 자동 줄바꿈 */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn btn--primary">
          홈으로 →
        </Link>
        <Link href="/games" className="btn">
          경기 둘러보기
        </Link>
        <Link href="/tournaments" className="btn">
          대회 보기
        </Link>
      </div>
    </div>
  );
}
