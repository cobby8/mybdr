// =====================================================================
// stat-row.tsx — 통계 카드 행 (v2.40 A2 박제)
//   박제 source: Dev/design/BDR v2.40/_admin-unified/au-kit.jsx (StatRow)
//   여러 개의 통계 카드를 grid(.au-stats)로 묶어 한 줄에 배치.
//   각 카드 = 아이콘 + 라벨 + 값 + (옵션)증감 델타/추세.
//
//   서버 컴포넌트 — 순수 표시. 시안 .au-stat 마크업을 그대로 박제한다
//   (기존 StatCard 와 클래스/레이아웃이 달라 별도 박제·delta/trend 지원).
// =====================================================================

import React from "react";
import { Icon } from "@/components/admin-toss";

// 카드 1개 데이터 — 시안 items 스펙과 1:1
export type StatItem = {
  icon: string; // 아이콘 name(kebab)
  label: React.ReactNode; // 라벨
  value: React.ReactNode; // 값(보통 숫자)
  delta?: React.ReactNode; // 증감 텍스트(옵션)
  trend?: "up" | "down" | "flat"; // 추세(델타 색/아이콘 결정)
};

export type StatRowProps = {
  items: StatItem[];
};

export function StatRow({ items }: StatRowProps) {
  return (
    <div className="au-stats">
      {items.map((s, i) => (
        <div className="au-stat" key={i}>
          <div className="au-stat__top">
            <span className="au-stat__icon">
              <Icon name={s.icon} size={20} />
            </span>
            <span className="au-stat__label">{s.label}</span>
          </div>
          <div className="au-stat__value">{s.value}</div>
          {s.delta && (
            // data-trend 로 색(상승=ok/하락=danger/유지=mute) CSS 분기
            <div className="au-stat__delta" data-trend={s.trend || "flat"}>
              {s.trend && (
                <Icon
                  name={
                    s.trend === "up"
                      ? "trending-up"
                      : s.trend === "down"
                        ? "trending-down"
                        : "minus"
                  }
                  size={14}
                />
              )}
              {s.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
