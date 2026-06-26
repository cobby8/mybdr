"use client";

// =====================================================================
// data.tsx — 관리자 Toss 콘솔 컴포넌트 (Phase 0 이식)
//   박제 source: Dev/design/BDR-current/_handoff-admin-toss-P0/design-files/toss-admin.jsx
//   SectionTitle · StatusTabs · FilterBar · SortHead · DataTable · DetailModal
//   · StatCard · PanelStat · PanelRow · MockToggle
//
//   ⚠ 이식 변경점 (kit.tsx 와 동일 기조)
//   - window.X 전역 노출 제거 → named export. props TS 타입 부여.
//   - Icon/Btn/Badge 는 kit.tsx 에서 import (시안의 /* global Icon, Btn */ 대체).
//   - DataTable 은 제네릭 행 타입 <T> 지원 (columns.render(row) 타입 안전).
//   - 클래스명 .ts-* 는 toss-admin.css([data-skin="toss"]) 와 1:1 매핑.
// =====================================================================

import React from "react";
import { Icon, Btn } from "./kit";

// ── SectionTitle ─────────────────────────────────────────────────────
export type SectionTitleProps = {
  children?: React.ReactNode;
  action?: React.ReactNode;
};

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "8px 0 14px",
      }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
        {children}
      </h3>
      {action}
    </div>
  );
}

// ── StatusTabs (pill 형 상태 탭) ──────────────────────────────────────
export type StatusTab = {
  key: string;
  label: React.ReactNode;
  count?: number | null;
};

export type StatusTabsProps = {
  tabs: StatusTab[];
  current: string;
  onChange: (key: string) => void;
};

export function StatusTabs({ tabs, current, onChange }: StatusTabsProps) {
  return (
    <div
      style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 15px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--ff)",
            fontSize: 14,
            fontWeight: 700,
            background: current === t.key ? "var(--ink)" : "var(--grey-100)",
            color: current === t.key ? "#fff" : "var(--ink-soft)",
          }}
        >
          {t.label}
          {t.count != null && (
            <span
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 12,
                opacity: current === t.key ? 0.85 : 0.6,
              }}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── FilterBar (검색 + 셀렉트 + 액션) ─────────────────────────────────
export type FilterSearch = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export type FilterSelect = {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

export type FilterBarProps = {
  search?: FilterSearch;
  filters?: FilterSelect[];
  onReset?: () => void;
  actions?: React.ReactNode;
};

export function FilterBar({
  search,
  filters = [],
  onReset,
  actions,
}: FilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 16,
      }}
    >
      {search && (
        <div
          style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}
        >
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-dim)",
              display: "flex",
            }}
          >
            <Icon name="search" size={18} />
          </span>
          <input
            className="ts-input"
            style={{
              paddingLeft: 42,
              background: "#fff",
              border: "1px solid var(--border)",
              fontSize: 14,
            }}
            value={search.value}
            placeholder={search.placeholder}
            onChange={(e) => search.onChange(e.target.value)}
          />
        </div>
      )}
      {filters.map((f) => (
        <select
          key={f.key}
          className="ts-select"
          style={{ flex: "0 0 auto", width: "auto", fontSize: 14 }}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
        >
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {f.label}: {o.label}
            </option>
          ))}
        </select>
      ))}
      {onReset && (
        <Btn variant="ghost" size="sm" icon="rotate-ccw" onClick={onReset}>
          초기화
        </Btn>
      )}
      <span style={{ flex: 1 }} />
      {actions}
    </div>
  );
}

// ── 정렬 / 컬럼 타입 ─────────────────────────────────────────────────
export type SortState = { key: string; dir: "asc" | "desc" };

export type Column<T> = {
  key: string;
  label: React.ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  // v2.40 A2: 모바일(≤860px)에서 숨길 비핵심 컬럼. toss-admin.css .ad-hide-sm 와 매핑.
  hideSm?: boolean;
  render?: (row: T) => React.ReactNode;
};

export type SortHeadProps<T> = {
  col: Column<T>;
  sort?: SortState;
  onSortChange: (next: SortState) => void;
};

export function SortHead<T>({ col, sort, onSortChange }: SortHeadProps<T>) {
  if (!col.sortable) return <span>{col.label}</span>;
  const active = sort?.key === col.key;
  return (
    <button
      type="button"
      onClick={() =>
        onSortChange({
          key: col.key,
          dir: active && sort?.dir === "asc" ? "desc" : "asc",
        })
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: "none",
        border: 0,
        cursor: "pointer",
        font: "inherit",
        color: active ? "var(--primary)" : "inherit",
        fontWeight: 700,
        padding: 0,
      }}
    >
      {col.label}
      <Icon
        name={
          active
            ? sort?.dir === "asc"
              ? "chevron-up"
              : "chevron-down"
            : "chevrons-up-down"
        }
        size={13}
      />
    </button>
  );
}

