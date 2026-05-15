/**
 * 2026-05-16 PR-Admin-3 — placeholder 매치 검증 배너 (admin 흐름 §6.5 우선 3).
 *
 * 이유(왜):
 *   - 강남구협회장배 사고 (2026-05-15) = 순위전 매치 13건이 실팀으로 박혀버려
 *     advanceDivisionPlaceholders 자동 채움 불가 → 운영자가 수동 조치 필요했지만 인지 늦음.
 *   - 본 배너 = matches-client.tsx 본문에 read-only 검출 결과 노출 → 운영자가 즉시 감지·조치 가능.
 *   - 검출 0건 = null 반환 (배너 미표시 — 정상 운영 흐름 방해 0).
 *
 * 검출 로직 = `detectInvalidPlaceholderMatches` (placeholder-helpers.ts) 단일 source.
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-warning) 톤 (오류 아니라 경고 — 운영 진행은 가능 / 수동 조치 권장)
 *   - rounded-[4px] / material-symbols-outlined "warning" / 모바일 풀너비
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { detectInvalidPlaceholderMatches } from "@/lib/tournaments/placeholder-helpers";

// matches-client.tsx Match type 부분 호환 — 본 배너에 필요한 필드만 명시
type MatchForValidation = {
  id: string | number;
  roundName: string | null;
  homeTeamId: string | number | null;
  awayTeamId: string | number | null;
  notes: string | null;
  settings?: Record<string, unknown> | null;
};

type Props = {
  matches: MatchForValidation[];
  // 호출자가 종별/체육관 필터 적용 후 매치만 전달할지 / 전체 전달할지 선택 (UI 표기상 의미)
  // 본 컴포넌트는 전달받은 matches 그대로 검증 — applyFilter 는 라벨 안내 용도
  applyFilter?: boolean;
};

export function PlaceholderValidationBanner({ matches, applyFilter = false }: Props) {
  // 펼치기 토글 — 검출 N건 상세 (matchId / roundName / notes) 노출
  const [expanded, setExpanded] = useState(false);

  // 검출 — read-only / 부수효과 0
  const violations = detectInvalidPlaceholderMatches(matches);

  // 검출 0건 = 배너 미표시 (정상 운영 방해 0)
  if (violations.length === 0) return null;

  // 분류 — format-violation (강남구 사고 패턴) / missing-slot-label (G7 후속 큐)
  const formatViolations = violations.filter((v) => v.reason === "format-violation");
  const missingLabels = violations.filter((v) => v.reason === "missing-slot-label");

  // 검출된 매치 상세 lookup (펼치기 시 노출용)
  const violationDetails = violations.map((v) => {
    const match = matches.find((m) => m.id === v.matchId);
    return {
      matchId: v.matchId,
      reason: v.reason,
      roundName: match?.roundName ?? "(unknown)",
      notes: match?.notes ?? "(없음)",
    };
  });

  return (
    <Card
      className="mb-4"
      style={{
        // 경고 톤 — 배경 alpha 10% + 좌측 보더 강조
        backgroundColor: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
        borderColor: "var(--color-warning)",
      }}
    >
      <div className="flex items-start gap-3">
        {/* 경고 아이콘 — material-symbols-outlined warning */}
        <span
          className="material-symbols-outlined flex-shrink-0"
          style={{ color: "var(--color-warning)", fontSize: 24 }}
          aria-hidden="true"
        >
          warning
        </span>

        <div className="flex-1 min-w-0">
          {/* 헤더 — 검출 건수 요약 + 펼치기 토글 버튼 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold" style={{ color: "var(--color-warning)" }}>
                ⚠️ 순위결정전 {violations.length}건이 placeholder 형식이 아닙니다.
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                강남구협회장배 사고 (2026-05-15) 재발 방지 검증.
                {applyFilter && " (현재 필터 적용된 매치만 검증)"}
              </p>
              {/* 분류별 요약 */}
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {formatViolations.length > 0 && (
                  <span style={{ color: "var(--color-warning)" }}>
                    형식 위반 (실팀 박힘 + notes 형식 X): {formatViolations.length}건
                  </span>
                )}
                {missingLabels.length > 0 && (
                  <span className="text-[var(--color-text-muted)]">
                    슬롯 라벨 누락 (settings.homeSlotLabel/awaySlotLabel): {missingLabels.length}건
                  </span>
                )}
              </div>
            </div>

            {/* 펼치기 / 접기 버튼 — 모바일 full-width / PC 우측 */}
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center justify-center gap-1 rounded-[4px] px-3 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--color-elevated)",
                color: "var(--color-text-primary)",
                minHeight: 36,
              }}
              aria-expanded={expanded}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                {expanded ? "expand_less" : "expand_more"}
              </span>
              {expanded ? "접기" : "상세 보기"}
            </button>
          </div>

          {/* 펼치기 — 검출 매치 상세 (matchId / roundName / notes / 권장 액션) */}
          {expanded && (
            <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
              {violationDetails.map((v) => (
                <div
                  key={String(v.matchId)}
                  className="rounded-[4px] p-2 text-xs"
                  style={{ backgroundColor: "var(--color-elevated)" }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[var(--color-text-muted)]">#{String(v.matchId)}</span>
                    <span className="font-medium">{v.roundName}</span>
                    <span
                      className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor:
                          v.reason === "format-violation"
                            ? "color-mix(in srgb, var(--color-warning) 20%, transparent)"
                            : "color-mix(in srgb, var(--color-info) 20%, transparent)",
                        color:
                          v.reason === "format-violation"
                            ? "var(--color-warning)"
                            : "var(--color-info)",
                      }}
                    >
                      {v.reason === "format-violation" ? "형식 위반" : "라벨 누락"}
                    </span>
                  </div>
                  <div className="mt-1 text-[var(--color-text-muted)]">
                    notes: <code className="font-mono">{v.notes}</code>
                  </div>
                  <div className="mt-1 text-[var(--color-text-muted)]">
                    권장 액션:{" "}
                    {v.reason === "format-violation"
                      ? "매치를 수동 수정 — homeTeamId/awayTeamId 를 NULL 로 되돌리고 notes 를 'A조 1위 vs B조 1위' 형식으로 박제."
                      : "G7 후속 큐 — generator 자동 박제 예정. 우선 운영자 수동 fix 권장."}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
