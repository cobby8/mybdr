/**
 * RunningScoreGrid — FIBA SCORESHEET 우측 절반 핵심 grid.
 *
 * 2026-05-12 — Phase 2 신규.
 * 2026-05-13 — Phase 17: 쿼터별 색 매핑 적용.
 * 2026-05-13 — Phase 18: FIBA 표준 4 sub-column 구조 + 1/2/3점 표기.
 *
 * 왜 (이유):
 *   FIBA 양식 우측 = Running Score 1-160 시계열 마킹. 운영자가 양식 그대로 1탭 마킹 →
 *   점수 종류 자동 추론 → PBP event 생성 → Period 자동 합산 → Final/Winner 자동.
 *
 *   Phase 18 (2026-05-13 — 사용자 결재 §1·§2 / 이미지 43-44):
 *     - FIBA 표준 = 한 세트 4 sub-column: **마킹A | 점수A | 점수B | 마킹B**
 *     - 양팀 점수가 가운데로 모이고 좌우에 마킹 칸 배치 (FIBA PDF 정합)
 *     - 점수 표기 시각 FIBA 정합: 1점 = · (작은 점) / 2점 = ● / 3점 = ● + 외곽 ○
 *     - 16 컬럼 가로 (4 세트 × 4 sub-column)
 *
 * 방법 (어떻게):
 *   - 4 세트 × 4 sub-column = 16 컬럼. 각 세트 40 row.
 *   - 마킹 칸 (A/B 마킹) = 클릭 가능 → PlayerSelectModal open
 *   - 점수 칸 (A/B 점수) = 인쇄 표시 영역 (position 1~160 박제 / 클릭 불가)
 *   - 마킹 = getScoreMarkIcon (점/●/●+○) + 등번호 작게
 *   - 마지막 마킹 1탭 = 해제 (음영 강조 + alert 확인)
 *
 * 768×1024 정합 (Phase 18):
 *   - 컨테이너 폭 = 384px (768 × 50%)
 *   - 16 컬럼 × ~24px = 384px (fit OK)
 *   - 점수 글꼴 = 7px / 마킹 글꼴 = 8px / 등번호 = 6px
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ / 강조 = var(--color-accent) (Phase 17 = Q별 색)
 *   - 핑크/살몬/코랄 ❌
 */

"use client";

import { useState } from "react";
import type { RosterItem } from "./team-section-types";
import type {
  ScoreMark,
  RunningScoreState,
} from "@/lib/score-sheet/running-score-types";
import {
  isValidMarkPosition,
  undoLastMark,
  addMark,
  getScoreMarkVariant,
} from "@/lib/score-sheet/running-score-helpers";
import { getPeriodColor } from "@/lib/score-sheet/period-color";
import { PlayerSelectModal } from "./player-select-modal";

interface RunningScoreGridProps {
  state: RunningScoreState;
  onChange: (next: RunningScoreState) => void;
  homePlayers: RosterItem[];
  awayPlayers: RosterItem[];
  homeTeamName: string;
  awayTeamName: string;
  disabled?: boolean;
  // Phase 8 — frameless 모드. 단일 외곽 박스 안에서 자체 border 제거.
  frameless?: boolean;
  // PR-S6 (2026-05-14 rev2 롤백) — mode prop 제거. 시안 rev2 가 모드 토글을 제거하면서
  // 단일 모드 (= 기존 detail 동작) 통일. 호출자 (score-sheet-form.tsx) 도 mode 미전달.
}

// FIBA 양식 = 4 세트, 각 세트 = 40 row, A|B 두 컬럼
const SETS = 4;
const ROWS_PER_SET = 40;
const MAX_POSITION = SETS * ROWS_PER_SET; // 160
// Phase 18 (2026-05-13) — 한 세트 = 4 sub-column (마킹A | 점수A | 점수B | 마킹B)
const SUB_COLS_PER_SET = 4;

// 모달 상태 — 클릭한 칸 정보 임시 박제
interface ModalContext {
  team: "home" | "away";
  newPosition: number;
  inferredPoints: 1 | 2 | 3;
}