// ── DataTable (정렬·선택·페이지네이션·empty/loading) ─────────────────
export type TableState = "filled" | "empty" | "loading";

export type Pagination = {
  page: number;
  perPage: number;
  total: number;
  onChange: (page: number) => void;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  keyField: keyof T;
  state?: TableState;
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
  selectable?: boolean;
  selected?: Array<T[keyof T]>;
  onSelectChange?: (next: Array<T[keyof T]>) => void;
  onRowClick?: (row: T) => void;
  pagination?: Pagination;
  emptyTitle?: React.ReactNode;
  emptyDesc?: React.ReactNode;
  emptyCtaLabel?: React.ReactNode;
  onEmptyCta?: () => void;
};

export function DataTable<T>({
  columns,
  rows,
  keyField,
  state = "filled",
  sort,
  onSortChange,
  selectable,
  selected = [],
  onSelectChange,
  onRowClick,
  pagination,
  emptyTitle,
  emptyDesc,
  emptyCtaLabel,
  onEmptyCta,
}: DataTableProps<T>) {
  // grid-template-columns 계산 (선택 컬럼 44px + 각 컬럼 width)
  const gridCols =
    (selectable ? "44px " : "") +
    columns
      .map((c) =>
        typeof c.width === "number" ? c.width + "px" : c.width || "1fr"
      )
      .join(" ");

  const rowKey = (r: T) => r[keyField];
  const allOn =
    rows.length > 0 && rows.every((r) => selected.includes(rowKey(r)));
  const toggleAll = () =>
    onSelectChange?.(allOn ? [] : rows.map((r) => rowKey(r)));
  const toggleRow = (id: T[keyof T]) =>
    onSelectChange?.(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );

  if (state === "loading") {
    return (
      <div className="ad-tablescroll">
      <div className="ts-table ad-table">
        <div
          style={{
            padding: 60,
            textAlign: "center",
            color: "var(--ink-mute)",
          }}
        >
          불러오는 중…
        </div>
      </div>
      </div>
    );
  }

  if (state === "empty" || rows.length === 0) {
    return (
      <div className="ad-tablescroll">
      <div className="ts-table ad-table">
        <div className="ts-empty">
          <div className="ts-empty__icon">
            <Icon name="inbox" size={28} />
          </div>
          <div className="ts-empty__title">
            {emptyTitle || "데이터가 없습니다"}
          </div>
          {emptyDesc && <div className="ts-empty__desc">{emptyDesc}</div>}
          {emptyCtaLabel && (
            <div style={{ marginTop: 16 }}>
              <Btn variant="secondary" onClick={onEmptyCta}>
                {emptyCtaLabel}
              </Btn>
            </div>
          )}
        </div>
      </div>
      </div>
    );
  }

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.perPage)
    : 1;

  return (
    <div className="ad-tablescroll">
    <div className="ts-table ad-table">
      <div className="ts-thead" style={{ gridTemplateColumns: gridCols }}>
        {selectable && (
          <span>
            <button
              type="button"
              className="ts-check"
              // a11y: 전체 선택 체크박스 — 역할/상태/라벨 + Space·Enter 토글
              role="checkbox"
              aria-checked={allOn}
              aria-label="전체 선택"
              data-on={allOn ? "true" : "false"}
              style={{ width: 20, height: 20 }}
              onClick={toggleAll}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  toggleAll();
                }
              }}
            >
              {allOn && <Icon name="check" size={13} />}
            </button>
          </span>
        )}
        {columns.map((c) => (
          <span
            key={c.key}
            // hideSm 컬럼은 모바일에서 숨김(.ad-hide-sm). 기존 컬럼은 클래스 없음.
            className={c.hideSm ? "ad-hide-sm" : undefined}
            style={{ textAlign: c.align || "left" }}
          >
            <SortHead
              col={c}
              sort={sort}
              onSortChange={onSortChange ?? (() => {})}
            />
          </span>
        ))}
      </div>
      {rows.map((r) => (
        <div
          key={String(rowKey(r))}
          className="ts-trow"
          style={{
            gridTemplateColumns: gridCols,
            cursor: onRowClick ? "pointer" : "default",
          }}
          onClick={() => onRowClick?.(r)}
        >
          {selectable && (
            <span onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ts-check"
                // a11y: 행 선택 체크박스 — 역할/상태/라벨 + Space·Enter 토글
                role="checkbox"
                aria-checked={selected.includes(rowKey(r))}
                aria-label="행 선택"
                data-on={selected.includes(rowKey(r)) ? "true" : "false"}
                style={{ width: 20, height: 20 }}
                onClick={() => toggleRow(rowKey(r))}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    toggleRow(rowKey(r));
                  }
                }}
              >
                {selected.includes(rowKey(r)) && (
                  <Icon name="check" size={13} />
                )}
              </button>
            </span>
          )}
          {columns.map((c) => (
            <span
              key={c.key}
              // hideSm 컬럼은 모바일에서 숨김(.ad-hide-sm). 기존 컬럼은 클래스 없음.
              className={c.hideSm ? "ad-hide-sm" : undefined}
              style={{
                textAlign: c.align || "left",
                minWidth: 0,
                fontSize: 14,
                color: "var(--ink-soft)",
              }}
            >
              {c.render ? c.render(r) : (r[c.key as keyof T] as React.ReactNode)}
            </span>
          ))}
        </div>
      ))}
      {pagination && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Btn
            variant="ghost"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => pagination.onChange(pagination.page - 1)}
          >
            <Icon name="chevron-left" size={16} />
          </Btn>
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              fontFamily: "var(--ff-mono)",
              padding: "0 8px",
            }}
          >
            {pagination.page} / {totalPages}
          </span>
          <Btn
            variant="ghost"
            size="sm"
            disabled={pagination.page >= totalPages}
            onClick={() => pagination.onChange(pagination.page + 1)}
          >
            <Icon name="chevron-right" size={16} />
          </Btn>
        </div>
      )}
    </div>
    </div>
  );
}

