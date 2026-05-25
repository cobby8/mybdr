"use client";

/**
 * 대회 요강 AI 분석 결과 미리보기 (Phase 3 박제 2026-05-20).
 *
 * confidence threshold 별 필드 분류 (✅ 자동 / ⚠️ 검토 / ❌ 거절). source_excerpt tooltip.
 *
 * 박제 룰 (시안 13룰):
 * - Material Symbols Outlined / lucide-react ❌
 * - var(--color-success / warning / danger) 토큰
 * - rounded-[4px] 버튼 / 44px 높이
 * - 720px 분기
 *
 * Props:
 * - analysis: ProspectusAnalysisResult
 * - includeReview: ⚠️ 60~95% 필드 적용 토글
 * - onIncludeReviewChange: 토글 변경 콜백
 */

import { useMemo } from "react";
import {
  type ProspectusAnalysisResult,
  CONFIDENCE_AUTO_APPLY,
  CONFIDENCE_REVIEW,
} from "@/lib/ai/prospectus-schema";
import { summarizeAnalysis } from "@/lib/tournaments/prospectus-to-draft";

interface Props {
  analysis: ProspectusAnalysisResult;
  includeReview: boolean;
  onIncludeReviewChange: (next: boolean) => void;
}

/**
 * leaf 필드 1건의 표시용 row.
 * 2026-05-20 fix 3: schema가 nullable.optional() 로 완화됨 — confidence/sourceExcerpt 가 undefined 허용.
 */
interface FieldRow {
  label: string;
  value: string;
  confidence: number | null | undefined;
  sourceExcerpt: string | null | undefined;
}

/**
 * 그룹 (schedule / team / registration / meta) 단위 row 모음.
 */
interface FieldGroup {
  groupKey: string;
  groupLabel: string;
  icon: string;
  rows: FieldRow[];
}

const LABELS: Record<string, string> = {
  // meta
  title: "대회명",
  description: "설명",
  format: "방식",
  // schedule
  startDate: "시작일",
  endDate: "종료일",
  registrationStartAt: "신청 시작",
  registrationEndAt: "신청 마감",
  venueName: "경기장명",
  venueAddress: "주소",
  city: "도시",
  // team
  maxTeams: "최대 팀",
  teamSize: "팀당 출전",
  rosterMin: "최소 로스터",
  rosterMax: "최대 로스터",
  // registration
  entryFee: "참가비",
  bankName: "은행",
  bankAccount: "계좌",
  bankHolder: "예금주",
  feeNotes: "참가비 메모",
};

/**
 * 단일 leaf 필드 → FieldRow 변환.
 * value 가 null / undefined → skip (rows 에 포함 ❌)
 */
function buildRow(
  label: string,
  value: unknown,
  confidence: number | null | undefined,
  sourceExcerpt: string | null | undefined,
): FieldRow | null {
  if (value == null || value === "") return null;
  return {
    label,
    value: String(value),
    confidence,
    sourceExcerpt,
  };
}

/**
 * 그룹별 row 빌더.
 */
