/**
 * FullscreenToggle — score-sheet 풀스크린 명시 toggle 버튼.
 *
 * 2026-05-15 PR-Live4 — 태블릿 세로 환경 ±10% viewport 회수용 명시 buttons.
 * 2026-05-15 PR-Fullscreen-Clean — FullscreenContext 로 state 통합 (provider 단일 source).
 *   ScoreSheetChrome 의 thin bar 자동 hidden + 우상단 X 버튼 마운트 책임은 chrome 이 박제.
 *
 * 박제 룰:
 *   - var(--*) 토큰 / Material Symbols Outlined
 *   - try-catch silent fail (iPhone Fullscreen API 미지원 시)
 */

"use client";

import { useFullscreen } from "./fullscreen-context";

export function FullscreenToggle() {
  const { isFullscreen, toggle } = useFullscreen();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFullscreen ? "전체화면 해제" : "전체화면"}
      title={isFullscreen ? "전체화면 해제 (ESC)" : "전체화면 (태블릿 세로 권장)"}
      className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
      style={{ color: "var(--color-text-secondary)" }}
    >
      <span className="material-symbols-outlined text-base">
        {isFullscreen ? "fullscreen_exit" : "fullscreen"}
      </span>
    </button>
  );
}
