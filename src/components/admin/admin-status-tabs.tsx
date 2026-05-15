"use client";

/* ============================================================
 * AdminStatusTabs ???곹깭 ?꾪꽣 ??+ count 諭껋? (Admin-2 諛뺤젣 2026-05-15)
 *
 * 諛뺤젣 source: Dev/design/BDR-current/components-admin.jsx (AdminStatusTabs)
 * 諛뺤젣 target: src/components/admin/admin-status-tabs.tsx
 *
 * ?댁쑀 (??:
 *   - ?쒖븞 v2.14 ??`.admin-status-tabs / .admin-status-tab` ?쒓컖 諛뺤젣.
 *     count 諭껋? (99+ ?ㅻ쾭?뚮줈?? ?숈씪 ?⑦꽩.
 *   - ?몄텧泥?7媛??뚭? 0 蹂댁옣 ??props ?쒓렇?덉쿂 100% 蹂댁〈
 *     (tabs, activeTab, onChange). ?쒖븞??`current` 紐낆묶? 梨꾪깮 X
 *     (?댁쁺 ?곗꽑 ??`activeTab` 洹몃?濡?.
 *
 * ?대뼸寃?
 *   1. JSX 瑜??쒖븞 諛뺤젣: div.admin-status-tabs > button.admin-status-tab.
 *   2. data-active / data-overflow ?띿꽦 ?ъ슜 ??admin.css 媛 ?쒓컖 泥섎━.
 *   3. count 99+ ?ㅻ쾭?뚮줈??諛뺤젣 (?쒖븞 洹몃?濡?.
 * ============================================================ */
interface Tab {
  key: string;
  label: string;
  count?: number; // ???놁뿉 ?쒖떆??媛쒖닔 (?? "?묒닔以?(12)")
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
    // ?쒖븞 ?대옒????admin.css `.admin-status-tabs` 諛뺤젣
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
              // count 諭껋? ??99+ ?ㅻ쾭?뚮줈??(?쒖븞 諛뺤젣)
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
