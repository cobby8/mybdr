/**
 * useScoreSheetInputState — input state 묶음 (header / signatures / teamA / teamB).
 *
 * 2026-05-15 (PR-D-4b / P1-1 분해) — 전수조사 P1-1 form 분해 4-b 단계.
 *   form 안 단순 input state 4건 (FIBA 헤더 / 풋터 서명 / 양 팀 Coach) 을
 *   훅으로 묶음. 핵심 기록 state (runningScore / fouls / lineup) 는 4-c.
 *
 * 박제 룰 (보존 의무):
 *   - useState lazy init (initial prop 변경 시 stale 안전).
 *   - EMPTY_HEADER / EMPTY_TEAM = 호환 default (외부 import 도 가능하도록 export).
 *   - signatures = initialSignatures + EMPTY_SIGNATURES spread + initialNotes 우선.
 *   - teamA / teamB = EMPTY_TEAM 시작 (initial 데이터 없음 — Coach 는 사용자 입력).
 *
 * 사용:
 *   const input = useScoreSheetInputState({ initialSignatures, initialNotes });
 *   input.header / input.setHeader / input.signatures / input.setSignatures / ...
 */

import { useState } from "react";
import type { FibaHeaderInputs } from "../_components/fiba-header";
import type { TeamSectionInputs } from "../_components/team-section";
import type { SignaturesState } from "@/lib/score-sheet/signature-types";
import { EMPTY_SIGNATURES } from "@/lib/score-sheet/signature-types";

export const EMPTY_HEADER: FibaHeaderInputs = {
  referee: "",
  umpire1: "",
  umpire2: "",
};

export const EMPTY_TEAM: TeamSectionInputs = {
  coach: "",
  asstCoach: "",
  players: {},
};

interface UseInputStateInit {
  initialSignatures?: Partial<SignaturesState>;
  initialNotes?: string;
}

export interface ScoreSheetInputState {
  header: FibaHeaderInputs;
  setHeader: React.Dispatch<React.SetStateAction<FibaHeaderInputs>>;
  signatures: SignaturesState;
  setSignatures: React.Dispatch<React.SetStateAction<SignaturesState>>;
  teamA: TeamSectionInputs;
  setTeamA: React.Dispatch<React.SetStateAction<TeamSectionInputs>>;
  teamB: TeamSectionInputs;
  setTeamB: React.Dispatch<React.SetStateAction<TeamSectionInputs>>;
}

export function useScoreSheetInputState(
  init: UseInputStateInit = {},
): ScoreSheetInputState {
  const [header, setHeader] = useState<FibaHeaderInputs>(EMPTY_HEADER);
  const [teamA, setTeamA] = useState<TeamSectionInputs>(EMPTY_TEAM);
  const [teamB, setTeamB] = useState<TeamSectionInputs>(EMPTY_TEAM);
  const [signatures, setSignatures] = useState<SignaturesState>(() => {
    const base = init.initialSignatures
      ? { ...EMPTY_SIGNATURES, ...init.initialSignatures }
      : EMPTY_SIGNATURES;
    // notes 는 TournamentMatch.notes 컬럼이 우선 (BFF 별도 update 흐름)
    if (init.initialNotes && init.initialNotes.length > 0) {
      return { ...base, notes: init.initialNotes };
    }
    return base;
  });
  return {
    header,
    setHeader,
    signatures,
    setSignatures,
    teamA,
    setTeamA,
    teamB,
    setTeamB,
  };
}