function buildGroups(analysis: ProspectusAnalysisResult): FieldGroup[] {
  const groups: FieldGroup[] = [];

  // meta
  const metaRows = [
    buildRow(LABELS.title, analysis.meta.title, analysis.meta.title_confidence, analysis.meta.title_source_excerpt),
    buildRow(LABELS.description, analysis.meta.description, analysis.meta.description_confidence, analysis.meta.description_source_excerpt),
    buildRow(LABELS.format, analysis.meta.format, analysis.meta.format_confidence, analysis.meta.format_source_excerpt),
  ].filter((r): r is FieldRow => r !== null);
  if (metaRows.length > 0) {
    groups.push({ groupKey: "meta", groupLabel: "기본 정보", icon: "emoji_events", rows: metaRows });
  }

  // schedule
  const scheduleRows = [
    buildRow(LABELS.startDate, analysis.schedule.startDate, analysis.schedule.startDate_confidence, analysis.schedule.startDate_source_excerpt),
    buildRow(LABELS.endDate, analysis.schedule.endDate, analysis.schedule.endDate_confidence, analysis.schedule.endDate_source_excerpt),
    buildRow(LABELS.registrationStartAt, analysis.schedule.registrationStartAt, analysis.schedule.registrationStartAt_confidence, analysis.schedule.registrationStartAt_source_excerpt),
    buildRow(LABELS.registrationEndAt, analysis.schedule.registrationEndAt, analysis.schedule.registrationEndAt_confidence, analysis.schedule.registrationEndAt_source_excerpt),
    buildRow(LABELS.venueName, analysis.schedule.venueName, analysis.schedule.venueName_confidence, analysis.schedule.venueName_source_excerpt),
    buildRow(LABELS.venueAddress, analysis.schedule.venueAddress, analysis.schedule.venueAddress_confidence, analysis.schedule.venueAddress_source_excerpt),
    buildRow(LABELS.city, analysis.schedule.city, analysis.schedule.city_confidence, analysis.schedule.city_source_excerpt),
  ].filter((r): r is FieldRow => r !== null);
  if (scheduleRows.length > 0) {
    groups.push({ groupKey: "schedule", groupLabel: "일정 / 장소", icon: "event", rows: scheduleRows });
  }

  // team
  const teamRows = [
    buildRow(LABELS.maxTeams, analysis.team.maxTeams, analysis.team.maxTeams_confidence, analysis.team.maxTeams_source_excerpt),
    buildRow(LABELS.teamSize, analysis.team.teamSize, analysis.team.teamSize_confidence, analysis.team.teamSize_source_excerpt),
    buildRow(LABELS.rosterMin, analysis.team.rosterMin, analysis.team.rosterMin_confidence, analysis.team.rosterMin_source_excerpt),
    buildRow(LABELS.rosterMax, analysis.team.rosterMax, analysis.team.rosterMax_confidence, analysis.team.rosterMax_source_excerpt),
  ].filter((r): r is FieldRow => r !== null);
  if (teamRows.length > 0) {
    groups.push({ groupKey: "team", groupLabel: "팀 설정", icon: "groups", rows: teamRows });
  }

  // registration (entryFee + bank 4건 + divisions)
  const registrationRows = [
    buildRow(LABELS.entryFee, analysis.registration.entryFee, analysis.registration.entryFee_confidence, analysis.registration.entryFee_source_excerpt),
    buildRow(LABELS.bankName, analysis.registration.bankName, analysis.registration.bankName_confidence, analysis.registration.bankName_source_excerpt),
    buildRow(LABELS.bankAccount, analysis.registration.bankAccount, analysis.registration.bankAccount_confidence, analysis.registration.bankAccount_source_excerpt),
    buildRow(LABELS.bankHolder, analysis.registration.bankHolder, analysis.registration.bankHolder_confidence, analysis.registration.bankHolder_source_excerpt),
    buildRow(LABELS.feeNotes, analysis.registration.feeNotes, analysis.registration.feeNotes_confidence, analysis.registration.feeNotes_source_excerpt),
  ].filter((r): r is FieldRow => r !== null);

  // divisions (element 단위 / 별도 라벨)
  for (const [idx, div] of analysis.registration.divisions.entries()) {
    if (!div.name) continue;
    const label = `종별 ${idx + 1}: ${div.name}`;
    if (div.feeKrw != null) {
      const row = buildRow(`${label} 참가비`, div.feeKrw, div.feeKrw_confidence, div.feeKrw_source_excerpt);
      if (row) registrationRows.push(row);
    }
    if (div.cap != null) {
      const row = buildRow(`${label} 정원`, div.cap, div.cap_confidence, div.cap_source_excerpt);
      if (row) registrationRows.push(row);
    }
  }

  if (registrationRows.length > 0) {
    groups.push({ groupKey: "registration", groupLabel: "참가 설정", icon: "payments", rows: registrationRows });
  }

  return groups;
}