// ── DetailModal (우측 슬라이드인 패널) ───────────────────────────────
export type DetailModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};

export function DetailModal({
  open,
  onClose,
  title,
  children,
  footer,
}: DetailModalProps) {
  // a11y: 열릴 때 패널에 첫 포커스(과한 focus-trap 라이브러리 없이 최소 구현)
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    // 패널로 포커스 이동(스크린리더/키보드 컨텍스트를 모달로 옮김)
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="ts-modal-overlay"
      style={{ placeItems: "stretch", justifyContent: "flex-end" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        // a11y: Modal 과 동일 패턴 — 시맨틱 dialog 역할 + 모달 컨텍스트 명시
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={{
          width: 440,
          maxWidth: "100%",
          height: "100%",
          background: "#fff",
          boxShadow: "var(--sh-lg)",
          display: "flex",
          flexDirection: "column",
          animation: "tsrise .2s ease",
          outline: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h3 style={{ fontSize: 19, fontWeight: 800, color: "var(--ink)" }}>
            {title}
          </h3>
          <button
            type="button"
            className="ts-btn ts-btn--ghost ts-btn--sm"
            style={{ padding: 8 }}
            onClick={onClose}
            aria-label="닫기"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {children}
        </div>
        {footer && (
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── StatCard (KPI 카드) ──────────────────────────────────────────────
export type StatCardProps = {
  icon: string;
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  trend?: "up" | "down";
};

export function StatCard({ icon, label, value, delta, trend }: StatCardProps) {
  const tcolor =
    trend === "up"
      ? "var(--ok)"
      : trend === "down"
        ? "var(--danger)"
        : "var(--ink-mute)";
  return (
    <div className="ts-card ts-card--tight">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "var(--primary-weak)",
            color: "var(--primary)",
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
          }}
        >
          <Icon name={icon} size={22} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              fontWeight: 600,
            }}
          >
            {label}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginTop: 3,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "var(--ink)",
                lineHeight: 1,
              }}
            >
              {value}
            </span>
            {delta && (
              <span
                style={{ fontSize: 12, fontWeight: 700, color: tcolor }}
              >
                {delta}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PanelStat / PanelRow (상세 패널 helpers) ─────────────────────────
export type PanelStatProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "danger";
};

export function PanelStat({ label, value, tone }: PanelStatProps) {
  return (
    <div
      style={{
        background: "var(--grey-50)",
        borderRadius: 14,
        padding: 14,
        flex: 1,
      }}
    >
      <div
        style={{ fontSize: 11.5, color: "var(--ink-mute)", fontWeight: 600 }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          marginTop: 4,
          color: tone === "danger" ? "var(--danger)" : "var(--ink)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export type PanelRowProps = {
  label: React.ReactNode;
  value: React.ReactNode;
};

export function PanelRow({ label, value }: PanelRowProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "9px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 13.5, color: "var(--ink-mute)" }}>{label}</span>
      <span
        style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}
      >
        {value}
      </span>
    </div>
  );
}

// ── MockToggle (mock 상태 토글 — 시안 데모용) ────────────────────────
export type MockToggleProps = {
  value: TableState;
  onChange: (value: TableState) => void;
};

export function MockToggle({ value, onChange }: MockToggleProps) {
  return (
    <select
      className="ts-select"
      style={{ width: "auto", fontSize: 12.5, padding: "7px 10px" }}
      value={value}
      onChange={(e) => onChange(e.target.value as TableState)}
    >
      <option value="filled">데이터 있음</option>
      <option value="empty">빈 상태</option>
      <option value="loading">로딩</option>
    </select>
  );
}
