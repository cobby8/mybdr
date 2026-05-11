/**
 * PeriodScoresSection — Period ①~④ + Extra + Final Score + Winner 자동 표시.
 *
 * 2026-05-12 — Phase 2 신규.
 *
 * 왜 (이유):
 *   FIBA 양식 우측 하단 = Period 별 점수 + 최종 합산 + 승팀명. Running Score 마킹으로부터
 *   자동 산출 — 운영자 별도 입력 0 (자동화).
 *
 * 방법 (어떻게):
 *   - sumByPeriod 헬퍼 = period 별 [home/away] 합산
 *   - computeFinalScore 헬퍼 = 최종 점수 + winner
 *   - Period 종료 마킹 = Phase 4 통합 토글 (현 turn 은 currentPeriod 라벨만 표시)
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ / 강조 = var(--color-accent)
 *   - 승팀명 = var(--color-success) (그린 — 긍정 결과 컨벤션)
 */

"use client";

import type { RunningScoreState } from "@/lib/score-sheet/running-score-types";
import {
  sumByPeriod,
  computeFinalScore,
} from "@/lib/score-sheet/running-score-helpers";

interface PeriodScoresSectionProps {
  state: RunningScoreState;
  homeTeamName: string;
  awayTeamName: string;
  // Period 변경 핸들러 (Phase 4 통합 전 임시 — 다음 Period 토글)
  onAdvancePeriod?: () => void;
  onRetreatPeriod?: () => void;
  // Phase 3.5 — "쿼터 종료" 명시적 액션 (currentPeriod 이상 + toast 호출)
  //   onAdvancePeriod 와 동일 동작이지만 caller 가 toast 분기
  onEndPeriod?: () => void;
  disabled?: boolean;
}

