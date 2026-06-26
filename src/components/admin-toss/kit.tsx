"use client";

// =====================================================================
// kit.tsx — Toss 디자인시스템 공용 컴포넌트 키트 (Phase 0 이식)
//   박제 source: Dev/design/BDR-current/_handoff-admin-toss-P0/design-files/toss-kit.jsx
//   Icon(lucide-react) · Btn · Badge · Toggle · Check · StepDots · Empty · Modal
//
//   ⚠ 이식 변경점
//   - 시안의 window.lucide.createIcons() CDN 주입 제거 → lucide-react import 로 교체.
//     Icon 은 kebab-case 문자열명(name)을 받아 lucide-react 컴포넌트로 매핑한다
//     (시안 jsx 의 name="search" 같은 호출부를 그대로 살리기 위함).
//   - window.X 전역 노출 제거 → 전부 named export. props 에 TS 타입 부여.
//   - 클래스명 .ts-* 는 toss-admin.css([data-skin="toss"] 스코프) 와 1:1 매핑.
// =====================================================================

import React from "react";
import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";

// ── Icon ─────────────────────────────────────────────────────────────
// 시안은 name="search" 처럼 kebab-case 문자열을 쓴다. lucide-react 는 PascalCase
// 컴포넌트(Search)로 export 하므로, kebab→Pascal 변환 후 조회한다.
// 일부 시안 아이콘명은 lucide-react 에 없어서(예: won-sign) 별칭 테이블로 보정한다.
const ICON_ALIAS: Record<string, string> = {
  add: "Plus",
  arrow_back: "ArrowLeft",
  arrow_forward: "ArrowRight",
  check_circle: "CheckCircle",
  close: "X",
  collections_bookmark: "Layers",
  description: "FileText",
  edit: "Pencil",
  event: "CalendarDays",
  group: "Users",
  history: "History",
  info: "Info",
  inventory_2: "Archive",
  open_in_new: "ExternalLink",
  person_add: "UserPlus",
  shield: "Shield",
  shield_person: "ShieldUser",
  // 원화 아이콘 — lucide-react 에 WonSign 부재 → Banknote 로 대체
  "won-sign": "Banknote",
  // 썬더덩크(농구 임팩트 강조) — lucide-react 에 ThunderDunk 부재 → Zap(번개)로 대체
  thunderdunk: "Zap",
};

function kebabToPascal(name: string): string {
  return name
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join("");
}

// lucide-react 컴포넌트 맵 (런타임 조회용)
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
  // 별칭 우선 → kebab→Pascal 변환 순으로 lucide 컴포넌트 결정
  const compName = ICON_ALIAS[name] ?? kebabToPascal(name);
  const Cmp = LucideMap[compName];
  return (
    <span
      className={"licon" + (className ? " " + className : "")}
      style={{ width: size, height: size, color, ...style }}
    >
      {/* 매핑 실패 시 빈 span 유지(레이아웃 깨짐 방지) — 시안 빈 span 거동과 동일 */}
      {Cmp ? <Cmp size={size} color={color} /> : null}
    </span>
  );
}

// ── Btn ──────────────────────────────────────────────────────────────
export type BtnVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";
export type BtnSize = "sm" | "lg";

export type BtnProps = {
  variant?: BtnVariant;
  size?: BtnSize;
  block?: boolean;
  icon?: string; // 좌측 아이콘 name
  iconRight?: string; // 우측 아이콘 name
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
  // 아이콘 크기: sm 일 때 15px, 그 외 17px (시안 동일)
  const iconSize = size === "sm" ? 15 : 17;
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
export type ToggleProps = {
  on: boolean;
  onChange: (next: boolean) => void;
};

export function Toggle({ on, onChange }: ToggleProps) {
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
export type CheckProps = {
  on: boolean;
  onChange: (next: boolean) => void;
};

export function Check({ on, onChange }: CheckProps) {
  return (
    <button
      type="button"
      className="ts-check"
      // a11y: 시맨틱 체크박스 역할 + 체크 상태를 스크린리더에 노출
      role="checkbox"
      aria-checked={on}
      data-on={on ? "true" : "false"}
      onClick={() => onChange(!on)}
      // Space/Enter 로 토글 보장(키보드 접근성). 스크롤 점프 방지 위해 Space preventDefault
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!on);
        }
      }}
    >
      {on && <Icon name="check" size={15} />}
    </button>
  );
}

// ── StepDots ─────────────────────────────────────────────────────────
export type StepDotsProps = {
  step: number; // 현재 단계 인덱스(0-base) — i<=step 까지 채워짐
  total: number;
};

export function StepDots({ step, total }: StepDotsProps) {
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
  children?: React.ReactNode; // CTA 영역
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
  // ESC 키로 닫기 (시안 동일)
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
              aria-label="닫기"
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
