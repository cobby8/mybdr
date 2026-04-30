"use client";

/* ============================================================
 * HeroCarousel — 메인 hero 자동 회전 카로셀 (client component)
 *
 * 왜 이 컴포넌트가 있는가:
 * 4종 슬라이드(대회/게임/MVP/정적)를 5초 간격으로 회전 노출.
 * 자동 회전 + hover 일시정지 + 좌우 화살표 + 점 indicator + 모바일 스와이프 + 키보드.
 * 외부 라이브러리(embla 등) 없이 기본 React + DOM 이벤트만 사용.
 *
 * 핵심 설계 결정:
 *
 * 1) "모든 슬라이드 동시 DOM 렌더 + visibility 토글"
 *    - 슬라이드를 absolute로 겹쳐두고 active 만 opacity:1.
 *    - 장점: SEO(크롤러가 모든 텍스트 인덱싱), 레이아웃 jitter 방지(transform 없음),
 *           서버 컴포넌트로 작성된 슬라이드들을 그대로 children 으로 받을 수 있음.
 *    - 단점: 초기 렌더 비용 약간 증가. 4장 정도면 무시 가능.
 *
 * 2) "active 외 pointer-events: none"
 *    - 안 보이는 슬라이드의 CTA 버튼이 잠깐 클릭되는 사고 방지.
 *
 * 3) "prefers-reduced-motion: reduce 시 자동 회전 OFF"
 *    - 접근성. 사용자가 OS 설정으로 모션을 줄여달라고 했으면 존중.
 *
 * 4) "slides.length <= 1 일 때는 화살표 + 점 + 자동회전 모두 OFF"
 *    - 한 장짜리 캐로셀은 가짜 동작이므로 UI 노이즈 제거.
 *
 * 5) 키보드 접근:
 *    - tabIndex={0} + onKeyDown(ArrowLeft/Right)
 *    - role="region" + aria-label + aria-live="polite"
 * ============================================================ */

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSlide } from "./hero-slides/types";
import { HeroSlideTournament } from "./hero-slides/hero-slide-tournament";
import { HeroSlideGame } from "./hero-slides/hero-slide-game";
import { HeroSlideMvp } from "./hero-slides/hero-slide-mvp";
import { HeroSlideStatic } from "./hero-slides/hero-slide-static";

interface Props {
  /** 서버에서 prefetch한 슬라이드 배열 */
  slides: HeroSlide[];
}

// 자동 회전 간격 (ms)
const AUTOPLAY_INTERVAL = 5000;
// 스와이프 인식 최소 거리 (px) — 너무 작으면 의도치 않은 스크롤로 슬라이드가 넘어감
const SWIPE_THRESHOLD = 40;

