/**
 * ScoreSheetChrome — score-sheet route group 의 thin bar + 풀스크린 chrome.
 *
 * 2026-05-15 (PR-Fullscreen-Clean) — 사용자 요청 "전체화면 진입 시 양식만
 *   보이도록, 우상단 X 로 종료".
 *
 * 동작:
 *   - 일반: thin bar (FullscreenToggle + ThemeToggle 우상단) + children
 *   - 풀스크린: thin bar hidden + 우상단 floating X 버튼 (전체화면 종료)
 *
 * 박제 룰:
 *   - var(--*) 토큰만 / Material Symbols Outlined
 *   - 풀스크린 X = fixed top-right + 충분한 터치 영역 (44px+)
 *   - z-index = thin bar / 양식 위 (모달/toast 아래)
 *   - 인쇄 시 = no-print 둘 다 hidden (FIBA 정합)
 */

"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { FullscreenToggle } from "./fullscreen-toggle";
import { useFullscreen } from "./fullscreen-context";

export function ScoreSheetChrome({ children }: { children: ReactNode }) {
  const { isFullscreen, exit } = useFullscreen();

  return (
    <>
      {/* thin bar — 일반 모드에서만 노출 (풀스크린 시 hidden) */}
      {!isFullscreen && (
        <header
          className="no-print flex items-center justify-end gap-1 px-3 py-1.5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <FullscreenToggle />
          <ThemeToggle />
        </header>
      )}

      {/* 풀스크린 진입 시 우상단 floating X — 양식 본체 위에 떠 있음.
          이유: 사용자 의도 = 양식만 보이도록 + 한 번에 종료 가능. */}
      {isFullscreen && (
        <button
          type="button"
          onClick={exit}
          aria-label="전체화면 종료"
          title="전체화면 종료 (ESC)"
          className="no-print fixed flex h-11 w-11 items-center justify-center"
          style={{
            top: 12,
            right: 12,
            zIndex: 60,
            backgroundColor: "color-mix(in srgb, var(--color-background) 85%, transparent)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
            color: "var(--color-text-primary)",
            backdropFilter: "blur(6px)",
            touchAction: "manipulation",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            close
          </span>
        </button>
      )}

      {children}
    </>
  );
}
