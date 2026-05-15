"use client";

/* ============================================================
 * AdminStatusTabs — 상태 필터 탭 + count 뱃지 (Admin-2 박제 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin.jsx (AdminStatusTabs)
 * 박제 target: src/components/admin/admin-status-tabs.tsx
 *
 * 이유 (왜):
 *   - 시안 v2.14 의 `.admin-status-tabs / .admin-status-tab` 시각 박제.
 *     count 뱃지 (99+ 오버플로우) 동일 패턴.
 *   - 호출처 7개 회귀 0 보장 — props 시그니처 100% 보존
 *     (tabs, activeTab, onChange). 시안의 `current` 명칭은 채택 X
 *     (운영 우선 — `activeTab` 그대로).
 *
 * 어떻게:
 *   1. JSX 를 시안 박제: div.admin-status-tabs > button.admin-status-tab.
 *   2. data-active / data-overflow 속성 사용 — admin.css 가 시각 처리.
 *   3. count 99+ 오버플로우 박제 (시안 그대로).
 * ============================================================ */
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
    // 시안 클래스 — admin.css `.admin-status-tabs` 박제
    <div className="admin-status-tabs" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            className="admin-status-tab"
            data-active={isActive ? "true" : "false"}
            onClick={() => onChange(tab.key)}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              // count 뱃지 — 99+ 오버플로우 (시안 박제)
              <span
                className="admin-status-tab__count"
                data-overflow={tab.count > 99 ? "true" : "false"}
              >
                {tab.count > 99 ? "99+" : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
