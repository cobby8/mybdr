/**
 * AI 분석 결과 → WizardDraft 매핑 (Phase 3 박제 2026-05-20).
 *
 * `analyzeProspectus()` (gateway.ts) 응답 = `ProspectusAnalysisResult` (필드별 confidence + source_excerpt).
 * 본 함수가 confidence threshold 통과 필드만 추출 + 4 폼 데이터 형식 (camelCase + string) 변환.
 *
 * 박제 룰:
 * - **confidence < CONFIDENCE_AUTO_APPLY (0.95) 필드 제외** → wizard 폼 자동 채움 0
 *   (사용자가 UI 토글로 "⚠️ 60~95% 적용" 명시 시만 본 함수 외부에서 includeReview=true 전달)
 * - **필드별 부분 통과 허용** — schedule 통과 / team 미통과 시 schedule 만 매핑
 * - **WizardDraft 시그니처 0 변경** — 기존 4 폼 export 형식 그대로
 * - **AI 응답 신뢰 ❌** — null / undefined / 빈 문자열 = 매핑 skip (덮어쓰지 않음)
 *
 * 의존: prospectus-schema.ts (`ProspectusAnalysisResult` + threshold 상수) + wizard-types.ts (4 폼 타입).
 * 참조 보고서: Dev/prospectus-ai-wizard-plan-2026-05-18.md §3 §4 §"developer 주의사항 §5"
 */

import {
  type ProspectusAnalysisResult,
  CONFIDENCE_AUTO_APPLY,
  CONFIDENCE_REVIEW,
} from "@/lib/ai/prospectus-schema";
import type { ScheduleFormData, PlaceInfo } from "@/components/tournament/schedule-form";
import type { TeamSettingsData } from "@/components/tournament/team-settings-form";
import type { RegistrationSettingsData } from "@/components/tournament/registration-settings-form";

// =============================================================================
// 옵션
// =============================================================================
export interface MapOptions {
  /**
   * `true` → confidence ≥ CONFIDENCE_REVIEW (0.6) 도 적용 (사용자 명시 토글 ON)
   * `false` (default) → confidence ≥ CONFIDENCE_AUTO_APPLY (0.95) 만 적용
   */
  includeReview?: boolean;
}

// =============================================================================
// 출력 인터페이스 — 매핑된 부분 폼 데이터 (Partial / 매핑 안 된 필드는 undefined)
// =============================================================================
/**
 * 본 함수의 출력은 **부분 Partial** — caller 가 기존 폼 state 에 spread 머지 책임.
 * (덮어쓰지 않음 / undefined 필드 = "기존 값 유지" / null 값 = "명시적 비움" — 그러나 null 박제 0 / undefined 박제)
 */
export interface ProspectusMappedDraft {
  meta: {
    title?: string;
    description?: string | null;
    format?: string | null;
  };
  schedule?: Partial<ScheduleFormData>;
  team?: Partial<TeamSettingsData>;
  registration?: Partial<RegistrationSettingsData>;
}

// =============================================================================
// 임계값 헬퍼 — confidence 통과 여부
// =============================================================================
function passes(
  confidence: number | null | undefined,
  includeReview: boolean,
): boolean {
  if (confidence == null) return false;
  const threshold = includeReview ? CONFIDENCE_REVIEW : CONFIDENCE_AUTO_APPLY;
  return confidence >= threshold;
}

// =============================================================================
// 메인 함수 — analysis → ProspectusMappedDraft
// =============================================================================
/**
 * AI 분석 결과 → 4 폼 부분 데이터 매핑.
 *
 * @param analysis - gateway.ts `analyzeProspectus()` 의 `analysis` 결과
 * @param options - includeReview (default false / 자동 채움은 95%+ 만)
 * @returns ProspectusMappedDraft — caller 가 기존 WizardDraft 에 머지 책임
 */
