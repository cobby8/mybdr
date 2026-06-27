"use client";

// =====================================================================
// admin-v2/blocks/panels.tsx — 대시보드 패널(정본 박제)
//   박제 source: Dev/design/BDR v2.41-admin-toss/admin-blocks.jsx
//     AdBarPanel(막대 차트) / AdListPanel(처리대기·활동 리스트) / adToneColor
//
//   ⚠ 이식 변경점
//   - window.adToneColor violet "#6D5AE6"(하드코딩 hex) → var(--primary) 토큰 대체.
//     관리자=Toss 하드코딩 hex 0 룰 준수(틴트용 보조색이라 시각영향 미미).
//   - Icon/Badge 는 @/components/admin-toss import.
//   - ad-panel/ad-bars/ad-listrow 클래스는 toss-admin.css([data-skin="toss"]) 추가분.
// =====================================================================

import type { ReactNode } from "react";
import { Icon, Badge } from "@/components/admin-toss";
import type { BadgeTone } from "@/components/admin-toss";

// ── tone → CSS 변수(아이콘 틴트) ─────────────────────────────────────
//   정본 toneColor 의 violet(#6D5AE6) 만 토큰(var(--primary))으로 대체(하드코딩 hex 0).
export function adToneColor(t?: string): string {
  switch (t) {
    case "ok":
      return "var(--ok)";
    case "primary":
      return "var(--primary)";
    case "warn":
      return "var(--warn)";
    case "violet":
      return "var(--primary)"; // 정본 #6D5AE6 → 토큰 대체
    case "danger":
      return "var(--danger)";
    default:
      return "var(--ink-soft)";
  }
}

// ── 막대 차트 패널 ───────────────────────────────────────────────────
export interface BarDatum {
  m: string; // x축 라벨(월 등)
  v: number; // 값
  soft?: boolean; // 약한(연한) 막대
}

export interface AdBarPanelProps {
  title: ReactNode;
  badge?: ReactNode;
  badgeTone?: BadgeTone;
  data: BarDatum[];
}

export function AdBarPanel({ title, badge, badgeTone, data }: AdBarPanelProps) {
  const max = Math.max(...data.map((c) => c.v));
  return (
    <div className="ad-panel">
      <div className="ad-panel__head">
        <div className="ad-panel__title">{title}</div>
        {badge && <Badge tone={badgeTone || "primary"}>{badge}</Badge>}
      </div>
      <div className="ad-bars">
        {data.map((c) => (
          <div key={c.m} className="ad-bar">
            {/* 높이는 max 대비 비율(정본 동일: 최대 130px) */}
            <div
              className="ad-bar__col"
              data-soft={c.soft ? "true" : "false"}
              style={{ height: (c.v / max) * 130 + "px" }}
            />
            <div className="ad-bar__lbl">{c.m}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 리스트 패널(처리대기 / 활동) ─────────────────────────────────────
export interface ListItem {
  id: string | number;
  icon: string;
  t: ReactNode; // 제목
  s?: ReactNode; // 서브(비-bar 모드)
  time?: ReactNode; // 우측 메타(비-bar 모드)
  v?: string | number; // bar 모드: 진행률(예: "70%") 또는 값
  tone?: string; // 비-bar 모드 아이콘 틴트
  color?: string; // bar 모드 아이콘/막대 색(데이터 주입)
}

export interface AdListPanelProps {
  title: ReactNode;
  badge?: ReactNode;
  badgeTone?: BadgeTone;
  items: ListItem[];
  bar?: boolean; // true=진행률 막대 모드, false=상태/시간 모드
}

export function AdListPanel({
  title,
  badge,
  badgeTone,
  items,
  bar,
}: AdListPanelProps) {
  return (
    <div className="ad-panel">
      <div className="ad-panel__head">
        <div className="ad-panel__title">{title}</div>
        {badge && <Badge tone={badgeTone || "warn"}>{badge}</Badge>}
      </div>
      <div className="ad-list">
        {items.map((a) => (
          <div key={a.id} className="ad-listrow">
            {/* bar 모드 배경 = a.color + "1A"(8자리 hex 알파). a.color 는 데이터 주입 */}
            <span
              className="ad-listrow__icon"
              style={{ background: bar ? a.color + "1A" : "var(--grey-100)" }}
            >
              <Icon
                name={a.icon}
                size={17}
                color={bar ? a.color : adToneColor(a.tone)}
              />
            </span>
            <div className="ad-listrow__body">
              <div className="ad-listrow__t">{a.t}</div>
              {bar ? (
                // 진행률 막대(정본 인라인 스타일 1:1 — 토큰 var 사용)
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "var(--grey-100)",
                    marginTop: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: a.v,
                      background: a.color,
                      borderRadius: 3,
                    }}
                  />
                </div>
              ) : (
                a.s && <div className="ad-listrow__s">{a.s}</div>
              )}
            </div>
            <span
              className="ad-listrow__meta"
              style={bar ? { fontWeight: 800, color: "var(--ink)" } : undefined}
            >
              {bar ? a.v : a.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