// =============================================================================
// confidence 분기 헬퍼
// =============================================================================
function confidenceBadge(confidence: number | null | undefined): {
  icon: string;
  label: string;
  colorVar: string;
  applies: (includeReview: boolean) => boolean;
} {
  if (confidence != null && confidence >= CONFIDENCE_AUTO_APPLY) {
    return {
      icon: "check_circle",
      label: "자동",
      colorVar: "var(--color-success)",
      applies: () => true,
    };
  }
  if (confidence != null && confidence >= CONFIDENCE_REVIEW) {
    return {
      icon: "warning",
      label: "검토",
      colorVar: "var(--color-warning)",
      applies: (includeReview) => includeReview,
    };
  }
  return {
    icon: "cancel",
    label: "거절",
    colorVar: "var(--color-danger)",
    applies: () => false,
  };
}

// =============================================================================
// 메인 컴포넌트
// =============================================================================
export function ProspectusAnalysisPreview({
  analysis,
  includeReview,
  onIncludeReviewChange,
}: Props) {
  const groups = useMemo(() => buildGroups(analysis), [analysis]);
  const summary = useMemo(() => summarizeAnalysis(analysis), [analysis]);

  return (
    <div className="space-y-4">
      {/* 헤더 — 요약 + 토글 */}
      <div className="flex flex-col gap-3 rounded-[4px] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="flex items-center gap-1 text-[var(--color-success)]">
            <span className="material-symbols-outlined text-base" aria-hidden>
              check_circle
            </span>
            자동 {summary.autoApply}
          </span>
          <span className="flex items-center gap-1 text-[var(--color-warning)]">
            <span className="material-symbols-outlined text-base" aria-hidden>
              warning
            </span>
            검토 {summary.review}
          </span>
          <span className="flex items-center gap-1 text-[var(--color-danger)]">
            <span className="material-symbols-outlined text-base" aria-hidden>
              cancel
            </span>
            거절 {summary.rejected}
          </span>
          <span className="text-[var(--color-text-muted)]">/ 총 {summary.totalFields}</span>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
          <input
            type="checkbox"
            checked={includeReview}
            onChange={(e) => onIncludeReviewChange(e.target.checked)}
            className="h-4 w-4"
          />
          ⚠️ 검토 필드도 적용
        </label>
      </div>

      {/* 그룹별 표 */}
      {groups.map((group) => (
        <div
          key={group.groupKey}
          className="overflow-hidden rounded-[4px] border border-[var(--color-border)]"
        >
          <div className="flex items-center gap-2 bg-[var(--color-surface)] px-4 py-3">
            <span
              className="material-symbols-outlined text-lg text-[var(--color-accent)]"
              aria-hidden
            >
              {group.icon}
            </span>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              {group.groupLabel}
            </h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              ({group.rows.length})
            </span>
          </div>

          <ul className="divide-y divide-[var(--color-border)]">
            {group.rows.map((row, idx) => {
              const badge = confidenceBadge(row.confidence);
              const applies = badge.applies(includeReview);
              return (
                <li
                  key={`${group.groupKey}-${idx}`}
                  className={`flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-start sm:gap-3 ${
                    applies ? "" : "opacity-50"
                  }`}
                >
                  <div className="flex items-start gap-2 sm:w-1/3">
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ color: badge.colorVar }}
                      aria-hidden
                    >
                      {badge.icon}
                    </span>
                    <span className="text-[var(--color-text-muted)]">{row.label}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-[var(--color-text-primary)]">
                      {row.value}
                    </div>
                    {row.sourceExcerpt && (
                      <div
                        className="mt-1 text-xs text-[var(--color-text-muted)]"
                        title={row.sourceExcerpt}
                      >
                        원문: “{row.sourceExcerpt.substring(0, 80)}
                        {row.sourceExcerpt.length > 80 ? "…" : ""}”
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] sm:w-16 sm:text-right">
                    {row.confidence != null
                      ? `${Math.round(row.confidence * 100)}%`
                      : "—"}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {groups.length === 0 && (
        <p className="rounded-[4px] bg-[var(--color-surface)] p-4 text-center text-sm text-[var(--color-text-muted)]">
          추출된 필드가 없습니다. 요강이 명확하지 않을 수 있어요.
        </p>
      )}
    </div>
  );
}
