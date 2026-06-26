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
  domain: "Building2",
  description: "FileText",
  edit: "Pencil",
  event: "CalendarDays",
  folder_managed: "FolderCog",
  group: "Users",
  history: "History",
  info: "Info",
  inventory_2: "Archive",
  link_off: "Unlink",
  manage_accounts: "UserCog",
  more_vert: "MoreVertical",
  open_in_new: "ExternalLink",
  payments: "CreditCard",
  person: "User",
  person_add: "UserPlus",
  person_off: "UserX",
  radio_button_unchecked: "Circle",
  shield: "Shield",
  shield_person: "ShieldUser",
  sports: "Trophy",
  swap_horiz: "ArrowLeftRight",
  pending: "Clock3",
  chevron_right: "ChevronRight",
  warning: "TriangleAlert",
  verified_user: "ShieldCheck",
  unarchive: "ArchiveRestore",
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

// ── State helpers ────────────────────────────────────────────────────
export type SkelProps = {
  w?: number | string;
  h?: number | string;
  r?: number | string;
  style?: React.CSSProperties;
};

export function Skel({ w = "100%", h = 14, r = 8, style }: SkelProps) {
  return (
    <span
      className="st-skel"
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}

export type SkelTableProps = {
  rows?: number;
};

export function SkelTable({ rows = 5 }: SkelTableProps) {
  return (
    <div className="ts-card st-skel-table">
      <div className="st-skrow st-skrow--head">
        <Skel w="22%" h={12} />
        <Skel w="14%" h={12} />
        <Skel w="14%" h={12} />
        <Skel w="10%" h={12} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="st-skrow">
          <div className="st-skrow__main">
            <Skel w={34} h={34} r={10} />
            <div className="st-skrow__text">
              <Skel w="46%" h={13} />
              <Skel w="28%" h={10} style={{ marginTop: 7 }} />
            </div>
          </div>
          <Skel w={54} h={13} />
          <Skel w={54} h={13} />
          <Skel w={64} h={26} r={8} />
        </div>
      ))}
    </div>
  );
}

export type ErrStateProps = {
  title: React.ReactNode;
  desc?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: React.ReactNode;
};

export function ErrState({
  title,
  desc,
  onRetry,
  retryLabel = "다시 시도",
}: ErrStateProps) {
  return (
    <div className="st-state">
      <div className="st-state__ic st-state__ic--danger">
        <Icon name="cloud-off" size={28} />
      </div>
      <div className="st-state__t">{title}</div>
      {desc && <div className="st-state__x">{desc}</div>}
      {onRetry && (
        <div className="st-state__actions">
          <Btn variant="secondary" size="sm" icon="refresh-cw" onClick={onRetry}>
            {retryLabel}
          </Btn>
        </div>
      )}
    </div>
  );
}

export type PermStateProps = {
  role?: React.ReactNode;
  onRequest?: () => void;
};

export function PermState({ role = "스태프", onRequest }: PermStateProps) {
  return (
    <div className="st-state">
      <div className="st-state__ic st-state__ic--lock">
        <Icon name="lock" size={26} />
      </div>
      <div className="st-state__t">접근 권한이 없습니다</div>
      <div className="st-state__x">
        이 화면은 <b>주최자·관리자</b>만 열람할 수 있어요. 현재 역할은{" "}
        <Badge tone="grey">{role}</Badge> 입니다.
      </div>
      {onRequest && (
        <div className="st-state__actions">
          <Btn variant="primary" size="sm" icon="user-plus" onClick={onRequest}>
            권한 요청
          </Btn>
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
        e.stopPropagation();
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

// ── TossConfirm ──────────────────────────────────────────────────────
export type TossConfirmTone = "primary" | "danger";

export type TossConfirmOptions = {
  title: React.ReactNode;
  sub?: React.ReactNode;
  body?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  tone?: TossConfirmTone;
  maxWidth?: number;
};

export function useTossConfirm() {
  const [state, setState] = React.useState<TossConfirmOptions | null>(null);
  const resolverRef = React.useRef<((confirmed: boolean) => void) | null>(null);

  const close = React.useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setState(null);
  }, []);

  const confirm = React.useCallback((options: TossConfirmOptions) => {
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState(options);
    });
  }, []);

  React.useEffect(() => {
    return () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    };
  }, []);

  const dialog = state ? (
    <Modal
      open
      onClose={() => close(false)}
      title={state.title}
      sub={state.sub}
      maxWidth={state.maxWidth ?? 480}
      foot={
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <Btn variant="secondary" onClick={() => close(false)}>
            {state.cancelLabel ?? "취소"}
          </Btn>
          <Btn
            variant={state.tone === "danger" ? "danger" : "primary"}
            onClick={() => close(true)}
          >
            {state.confirmLabel ?? "확인"}
          </Btn>
        </div>
      }
    >
      {typeof state.body === "string" ? (
        <p style={{ color: "var(--ink-soft)", lineHeight: 1.65, margin: 0 }}>
          {state.body}
        </p>
      ) : (
        state.body
      )}
    </Modal>
  ) : null;

  return { confirm, dialog };
}

// ── TossPrompt ───────────────────────────────────────────────────────
export type TossPromptOptions = {
  title: React.ReactNode;
  sub?: React.ReactNode;
  label?: React.ReactNode;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  maxWidth?: number;
};

export function useTossPrompt() {
  const [state, setState] = React.useState<TossPromptOptions | null>(null);
  const [value, setValue] = React.useState("");
  const resolverRef = React.useRef<((value: string | null) => void) | null>(null);

  const close = React.useCallback(
    (confirmed: boolean) => {
      resolverRef.current?.(confirmed ? value.trim() : null);
      resolverRef.current = null;
      setState(null);
      setValue("");
    },
    [value],
  );

  const prompt = React.useCallback((options: TossPromptOptions) => {
    resolverRef.current?.(null);
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve;
      setValue(options.initialValue ?? "");
      setState(options);
    });
  }, []);

  React.useEffect(() => {
    return () => {
      resolverRef.current?.(null);
      resolverRef.current = null;
    };
  }, []);

  const dialog = state ? (
    <Modal
      open
      onClose={() => close(false)}
      title={state.title}
      sub={state.sub}
      maxWidth={state.maxWidth ?? 480}
      foot={
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <Btn variant="secondary" onClick={() => close(false)}>
            {state.cancelLabel ?? "취소"}
          </Btn>
          <Btn variant="primary" onClick={() => close(true)}>
            {state.confirmLabel ?? "확인"}
          </Btn>
        </div>
      }
    >
      <label className="ts-field">
        <span className="ts-field__label">{state.label ?? "내용"}</span>
        <input
          autoFocus
          className="ts-input"
          value={value}
          placeholder={state.placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              close(true);
            }
          }}
        />
      </label>
    </Modal>
  ) : null;

  return { prompt, dialog };
}
