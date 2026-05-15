/**
 * useScoreSheetRecordState — 핵심 기록 state 묶음.
 *
 * 2026-05-15 (PR-D-4c / P1-1 분해) — 전수조사 P1-1 form 분해 4-c (최종) 단계.
 *   runningScore / fouls / timeouts / playerStats / lineup + lineupModalOpen 6건.
 *
 * 박제 룰 (보존 의무):
 *   - 모든 state 초기값 = initial prop ?? EMPTY_* (page.tsx server side 박제 / 신규 매치 = undefined → EMPTY).
 *   - lineup === null = 모달 강제 표시 (lineupModalOpen=true).
 *   - lineup 확정 시 = 모달 닫힘 (lineupModalOpen=false).
 *   - initialLineupComputed = home/away 둘 다 있을 때만 valid (한쪽 null = 모달).
 *
 * 사용:
 *   const record = useScoreSheetRecordState({ initialRunningScore, initialFouls, ... });
 *   record.runningScore / record.setRunningScore / ...
 */

import { useState } from "react";
import type { RunningScoreState } from "@/lib/score-sheet/running-score-types";
import { EMPTY_RUNNING_SCORE } from "@/lib/score-sheet/running-score-helpers";
import type { FoulsState } from "@/lib/score-sheet/foul-types";
import { EMPTY_FOULS } from "@/lib/score-sheet/foul-types";
import type { TimeoutsState } from "@/lib/score-sheet/timeout-types";
import { EMPTY_TIMEOUTS } from "@/lib/score-sheet/timeout-types";
import type { PlayerStatsState } from "@/lib/score-sheet/player-stats-types";
import { EMPTY_PLAYER_STATS } from "@/lib/score-sheet/player-stats-types";
import type { TeamLineupSelection } from "../_components/lineup-selection-modal";

interface UseRecordStateInit {
  initialRunningScore?: RunningScoreState;
  initialFouls?: FoulsState;
  initialTimeouts?: TimeoutsState;
  initialPlayerStats?: PlayerStatsState;
  initialLineup?: {
    home?: TeamLineupSelection | null;
    away?: TeamLineupSelection | null;
  };
}

type LineupState = {
  home: TeamLineupSelection;
  away: TeamLineupSelection;
} | null;

export interface ScoreSheetRecordState {
  runningScore: RunningScoreState;
  setRunningScore: React.Dispatch<React.SetStateAction<RunningScoreState>>;
  fouls: FoulsState;
  setFouls: React.Dispatch<React.SetStateAction<FoulsState>>;
  timeouts: TimeoutsState;
  setTimeouts: React.Dispatch<React.SetStateAction<TimeoutsState>>;
  playerStats: PlayerStatsState;
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStatsState>>;
  lineup: LineupState;
  setLineup: React.Dispatch<React.SetStateAction<LineupState>>;
  lineupModalOpen: boolean;
  setLineupModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** initialLineup 검증 결과 (home + away 둘 다 있을 때만 LineupState, 아니면 null). */
  initialLineupComputed: LineupState;
}

export function useScoreSheetRecordState(
  init: UseRecordStateInit = {},
): ScoreSheetRecordState {
  const [runningScore, setRunningScore] = useState<RunningScoreState>(
    init.initialRunningScore ?? EMPTY_RUNNING_SCORE,
  );
  const [fouls, setFouls] = useState<FoulsState>(
    init.initialFouls ?? EMPTY_FOULS,
  );
  const [timeouts, setTimeouts] = useState<TimeoutsState>(
    init.initialTimeouts ?? EMPTY_TIMEOUTS,
  );
  const [playerStats, setPlayerStats] = useState<PlayerStatsState>(
    init.initialPlayerStats ?? EMPTY_PLAYER_STATS,
  );

  const initialLineupComputed: LineupState =
    init.initialLineup?.home && init.initialLineup?.away
      ? { home: init.initialLineup.home, away: init.initialLineup.away }
      : null;
  const [lineup, setLineup] = useState<LineupState>(initialLineupComputed);
  const [lineupModalOpen, setLineupModalOpen] = useState<boolean>(
    initialLineupComputed === null,
  );

  return {
    runningScore,
    setRunningScore,
    fouls,
    setFouls,
    timeouts,
    setTimeouts,
    playerStats,
    setPlayerStats,
    lineup,
    setLineup,
    lineupModalOpen,
    setLineupModalOpen,
    initialLineupComputed,
  };
}
