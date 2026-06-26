"use client";

// =====================================================================
// use-filter.ts — 검색어 + 상태 탭 필터 훅 (v2.40 A2 박제)
//   박제 source: Dev/design/BDR v2.40/_admin-unified/ad-kit.jsx (useFilter)
//   rows 를 q(검색어)·tab(상태)로 클라이언트 필터링.
//   - tab === "all" 이면 상태 필터 통과(전체).
//   - q 가 있으면 fields 중 하나라도 부분일치(대소문자 무시).
//
//   'use client' — useState/useMemo. Toolbar(q/tab)와 짝으로 사용.
// =====================================================================

import { useMemo, useState } from "react";

// 필터 대상 행은 status(상태 탭 매칭용) + 검색 대상 필드를 가질 수 있는 형태.
// status 는 옵션(없으면 tab 필터는 "all"에서만 통과).
export type FilterableRow = {
  status?: string;
  [key: string]: unknown;
};

export type UseFilterResult<T> = {
  q: string;
  setQ: (value: string) => void;
  tab: string;
  setTab: (value: string) => void;
  filtered: T[];
};

export function useFilter<T extends FilterableRow>(
  rows: T[],
  fields: (keyof T)[]
): UseFilterResult<T> {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        // tab="all" 이면 전체 통과, 아니면 r.status 일치만
        const okTab = tab === "all" || r.status === tab;
        // 검색어 없으면 통과, 있으면 fields 중 하나라도 부분일치(대소문자 무시)
        const okQ =
          !q ||
          fields.some((f) =>
            String(r[f] ?? "")
              .toLowerCase()
              .includes(q.toLowerCase())
          );
        return okTab && okQ;
      }),
    [rows, q, tab, fields]
  );

  return { q, setQ, tab, setTab, filtered };
}
