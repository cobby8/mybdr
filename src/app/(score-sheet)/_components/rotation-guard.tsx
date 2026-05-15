/**
 * 회전 가이드 (RotationGuard) — 태블릿 가로 모드 진입 시 안내 화면 표시.
 *
 * 2026-05-11 — Phase 1 신규.
 * 2026-05-15 (PR-SS-50) — **가로 차단 제거** (사용자 요청 "가로 모드에서 스크롤은
 *   되도록 하고, 전체화면 시 세로모드로 강제 전환"). RotationGuard 의 안내 화면은
 *   가로 진입 자체를 차단했으나, 사용자 의도 = 가로에서도 양식 노출 + 스크롤 허용.
 *   본 컴포넌트는 점진적 제거 위해 일단 pass-through 로 유지 (다른 import 영향 0).
 *   전체화면 시 세로 강제 = `fullscreen-context.tsx` 의 `enter()` 가 screen.orientation.lock("portrait") 호출.
 */

"use client";

interface RotationGuardProps {
  children: React.ReactNode;
}

export function RotationGuard({ children }: RotationGuardProps) {
  return <>{children}</>;
}
