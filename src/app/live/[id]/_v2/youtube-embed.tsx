/**
 * 2026-05-09 PR3 — 라이브 페이지 YouTube 임베딩 컴포넌트.
 *
 * 도메인 컨텍스트 (Dev/live-youtube-embed-2026-05-09.md §5):
 *   매치 1건당 영상 1건 (1:1) — youtube_video_id 가 있을 때만 마운트.
 *   라이브 / VOD 분기 + 모바일 4 분기점 (360 / 720 / 900 / 1024+).
 *
 * 보안 (§8):
 *   - youtube-nocookie.com 우선 (privacy 강화 — CSP 이미 등록됨)
 *   - referrerPolicy="strict-origin-when-cross-origin"
 *   - allow 화이트리스트 (autoplay/picture-in-picture/encrypted-media)
 *   - sandbox 미적용 (autoplay 충돌)
 *
 * 라이브 가드:
 *   - autoplay=1&mute=1 (Chrome autoplay 정책 우회)
 *   - modestbranding=1 (YouTube 로고 최소화)
 *   - playsinline 자동 (iframe 기본)
 *
 * 사용처:
 *   src/app/live/[id]/page.tsx — hero 영역 아래 (Q4 결재 — hero 아래) 조건부 마운트.
 *
 * 회귀 차단:
 *   - youtube_video_id null 이면 mount 자체 안 함 (영역 0)
 *   - video_id 11자 검증은 서버 측 zod + 정규식 가드 의존 (UI 측 추가 검증 0 — 신뢰)
 *
 * 모바일 분기점 (§9 / 5/9 conventions.md 4 분기점):
 *   - 360px: 전체 폭 / 16:9 유지
 *   - 720px: hero 영역 통합 / margin 축소
 *   - 900px+: hero 옆 사이드 또는 hero 아래 정렬
 *   - 1024px+: 최대 너비 720px / 좌우 여백
 */

"use client";

import { memo } from "react";

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  isLive?: boolean;
  // 등록 mode — "manual" / "auto_verified" / "auto_pending" — 운영자 UI 에서 자동 채택 표시용
  status?: "manual" | "auto_verified" | "auto_pending" | null;
  // 운영자 권한 시 우상단 "영상 변경" 버튼 노출
  isAdmin?: boolean;
  onManageClick?: () => void;
}

function YouTubeEmbedInner({
  videoId,
  title,
  isLive,
  status,
  isAdmin,
  onManageClick,
}: YouTubeEmbedProps) {
  // 운영자 모달 진입점 — 등록 영상 교체/제거 시 호출.
  // PR4 (운영자 모달) 구현 전 단계라 현재 onManageClick 미전달이면 버튼 미노출.
  const showAdminButton = isAdmin && typeof onManageClick === "function";

  // YouTube embed URL 구성 — youtube-nocookie 우선
  // autoplay=1&mute=1 → Chrome 자동재생 정책 우회 (사용자 클릭 시 unmute)
  // modestbranding=1 → YouTube 로고/관련영상 최소화
  // rel=0 → 종료 후 다른 채널 영상 추천 차단 (BDR 채널 영상만)
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&modestbranding=1&rel=0`;

  return (
    <section
      // 모바일 4 분기점 — 컨테이너 가로 폭은 부모 (라이브 페이지) 가 결정.
      // 본 컴포넌트는 "꽉 채우기 + 16:9 유지" 만 책임 (모바일 ≤720 = 풀 폭 / ≥900 = 부모 max-width 따름).
      className="relative w-full mx-auto"
      style={{
        maxWidth: "960px", // 1024+ 분기점 = max-width 720~960. hero 영역 자체가 75% 폭이라 자연스럽게 따름.
      }}
      aria-label={isLive ? "라이브 영상 시청" : "경기 영상 시청"}
    >
      {/* 우상단 LIVE 뱃지 + 운영자 관리 버튼 — z-index 로 iframe 위에 띄움 */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {isLive && (
          // 라이브 뱃지 — 빨간 ping 애니메이션 (5/9 RecommendedVideos LIVE 패턴 동일)
          // var(--color-status-live) 토큰 / 핑크/살몬 금지 (BDR-current 13룰 §C-10)
          <span
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide"
            style={{
              backgroundColor: "var(--color-status-live)",
              color: "#ffffff",
            }}
            aria-label="라이브 진행 중"
          >
            <span
              className="relative flex w-2 h-2"
            >
              {/* ping 외곽 — 점이 퍼지는 방송 온에어 스타일 */}
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-75"
                style={{ backgroundColor: "#ffffff" }}
              />
              <span
                className="relative w-2 h-2 rounded-full"
                style={{ backgroundColor: "#ffffff" }}
              />
            </span>
            LIVE
          </span>
        )}
        {/* VOD 뱃지 — 라이브가 아니면 회색 "다시보기" */}
        {!isLive && (
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: "var(--color-elevated)",
              color: "var(--color-text-secondary)",
            }}
          >
            다시보기
          </span>
        )}
        {/* auto_verified 뱃지 — 운영자에게 "자동 검색으로 등록됨" 안내 */}
        {status === "auto_verified" && isAdmin && (
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: "var(--color-info)",
              color: "#ffffff",
            }}
            title="자동 검색 신뢰도 80점 이상으로 자동 등록됨"
          >
            자동
          </span>
        )}
        {/* 운영자 변경 버튼 — onManageClick 전달 시에만 노출 */}
        {showAdminButton && (
          <button
            type="button"
            onClick={onManageClick}
            aria-label="영상 변경 또는 제거 (운영자)"
            title="영상 변경 또는 제거 (운영자)"
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
            style={{
              backgroundColor: "var(--color-card)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
        )}
      </div>

      {/* 16:9 비율 컨테이너 — aspect-video (Tailwind) = 56.25% padding-bottom 등가.
          rounded 모서리 + overflow-hidden 으로 iframe 모서리 정리 (iOS Safari 대응). */}
      <div
        className="relative w-full overflow-hidden rounded-md"
        style={{
          aspectRatio: "16 / 9",
          backgroundColor: "var(--color-elevated)", // iframe 로딩 전 placeholder
        }}
      >
        <iframe
          src={embedUrl}
          title={title ?? "라이브 중계 영상"}
          referrerPolicy="strict-origin-when-cross-origin"
          // allow 화이트리스트 — autoplay 필수 / picture-in-picture 모바일 PIP 지원
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          // 절대 위치로 컨테이너 꽉 채우기
          className="absolute inset-0 w-full h-full"
          style={{ border: "0" }}
        />
      </div>

      {/* 영상 제목 (선택) — title 전달 시에만 노출 */}
      {title && (
        <p
          className="mt-2 text-sm truncate"
          style={{ color: "var(--color-text-secondary)" }}
          title={title}
        >
          {title}
        </p>
      )}
    </section>
  );
}

/**
 * memo — videoId/isLive 변하지 않는 한 리렌더 회피 (라이브 페이지 3초 폴링 영향 0).
 */
export const YouTubeEmbed = memo(YouTubeEmbedInner);
