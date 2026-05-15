/**
 * 협회 마법사 (Phase 6 PR2) 단계 상수 — 2026-05-15 신규.
 *
 * 왜:
 *   - 단계 메타 (id/label/icon) 를 컴포넌트 곳곳에서 직접 매번 정의하면 갱신 누락 위험.
 *   - WizardShell + 각 Step 컴포넌트가 단일 source 에서 메타 조회.
 *
 * 어떻게:
 *   - `ASSOCIATION_WIZARD_STEPS` = 4 step 배열 (id 1~4 / label / icon).
 *   - `STORAGE_KEY` = sessionStorage 키 (wizard-draft.ts 패턴 답습 — 단일 source 유지).
 *   - `INITIAL_DRAFT` = 신규 진입 시 빈 draft (각 Step 의 default value).
 */

import type {
  AssociationWizardDraft,
  AssociationAdminRole,
} from "./association-wizard-types";

// 5 step 메타 — WizardShell progress 표시용 (PR3: 4=Referee 사전 등록 추가, 5=확인).
// Material Symbols Outlined 아이콘 (lucide-react 금지 — CLAUDE.md 13 룰).
export const ASSOCIATION_WIZARD_STEPS = [
  { id: 1 as const, label: "협회 정보", icon: "domain" },
  { id: 2 as const, label: "사무국장 지정", icon: "person_add" },
  { id: 3 as const, label: "배정비 단가", icon: "payments" },
  { id: 4 as const, label: "심판 사전 등록", icon: "sports" },
  { id: 5 as const, label: "확인 및 생성", icon: "check_circle" },
];

// sessionStorage 단일 key. wizard-draft.ts 의 `wizard:tournament:draft` 와 별도 keyspace.
// 검수 룰: 다른 곳에서 본 문자열 직접 sessionStorage.getItem 금지 (use-association-wizard-draft 헬퍼 통해서만).
export const STORAGE_KEY = "wizard:association:draft";

// AssociationAdmin.role 9 종 — Step 2 select dropdown 표시용.
// 한국어 라벨은 운영자 친화 표현 (DB enum 그대로 영문).
export const ASSOCIATION_ADMIN_ROLE_OPTIONS: ReadonlyArray<{
  value: AssociationAdminRole;
  label: string;
}> = [
  { value: "secretary_general", label: "사무국장 (기본)" },
  { value: "president", label: "회장" },
  { value: "vice_president", label: "부회장" },
  { value: "director", label: "이사" },
  { value: "staff", label: "직원" },
  { value: "referee_chief", label: "심판 위원장" },
  { value: "referee_clerk", label: "심판 간사" },
  { value: "game_chief", label: "경기 위원장" },
  { value: "game_clerk", label: "경기 간사" },
];

// Association.level 3 종 — Step 1 select dropdown 표시용.
export const ASSOCIATION_LEVEL_OPTIONS = [
  { value: "national" as const, label: "전국 (대한농구협회)" },
  { value: "sido" as const, label: "시·도 (광역 협회)" },
  { value: "pro_league" as const, label: "프로 리그 / 연맹" },
];

// 신규 진입 시 빈 draft — 각 Step default 값 박제.
// fee 0 = 운영자가 명시 입력 안 하면 0 으로 박제 (Phase 6 PR3 referee 자동 배정비 계산 시 0 = 가드).
export const INITIAL_DRAFT: AssociationWizardDraft = {
  association: {
    name: "",
    code: "",
    level: "sido",
    region_sido: "",
    parent_id: "",
    description: "",
  },
  admin: {
    user_id: null,
    user_label: "",
    role: "secretary_general",
  },
  fee_setting: {
    main_fee: 0,
    sub_fee: 0,
    recorder_fee: 0,
    timer_fee: 0,
  },
  // PR3 신규: Referee 사전 등록 옵션 (빈 배열 = skip 진행).
  referees: [],
  current_step: 1,
};
