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
  // Phase 8 — frameless 모드. 단일 외곽 박스 안에서 자체 border 제거.
  frameless?: boolean;
}

export function PeriodScoresSection({
  state,
  homeTeamName,
  awayTeamName,
  onAdvancePeriod,
  onRetreatPeriod,
  onEndPeriod,
  disabled,
  frameless,
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

  // Phase 8 — frameless 모드: 단일 외곽 박스 안에서 자체 border 제거.
  const innerBorderStyle: React.CSSProperties = frameless
    ? {}
    : { border: "1px solid var(--color-border)" };
  const innerBorderClass = frameless ? "fiba-frameless" : "";

  return (
    // Phase 9 — gap-1 압축 (A4 1 페이지 fit)
    <div className="flex w-full flex-col gap-1">
      {/* Period 표 — FIBA 양식 정합. Phase 9 — 헤더 px-2 py-0.5 컴팩트. */}
      <div className={innerBorderClass} style={innerBorderStyle}>
        {/* Phase 19 (2026-05-13) — 헤더 padding + 폰트 강화 (사용자 결재 §2·§5).
            - px-2 py-0.5 → px-2 py-1 (상하 4px 여백 일관)
            - "PERIOD SCORES" 11px font-semibold → 12px font-bold uppercase (FIBA 정합) */}
        <div
          className="flex items-center justify-between px-2 py-1"
          style={{
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="text-[12px] font-bold uppercase tracking-wider">
            Period Scores
          </div>
          <div className="flex items-center gap-1">
            {/* Phase 9 — 버튼 h-7 (44px → 28px 컴팩트). 터치는 wide press-area + touchAction 유지 */}
            <button
              type="button"
              onClick={onRetreatPeriod}
              disabled={disabled || state.currentPeriod <= 1}
              className="inline-flex h-7 min-w-7 items-center justify-center px-1 text-xs disabled:opacity-30"
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
              {periodLabel(state.currentPeriod)}
            </div>
            <button
              type="button"
              onClick={onAdvancePeriod}
              disabled={disabled || state.currentPeriod >= 7}
              className="inline-flex h-7 min-w-7 items-center justify-center px-1 text-xs disabled:opacity-30"
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

        {/* Phase 19 (2026-05-13) — 합산 표 폰트 강화 (사용자 결재 §3 / 데이터 12px).
            - 표 텍스트 11px → 12px (시인성 ↑)
            - thead 라벨 font-medium → font-bold uppercase (FIBA 정합 / 라벨 10px bold 룰) */}
        <table className="w-full text-[12px]">
          <thead
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-muted)",
            }}
          >
            <tr>
              <th
                className="px-1 py-0.5 text-left text-[10px] font-bold uppercase tracking-wider"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                Period
              </th>
              <th
                className="px-1 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                A
              </th>
              <th
                className="px-1 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider"
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
                    className="px-1 py-0 font-medium text-[var(--color-text-primary)]"
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
                    className="px-1 py-0 text-center font-mono"
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
                    className="px-1 py-0 text-center font-mono"
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
          // Phase 9 — px-1 py-1 컴팩트 (A4 fit)
          <div
            className="px-1 py-1"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <button
              type="button"
              onClick={onEndPeriod}
              disabled={disabled || state.currentPeriod >= 7}
              className="flex w-full items-center justify-center gap-1 py-1 text-xs font-semibold disabled:opacity-40"
              style={{
                border: "1px solid var(--color-accent)",
                backgroundColor:
                  "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                color: "var(--color-accent)",
                touchAction: "manipulation",
              }}
              aria-label={`현재 ${periodLabel(state.currentPeriod)} 종료`}
            >
              <span className="material-symbols-outlined text-sm">
                stop_circle
              </span>
              {periodLabel(state.currentPeriod)} 종료
            </button>
          </div>
        )}
      </div>

      {/* Final Score + Winner. Phase 9 — 컴팩트 padding (px-2 py-1) + 숫자 text-xl */}
      <div
        className={frameless ? "fiba-frameless px-2 py-1" : "px-3 py-2"}
        style={
          frameless
            ? {
                // frameless: 단일 외곽 박스 안 — 상단 분할선만 (border-top)
                borderTop: "1px solid var(--color-text-primary)",
              }
            : {
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }
        }
      >
        {/* Phase 19 (2026-05-13) — Final Score 영역 폰트 강화 (사용자 결재 §2 / 라벨 bold).
            - "Final Score" 10px uppercase → 11px font-bold uppercase tracking-wider (라벨 bold 통일)
            - 팀명 10px → 11px (데이터 12px 룰에 근접)
            - 점수 합산 text-xl (20px) 유지 — 시각 hierarchy 핵심 데이터 */}
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Final Score
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            <div className="line-clamp-1 text-[11px] font-semibold text-[var(--color-text-muted)]">
              {homeTeamName}
            </div>
            <div
              className="font-mono text-xl font-bold leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {final.homeTotal}
            </div>
          </div>
          <div className="text-sm font-semibold text-[var(--color-text-muted)]">
            :
          </div>
          <div className="flex-1 text-center">
            <div className="line-clamp-1 text-[11px] font-semibold text-[var(--color-text-muted)]">
              {awayTeamName}
            </div>
            <div
              className="font-mono text-xl font-bold leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {final.awayTotal}
            </div>
          </div>
        </div>

        {/* Winner — 결정 시만 표시 (그린 — 긍정 결과 컨벤션). Phase 9 mt-1 / py-0.5 */}
        {final.winner !== "none" && (
          <div
            className="mt-1 px-2 py-0.5 text-center text-[11px] font-semibold"
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

        {/* Phase 11 §4 (2026-05-12) — "Name of winning team: ____" underscore 라인 (FIBA 정합 / reviewer Major).
            이유: FIBA 종이기록지 = Final Score 아래 별도 underscore 라인으로 승팀명 적는 영역.
            동작: winner 자동 계산 시 = 팀명 자동 채움 / 동점·미결 = 빈 underscore (운영자가 펜으로 적음).
            라이트 회색 underscore → 인쇄 시 _print.css 가 검정 강제. */}
        {/* Phase 19 — 승팀명 라벨 9px → 10px bold uppercase (라벨 룰) / 데이터 11px → 12px (데이터 룰) */}
        <div className="mt-1 flex items-baseline gap-1.5">
          <span
            className="shrink-0 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Name of winning team
          </span>
          <span
            className="min-w-0 flex-1 truncate pb-0 text-[12px] font-semibold"
            style={{
              color: "var(--color-text-primary)",
              borderBottom: "1px solid var(--color-text-primary)",
              // 빈 라인이어도 underscore 표시되도록 빈 공간 확보
              minHeight: 14,
            }}
            title={
              final.winner === "home"
                ? homeTeamName
                : final.winner === "away"
                  ? awayTeamName
                  : ""
            }
          >
            {final.winner === "home"
              ? homeTeamName
              : final.winner === "away"
                ? awayTeamName
                : " "}
          </span>
        </div>
      </div>
    </div>
  );
}
