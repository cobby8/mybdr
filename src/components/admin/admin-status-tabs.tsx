"use client";

// 관리자 상태 탭 — (web) 디자인 시스템 일관성 (Phase D, 2026-05-02)
// 프론트 시안의 .eyebrow + 밑줄 탭 패턴 차용 (web 페이지 탭 시각 일치).
// 각 페이지에서 "전체/준비중/진행중/종료" 등 상태 필터링에 사용.
interface Tab {
  key: string;
  label: string;
  count?: number; // 탭 옆에 표시할 개수 (예: "접수중 (12)")
}

interface AdminStatusTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export function AdminStatusTabs({
  tabs,
  activeTab,
  onChange,
}: AdminStatusTabsProps) {
  return (
    // 가로 스크롤 가능 — 모바일에서 탭이 많아도 사용 가능
    <div className="mb-4 overflow-x-auto -mx-1 px-1">
      <div
        className="flex gap-1 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className="relative shrink-0 px-4 py-2.5 text-[13px] font-semibold transition-colors"
              style={{
                fontFamily: "var(--ff-display)",
                letterSpacing: "-0.01em",
                color: isActive
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="ml-1.5 inline-flex min-w-[20px] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold"
                  style={{
                    backgroundColor: isActive
                      ? "color-mix(in oklab, var(--color-accent) 12%, transparent)"
                      : "var(--color-elevated)",
                    color: isActive
                      ? "var(--color-accent)"
                      : "var(--color-text-muted)",
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  {tab.count}
                </span>
              )}
              {/* 활성 탭 밑줄 — primary 색상 */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--color-accent)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
