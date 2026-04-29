"use client";

import { useEffect, useState } from "react";

/* ============================================================
 * ThemeSwitch (BDR v2.1 시안 복원)
 *
 * 이유(왜):
 *   직전 commit(3796f55)에서 단일 아이콘 토글로 단순화했으나, v2.1 시안
 *   (캡처 36, 38)은 두 라벨("라이트" / "다크") 듀얼 토글 형태.
 *   PM 결정(2026-04-29): 시안 100% 매칭 — components.jsx L77~88 의
 *   ThemeSwitch 컴포넌트 마크업 그대로 복원.
 *
 *   시안 마크업 (Dev/design/BDR v2.1/components.jsx L77~88):
 *     <div className="theme-switch" role="group" aria-label="theme">
 *       <button className="theme-switch__btn" data-active={theme==='light'} ...>
 *         <Icon.sun/> 라이트
 *       </button>
 *       <button className="theme-switch__btn" data-active={theme==='dark'} ...>
 *         <Icon.moon/> 다크
 *       </button>
 *     </div>
 *
 *   CSS 룰은 globals.css L600~631 에 이미 존재 (.theme-switch / __btn /
 *   data-active="true" / 다크모드 BDR Red 활성). 추가 CSS 불필요.
 *
 *   호환 포인트(기존 그대로):
 *   - v2 CSS 셀렉터 이중화: `[data-theme="dark"]` + `html.dark`
 *   - localStorage 키: `theme-preference`
 *   - 모바일 좁은 폭 — globals.css L1135~1136 코멘트는 단일 아이콘 시점의
 *     레거시. 시안 복원 후 두 라벨 표시되며 v2.1 시안의 데스크톱 형태 유지.
 *
 * 방법(어떻게):
 *   1. 마운트 시 html 태그에서 현재 테마 읽어 상태 초기화 (FOUC 방지 —
 *      layout.tsx의 beforeInteractive 스크립트가 이미 data-theme/class 세팅)
 *   2. 두 버튼 각각 클릭 시 해당 테마로 직접 전환 (토글 X, 명시적 선택)
 *   3. data-active 속성으로 활성 표시 — CSS의 .theme-switch__btn[data-active="true"]
 *      룰이 자동 적용 (배경 + 굵은 텍스트 + BDR Red 다크모드).
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

  // 시안 매칭: 두 버튼 동시 표시, data-active 속성으로 활성 분기
  return (
    <div className="theme-switch" role="group" aria-label="테마 전환">
      <button
        type="button"
        className="theme-switch__btn"
        data-active={theme === "light"}
        onClick={() => applyTheme("light")}
        aria-label="라이트 모드"
        aria-pressed={theme === "light"}
      >
        {/* Material Symbols Outlined — light_mode (해 아이콘) */}
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
          light_mode
        </span>
        라이트
      </button>
      <button
        type="button"
        className="theme-switch__btn"
        data-active={theme === "dark"}
        onClick={() => applyTheme("dark")}
        aria-label="다크 모드"
        aria-pressed={theme === "dark"}
      >
        {/* Material Symbols Outlined — dark_mode (달 아이콘) */}
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
          dark_mode
        </span>
        다크
      </button>
    </div>
  );
}
