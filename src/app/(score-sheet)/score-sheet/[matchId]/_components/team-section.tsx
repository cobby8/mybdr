/**
 * FIBA SCORESHEET TeamSection — Team A 또는 B 의 좌 절반 영역 박제.
 *
 * 2026-05-11 — Phase 1 신규 (planner-architect §작업 4).
 * 2026-05-12 — Phase 10 정밀 디자인 fix (사용자 결재 §B·§C·§E·§F·§G).
 *   §B 헤더 = "Team A ____슬로우____" underscore (큰 박스 폐기)
 *   §C Players 15행 (12 → 15 / FIBA 종이기록지 표준)
 *   §E Time-outs 빈 박스 + 마킹 시 X 글자 (검정 ● 폐기)
 *   §F Team fouls 1·2·3·4 빈 박스 (라벨 폐기 / 마킹 시 검정 채움)
 *   §G Player Fouls 1-5 빈 박스 (라벨 폐기 / 마킹 시 P/T/U/D 글자만)
 *
 * 2026-05-12 — Phase 11 미세 fix (reviewer 12 차이 정합).
 *   §1 Team fouls 박스 안 1·2·3·4 라벨 복원 (FIBA 정합 — Phase 10 §F 회귀 fix)
 *   §2 Players 15 → 16행 (FIBA 표준 16행 / fillRowsTo15 → fillRowsTo16)
 *   행 높이 22 → 20px (16행 × 20 = 320px / A4 1 페이지 fit 보장)
 *
 * 2026-05-12 — Phase 12 사용자 직접 결재 (이미지 29 분석).
 *   §1 Players 16 → 12행 (사용자 직접 요구 / FIBA Article 4.2.2 실 운영 max)
 *      fillRowsTo16 → fillRowsTo12 / 12 × 20 = 240px (-80px 절약)
 *   §2 Team Fouls 5줄 → 3줄 (FIBA PDF 정합 — Period ①·② / Period ③·④ / Extra)
 *      Period 1+2 가로 한 줄 / Period 3+4 가로 한 줄 / Extra 단독 한 줄
 *   §3 세로 압축 누적 — 좌측 총합 ~991px (A4 1123 여유 ~132px 확보)
 *
 * 2026-05-12 — Phase 13 UI 겹침 fix + 압축 (이미지 30-31 사용자 직접 결재).
 *   §1 TIME-OUTS 가로 6칸 → 2×N grid (2 컬럼 동적 배치) — 가로 공간 확보
 *   §2 Team Fouls 박스 width 12→9px (P2 라벨/2FT 안내 겹침 fix)
 *   §3 체크박스 P IN + FOULS 1-5 = 24→18px (시각 압축)
 *   §4 Players 행 높이 20 → 18px (12 × 18 = 216px / -24px 추가 절약)
 *   §5 A4 fit 재검증 — 좌측 총합 ~931px (여유 ~192px 확보)
 *
 * 2026-05-12 — Phase 14 A4 정확 비율 + Time-outs 재배치 (이미지 32-33 사용자 직접 결재).
 *   §1 TIME-OUTS 2×N → 3×2 grid (FIBA 정합 / 6 고정 칸)
 *      이유: 이전 Phase 13 2 컬럼 = 마지막 빈 칸 발생 + 시각적 불균형.
 *        FIBA 종이기록지 표준 = 3×2 6칸 (전반 2 + 후반 3 + 여유 1).
 *      grid-cols-3 × 2 row = 6 고정 / OT 진입 시 7~8 번째 칸은 자동 행 확장.
 *   §4 요소비율 통일 — 박스 18px / 폰트 라벨 9px / 데이터 11px 일관 검증.
 *   §5 A4 정확 비율은 _print.css aspect-ratio 강제 (본 컴포넌트 외부).
 *
 * 왜 (이유):
 *   FIBA 양식 좌 절반 = Team A 상 / Team B 하 분할. 각 팀 영역 안에
 *   Time-outs (5칸) + Team fouls (Period 별 1-4 + Extra) + Players 15명
 *   (Licence / 선수명 / No / Player in / Fouls 1-5) + Coach·Asst Coach 입력.
 *   Phase 10 범위 = FIBA 종이기록지와 완벽 정합 (사용자 결재 7건 fix).
 *
 * 방법 (어떻게):
 *   - Players 12 행 (사전 라인업 + TTP fallback 데이터 그대로):
 *       Licence no. (text input) / 선수명 (read-only) / 등번호 (read-only)
 *       Player in 체크 (출전 여부) / Fouls 1-5 (Phase 3 골조 placeholder)
 *   - Coach / Asst Coach (text input) — settings.coaches JSON 박제 예정 (Phase 5)
 *   - Time-outs 5칸 박스 (Phase 4 placeholder — read-only 격자)
 *   - Team fouls Period ①~④ × 1-2-3-4 + Extra 박스 (Phase 3 placeholder — read-only 격자)
 *
 * 터치 최적화:
 *   - Player in 체크 영역 = 44px+ (row 전체 클릭 가능)
 *   - input 패딩 충분 (px-2 py-2)
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ — 강조는 var(--color-accent)
 *   - 입력 = border-bottom only (FIBA underscore 정합)
 */

"use client";

