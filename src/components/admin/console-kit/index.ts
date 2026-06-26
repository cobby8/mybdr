// =====================================================================
// console-kit/index.ts — v2.40 통합 Admin Console 키트 배럴 (A2)
//   박제 source: Dev/design/BDR v2.40/_admin-unified/ad-kit.jsx
//   사용: import { PageHead, StatRow, Toolbar, DataTable } from "@/components/admin/console-kit";
//
//   구성:
//   - 신규 8: PageHead·StatRow·Panel·DL·PrimaryCell·StatusBadge(서버)
//             + Toolbar·Drawer·useFilter('use client')
//   - 재사용 3: DataTable·Badge·StatCard 는 @/components/admin-toss 에서 re-export
//     (신규 박제 금지 — 기존 키트가 정렬·페이지네이션까지 더 강력. A0 메모 §2-1)
//   CSS(.ad-*/.ts-*) 는 src/styles/toss-admin.css([data-skin="toss"]) 제공.
// =====================================================================

// ── 신규 키트(서버 컴포넌트) ─────────────────────────────────────────
export { PageHead } from "./page-head";
export type { PageHeadProps } from "./page-head";

export { StatRow } from "./stat-row";
export type { StatRowProps, StatItem } from "./stat-row";

export { Panel } from "./panel";
export type { PanelProps } from "./panel";

export { DL } from "./dl";
export type { DLProps, DLRow } from "./dl";

export { PrimaryCell } from "./primary-cell";
export type { PrimaryCellProps } from "./primary-cell";

export { StatusBadge } from "./status-badge";
export type { StatusBadgeProps, StatusMeta } from "./status-badge";

// ── 신규 키트('use client') ─────────────────────────────────────────
export { Toolbar } from "./toolbar";
export type { ToolbarProps, ToolbarTab } from "./toolbar";

export { Drawer } from "./drawer";
export type { DrawerProps } from "./drawer";

export { useFilter } from "./use-filter";
export type { UseFilterResult, FilterableRow } from "./use-filter";

// ── 재사용 3(기존 admin-toss re-export) ─────────────────────────────
//   DataTable(+Column 등 타입) · Badge · StatCard. 신규 만들지 않고 그대로 노출.
export { DataTable, StatCard } from "@/components/admin-toss";
export type {
  DataTableProps,
  Column,
  SortState,
  TableState,
  Pagination,
  StatCardProps,
} from "@/components/admin-toss";

export { Badge } from "@/components/admin-toss";
export type { BadgeProps, BadgeTone } from "@/components/admin-toss";
