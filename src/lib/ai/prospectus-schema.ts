/**
 * 대회 요강 AI 분석 응답 Zod schema (Phase 1 / 의존성 0 박제).
 *
 * Vercel AI Gateway `generateObject` 의 schema 인자로 사용 → Claude Sonnet 4 가 본 형식 강제 응답.
 *
 * 박제 룰:
 * - 필드명 = camelCase (4 폼 컴포넌트 export 타입 정합 — schedule-form.tsx / team-settings-form.tsx 등)
 * - 각 leaf 필드 옆 `_confidence` (0~1) + `_source_excerpt` (≤200자) 박제 (보고서 §3)
 *   → AI 가 신뢰도 + 원문 근거 자체 평가. UI 분기 (✅⚠️❌) + tooltip 노출.
 * - safeParse 통과 필드만 wizard 폼 적용 (실패 필드 = raw 보존 / UI 표시 X)
 * - apiSuccess 자동 변환으로 API 응답은 snake_case (errors.md 2026-04-17 5회 사고 가드)
 *   → 프론트 접근자 snake_case (Phase 2 prospectus-to-draft.ts 가 camelCase 폼 필드로 매핑)
 *
 * 의존: zod (이미 설치 / 4.x). 외부 npm 0 — Phase 1-B gateway.ts 박제 시 `ai` SDK 추가.
 * 참조 보고서: Dev/prospectus-ai-wizard-plan-2026-05-18.md §3 §"developer 주의사항"
 */
import { z } from "zod";

// confidence + source_excerpt 보조 schema (반복 사용)
// nullable + optional 허용 — AI 가 발견 못 한 필드 = null / undefined / key 누락 모두 통과
// 2026-05-20 fix 3: AI 응답이 일부 suffix key 누락 시 `.nullable()` 만으로는 통과 X (undefined 미허용).
//   `.optional()` 추가로 key 자체 누락도 허용 → generateObject 통과율 ↑.
const Confidence = z.number().min(0).max(1).nullable().optional();
const SourceExcerpt = z.string().max(200).nullable().optional();

// =============================================================================
// schedule (ScheduleFormData 정합 — schedule-form.tsx export)
// =============================================================================
// places (PlaceInfo[]) 는 본 schema 에서 제외 → Phase 2 매핑 시 venueName+venueAddress → places[0] 자동 생성
const ScheduleSchema = z.object({
  startDate: z.string().nullable().optional(),
  startDate_confidence: Confidence,
  startDate_source_excerpt: SourceExcerpt,

  endDate: z.string().nullable().optional(),
  endDate_confidence: Confidence,
  endDate_source_excerpt: SourceExcerpt,

  registrationStartAt: z.string().nullable().optional(),
  registrationStartAt_confidence: Confidence,
  registrationStartAt_source_excerpt: SourceExcerpt,

  registrationEndAt: z.string().nullable().optional(),
  registrationEndAt_confidence: Confidence,
  registrationEndAt_source_excerpt: SourceExcerpt,

  venueName: z.string().nullable().optional(),
  venueName_confidence: Confidence,
  venueName_source_excerpt: SourceExcerpt,

  venueAddress: z.string().nullable().optional(),
  venueAddress_confidence: Confidence,
  venueAddress_source_excerpt: SourceExcerpt,

  city: z.string().nullable().optional(),
  city_confidence: Confidence,
  city_source_excerpt: SourceExcerpt,
});

// =============================================================================
// team (TeamSettingsData 정합 — team-settings-form.tsx export)
// =============================================================================
// 폼 컴포넌트는 모두 string ("12" 등) 이지만 AI 응답은 number 로 추출
// → Phase 2 매핑 시 String(value) 변환
const TeamSchema = z.object({
  maxTeams: z.number().int().positive().nullable().optional(),
  maxTeams_confidence: Confidence,
  maxTeams_source_excerpt: SourceExcerpt,

  teamSize: z.number().int().positive().nullable().optional(),
  teamSize_confidence: Confidence,
  teamSize_source_excerpt: SourceExcerpt,

  rosterMin: z.number().int().positive().nullable().optional(),
  rosterMin_confidence: Confidence,
  rosterMin_source_excerpt: SourceExcerpt,

  rosterMax: z.number().int().positive().nullable().optional(),
  rosterMax_confidence: Confidence,
  rosterMax_source_excerpt: SourceExcerpt,
});