export function RunningScoreGrid({
  state,
  onChange,
  homePlayers,
  awayPlayers,
  homeTeamName,
  awayTeamName,
  disabled,
  frameless,
}: RunningScoreGridProps) {
  // 모달 컨텍스트 — null 이면 모달 닫힘
  const [modalContext, setModalContext] = useState<ModalContext | null>(null);

  // 등번호 lookup — 마킹 표시용 (선수 id → jersey)
  const jerseyMap = new Map<string, number | null>();
  homePlayers.forEach((p) =>
    jerseyMap.set(p.tournamentTeamPlayerId, p.jerseyNumber)
  );
  awayPlayers.forEach((p) =>
    jerseyMap.set(p.tournamentTeamPlayerId, p.jerseyNumber)
  );

  // 마킹 lookup — position → ScoreMark
  const homeMarkMap = new Map<number, ScoreMark>();
  state.home.forEach((m) => homeMarkMap.set(m.position, m));
  const awayMarkMap = new Map<number, ScoreMark>();
  state.away.forEach((m) => awayMarkMap.set(m.position, m));

  // 마지막 마킹 position (1탭 해제 가능 표시)
  const homeLastPos =
    state.home.length === 0 ? 0 : state.home[state.home.length - 1].position;
  const awayLastPos =
    state.away.length === 0 ? 0 : state.away[state.away.length - 1].position;

  // 칸 클릭 핸들러 — 빈 칸이면 모달, 마지막 마킹 칸이면 해제 확인, 그 외 마킹은 안내
  function handleCellClick(team: "home" | "away", position: number) {
    if (disabled) return;
    // PR-S6 (2026-05-14 rev2 롤백) — paper 모드 분기 제거. 시안 rev2 가 모드 토글을 제거.
    const marks = team === "home" ? state.home : state.away;
    const lastPos = team === "home" ? homeLastPos : awayLastPos;
    const markMap = team === "home" ? homeMarkMap : awayMarkMap;
    const existing = markMap.get(position);

    if (existing) {
      // 이미 마킹된 칸 = 마지막 마킹이면 해제 확인 / 아니면 안내
      if (position === lastPos) {
        const confirm = window.confirm(
          `칸 #${position} 마킹을 해제할까요?\n(마지막 득점 1건이 PBP에서도 제거됩니다)`
        );
        if (confirm) {
          onChange(undoLastMark(state, team));
        }
      } else {
        window.alert(
          `이미 마킹된 칸입니다 (#${position}).\n수정하려면 가장 마지막 마킹 칸부터 차례로 해제해주세요.`
        );
      }
      return;
    }

    // 빈 칸 — 점수 종류 추론 + 검증 + 모달 open
    const check = isValidMarkPosition(marks, position, MAX_POSITION);
    if (!check.ok) {
      window.alert(check.reason);
      return;
    }
    setModalContext({
      team,
      newPosition: position,
      inferredPoints: check.points,
    });
  }

  // 모달에서 선수 선택
  function handlePlayerSelect(playerId: string) {
    if (!modalContext) return;
    const next = addMark(
      state,
      modalContext.team,
      modalContext.newPosition,
      playerId,
      modalContext.inferredPoints
    );
    onChange(next);
    setModalContext(null);
  }

  // 1~ROWS_PER_SET (40) 의 row 인덱스 배열
  const rowIndexes = Array.from({ length: ROWS_PER_SET }, (_, i) => i + 1);

  // Phase 8 — frameless 모드: 단일 외곽 박스 안에서 자체 border 제거.
  const wrapperStyle: React.CSSProperties = frameless
    ? {}
    : { border: "1px solid var(--color-border)" };
  const wrapperClass = frameless
    ? "fiba-frameless flex w-full flex-col"
    : "flex w-full flex-col";

  return (
    // Phase 7-A → Phase 8 — 디자인 정합 (FIBA PDF 1:1): radius X / shadow X
    // PR-S6 (2026-05-14 rev2 롤백) — data-score-mode 속성 + paper 안내 텍스트 제거 (모드 토글 제거).
    <div className={wrapperClass} style={wrapperStyle}>
      {/* Phase 19 (2026-05-13) — 헤더 시인성 강화 (사용자 결재 §2 / FIBA 정합).
          - 영역 padding px-2 py-0.5 → px-2 py-1 (상하 4px 여백 일관)
          - "Running Score" 14px font-semibold → 16px font-bold (FIBA 종이기록지 정합)
          - 우측 안내 9px → 10px (가독성 ↑) */}
      <div
        className="flex items-center justify-between px-2 py-1"
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="text-[16px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
          Running Score
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)]">
          P{state.currentPeriod} · 1탭=입력 / 마지막=해제
        </div>
      </div>

      {/* Phase 18 (2026-05-13) — 4 세트 × 4 sub-column = 16 컬럼 가로 배치.
          사용자 결재 §1 / 이미지 43-44 / FIBA PDF 정합.
          한 세트 = 마킹A | 점수A | 점수B | 마킹B (양팀 점수 가운데 모음) */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${SETS * SUB_COLS_PER_SET}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: SETS }).map((_, setIdx) => {
          const offset = setIdx * ROWS_PER_SET;
          // 마지막 세트만 우측 border 제거 (외곽 박스 = wrapper)
          const isLastSet = setIdx === SETS - 1;
          return (
            <SetColumns
              key={setIdx}
              offset={offset}
              rowIndexes={rowIndexes}
              homeMarkMap={homeMarkMap}
              awayMarkMap={awayMarkMap}
              homeLastPos={homeLastPos}
              awayLastPos={awayLastPos}
              jerseyMap={jerseyMap}
              onCellClick={handleCellClick}
              isLastSet={isLastSet}
            />
          );
        })}
      </div>

      {/* 모달 — Phase 2 핵심 UX */}
      <PlayerSelectModal
        open={modalContext !== null}
        team={modalContext?.team ?? "home"}
        teamName={
          modalContext?.team === "away" ? awayTeamName : homeTeamName
        }
        players={modalContext?.team === "away" ? awayPlayers : homePlayers}
        inferredPoints={modalContext?.inferredPoints ?? null}
        newPosition={modalContext?.newPosition ?? null}
        onSelect={handlePlayerSelect}
        onClose={() => setModalContext(null)}
      />
    </div>
  );
}

