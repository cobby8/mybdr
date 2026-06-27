"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminApiError } from "./client";

/**
 * adminFetch 래핑 클라이언트 훅 — { data, loading, error } 표준 상태 + 자동 취소.
 *
 * 왜:
 *  - 관리자 화면마다 useState/useEffect/AbortController 보일러플레이트 반복 → 1곳으로 통일.
 *  - 언마운트/재요청 시 이전 요청 abort → setState on unmounted 경고/레이스 방지.
 *
 * 사용 예:
 *   const { data, loading, error, refetch } =
 *     useAdminQuery((signal) => listExpenses(tournamentId, signal), [tournamentId]);
 *
 * @param fetcher signal 을 받아 Promise<T> 반환하는 함수(엔드포인트 호출)
 * @param deps    재요청 트리거 의존성 배열
 */
export function useAdminQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminApiError | Error | null>(null);

  // fetcher 는 매 렌더 새 함수일 수 있어 ref 로 잡아 deps 만으로 재실행 제어
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback((signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    fetcherRef.current(signal)
      .then((result) => {
        if (signal.aborted) return;
        setData(result);
      })
      .catch((e: unknown) => {
        // abort 는 정상 취소 → 무시
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (signal.aborted) return;
        setError(e instanceof Error ? e : new Error("알 수 없는 오류"));
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });
  }, []);

  // 수동 재요청용 트리거(카운터 증가 → effect 재실행)
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey, run]);

  return { data, loading, error, refetch };
}
