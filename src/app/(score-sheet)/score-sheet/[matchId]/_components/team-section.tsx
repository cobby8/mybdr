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
} from "@/lib/score-sheet/timeout-helpers";
import {
  getPeriodColor,
  getTimeoutPhaseColor,
} from "@/lib/score-sheet/period-color";

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
  fouls,
  onRequestAddFoul,
  onRequestRemoveFoul,
  currentPeriod,
  timeouts,
  onRequestAddTimeout,
  onRequestRemoveTimeout,
  frameless,
}: TeamSectionProps) {
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

  // Phase 8 — frameless 모드: 단일 외곽 박스 안에서 자체 border 제거.
  const sectionStyle: React.CSSProperties = frameless
    ? {}
    : { border: "1px solid var(--color-border)" };
  // Phase 9 — Team 영역 ~37% (목표 ~415px) 안에 fit. px-1 py-1 더 컴팩트.
  const sectionClass = frameless
    ? "fiba-frameless w-full px-1 py-1"
    : "w-full p-3";

  return (
    // Phase 7-A → Phase 8 — 디자인 정합 (FIBA PDF 1:1):
    //   - rounded-0 / shadow X / 박스 내 박스 X (단일 외곽 박스로 통합)
    //   - Phase 8 = Time-outs + Team fouls 가로 1줄 / Players 15행 ~28px / 컴팩트 패딩
    <section className={sectionClass} style={sectionStyle}>
      {/* Phase 10 (2026-05-12) — 헤더 §B FIBA underscore 정합 (사용자 결재).
          - 큰 글자 박스 폐기 (uppercase + bold + tracking 폐기)
          - 라벨 = "Team A" Title case (FIBA PDF 정합) / ~10px 작은 글자
          - 데이터 = 팀명 + border-bottom underscore line
          왜: FIBA 종이기록지는 "Team A ____슬로우____" 같이 라벨 + underscore line. */}
      <div className="mb-0.5 flex items-baseline gap-1.5">
        <span
          className="shrink-0 text-[10px] font-semibold"
          style={{ color: "var(--color-text-muted)" }}
        >
          {sideLabel}
        </span>
        <span
          className="min-w-0 flex-1 truncate pb-0 text-[12px]"
          style={{
            color: "var(--color-text-primary)",
            borderBottom: "1px solid var(--color-text-primary)",
          }}
          title={teamName}
        >
          {teamName || "—"}
        </span>
      </div>

      {/* Phase 8 — Time-outs + Team fouls 가로 1줄 배치 (FIBA PDF 정합).
          좌: Time-outs 5칸 (+OT)  /  우: Team fouls Period 1-4 1행 (compact).
          Phase 9 — 더 컴팩트: mb 0.5 / gap 1.5
          Phase 16 (2026-05-13) — Team fouls 박스 우측 정렬 (사용자 결재 §4 / 이미지 38).
            justify-between = 좌측 Time-outs / 우측 Team fouls 자연 분리. */}
      <div className="mb-0.5 flex flex-wrap items-start justify-between gap-1.5">
      {/* Phase 4 — Time-outs (FIBA Article 18-19 — 전반 2 + 후반 3 + OT 1 각각).
          박스 = 전반칸 2개 + 후반칸 3개 = 기본 5칸. OT 진입 시 (currentPeriod >= 5)
          OT 1칸 동적 추가 (각 OT 별도 1칸).
          UX:
            - 빈 칸 클릭 → caller 가 canAddTimeout 검증 + 마킹
            - 마지막 마킹 칸 클릭 → 1건 해제
            - 채운 칸 = ● (text-primary) / 빈 칸 = 숫자 (text-muted)
          시각: foul 5칸과 같은 톤 (border 1px / 36px 정사각 큰 터치영역).
          Phase 8 — mb-3 → 가로 flex 자식 (flex-shrink-0 + 우측 Team fouls 와 인라인).
          Phase 13 (2026-05-12) — 가로 6칸 → 2×N grid (사용자 결재 §1).
            5칸 + OT 추가 시 가로가 너무 길어 → 2 컬럼 동적 배치 (홀수면 마지막 좌측만).
            박스 크기 h-6 w-6 → h-[18px] w-[18px] (시각 압축).
          Phase 14 (2026-05-12) — 2×N → 3×2 grid (사용자 결재 §1 / 이미지 32).
            FIBA 종이기록지 표준 = 3×2 = 6칸 (전반 2 + 후반 3 + 여유 1).
            grid-cols-3 × 2 row = 6 고정. OT 진입 시 7~8번째 칸은 자동 행 확장 (3+3+2). */}
      <div className="shrink-0">
        <div
          className="mb-0.5 flex items-baseline justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span>Time-outs</span>
          {(() => {
            // 현재 phase 표시 (운영자 인지 도움 — 전반/후반/OTn 잔여)
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
              <span style={{ color: "var(--color-text-muted)" }}>
                {phaseLabel} {used}/{max}
              </span>
            );
          })()}
        </div>
        {/* Phase 14 — grid-cols-3 × 2 row = 6 고정 칸 (FIBA 정합 / 사용자 결재 §1).
            이전 Phase 13: grid-cols-2 (2 컬럼 동적) → Phase 14: grid-cols-3 (3×2 = 6 고정).
            OT 진입 시 7~8번째 칸은 자동 다음 행 (3+3+2). */}
        <div className="grid grid-cols-3 gap-px">
          {(() => {
            // 표시할 칸 수 산정:
            //   Phase 14 — 기본 6칸 (FIBA 표준 = 전반 2 + 후반 3 + 여유 1 / 3×2 grid).
            //     OT 진입 시 (currentPeriod >= 5) 각 OT 별 1칸 추가 → 7/8/...
            //     이전 Phase 13 = 5칸 + OT (Phase 4 마킹 로직 = totalUsed 만 채움).
            //     본 변경 = 시각 칸만 5 → 6 (여유 1칸은 빈 상태) / OT 시 +1.
            const totalCells = currentPeriod <= 4 ? 6 : 6 + (currentPeriod - 4);
            // 현재까지 사용된 총 타임아웃 수 = 채워진 칸 수
            const totalUsed = timeouts.length;

            return Array.from({ length: totalCells }).map((_, i) => {
              const filled = i < totalUsed;
              const isLastFilled = filled && i === totalUsed - 1;
              const isNextEmpty = !filled && i === totalUsed;
              // 칸 라벨 — 위치별 phase 안내 (Phase 14 — 6칸 grid 기준)
              //   인덱스 0-1 = 전반 (2칸) / 2-4 = 후반 (3칸) / 5 = 여유 (FIBA 표준 6번째 빈 칸) / 6+ = OT
              //   marked 칸이 어느 period 인지는 timeouts[i].period 로 알 수 있음
              const cellLabel = filled
                ? `Period ${timeouts[i].period} 타임아웃`
                : i < 2
                  ? `전반 타임아웃 ${i + 1}`
                  : i < 5
                    ? `후반 타임아웃 ${i - 1}`
                    : i === 5
                      ? "여유 (OT 진입 시 활성)"
                      : `OT${i - 5} 타임아웃`;
              // Phase 17 (2026-05-13) — X 마킹 색 = phase 별 색 (사용자 결재 §5 / 이미지 14:00 KST).
              //   filled = 해당 마킹의 period 로 phase 분기 → 전반/후반/OT 색 적용.
              //   빈 칸 = text-muted 유지 (변경 없음).
              const markColor = filled
                ? getTimeoutPhaseColor(timeouts[i].period)
                : "var(--color-text-muted)";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    if (isLastFilled) {
                      onRequestRemoveTimeout();
                    } else if (isNextEmpty) {
                      onRequestAddTimeout();
                    }
                  }}
                  disabled={disabled || (!isLastFilled && !isNextEmpty)}
                  // Phase 13 — h-6 w-6 → h-[18px] w-[18px] (시각 압축 / 사용자 결재 §3).
                  className="mark flex h-[18px] w-[18px] items-center justify-center text-[10px] font-bold disabled:cursor-default"
                  style={{
                    // Phase 10 (2026-05-12) §E — 빈 사각형 + 마킹 시 X 글자 (FIBA 종이기록지 정합).
                    // 검정 ● 폐기 (사용자 결재) — 마킹은 X 글자 (운영자 종이에 X 표시 관행).
                    border: "1px solid var(--color-border)",
                    backgroundColor: "transparent",
                    // Phase 17 — color hardcoded text-primary → markColor (phase 별 색 동적)
                    color: markColor,
                    cursor:
                      isLastFilled || isNextEmpty ? "pointer" : "default",
                    touchAction: "manipulation",
                  }}
                  aria-label={
                    filled
                      ? `${cellLabel} 마킹됨${isLastFilled ? " (클릭 시 해제)" : ""}`
                      : `${cellLabel} 빈 칸${isNextEmpty ? " (클릭 시 마킹)" : ""}`
                  }
                  title={cellLabel}
                >
                  {/* 마킹 시 X 글자 / 빈 칸 = 비워둠 (FIBA 종이기록지 정합) */}
                  {filled ? "X" : ""}
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Team fouls — Player Fouls 자동 합산 (read-only, 사용자 결재 §3 (a)) */}
      {/* 이유: 1-4 마킹은 Player Fouls 마킹에서 자동 산출 — 1=●○○○ / 4=●●●● / 5+=●●●●● + 자유투 안내.
          Phase 8 — Time-outs 옆 가로 인라인 (flex-1 = 남은 폭 차지).
          Phase 12 (2026-05-12) — FIBA PDF 정합 3 줄 레이아웃 (사용자 직접 결재):
            줄 1) Period ① [1·2·3·4]   ② [1·2·3·4]   ← 가로 한 줄
            줄 2) Period ③ [1·2·3·4]   ④ [1·2·3·4]   ← 가로 한 줄
            줄 3) Extra   [1·2·3·4]                    ← 단독 한 줄
          5 줄 → 3 줄 (-24px / FIBA 종이기록지 정합).
          Phase 13 (2026-05-12) — UI 겹침 fix (사용자 결재 §2 / 이미지 31).
            박스 h-5 w-5 → h-[12px] w-[12px] (P2 라벨/2FT 안내 겹침 fix).
            라벨 w-8 → w-7 (글자 9px) / 페어 간 gap-2 → gap-1.
            FT (+N) 안내 = 글자 8px (이전 9px) + 박스 옆 유지 (FIBA 한줄 묶음 룰).
          Phase 16 (2026-05-13) — flex-1 → shrink-0 + ml-auto (우측 정렬 / 사용자 결재 §4).
            FIBA PDF 정합 = Time-outs 좌측 / Team fouls 우측. flex-1 은 부모 justify-between 활용. */}
      <div className="ml-auto min-w-0 shrink-0">
        <div
          className="mb-0.5 text-right text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Team fouls
        </div>
        <div className="grid grid-cols-1 gap-0.5">
          {/* Phase 12 — Period 페어 컴포넌트 inline 렌더링 (좌·우 가로 배치).
              [1,2] / [3,4] 2 페어 + Extra 1 줄 = 3 줄. */}
          {(
            [
              [1, 2],
              [3, 4],
            ] as const
          ).map(([leftPeriod, rightPeriod]) => (
            <div
              key={`pair-${leftPeriod}`}
              // Phase 13 — gap-2 → gap-1 (페어 간격 압축 / 겹침 fix)
              className="flex items-center gap-1"
            >
              {[leftPeriod, rightPeriod].map((period) => {
                // 이 Period 의 팀 파울 누적 (Player Fouls 합산)
                const teamCount = getTeamFoulCountByPeriod(fouls, period);
                // 5+ 도달 = 자유투 부여 (UI 강조)
                const ftAwarded = teamCount >= 5;
                // Phase 17 (2026-05-13) — Team Fouls 박스 채움 색 = Period 별 색 (사용자 결재 §4).
                //   각 Period 박스 4칸 (1·2·3·4) 채움 = getPeriodColor(period) 통일.
                //   이전: text-primary 하드코딩 (검정) → 동적 (Q1=검정/Q2=빨강/Q3=초록/Q4=오렌지).
                const periodFillColor = getPeriodColor(period);
                return (
                  <div
                    key={period}
                    // Phase 13 — gap-1 → gap-px (페어 내부 압축)
                    className="flex min-w-0 flex-1 items-center gap-px"
                  >
                    <span
                      // Phase 13 — w-8 → w-7 / text-[10px] → text-[9px] (라벨 압축)
                      className="w-7 shrink-0 text-[9px] uppercase"
                      style={{ color: "var(--color-text-muted)" }}
                      aria-label={`Period ${period}`}
                    >
                      {/* Phase 12 — w-12 → w-8 압축 / Phase 13 — w-7 추가 압축. */}
                      P{period}
                    </span>
                    {/* Phase 11 §1 (2026-05-12) — FIBA 정합 박스 안 1·2·3·4 라벨 복원 (reviewer Critical).
                        Phase 12 — 페어 배치 유지 / 박스 크기 동일 (h-5 w-5).
                        Phase 13 — 박스 h-5 w-5 → h-[12px] w-[12px] (UI 겹침 fix / 사용자 결재 §2).
                          글자 9px → 8px / shrink-0 유지.
                        Phase 17 (2026-05-13) — 채움 색 = periodFillColor (Q별 색). */}
                    {[1, 2, 3, 4].map((n) => {
                      const filled = teamCount >= n;
                      return (
                        <div
                          key={n}
                          className="mark flex h-[12px] w-[12px] shrink-0 items-center justify-center text-[8px] font-semibold"
                          style={{
                            border: "1px solid var(--color-border)",
                            backgroundColor: filled
                              ? periodFillColor
                              : "transparent",
                            // Phase 17.1 (2026-05-13) — 색 충돌 fix (사용자 보고).
                            //   채움 박스 글자 = 흰색 hardcode (이전 var(--color-bg) 미정의 → 검정 fallback → 충돌).
                            //   라이트/다크 모드 무관 — 채움 = 어두운 색 (Q1 검정 / Q2 네이비 / Q3 그린 / Q4 오렌지 / OT 빨강) → 흰 글자 가독성 보장.
                            color: filled ? "#ffffff" : "var(--color-text-muted)",
                          }}
                          aria-label={`Period ${period} 팀 파울 ${n} ${filled ? "마킹됨" : "빈 칸"}`}
                        >
                          {n}
                        </div>
                      );
                    })}
                    {/* 5+ 도달 시 자유투 부여 표시 (사용자 결재 §4 alert toast 와 별도 — 영구 표시 차원).
                        Phase 13 — 글자 9px → 8px / ml-1 → ml-0.5 (압축) */}
                    {ftAwarded && (
                      <span
                        className="ml-0.5 inline-flex shrink-0 items-center gap-0.5 text-[8px] font-semibold"
                        style={{ color: "var(--color-warning)" }}
                        aria-label={`Period ${period} 자유투 부여 (Team fouls ${teamCount}건)`}
                      >
                        <span
                          className="material-symbols-outlined text-[10px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          warning
                        </span>
                        FT (+{teamCount - 4})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Extra periods (OT) — period 5+ 합산. Phase 12 = 단독 줄 (페어 X)
              Phase 13 — w-8 → w-7 / 박스 h-5 w-5 → h-[12px] w-[12px] 압축 */}
          <div className="flex items-center gap-px">
            <span
              className="w-7 shrink-0 text-[9px] uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              Extra
            </span>
            {/* Phase 11 §1 (2026-05-12) — OT 박스 안 1·2·3·4 라벨 복원 (FIBA 정합 / Period 행 동일).
                period 5~7 합산 (FIBA Article — Extra periods 통합 표시).
                Phase 13 — h-5 w-5 → h-[12px] w-[12px] (UI 압축 / 사용자 결재 §2).
                Phase 17 (2026-05-13) — 채움 색 = OT 색 (primary) — 사용자 결재 §4 / 이미지 14:00 KST. */}
            {(() => {
              const otCount = fouls.filter((f) => f.period >= 5).length;
              // OT 색 = primary (getPeriodColor(5+) 와 동일 토큰) — 사용자 결재 §1.
              const extraFillColor = getPeriodColor(5);
              return [1, 2, 3, 4].map((n) => {
                const filled = otCount >= n;
                return (
                  <div
                    key={n}
                    className="mark flex h-[12px] w-[12px] shrink-0 items-center justify-center text-[8px] font-semibold"
                    style={{
                      border: "1px solid var(--color-border)",
                      backgroundColor: filled
                        ? extraFillColor
                        : "transparent",
                      // Phase 17.1 (2026-05-13) — Extra OT 박스 글자 흰색 hardcode (Period 박스와 동일 패턴).
                      color: filled ? "#ffffff" : "var(--color-text-muted)",
                    }}
                    aria-label={`Extra (OT) 팀 파울 ${n} ${filled ? "마킹됨" : "빈 칸"}`}
                  >
                    {n}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
      </div>{/* /Phase 8 — Time-outs + Team fouls 가로 1줄 flex container 끝 */}

      {/* Players 12 행 — FIBA Article 4.2.2 실 운영 max (Phase 12 — 사용자 직접 결재).
          Phase 12 — 행 20px (12행 × 20 = 240px) — A4 1 페이지 fit 여유 확보.
            Phase 11 = 16행 × 20 = 320 → Phase 12 = 12행 × 20 = 240 (-80px) —
            Team Fouls 5줄 → 3줄 (-24px) 합산해서 A4 1123px 안 ~132px 여유.
          Phase 13 (2026-05-12) — 행 20 → 18px (사용자 결재 §4 / 12 × 18 = 216 / -24px). */}
      <div className="mb-0.5 overflow-x-auto">
        <table
          className="w-full border-collapse text-xs"
          style={{ color: "var(--color-text-primary)" }}
        >
          <thead>
            {/* Phase 13 — thead 행 = 18px (py-0 압축 + 12행 fit / 사용자 결재 §4) */}
            <tr
              style={{
                borderBottom: "1px solid var(--color-border)",
                height: 18,
              }}
            >
              <th
                className="w-20 px-1 py-0.5 text-left text-[10px] font-semibold uppercase"
                style={{ color: "var(--color-text-muted)" }}
                title="Licence = User ID (자동 fill)"
              >
                Licence (UID)
              </th>
              <th
                className="px-1 py-0.5 text-left text-[10px] font-semibold uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                Player
              </th>
              <th
                className="w-10 px-1 py-0.5 text-center text-[10px] font-semibold uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                No.
              </th>
              <th
                className="w-12 px-1 py-0.5 text-center text-[10px] font-semibold uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                P in
              </th>
              <th
                className="w-32 px-1 py-0.5 text-center text-[10px] font-semibold uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                Fouls 1-5
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, idx) => {
              if (!p) {
                // 빈 row — FIBA 양식 12 행 정합용 placeholder (Phase 12 — 사용자 직접 결재).
                // Phase 13 — 행 높이 20 → 18px (사용자 결재 §4 / 12행 × 18 = 216px / -24px)
                return (
                  <tr
                    key={`empty-${idx}`}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      height: 18,
                    }}
                  >
                    <td className="px-1 py-0">&nbsp;</td>
                    <td className="px-1 py-0">&nbsp;</td>
                    <td className="px-1 py-0 text-center">&nbsp;</td>
                    <td className="px-1 py-0 text-center">&nbsp;</td>
                    <td className="px-1 py-0 text-center">&nbsp;</td>
                  </tr>
                );
              }

              const state = values.players[p.tournamentTeamPlayerId] ?? {
                licence: "",
                playerIn: false,
              };

              // Phase 3 — 파울 카운트 + Phase 3.5 Article 41 퇴장 판정
              const foulCount = getPlayerFoulCount(
                fouls,
                p.tournamentTeamPlayerId
              );
              const ejection = getEjectionReason(
                fouls,
                p.tournamentTeamPlayerId
              );
              const ejected = ejection.ejected;
              // Phase 3.5 — 해당 선수의 파울 마킹 순서대로 type 배열 (UI 칸 표시용)
              //   예: [P, P, T, U] → 칸 1=P / 칸 2=P / 칸 3=T / 칸 4=U
              const playerFoulMarks = fouls.filter(
                (f) => f.playerId === p.tournamentTeamPlayerId
              );

              return (
                <tr
                  key={p.tournamentTeamPlayerId}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    // Phase 13 — 행 높이 20 → 18px (사용자 결재 §4 / 12행 × 18 = 216px)
                    height: 18,
                    // 사용자 결재 §2 (a) — 5반칙 도달 시 행 전체 회색 처리.
                    // Phase 16 (2026-05-13) — opacity 0.6 + cursor not-allowed 추가 (사용자 결재 §5 / 이미지 39).
                    //   이유: D 퇴장 아이콘/텍스트 제거 대신 행 시각만으로 충분히 인지 가능하게 강화.
                    backgroundColor: ejected
                      ? "var(--color-elevated)"
                      : "transparent",
                    color: ejected
                      ? "var(--color-text-muted)"
                      : "var(--color-text-primary)",
                    opacity: ejected ? 0.6 : 1,
                    cursor: ejected ? "not-allowed" : "default",
                  }}
                  aria-label={
                    ejected
                      ? `${p.displayName} ${ejection.reason ?? ""} 퇴장 (행 비활성)`
                      : `${p.displayName}`
                  }
                >
                  {/* Phase 3.5 — Licence = User.id 자동 fill (Read-only).
                      이유: 사용자 결재 §3 — 운영자 입력 부담 0, User.id 가 영구 식별자.
                      미연결 (게스트) 선수 = "—" 표시.
                      Phase 9 — py-1 → py-0 (24px 행 fit) / 텍스트 11px */}
                  <td className="px-1 py-0">
                    <span
                      className="block w-full text-[11px] font-mono"
                      style={{
                        color: ejected
                          ? "var(--color-text-muted)"
                          : "var(--color-text-primary)",
                      }}
                      aria-label={`${p.displayName} licence ${p.userId ?? "미연결"}`}
                    >
                      {p.userId ?? "—"}
                    </span>
                  </td>
                  {/* 선수명 — read-only / 캡틴 ★ 유지 / 5반칙 시 행 회색 시각으로 충분.
                      Phase 9 — 텍스트 11px / py-0
                      Phase 16 (2026-05-13) — 빨강 원 ◉ (isStarter 표시) 숨김 (사용자 결재 §2 / 이미지 36).
                        이유: 의미 불명확 + 시각 노이즈. 스타팅 표시는 P.IN 체크박스 빨강 배경으로 대체 (§1).
                      Phase 16 (2026-05-13) — D 퇴장 아이콘/텍스트 제거 (사용자 결재 §5 / 이미지 39).
                        이유: 좁은 공간 overflow + UI 깨짐. 행 전체 회색 + 비활성화 시각 = 충분 (§5).
                        D 마킹은 Fouls 1번 칸 "D" 글자로 유지. */}
                  <td
                    className="px-1 py-0 text-[11px]"
                    style={{ lineHeight: "1.1" }}
                  >
                    {p.displayName}
                    {p.role === "captain" && !ejected && (
                      <span
                        className="ml-1"
                        style={{ color: "var(--color-warning)" }}
                      >
                        ★
                      </span>
                    )}
                  </td>
                  {/* 등번호 — read-only. Phase 9 — 11px / py-0 */}
                  <td className="px-1 py-0 text-center text-[11px]">
                    {p.jerseyNumber ?? "—"}
                  </td>
                  {/* Player in 체크 — Phase 9 행 24px fit (h-9 → h-5).
                      Phase 13 — h-5 w-5 → h-[18px] w-[18px] / 내부 input h-4 w-4 → h-[14px] w-[14px]
                        (사용자 결재 §3 체크박스 18px 압축).
                      터치 영역은 행 전체로 보완 (label 박스 자체 클릭 가능).
                      Phase 16 (2026-05-13) — 스타팅 강조 빨강 배경 (사용자 결재 §1 / 이미지 36).
                        이유: 라인업 확정 시 스타팅 5인 = 빨강 배경 P.IN / 일반 출전 7명 = 흰 배경 P.IN.
                        시각 차이로 스타팅 한눈에 인지 — 빨강 원 ◉ (§2) 폐기 대체.
                        ejected 시 = 비활성화 (사용자 결재 §5 — 퇴장 후 추가 P.IN 토글 차단). */}
                  <td className="px-1 py-0 text-center">
                    <label
                      className="inline-flex h-[18px] w-[18px] cursor-pointer items-center justify-center"
                      style={{
                        touchAction: "manipulation",
                        // 스타팅 5인 = 빨강 배경 + 흰 체크 (강조). 일반 = 흰 배경 + 검정 체크 (기본).
                        backgroundColor: p.isStarter
                          ? "var(--color-primary)"
                          : "transparent",
                        border: p.isStarter
                          ? "1px solid var(--color-primary)"
                          : "1px solid var(--color-border)",
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
                        className="h-[14px] w-[14px] cursor-pointer disabled:opacity-50"
                        style={{
                          // 빨강 배경 위 체크 = accentColor 흰 (대비 확보).
                          accentColor: p.isStarter ? "#ffffff" : undefined,
                        }}
                        aria-label={`${p.displayName} player in`}
                      />
                    </label>
                  </td>
                  {/* Phase 3.5 — Fouls 1-5 칸 = P/T/U/D 글자 직접 표시.
                      UX:
                        - 빈 칸 클릭 → caller 가 FoulTypeModal open (종류 선택 후 추가)
                        - 마지막 마킹 칸 클릭 → 1건 해제
                        - Article 41 퇴장 도달 시 추가 차단 (단 마지막 칸 해제 허용)
                      MAX_PLAYER_FOULS 상한 폐기 — Article 41 합산 ≥ 5 차단으로 대체.
                      Phase 9 — py-1 → py-0 (24px 행 fit) */}
                  <td className="px-1 py-0">
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => {
                        // 해당 칸 위치의 파울 마킹 (있으면 type 추출)
                        const mark =
                          n <= foulCount ? playerFoulMarks[n - 1] : null;
                        const filled = mark !== null;
                        const isLastFilled = filled && n === foulCount;
                        const isNextEmpty = !filled && n === foulCount + 1;
                        // Phase 17 (2026-05-13) — 하이브리드 색 (사용자 결재 §3 / 이미지 14:00 KST):
                        //   - 글자 색 = Q별 색 (mark.period 기준) — 마킹 시점 한눈에.
                        //   - 배경 색 = 종류 P/T/U/D (FOUL_TYPE_BG_COLOR 옅은 톤).
                        //   이전 Phase 3.5: 글자 = 종류 색 / 배경 = 종류 색 18% (단일 차원).
                        //   변경 이유: Q별 색 차원 + 종류 차원 동시 인지 (2D 정보 동시 표현).
                        const foulTextColor = mark
                          ? getPeriodColor(mark.period)
                          : "var(--color-text-muted)";
                        const foulBgColor = mark
                          ? FOUL_TYPE_BG_COLOR[mark.type]
                          : "transparent";
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              if (disabled) return;
                              // 퇴장 도달 후 6번째 칸 클릭 = 차단 (마지막 칸 해제는 허용)
                              if (ejected && !isLastFilled) {
                                return;
                              }
                              if (isLastFilled) {
                                onRequestRemoveFoul(p.tournamentTeamPlayerId);
                              } else if (isNextEmpty) {
                                // 모달 open 요청 (종류 선택 후 caller 가 addFoul)
                                onRequestAddFoul(p.tournamentTeamPlayerId);
                              }
                            }}
                            disabled={
                              disabled || (!isLastFilled && !isNextEmpty)
                            }
                            // 칸 = 5x5 작지만 버튼 자체 클릭 영역 + touchAction
                            // Phase 11 §5 — `mark` 클래스 = 인쇄 시 검정 강제 (_print.css)
                            // Phase 13 — h-5 w-5 → h-[18px] w-[18px] (사용자 결재 §3 / 18px 압축)
                            className="mark flex h-[18px] w-[18px] items-center justify-center text-[10px] font-bold disabled:cursor-default"
                            style={{
                              border: "1px solid var(--color-border)",
                              // Phase 17 — 배경 = 종류별 옅은 색 (P=투명/T=노랑/U=하늘/D=빨강) 옅게 (15%).
                              backgroundColor: foulBgColor,
                              // Phase 17 — 글자 = Q별 색 (mark.period 기준 / Q1=검정/Q2=빨강/Q3=초록/Q4=오렌지/OT=빨강).
                              color: foulTextColor,
                              cursor:
                                isLastFilled || isNextEmpty
                                  ? "pointer"
                                  : "default",
                              touchAction: "manipulation",
                            }}
                            aria-label={
                              mark
                                ? `${p.displayName} ${n}번째 파울 ${mark.type} (Q${mark.period}) 마킹됨${isLastFilled ? " (클릭 시 해제)" : ""}`
                                : `${p.displayName} ${n}번째 파울 빈 칸${isNextEmpty ? " (클릭 시 종류 선택)" : ""}`
                            }
                            title={`Period ${currentPeriod} 마킹`}
                          >
                            {/* Phase 10 §G (2026-05-12) — 빈 박스 / 마킹 시 P/T/U/D 글자만.
                                숫자 라벨 1·2·3·4·5 폐기 (사용자 결재 — FIBA 종이기록지 정합).
                                Phase 17 — 글자 색 = Q별 (위 color 동적). */}
                            {mark ? mark.type : ""}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Coach / Asst Coach 입력 — Phase 8 inline 한 줄 (FIBA PDF 정합).
          "Coach: ____input____   Asst. Coach: ____input____" 같이 라벨 + underscore input */}
      <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2 sm:gap-2">
        <label className="flex items-baseline gap-1.5 overflow-hidden">
          <span
            className="shrink-0 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Coach
          </span>
          <input
            type="text"
            value={values.coach}
            onChange={updateCoach("coach")}
            disabled={disabled}
            maxLength={40}
            className="min-w-0 flex-1 bg-transparent pb-0 text-xs focus:outline-none disabled:opacity-50"
            style={{
              color: "var(--color-text-primary)",
              borderBottom: "1px solid var(--color-text-primary)",
            }}
          />
        </label>
        <label className="flex items-baseline gap-1.5 overflow-hidden">
          <span
            className="shrink-0 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Asst. Coach
          </span>
          <input
            type="text"
            value={values.asstCoach}
            onChange={updateCoach("asstCoach")}
            disabled={disabled}
            maxLength={40}
            className="min-w-0 flex-1 bg-transparent pb-0 text-xs focus:outline-none disabled:opacity-50"
            style={{
              color: "var(--color-text-primary)",
              borderBottom: "1px solid var(--color-text-primary)",
            }}
          />
        </label>
      </div>
    </section>
  );
}
