// =====================================================================
// admin-toss/index.ts — barrel export (Phase 0)
//   Toss 관리자 디자인시스템 컴포넌트 단일 진입점.
//   사용: import { Btn, DataTable, StatCard } from "@/components/admin-toss";
//   토큰/클래스는 src/styles/toss-admin.css([data-skin="toss"]) 가 제공.
// =====================================================================

// 기본 키트 (Icon · Btn · Badge · Toggle · Check · StepDots · Empty · Modal)
export {
  Icon,
  Btn,
  Badge,
  Toggle,
  Check,
  StepDots,
  Empty,
  Modal,
  useTossConfirm,
} from "./kit";
export type {
  IconProps,
  BtnProps,
  BtnVariant,
  BtnSize,
  BadgeProps,
  BadgeTone,
  ToggleProps,
  CheckProps,
  StepDotsProps,
  EmptyProps,
  ModalProps,
  TossConfirmOptions,
  TossConfirmTone,
} from "./kit";

// 콘솔 키트 (StatusTabs · FilterBar · DataTable · DetailModal · StatCard 등)
export {
  SectionTitle,
  StatusTabs,
  FilterBar,
  SortHead,
  DataTable,
  DetailModal,
  StatCard,
  PanelStat,
  PanelRow,
  MockToggle,
} from "./data";
export type {
  SectionTitleProps,
  StatusTab,
  StatusTabsProps,
  FilterSearch,
  FilterSelect,
  FilterBarProps,
  SortState,
  Column,
  SortHeadProps,
  TableState,
  Pagination,
  DataTableProps,
  DetailModalProps,
  StatCardProps,
  PanelStatProps,
  PanelRowProps,
  MockToggleProps,
} from "./data";
