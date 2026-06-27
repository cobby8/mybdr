"use client";

// =====================================================================
// admin-v2/blocks/schema-list.tsx — 스키마 기반 리스트 페이지(정본 박제)
//   박제 source: Dev/design/BDR v2.41-admin-toss/admin-blocks.jsx
//     SchemaList / renderSchemaCell / DataTable(정본 admin-shell.jsx)
//   백오피스·협력·심판 셸이 공통 사용하는 검색+테이블 블록.
//
//   ⚠ 이식 변경점(관리자=Toss / 하드코딩 hex 0 / 타입드)
//   - window.X 전역(Icon/Btn/Badge/Empty) → @/components/admin-toss import.
//   - DataTable(cols/rows/render/onRow) 은 admin-toss DataTable(columns/keyField)
//     과 API 가 다른 정본 셸 전용 그리드 → SchemaTable 로 1:1 박제(클래스 동일).
//   - window.adDetail/adToast 데모 전역 제거 → onOpenDetail 콜백(선택)으로 대체.
//     소비처(M3)가 실제 상세 드로어/네비를 배선한다.
//   - rowHref/onRow/스키마 셀 렌더 패턴(정본 §9 진입맵) 보존.
// =====================================================================

import { useState } from "react";
import type { ReactNode } from "react";
import { Icon, Btn, Badge, Empty } from "@/components/admin-toss";
import { PageHead } from "./page-head";
import type {
  SchemaCol,
  SchemaRow,
  SchemaDef,
  SchemaDetailPayload,
} from "./types";

// ── 행 → 상세 payload 빌드(정본 plainVal) ───────────────────────────
function plainVal(r: SchemaRow, c: SchemaCol): ReactNode {
  const v = r[c.key] as ReactNode;
  if (c.type === "badge") return r.badge != null ? r.badge : v;
  if (c.type === "status") return r.st ?? v;
  if (c.type === "title" || c.type === "avatar")
    return r.sub ? r.name + " · " + r.sub : r.name;
  return v;
}

// ── 스키마 테이블 셀 렌더러(정본 renderSchemaCell 1:1) ────────────────
//   onView: actions 셀의 "보기" 버튼 → 상세 드로어 오픈 콜백.
export function renderSchemaCell(
  r: SchemaRow,
  col: SchemaCol,
  onView?: () => void,
): ReactNode {
  const v = r[col.key] as ReactNode;
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
          {/* 배경색 r.color = 데이터 주입(컴포넌트 하드코딩 아님) */}
          <span className="ad-avatar-sm" style={{ background: r.color }}>
            {r.name.slice(0, 1)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="ad-cell-strong">{r.name}</div>
            {r.sub && <div className="ad-cell-sub">{r.sub}</div>}
          </div>
        </div>
      );
    case "badge":
      return <Badge tone={r.tone || "grey"}>{r.badge != null ? r.badge : v}</Badge>;
    case "status":
      return (
        <span className="ad-statusline">
          <span className="ad-dot" data-tone={r.sttone || "mute"} />
          {r.st || v}
        </span>
      );
    case "mono":
      return <span className="ad-cell-mono">{v}</span>;
    case "muted":
      return <span className="ad-cell-muted">{v}</span>;
    case "money":
      // 정본: 금액 강조색(var 토큰)
      return (
        <span className="ad-cell-mono" style={{ color: "var(--ink)" }}>
          {v}
        </span>
      );
    case "actions":
      return (
        <span className="ad-rowact">
          <button
            type="button"
            className="ad-iconbtn"
            title="보기"
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
          >
            <Icon name="eye" size={15} />
          </button>
          {/* 더보기 — 정본은 데모 토스트. 소비처(M3)에서 실제 메뉴 배선 예정 */}
          <button
            type="button"
            className="ad-iconbtn"
            title="더보기"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="more-horizontal" size={15} />
          </button>
        </span>
      );
    default:
      return <span className="ad-cell-muted">{v}</span>;
  }
}

