/**
 * FullscreenContext — score-sheet route group 전역 풀스크린 상태.
 *
 * 2026-05-15 (PR-Fullscreen-Clean) — 사용자 요청 "전체화면 진입 시 양식만
 *   노출, 우상단 X 로 종료". FullscreenToggle 의 isFullscreen state 를
 *   layout (thin bar 숨김) + toolbar (ss-toolbar 숨김) + 양식 (우상단 X
 *   floating) 이 모두 read 해야 → context 로 단일 source.
 *
 * 박제 룰:
 *   - SSR 안전 (mount 전 false 시작)
 *   - `fullscreenchange` event 단일 listener (provider 가 박제) → 외부
 *     ESC 해제도 자동 sync
 *   - exitFullscreen() 호출 헬퍼 노출 (X 버튼 / toolbar 모두 사용)
 */

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface FullscreenContextValue {
  isFullscreen: boolean;
  /** 풀스크린 진입 — silent fail (iPhone / 권한 거부 보호) */
  enter: () => Promise<void>;
  /** 풀스크린 해제 — silent fail */
  exit: () => Promise<void>;
  /** 토글 (현재 상태 반대) */
  toggle: () => Promise<void>;
}

const FullscreenContext = createContext<FullscreenContextValue | null>(null);

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    handleChange();
    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
    };
  }, []);

  const enter = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      // 2026-05-15 (PR-SS-50) — 전체화면 진입 시 세로 (portrait) 강제 lock.
      //   Screen Orientation API — iOS Safari 미지원 (silent fail), Android Chrome / iPadOS 16+ 지원.
      //   try-catch 별도 = lock 실패가 fullscreen 진입까지 막지 않도록 분리.
      try {
        const orientation = (screen as Screen & {
          orientation?: ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
        }).orientation;
        if (orientation && typeof orientation.lock === "function") {
          await orientation.lock("portrait");
        }
      } catch {
        /* lock 미지원 / 권한 거부 silent — 사용자가 가로로 들어와도 양식 노출 (스크롤) */
      }
    } catch {
      /* silent fail (iPhone / non-user-gesture / 권한 거부) */
    }
  };

  const exit = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      /* silent fail */
    }
  };

  const toggle = async () => {
    if (document.fullscreenElement) {
      await exit();
    } else {
      await enter();
    }
  };

  return (
    <FullscreenContext.Provider value={{ isFullscreen, enter, exit, toggle }}>
      {children}
    </FullscreenContext.Provider>
  );
}

/**
 * useFullscreen — provider 안에서만 호출. provider 미마운트 시 fallback
 * (운영 안전망 — toast-context.tsx 의 no-op fallback 패턴과 동일).
 */
export function useFullscreen(): FullscreenContextValue {
  const ctx = useContext(FullscreenContext);
  if (!ctx) {
    if (typeof window !== "undefined") {
      console.warn(
        "[useFullscreen] FullscreenProvider not found — using no-op fallback (dev hot reload race?)",
      );
    }
    return {
      isFullscreen: false,
      enter: async () => {},
      exit: async () => {},
      toggle: async () => {},
    };
  }
  return ctx;
}