import type { ChangeEvent } from "react";
import type { RosterItem } from "./team-section-types";
import type { FoulMark, FoulType } from "@/lib/score-sheet/foul-types";
import {
  getPlayerFoulCount,
  getTeamFoulCountByPeriod,
  getEjectionReason,
} from "@/lib/score-sheet/foul-helpers";
import type { TimeoutMark } from "@/lib/score-sheet/timeout-types";
import {
  getGamePhase,
  getUsedTimeouts,
  isCellActive,
} from "@/lib/score-sheet/timeout-helpers";
import {
  getPeriodColor,
  getTimeoutPhaseColor,
} from "@/lib/score-sheet/period-color";
// Phase 19 PR-Stat2 (2026-05-15) — 6 stat (OR/DR/A/S/B/TO) 표시용.
//   사용자 결재 Q1 = P.IN 직후 + Fouls 직전 위치 (FIBA 박스스코어 표준 순서).
//   stat 추가/제거 = StatPopover 가 처리 (caller 가 onRequestOpenStatPopover 위임).
import type {
  PlayerStatsState,
  StatKey,
} from "@/lib/score-sheet/player-stats-types";
import { STAT_KEYS } from "@/lib/score-sheet/player-stats-types";
import { getStat } from "@/lib/score-sheet/player-stats-helpers";

// Phase 3.5 — 파울 종류별 글자 색상 (P=text-primary / T=warning / U=accent / D=primary)
// 이유: P/T/U/D 약자를 칸 안에 직접 표시 — 종류별 색 차이로 한눈에 인지.
//   D = primary 빨강 (위험 액션 = 빨강 예외 허용 / 본문 텍스트 X)
//
// Phase 17 (2026-05-13) — Player Fouls 하이브리드 변경:
//   - 글자 색 = Q별 색 (getPeriodColor(period)) — 본 FOUL_TYPE_COLOR 는 미사용으로 전환.
//   - 배경 색 = 종류별 옅은 색 (FOUL_TYPE_BG_COLOR 신규) — 본 표는 보존 (회귀 안전망 + 비교용).
const FOUL_TYPE_COLOR: Record<FoulType, string> = {
  P: "var(--color-text-primary)",
  T: "var(--color-warning)",
  U: "var(--color-accent)",
  D: "var(--color-primary)",
};

// Phase 17 (2026-05-13) — Player Fouls 박스 배경 색 (종류 P/T/U/D).
// 이유: 하이브리드 (글자=Q별 / 배경=종류) — 사용자 결재 §3 / 이미지 14:00 KST.
//   배경 = 옅은 톤 (color-mix 15% transparent) — 본문 텍스트는 글자 (Q색) 가독성 우선.
//   - P (Personal)        = 흰/투명 (가장 흔함 = 기본)
//   - T (Technical)       = 노랑 옅게 (warning 15%)
//   - U (Unsportsmanlike) = 하늘 옅게 (info 15% — 빨강 회피 / 빨강 본문 룰 준수)
//   - D (Disqualifying)   = 빨강 옅게 (primary 15% — 위험 강조 예외 허용)
const FOUL_TYPE_BG_COLOR: Record<FoulType, string> = {
  P: "transparent",
  T: "color-mix(in srgb, var(--color-warning) 15%, transparent)",
  U: "color-mix(in srgb, var(--color-info) 15%, transparent)",
  D: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
};

export interface TeamSectionPlayerState {
  // 키 = tournamentTeamPlayerId (string)
  // Phase 3.5 — licence 필드는 더 이상 사용자 입력 X (User.id 자동 fill).
  //   draft 호환 위해 필드 유지하되 UI 에서 미노출.
  licence: string;
  playerIn: boolean; // 출전 여부 마킹
  // Phase 3 — fouls 는 FoulsState (props.fouls) 로 분리. 본 state 에는 미포함.
}

export interface TeamSectionInputs {
  // 팀 전역 입력
  coach: string;
  asstCoach: string;
  // 선수별 상태 (TTP id → state)
  players: Record<string, TeamSectionPlayerState>;
}

interface TeamSectionProps {
  sideLabel: "Team A" | "Team B";
  teamName: string;
  players: RosterItem[]; // 사전 라인업 + TTP fallback (server prop)
  values: TeamSectionInputs;
  onChange: (next: TeamSectionInputs) => void;
  disabled?: boolean;
  // Phase 23 PR-RO1 (2026-05-15) — read-only 차단 (사용자 결재 Q2 — 종료 매치 input 차단).
  //   왜: input (coach/asstCoach + checkbox) 는 readOnly / button (foul/timeout/stat cell) 는 disabled.
  //   호출자 미전달 (= undefined) 시 동작 변경 0 (운영 보존).
  readOnly?: boolean;
  // Phase 3 — 파울 상태 (이 팀 전용 FoulMark[] — home/away 한쪽만 전달)
  fouls: FoulMark[];
  // Phase 3.5 — 파울 추가 요청 (다음 빈 칸 클릭) — caller 가 FoulTypeModal open 처리
  //   - 모달에서 종류 선택 후 caller 가 addFoul 호출
  onRequestAddFoul: (playerId: string) => void;
  // Phase 3.5 — 파울 마지막 1건 해제 (마지막 마킹 칸 클릭)
  onRequestRemoveFoul: (playerId: string) => void;
  // 현재 진행 Period (Player Fouls 마킹 시점 기록용 — Running Score 와 같은 값)
  currentPeriod: number;
  // Phase 4 — Time-outs 상태 (이 팀 전용 TimeoutMark[])
  timeouts: TimeoutMark[];
  // Phase 4 — 타임아웃 추가 요청 (빈 칸 클릭) — caller 가 Article 18-19 검증 + 마킹
  onRequestAddTimeout: () => void;
  // Phase 4 — 타임아웃 마지막 1건 해제 (마지막 마킹 칸 클릭)
  onRequestRemoveTimeout: () => void;
  // Phase 19 PR-Stat2 (2026-05-15) — 6 stat (OR/DR/A/S/B/TO) wiring.
  //   playerStats = 양 팀 통합 단일 record (TeamSection 은 자신의 player id 만 lookup).
  //   onRequestOpenStatPopover = stat cell 클릭 시 StatPopover open 위임 (form 이 +1/-1 처리).
  playerStats: PlayerStatsState;
  onRequestOpenStatPopover: (playerId: string, statKey: StatKey) => void;
  // Phase 8 — frameless 모드. 단일 외곽 박스 안에서 자체 border 제거.
  frameless?: boolean;
}