// Phase 18 — 한 세트 (40 row) = 4 sub-column (마킹A | 점수A | 점수B | 마킹B)
// 양팀 점수가 가운데로 모이고 좌우에 마킹 칸 배치 — FIBA PDF 정합 (이미지 43-44)
interface SetColumnsProps {
  offset: number; // 0 / 40 / 80 / 120
  rowIndexes: number[]; // 1..40
  homeMarkMap: Map<number, ScoreMark>;
  awayMarkMap: Map<number, ScoreMark>;
  homeLastPos: number;
  awayLastPos: number;
  jerseyMap: Map<string, number | null>;
  onCellClick: (team: "home" | "away", position: number) => void;
  isLastSet: boolean;
}

function SetColumns({
  offset,
  rowIndexes,
  homeMarkMap,
  awayMarkMap,
  homeLastPos,
  awayLastPos,
  jerseyMap,
  onCellClick,
  isLastSet,
}: SetColumnsProps) {
  // Phase 18 — 마지막 세트의 마킹B 컬럼만 우측 border 제거 (wrapper 외곽이 처리)
  const lastColBorder = isLastSet ? undefined : "1px solid var(--color-border)";

  return (
    <>
      {/* (1) 마킹A 컬럼 — A팀 (홈) 마킹 칸. 클릭 가능. */}
      <div className="flex flex-col">
        <ColumnHeader label="A" />
        {rowIndexes.map((rowIdx) => {
          const position = offset + rowIdx;
          const mark = homeMarkMap.get(position);
          const isLast = position === homeLastPos;
          return (
            <MarkCell
              key={`ma-${position}`}
              position={position}
              mark={mark}
              isLast={isLast}
              jerseyNumber={
                mark ? (jerseyMap.get(mark.playerId) ?? null) : null
              }
              onClick={() => onCellClick("home", position)}
              side="home"
            />
          );
        })}
      </div>

      {/* (2) 점수A 컬럼 — A팀 누적 점수 인쇄 영역. 클릭 불가 (FIBA 정합). */}
      <div
        className="flex flex-col"
        style={{ borderRight: "1px solid var(--color-border)" }}
      >
        <ColumnHeader label="" />
        {rowIndexes.map((rowIdx) => {
          const position = offset + rowIdx;
          return <PrintScoreCell key={`pa-${position}`} position={position} />;
        })}
      </div>

      {/* (3) 점수B 컬럼 — B팀 누적 점수 인쇄 영역. 클릭 불가 (FIBA 정합). */}
      <div className="flex flex-col">
        <ColumnHeader label="" />
        {rowIndexes.map((rowIdx) => {
          const position = offset + rowIdx;
          return <PrintScoreCell key={`pb-${position}`} position={position} />;
        })}
      </div>

      {/* (4) 마킹B 컬럼 — B팀 (어웨이) 마킹 칸. 클릭 가능. */}
      <div
        className="flex flex-col"
        style={{ borderRight: lastColBorder }}
      >
        <ColumnHeader label="B" />
        {rowIndexes.map((rowIdx) => {
          const position = offset + rowIdx;
          const mark = awayMarkMap.get(position);
          const isLast = position === awayLastPos;
          return (
            <MarkCell
              key={`mb-${position}`}
              position={position}
              mark={mark}
              isLast={isLast}
              jerseyNumber={
                mark ? (jerseyMap.get(mark.playerId) ?? null) : null
              }
              onClick={() => onCellClick("away", position)}
              side="away"
            />
          );
        })}
      </div>
    </>
  );
}

