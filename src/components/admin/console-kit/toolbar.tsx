"use client";

import React from "react";
import { Icon } from "@/components/admin-toss";

export type ToolbarTab = {
  id: string;
  label: React.ReactNode;
  n?: number | null;
};

export type ToolbarProps = {
  search?: string;
  onSearch?: (value: string) => void;
  placeholder?: string;
  tabs?: ToolbarTab[];
  active?: string;
  onTab?: (id: string) => void;
  right?: React.ReactNode;
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
  const composingRef = React.useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (composingRef.current) return;
    onSearch?.(e.target.value);
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    composingRef.current = false;
    onSearch?.((e.target as HTMLInputElement).value);
  };

  return (
    <div className="ad-toolbar">
      {onSearch && (
        <label className="ad-search">
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
        <div className="ad-filters">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className="ad-tab"
              data-active={active === t.id ? "true" : "false"}
              onClick={() => onTab?.(t.id)}
            >
              {t.label}
              {t.n != null && <span className="ad-tab__n">{t.n}</span>}
            </button>
          ))}
        </div>
      )}
      {right && (
        <>
          <div className="ad-toolbar__spacer" />
          {right}
        </>
      )}
    </div>
  );
}
