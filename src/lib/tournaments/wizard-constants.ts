/**
 * 통합 마법사 5단계 상수 + 헬퍼.
 *
 * - STEPS: 5단계 메타 (key / label / icon).
 *   icon = Material Symbols Outlined 이름 (lucide-react ❌ — CLAUDE.md §디자인 핵심).
 * - TOURNAMENT_STATUS_DEFAULT: 마법사로 생성된 대회의 status 기본값.
 *   02-db-changes.md §3 결정 — 항상 "draft" (사용자가 별도 "접수 오픈" 단계 거침).
 * - stepIndexToKey / stepKeyToIndex: 인덱스 ↔ 키 변환 헬퍼 (Phase 2 router 동기화용).
 *
 * Phase 2 의 wizard page.tsx 가 본 STEPS 를 import 해서 stepper 표시 + 분기.
 * 기존 wizard page.tsx 인라인 STEPS 배열은 Phase 2 에서 본 상수로 교체 (본 Phase 변경 ❌).
 */

import type { WizardStep } from "./wizard-types";

/**
 * 단계 정의. 인덱스 = WizardStep (0~4) 와 1:1 정합.
 */
export interface WizardStepDefinition {
  key: "org" | "series" | "info" | "registration" | "confirm";
  label: string;
  icon: string; // Material Symbols Outlined name (예: "groups", "emoji_events")
}

/**
 * 마법사 5단계 정의.
 *
 * - org: 단체 선택/생성 (Step 0)
 * - series: 시리즈 선택/생성 + 이전 회차 복제 토글 (Step 1)
 * - info: 대회 기본 정보 (Step 2 — 현재 wizard "정보" 탭 흡수)
 * - registration: 참가 설정 + 종별 룰 (Step 3 — 현재 wizard "참가설정" 탭 흡수)
 * - confirm: 확인 및 생성 (Step 4 — 현재 wizard "확인" 탭 흡수)
 *
 * 순서 변경 시 WizardStep 타입 / stepIndexToKey / stepKeyToIndex 동시 점검.
 */
export const STEPS: readonly WizardStepDefinition[] = [
  { key: "org",          label: "단체",         icon: "groups" },
  { key: "series",       label: "시리즈",       icon: "auto_awesome_motion" },
  { key: "info",         label: "대회 정보",    icon: "emoji_events" },
  { key: "registration", label: "참가 설정",    icon: "group_add" },
  { key: "confirm",      label: "확인 및 생성", icon: "check_circle" },
] as const;

/**
 * 마법사로 생성된 대회의 status 기본값.
 *
 * 02-db-changes.md §3 결정:
 * - 마법사 = 정보 입력 단계 → 즉시 공개 X
 * - 사용자가 별도로 "접수 오픈" 단계 거침 (운영자 의도와 일치)
 * - 대시보드 STATUS_DISPLAY 와 정합 (draft = "초안" 표시)
 *
 * editions/route.ts 의 `"registration_open"` 박제 패턴과 의도적 차이.
 * 마법사는 작성 단계, editions 는 회차 즉시 생성 (관행)이라 처리 분기.
 */
export const TOURNAMENT_STATUS_DEFAULT = "draft" as const;

/**
 * step 인덱스 (0~4) → key 변환 헬퍼.
 *
 * Phase 2 의 wizard page.tsx URL 쿼리 동기화 시 사용 (예: `?step=org`).
 */
export function stepIndexToKey(idx: WizardStep): WizardStepDefinition["key"] {
  return STEPS[idx].key;
}

/**
 * key → step 인덱스 변환 헬퍼.
 *
 * 인식 불가 key (옛 URL 등) → 0 fallback (안전 진입).
 */
export function stepKeyToIndex(key: WizardStepDefinition["key"]): WizardStep {
  const idx = STEPS.findIndex((s) => s.key === key);
  return (idx === -1 ? 0 : idx) as WizardStep;
}
