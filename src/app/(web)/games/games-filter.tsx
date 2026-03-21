"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef, useState, useEffect } from "react";
import { Search, X } from "lucide-react";

const GAME_TYPES = [
  { value: "all", label: "전체 유형" },
  { value: "0",   label: "🏀 픽업" },
  { value: "1",   label: "🤝 게스트" },
  { value: "2",   label: "⚔️ 연습경기" },
];

const DATE_OPTIONS = [
  { value: "all",   label: "전체 날짜" },
  { value: "today", label: "오늘" },
  { value: "week",  label: "이번 주" },
  { value: "month", label: "이번 달" },
];

const selectCls =
  "h-10 w-full appearance-none rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] pl-3 pr-8 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)]/60 focus:outline-none cursor-pointer";

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
        width="12" height="12" viewBox="0 0 12 12" fill="none"
      >
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function GamesFilter({ cities }: { cities: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const hasActiveFilters = params.get("q") || params.get("type") || params.get("city") || params.get("date");

  const update = useCallback(
    (updates: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === "all") sp.delete(k);
        else sp.set(k, v);
      }
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, params]
  );

  const handleSearch = (v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ q: v }), 380);
  };

  const clearAll = () => {
    router.push(pathname);
    setOpen(false);
  };

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* 검색 아이콘 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          open || hasActiveFilters
            ? "bg-[var(--color-accent)] text-white"
            : "text-[var(--color-text-muted)] hover:bg-[var(--color-accent)]/8 hover:text-[var(--color-text-primary)]"
        }`}
        title="검색 및 필터"
      >
        {open ? <X size={18} /> : <Search size={18} />}
      </button>

      {/* 활성 필터 도트 인디케이터 */}
      {hasActiveFilters && !open && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
      )}

      {/* 플로팅 패널 */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[300px] rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] space-y-3">
          {/* 검색 */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="경기 검색..."
              defaultValue={params.get("q") ?? ""}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="h-10 w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] pl-9 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]/60 focus:outline-none"
            />
          </div>

          {/* 필터 그리드 */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={params.get("type") ?? "all"} onChange={(v) => update({ type: v })}>
              {GAME_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>

            <Select value={params.get("city") ?? "all"} onChange={(v) => update({ city: v })}>
              <option value="all">전체 지역</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>

          <Select value={params.get("date") ?? "all"} onChange={(v) => update({ date: v })}>
            {DATE_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </Select>

          {/* 초기화 버튼 */}
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="w-full rounded-full border border-[var(--color-border)] py-2 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)] transition-colors"
            >
              필터 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}
