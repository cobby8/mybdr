"use client";

// 2026-04-27: Phase 9 P0-1 — 모바일 가로 스크롤 힌트
// 시안: Dev/design/phase-9-prompts.md (P0-1)
// 사용처: GameResult v2 tab-players, tab-summary 쿼터 스코어, bracket 등
//
// 왜 만드는가:
//  - 모바일(375px)에서 폭 넓은 테이블이 단순 overflow-x:auto 만으로는
//    "스와이프 가능"이라는 단서를 사용자에게 주지 못함.
//  - 우측 페이드 마스크 + 마이크로카피로 "더 볼 게 있다"는 시각 신호 제공.
//
// 동작:
//  1. children 을 overflowX:auto 컨테이너로 감싼다.
//  2. 스크롤 가능(scrollWidth > clientWidth)할 때만 마스크/카피 표시.
//  3. 사용자가 끝까지 스크롤하면 우측 페이드 사라짐(opacity 0).
//  4. 마이크로카피는 모바일(<720px)에서만 노출.

import { useEffect, useRef, useState, type ReactNode } from "react";

export function ScrollableTable({
  children,
  hint = "← 좌우로 스와이프해 모든 통계 보기",
}: {
  children: ReactNode;
  /** 마이크로카피 텍스트. 기본값: "← 좌우로 스와이프해 모든 통계 보기" */
  hint?: string;
}) {
  // 스크롤 컨테이너 ref — scroll 위치/크기 측정용
  const scrollerRef = useRef<HTMLDivElement>(null);
  // 스크롤 가능 여부 (scrollWidth > clientWidth) — 데스크탑에선 false
  const [scrollable, setScrollable] = useState(false);
  // 현재 우측 끝까지 스크롤 됐는지 — true 면 페이드 마스크 숨김
  const [atEnd, setAtEnd] = useState(false);

  // 마운트 시 + 윈도우 리사이즈 시 재측정
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    // 측정 함수 — 스크롤 가능 여부 + 현재 끝 도달 여부를 동시에 갱신
    const measure = () => {
      const canScroll = el.scrollWidth > el.clientWidth + 1;
      setScrollable(canScroll);
      // 끝 판정: scrollLeft + clientWidth 가 scrollWidth 와 1px 이내로 같으면 끝
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };

    // 초기 측정 (콘텐츠 렌더 직후 — 1프레임 양보)
    const raf = requestAnimationFrame(measure);

    // 컨테이너 자체 리사이즈도 추적 (모바일 회전, 사이드바 토글 등)
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // 스크롤 이벤트 — 우측 페이드 표시/숨김 토글만 담당
  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* 마이크로카피 — 모바일 + 스크롤 가능할 때만.
          데스크탑(>=720px) 에서는 CSS @media 로 숨김 */}
      {scrollable && (
        <div
          className="scrollable-table__hint"
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            padding: "6px 12px 4px",
            letterSpacing: ".02em",
          }}
        >
          {hint}
        </div>
      )}

      {/* 스크롤 컨테이너 — 실제 children 이 들어감 */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        style={{
          overflowX: "auto",
          // iOS 스무스 스크롤
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>

      {/* 우측 페이드 마스크 — 스크롤 가능 + 끝 미도달 시에만 표시.
          var(--bg) 그라디언트로 라이트/다크 모드 모두 자연스럽게 fade.
          pointer-events:none 으로 클릭/스크롤 방해 안 함 */}
      {scrollable && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 32,
            background:
              "linear-gradient(to right, transparent 0%, var(--bg) 100%)",
            opacity: atEnd ? 0 : 1,
            transition: "opacity 200ms ease",
            pointerEvents: "none",
          }}
        />
      )}

      {/* 데스크탑에서 hint 숨김 — styled-jsx 로 컴포넌트 스코프 */}
      <style jsx>{`
        @media (min-width: 720px) {
          :global(.scrollable-table__hint) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