export function HeroCarousel({ slides }: Props) {
  // 현재 활성 슬라이드 인덱스
  const [activeIndex, setActiveIndex] = useState(0);
  // hover 시 자동회전 일시정지 (마우스 들어옴 = true)
  const [isHovered, setIsHovered] = useState(false);
  // prefers-reduced-motion 사용자 여부 (자동 회전 차단)
  const [reducedMotion, setReducedMotion] = useState(false);

  // 스와이프 시작 X 좌표 (touchstart 시점에 기록 → touchend 시 비교)
  const touchStartX = useRef<number | null>(null);

  // 슬라이드가 1장 이하이면 모든 컨트롤 비활성
  const hasMultiple = slides.length > 1;

  /* ---------- prefers-reduced-motion 감지 (마운트 시 1회) ---------- */
  useEffect(() => {
    // SSR 안전: window 가드. 매치 미디어로 OS 설정 직접 읽음
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    // 사용자가 설정을 도중에 바꿀 수도 있으므로 listener 등록
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ---------- 다음/이전 이동 핸들러 (모듈로 연산으로 순환) ---------- */
  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  /* ---------- 자동 회전 (hover/reducedMotion/단일 슬라이드 시 OFF) ---------- */
  useEffect(() => {
    // 자동 회전 조건: 슬라이드 2개 이상 + hover 안 됨 + reduced-motion 아님
    if (!hasMultiple || isHovered || reducedMotion) return;

    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_INTERVAL);

    // cleanup: 의존성 변경 시 기존 인터벌 해제 (메모리 누수 + 중복 실행 방지)
    return () => window.clearInterval(id);
  }, [hasMultiple, isHovered, reducedMotion, slides.length]);

  /* ---------- 키보드 네비게이션 (ArrowLeft/Right) ---------- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!hasMultiple) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    },
    [hasMultiple, goNext, goPrev]
  );

  /* ---------- 모바일 스와이프 (touch start → end 거리 비교) ---------- */
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // 첫 손가락의 X 좌표만 기록 — 멀티터치는 무시
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartX.current === null || !hasMultiple) return;
      const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
      const dx = endX - touchStartX.current;

      // 임계값(40px) 이상 움직였을 때만 슬라이드 전환 — 작은 흔들림 무시
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        // 좌→우 스와이프(dx > 0): 이전 슬라이드 / 우→좌(dx < 0): 다음 슬라이드
        if (dx > 0) goPrev();
        else goNext();
      }
      touchStartX.current = null;
    },
    [goNext, goPrev, hasMultiple]
  );

  /* ---------- 슬라이드 종류별 dispatch (discriminated union 활용) ---------- */
  // kind 별로 다른 컴포넌트를 렌더 — TS가 data 타입을 자동으로 좁혀줌
  const renderSlide = (slide: HeroSlide) => {
    switch (slide.kind) {
      case "tournament":
        return <HeroSlideTournament data={slide.data} />;
      case "game":
        return <HeroSlideGame data={slide.data} />;
      case "mvp":
        return <HeroSlideMvp data={slide.data} />;
      case "static":
        return <HeroSlideStatic data={slide.data} />;
      default:
        // 미래에 새 kind 추가 시 컴파일 타임에 잡히도록 never 체크
        return null;
    }
  };

  // 슬라이드 0개 방어 (prefetchHeroSlides가 fallback을 보장하지만 안전장치)
  if (slides.length === 0) return null;

  return (
    // role="region" + aria-label: 스크린리더에 영역 의미 전달
    // tabIndex=0: 키보드 포커스 가능 (ArrowLeft/Right 입력 받기 위함)
    <div
      className="hero-carousel"
      role="region"
      aria-label="메인 hero 슬라이드"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* viewport: 슬라이드들이 절대 배치로 겹쳐 쌓이는 컨테이너 */}
      <div className="hero-carousel__viewport" aria-live="polite">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={idx}
              // active 인 슬라이드만 opacity:1 + pointer-events:auto
              className={
                isActive
                  ? "hero-carousel__slide hero-carousel__slide--active"
                  : "hero-carousel__slide"
              }
              // 비활성 슬라이드는 보조 기술에서도 숨김 (중복 낭독 방지)
              aria-hidden={!isActive}
            >
              {renderSlide(slide)}
            </div>
          );
        })}
      </div>

      {/* 좌우 화살표 — 슬라이드 2장 이상일 때만 노출 */}
      {hasMultiple && (
        <div className="hero-carousel__arrows" aria-hidden="false">
          <button
            type="button"
            className="hero-carousel__arrow hero-carousel__arrow--prev"
            onClick={goPrev}
            aria-label="이전 슬라이드"
          >
            {/* Material Symbols Outlined — globals 폰트 로드 가정 */}
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            className="hero-carousel__arrow hero-carousel__arrow--next"
            onClick={goNext}
            aria-label="다음 슬라이드"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      {/* 점 indicator — 슬라이드 2장 이상일 때만 */}
      {hasMultiple && (
        <div className="hero-carousel__indicators" role="tablist">
          {slides.map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`${idx + 1}번째 슬라이드로 이동`}
                className={
                  isActive
                    ? "hero-carousel__indicator hero-carousel__indicator--active"
                    : "hero-carousel__indicator"
                }
                onClick={() => goTo(idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
