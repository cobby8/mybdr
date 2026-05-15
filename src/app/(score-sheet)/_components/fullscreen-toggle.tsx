/**
 * FullscreenToggle — score-sheet 풀스크린 명시 toggle 버튼.
 *
 * 2026-05-15 — PR-Live4 (사용자 결재 Q5 권고안 = 자동 lock + 명시 버튼 둘 다 / Q7 사용자 명시 해제).
 *
 * 왜 (이유):
 *   태블릿 세로 환경에서 iOS Safari / 안드로이드 Chrome 의 상하단 UI 차치 영역 회수 필요.
 *   풀스크린 진입 = viewport 추가 ~10% 확보 → A4 양식 정합성 + 가독성 개선.
 *   ESC / 본 버튼 재클릭 / 페이지 떠남 (cleanup) 시 자동 해제 (Q7 명시 해제 룰).
 *
 * 방법 (어떻게):
 *   - `document.fullscreenElement` 로 현재 상태 추적
 *   - mount 시 `fullscreenchange` 이벤트 listener — 외부 (ESC 등) 변화도 state 동기화
 *   - onClick = 토글 (현재 fullscreen → exit / 일반 → request)
 *   - 아이콘 = `fullscreen` / `fullscreen_exit` 분기 (Material Symbols Outlined)
 *   - iOS Safari iPhone 미지원 (Fullscreen API 가 video 만) — try-catch 로 silent fail
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만
 *   - var(--*) 토큰만 / 빨강 본문 ❌ (admin 룰 conventions.md 2026-05-11)
 *   - AppNav frozen 영향 0 (score-sheet route group 격리 — thin bar 한 줄 추가만)
 */

"use client";

import { useEffect, useState } from "react";

export function FullscreenToggle() {
  // 현재 풀스크린 상태 — SSR/hydration 시 false 시작 (document 미존재) 후 mount 동기화.
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // 외부 변화 (ESC / 브라우저 UI / 다른 코드) 도 추적 — 아이콘 / aria-label 자동 동기화.
    // 이유: 사용자가 ESC 로 해제하면 본 버튼 클릭 안 했어도 상태 반영 필요.
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    // mount 시 1회 동기화 (이미 fullscreen 인 상태로 진입 가능 — 보수적 sync)
    handleChange();

    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
    };
  }, []);

  const handleClick = async () => {
    // try-catch 필수 — iOS Safari iPhone Fullscreen API 미지원 (video 만 가능).
    // 권한 거부 / 비 user gesture 호출 등 throw 시 silent fail (UX 보호).
    try {
      if (document.fullscreenElement) {
        // 현재 fullscreen → 해제 (Q7 사용자 명시 해제 룰)
        await document.exitFullscreen();
      } else {
        // 일반 → 진입. documentElement 대상 = 전체 페이지 (body 만 하면 layout 깨짐 가능)
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // silent fail — iPhone / 권한 거부 / 비-user-gesture 등 시나리오
      // 이유: 운영자 UX 보호 (alert / console.error 시 양식 입력 흐름 방해)
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFullscreen ? "전체화면 해제" : "전체화면"}
      title={isFullscreen ? "전체화면 해제 (ESC)" : "전체화면 (태블릿 세로 권장)"}
      className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
      style={{
        color: "var(--color-text-secondary)",
      }}
    >
      <span className="material-symbols-outlined text-base">
        {isFullscreen ? "fullscreen_exit" : "fullscreen"}
      </span>
    </button>
  );
}
