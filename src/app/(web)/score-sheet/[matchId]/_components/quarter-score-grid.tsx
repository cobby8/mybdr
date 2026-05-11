/**
 * Q1/Q2/Q3/Q4 (+OT) × 홈/어웨이 점수 입력 grid.
 *
 * 2026-05-11 — Phase 1-B-2 신규.
 *
 * 동작:
 *   - 각 쿼터별 number input — 0 이상만 허용 (validation = 부모 폼)
 *   - 합산 자동 계산 (홈/어웨이 각 sum)
 *   - 연장 (OT1, OT2, ...) = "+ 연장 추가" 버튼 동적 (최대 4번까지 — FIBA 5x5 표준)
 *
 * 출력 (부모 form 으로 전달):
 *   - quarter_scores JSON = `{ home: { q1, q2, q3, q4, ot[] }, away: { ... } }`
 *   - 최종 합산 home_score / away_score (부모가 quarter 합 또는 수동 입력 분기)
 */

"use client";

import type { ChangeEvent } from "react";

export interface QuarterScores {
  q1: { home: number; away: number };
  q2: { home: number; away: number };
  q3: { home: number; away: number };
  q4: { home: number; away: number };
  // OT 배열 — 0개면 빈 배열, 최대 4번 (FIBA 5x5)
  ot: Array<{ home: number; away: number }>;
}

interface QuarterScoreGridProps {
  values: QuarterScores;
  onChange: (next: QuarterScores) => void;
  disabled?: boolean;
}

// 기본 초기값 — 부모 form 에서도 사용 (export)
export const EMPTY_QUARTER_SCORES: QuarterScores = {
  q1: { home: 0, away: 0 },
  q2: { home: 0, away: 0 },
  q3: { home: 0, away: 0 },
  q4: { home: 0, away: 0 },
  ot: [],
};

const MAX_OT = 4;

export function QuarterScoreGrid({
  values,
  onChange,
  disabled,
}: QuarterScoreGridProps) {
  // 단일 쿼터 update — q1~q4
  const updateQuarter =
    (q: "q1" | "q2" | "q3" | "q4", side: "home" | "away") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = Math.max(0, Math.floor(Number(e.target.value) || 0));
      onChange({
        ...values,
        [q]: { ...values[q], [side]: value },
      });
    };

  // OT update — index 기반
  const updateOt =
    (idx: number, side: "home" | "away") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = Math.max(0, Math.floor(Number(e.target.value) || 0));
      const nextOt = values.ot.map((slot, i) =>
        i === idx ? { ...slot, [side]: value } : slot
      );
      onChange({ ...values, ot: nextOt });
    };

  // OT 추가 — 빈 슬롯 push (0/0)
  const addOt = () => {
    if (values.ot.length >= MAX_OT) return;
    onChange({ ...values, ot: [...values.ot, { home: 0, away: 0 }] });
  };

  // OT 제거 — 마지막 슬롯 pop (전체 제거 X, 끝에서 1건씩)
  const removeOt = () => {
    if (values.ot.length === 0) return;
    onChange({ ...values, ot: values.ot.slice(0, -1) });
  };

  // 합산 자동 계산
  const sumHome =
    values.q1.home +
    values.q2.home +
    values.q3.home +
    values.q4.home +
    values.ot.reduce((acc, ot) => acc + ot.home, 0);
  const sumAway =
    values.q1.away +
    values.q2.away +
    values.q3.away +
    values.q4.away +
    values.ot.reduce((acc, ot) => acc + ot.away, 0);

  return (
    <div
      className="mb-6 rounded-[12px] p-4"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          쿼터별 점수
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addOt}
            disabled={disabled || values.ot.length >= MAX_OT}
            className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-1 text-xs text-[var(--color-text-primary)] disabled:opacity-50"
          >
            + 연장
          </button>
          {values.ot.length > 0 && (
            <button
              type="button"
              onClick={removeOt}
              disabled={disabled}
              className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-1 text-xs text-[var(--color-text-primary)] disabled:opacity-50"
            >
              − 연장
            </button>
          )}
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
            <th className="w-20 py-2 text-left"></th>
            <th className="py-2 text-center">Q1</th>
            <th className="py-2 text-center">Q2</th>
            <th className="py-2 text-center">Q3</th>
            <th className="py-2 text-center">Q4</th>
            {values.ot.map((_, idx) => (
              <th key={`ot-th-${idx}`} className="py-2 text-center">
                OT{idx + 1}
              </th>
            ))}
            <th className="w-16 py-2 text-center font-semibold text-[var(--color-text-primary)]">
              합계
            </th>
          </tr>
        </thead>
        <tbody>
          {/* 홈 행 */}
          <tr className="border-b border-[var(--color-border-light,var(--color-border))]">
            <td className="py-2 text-left">
              <span
                className="rounded-[4px] px-2 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                홈
              </span>
            </td>
            <ScoreCell
              value={values.q1.home}
              onChange={updateQuarter("q1", "home")}
              disabled={disabled}
            />
            <ScoreCell
              value={values.q2.home}
              onChange={updateQuarter("q2", "home")}
              disabled={disabled}
            />
            <ScoreCell
              value={values.q3.home}
              onChange={updateQuarter("q3", "home")}
              disabled={disabled}
            />
            <ScoreCell
              value={values.q4.home}
              onChange={updateQuarter("q4", "home")}
              disabled={disabled}
            />
            {values.ot.map((slot, idx) => (
              <ScoreCell
                key={`ot-home-${idx}`}
                value={slot.home}
                onChange={updateOt(idx, "home")}
                disabled={disabled}
              />
            ))}
            <td className="py-2 text-center text-base font-bold text-[var(--color-text-primary)]">
              {sumHome}
            </td>
          </tr>
          {/* 어웨이 행 */}
          <tr>
            <td className="py-2 text-left">
              <span
                className="rounded-[4px] px-2 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: "var(--color-info)" }}
              >
                원정
              </span>
            </td>
            <ScoreCell
              value={values.q1.away}
              onChange={updateQuarter("q1", "away")}
              disabled={disabled}
            />
            <ScoreCell
              value={values.q2.away}
              onChange={updateQuarter("q2", "away")}
              disabled={disabled}
            />
            <ScoreCell
              value={values.q3.away}
              onChange={updateQuarter("q3", "away")}
              disabled={disabled}
            />
            <ScoreCell
              value={values.q4.away}
              onChange={updateQuarter("q4", "away")}
              disabled={disabled}
            />
            {values.ot.map((slot, idx) => (
              <ScoreCell
                key={`ot-away-${idx}`}
                value={slot.away}
                onChange={updateOt(idx, "away")}
                disabled={disabled}
              />
            ))}
            <td className="py-2 text-center text-base font-bold text-[var(--color-text-primary)]">
              {sumAway}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ScoreCell({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <td className="py-1 text-center">
      <input
        type="number"
        min={0}
        max={199}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-14 rounded-[4px] border-none bg-[var(--color-elevated)] px-1 py-1.5 text-center text-sm text-[var(--color-text-primary)] disabled:opacity-50"
        inputMode="numeric"
      />
    </td>
  );
}

