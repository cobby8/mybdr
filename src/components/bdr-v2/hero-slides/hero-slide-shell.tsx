/* ============================================================
 * HeroSlideShell — 4종 hero 슬라이드 공통 래퍼 (server component)
 *
 * 왜 이 컴포넌트가 있는가:
 * 대회/게임/MVP/정적 4종 슬라이드는 콘텐츠는 다르지만 레이아웃 골격은 동일하다.
 *  - 좌측: 라벨(badge) → 큰 제목(title) → 메타(meta) → CTA 버튼들
 *  - 우측 상단: 색깔별 accent 원형 (시각적 포인트)
 *  - 배경: 색깔별 135도 그라디언트
 * 이 골격을 공통화해 두지 않으면 4개 슬라이드가 각자 패딩/폰트/CTA 모양이
 * 다르게 흘러갈 위험이 크다. (기존 .promo 시안과 같은 톤을 유지하기 위함)
 *
 * 디자인 원칙:
 *  - 기존 globals.css의 .promo / .btn / .btn--accent 클래스를 재사용 (디자인 일관성)
 *  - 색상은 prop accentVar 로 받아 inline style 로 주입 (var(--cafe-blue) 같은 토큰)
 *  - 하드코딩 색상 0개. 모든 색은 CSS 변수
 * ============================================================ */

import Link from "next/link";

/** CTA 버튼 한 개 */
export interface HeroSlideCta {
  label: string;
  href: string;
}

export interface HeroSlideShellProps {
  /** 그라디언트/accent 원형에 쓰일 메인 색상 토큰 (예: "var(--cafe-blue)") */
  accentVar: string;
  /** 그라디언트의 끝 색상 토큰 — 미지정 시 accentVar 어두운 톤으로 폴백 */
  accentDeepVar?: string;
  /** "NOW OPEN · 진행중" 같은 상단 라벨 (선택) */
  badge?: string;
  /** 메인 타이틀 (대회명/게임명 등) */
  title: string;
  /** 타이틀 하단 메타 정보 (장소, 일정, 인원 등) — 텍스트 또는 ReactNode */
  meta?: React.ReactNode;
  /** 주요 CTA — accent 빨간 버튼 */
  primaryCta?: HeroSlideCta;
  /** 보조 CTA — 반투명 고스트 버튼 */
  secondaryCta?: HeroSlideCta;
  /** 2026-05-02: 우측 상단 슬롯 — 라이브 배지 등 (선택, panel absolute) */
  topRightSlot?: React.ReactNode;
  /** 2026-05-02: CTA 정렬 — 'left' (기본) / 'right' (대회 슬라이드 진행 중일 때) */
  ctaAlign?: "left" | "right";
}

/**
 * 4종 슬라이드 모두가 사용하는 공통 셸.
 * 기존 .promo 톤을 따르되 슬라이드 내부에서 absolute로 쌓이도록 height 100% 설정.
 */
export function HeroSlideShell({
  accentVar,
  accentDeepVar,
  badge,
  title,
  meta,
  primaryCta,
  secondaryCta,
  topRightSlot,
  ctaAlign = "left",
}: HeroSlideShellProps) {
  // 끝 색상이 없으면 시작 색상의 어두운 톤을 색상-혼합으로 만든다.
  // color-mix는 모던 브라우저(2023~)에서 지원. 그라디언트 자연스러움 확보.
  const deep = accentDeepVar ?? `color-mix(in srgb, ${accentVar} 60%, #000)`;

  return (
    // hero-carousel__panel: 기존 .promo 디자인 준용 + 카로셀 절대배치 호환
    <div
      className="hero-carousel__panel"
      style={{
        // 좌측: 시작 색 / 우측: 어두운 톤 (시안 .promo 와 동일한 135도 흐름)
        background: `linear-gradient(135deg, ${accentVar} 0%, ${deep} 100%)`,
      }}
    >
      {/* 우측 상단 accent 원형 — 시각적 포인트 (기존 .promo__accent 톤) */}
      <div
        className="hero-carousel__accent"
        // accent 색상은 흰색 반투명으로 통일 (배경이 이미 컬러풀하므로)
        style={{ background: "rgba(255,255,255,.18)" }}
      />

      {/* 2026-05-02: 우측 상단 slot — 라이브 배지 등 (accent 원형 위 layer) */}
      {topRightSlot && (
        <div className="hero-carousel__top-right">{topRightSlot}</div>
      )}

      {/* 좌측 콘텐츠 영역 — 텍스트 + CTA */}
      <div className="hero-carousel__content">
        {badge && <div className="hero-carousel__badge">{badge}</div>}

        <h2 className="hero-carousel__title">{title}</h2>

        {meta && <div className="hero-carousel__meta">{meta}</div>}

        {(primaryCta || secondaryCta) && (
          <div
            className="hero-carousel__ctas"
            style={ctaAlign === "right" ? { justifyContent: "flex-end" } : undefined}
          >
            {primaryCta && (
              // .btn--accent: BDR Red 강조 (시안 .promo 와 동일)
              <Link href={primaryCta.href} className="btn btn--accent">
                {primaryCta.label}
              </Link>
            )}
            {secondaryCta && (
              // 반투명 고스트 — 컬러 배경 위에서 가독성 확보
              <Link
                href={secondaryCta.href}
                className="btn"
                style={{
                  background: "rgba(255,255,255,.12)",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.3)",
                }}
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
