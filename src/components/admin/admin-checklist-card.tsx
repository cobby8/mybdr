"use client";

/* ============================================================
 * AdminChecklistCard — 체크리스트 카드 (Admin-1 Phase · 2026-05-15)
 *
 * 박제 source: Dev/design/BDR-current/components-admin-checklist.jsx (AdminChecklistCard)
 * 박제 target: src/components/admin/admin-checklist-card.tsx
 *
 * 이유: 시안 v2.14 신규 컴포넌트 — Admin-2 SetupHub (E-3) 의 8 항목 카드.
 *      각 항목 = num + label + desc + icon + status(done/progress/idle/locked)
 *      + required(*) + locked_reason. 클릭 시 진입 트리거 (lock 시 비활성).
 *
 * 시안 시그니처 박제:
 *   - num: "1" ~ "8" 번호
 *   - label: 카드 제목 (예: "기본 정보")
 *   - desc: 짧은 설명
 *   - icon: Material Symbol (예: 'info')
 *   - status: 'done' | 'progress' | 'idle' | 'locked'
 *     - done    — border-left 3px ok / 우상단 check_circle
 *     - progress— border-left 3px accent / 우상단 pending
 *     - idle    — border 기본 / 우상단 radio_button_unchecked
 *     - locked  — bg alt + opacity 0.6 + 우상단 lock + clickable false
 *   - required: bool (필수 표시 빨강 *)
 *   - locked_reason: 잠금 사유 (예: "4. 운영 방식 선행")
 *   - onClick: 진입 트리거 (locked 시 비활성)
 *
 * 토큰 사용:
 *   - border-radius: 50% (W=H 원형 — pill 9999px 금지 룰 회피)
 *   - var(--err) 토큰은 글로벌에 미박제 → var(--danger) 로 치환 박제
 *     (시안 jsx 의 'var(--err)' 1건만 — 시각 동일 빨강)
 * ============================================================ */

import { useState } from "react";

type ChecklistStatus = "done" | "progress" | "idle" | "locked";

interface AdminChecklistCardProps {
  num: string;
  label: string;
  desc: string;
  icon: string;
  status?: ChecklistStatus;
  required?: boolean;
  lockedReason?: string;
  onClick?: () => void;
}

// 상태별 시각 박제 — 시안 cfg 그대로
const STATUS_CONFIG: Record<
  ChecklistStatus,
  {
    bg: string;
    border: string;
    iconColor: string;
    statusIcon: string;
    statusLabel: string;
  }
> = {
  done: {
    bg: "var(--bg-card)",
    border: "var(--ok)",
    iconColor: "var(--ok)",
    statusIcon: "check_circle",
    statusLabel: "완료",
  },
  progress: {
    bg: "var(--bg-card)",
    border: "var(--accent)",
    iconColor: "var(--accent)",
    statusIcon: "pending",
    statusLabel: "진행중",
  },
  idle: {
    bg: "var(--bg-card)",
    border: "var(--border)",
    iconColor: "var(--ink-mute)",
    statusIcon: "radio_button_unchecked",
    statusLabel: "미시작",
  },
  locked: {
    bg: "var(--bg-alt)",
    border: "var(--border)",
    iconColor: "var(--ink-dim)",
    statusIcon: "lock",
    statusLabel: "잠금",
  },
};

export function AdminChecklistCard({
  num,
  label,
  desc,
  icon,
  status = "idle",
  required,
  lockedReason,
  onClick,
}: AdminChecklistCardProps) {
  const cfg = STATUS_CONFIG[status];
  const clickable = status !== "locked";
  // hover/press 미세 animation — 시안 박제 (transform translateY)
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      onMouseDown={() => clickable && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 14,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        // border-left 3px 강조 — done/progress 시
        borderLeft:
          status === "done"
            ? `3px solid ${cfg.border}`
            : status === "progress"
            ? `3px solid ${cfg.border}`
            : `1px solid ${cfg.border}`,
        borderRadius: 6,
        cursor: clickable ? "pointer" : "not-allowed",
        opacity: status === "locked" ? 0.6 : 1,
        textAlign: "left",
        width: "100%",
        fontFamily: "inherit",
        transition: "transform .12s ease",
        position: "relative",
        transform: pressed ? "translateY(1px)" : "translateY(0)",
      }}
    >
      {/* 헤더 — num 뱃지 + icon + label + required(*) + statusIcon */}
      <header style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* num 뱃지 — W=H 원형 (50% radius — pill 9999px 금지 룰 회피) */}
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 50,
            background: "var(--bg-alt)",
            color: "var(--ink-mute)",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--ff-mono)",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {num}
        </span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: cfg.iconColor }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span
          style={{
            fontWeight: 600,
            fontSize: 13.5,
            color: "var(--ink)",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        {/* 필수 표시 — 시안 var(--err) → 운영 var(--danger) 치환 (시각 동일 빨강) */}
        {required && (
          <span
            style={{ fontSize: 10, color: "var(--danger)", fontWeight: 700 }}
            aria-label="필수"
          >
            *
          </span>
        )}
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: cfg.iconColor, flexShrink: 0 }}
          aria-hidden="true"
        >
          {cfg.statusIcon}
        </span>
      </header>
      {/* 설명 */}
      <div style={{ fontSize: 11.5, color: "var(--ink-mute)", lineHeight: 1.5 }}>{desc}</div>
      {/* 잠금 사유 — status=locked + lockedReason 둘 다 있을 때 */}
      {status === "locked" && lockedReason && (
        <div
          style={{
            fontSize: 10.5,
            color: "var(--ink-dim)",
            fontFamily: "var(--ff-mono)",
            marginTop: 2,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 11, verticalAlign: "-2px", marginRight: 3 }}
            aria-hidden="true"
          >
            lock
          </span>
          {lockedReason}
        </div>
      )}
      {/* 하단 — 상태 pill + chevron_right (clickable 시) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 4,
        }}
      >
        <span
          className="admin-stat-pill"
          data-tone={
            status === "done"
              ? "ok"
              : status === "progress"
              ? "accent"
              : status === "locked"
              ? "mute"
              : "mute"
          }
        >
          {cfg.statusLabel}
        </span>
        {clickable && (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: "var(--ink-mute)" }}
            aria-hidden="true"
          >
            chevron_right
          </span>
        )}
      </div>
    </button>
  );
}
