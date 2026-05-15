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
  // 2026-05-15 — 사용자 요청 "가로 모드에서 스크롤 가능".
  //   이전 박제: mount 시 body.overflow="hidden" → 가로 진입 시 양식이 viewport 보다
  //   커서 스크롤 차단 → 양식 일부 미노출.
  //   현재: lock 자체 비활성화 (스크롤 항상 허용). 세로 강제는 fullscreen-context
  //   의 enter() 가 screen.orientation.lock("portrait") 으로 처리.
  //   컴포넌트는 향후 fullscreen 종속 lock 으로 부활 가능성 위해 유지 (effect 빈 노옵).
  useEffect(() => {
    return () => {};
  }, []);

  return null;
}
