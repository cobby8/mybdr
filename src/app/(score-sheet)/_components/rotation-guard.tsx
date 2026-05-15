/**
 * 회전 가이드 (RotationGuard) — 태블릿 가로 모드 진입 시 안내 화면 표시.
 *
 * 2026-05-11 — Phase 1 신규 (planner-architect §G §5 §결재 §7 옵션 a 채택).
 *
 * 왜 (이유):
 *   FIBA 종이 기록지 양식 = A4 세로 (1:1.414). 태블릿 세로 모드가 자연 정합.
 *   가로 모드 진입 시 양식이 좌우로 늘어나 가독성 + 칸 비율 깨짐.
 *   PC (touch X / 데스크탑) 는 가로/세로 무관 — 본 가드는 태블릿/모바일 (touch) 만 차단.
 *
 * 방법 (어떻게):
 *   - `window.matchMedia("(orientation: landscape)")` 로 가로 모드 감지
 *   - `window.matchMedia("(hover: none) and (pointer: coarse)")` 로 touch 디바이스 감지
 *     (PC 가로 모드는 통과 — 사용 환경 차이 존중)
 *   - 가로 + touch = 회전 안내 풀스크린
 *   - 세로 또는 PC = `{children}` 정상 렌더링
 */

"use client";

import { useEffect, useState } from "react";

interface RotationGuardProps {
  children: React.ReactNode;
}

export function RotationGuard({ children }: RotationGuardProps) {
  // SSR 미일치 회피 — 초기 false 로 시작 후 mount 직후 실제 측정.
  // hydration 직전 짧은 깜빡임 보다 SSR 매칭 안정성 우선.
  const [isLandscapeTouch, setIsLandscapeTouch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 두 조건 모두 충족 = 차단
    const landscapeMql = window.matchMedia("(orientation: landscape)");
    const touchMql = window.matchMedia("(hover: none) and (pointer: coarse)");

    const evaluate = () => {
      setIsLandscapeTouch(landscapeMql.matches && touchMql.matches);
    };

    evaluate(); // 최초 1회
    landscapeMql.addEventListener("change", evaluate);
    touchMql.addEventListener("change", evaluate);

    return () => {
      landscapeMql.removeEventListener("change", evaluate);
      touchMql.removeEventListener("change", evaluate);
    };
  }, []);

  // 차단 모드 = 풀스크린 회전 안내
  if (mounted && isLandscapeTouch) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {/* 회전 아이콘 — Material Symbols Outlined */}
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 96,
            color: "var(--color-text-primary)",
          }}
        >
          screen_rotation
        </span>
        <h1
          className="mt-6 text-center text-xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          종이 기록지는 세로 모드에서 사용해주세요
        </h1>
        <p
          className="mt-2 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          기기를 세로로 회전하세요.
        </p>
      </div>
    );
  }

  // 정상 모드
  return <>{children}</>;
}
