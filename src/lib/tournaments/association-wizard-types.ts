/**
 * 협회 마법사 (Phase 6 PR2) 공통 타입 — 2026-05-15 신규.
 *
 * 왜:
 *   - super_admin 전용 협회 생성 마법사 (Step 1 ~ Step 3 + 확인).
 *   - sessionStorage draft 보존을 위한 단일 타입 source.
 *   - PR1 API 응답 시그니처 (snake_case) 와 정합 — 프론트 박제 시 snake_case 그대로 사용.
 *
 * 어떻게:
 *   - `AssociationWizardDraft` = 4 step 의 입력값 + current_step 박제.
 *   - `AssociationAdminRole` = PR1 admins route 의 Zod enum 9 role 그대로 (단일 source).
 *   - role 기본값 "secretary_general" — schema default 와 동일.
 */

// AssociationAdmin.role 9 종 enum — PR1 admins route Zod 와 정합 필수.
// 단일 source: 본 타입 변경 시 PR1 route 의 Zod enum 도 동기화 의무.
export type AssociationAdminRole =
  | "secretary_general"
  | "president"
  | "vice_president"
  | "director"
  | "staff"
  | "referee_chief"
  | "referee_clerk"
  | "game_chief"
  | "game_clerk";

// Association.level 3 종 — PR1 associations route Zod 와 정합 필수.
export type AssociationLevel = "national" | "sido" | "pro_league";

// Step 1: 협회 본체 입력값.
// schema 변경 0 (CLAUDE.md DB 정책) — name/code/level/region_sido/parent_id 만 박제.
// description/contact 는 사용자 안내용 (PR1 route 는 무시).
export interface AssociationStep1Data {
  name: string; // 필수, min 2
  code: string; // 필수, min 2 (예: KBA-11)
  level: AssociationLevel;
  region_sido: string; // level=sido 시 활성
  parent_id: string; // BigInt 문자열 (optional)
  description: string; // 운영자 메모 (PR1 route 미사용)
}

// Step 2: 사무국장/임원 지정.
// Q3 결재 = 기존 user 검색만 (이메일 invite 미적용).
// PR1 admins route 가 user_id @unique upsert → 1인 1협회 룰.
export interface AssociationStep2Data {
  user_id: string | null; // BigInt 문자열 (미선택 시 null)
  user_label: string; // UI 표시용 (선택된 user nickname/email — POST 미전송)
  role: AssociationAdminRole;
}

// Step 3: 배정비 단가표 — schema 그대로 4 정수 (Q4 결재).
// 시안 grid (종별×등급×시간) 형식 미적용 — 후속 별도 PR 결재 대상.
export interface AssociationStep3Data {
  main_fee: number; // 주심
  sub_fee: number; // 부심
  recorder_fee: number; // 기록
  timer_fee: number; // 타이머
}

// 마법사 전체 draft — sessionStorage 박제 대상.
// current_step 은 1~4 (4 = 확인). 마지막 단계 = WizardConfirm 에서 API 3건 순차 호출.
export interface AssociationWizardDraft {
  association: AssociationStep1Data;
  admin: AssociationStep2Data;
  fee_setting: AssociationStep3Data;
  current_step: 1 | 2 | 3 | 4;
}

// PR1 API 응답 시그니처 — fetch 결과 타입 가드용.
// apiSuccess 자동 snake_case + BigInt → string 변환 후 형태.
export interface AssociationCreateResponse {
  association: {
    id: string;
    name: string;
    code: string;
    level: AssociationLevel;
    region_sido: string | null;
    parent_id: string | null;
    created_at: string;
  };
}

export interface AssociationAdminAssignResponse {
  association_admin: {
    id: string;
    user_id: string;
    association_id: string;
    role: AssociationAdminRole;
    created_at: string;
  };
}

export interface AssociationFeeSettingResponse {
  fee_setting: {
    id: string;
    association_id: string;
    fee_main: number;
    fee_sub: number;
    fee_recorder: number;
    fee_timer: number;
    updated_at: string;
  };
}
