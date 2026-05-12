/**
 * FIBA SCORESHEET Phase 17 — 쿼터별 색상 안내 Legend (2026-05-13 신규).
 *
 * 왜 (이유):
 *   Phase 17 = Running Score / Player Fouls / Team Fouls / Time-outs 마킹 색을
 *   쿼터별로 분기 (Q1~Q4 + OT). 운영자/관객이 색의 의미를 알도록 Legend 노출.
 *   사용자 결재 §6 — frame 외부 (인쇄 시 제외 가능) / §7 — 한글 라벨.
 *
 * 방법 (어떻게):
 *   - PERIOD_LEGEND (lib/score-sheet/period-color.ts) 단일 source map 으로 렌더.
 *   - 색 원 (●) + 한글 라벨 가로 배치 — 시인성 우선.
 *   - `no-print` 클래스 — _print.css 에서 인쇄 시 display:none (단 인쇄 = FIBA 정식 출력).
 *
 * 위치:
 *   - score-sheet-form.tsx 의 frame 외부 (`<div class="score-sheet-fiba-frame">` 밖).
 *   - MatchEndButton / 라인업 다시 선택 버튼 인근 (사용자 시야 안).
 *
 * 절대 룰:
 *   - var(--*) 토큰만 (period-color.ts 헬퍼 위임)
 *   - lucide-react ❌ / 인라인 SVG 또는 ● 글리프
 *   - 빨강 본문 텍스트 ❌ — Legend 라벨 글자도 Q별 색 적용은 단순 강조 (본문 X)
 */

"use client";

import { PERIOD_LEGEND } from "@/lib/score-sheet/period-color";

/**
 * PeriodColorLegend — 색상 안내 카드.
 *
 * 사용처: score-sheet-form.tsx frame 외부 (MatchEndButton 인근).
 * 인쇄 제외: `no-print` 클래스 적용 — _print.css 가 display:none 처리.
 */
export function PeriodColorLegend() {
  return (
    <div
      className="no-print mx-auto mt-3 flex w-full max-w-[820px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 py-1.5 text-xs"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
      aria-label="쿼터별 색상 안내"
    >
      <span
        className="shrink-0 font-semibold"
        style={{ color: "var(--color-text-muted)" }}
      >
        색상 안내
      </span>
      {/* 각 쿼터 = 색 원 + 한글 라벨 (사용자 결재 §7) */}
      {PERIOD_LEGEND.map((p) => (
        <span
          key={p.label}
          className="inline-flex items-center gap-1"
          aria-label={`${p.label} 색`}
        >
          {/* 색 원 — 9999px 회피 룰 = 정사각 W=H → 50% 사용 가능 (사용자 결재 §A·10).
              CLAUDE.md "정사각형(W=H) 원형은 50% 사용" 명시 룰 적용. */}
          <span
            className="inline-block h-2.5 w-2.5"
            style={{
              backgroundColor: p.color,
              borderRadius: "50%",
            }}
            aria-hidden="true"
          />
          <span
            className="text-[11px] font-semibold"
            style={{ color: p.color }}
          >
            {p.label}
          </span>
        </span>
      ))}
    </div>
  );
}
