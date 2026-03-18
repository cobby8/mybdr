"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const STATUSES = [
  { value: "all",               label: "전체" },
  { value: "registration_open", label: "모집중" },
  { value: "ongoing",           label: "진행중" },
  { value: "completed",         label: "완료" },
];

export function TournamentsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("status") ?? "all";

  const setStatus = useCallback(
    (value: string) => {
      const sp = new URLSearchParams(params.toString());
      if (!value || value === "all") sp.delete("status");
      else sp.set("status", value);
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, params]
  );

  return (
    <div className="mb-6 flex gap-2 overflow-x-auto">
      {STATUSES.map((s) => {
        const active = current === s.value;
        return (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium min-h-[44px] transition-all ${
              active
                ? "bg-[#1B3C87] text-white shadow-sm"
                : "border border-[#E8ECF0] bg-white text-[#6B7280] hover:border-[#1B3C87]/40 hover:text-[#111827]"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