// Phase 19 — 컬럼 헤더 (A / 빈 / 빈 / B 4종) 폰트 강화.
//   10px font-semibold → 11px font-bold (FIBA 정합 / 사용자 결재 §2).
//   높이 h-5 (20px) 유지 — A4 fit 영향 0.
function ColumnHeader({ label }: { label: string }) {
  return (
    <div
      className="flex h-5 items-center justify-center text-[11px] font-bold uppercase tracking-wider"
      style={{
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text-muted)",
        borderRight: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {label}
    </div>
  );
}

// Phase 18 — 점수 인쇄 칸 (클릭 불가 / FIBA PDF 정합)
//   왜: FIBA 양식 = 점수 칸은 1~160 숫자가 박제되어 있고 마킹은 좌우 마킹 칸에만 한다.
//   어떻게: position 숫자 회색 노출 / button 아닌 div (클릭/포커스 불가).
//
// Phase 19 (2026-05-13) — 시인성 강화 (사용자 결재 §3·§4).
//   - position 숫자 7px → 9px font-semibold (가독성 ↑).
//   - 행 높이 16px → 17px (40 row × 17 = 680px / A4 우측 fit OK).
function PrintScoreCell({ position }: { position: number }) {
  return (
    <div
      className="flex w-full items-center justify-center text-[9px] font-semibold"
      style={{
        height: "17px",
        borderRight: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text-muted)",
      }}
      aria-hidden="true"
    >
      {position}
    </div>
  );
}

// Phase 18 — 마킹 칸 (클릭 가능 / FIBA 정합 점/●/●+○ 표기)
interface MarkCellProps {
  position: number;
  mark: ScoreMark | undefined;
  isLast: boolean;
  jerseyNumber: number | null;
  onClick: () => void;
  side: "home" | "away";
}

