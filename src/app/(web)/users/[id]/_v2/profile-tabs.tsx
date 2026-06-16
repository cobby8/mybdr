"use client";

/* ============================================================
 * ProfileTabs — /users/[id] v2 탭 스위처 (개요 / 최근 경기 / 기록)
 *
 * 왜:
 * - v2 PlayerProfile.jsx L120~137 탭 스위처 재현. 2026-06-16 "기록" 탭 추가(3탭).
 * - 데이터는 페이지(서버)에서 모두 prefetch 해두고, 클라이언트는 렌더 영역만 토글.
 *   → SSR 유지 + 탭 전환 빠름.
 * - 2026-06-16 결재 Q3: local state → **?tab= URL param** 전환.
 *   사유: 기록 시안이 `/users/[id]?tab=records` 링크를 출력 → 외부 링크 진입 시
 *   해당 탭이 열려야 함. URL 동기화는 history.replaceState(서버 재요청 0 · 데이터는 이미 prefetch).
 *
 * 어떻게:
 * - 초기 탭 = searchParams `?tab=` (유효값만, 기본 overview).
 * - 탭 클릭 = setState + history.replaceState 로 URL ?tab= 동기화(얕은 갱신).
 * - children 은 {overview, games, records} 세 개의 ReactNode prop 으로 주입.
 * ============================================================ */

import { useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export interface ProfileTabsProps {
  overview: ReactNode;
  games: ReactNode;
  records: ReactNode;
}

// 탭 정의 (id, label) — 추가/순서 변경 시 여기만 수정
const TABS = [
  { id: "overview", label: "개요" },
  { id: "games", label: "최근 경기" },
  { id: "records", label: "기록" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const isTabId = (v: string | null): v is TabId =>
  v != null && TABS.some((t) => t.id === v);

export function ProfileTabs({ overview, games, records }: ProfileTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 초기 탭 = ?tab= (유효값만) → 외부 딥링크(?tab=records) 진입 대응
  const initial = searchParams.get("tab");
  const [tab, setTab] = useState<TabId>(isTabId(initial) ? initial : "overview");

  const onSelect = (id: TabId) => {
    setTab(id);
    // URL ?tab= 동기화 — 서버 재요청 없이 주소만 갱신(데이터는 이미 prefetch)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", id);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    }
  };

  return (
    <>
      {/* 탭 스위처 */}
      <div
        style={{
          display: "flex",
          gap: 2,
          borderBottom: "1px solid var(--border)",
          marginBottom: 16,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              aria-pressed={active}
              style={{
                padding: "12px 18px",
                background: "transparent",
                border: 0,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? "var(--cafe-blue-deep)" : "var(--ink-mute)",
                borderBottom: active ? "2px solid var(--cafe-blue)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 활성 탭의 내용만 렌더 (hidden 처리 대신 조건 렌더 — 초기 렌더 비용 최소) */}
      {tab === "overview" && overview}
      {tab === "games" && games}
      {tab === "records" && records}
    </>
  );
}