// ── 그리드 테이블(정본 admin-shell.jsx DataTable 박제) ───────────────
//   cols/rows/render(r,key)/onRow/empty — admin-toss DataTable 과 다른 정본 전용 API.
interface SchemaTableProps {
  cols: SchemaCol[];
  rows: SchemaRow[];
  render: (row: SchemaRow, key: string) => ReactNode;
  empty?: string;
  onRow?: (row: SchemaRow) => void;
}

function SchemaTable({ cols, rows, render, empty, onRow }: SchemaTableProps) {
  const gt = cols.map((c) => c.w || "1fr").join(" ");
  if (!rows.length)
    return <Empty icon="inbox" title={empty || "데이터가 없습니다"} />;
  return (
    <div className="ad-tablescroll">
      <div className="ts-table ad-table">
        <div className="ts-thead" style={{ gridTemplateColumns: gt }}>
          {cols.map((c) => (
            <div key={c.key} style={{ textAlign: c.align || "left" }}>
              {c.label}
            </div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div
            key={r.id ?? i}
            className="ts-trow"
            style={{
              gridTemplateColumns: gt,
              cursor: onRow ? "pointer" : "default",
            }}
            onClick={onRow ? () => onRow(r) : undefined}
          >
            {cols.map((c) => (
              <div
                key={c.key}
                style={{ textAlign: c.align || "left", minWidth: 0 }}
              >
                {render(r, c.key)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 스키마 기반 리스트 페이지 ────────────────────────────────────────
//   schema.rowHref 있으면 행 클릭 시 해당 URL 이동, 없으면 onOpenDetail 호출.
export interface SchemaListProps {
  schema: SchemaDef;
  eyebrow?: string;
  // rowHref 없는 행 클릭 시 상세 payload 전달(소비처가 드로어 렌더). 선택.
  onOpenDetail?: (payload: SchemaDetailPayload) => void;
}

export function SchemaList({ schema, eyebrow, onOpenDetail }: SchemaListProps) {
  const [q, setQ] = useState("");
  // 검색: name/sub 부분일치(정본 동일)
  const rows = schema.rows.filter(
    (r) =>
      !q ||
      (r.name && r.name.includes(q)) ||
      (r.sub && r.sub.includes(q)),
  );

  // 읽기전용 상세 payload 빌드(정본 openDetail) → onOpenDetail 콜백.
  function openDetail(r: SchemaRow) {
    const fields = schema.cols
      .filter(
        (c) => c.type !== "actions" && c.type !== "title" && c.type !== "avatar",
      )
      .map((c) => ({ label: c.label, value: plainVal(r, c) }));
    onOpenDetail?.({
      eyebrow: schema.head,
      title: r.name,
      sub: r.sub,
      badge: r.badge != null ? r.badge : (r.st ?? null),
      tone: r.tone || r.sttone,
      fields,
    });
  }

  // 진입맵: rowHref 있으면 네비, 없으면 상세 드로어(정본 goRow).
  const goRow = schema.rowHref
    ? (r: SchemaRow) => {
        const href =
          typeof schema.rowHref === "function"
            ? schema.rowHref(r)
            : (schema.rowHref as string);
        window.location.href = href;
      }
    : (r: SchemaRow) => openDetail(r);

  return (
    <div>
      <PageHead
        eyebrow={eyebrow || ""}
        title={schema.head}
        sub={schema.sub}
        actions={
          <>
            {/* 내보내기/추가 — 정본 데모. addHref 있으면 네비, 없으면 no-op(M3 배선) */}
            <Btn variant="secondary" icon="download" size="sm">
              내보내기
            </Btn>
            {schema.addLabel && (
              <Btn
                icon="plus"
                onClick={() => {
                  if (schema.addHref) window.location.href = schema.addHref;
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
        <Btn variant="secondary" icon="sliders-horizontal" size="sm">
          필터
        </Btn>
      </div>
      <SchemaTable
        cols={schema.cols}
        rows={rows}
        onRow={goRow}
        render={(r, k) =>
          renderSchemaCell(
            r,
            schema.cols.find((c) => c.key === k) as SchemaCol,
            () => openDetail(r),
          )
        }
        empty="데이터가 없습니다"
      />
    </div>
  );
}
