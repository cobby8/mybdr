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
// 2026-05-16 (PR-Chrome-Cleanup) — 사용자 보고 이미지 #132 fix.
//   1. 다크모드 토글 (ThemeToggle) 제거 — 기록지 모드에서 미사용 (사용자 명시).
//   2. 전체화면 토글 (FullscreenToggle) 제거 — toolbar 라인업 좌측으로 이동 (사용자 명시).
//   3. thin bar 자체 제거 — 두 토글이 모두 사라져 빈 header 유지 불필요.
//   exit 콜백은 풀스크린 종료 X 버튼에 그대로 필요 → useFullscreen import 보존.
import { useFullscreen } from "./fullscreen-context";

export function ScoreSheetChrome({ children }: { children: ReactNode }) {
  const { isFullscreen, exit } = useFullscreen();

  return (
    <>
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