function MarkCell({
  position,
  mark,
  isLast,
  jerseyNumber,
  onClick,
  side,
}: MarkCellProps) {
  // Phase 19 (2026-05-13) — 행 높이 16 → 17px (PrintScoreCell 와 일치 / 사용자 결재 §4 / 시인성 ↑)
  const baseStyle = {
    height: "17px",
    borderRight: "1px solid var(--color-border)",
    borderBottom: "1px solid var(--color-border)",
    touchAction: "manipulation",
  } as const;

  // 빈 마킹 칸 — 클릭 가능 (모달 open).
  // Phase 19 — 빈 칸 점 글자 8px → 9px (시인성 ↑ / 클릭 영역 인지).
  if (!mark) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-center text-[9px]"
        style={{
          ...baseStyle,
          backgroundColor: "var(--color-bg)",
          color: "color-mix(in srgb, var(--color-text-muted) 30%, transparent)",
        }}
        aria-label={`${side === "home" ? "A팀" : "B팀"} 마킹 칸 ${position} (빈 칸)`}
      >
        ·
      </button>
    );
  }

  // Phase 17 (2026-05-13) — 쿼터별 색 매핑 (사용자 결재 §2 / 이미지 14:00 KST).
  //   왜: FIBA 단색 → 운영자 인지 향상. Q1~Q4 + OT 별 색 차이로 마킹 시점 한눈에.
  //   어떻게: getPeriodColor(mark.period) 헬퍼 단일 source.
  //   글리프 색 + 등번호 색 모두 동일 (마킹 단위 통일).
  const periodColor = getPeriodColor(mark.period);

  return (
    // Phase 19 — 글자 8px → 9px font-bold (마킹 시인성 강화 / 사용자 결재 §4).
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-0.5 text-[9px] font-bold"
      style={{
        ...baseStyle,
        // 마지막 = accent 음영 강조 / 그 외 = 진한 surface
        backgroundColor: isLast
          ? "color-mix(in srgb, var(--color-accent) 25%, var(--color-bg))"
          : "color-mix(in srgb, var(--color-text-primary) 8%, var(--color-bg))",
        color: periodColor,
      }}
      aria-label={`${side === "home" ? "A팀" : "B팀"} 마킹 ${position} (${mark.points}점)${isLast ? " — 마지막, 해제 가능" : ""}`}
      title={`#${position} · ${mark.points}점 · P${mark.period}${
        jerseyNumber !== null ? ` · #${jerseyNumber}` : ""
      }`}
    >
      {/* Phase 18 — FIBA 정합 1/2/3점 아이콘 (· / ● / ●+○). 색 = Q별 색 (Phase 17 유지). */}
      <ScoreMarkIcon points={mark.points} color={periodColor} />
      {/* Phase 19 — 등번호 6px → 8px font-bold (가독성 ↑ / FIBA 종이기록지 등번호는 진하게 표기). */}
      {jerseyNumber !== null && (
        <span className="text-[8px] font-bold" style={{ color: periodColor }}>
          {jerseyNumber}
        </span>
      )}
    </button>
  );
}

/**
 * Phase 18 (2026-05-13) — FIBA 표준 1/2/3점 시각 표기.
 *
 * 왜 (이유):
 *   FIBA PDF (이미지 43-44) = 자유투/필드/3점 시각 구분.
 *     1점 (자유투) = 작은 점 ·
 *     2점 (필드골) = 큰 점 ●
 *     3점 (3점슛) = 큰 점 + 외곽 동그라미 ●(○)
 *   사용자 결재 §2.
 *
 * 어떻게:
 *   - 1점: 작은 점 (6px text)
 *   - 2점: 큰 점 ● (8px)
 *   - 3점: ● + 외곽 1px border-radius:50% 정사각 (W=H=10px / 디자인 토큰 §10 정사각 50% 룰 준수)
 */
function ScoreMarkIcon({
  points,
  color,
}: {
  points: 1 | 2 | 3;
  color: string;
}) {
  // Phase 18 — 단일 source (lib/running-score-helpers.ts getScoreMarkVariant) 위임.
  // 회귀 가드 vitest 와 일치한 분기 — UI 와 lib 가 동일 키 비교.
  const variant = getScoreMarkVariant(points);

  // Phase 19 (2026-05-13) — 글리프 크기 미세 강화 (사용자 결재 §4 / 가독성 ↑).
  //   1점 · = 10px → 11px / 2점 ● = 8px → 9px / 3점 외곽 ○ = 10×10 → 11×11 + 내부 ● 7px → 8px.
  if (variant === "dot") {
    return (
      <span
        className="leading-none"
        style={{ color, fontSize: "11px" }}
        aria-hidden="true"
      >
        ·
      </span>
    );
  }
  if (variant === "filled") {
    return (
      <span
        className="leading-none"
        style={{ color, fontSize: "9px" }}
        aria-hidden="true"
      >
        ●
      </span>
    );
  }
  // filled-ring (3점) — 정사각 W=H 룰 = 50% 허용 (CLAUDE.md §10)
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{
        width: "11px",
        height: "11px",
        borderRadius: "50%",
        border: `1px solid ${color}`,
      }}
      aria-hidden="true"
    >
      <span
        className="leading-none"
        style={{ color, fontSize: "8px" }}
      >
        ●
      </span>
    </span>
  );
}
