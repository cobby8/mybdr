"use client";

// =====================================================================
// toolbar.tsx — 필터 툴바(검색 + 상태 탭 + 우측 슬롯) (v2.40 A2 박제)
//   박제 source: Dev/design/BDR v2.40/_admin-unified/au-kit.jsx (Toolbar)
//   좌측 검색 인풋 + 상태 필터 탭(pill) + 우측 액션 슬롯.
//
//   'use client' — onSearch/onTab 핸들러 보유.
//   ⚠ IME 가드: 한글 조합 중(compositionstart~end)에는 onSearch 를 호출하지 않는다.
//     조합 중 setState 가 일어나면 input value 가 되감겨 글자가 끊기는
//     한글 입력 버그를 막는다(종별마스터/기존 admin 검색 패턴과 동일).
// =====================================================================

import React from "react";
import { Icon } from "@/components/admin-toss";

// 상태 탭 1개 — id/label + (옵션)카운트
export type ToolbarTab = {
  id: string;
  label: React.ReactNode;
  n?: number | null; // 우측 카운트(옵션)
};

export type ToolbarProps = {
  search?: string; // 검색어(제어값)
  onSearch?: (value: string) => void; // 검색어 변경 핸들러(있으면 검색칸 표시)
  placeholder?: string; // 검색 placeholder(기본 "검색")
  tabs?: ToolbarTab[]; // 상태 탭(있으면 탭 표시)
  active?: string; // 활성 탭 id
  onTab?: (id: string) => void; // 탭 클릭 핸들러
  right?: React.ReactNode; // 우측 슬롯(옵션)
};

export function Toolbar({
  search = "",
  onSearch,
  placeholder = "검색",
  tabs,
  active,
  onTab,
  right,
}: ToolbarProps) {
  // IME 조합 상태 — 조합 중이면 onSearch 보류(끝날 때 한 번에 반영)
  const composingRef = React.useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (composingRef.current) return; // 조합 중에는 부모 state 갱신 보류
    onSearch?.(e.target.value);
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    composingRef.current = false;
    // 조합 종료 시점의 최종 값을 한 번에 반영
    onSearch?.((e.target as HTMLInputElement).value);
  };

  return (
    <div className="au-toolbar">
      {onSearch && (
        <label className="au-search">
          <Icon name="search" size={18} />
          <input
            value={search}
            onChange={handleChange}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={handleCompositionEnd}
            placeholder={placeholder}
          />
        </label>
      )}
      {tabs && (
        <div className="au-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className="au-tab"
              data-active={active === t.id ? "true" : "false"}
              onClick={() => onTab?.(t.id)}
            >
              {t.label}
              {t.n != null && <span className="au-tab__n">{t.n}</span>}
            </button>
          ))}
        </div>
      )}
      {right && (
        <>
          <div className="au-toolbar__spacer" />
          {right}
        </>
      )}
    </div>
  );
}
