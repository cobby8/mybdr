"use client";

/* ============================================================
 * AdminProgressBar — 진행도 바 (Admin-1 Phase · 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin-checklist.jsx (AdminProgressBar)
 * 박제 target: src/components/admin/admin-progress-bar.tsx
 *
 * 이유: 시안 v2.14 신규 컴포넌트 — completed/total 진행도 + % 표시.
 *      Admin-2 SetupHub (E-3) 에서 8 항목 진행도 표시용. 그 외 협회/시리즈
 *      등 다단계 작업에서도 재사용 가능.
 *
 * 시안 시그니처 박제:
 *   - completed: 완료 항목 수
 *   - total: 전체 항목 수
 *   - label: 좌측 라벨 (옵션)
 *   - size: 'sm' | 'md' (기본 'md' — 폰트/높이 분기)
 *   - showCount: bool (기본 true — "N/M" 표시)
 *   - showPercent: bool (기본 true — "(%)" 표시)
 *   - tone: 'accent' | 'ok' | 'warn' (기본 'accent')
 *     완료 시 (completed >= total > 0) 자동 ok 토큰 박제 (시안 isDone 로직)
 *
 * 토큰 사용:
 *   - 바 트랙: --bg-alt / 바 fill: --accent / --ok / --warn
 *   - 글자: --ink-soft / --ink-mute / --ok (완료 시)
 * ============================================================ */

interface AdminProgressBarProps {
  completed: number;
  total: number;
  label?: string;
  size?: "sm" | "md";
  showCount?: boolean;
  showPercent?: boolean;
  tone?: "accent" | "ok" | "warn";
}

export function AdminProgressBar({
  completed,
  total,
  label,
  size = "md",
  showCount = true,
  showPercent = true,
  tone = "accent",
}: AdminProgressBarProps) {
  // 진행률 0~100 — total=0 시 0 (NaN 가드)
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  // 완료 판정 — total>0 + completed >= total
  const isDone = completed >= total && total > 0;
  // 바 색상 — 완료 시 무조건 ok / 그 외 tone 따라
  const barTone =
    isDone
      ? "var(--ok)"
      : tone === "ok"
      ? "var(--ok)"
      : tone === "warn"
      ? "var(--warn)"
      : "var(--accent)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* 상단 라벨 줄 — label / count / percent 중 하나라도 있을 때만 노출 */}
      {(label || showCount || showPercent) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          {label && (
            <span
              style={{
                fontSize: size === "sm" ? 11 : 12.5,
                color: "var(--ink-soft)",
                fontWeight: 500,
              }}
            >
              {label}
            </span>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginLeft: "auto" }}>
            {showCount && (
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: size === "sm" ? 11 : 12.5,
                  fontWeight: 700,
                  color: isDone ? "var(--ok)" : "var(--ink)",
                }}
              >
                {completed}
                <span style={{ color: "var(--ink-mute)", fontWeight: 400 }}>/{total}</span>
              </span>
            )}
            {showPercent && (
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: size === "sm" ? 10 : 11,
                  color: "var(--ink-mute)",
                }}
              >
                ({pct}%)
              </span>
            )}
          </div>
        </div>
      )}
      {/* 바 트랙 + fill */}
      <div
        style={{
          height: size === "sm" ? 4 : 8,
          background: "var(--bg-alt)",
          borderRadius: size === "sm" ? 2 : 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: barTone,
            borderRadius: "inherit",
            transition: "width .2s ease",
          }}
        />
      </div>
    </div>
  );
}
