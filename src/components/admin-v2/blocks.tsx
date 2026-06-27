"use client";

// ============================================================
// blocks.tsx — admin-v2 관리자 공용 페이지 블록 (R1 클린 슬레이트 토대)
//   정본 1:1 포팅: Dev/design/BDR v2.41-admin-toss/admin-blocks.jsx
//   SchemaList(검색+테이블) / AdBarPanel / AdListPanel / AdSettings / renderSchemaCell
//
//   이식 변경점(거동 보존):
//   - 정본 window.adToast/adDetail 데모 전역 → useAdminShell() 컨텍스트 콜백.
//   - 내보내기/필터/저장/취소/더보기 = 정본은 데모 토스트 → ctx.toast(R2 배선 자리).
//   - SchemaList 행 이동 = 정본 그대로 window.location.href(외부 콘솔 링크 패턴).
//   - className·마크업은 정본 그대로. 레거시 0 import. 자기완결.
// ============================================================

import React from "react";
import { Icon, Btn, Badge, Toggle } from "./kit";
import {
  PageHead,
  KpiGrid,
  DataTable,
  useAdminShell,
  type DataRow,
  type DetailPayload,
} from "./shell";

// KpiGrid 는 admin-blocks 가 재노출(정본 동일 묶음)로 가져다 쓰도록 유지.
export { KpiGrid };

// ── 톤 색상 (정본 verbatim — violet 만 하드코딩 hex 보존) ─────────────
export function adToneColor(t?: string): string {
  return (
    (
      {
        ok: "var(--ok)",
        primary: "var(--primary)",
        warn: "var(--warn)",
        violet: "#6D5AE6",
        danger: "var(--danger)",
      } as Record<string, string>
    )[t ?? ""] || "var(--ink-soft)"
  );
}

// ── 스키마 타입 (정본 동적 객체 TS화) ────────────────────────────────
export type SchemaColType =
  | "title"
  | "avatar"
  | "badge"
  | "status"
  | "mono"
  | "muted"
  | "money"
  | "actions";

export type SchemaCol = {
  key: string;
  label: React.ReactNode;
  type?: SchemaColType;
  w?: string;
  align?: "left" | "center" | "right";
};

export type SchemaRow = {
  id?: string | number;
  name?: string;
  sub?: string;
  badge?: React.ReactNode;
  tone?: string;
  st?: React.ReactNode;
  sttone?: string;
  color?: string;
  [k: string]: unknown;
};

export type Schema = {
  head: string;
  sub?: string;
  addLabel?: string;
  addHref?: string;
  rowHref?: string | ((r: SchemaRow) => string);
  cols: SchemaCol[];
  rows: SchemaRow[];
};

// ── 행 → 상세 payload 빌드 (정본 plainVal + openDetail) ───────────────
function plainVal(r: SchemaRow, c: SchemaCol): React.ReactNode {
  const v = r[c.key] as React.ReactNode;
  if (c.type === "badge") return r.badge != null ? r.badge : v;
  if (c.type === "status") return r.st ?? v;
  if (c.type === "title" || c.type === "avatar")
    return r.sub ? r.name + " · " + r.sub : r.name;
  return v;
}

export function buildDetailPayload(r: SchemaRow, schema: Schema): DetailPayload {
  const fields = schema.cols
    .filter((c) => c.type !== "actions" && c.type !== "title" && c.type !== "avatar")
    .map((c) => ({ label: c.label, value: plainVal(r, c) }));
  return {
    eyebrow: schema.head,
    title: r.name,
    sub: r.sub,
    badge: r.badge != null ? r.badge : r.st ?? null,
    tone: r.tone || r.sttone,
    fields,
  };
}

