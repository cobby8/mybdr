/**
 * FIBA SCORESHEET Phase 17 — 쿼터별 색 매핑 헬퍼 (2026-05-13 신규).
 *
 * 왜 (이유):
 *   FIBA 양식 = 단색 (검정) → 운영자가 어느 마킹이 어느 쿼터인지 인지 어려움.
 *   사용자 결재 §1 (이미지 14:00 KST) — 쿼터별 색 매핑으로 운영자/관객/리뷰어
 *   인지 향상. Legend (색상 안내) 외부 노출 + 인쇄 시 제외.
 *
 * 색 매핑 (사용자 결재 §1):
 *   Q1 = var(--color-text-primary)  ← 흑/백 (기본 — 변경 없음 인지)
 *   Q2 = var(--color-accent)         ← BDR Red 강조 (사용자 결재)
 *   Q3 = var(--color-success)        ← 초록 (#1CA05E)
 *   Q4 = var(--color-warning)        ← 오렌지 (#E8A33B)
 *   OT = var(--color-primary)        ← BDR Red (5+ Overtime 통합)
 *
 * 주의:
 *   - --color-accent 와 --color-primary 는 둘 다 BDR Red 토큰 (운영 디자인 시스템).
 *     실측 시 Q2 ≈ OT 색차 미세할 수 있음 — 사용자 결재 §1 우선 적용.
 *   - Time-outs phase 색 (전반/후반/OT) 은 getTimeoutPhaseColor 별도 헬퍼.
 *
 * 절대 룰:
 *   - var(--*) 토큰만 (하드코딩 색 ❌)
 *   - 함수 1개 단일 책임 — UI 컴포넌트는 본 헬퍼만 import (단일 source).
 */

// 쿼터별 색 토큰 — period (1~7) → CSS var() 문자열
export type PeriodColorToken =
  | "var(--color-text-primary)" // Q1
  | "var(--color-accent)" // Q2
  | "var(--color-success)" // Q3
  | "var(--color-warning)" // Q4
  | "var(--color-primary)"; // OT (5+)

/**
 * period (1~7) → CSS color 변수 문자열.
 *
 * 왜: Running Score / Player Fouls / Team Fouls / Time-outs 칸 색 동적 적용.
 * 어떻게: 1~4 직접 매핑 / 5+ = OT 통합 색.
 */
export function getPeriodColor(period: number): PeriodColorToken {
  // 1 이하 (Q1) — 흑/백 기본 색 (text-primary)
  if (period <= 1) return "var(--color-text-primary)";
  if (period === 2) return "var(--color-accent)";
  if (period === 3) return "var(--color-success)";
  if (period === 4) return "var(--color-warning)";
  // 5+ = OT1, OT2, OT3, ... 모두 primary (사용자 결재 §1 — OT 통합 색)
  return "var(--color-primary)";
}

/**
 * period (1~7) → 표시 라벨 ("Q1" / "Q2" / "Q3" / "Q4" / "OT1" / "OT2" / ...).
 *
 * 왜: Legend / aria-label / tooltip 통합 라벨 단일 source.
 */
export function getPeriodLabel(period: number): string {
  if (period <= 4) return `Q${period}`;
  return `OT${period - 4}`;
}

/**
 * Time-outs phase 별 색 (전반 / 후반 / OT).
 *
 * 왜: 사용자 결재 §5 — Time-outs 마킹은 period 단위가 아닌 phase 단위.
 *   - 전반 (Q1~Q2) = text-primary (검정/흰 = 기본)
 *   - 후반 (Q3~Q4) = success (초록 — Q3 색과 통일)
 *   - OT (5+)     = primary (빨강 — OT 색과 통일)
 *
 * 어떻게: period 인자로 phase 분기.
 */
export function getTimeoutPhaseColor(period: number): PeriodColorToken {
  if (period <= 2) return "var(--color-text-primary)"; // 전반
  if (period <= 4) return "var(--color-success)"; // 후반
  return "var(--color-primary)"; // OT
}

/**
 * Legend 표시용 (한글 라벨 + 색).
 *
 * 왜: 사용자 결재 §7 — Legend 라벨 한글 (Q1·Q2·Q3·Q4·OT).
 *   period-color-legend.tsx 가 본 배열을 map 으로 렌더.
 * 어떻게: 5건 고정 (OT 는 통합 1건 — 사용자 결재 §1).
 */
export const PERIOD_LEGEND: ReadonlyArray<{
  label: string;
  color: PeriodColorToken;
}> = [
  { label: "Q1", color: "var(--color-text-primary)" },
  { label: "Q2", color: "var(--color-accent)" },
  { label: "Q3", color: "var(--color-success)" },
  { label: "Q4", color: "var(--color-warning)" },
  { label: "OT", color: "var(--color-primary)" },
] as const;