// =============================================================================
// division element (DivisionRulePayload 정합 — wizard-types.ts)
// =============================================================================
// divisionCode (U10/M1/여자부 등 고유 코드) 는 Phase 2 매핑 시 자동 부여 (한국어 name → code 매핑 테이블)
const DivisionSchema = z.object({
  // 2026-05-20 fix 3: name 도 nullable.optional() — Claude 가 division element 박제 시 name 누락 시
  //   element 전체 invalid 되지 않도록 완화. 후처리에서 name 없는 division 은 skip.
  name: z.string().nullable().optional(),
  name_confidence: Confidence,
  name_source_excerpt: SourceExcerpt,

  feeKrw: z.number().int().nonnegative().nullable().optional(),
  feeKrw_confidence: Confidence,
  feeKrw_source_excerpt: SourceExcerpt,

  cap: z.number().int().positive().nullable().optional(),
  cap_confidence: Confidence,
  cap_source_excerpt: SourceExcerpt,
});

// =============================================================================
// registration (RegistrationSettingsData 정합 — registration-settings-form.tsx export)
// =============================================================================
const RegistrationSchema = z.object({
  entryFee: z.number().int().nonnegative().nullable().optional(),
  entryFee_confidence: Confidence,
  entryFee_source_excerpt: SourceExcerpt,

  bankName: z.string().nullable().optional(),
  bankName_confidence: Confidence,
  bankName_source_excerpt: SourceExcerpt,

  bankAccount: z.string().nullable().optional(),
  bankAccount_confidence: Confidence,
  bankAccount_source_excerpt: SourceExcerpt,

  bankHolder: z.string().nullable().optional(),
  bankHolder_confidence: Confidence,
  bankHolder_source_excerpt: SourceExcerpt,

  feeNotes: z.string().nullable().optional(),
  feeNotes_confidence: Confidence,
  feeNotes_source_excerpt: SourceExcerpt,

  // 종별 (U10 / U12 / 일반부 등) — 단일 종별이면 빈 배열 OK
  divisions: z.array(DivisionSchema).default([]),
});

// =============================================================================
// meta (대회 기본 정보 — TournamentPayload meta 부분)
// =============================================================================
// format 은 BracketSettingsData.format 과 동기화 (Phase 2 매핑)
const MetaSchema = z.object({
  title: z.string().nullable().optional(),
  title_confidence: Confidence,
  title_source_excerpt: SourceExcerpt,

  description: z.string().nullable().optional(),
  description_confidence: Confidence,
  description_source_excerpt: SourceExcerpt,

  // 가능 값: "single_elimination" | "round_robin" | "dual_tournament" |
  //         "group_stage_knockout" | "league_advancement" | "group_stage_with_ranking"
  // 명확하지 않으면 null (AI 추측 금지 — 보고서 §"developer 주의사항" §5)
  format: z.string().nullable().optional(),
  format_confidence: Confidence,
  format_source_excerpt: SourceExcerpt,
});

// =============================================================================
// 최종 응답 schema
// =============================================================================
export const ProspectusAnalysisSchema = z.object({
  schedule: ScheduleSchema,
  team: TeamSchema,
  registration: RegistrationSchema,
  meta: MetaSchema,
});

export type ProspectusAnalysisResult = z.infer<typeof ProspectusAnalysisSchema>;

// =============================================================================
// UI 분기 thresholds (보고서 §4 ✅⚠️❌)
// =============================================================================
/** ≥ 0.95 → ✅ 자동 체크 (사용자 명시 거절 없으면 wizard 자동 채움) */
export const CONFIDENCE_AUTO_APPLY = 0.95;
/** 0.60 ~ 0.95 → ⚠️ 사용자 검토 (기본 OFF / 토글 ON 시 적용) */
export const CONFIDENCE_REVIEW = 0.6;
/** < 0.60 → ❌ 기본 거절 (UI 표시는 하되 적용 X) */