/**
 * 12 행을 보장하는 헬퍼 — 실제 명단이 12 미만이면 빈 row 채워서 FIBA 양식 정합.
 * Phase 12 (2026-05-12) — 16 → 12 (사용자 직접 요구 / FIBA Article 4.2.2 실 운영 max 12명).
 * 명단이 12 초과면 그대로 표시 (운영 안정성 우선 — 잘라내지 X).
 */
export function fillRowsTo12(players: RosterItem[]): (RosterItem | null)[] {
  const TARGET = 12; // FIBA Article 4.2.2 / 실제 운영 max
  const rows: (RosterItem | null)[] = [...players];
  while (rows.length < TARGET) {
    rows.push(null);
  }
  return rows;
}

/**
 * @deprecated Phase 12 (2026-05-12) — `fillRowsTo12` 사용. alias 유지 = 구버전 호출자 회귀 안전망.
 * Phase 11 = 16행 → Phase 12 = 12행 (단일 source: fillRowsTo12).
 */
export const fillRowsTo16 = fillRowsTo12;

/**
 * @deprecated Phase 12 (2026-05-12) — `fillRowsTo12` 사용. alias 유지 = 구버전 호출자 회귀 안전망.
 * Phase 10 = 15행 → Phase 11 = 16행 → Phase 12 = 12행 (단일 source: fillRowsTo12).
 */
export const fillRowsTo15 = fillRowsTo12;

