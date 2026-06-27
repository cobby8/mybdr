"use client";

// =====================================================================
// kit.tsx — admin-v2 Toss 공용 컴포넌트 키트 (R1 클린 슬레이트 토대)
//   정본 1:1 포팅: Dev/design/BDR v2.41-admin-toss/toss-kit.jsx
//   Icon(lucide-react) · Btn · Badge · Toggle · Check · StepDots · Empty · Modal
//
//   이식 변경점(시각 동일성 보존):
//   - 정본 window.lucide.createIcons() CDN 주입 → lucide-react import 로 교체.
//     Icon 은 kebab-case 문자열명(name="search")을 그대로 받아 PascalCase 매핑.
//   - window.X 전역 노출 → named export. props 에 TS 타입 부여.
//   - className(.ts-*) 은 정본 그대로 → src/styles/admin-v2/toss.css 와 1:1.
//   - 레거시(components/admin·admin-toss·toss-admin.css) 0 import. 자기완결.
// =====================================================================

import React from "react";
import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";

// ── Icon ─────────────────────────────────────────────────────────────
// 정본은 name="search" 처럼 kebab-case 를 쓴다. lucide-react 는 PascalCase
// 컴포넌트(Search)로 export → kebab→Pascal 변환 후 조회. 일부 별칭만 보정.
const ICON_ALIAS: Record<string, string> = {
  "won-sign": "Banknote", // lucide-react 에 WonSign 부재 → 지폐 아이콘 대체
};

function kebabToPascal(name: string): string {
  return name
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join("");
}

const LucideMap = Lucide as unknown as Record<
  string,
  React.ComponentType<LucideProps>
>;

export type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function Icon({ name, size = 20, color, style, className }: IconProps) {
  const compName = ICON_ALIAS[name] ?? kebabToPascal(name);
  const Cmp = LucideMap[compName];
  // 정본 span(.licon) 래퍼 그대로. 매핑 실패 시 빈 span 유지(레이아웃 보존).
  return (
    <span
      className={"licon" + (className ? " " + className : "")}
      style={{ width: size, height: size, color, ...style }}
    >
      {Cmp ? <Cmp size={size} color={color} /> : null}
    </span>
  );
}

// ── Btn ──────────────────────────────────────────────────────────────
export type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
export type BtnSize = "sm" | "lg";

export type BtnProps = {
  variant?: BtnVariant;
  size?: BtnSize;
  block?: boolean;
  icon?: string;
  iconRight?: string;
  children?: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function Btn({
  variant = "primary",
  size,
  block,
  icon,
  iconRight,
  children,
  ...rest
}: BtnProps) {
  const cls = ["ts-btn", `ts-btn--${variant}`];
  if (size) cls.push(`ts-btn--${size}`);
  if (block) cls.push("ts-btn--block");
  const iconSize = size === "sm" ? 15 : 17; // 정본 동일
  return (
    <button type="button" className={cls.join(" ")} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}

// ── Badge ────────────────────────────────────────────────────────────
export type BadgeTone = "primary" | "ok" | "warn" | "danger" | "grey";

export type BadgeProps = {
  tone?: BadgeTone;
  icon?: string;
  children?: React.ReactNode;
};

export function Badge({ tone = "grey", icon, children }: BadgeProps) {
  return (
    <span className={`ts-badge ts-badge--${tone}`}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

// ── Toggle ───────────────────────────────────────────────────────────
export function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="ts-toggle"
      data-on={on ? "true" : "false"}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="ts-toggle__knob" />
    </button>
  );
}

// ── Check ────────────────────────────────────────────────────────────
export function Check({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="ts-check"
      data-on={on ? "true" : "false"}
      onClick={() => onChange(!on)}
    >
      {on && <Icon name="check" size={15} />}
    </button>
  );
}

// ── StepDots ─────────────────────────────────────────────────────────
export function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="ts-steps">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="ts-steps__seg"
          data-on={i <= step ? "true" : "false"}
        />
      ))}
    </div>
  );
}

// ── Empty ────────────────────────────────────────────────────────────
export type EmptyProps = {
  icon?: string;
  title?: React.ReactNode;
  desc?: React.ReactNode;
  children?: React.ReactNode;
};

export function Empty({ icon = "inbox", title, desc, children }: EmptyProps) {
  return (
    <div className="ts-empty">
      <div className="ts-empty__icon">
        <Icon name={icon} size={30} />
      </div>
      <div className="ts-empty__title">{title}</div>
      {desc && <div className="ts-empty__desc">{desc}</div>}
      {children && (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────
export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  foot?: React.ReactNode;
  maxWidth?: number;
};

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  foot,
  maxWidth = 520,
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="ts-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ts-modal"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
      >
        <div className="ts-modal__head">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div>
              <div className="ts-modal__title">{title}</div>
              {sub && <div className="ts-modal__sub">{sub}</div>}
            </div>
            <button
              type="button"
              className="ts-btn ts-btn--ghost ts-btn--sm"
              style={{ padding: 8, marginRight: -8, marginTop: -4 }}
              onClick={onClose}
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        </div>
        <div className="ts-modal__body">{children}</div>
        {foot && <div className="ts-modal__foot">{foot}</div>}
      </div>
    </div>
  );
}
