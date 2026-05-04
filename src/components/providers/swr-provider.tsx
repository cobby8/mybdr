"use client";

import { SWRConfig } from "swr";

// 공통 fetcher: URL을 받아 JSON으로 변환
// SWRConfig에 등록하면 모든 useSWR 호출에서 자동 사용됨
//
// 2026-05-05 fix: 401 → null 반환 (이전 = 그대로 json 파싱 실패 throw → SWR retry 폭주).
//   본질: 비로그인 사용자가 /api/web/me 호출 시 401 → SWR 무한 retry → 콘솔 폭주 + 메인 스레드 부담.
//   ProfileCompletionBanner / ProfileCtaCard 등 모든 글로벌 fetcher 사용처 일괄 안전.
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 401) return null; // 비로그인/탈퇴 → null (재시도 ❌)
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        // 10초간 같은 키(URL)로 중복 호출 방지
        // 예: hero-bento와 recommended-videos가 같은 /api/web/youtube/recommend를 호출해도 1회만 요청
        dedupingInterval: 10000,
        // 탭 전환(포커스 복귀) 시 자동 재호출 방지
        revalidateOnFocus: false,
        // 2026-05-05 fix: error 시 retry 제한 (default 5회 → 0). 401/500 무한 폭주 차단.
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
