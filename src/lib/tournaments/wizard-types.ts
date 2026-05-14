/**
 * 통합 마법사 (단체 → 시리즈 → 대회 → 회차) 공통 타입 정의.
 *
 * 본 파일은 Phase 1 인프라 (DB ❌ / UI ❌ / API ❌). Phase 2~7 이 import 할 단일 source.
 *
 * 박제 룰:
 * - API 응답 형식 (OrganizationItem / SeriesItem) = `apiSuccess()` 가 snake_case 변환.
 *   → 프론트 접근자도 snake_case (CLAUDE.md §보안 + errors.md 2026-04-17 박제 5회 사고).
 * - 폼 데이터 (TournamentPayload) = components/tournament/*.tsx 의 실제 export 타입 재사용.
 *   임의 추정 ❌. 4 폼 (Schedule / RegistrationSettings / TeamSettings / BracketSettings) 컴포지션.
 *
 * 의존: 없음 (시작 Phase). 다른 lib 파일 import ❌.
 */

import type { ScheduleFormData } from "@/components/tournament/schedule-form";
import type { RegistrationSettingsData } from "@/components/tournament/registration-settings-form";
import type { TeamSettingsData } from "@/components/tournament/team-settings-form";
import type { BracketSettingsData } from "@/components/tournament/bracket-settings-form";

// =============================================================================
// Step 정의
// =============================================================================

/**
 * 마법사 단계 인덱스 (0~4).
 * - 0: 단체 (Organization)
 * - 1: 시리즈 (TournamentSeries)
 * - 2: 대회 정보 (Tournament 기본)
 * - 3: 참가 설정 (Tournament 운영 옵션 + 종별 룰)
 * - 4: 확인 및 생성
 *
 * 상수 정의는 `wizard-constants.ts` 의 `STEPS` 참조.
 */
export type WizardStep = 0 | 1 | 2 | 3 | 4;

// =============================================================================
// API 응답 형식 (snake_case — apiSuccess 변환 결과)
// =============================================================================

/**
 * 단체 (organization) 응답 형식.
 * - source: `/api/web/organizations` GET
 * - my_role: 현재 로그인 사용자의 단체 내 역할 (owner / admin / member).
 *   Step 0 에서 "본인이 owner/admin 인 단체" 만 드롭다운에 노출.
 *
 * ⚠️ 응답 키 snake_case 박제 (apiSuccess 자동 변환). camelCase ❌.
 */
export interface OrganizationItem {
  id: number;
  name: string;
  status: "pending" | "approved" | "rejected";
  region?: string | null;
  owner_id: number;
  my_role: "owner" | "admin" | "member";
}

/**
 * 시리즈 (tournament_series) 응답 형식.
 * - source: `/api/web/tournament-series` GET (또는 organization 별)
 * - tournaments_count: 시리즈에 속한 대회 (회차) 수.
 *   ⚠️ 사용 시 series-counter-audit 크론으로 야간 보정되는 캐시값 (02-db-changes §2).
 * - last_edition_at: 마지막 회차 startDate (또는 createdAt) — 회차 prefill 토글 노출 조건.
 *
 * ⚠️ 응답 키 snake_case 박제. organization_id null = 단체 미연결 시리즈.
 */
export interface SeriesItem {
  id: number;
  name: string;
  organization_id: number | null;
  organizer_id: number;
  tournaments_count: number;
  last_edition_at?: string | null; // ISO 8601
}

// =============================================================================
// 폼 데이터 컴포지션 (camelCase — 폼 state 내부 형식)
// =============================================================================

