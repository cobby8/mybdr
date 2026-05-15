/**
 * PeriodScoresSection — Period ①~④ + Extra + Final Score + Winner 자동 표시.
 *
 * 2026-05-14 — Phase 19 PR-S5 시안 시각 정합 (운영 데이터/OT 탭/OT 종료 100% 보존).
 *
 * 왜 (이유):
 *   BDR v2.5 시안 (Dev/design/BDR-current/screens/ScoreSheet.bottom.jsx SSPeriodScores +
 *   scoresheet.css L755-849) 정합 = .ss-ps + .ss-circ ① ② ③ ④ + .ss-final + .ss-winner.
 *   운영 Tailwind utility 시각 → 시안 마크업 정합 (.ss-shell 스코프 한정).
 *
 * 보존 의무 (사용자 핵심 제약):
 *   - props interface 변경 0 (form.tsx L1114-1122 호출 위치 변경 0)
 *   - sumByPeriod / computeFinalScore 변경 0 (Phase 22 룰 — paper 매치 DB 신뢰 흐름 보존)
 *   - OT 탭 (chevron_left / chevron_right) onClick 변경 0
 *   - OT 종료 빨강 버튼 onClick 변경 0
 *   - disabled / frameless prop 호환성 유지 (form.tsx 호출 호환)
 *
 * 시안 미존재 영역 (운영 그대로 보존):
 *   - OT 탭 (< OT1 > 화살표) → .ss-ot-controls wrapper 안에 운영 마크업 그대로
 *   - OT 종료 큰 빨강 버튼 → .ss-ot-controls 안 운영 마크업 그대로
 *   - 위치 = .ss-ps 표 아래 (시안 .ss-ps + .ss-final + .ss-winner 영역과 자연스러운 구분)
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만 (운영 chevron / stop_circle 유지)
 *   - 빨강 본문 텍스트 ❌ / 강조 = var(--color-accent) (운영 OT 종료 버튼만 예외)
 *   - .ss-shell 스코프 prefix — 다른 컴포넌트 미오염
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
  // Period 변경 핸들러 (운영 OT 탭 — chevron_left / chevron_right onClick)
  onAdvancePeriod?: () => void;
  onRetreatPeriod?: () => void;
  // Phase 3.5 — "쿼터 종료" 명시적 액션 (currentPeriod 이상 + toast 호출)
  onEndPeriod?: () => void;
  disabled?: boolean;
  // Phase 8 — frameless 모드. PR-S5 에서는 호환성 유지만 (시각은 .ss-shell 룰 우선)
  frameless?: boolean;
}

export function PeriodScoresSection({
  state,
  homeTeamName,
  awayTeamName,
  // PR-S10.2 (2026-05-15): onAdvancePeriod / onRetreatPeriod = props interface 호환만 유지
  //   (form.tsx 호출자 변경 0 룰). chevron 임시 버튼 제거 후 destructure 미사용.
  onAdvancePeriod: _onAdvancePeriod,
  onRetreatPeriod: _onRetreatPeriod,
  onEndPeriod,
  disabled,
  frameless: _frameless,
}: PeriodScoresSectionProps) {
  // ─────────────────────────────────────────────
  // 운영 데이터 매핑 — 변경 0 (사용자 핵심 제약)
  // ─────────────────────────────────────────────

  // Period 별 합산 — sumByPeriod 유지 (Phase 22 룰)
  const lines = sumByPeriod(state);

  // 최종 점수 + 승자 — computeFinalScore 유지
  const final = computeFinalScore(state);

  // Period 라벨 (1=Q1 / 5=OT1) — 운영 헬퍼 유지
  function periodLabel(period: number): string {
    if (period <= 4) {
      return `Q${period}`;
    }
    return `OT${period - 4}`;
  }

  // 시안 .ss-ps 표 = Q1~Q4 + "Extra periods" 5 row 고정.
  // 운영 lines 는 동적 길이 (Q1~Q4 = 항상 포함 / OT1~OT3 = 진행 시 포함).
  // → Q1~Q4 는 lines 에서 추출 / "Extra periods" = OT 영역 합산 (또는 currentPeriod OT 만)
  const lineByPeriod = new Map<number, { homePoints: number; awayPoints: number }>();
  lines.forEach((l) => {
    lineByPeriod.set(l.period, { homePoints: l.homePoints, awayPoints: l.awayPoints });
  });

  // 시안의 "Extra periods" row = OT 합산 표시.
  // 운영 합리 매핑 = 현재 진행 중인 OT 의 합산 (currentPeriod >=5 일 때).
  // 미진입 시 빈 칸 (= 마킹 없음).
  const extraPeriod =
    state.currentPeriod >= 5 ? state.currentPeriod : null;
  const extraLine = extraPeriod
    ? lineByPeriod.get(extraPeriod) ?? { homePoints: 0, awayPoints: 0 }
    : null;

  // 셀 값 포맷 — null/0/undefined 처리 (시안 fmt 박제)
  const fmt = (v: number | undefined | null): string => {
    if (v == null) return "";
    return String(v);
  };

  // Winner 결정 (운영 computeFinalScore 결과를 시안 표시 형식으로 매핑)
  const winnerName =
    final.winner === "home"
      ? homeTeamName
      : final.winner === "away"
        ? awayTeamName
        : final.winner === "tie"
          ? "동점"
          : "";

  // PR-S10.2 (2026-05-15): chevron < / > 임시 quarter ±1 버튼 제거.
  //   사용자 결정: Phase 4 QuarterEndModal 통합 후 chevron 미사용 (handleEndPeriod 가 정상 흐름).
  //   onEndPeriod (OT 종료 빨강 버튼) 만 남김. onAdvancePeriod/onRetreatPeriod props 호환만 유지 (call site 호환).
  const hasOtControls = !!onEndPeriod;

  return (
    // ss-shell 스코프 — 본 컴포넌트 outermost 한정 (PR-S4 와 동일 패턴)
    <section className="ss-shell ss-ps-section">
      {/* ─────────────────────────────────────────────
          시안 .ss-ps 표 — Period 5 row (Q1~Q4 + Extra)
          ───────────────────────────────────────────── */}
      {/* PR-S8 (2026-05-15 rev2) — 라벨 = .pap-lbl, value = .ss-ps__val + .pap-u 병행 (시안 정합).
          rev2 ScoreSheet.bottom.jsx L114~115 / L129~140 정합. */}
      <div className="ss-ps">
        {/* Q1 row — 시안 grid 90 / 60 / 1fr / 30 / 1fr */}
        <div className="ss-ps__row">
          <span className="ss-ps__title pap-lbl">Scores</span>
          {/* PR-S9 (2026-05-15) — data-q 속성 dead 정리. PR-S7 토큰 단순화 후 매칭 CSS 룰 0건
              (.ss-circ 단일 흑색 통일) — HTML 의미 0 → 제거. 시각 / 동작 영향 0. */}
          <span className="ss-ps__period pap-lbl">
            <span className="ss-circ">①</span>Period
          </span>
          <span className="ss-ps__val pap-u">
            A&nbsp;&nbsp;{fmt(lineByPeriod.get(1)?.homePoints)}
          </span>
          <span></span>
          <span className="ss-ps__val pap-u">
            B&nbsp;&nbsp;{fmt(lineByPeriod.get(1)?.awayPoints)}
          </span>
        </div>

        {/* Q2 row */}
        <div className="ss-ps__row">
          <span></span>
          <span className="ss-ps__period pap-lbl">
            <span className="ss-circ">②</span>Period
          </span>
          <span className="ss-ps__val pap-u">
            A&nbsp;&nbsp;{fmt(lineByPeriod.get(2)?.homePoints)}
          </span>
          <span></span>
          <span className="ss-ps__val pap-u">
            B&nbsp;&nbsp;{fmt(lineByPeriod.get(2)?.awayPoints)}
          </span>
        </div>

        {/* Q3 row */}
        <div className="ss-ps__row">
          <span></span>
          <span className="ss-ps__period pap-lbl">
            <span className="ss-circ">③</span>Period
          </span>
          <span className="ss-ps__val pap-u">
            A&nbsp;&nbsp;{fmt(lineByPeriod.get(3)?.homePoints)}
          </span>
          <span></span>
          <span className="ss-ps__val pap-u">
            B&nbsp;&nbsp;{fmt(lineByPeriod.get(3)?.awayPoints)}
          </span>
        </div>

        {/* Q4 row */}
        <div className="ss-ps__row">
          <span></span>
          <span className="ss-ps__period pap-lbl">
            <span className="ss-circ">④</span>Period
          </span>
          <span className="ss-ps__val pap-u">
            A&nbsp;&nbsp;{fmt(lineByPeriod.get(4)?.homePoints)}
          </span>
          <span></span>
          <span className="ss-ps__val pap-u">
            B&nbsp;&nbsp;{fmt(lineByPeriod.get(4)?.awayPoints)}
          </span>
        </div>

        {/* Extra periods row — 시안 단일 row / 운영 = 현재 진행 OT 합산 */}
        <div className="ss-ps__row">
          <span></span>
          <span className="ss-ps__period pap-lbl">
            Extra periods{extraPeriod ? ` (${periodLabel(extraPeriod)})` : ""}
          </span>
          <span className="ss-ps__val pap-u">
            A&nbsp;&nbsp;{fmt(extraLine?.homePoints)}
          </span>
          <span></span>
          <span className="ss-ps__val pap-u">
            B&nbsp;&nbsp;{fmt(extraLine?.awayPoints)}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          시안 .ss-final — Final Score 박스
          ───────────────────────────────────────────── */}
      <div className="ss-final">
        <div className="ss-final__row">
          <span className="ss-ps__title pap-lbl">Final Score</span>
          <span className="ss-ps__teamlabel pap-lbl" title={homeTeamName}>
            Team A
          </span>
          <span className="ss-ps__val pap-u">
            {final.homeTotal || ""}
          </span>
          <span className="ss-ps__teamlabel pap-lbl" title={awayTeamName}>
            Team B
          </span>
          <span className="ss-ps__val pap-u">
            {final.awayTotal || ""}
          </span>
        </div>

        {/* 시안 .ss-winner — Winner 박스 (underscore 라인 / 자동 채움) */}
        <div className="ss-winner">
          <label className="pap-lbl">Name of winning team</label>
          <div
            className="ss-winner__v pap-u"
            title={winnerName || undefined}
          >
            {winnerName}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          OT 탭 + OT 종료 버튼 — 시안 미존재 / 운영 그대로 보존
          (위치만 .ss-ps 영역 아래로 배치 — JSX 구조 조정만)
          ───────────────────────────────────────────── */}
      {hasOtControls && (
        <div className="ss-ot-controls">
          {/* PR-S10.2 (2026-05-15): chevron < OT1 > 임시 버튼 영역 제거.
              사유: handleAdvancePeriod / handleRetreatPeriod = Phase 4 통합 전 임시.
              실제 quarter 종료 흐름 = onEndPeriod (handleEndPeriod) 가 담당.
              레이아웃 깔끔화 + 우하단 정합 회복. */}

          {/* OT 종료 큰 빨강 버튼 — onClick 그대로 보존 (운영 BFF 트리거) */}
          {onEndPeriod && (
            <div className="mt-2">
              <button
                type="button"
                onClick={onEndPeriod}
                // PR-Stat3.7 (2026-05-15) — OT max 7 → 9 (사용자 명시: OT5 까지 cell 확장 — PR-Stat3.6 정합).
                //   OT5 진입 (currentPeriod=9) 후 종료 클릭 = 더 진행 불가 → 비활성화. OT3/OT4 = 활성.
                disabled={disabled || state.currentPeriod >= 9}
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
      )}
    </section>
  );
}
