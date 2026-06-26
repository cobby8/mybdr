import React from "react";
import { Icon } from "@/components/admin-toss";

export type StatItem = {
  icon: string;
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  tone?: "primary" | "ok" | "warn" | "danger" | "violet";
};

export type StatRowProps = {
  items: StatItem[];
};

export function StatRow({ items }: StatRowProps) {
  return (
    <div className="ad-kpi-grid">
      {items.map((s, i) => (
        <div className="ad-kpi" key={i}>
          <div className="ad-kpi__top">
            <span className="ad-kpi__icon" data-tone={s.tone || "primary"}>
              <Icon name={s.icon} size={18} />
            </span>
            {s.delta && (
              <span className="ad-kpi__delta" data-dir={s.trend || "flat"}>
                {s.delta}
              </span>
            )}
          </div>
          <div className="ad-kpi__val">{s.value}</div>
          <div className="ad-kpi__label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