// ── 스키마 테이블 셀 렌더러 (정본 1:1) ───────────────────────────────
export function renderSchemaCell(
  r: SchemaRow,
  col: SchemaCol,
  onView?: () => void,
  toast?: (msg: React.ReactNode) => void
): React.ReactNode {
  const v = r[col.key] as React.ReactNode;
  switch (col.type) {
    case "title":
      return (
        <div>
          <div className="ad-cell-strong">{r.name}</div>
          {r.sub && <div className="ad-cell-sub">{r.sub}</div>}
        </div>
      );
    case "avatar":
      return (
        <div className="ad-cell-flex">
          <span className="ad-avatar-sm" style={{ background: r.color }}>
            {r.name?.slice(0, 1)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="ad-cell-strong">{r.name}</div>
            {r.sub && <div className="ad-cell-sub">{r.sub}</div>}
          </div>
        </div>
      );
    case "badge":
      return (
        <Badge tone={(r.tone as never) || "grey"}>
          {r.badge != null ? r.badge : v}
        </Badge>
      );
    case "status":
      return (
        <span className="ad-statusline">
          <span className="ad-dot" data-tone={r.sttone || "mute"} />
          {r.st ?? v}
        </span>
      );
    case "mono":
      return <span className="ad-cell-mono">{v}</span>;
    case "muted":
      return <span className="ad-cell-muted">{v}</span>;
    case "money":
      return (
        <span className="ad-cell-mono" style={{ color: "var(--ink)" }}>
          {v}
        </span>
      );
    case "actions":
      return (
        <span className="ad-rowact">
          <button
            className="ad-iconbtn"
            title="보기"
            onClick={(e) => {
              e.stopPropagation();
              onView && onView();
            }}
          >
            <Icon name="eye" size={15} />
          </button>
          <button
            className="ad-iconbtn"
            title="더보기"
            onClick={(e) => {
              e.stopPropagation();
              toast && toast("더보기");
            }}
          >
            <Icon name="more-horizontal" size={15} />
          </button>
        </span>
      );
    default:
      return <span className="ad-cell-muted">{v}</span>;
  }
}

// ── 스키마 기반 리스트 페이지 (정본 1:1) ─────────────────────────────
//   rowHref: 문자열/함수 → 행 클릭 시 해당 페이지로 이동.
//            없으면 읽기전용 상세 드로어를 엽니다.
//   addHref: 추가 버튼이 토스트 대신 해당 페이지로 이동.
export function SchemaList({
  schema,
  eyebrow,
}: {
  schema: Schema;
  eyebrow?: React.ReactNode;
}) {
  const { toast, openDetail } = useAdminShell();
  const [q, setQ] = React.useState("");
  const rows = schema.rows.filter(
    (r) =>
      !q ||
      (r.name && r.name.includes(q)) ||
      (r.sub && r.sub.includes(q))
  );
  const goRow = schema.rowHref
    ? (r: DataRow) => {
        const href = schema.rowHref!;
        window.location.href =
          typeof href === "function" ? href(r as SchemaRow) : href;
      }
    : (r: DataRow) => openDetail(buildDetailPayload(r as SchemaRow, schema));
  return (
    <div>
      <PageHead
        eyebrow={eyebrow || ""}
        title={schema.head}
        sub={schema.sub}
        actions={
          <>
            <Btn
              variant="secondary"
              icon="download"
              size="sm"
              onClick={() => toast(schema.head + " 내보내기")}
            >
              내보내기
            </Btn>
            {schema.addLabel && (
              <Btn
                icon="plus"
                onClick={() => {
                  if (schema.addHref) {
                    window.location.href = schema.addHref;
                  } else {
                    toast(schema.addLabel + "");
                  }
                }}
              >
                {schema.addLabel}
              </Btn>
            )}
          </>
        }
      />
      <div className="ad-toolbar">
        <div className="ad-search">
          <Icon name="search" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={schema.head + " 검색"}
          />
        </div>
        <Btn
          variant="secondary"
          icon="sliders-horizontal"
          size="sm"
          onClick={() => toast("필터")}
        >
          필터
        </Btn>
      </div>
      <DataTable
        cols={schema.cols}
        rows={rows}
        onRow={goRow}
        render={(r, k) =>
          renderSchemaCell(
            r as SchemaRow,
            schema.cols.find((c) => c.key === k)!,
            () => openDetail(buildDetailPayload(r as SchemaRow, schema)),
            toast
          )
        }
        empty="데이터가 없습니다"
      />
    </div>
  );
}

// ── 막대 차트 패널 (정본 1:1) ────────────────────────────────────────
export type BarDatum = { m: string; v: number; soft?: boolean };

export function AdBarPanel({
  title,
  badge,
  badgeTone,
  data,
}: {
  title: React.ReactNode;
  badge?: React.ReactNode;
  badgeTone?: string;
  data: BarDatum[];
}) {
  const max = Math.max(...data.map((c) => c.v));
  return (
    <div className="ad-panel">
      <div className="ad-panel__head">
        <div className="ad-panel__title">{title}</div>
        {badge && <Badge tone={(badgeTone as never) || "primary"}>{badge}</Badge>}
      </div>
      <div className="ad-bars">
        {data.map((c) => (
          <div key={c.m} className="ad-bar">
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

// ── 리스트 패널 (처리대기 / 활동) (정본 1:1) ─────────────────────────
export type ListItem = {
  id: string | number;
  icon: string;
  t: React.ReactNode;
  s?: React.ReactNode;
  time?: React.ReactNode;
  tone?: string;
  color?: string;
  v?: string; // bar 모드: 너비(%) / 값
};

export function AdListPanel({
  title,
  badge,
  badgeTone,
  items,
  bar,
}: {
  title: React.ReactNode;
  badge?: React.ReactNode;
  badgeTone?: string;
  items: ListItem[];
  bar?: boolean;
}) {
  return (
    <div className="ad-panel">
      <div className="ad-panel__head">
        <div className="ad-panel__title">{title}</div>
        {badge && <Badge tone={(badgeTone as never) || "warn"}>{badge}</Badge>}
      </div>
      <div className="ad-list">
        {items.map((a) => (
          <div key={a.id} className="ad-listrow">
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

// ── 설정 페이지 (정본 1:1) ───────────────────────────────────────────
export type SettingsItem =
  | { k: string; type: "toggle"; label: React.ReactNode; desc?: React.ReactNode; on: boolean }
  | { k: string; type?: "value"; label: React.ReactNode; desc?: React.ReactNode; value: React.ReactNode };

export type SettingsGroup = { group: string; items: SettingsItem[] };

export function AdSettings({
  eyebrow,
  title,
  sub,
  groups,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  groups: SettingsGroup[];
}) {
  const { toast } = useAdminShell();
  const [st, setSt] = React.useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    groups.forEach((g) =>
      g.items.forEach((i) => {
        if (i.type === "toggle") m[i.k] = i.on;
      })
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
        <div style={{ display: "flex", gap: 10 }}>
          <Btn icon="check" onClick={() => toast("설정이 저장되었습니다")}>
            변경사항 저장
          </Btn>
          <Btn variant="secondary" onClick={() => toast("변경 취소")}>
            취소
          </Btn>
        </div>
      </div>
    </div>
  );
}