export function TeamSection({
  sideLabel,
  teamName,
  players,
  values,
  onChange,
  disabled,
  // Phase 23 PR-RO1 (2026-05-15) — input readOnly wiring (종료 매치 차단 / 사용자 결재 Q2)
  readOnly,
  fouls,
  onRequestAddFoul,
  onRequestRemoveFoul,
  currentPeriod,
  timeouts,
  onRequestAddTimeout,
  onRequestRemoveTimeout,
  // Phase 19 PR-Stat2 (2026-05-15) — 6 stat wiring (사용자 결재 Q1 / FIBA 박스스코어 표준 순서)
  playerStats,
  onRequestOpenStatPopover,
  // PR-S6 (2026-05-15 rev2) — frameless prop = 보존 (props interface 변경 0 / 사용자 핵심 제약 #1).
  // 시안 .ss-shell.ss-tbox 가 자체 border 보유 = 항상 frameless 동일 시각. caller form.tsx 가 전달하지만 본 컴포넌트에서는 무시.
  frameless: _framelessUnused,
}: TeamSectionProps) {
  // frameless 미사용 경고 회피 + 의도된 미사용임을 명시
  void _framelessUnused;
  // 선수 행 (12 보장 — Phase 12 사용자 직접 결재 / FIBA Article 4.2.2 실 운영 max 12명)
  const rows = fillRowsTo12(players);

  // 선수별 state 갱신 helper
  const updatePlayer = (
    playerId: string,
    patch: Partial<TeamSectionPlayerState>
  ) => {
    const prev = values.players[playerId] ?? {
      licence: "",
      playerIn: false,
    };
    onChange({
      ...values,
      players: {
        ...values.players,
        [playerId]: { ...prev, ...patch },
      },
    });
  };

  // Coach / Asst Coach 갱신
  const updateCoach =
    (key: "coach" | "asstCoach") => (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...values, [key]: e.target.value });
    };

  // Phase 19 PR-S6 (2026-05-15 rev2) — 시안 .ss-shell.ss-tbox outermost wrapper.
  //   왜: 시안 ScoreSheet.parts.jsx SSTeamBox 의 `.ss-tbox` 마크업 정합 + .ss-shell 스코프 안에서
  //       _score-sheet-styles.css 의 .ss-tbox* 룰 적용. frameless prop = 운영 호환 (기본 frameless 유지 — wrap 부모가 단일 외곽 박스).
  //   운영 동작 보존: props interface 변경 0 / onClick 변경 0 / Phase 17 쿼터별 색 inline style 그대로 wiring.
  return (
    <section className="ss-shell ss-tbox" aria-label={`${sideLabel} ${teamName}`}>
      {/* §1 Head — Team A / Team B name strip (시안 .ss-tbox__head + .pap-lbl + .pap-u) */}
      <div className="ss-tbox__head">
        <label className="pap-lbl">{sideLabel}</label>
        <span className="pap-u" title={teamName}>
          {teamName || " "}
        </span>
      </div>

      {/* §2 Time-outs + Team fouls 블록 (시안 .ss-tbox__tt grid 92px | 1fr).
          왜: 시안 rev2 = FIBA 종이 2+3+2 = 7 cells (전반 2 / 후반 3 / OT 2).
          운영 동작 보존:
            - timeouts state / onRequestAddTimeout / onRequestRemoveTimeout 그대로
            - Phase 17 쿼터별 색 = getTimeoutPhaseColor(timeouts[i].period) inline style 으로 wiring */}
      <div className="ss-tbox__tt">
        {/* 좌측 — Time-outs (시안 SSTimeoutCells 2+3+2 = 7 cells) */}
        <div className="ss-tbox__to">
          <div className="ss-tbox__to-label">Time-outs</div>
          {/* 시안: 1행 2 + 2행 3 + 3행 2 = 총 7 cells.
              운영 OT 진입 시 currentPeriod >= 5 면 추가 row 동적 확장 (FIBA 다중 OT 대응). */}
          {(() => {
            // PR-Stat3.6 (2026-05-15) — OT cell 동적 확장 (사용자 명시 — 최대 5 OT slots / cell 5~9).
            //   기본 7 cells (전반 2 + 후반 3 + OT 2). currentPeriod ≥ 5 시 OT slot = currentPeriod - 4 (최대 5).
            //   timeouts.length 가 더 크면 그것 우선 (재진입 자동 로드 시 OT 다중 박제 케이스).
            const otSlots = Math.max(2, Math.min(currentPeriod - 4, 5));
            const baseCells = 5 + otSlots;
            const totalCells = Math.max(
              baseCells,
              timeouts.length > 5 ? 5 + Math.max(2, timeouts.length - 5) : 7,
            );
            // row 분할 — 시안 정합 2+3 + OT row 가변 (cell 5~9 한 row 묶음 / 사용자 결정).
            const otCells: number[] = [];
            for (let i = 5; i < totalCells; i += 1) otCells.push(i);
            const toRows: number[][] = [[0, 1], [2, 3, 4], otCells];

            // PR-Stat3.3 (2026-05-15) — phase 별 cell idx 매핑.
            // PR-Stat3.6 (2026-05-15) — OT cell ↔ period 1:1 매핑 (사용자 명시 — B팀 OT2 cell 동작 안 함).
            //   원인: 기존 OT phase position 매핑 = cell 5(OT1) 미사용 시 cell 6 positionInPhase=1 ≠ phaseUsed=0 → 클릭 불가.
            //   수정: cell N (>=5) = period N 1:1 (cell 5=OT1=period 5 / cell 6=OT2=period 6 / cell 9=OT5=period 9).
            //   전반/후반 cell = 기존 phase position 매핑 그대로 (순차 채움).
            const firstHalfTimeouts = timeouts.filter((t) => t.period <= 2);
            const secondHalfTimeouts = timeouts.filter(
              (t) => t.period === 3 || t.period === 4,
            );
            const overtimeTimeouts = timeouts.filter((t) => t.period >= 5);
            // OT 마지막 박제 period — isLastFilled 결정 (가장 큰 period 의 cell 만 해제 가능)
            const lastOtPeriod =
              overtimeTimeouts.length > 0
                ? Math.max(...overtimeTimeouts.map((t) => t.period))
                : -1;

            const renderCell = (i: number) => {
              let filled: boolean;
              let isLastFilled: boolean;
              let isNextEmpty: boolean;
              let cellTimeout: { period: number } | null;

              if (i >= 5) {
                // OT cell: cell N = period N 1:1 매핑 (사용자 결재 Q1 시안 OT 2 cell + OT3+ 동적 확장)
                const cellPeriod = i;
                cellTimeout =
                  overtimeTimeouts.find((t) => t.period === cellPeriod) ?? null;
                filled = !!cellTimeout;
                isLastFilled = filled && cellPeriod === lastOtPeriod;
                isNextEmpty = !filled && cellPeriod === currentPeriod;
              } else {
                // 전반/후반 cell: phase position 매핑 (순차 채움)
                const phaseStart = i < 2 ? 0 : 2;
                const positionInPhase = i - phaseStart;
                const phaseTimeouts =
                  i < 2 ? firstHalfTimeouts : secondHalfTimeouts;
                const phaseUsed = phaseTimeouts.length;
                filled = positionInPhase < phaseUsed;
                cellTimeout = filled ? phaseTimeouts[positionInPhase] : null;
                isLastFilled = filled && positionInPhase === phaseUsed - 1;
                isNextEmpty = !filled && positionInPhase === phaseUsed;
              }
              // 칸 라벨 — 위치별 phase 안내 (PR-Stat3.6 — OT 1:1 매핑 후).
              //   cell 5/6/7/8/9 = OT1/OT2/OT3/OT4/OT5 (cell idx - 4 = OT 번호).
              const cellLabel = cellTimeout
                ? `Period ${cellTimeout.period} 타임아웃`
                : i < 2
                  ? `전반 타임아웃 ${i + 1}`
                  : i < 5
                    ? `후반 타임아웃 ${i - 1}`
                    : `OT${i - 4} 타임아웃`;
              // Phase 17 — 마킹 색 = phase 별 색.
              const markColor = cellTimeout
                ? getTimeoutPhaseColor(cellTimeout.period)
                : undefined;
              // Phase 19 PR-T2 (2026-05-15) — cell 위치 phase 와 현재 period phase 불일치 시 비활성.
              //   왜: 시안 7 cells (전반 2 / 후반 3 / OT 2) 정합 — 다른 phase cell 은 시각 회색 + 클릭 차단.
              //   AND 가드: 기존 (filled / empty) 로직 보존 + cell phase 불일치 시 추가 차단.
              //   isCellActive(i, currentPeriod) === false → 시각 disabled (data-disabled-phase="true").
              const cellActive = isCellActive(i, currentPeriod);
              return (
                <button
                  key={i}
                  type="button"
                  className="ss-tbox__to-cell"
                  data-used={filled ? "true" : "false"}
                  // Phase 19 PR-T2 — 다른 phase cell 시각 차단 속성 (CSS opacity 0.5 + cursor not-allowed 트리거).
                  //   filled cell 은 회귀 보존 (이미 마킹된 cell 은 phase 무관 해제 가능 — isLastFilled 분기 유지).
                  data-disabled-phase={!cellActive && !filled ? "true" : "false"}
                  onClick={() => {
                    if (disabled) return;
                    if (isLastFilled) {
                      onRequestRemoveTimeout();
                    } else if (isNextEmpty && cellActive) {
                      // Phase 19 PR-T2 — cell phase 일치 시에만 추가 허용 (AND 가드).
                      onRequestAddTimeout();
                    }
                  }}
                  disabled={
                    disabled ||
                    (!isLastFilled && !isNextEmpty) ||
                    // Phase 19 PR-T2 — 빈 cell 이면서 phase 불일치 = 비활성.
                    //   isLastFilled (마킹된 마지막) = phase 무관 해제 허용 (운영 보존).
                    (!isLastFilled && !cellActive)
                  }
                  // Phase 17 색 wiring — inline style 로 CSS 토큰 색을 override.
                  //   filled 시 markColor 가 배경 결정 (CSS 룰의 data-used color #FFFFFF 그대로).
                  // PR-S9 (2026-05-15) — color: "#FFFFFF" inline 제거.
                  //   CSS 룰 .ss-tbox__to-cell[data-used="true"] { color: #FFFFFF } 가 이미 박제 →
                  //   inline 중복 안전망 정리. backgroundColor 만 inline 으로 Phase 17 색 wiring.
                  style={
                    filled
                      ? {
                          backgroundColor: markColor,
                        }
                      : undefined
                  }
                  aria-label={
                    filled
                      ? `${cellLabel} 마킹됨${isLastFilled ? " (클릭 시 해제)" : ""}`
                      : `${cellLabel} 빈 칸${isNextEmpty ? " (클릭 시 마킹)" : ""}`
                  }
                  title={cellLabel}
                >
                  {filled ? "X" : ""}
                </button>
              );
            };

            return (
              <div className="ss-tbox__to-grid">
                {toRows.map((row, rIdx) => (
                  <div key={rIdx} className="ss-tbox__to-row">
                    {row.map((i) => renderCell(i))}
                  </div>
                ))}
              </div>
            );
          })()}
          {/* phase 안내 (운영자 잔여 인지) — Time-outs 좌측 영역 안 ss-tbox__to-label 옆 */}
          {(() => {
            const phase = getGamePhase(currentPeriod);
            const used = getUsedTimeouts(
              timeouts,
              phase,
              phase === "overtime" ? currentPeriod : undefined
            );
            const max =
              phase === "first_half" ? 2 : phase === "second_half" ? 3 : 1;
            const phaseLabel =
              phase === "first_half"
                ? "전반"
                : phase === "second_half"
                  ? "후반"
                  : `OT${currentPeriod - 4}`;
            return (
              <div
                className="text-[8px]"
                style={{ color: "var(--pap-hair)" }}
                aria-live="polite"
              >
                {phaseLabel} {used}/{max}
              </div>
            );
          })()}
        </div>

        {/* 우측 — Team fouls (시안 SSTeamFouls 3 line — Period ①② / ③④ / Extra).
            운영 보존: getTeamFoulCountByPeriod / 5+ FT 안내 / Phase 17 쿼터별 색 모두 그대로 wiring. */}
        <div className="ss-tbox__tf">
          <div className="ss-tbox__tf-label">Team fouls</div>
          {/* line 1 — Period ① ② */}
          <div className="ss-tbox__tf-line">
            <span className="ss-tbox__tf-pname">Period</span>
            {([1, 2] as const).map((period) => {
              const teamCount = getTeamFoulCountByPeriod(fouls, period);
              const ftAwarded = teamCount >= 5;
              const periodFillColor = getPeriodColor(period);
              return (
                <div key={period} className="ss-tbox__tf-q">
                  <span className="ss-tbox__tf-qnum">
                    {period === 1 ? "①" : "②"}
                  </span>
                  <div className="ss-tbox__tf-cells">
                    {[1, 2, 3, 4].map((n) => {
                      const filled = teamCount >= n;
                      const isBonus = filled && teamCount >= 5 && n === 4;
                      return (
                        <div
                          key={n}
                          className="ss-tbox__tf-cell"
                          data-on={filled ? "true" : "false"}
                          data-bonus={isBonus ? "true" : "false"}
                          // Phase 17 쿼터별 색 wiring — filled 시 periodFillColor 로 배경 override.
                          //   bonus (5+) 면 BDR Red (var(--pap-bonus)) 가 CSS 룰에서 적용 → inline 미설정.
                          style={
                            filled && !isBonus
                              ? {
                                  backgroundColor: periodFillColor,
                                  // PR-S9 (2026-05-15) — color: "#FFFFFF" inline 제거.
                                  //   CSS 룰 .ss-tbox__tf-cell[data-on="true"] color: var(--pap-bg)
                                  //   (=#FFFFFF) 이미 박제. inline 중복 안전망 정리.
                                }
                              : undefined
                          }
                          aria-label={`Period ${period} 팀 파울 ${n} ${filled ? "마킹됨" : "빈 칸"}`}
                        >
                          {n}
                        </div>
                      );
                    })}
                  </div>
                  {/* 5+ FT 부여 안내 (영구 표시 / 사용자 결재 §4) */}
                  {ftAwarded && (
                    <span
                      className="inline-flex shrink-0 items-center gap-0.5 text-[8px] font-bold"
                      style={{ color: "var(--pap-bonus)" }}
                      aria-label={`Period ${period} 자유투 부여 (Team fouls ${teamCount}건)`}
                    >
                      FT+{teamCount - 4}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* line 2 — Period ③ ④ */}
          <div className="ss-tbox__tf-line">
            <span className="ss-tbox__tf-pname">Period</span>
            {([3, 4] as const).map((period) => {
              // PR-Stat3.1 (2026-05-15) — 사용자 명시: 연장전 파울 = Q4 합산 (OT 는 4쿼터 연장).
              //   Q4 cell = period 4 + period 5+ (OT) 합산 / Q3 cell = period 3 만 (기존).
              //   getTeamFoulCountByPeriod 헬퍼 자체는 보존 (다른 영역 영향 0) — 표시 시점에만 합산.
              const teamCount =
                period === 4
                  ? fouls.filter((f) => f.period >= 4).length
                  : getTeamFoulCountByPeriod(fouls, period);
              const ftAwarded = teamCount >= 5;
              const periodFillColor = getPeriodColor(period);
              return (
                <div key={period} className="ss-tbox__tf-q">
                  <span className="ss-tbox__tf-qnum">
                    {period === 3 ? "③" : "④"}
                  </span>
                  <div className="ss-tbox__tf-cells">
                    {[1, 2, 3, 4].map((n) => {
                      const filled = teamCount >= n;
                      const isBonus = filled && teamCount >= 5 && n === 4;
                      return (
                        <div
                          key={n}
                          className="ss-tbox__tf-cell"
                          data-on={filled ? "true" : "false"}
                          data-bonus={isBonus ? "true" : "false"}
                          style={
                            filled && !isBonus
                              ? {
                                  backgroundColor: periodFillColor,
                                  // PR-S9 (2026-05-15) — color: "#FFFFFF" inline 제거.
                                  //   CSS 룰 .ss-tbox__tf-cell[data-on="true"] color: var(--pap-bg)
                                  //   (=#FFFFFF) 이미 박제. inline 중복 안전망 정리.
                                }
                              : undefined
                          }
                          aria-label={`Period ${period} 팀 파울 ${n} ${filled ? "마킹됨" : "빈 칸"}`}
                        >
                          {n}
                        </div>
                      );
                    })}
                  </div>
                  {ftAwarded && (
                    <span
                      className="inline-flex shrink-0 items-center gap-0.5 text-[8px] font-bold"
                      style={{ color: "var(--pap-bonus)" }}
                      aria-label={`Period ${period} 자유투 부여 (Team fouls ${teamCount}건)`}
                    >
                      FT+{teamCount - 4}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* line 3 — Extra periods (OT 통합 합산 / 시안 data-extra="true").
              Phase 19 PR-T4 (2026-05-15) — 1/2/3/4 cell 마크업 삭제 + 텍스트 라벨 유지 + 우측 정렬.
                왜: 사용자 결재 — Extra periods 는 OT 카운트만 표시 (cell 마킹 ❌) + 영역 우측 정렬.
                  Q1~Q4 line 과 시각 분리 (Extra 는 텍스트 + FT+N 만).
                어떻게:
                  - .ss-tbox__tf-cells 마크업 + .ss-tbox__tf-cell 4 cells 삭제
                  - inline style justifyContent: flex-end 로 라인 전체 우측 정렬
                  - ftAwarded 안내는 보존 (운영 OT 5+ 부여 안내)
              운영 동작 보존: fouls 카운트 로직 그대로 (otCount + ftAwarded). UI 만 단순화. */}
          {/* PR-Stat3.1 (2026-05-15) — Extra periods row = 라벨만 유지 (OT 카운트/FT 표시 제거).
              사용자 명시: 연장전 = 4쿼터의 연장 → Q4 cell 에 합산 표시 → OT 별도 카운트 ❌.
              시안 정합 (텍스트 라벨) + 우측 정렬은 보존 (PR-T4). */}
          <div
            className="ss-tbox__tf-line"
            data-extra="true"
            style={{ justifyContent: "flex-end" }}
          >
            <span className="ss-tbox__tf-pname">Extra periods</span>
          </div>
        </div>
      </div>
      {/* /§2 ss-tbox__tt 끝 */}

      {/* §3 Player table head — Licence / Players / No / Player in / Stats(OR/DR/A/S/B/TO) / Fouls (1-5)
          Phase 19 PR-Stat2 (2026-05-15) — 사용자 결재 Q1 = P.IN 직후 + Fouls 직전 6 cell 추가.
            FIBA 박스스코어 표준 순서 (OR → DR → A → S → B → TO). 헤더 단일 행 라벨. */}
      <div className="ss-tbox__plyhead">
        <div>
          <span>Licence</span>
          <span>no.</span>
        </div>
        {/* PR-Stat3.2 (2026-05-15) — 사용자 명시: 헤더 가로세로 가운데 정렬.
            시안 SSPlayerHead 의 Players column inline style (flex-start) 제거 → 부모 .ss-tbox__plyhead > div 의
            align-items: center + justify-content: center 룰 그대로 받음 (가운데 정렬). */}
        <div>Players</div>
        <div>No.</div>
        <div>
          <span>Player</span>
          <span>in</span>
        </div>
        {/* Phase 19 PR-Stat2 — 6 stat 헤더 cell (OR/DR/A/S/B/TO) */}
        <div className="ss-c-stat-or" aria-label="Offensive Rebounds">OR</div>
        <div className="ss-c-stat-dr" aria-label="Defensive Rebounds">DR</div>
        <div className="ss-c-stat-a" aria-label="Assists">A</div>
        <div className="ss-c-stat-s" aria-label="Steals">S</div>
        <div className="ss-c-stat-b" aria-label="Blocks">B</div>
        <div className="ss-c-stat-to" aria-label="Turnovers">TO</div>
        <div className="ss-h-fouls">
          <div className="ss-h-fouls-top">Fouls</div>
          <div className="ss-h-fouls-nums">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>
      </div>

      {/* §4 Player body — 12 rows (시안 grid-template-rows: repeat(12, 1fr)).
          운영 동작 보존:
            - FoulType 모달 진입점 = onRequestAddFoul(p.tournamentTeamPlayerId)
            - 5반칙 차단 = ejected 분기 (data-fouled-out 시각)
            - Phase 17 쿼터별 색 = inline style 로 foul cell 글자/배경 wiring
            - P.IN 체크박스 = updatePlayer(...) onChange 그대로 */}
      <div className="ss-tbox__plybody">
        {rows.map((p, idx) => {
          if (!p) {
            // 빈 row — FIBA 12 행 정합 placeholder.
            // Phase 19 PR-Stat2 (2026-05-15) — P.IN 직후 6 stat cell 추가 (Fouls 직전).
            //   grid-template-columns 의 cell 개수와 정확히 맞춰야 grid 라인 무너지지 않음.
            return (
              <div key={`empty-${idx}`} className="ss-tbox__plyrow">
                <div className="ss-c-licence">&nbsp;</div>
                <div className="ss-c-name">&nbsp;</div>
                <div className="ss-c-no">&nbsp;</div>
                <div className="ss-c-pin">&nbsp;</div>
                {/* 6 stat cell — 빈 row 시각 통일 */}
                <div className="ss-c-stat-or">&nbsp;</div>
                <div className="ss-c-stat-dr">&nbsp;</div>
                <div className="ss-c-stat-a">&nbsp;</div>
                <div className="ss-c-stat-s">&nbsp;</div>
                <div className="ss-c-stat-b">&nbsp;</div>
                <div className="ss-c-stat-to">&nbsp;</div>
                <div className="ss-c-foul">&nbsp;</div>
                <div className="ss-c-foul">&nbsp;</div>
                <div className="ss-c-foul">&nbsp;</div>
                <div className="ss-c-foul">&nbsp;</div>
                <div className="ss-c-foul">&nbsp;</div>
              </div>
            );
          }

          const state = values.players[p.tournamentTeamPlayerId] ?? {
            licence: "",
            playerIn: false,
          };

          // Phase 3 — 파울 카운트 + Phase 3.5 Article 41 퇴장 판정
          const foulCount = getPlayerFoulCount(fouls, p.tournamentTeamPlayerId);
          const ejection = getEjectionReason(fouls, p.tournamentTeamPlayerId);
          const ejected = ejection.ejected;
          // 해당 선수의 파울 마킹 배열 (UI 칸 표시용)
          const playerFoulMarks = fouls.filter(
            (f) => f.playerId === p.tournamentTeamPlayerId
          );

          return (
            <div
              key={p.tournamentTeamPlayerId}
              className="ss-tbox__plyrow"
              data-fouled-out={ejected ? "true" : "false"}
              aria-label={
                ejected
                  ? `${p.displayName} ${ejection.reason ?? ""} 퇴장 (행 비활성)`
                  : `${p.displayName}`
              }
            >
              {/* Licence (UID) — Read-only / User.id 자동 fill */}
              <div
                className="ss-c-licence"
                aria-label={`${p.displayName} licence ${p.userId ?? "미연결"}`}
              >
                {p.userId ?? ""}
              </div>
              {/* 선수명 — 캡틴 ★ 유지 / 5반칙 시 .ss-c-name 빨강 강조 (CSS) */}
              <div className="ss-c-name" title={p.displayName}>
                {p.displayName}
                {p.role === "captain" && !ejected && (
                  <span
                    className="ml-1"
                    style={{ color: "var(--pap-bonus)" }}
                    aria-label="캡틴"
                  >
                    ★
                  </span>
                )}
              </div>
              {/* No. (등번호) */}
              <div className="ss-c-no">
                {p.jerseyNumber ?? ""}
              </div>
              {/* Player in 체크 — 스타팅 5인 = 빨강 배경 / 일반 = 흰 배경. ejected = 비활성화. */}
              <div className="ss-c-pin">
                <label
                  className="inline-flex h-[14px] w-[14px] cursor-pointer items-center justify-center"
                  style={{
                    touchAction: "manipulation",
                    backgroundColor: p.isStarter
                      ? "var(--pap-bonus)"
                      : "transparent",
                    border: p.isStarter
                      ? "1px solid var(--pap-bonus)"
                      : "1px solid var(--pap-line)",
                  }}
                  aria-label={
                    p.isStarter
                      ? `${p.displayName} 스타팅 (P IN 자동 체크)`
                      : `${p.displayName} player in`
                  }
                >
                  <input
                    type="checkbox"
                    checked={state.playerIn}
                    onChange={(e) =>
                      updatePlayer(p.tournamentTeamPlayerId, {
                        playerIn: e.target.checked,
                      })
                    }
                    disabled={disabled || ejected}
                    className="h-[10px] w-[10px] cursor-pointer disabled:opacity-50"
                    style={{
                      accentColor: p.isStarter ? "#FFFFFF" : undefined,
                    }}
                    aria-label={`${p.displayName} player in`}
                  />
                </label>
              </div>
              {/* Phase 19 PR-Stat2 (2026-05-15) — 6 stat cell (OR/DR/A/S/B/TO).
                  사용자 결재 Q1 = P.IN 직후 + Fouls 직전 (FIBA 박스스코어 표준 순서).
                  각 cell 클릭 → StatPopover open (caller 가 +1/-1 처리).
                  ejected 선수 = 클릭 차단 (운영자 사고 방지 — Fouls cell 패턴 일관). */}
              {STAT_KEYS.map((statKey) => {
                const value = getStat(playerStats, p.tournamentTeamPlayerId, statKey);
                return (
                  <button
                    key={statKey}
                    type="button"
                    className={`ss-c-stat-${statKey}`}
                    onClick={() => {
                      if (disabled) return;
                      // 퇴장 선수 stat 추가/수정 차단 (Fouls cell 패턴 일관)
                      if (ejected) return;
                      onRequestOpenStatPopover(
                        p.tournamentTeamPlayerId,
                        statKey
                      );
                    }}
                    disabled={disabled || ejected}
                    style={{
                      touchAction: "manipulation",
                    }}
                    aria-label={`${p.displayName} ${statKey.toUpperCase()} ${value > 0 ? value : "빈 칸"} (클릭 시 +1/-1 선택)`}
                    title={`${statKey.toUpperCase()}: ${value}`}
                  >
                    {value > 0 ? value : ""}
                  </button>
                );
              })}
              {/* Fouls 1-5 — 5 cells (시안 .ss-c-foul × 5). */}
              {[1, 2, 3, 4, 5].map((n) => {
                const mark = n <= foulCount ? playerFoulMarks[n - 1] : null;
                const filled = mark !== null;
                const isLastFilled = filled && n === foulCount;
                const isNextEmpty = !filled && n === foulCount + 1;
                // Phase 17 — 글자 색 = Q별 색 (mark.period) / 배경 = 종류 P/T/U/D 옅게.
                const foulTextColor = mark
                  ? getPeriodColor(mark.period)
                  : undefined;
                const foulBgColor = mark
                  ? FOUL_TYPE_BG_COLOR[mark.type]
                  : "transparent";
                return (
                  <button
                    key={n}
                    type="button"
                    className="ss-c-foul mark"
                    onClick={() => {
                      if (disabled) return;
                      // 퇴장 도달 후 추가 마킹 차단 (마지막 칸 해제는 허용)
                      if (ejected && !isLastFilled) return;
                      if (isLastFilled) {
                        onRequestRemoveFoul(p.tournamentTeamPlayerId);
                      } else if (isNextEmpty) {
                        // FoulTypeModal open 진입점 — 운영 동작 보존 의무 #2.
                        onRequestAddFoul(p.tournamentTeamPlayerId);
                      }
                    }}
                    disabled={disabled || (!isLastFilled && !isNextEmpty)}
                    style={{
                      // Phase 17 — 글자 = Q별 색 / 배경 = 종류 옅은 톤 (inline style 로 CSS 토큰 색 override).
                      color: foulTextColor,
                      backgroundColor: foulBgColor,
                      touchAction: "manipulation",
                    }}
                    aria-label={
                      mark
                        ? `${p.displayName} ${n}번째 파울 ${mark.type} (Q${mark.period}) 마킹됨${isLastFilled ? " (클릭 시 해제)" : ""}`
                        : `${p.displayName} ${n}번째 파울 빈 칸${isNextEmpty ? " (클릭 시 종류 선택)" : ""}`
                    }
                    title={`Period ${currentPeriod} 마킹`}
                  >
                    {mark ? mark.type : ""}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* /§4 ss-tbox__plybody 끝 */}

      {/* §5 Coach — 시안 .ss-tbox__coach + .pap-lbl + input.pap-u (운영 onChange 그대로).
          Phase 23 PR-RO1 (2026-05-15) — 종료 매치 차단 시 readOnly 적용 (사용자 결재 Q2). */}
      <div className="ss-tbox__coach">
        <label className="pap-lbl" htmlFor={`coach-${sideLabel}`}>
          Coach
        </label>
        <input
          id={`coach-${sideLabel}`}
          type="text"
          className="pap-u"
          value={values.coach}
          onChange={updateCoach("coach")}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={40}
        />
      </div>
      <div className="ss-tbox__coach">
        <label className="pap-lbl" htmlFor={`asst-coach-${sideLabel}`}>
          Assistant Coach
        </label>
        <input
          id={`asst-coach-${sideLabel}`}
          type="text"
          className="pap-u"
          value={values.asstCoach}
          onChange={updateCoach("asstCoach")}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={40}
        />
      </div>
    </section>
  );
}
