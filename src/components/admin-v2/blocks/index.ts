// =====================================================================
// admin-v2/blocks/index.ts — barrel export
//   정본 admin-blocks.jsx 박제 블록 단일 진입점.
//   사용: import { SchemaList, AdBarPanel } from "@/components/admin-v2/blocks";
//   클래스/토큰은 src/styles/toss-admin.css([data-skin="toss"]) 가 제공.
// =====================================================================

export { PageHead } from "./page-head";
export type { PageHeadProps } from "./page-head";

export { SchemaList, renderSchemaCell } from "./schema-list";
export type { SchemaListProps } from "./schema-list";

export { AdBarPanel, AdListPanel, adToneColor } from "./panels";
export type {
  BarDatum,
  AdBarPanelProps,
  ListItem,
  AdListPanelProps,
} from "./panels";

export { AdSettings } from "./settings";
export type {
  SettingsToggleItem,
  SettingsValueItem,
  SettingsItem,
  SettingsGroup,
  AdSettingsProps,
} from "./settings";

export type {
  SchemaCellType,
  SchemaCol,
  SchemaRow,
  SchemaDef,
  SchemaDetailField,
  SchemaDetailPayload,
} from "./types";
