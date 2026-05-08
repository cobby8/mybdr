/* ============================================================
 * HomeHeader — 홈 페이지 최상단 Hero 헤더 (BDR v2 시안 line 43~75 박제)
 *
 * 왜 (이유):
 *   시안 Home.jsx 의 첫 영역 — eyebrow + h1 + 통계 1줄 + 검색/모집글 작성
 *   CTA 2개 — 가 운영 page.tsx 에 누락. 시안 50% → 70% 도달을 위한 Phase 1
 *   첫 작업 (planner 보고서 `Dev/home-design-full-alignment-2026-05-09.md` Q1 채택).
 *
 * 어떻게 (방법):
 *   - server component (props 받아 정적 렌더). 인터랙션은 <Link> 라우팅 만.
 *   - 시안 line 46~75 인라인 style 그대로 카피. 시안 setRoute() → Next.js Link.
 *   - 통계 onlineNow 가 null 이면 "지금 접속 중" 부분 생략 (DB 미보유 폴백).
 *   - 모바일 4 분기점 가드 (5/9 conventions.md): 720px h1 22px + 360px CTA 라벨 hidden.
 *   - 컴포넌트 내부 <style> 태그로 가드 — globals.css 비손 (단일 책임).
 *
 * 룰:
 *   - BDR v2 토큰 (`var(--*)`) 100%. Tailwind 임의 클래스 / 핑크·살몬 ❌
 *   - Material Symbols Outlined 아이콘 (lucide-react ❌)
 *   - AppNav frozen 영향 0 (페이지 본문 영역 컴포넌트)
 *   - API/DB/Flutter v1 영향 0 (props 만 사용)
 * ============================================================ */

import Link from "next/link";

interface HomeHeaderProps {
  /** 전체 회원 수 (statsData.user_count) */
  members: number;
  /** 지금 접속자 수 — DB 실시간 카운트 미보유 시 null/undefined → 라벨 생략 */
  onlineNow?: number | null;
}

export function HomeHeader({ members, onlineNow }: HomeHeaderProps) {
  // 통계 1줄 메시지 — onlineNow null 이면 "지금 접속 중" 부분 생략
  // (시안의 placeholder 숫자를 가짜로 띄우지 않고 솔직하게 빠진 채 표시)
  const hasOnline = typeof onlineNow === "number" && onlineNow > 0;
  const memberLabel = `전국 ${members.toLocaleString()}명의 플레이어`;
  const onlineLabel = hasOnline ? ` · 지금 ${onlineNow!.toLocaleString()}명 접속 중` : "";

  return (
    <>
      <header
        className="home-header"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "flex-end",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        {/* 좌측 — eyebrow + h1 + 통계 1줄 */}
        <div style={{ minWidth: 0 }}>
          {/* eyebrow — globals.css .eyebrow 클래스 (좌측 18×2 빨간 라인 자동 추가) */}
          <div className="eyebrow">전국 농구 매칭 플랫폼</div>

          {/* h1 — display 폰트 + ellipsis (모바일에선 가드로 정상 wrap 으로 전환) */}
          <h1
            style={{
              margin: "6px 0 4px",
              fontFamily: "var(--ff-display)",
              fontSize: "var(--fs-h1)",
              fontWeight: 800,
              letterSpacing: "-0.015em",
              lineHeight: 1.1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            오늘도 <span style={{ color: "var(--accent)" }}>코트</span>에서 만나요
          </h1>

          {/* 통계 1줄 — onlineNow 없으면 회원 수만 */}
          <div
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {memberLabel}
            {onlineLabel}
          </div>
        </div>

        {/* 우측 — CTA 2개: 검색 / 모집글 작성 (accent) */}
        <div
          className="home-header__cta"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: "0 0 auto",
          }}
        >
          {/* 검색 — 운영 /search 라우트 존재 확인 (5/9) */}
          <Link
            href="/search"
            className="btn btn--sm"
            aria-label="검색"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              search
            </span>
            <span className="home-header__cta-label">검색</span>
          </Link>

          {/* 모집글 작성 — 운영 /games/new 라우트 존재 확인 (5/9). accent = BDR 레드 */}
          <Link
            href="/games/new"
            className="btn btn--sm btn--accent"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              add
            </span>
            <span className="home-header__cta-label">모집글 작성</span>
          </Link>
        </div>
      </header>

      {/* 모바일 4 분기점 가드 (5/9 conventions.md 신규 룰)
       *  - 720px : h1 22px + white-space normal (시안 line 188 박제)
       *  - 360px : CTA 라벨 hidden (아이콘만) — 한 손 그립 영역 보호
       *  컴포넌트 스코프 <style> — globals.css 침범 0. */}
      <style>{`
        @media (max-width: 720px) {
          .home-header h1 {
            font-size: 22px !important;
            white-space: normal !important;
          }
        }
        @media (max-width: 360px) {
          .home-header__cta-label {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
