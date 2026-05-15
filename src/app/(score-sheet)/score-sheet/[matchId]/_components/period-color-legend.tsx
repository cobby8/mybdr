/**
 * FIBA SCORESHEET Phase 17 — 쿼터별 색상 안내 Legend (2026-05-13 신규).
 * Phase 18 (2026-05-13) — 점수 표기 안내 (·/●/●+○) 영역 추가.
 *
 * 왜 (이유):
 *   Phase 17 = Running Score / Player Fouls / Team Fouls / Time-outs 마킹 색을
 *   쿼터별로 분기 (Q1~Q4 + OT). 운영자/관객이 색의 의미를 알도록 Legend 노출.
 *   사용자 결재 §6 — frame 외부 (인쇄 시 제외 가능) / §7 — 한글 라벨.
 *
 *   Phase 18 (사용자 결재 §3 / 이미지 43-44):
 *     - FIBA 표준 1/2/3점 시각 표기 (· / ● / ●+○) 안내 추가
 *     - "색상 안내" + "점수 표기" 2영역 가로 묶음 (반응형 wrap)
 *
 * 방법 (어떻게):
 *   - PERIOD_LEGEND (lib/score-sheet/period-color.ts) 단일 source map 으로 렌더.
 *   - 색 원 (●) + 한글 라벨 가로 배치 — 시인성 우선.
 *   - 점수 표기 = 1점·2점·3점 아이콘 + 라벨 (점/●/●+○) 가로 배치.
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
 * PeriodColorLegend — 색상 + 점수 표기 안내 카드.
 *
 * 사용처: score-sheet-form.tsx frame 외부 (MatchEndButton 인근).
 * 인쇄 제외: `no-print` 클래스 적용 — _print.css 가 display:none 처리.
 */
/**
 * 2026-05-15 (PR-SS-54) — `inline` prop 신규.
 *   - false (default) = 기존 박스 형태 (border + flex-col, frame 외부 단독 박스)
 *   - true = toolbar 중앙 inline 모드 — border 0 + flex-row (2개 row → 1 row 통합 wrap 허용)
 *     사용자 요청 "헤더의 중앙 빈 영역에 배치".
 */
interface PeriodColorLegendProps {
  inline?: boolean;
}

export function PeriodColorLegend({ inline = false }: PeriodColorLegendProps) {
  // inline 모드 = toolbar 중앙 (수평) — 박스 / max-width 제거, 작은 폰트로 압축
  if (inline) {
    return (
      <div
        className="no-print flex flex-1 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-1 text-[10px]"
        aria-label="쿼터 색상 + 점수 표기 안내"
      >
        {/* 색상 안내 (inline) — 라벨 + Q1~Q4 */}
        <span className="inline-flex flex-wrap items-center gap-x-2">
          <span className="shrink-0 font-semibold" style={{ color: "var(--color-text-muted)" }}>
            색상
          </span>
          {PERIOD_LEGEND.map((p) => (
            <span key={p.label} className="inline-flex items-center gap-0.5" aria-label={`${p.label} 색`}>
              <span
                className="inline-block h-2 w-2"
                style={{ backgroundColor: p.color, borderRadius: "50%" }}
                aria-hidden="true"
              />
              <span className="text-[10px] font-semibold" style={{ color: p.color }}>
                {p.label}
              </span>
            </span>
          ))}
        </span>
        {/* 점수 표기 (inline) */}
        <span
          className="inline-flex flex-wrap items-center gap-x-2"
          style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: 8, marginLeft: 4 }}
        >
          <span className="shrink-0 font-semibold" style={{ color: "var(--color-text-muted)" }}>
            점수
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span style={{ fontSize: 14, lineHeight: 1 }}>·</span>
            <span className="text-[10px]">=1점</span>
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span style={{ fontSize: 10, lineHeight: 1 }}>●</span>
            <span className="text-[10px]">=2점</span>
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span style={{ fontSize: 10, lineHeight: 1 }}>◉</span>
            <span className="text-[10px]">=3점</span>
          </span>
        </span>
      </div>
    );
  }

  // 기존 박스 모드 (form 외부 fallback — 다른 사용처 호환)
  return (
    <div
      className="no-print mx-auto flex w-full max-w-[794px] flex-col gap-y-1.5 px-2 py-1.5 text-xs"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderTop: "none",
      }}
      aria-label="쿼터 색상 + 점수 표기 안내"
    >
      {/* (1) 쿼터별 색상 안내 — Phase 17 유지 */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
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

      {/* (2) 점수 표기 안내 — Phase 18 신규 (FIBA 정합 1/2/3점) */}
      <div
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
        style={{
          borderTop: "1px solid var(--color-border)",
          paddingTop: "4px",
        }}
      >
        <span
          className="shrink-0 font-semibold"
          style={{ color: "var(--color-text-muted)" }}
        >
          점수 표기
        </span>
        {/* 1점 = · (작은 점) */}
        <span className="inline-flex items-center gap-1" aria-label="1점 표기">
          <span
            className="inline-flex h-3 w-3 items-center justify-center leading-none"
            style={{ color: "var(--color-text-primary)", fontSize: "14px" }}
            aria-hidden="true"
          >
            ·
          </span>
          <span
            className="text-[11px] font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            = 1점 (자유투)
          </span>
        </span>
        {/* 2점 = ● */}
        <span className="inline-flex items-center gap-1" aria-label="2점 표기">
          <span
            className="inline-flex h-3 w-3 items-center justify-center leading-none"
            style={{ color: "var(--color-text-primary)", fontSize: "10px" }}
            aria-hidden="true"
          >
            ●
          </span>
          <span
            className="text-[11px] font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            = 2점
          </span>
        </span>
        {/* 3점 = ●+외곽 ○ */}
        <span className="inline-flex items-center gap-1" aria-label="3점 표기">
          <span
            className="relative inline-flex h-3 w-3 items-center justify-center"
            style={{
              borderRadius: "50%", // 정사각 W=H 룰
              border: "1px solid var(--color-text-primary)",
            }}
            aria-hidden="true"
          >
            <span
              className="leading-none"
              style={{
                color: "var(--color-text-primary)",
                fontSize: "8px",
              }}
            >
              ●
            </span>
          </span>
          <span
            className="text-[11px] font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            = 3점
          </span>
        </span>
      </div>
    </div>
  );
}
