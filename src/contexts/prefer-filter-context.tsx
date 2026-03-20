"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

// sessionStorage 키 -- 같은 탭 내에서만 유지, 탭 닫으면 리셋
const STORAGE_KEY = "bdr_prefer_filter";

// Context 타입 정의
interface PreferFilterContextType {
  preferFilter: boolean;       // true: 선호 필터 ON, false: 전체 보기
  isLoggedIn: boolean;         // 로그인 여부 (비로그인이면 preferFilter 항상 false)
  togglePreferFilter: () => void;  // ON <-> OFF 전환
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
 * - 로그인 유저: 기본 preferFilter = true (선호 필터 ON)
 * - 비로그인 유저: preferFilter = false (고정, 전환 불가)
 * - sessionStorage에 값을 저장하여 같은 탭 내 페이지 이동 시 유지
 * - TextSizeToggle과 동일한 mounted 패턴으로 SSR hydration mismatch 방지
 */
export function PreferFilterProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [preferFilter, setPreferFilter] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 마운트 시 sessionStorage에서 이전 값 복원
  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      // 저장된 값이 있으면 복원
      setPreferFilter(stored === "true");
    }
    // 저장된 값이 없으면 로그인 여부에 따라 초기값 설정 (아래 useEffect에서 처리)
  }, []);

  // 로그인 상태가 확인되면: 저장된 값이 없을 때만 기본값을 true로 설정
  useEffect(() => {
    if (!mounted) return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (isLoggedIn && stored === null) {
      // 로그인 유저이고 아직 토글한 적 없으면 기본 ON
      setPreferFilter(true);
      sessionStorage.setItem(STORAGE_KEY, "true");
    }
    if (!isLoggedIn) {
      // 비로그인이면 항상 OFF
      setPreferFilter(false);
    }
  }, [isLoggedIn, mounted]);

  // ON <-> OFF 전환 + sessionStorage 저장
  const togglePreferFilter = useCallback(() => {
    if (!isLoggedIn) return; // 비로그인은 전환 불가
    setPreferFilter((prev) => {
      const next = !prev;
      sessionStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, [isLoggedIn]);

  return (
    <PreferFilterContext.Provider value={{ preferFilter, isLoggedIn, togglePreferFilter, setLoggedIn }}>
      {children}
    </PreferFilterContext.Provider>
  );
}
