/**
 * BodyScrollLock — score-sheet 진입 시 body overflow:hidden 자동 적용.
 *
 * 2026-05-15 — PR-Live3 (사용자 결재 Q5 권고안 = body overflow 자동 + 명시 버튼 둘 다).
 *
 * 왜 (이유):
 *   FIBA SCORESHEET = A4 세로 1 페이지 풀폭 박제. 본문 외부 스크롤 (body 자체) 이 가능하면
 *   태블릿 세로 모드에서 운영자가 양식 외 영역으로 스크롤 → 양식 정합성 깨짐 + 입력 집중 방해.
 *   layout body 영역만 lock = 양식 안 스크롤 영역 (.box-score 등) 은 영향 0.
 *
 * 방법 (어떻게):
 *   - mount 시 `document.body.style.overflow = "hidden"` set
 *   - unmount 시 `document.body.style.overflow = ""` 복원 (cleanup)
 *   - score-sheet route group 안에서만 마운트 → 페이지 떠날 때 자동 복원
 *   - 신규 DOM 0 (effect 만) — children prop 도 안 받음 (단일 책임)
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만 (본 컴포넌트는 DOM 0 = 아이콘 없음)
 *   - var(--*) 토큰만 (본 컴포넌트는 style 0)
 *   - AppNav frozen 영향 0 (route group 격리)
 */

"use client";

import { useEffect } from "react";

export function BodyScrollLock() {
  useEffect(() => {
    // 이전 값 보존 (다른 스크립트/시안이 inline 으로 박은 값이 있으면 복원 정합)
    // 일반적으로는 "" — 운영 globals.css 에 body.overflow 미설정.
    const previous = document.body.style.overflow;

    // mount 시 lock — 양식 외 영역 스크롤 차단 (Q5 자동 lock)
    document.body.style.overflow = "hidden";

    return () => {
      // unmount = score-sheet 떠날 때 → 원래 값 복원 (Q7 cleanup 룰 정합)
      document.body.style.overflow = previous;
    };
  }, []);

  // DOM 안 렌더 — effect 전용 컴포넌트
  return null;
}