export function mapAnalysisToDraft(
  analysis: ProspectusAnalysisResult,
  options: MapOptions = {},
): ProspectusMappedDraft {
  const includeReview = options.includeReview ?? false;
  const result: ProspectusMappedDraft = { meta: {} };

  // -------- meta --------
  if (analysis.meta.title && passes(analysis.meta.title_confidence, includeReview)) {
    result.meta.title = analysis.meta.title;
  }
  if (
    analysis.meta.description &&
    passes(analysis.meta.description_confidence, includeReview)
  ) {
    result.meta.description = analysis.meta.description;
  }
  if (
    analysis.meta.format &&
    passes(analysis.meta.format_confidence, includeReview)
  ) {
    result.meta.format = analysis.meta.format;
  }

  // -------- schedule --------
  const schedule: Partial<ScheduleFormData> = {};
  if (
    analysis.schedule.startDate &&
    passes(analysis.schedule.startDate_confidence, includeReview)
  ) {
    schedule.startDate = analysis.schedule.startDate;
  }
  if (
    analysis.schedule.endDate &&
    passes(analysis.schedule.endDate_confidence, includeReview)
  ) {
    schedule.endDate = analysis.schedule.endDate;
  }
  if (
    analysis.schedule.registrationStartAt &&
    passes(analysis.schedule.registrationStartAt_confidence, includeReview)
  ) {
    schedule.registrationStartAt = analysis.schedule.registrationStartAt;
  }
  if (
    analysis.schedule.registrationEndAt &&
    passes(analysis.schedule.registrationEndAt_confidence, includeReview)
  ) {
    schedule.registrationEndAt = analysis.schedule.registrationEndAt;
  }
  if (
    analysis.schedule.venueName &&
    passes(analysis.schedule.venueName_confidence, includeReview)
  ) {
    schedule.venueName = analysis.schedule.venueName;
  }
  if (
    analysis.schedule.venueAddress &&
    passes(analysis.schedule.venueAddress_confidence, includeReview)
  ) {
    schedule.venueAddress = analysis.schedule.venueAddress;
  }
  if (
    analysis.schedule.city &&
    passes(analysis.schedule.city_confidence, includeReview)
  ) {
    schedule.city = analysis.schedule.city;
  }
  // places 자동 생성 — venueName + venueAddress 둘 다 통과 시 [{name, address}] 박제 (UI 일관성)
  if (schedule.venueName && schedule.venueAddress) {
    schedule.places = [
      { name: schedule.venueName, address: schedule.venueAddress },
    ] as PlaceInfo[];
  }
  if (Object.keys(schedule).length > 0) {
    result.schedule = schedule;
  }

  // -------- team (number → String 변환 / 폼이 string) --------
  const team: Partial<TeamSettingsData> = {};
  if (
    analysis.team.maxTeams != null &&
    passes(analysis.team.maxTeams_confidence, includeReview)
  ) {
    team.maxTeams = String(analysis.team.maxTeams);
  }
  if (
    analysis.team.teamSize != null &&
    passes(analysis.team.teamSize_confidence, includeReview)
  ) {
    team.teamSize = String(analysis.team.teamSize);
  }
  if (
    analysis.team.rosterMin != null &&
    passes(analysis.team.rosterMin_confidence, includeReview)
  ) {
    team.rosterMin = String(analysis.team.rosterMin);
  }
  if (
    analysis.team.rosterMax != null &&
    passes(analysis.team.rosterMax_confidence, includeReview)
  ) {
    team.rosterMax = String(analysis.team.rosterMax);
  }
  if (Object.keys(team).length > 0) {
    result.team = team;
  }

  // -------- registration (entryFee number → String / divisions → divCaps + divFees) --------
  const registration: Partial<RegistrationSettingsData> = {};
  if (
    analysis.registration.entryFee != null &&
    passes(analysis.registration.entryFee_confidence, includeReview)
  ) {
    registration.entryFee = String(analysis.registration.entryFee);
  }
  if (
    analysis.registration.bankName &&
    passes(analysis.registration.bankName_confidence, includeReview)
  ) {
    registration.bankName = analysis.registration.bankName;
  }
  if (
    analysis.registration.bankAccount &&
    passes(analysis.registration.bankAccount_confidence, includeReview)
  ) {
    registration.bankAccount = analysis.registration.bankAccount;
  }
  if (
    analysis.registration.bankHolder &&
    passes(analysis.registration.bankHolder_confidence, includeReview)
  ) {
    registration.bankHolder = analysis.registration.bankHolder;
  }
  if (
    analysis.registration.feeNotes &&
    passes(analysis.registration.feeNotes_confidence, includeReview)
  ) {
    registration.feeNotes = analysis.registration.feeNotes;
  }

  // divisions → divCaps + divFees Record (RegistrationSettingsData 형식)
  // 각 division element 단위 confidence 체크 — 통과한 division 만 추가
  const divCaps: Record<string, number> = {};
  const divFees: Record<string, number> = {};
  for (const div of analysis.registration.divisions) {
    if (!div.name || !passes(div.name_confidence, includeReview)) continue;
    const divName = div.name;
    if (div.cap != null && passes(div.cap_confidence, includeReview)) {
      divCaps[divName] = div.cap;
    }
    if (div.feeKrw != null && passes(div.feeKrw_confidence, includeReview)) {
      divFees[divName] = div.feeKrw;
    }
  }
  if (Object.keys(divCaps).length > 0) {
    registration.divCaps = divCaps;
  }
  if (Object.keys(divFees).length > 0) {
    registration.divFees = divFees;
  }

  if (Object.keys(registration).length > 0) {
    result.registration = registration;
  }

  return result;
}

// =============================================================================
// 헬퍼 — 분석 결과 요약 (UI 표시용)
// =============================================================================
export interface AnalysisSummary {
  totalFields: number;
  autoApply: number; // ≥ 0.95
  review: number; // 0.6 ~ 0.95
  rejected: number; // < 0.6
}

/**
 * 분석 결과 요약 — UI 헤더 ("자동 12 / 검토 5 / 거절 3" 식 표시).
 */
export function summarizeAnalysis(
  analysis: ProspectusAnalysisResult,
): AnalysisSummary {
  const summary: AnalysisSummary = {
    totalFields: 0,
    autoApply: 0,
    review: 0,
    rejected: 0,
  };

  // confidence 필드 grep — `_confidence` suffix 가진 모든 leaf 값 카운트
  const collect = (obj: unknown): void => {
    if (!obj || typeof obj !== "object") return;
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key.endsWith("_confidence") && typeof value === "number") {
        summary.totalFields++;
        if (value >= CONFIDENCE_AUTO_APPLY) summary.autoApply++;
        else if (value >= CONFIDENCE_REVIEW) summary.review++;
        else summary.rejected++;
      } else if (key === "divisions" && Array.isArray(value)) {
        for (const div of value) collect(div);
      } else if (typeof value === "object" && value !== null) {
        collect(value);
      }
    }
  };

  collect(analysis);
  return summary;
}