export function PeriodScoresSection({
  state,
  homeTeamName,
  awayTeamName,
  onAdvancePeriod,
  onRetreatPeriod,
  onEndPeriod,
  disabled,
}: PeriodScoresSectionProps) {
  // Period 별 합산
  const lines = sumByPeriod(state);

  // 최종 점수 + 승자
  const final = computeFinalScore(state);

  // Period 라벨 표시 (1=Q1 / 5=OT1)
  function periodLabel(period: number): string {
    if (period <= 4) {
      return `Q${period}`;
    }
    return `OT${period - 4}`;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Period 표 — FIBA 양식 정합 */}
      <div
        className="rounded-[4px]"
        style={{
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          className="flex items-center justify-between px-2 py-1"
          style={{
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider">
            Period Scores
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRetreatPeriod}
              disabled={disabled || state.currentPeriod <= 1}
              // 터치 영역 44px+
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-[4px] px-2 text-xs disabled:opacity-30"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                touchAction: "manipulation",
              }}
              aria-label="이전 Period"
            >
              <span className="material-symbols-outlined text-sm">
                chevron_left
              </span>
            </button>
            <div className="px-1 text-[11px] font-semibold text-[var(--color-text-primary)]">
              현재: {periodLabel(state.currentPeriod)}
            </div>
            <button
              type="button"
              onClick={onAdvancePeriod}
              disabled={disabled || state.currentPeriod >= 7}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-[4px] px-2 text-xs disabled:opacity-30"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                touchAction: "manipulation",
              }}
              aria-label="다음 Period"
            >
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </button>
          </div>
        </div>

        {/* Period 합산 표 */}
        <table className="w-full text-[11px]">
          <thead
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-muted)",
            }}
          >
            <tr>
              <th
                className="px-1 py-1 text-left font-medium"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                Period
              </th>
              <th
                className="px-1 py-1 text-center font-medium"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                A
              </th>
              <th
                className="px-1 py-1 text-center font-medium"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                B
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const isCurrent = line.period === state.currentPeriod;
              // Phase 3.5 — 종료된 Period (currentPeriod 미만) = 회색 강조
              const isEnded = line.period < state.currentPeriod;
              return (
                <tr
                  key={line.period}
                  style={{
                    backgroundColor: isCurrent
                      ? "color-mix(in srgb, var(--color-accent) 12%, transparent)"
                      : isEnded
                        ? "var(--color-surface)"
                        : "transparent",
                    color: isEnded ? "var(--color-text-muted)" : undefined,
                  }}
                >
                  <td
                    className="px-1 py-1 font-medium text-[var(--color-text-primary)]"
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      color: isEnded
                        ? "var(--color-text-muted)"
                        : "var(--color-text-primary)",
                    }}
                  >
                    {periodLabel(line.period)}
                    {/* Phase 3.5 — 종료 마크 (체크) */}
                    {isEnded && (
                      <span
                        className="ml-1 material-symbols-outlined text-[12px]"
                        style={{
                          color: "var(--color-success)",
                          verticalAlign: "middle",
                        }}
                        aria-label="Period 종료"
                      >
                        check
                      </span>
                    )}
                  </td>
                  <td
                    className="px-1 py-1 text-center font-mono"
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      color: isEnded
                        ? "var(--color-text-muted)"
                        : "var(--color-text-primary)",
                    }}
                  >
                    {line.homePoints}
                  </td>
                  <td
                    className="px-1 py-1 text-center font-mono"
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      color: isEnded
                        ? "var(--color-text-muted)"
                        : "var(--color-text-primary)",
                    }}
                  >
                    {line.awayPoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Phase 3.5 — 쿼터 종료 큰 버튼 (44px+ 터치).
            클릭 시 currentPeriod++ + toast (caller 가 분기). Q4 종료 후 OT 진입 가능.
            7 (OT3) 도달 시 비활성화 — 더 이상 진행 불가 */}
        {onEndPeriod && (
          <div
            className="px-2 py-2"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <button
              type="button"
              onClick={onEndPeriod}
              disabled={disabled || state.currentPeriod >= 7}
              className="flex w-full items-center justify-center gap-1 rounded-[4px] py-2 text-sm font-semibold disabled:opacity-40"
              style={{
                border: "1px solid var(--color-accent)",
                backgroundColor:
                  "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                color: "var(--color-accent)",
                touchAction: "manipulation",
              }}
              aria-label={`현재 ${periodLabel(state.currentPeriod)} 종료`}
            >
              <span className="material-symbols-outlined text-base">
                stop_circle
              </span>
              {periodLabel(state.currentPeriod)} 종료
            </button>
          </div>
        )}
      </div>

      {/* Final Score + Winner */}
      <div
        className="rounded-[4px] px-3 py-2"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
          Final Score
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            <div className="line-clamp-1 text-[10px] text-[var(--color-text-muted)]">
              {homeTeamName}
            </div>
            <div
              className="font-mono text-2xl font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {final.homeTotal}
            </div>
          </div>
          <div className="text-base font-semibold text-[var(--color-text-muted)]">
            :
          </div>
          <div className="flex-1 text-center">
            <div className="line-clamp-1 text-[10px] text-[var(--color-text-muted)]">
              {awayTeamName}
            </div>
            <div
              className="font-mono text-2xl font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {final.awayTotal}
            </div>
          </div>
        </div>

        {/* Winner — 결정 시만 표시 (그린 — 긍정 결과 컨벤션) */}
        {final.winner !== "none" && (
          <div
            className="mt-2 rounded-[4px] px-2 py-1 text-center text-[11px] font-semibold"
            style={{
              backgroundColor:
                final.winner === "tie"
                  ? "color-mix(in srgb, var(--color-warning) 15%, transparent)"
                  : "color-mix(in srgb, var(--color-success) 15%, transparent)",
              color:
                final.winner === "tie"
                  ? "var(--color-warning)"
                  : "var(--color-success)",
            }}
          >
            {final.winner === "tie"
              ? "⚠ 동점 — 연장(OT) 필요"
              : `★ Winner: ${final.winner === "home" ? homeTeamName : awayTeamName}`}
          </div>
        )}
      </div>
    </div>
  );
}
