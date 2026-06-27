"use client";

// =====================================================================
// admin-v2/blocks/settings.tsx — 설정 페이지 블록(정본 박제)
//   박제 source: Dev/design/BDR v2.41-admin-toss/admin-blocks.jsx AdSettings
//   토글/값 항목 그룹 + 저장/취소 바.
//
//   ⚠ 이식 변경점
//   - window.adToast 데모 토스트 제거(저장/취소 버튼) → 소비처(M3)에서 배선.
//   - Toggle/Btn 은 @/components/admin-toss import.
//   - ad-panel 클래스는 toss-admin.css([data-skin="toss"]) 추가분.
// =====================================================================

import { useState } from "react";
import type { ReactNode } from "react";
import { Toggle, Btn } from "@/components/admin-toss";
import { PageHead } from "./page-head";

// 토글 항목 / 값 표시 항목 — discriminated union(type).
export interface SettingsToggleItem {
  type: "toggle";
  k: string;
  label: ReactNode;
  desc?: ReactNode;
  on: boolean;
}
export interface SettingsValueItem {
  type: "value";
  k: string;
  label: ReactNode;
  desc?: ReactNode;
  value: ReactNode;
}
export type SettingsItem = SettingsToggleItem | SettingsValueItem;

export interface SettingsGroup {
  group: string;
  items: SettingsItem[];
}

export interface AdSettingsProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  groups: SettingsGroup[];
}

export function AdSettings({ eyebrow, title, sub, groups }: AdSettingsProps) {
  // 토글 항목 초기 상태 맵(정본 동일: type==="toggle" 만 수집)
  const [st, setSt] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    groups.forEach((g) =>
      g.items.forEach((i) => {
        if (i.type === "toggle") m[i.k] = i.on;
      }),
    );
    return m;
  });

  return (
    <div>
      <PageHead eyebrow={eyebrow || ""} title={title} sub={sub} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 720,
        }}
      >
        {groups.map((g) => (
          <div key={g.group} className="ad-panel">
            <div className="ad-panel__title" style={{ marginBottom: 14 }}>
              {g.group}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {g.items.map((it, i) => (
                <div
                  key={it.k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 0",
                    // 첫 항목 외 상단 구분선(정본 동일)
                    borderTop: i ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}
                    >
                      {it.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--ink-mute)",
                        marginTop: 3,
                      }}
                    >
                      {it.desc}
                    </div>
                  </div>
                  {it.type === "toggle" ? (
                    <Toggle
                      on={st[it.k]}
                      onChange={(v) => setSt((s) => ({ ...s, [it.k]: v }))}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: "var(--primary)",
                        fontFamily: "var(--ff-mono)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {it.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* 저장/취소 — 정본 데모 토스트 제거. 소비처(M3)에서 onSave 배선 예정 */}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn icon="check">변경사항 저장</Btn>
          <Btn variant="secondary">취소</Btn>
        </div>
      </div>
    </div>
  );
}