/**
 * Step 2~3 의 대회 본체 payload.
 *
 * 4 폼 데이터를 합성:
 * - schedule: 대회 일정 + 경기장 (ScheduleForm)
 * - registration: 참가 설정 + 종별/디비전 + 입금 정보 (RegistrationSettingsForm)
 * - team: 팀 설정 (TeamSettingsForm)
 * - bracket: 대진 세부 설정 (BracketSettingsForm)
 *
 * 추가 메타:
 * - title / description: 대회 기본 정보 (폼 외부 입력)
 * - format: 대회 방식 (단일/더블/듀얼/풀리그/조별 등 — bracket.format 과 별도 박제)
 * - bannerUrl / logoUrl: 미디어 (현재 wizard 의 mediaState 흡수)
 *
 * ⚠️ 본 타입은 폼 state 내부 표현 (camelCase). DB 박제 시 snake_case 변환은
 * `Phase 4` (tournament-payload → Prisma create) 에서 처리.
 *
 * Phase 2~4 진행 중 필드 보강 가능 — 본 Phase 는 "최소 공통 분모" 박제만.
 */
export interface TournamentPayload {
  // 대회 기본 정보 (폼 외부)
  title: string;
  description?: string | null;
  format?: string | null; // "single_elimination" | "double_elimination" | "dual_tournament" | ... — bracket.format 과 동기화

  // 4 폼 데이터 (컴포넌트 export 재사용 — 임의 추정 ❌)
  schedule: ScheduleFormData;
  registration: RegistrationSettingsData;
  team: TeamSettingsData;
  bracket: BracketSettingsData;

  // 미디어 (선택)
  bannerUrl?: string | null;
  logoUrl?: string | null;
}

/**
 * 종별 룰 payload — `TournamentDivisionRule.createMany` 입력.
 *
 * - division_code: "U10" / "M1" / "여자부" 등 (대회 고유 코드)
 * - name: 표시명 (옵션)
 * - fee_krw: 종별 참가비 (원). BigInt 가능성 있음 → wizard-draft.ts 의 replacer 처리.
 * - settings: 추가 룰 (JSON) — Phase 2~4 에서 필드 보강
 *
 * ⚠️ Prisma 스키마 컬럼명 snake_case (@map). 본 타입은 폼 state 형식이므로 camelCase 사용.
 * DB 박제 시 변환은 Phase 4 의 createMany 빌더 책임.
 */
export interface DivisionRulePayload {
  divisionCode: string;
  name?: string | null;
  feeKrw?: number | null;
  settings?: Record<string, unknown> | null;
}

// =============================================================================
// 마법사 전체 draft state
// =============================================================================

/**
 * sessionStorage 에 박제되는 마법사 전체 상태.
 *
 * - step: 현재 진입한 단계 (0~4). 페이지 새로고침 시 복귀 지점.
 * - organization_id: 선택/생성된 단체 ID. null = "단체 없이 진행".
 * - organization_just_created: 본 마법사 turn 안에서 신규 생성 여부 (Step 0 UX 분기).
 * - series_id: 선택/생성된 시리즈 ID. null = "1회성 대회 (시리즈 미연결)".
 * - series_just_created: 본 마법사 turn 안에서 신규 생성 여부 (Step 1 UX 분기).
 * - copy_from_last_edition: 이전 회차 데이터 prefill 토글. Step 1 에서 시리즈 선택 시 활성화.
 * - edition_number: 자동 채번값 (또는 사용자 override). Phase 5 의 last-edition API 결과 + 1.
 * - tournament_payload: Step 2~3 의 통합 데이터.
 * - division_rules: Step 3 에서 추가한 종별 룰 배열.
 *
 * ⚠️ 응답 키 패턴 박제 — snake_case 식별자 (organization_id 등) 는 의도적 (DB 컬럼명 정합).
 * 폼 state 내부 camelCase (tournament_payload 안) 와 의도적으로 분리.
 */
export interface WizardDraft {
  step: WizardStep;
  organization_id: number | null;
  organization_just_created: boolean;
  series_id: number | null;
  series_just_created: boolean;
  copy_from_last_edition: boolean;
  edition_number: number | null;
  tournament_payload: TournamentPayload;
  division_rules: DivisionRulePayload[];
}
