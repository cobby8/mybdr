"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

// Context 타입 정의
interface PreferFilterContextType {
  preferFilter: boolean;       // true: 선호 필터 ON, false: 전체 보기
  isLoggedIn: boolean;         // 로그인 여부 (비로그인이면 preferFilter 항상 false)
  togglePreferFilter: () => void;  // ON <-> OFF 전환 (현재 페이지에서만 일시적)
  setLoggedIn: (v: boolean) => void; // header에서 /api/web/me 결과를 전달받기 위한 setter
}

// 기본값 (SSR 시 사용) -- false로 시작하여 hydration mismatch 방지
const PreferFilterContext = createContext<PreferFilterContextType>({
  preferFilter: false,
  isLoggedIn: false,
  togglePreferFilter: () => {},
  setLoggedIn: () => {},
});

// Context 값을 읽는 커스텀 훅
export function usePreferFilter() {
  return useContext(PreferFilterContext);
}

/**
 * PreferFilterProvider
 *
 * 전역 선호 필터 상태를 관리하는 Provider.
 * - 로그인 유저: 항상 기본 preferFilter = true (선호 필터 ON)
 * - 비로그인 유저: preferFilter = false (고정, 전환 불가)
 * - sessionStorage 사용하지 않음 -- 페이지 이동하면 자동으로 true로 복귀
 * - "전체 보기"는 현재 페이지에서만 일시적으로 적용됨
 */
export function PreferFilterProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname(); // 현재 URL 경로를 감시
  const [isLoggedIn, setLoggedInState] = useState(false);
  // 로그인 유저는 항상 true로 시작, 비로그인은 false
  const [preferFilter, setPreferFilter] = useState(false);

  // 페이지 이동 시 preferFilter를 true로 리셋 (로그인 유저만)
  // "전체 보기"는 현재 페이지에서만 일시적 → 다른 페이지로 이동하면 자동 복귀
  useEffect(() => {
    if (isLoggedIn) {
      setPreferFilter(true);
    }
  }, [pathname, isLoggedIn]);

  // 로그인 상태 변경 시 preferFilter도 함께 설정
  const setLoggedIn = useCallback((v: boolean) => {
    setLoggedInState(v);
    // 로그인 유저면 기본 ON, 비로그인이면 OFF
    setPreferFilter(v);
  }, []);

  // ON <-> OFF 전환 -- sessionStorage 저장 없이 state만 변경 (페이지 이동 시 리셋)
  const togglePreferFilter = useCallback(() => {
    if (!isLoggedIn) return; // 비로그인은 전환 불가
    setPreferFilter((prev) => !prev);
  }, [isLoggedIn]);

  return (
    <PreferFilterContext.Provider value={{ preferFilter, isLoggedIn, togglePreferFilter, setLoggedIn }}>
      {children}
    </PreferFilterContext.Provider>
  );
}
