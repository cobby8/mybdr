/**
 * RunningScoreGrid — FIBA SCORESHEET 우측 절반 핵심 grid (4 세트 × A|B × 40 row).
 *
 * 2026-05-12 — Phase 2 신규.
 *
 * 왜 (이유):
 *   FIBA 양식 우측 = Running Score 1-160 시계열 마킹. 운영자가 양식 그대로 1탭 마킹 →
 *   점수 종류 자동 추론 → PBP event 생성 → Period 자동 합산 → Final/Winner 자동.
 *
 * 방법 (어떻게):
 *   - 4 세트 × A|B = 8 컬럼. 각 세트 40 row (1~40, 41~80, 81~120, 121~160).
 *   - 빈 칸 = 흰 배경 + 숫자 표시 → 클릭 시 PlayerSelectModal open
 *   - 마킹 칸 = ● + 선수 등번호 작게 표시 → 마지막 마킹 1탭 = 해제 (음영 강조 + alert 확인)
 *   - 점수 추론: isValidMarkPosition 헬퍼 (1/2/3 점만 허용)
 *
 * 768×1024 정합:
 *   - 컨테이너 폭 = 384px (768 × 50%)
 *   - 칸 = 약 22×16 px (a4 양식 정합 우선) — 칸 자체 작아도 모달로 터치 보완
 *   - 글꼴 = 9~10px (가독성 한계 + FIBA 양식 정합)
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ / 강조 = var(--color-accent)
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
} from "@/lib/score-sheet/running-score-helpers";
import { PlayerSelectModal } from "./player-select-modal";

interface RunningScoreGridProps {
  state: RunningScoreState;
  onChange: (next: RunningScoreState) => void;
  homePlayers: RosterItem[];
  awayPlayers: RosterItem[];
  homeTeamName: string;
  awayTeamName: string;
  disabled?: boolean;
}

// FIBA 양식 = 4 세트, 각 세트 = 40 row, A|B 두 컬럼
const SETS = 4;
const ROWS_PER_SET = 40;
const MAX_POSITION = SETS * ROWS_PER_SET; // 160

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

  return (
    // Phase 7-A — 디자인 정합 (FIBA PDF 1:1): radius X / shadow X / 단일 외곽 박스
    <div
      className="flex w-full flex-col"
      style={{ border: "1px solid var(--color-border)" }}
    >
      {/* 제목 — FIBA 양식 라벨 */}
      <div
        className="flex items-center justify-between px-2 py-1"
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-primary)]">
          Running Score
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)]">
          Period {state.currentPeriod} · 1탭 = 득점 입력 / 마지막 칸 1탭 = 해제
        </div>
      </div>

      {/* 4 세트 가로 배치 — 768px 안 8 컬럼 */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${SETS * 2}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: SETS }).map((_, setIdx) => {
          const offset = setIdx * ROWS_PER_SET;
          return (
            <SetColumns
              key={setIdx}
              setLabel={`Set ${setIdx + 1}`}
              offset={offset}
              rowIndexes={rowIndexes}
              homeMarkMap={homeMarkMap}
              awayMarkMap={awayMarkMap}
              homeLastPos={homeLastPos}
              awayLastPos={awayLastPos}
              jerseyMap={jerseyMap}
              onCellClick={handleCellClick}
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

// 한 세트 (40 row) = A 컬럼 + B 컬럼 — 분리해서 React.memo 최적화 가능 (현재 미적용 — Phase 후속)
interface SetColumnsProps {
  setLabel: string;
  offset: number; // 0 / 40 / 80 / 120
  rowIndexes: number[]; // 1..40
  homeMarkMap: Map<number, ScoreMark>;
  awayMarkMap: Map<number, ScoreMark>;
  homeLastPos: number;
  awayLastPos: number;
  jerseyMap: Map<string, number | null>;
  onCellClick: (team: "home" | "away", position: number) => void;
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
}: SetColumnsProps) {
  return (
    <>
      {/* A 컬럼 */}
      <div className="flex flex-col">
        {/* 헤더 라벨 = "A" */}
        <div
          className="flex h-5 items-center justify-center text-[10px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-muted)",
            borderRight: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          A
        </div>
        {rowIndexes.map((rowIdx) => {
          const position = offset + rowIdx;
          const mark = homeMarkMap.get(position);
          const isLast = position === homeLastPos;
          return (
            <RunningScoreCell
              key={position}
              position={position}
              mark={mark}
              isLast={isLast}
              jerseyNumber={
                mark ? (jerseyMap.get(mark.playerId) ?? null) : null
              }
              onClick={() => onCellClick("home", position)}
            />
          );
        })}
      </div>

      {/* B 컬럼 */}
      <div
        className="flex flex-col"
        style={{ borderRight: "1px solid var(--color-border)" }}
      >
        <div
          className="flex h-5 items-center justify-center text-[10px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-muted)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          B
        </div>
        {rowIndexes.map((rowIdx) => {
          const position = offset + rowIdx;
          const mark = awayMarkMap.get(position);
          const isLast = position === awayLastPos;
          return (
            <RunningScoreCell
              key={position}
              position={position}
              mark={mark}
              isLast={isLast}
              jerseyNumber={
                mark ? (jerseyMap.get(mark.playerId) ?? null) : null
              }
              onClick={() => onCellClick("away", position)}
            />
          );
        })}
      </div>
    </>
  );
}

// 단일 칸 컴포넌트 — 빈 칸 / 마킹 칸 / 마지막 마킹 분기
interface CellProps {
  position: number;
  mark: ScoreMark | undefined;
  isLast: boolean;
  jerseyNumber: number | null;
  onClick: () => void;
}

function RunningScoreCell({
  position,
  mark,
  isLast,
  jerseyNumber,
  onClick,
}: CellProps) {
  // 빈 칸 = 흰 배경 + 회색 숫자
  // 마킹 칸 = ● + 등번호 (작게)
  // 마지막 마킹 = 음영 강조 (해제 가능 안내)
  const baseStyle = {
    height: "16px",
    borderRight: "1px solid var(--color-border)",
    borderBottom: "1px solid var(--color-border)",
    touchAction: "manipulation",
  } as const;

  if (!mark) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-center text-[9px]"
        style={{
          ...baseStyle,
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text-muted)",
        }}
        aria-label={`칸 ${position} (빈 칸)`}
      >
        {position}
      </button>
    );
  }

  // 마킹 칸 — points 시각 구분: 1=● / 2=◉ / 3=◎
  const markGlyph =
    mark.points === 1 ? "●" : mark.points === 2 ? "◉" : "◎";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-0.5 text-[8px] font-semibold"
      style={{
        ...baseStyle,
        // 마지막 = accent 음영 강조 / 그 외 = 진한 surface
        backgroundColor: isLast
          ? "color-mix(in srgb, var(--color-accent) 25%, var(--color-bg))"
          : "color-mix(in srgb, var(--color-text-primary) 8%, var(--color-bg))",
        color: "var(--color-text-primary)",
      }}
      aria-label={`칸 ${position} 마킹${isLast ? " (마지막 — 해제 가능)" : ""}`}
      title={`#${position} · ${mark.points}점 · P${mark.period}${
        jerseyNumber !== null ? ` · #${jerseyNumber}` : ""
      }`}
    >
      <span style={{ color: "var(--color-accent)" }}>{markGlyph}</span>
      {jerseyNumber !== null && <span>{jerseyNumber}</span>}
    </button>
  );
}
