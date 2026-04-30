/* ============================================================
 * HeroSlideStatic — 정적 fallback 슬라이드 (server component)
 *
 * 왜 이 컴포넌트가 있는가:
 * 대회/게임/MVP 3종 데이터가 모두 0건일 때(개발 DB 초기 상태나 운영 일시 비활성)
 * hero가 빈 화면이 되는 사고를 방지. prefetchHeroSlides() 가 강제 1건 주입.
 *
 * 디자인 톤:
 *  - 채도가 낮은 회색 그라디언트 (광고가 아니라 "안내"성 톤)
 *  - secondary CTA 없음 (단일 동작 안내)
 * ============================================================ */

import type { HeroSlideStatic as HeroSlideStaticType } from "./types";
import { HeroSlideShell } from "./hero-slide-shell";

interface Props {
  data: HeroSlideStaticType["data"];
}

export function HeroSlideStatic({ data }: Props) {
  return (
    <HeroSlideShell
      // 회색 톤 — ink-mute(중간 회색)로 시작해 어두운 톤으로 끝
      // 다른 슬라이드와 시각적으로 명확히 구분되어 "데이터 없음" 상태가 잘 드러남
      accentVar="var(--ink-mute)"
      badge="BDR COMMUNITY"
      title={data.title}
      meta={data.description}
      primaryCta={{
        label: data.cta_label,
        href: data.cta_href,
      }}
      // secondaryCta 없음 — 정적 슬라이드는 단일 행동 유도
    />
  );
}