/**
 * QuarterScores → DB 저장 형식 (Flutter sync API 와 동일).
 * `{ home: { q1, q2, q3, q4, ot: [] }, away: { q1, q2, q3, q4, ot: [] } }`
 */
export function toQuarterScoresJson(values: QuarterScores): {
  home: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
  away: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
} {
  return {
    home: {
      q1: values.q1.home,
      q2: values.q2.home,
      q3: values.q3.home,
      q4: values.q4.home,
      ot: values.ot.map((slot) => slot.home),
    },
    away: {
      q1: values.q1.away,
      q2: values.q2.away,
      q3: values.q3.away,
      q4: values.q4.away,
      ot: values.ot.map((slot) => slot.away),
    },
  };
}

/**
 * server prop 의 quarterScores JSON → QuarterScores state 형식 변환.
 * Flutter 기존 데이터 호환 (q1~q4 + ot[] 형태).
 */
export function fromQuarterScoresJson(
  raw: Record<string, unknown> | null
): QuarterScores {
  if (!raw || typeof raw !== "object") return EMPTY_QUARTER_SCORES;
  const home = (raw.home ?? {}) as Record<string, unknown>;
  const away = (raw.away ?? {}) as Record<string, unknown>;
  const homeOt = Array.isArray(home.ot) ? (home.ot as number[]) : [];
  const awayOt = Array.isArray(away.ot) ? (away.ot as number[]) : [];
  const otLen = Math.max(homeOt.length, awayOt.length);
  return {
    q1: { home: Number(home.q1) || 0, away: Number(away.q1) || 0 },
    q2: { home: Number(home.q2) || 0, away: Number(away.q2) || 0 },
    q3: { home: Number(home.q3) || 0, away: Number(away.q3) || 0 },
    q4: { home: Number(home.q4) || 0, away: Number(away.q4) || 0 },
    ot: Array.from({ length: otLen }, (_, i) => ({
      home: Number(homeOt[i]) || 0,
      away: Number(awayOt[i]) || 0,
    })),
  };
}
