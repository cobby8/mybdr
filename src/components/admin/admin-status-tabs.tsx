"use client";

interface Tab {
  key: string;
  label: string;
  count?: number;
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
    <div className="ad-tabs" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            className="ad-tab"
            data-active={isActive ? "true" : "false"}
            onClick={() => onChange(tab.key)}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="ad-tab__n" data-overflow={tab.count > 99 ? "true" : "false"}>
                {tab.count > 99 ? "99+" : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
