"use client";

import { useEffect, useState } from "react";

/* ============================================================
 * ThemeSwitch (BDR v2)
 *
 * 이유(왜):
 *   기존: 라이트/다크 2버튼 듀얼 토글 (.theme-switch 알약 컨테이너 + 라벨)
 *   변경: 단일 아이콘 토글 버튼 (해/달 아이콘만 보이는 미니멀 형태)
 *   PM 지시(2026-04-29): 글로벌 헤더 컨트롤 정리 — 검색/알림과 동일하게
 *   박스 없이 아이콘만 노출하는 형태로 통일.
 *
 *   호환 포인트(기존 그대로):
 *   - v2 CSS 셀렉터 이중화: `[data-theme="dark"]` + `html.dark`
 *   - localStorage 키: `theme-preference`
 *
 * 방법(어떻게):
 *   1. 마운트 시 html 태그에서 현재 테마 읽어 상태 초기화 (FOUC 방지 —
 *      layout.tsx의 beforeInteractive 스크립트가 이미 data-theme/class 세팅)
 *   2. 버튼 1개로 클릭 시 light ↔ dark 즉시 토글
 *   3. 표시 아이콘은 "다음에 전환될 모드" 기준 (라이트 상태 → 달 아이콘 표시)
 *      → 사용자 멘탈 모델: "달 누르면 다크로 간다"
 * ============================================================ */

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.dataset.theme === "dark") return "dark";
  return "light";
}

export function ThemeSwitch() {
  const [theme, setThemeState] = useState<Theme>("light");

  // 마운트 이후 실제 DOM 상태에 맞춰 동기화 (SSR/CSR mismatch 방지)
  useEffect(() => {
    setThemeState(readTheme());
  }, []);

  const applyTheme = (next: Theme) => {
    const html = document.documentElement;
    // 이중 셀렉터 모두 세팅 — CSS가 `[data-theme="dark"], html.dark` 양쪽을 봄
    html.dataset.theme = next;
    if (next === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
    }
    try {
      window.localStorage.setItem("theme-preference", next);
    } catch {
      // 프라이빗 모드 등에서 실패해도 무시 (UI는 유지)
    }
    setThemeState(next);
  };

  // 다크 상태 → 해(light_mode) 표시: "누르면 라이트로 갑니다" 신호
  // 라이트 상태 → 달(dark_mode) 표시: "누르면 다크로 갑니다" 신호
  const isDark = theme === "dark";
  const nextTheme: Theme = isDark ? "light" : "dark";
  const iconName = isDark ? "light_mode" : "dark_mode";
  const aria = isDark ? "라이트 모드로 전환" : "다크 모드로 전환";

  return (
    <button
      type="button"
      className="app-nav__icon-btn"
      onClick={() => applyTheme(nextTheme)}
      aria-label={aria}
      title={aria}
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {iconName}
      </span>
    </button>
  );
}
