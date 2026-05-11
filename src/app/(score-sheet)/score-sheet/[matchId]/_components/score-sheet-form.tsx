/**
 * FIBA SCORESHEET 폼 본체 (client) — Phase 1 + Phase 2 통합.
 *
 * 2026-05-11 — Phase 1 신규 (planner-architect §B §컴포넌트 트리)
 * 2026-05-12 — Phase 2 확장 (RunningScoreGrid + PeriodScoresSection + PlayerSelectModal)
 *
 * 왜 (이유):
 *   FIBA 양식 1 페이지 A4 세로를 좌·우 절반으로 분할. Phase 1 = 좌측 (헤더 + 팀 명단),
 *   Phase 2 = 우측 (Running Score grid + Period 자동 합산 + Final + Winner).
 *
 * 방법 (어떻게):
 *   - localStorage draft (5초 throttle / key = "fiba-score-sheet-draft-{matchId}")
 *     Phase 2: runningScore state 도 draft 에 포함 → reload 후 입력 복원
 *   - 상태 분리: header / teamA / teamB / runningScore (Phase 2 신규)
 *   - Phase 1 = 제출 없음, Phase 2 = 제출 미연결 (Phase 5 BFF 확장 시 활성화)
 *   - 모바일 가로 차단 = layout 의 RotationGuard 가 담당
 *
 * 절대 룰:
 *   - API / BFF 시그니처 변경 0 (Phase 2 도 UI 만 — Phase 5 진입 시 제출 BFF 확장)
 *   - service syncSingleMatch 호출 0 (Phase 5 까지 미연결)
 */

"use client";

import { useEffect, useState } from "react";
import { FibaHeader, type FibaHeaderInputs } from "./fiba-header";
import { TeamSection, type TeamSectionInputs } from "./team-section";
import { RunningScoreGrid } from "./running-score-grid";
import { PeriodScoresSection } from "./period-scores-section";
import { FoulTypeModal } from "./foul-type-modal";
import { MatchEndButton } from "./match-end-button";
import type { TeamRosterData } from "./team-section-types";
import type { RunningScoreState } from "@/lib/score-sheet/running-score-types";
import {
  EMPTY_RUNNING_SCORE,
  computeFinalScore,
  toQuarterScoresJson,
} from "@/lib/score-sheet/running-score-helpers";
import type { FoulsState, FoulType } from "@/lib/score-sheet/foul-types";
import { EMPTY_FOULS } from "@/lib/score-sheet/foul-types";
import {
  addFoul,
  getTeamFoulCountByPeriod,
  removeLastFoul,
} from "@/lib/score-sheet/foul-helpers";
import type { TimeoutsState } from "@/lib/score-sheet/timeout-types";
import { EMPTY_TIMEOUTS } from "@/lib/score-sheet/timeout-types";
import {
  addTimeout,
  removeLastTimeout,
} from "@/lib/score-sheet/timeout-helpers";
import type { SignaturesState } from "@/lib/score-sheet/signature-types";
import { EMPTY_SIGNATURES } from "@/lib/score-sheet/signature-types";
import { FooterSignatures } from "./footer-signatures";
import { useToast } from "@/contexts/toast-context";
// Phase 7-B — 라인업 선택 모달 (오늘 출전 명단 + 선발 5인)
import {
  LineupSelectionModal,
  type LineupSelectionResult,
  type TeamLineupSelection,
} from "./lineup-selection-modal";
// Phase 7-C — Q4/OT 종료 분기 모달
import { QuarterEndModal } from "./quarter-end-modal";

interface MatchProp {
  id: string;
  tournamentId: string;
  match_code: string | null;
  scheduledAtLabel: string | null; // "2026-05-11 14:00" 류 (page.tsx 에서 toLocaleString 처리)
  courtLabel: string | null;
}

interface TournamentProp {
  id: string;
  name: string;
}

interface ScoreSheetFormProps {
  match: MatchProp;
  tournament: TournamentProp;
  homeRoster: TeamRosterData;
  awayRoster: TeamRosterData;
  // Phase 7-B — 사전 라인업 (MatchLineupConfirmed) 박제 정보.
  //   page.tsx 가 양 팀 starters/substitutes (string[]) 를 별도 prop 으로 전달.
  //   hasConfirmedLineup=true + starters=5 + substitutes 일 때 → 모달 skip + 자동 fill.
  //   hasConfirmedLineup=false → 모달 강제 표시 → 운영자 입력 → upsert 박제.
  initialLineup?: {
    home: TeamLineupSelection | null; // null = 사전 미박제
    away: TeamLineupSelection | null;
  };
}

// localStorage key prefix — 매치당 1건 (Phase 1 FIBA 양식 신규 prefix)
const DRAFT_KEY_PREFIX = "fiba-score-sheet-draft-";

const EMPTY_HEADER: FibaHeaderInputs = {
  referee: "",
  umpire1: "",
  umpire2: "",
};

const EMPTY_TEAM: TeamSectionInputs = {
  coach: "",
  asstCoach: "",
  players: {},
};

interface DraftPayload {
  header: FibaHeaderInputs;
  teamA: TeamSectionInputs;
  teamB: TeamSectionInputs;
  runningScore: RunningScoreState;
  // Phase 3 — fouls 박제 (mid-game reload 후 파울 마킹 복원)
  fouls: FoulsState;
  // Phase 4 — timeouts 박제 (mid-game reload 후 타임아웃 마킹 복원)
  timeouts: TimeoutsState;
  // Phase 5 — signatures + notes 박제 (mid-game reload 후 서명 복원)
  signatures: SignaturesState;
  // Phase 7-B — 라인업 박제 (mid-game reload 후 출전 명단 / 선발 5인 복원)
  //   미박제 (모달 미통과) = null
  lineup: { home: TeamLineupSelection; away: TeamLineupSelection } | null;
  savedAt: string;
}

export function ScoreSheetForm({
  match,
  tournament,
  homeRoster,
  awayRoster,
  initialLineup,
}: ScoreSheetFormProps) {
  const [header, setHeader] = useState<FibaHeaderInputs>(EMPTY_HEADER);
  const [teamA, setTeamA] = useState<TeamSectionInputs>(EMPTY_TEAM);
  const [teamB, setTeamB] = useState<TeamSectionInputs>(EMPTY_TEAM);
  // Phase 2 — Running Score state
  const [runningScore, setRunningScore] = useState<RunningScoreState>(
    EMPTY_RUNNING_SCORE
  );
  // Phase 3 — Fouls state (FIBA 1-5 Player Fouls + Team Fouls 자동 합산 source)
  const [fouls, setFouls] = useState<FoulsState>(EMPTY_FOULS);
  // Phase 4 — Timeouts state (FIBA Article 18-19 전반2/후반3/OT1)
  const [timeouts, setTimeouts] = useState<TimeoutsState>(EMPTY_TIMEOUTS);
  // Phase 5 — Signatures state (FIBA 양식 풋터 8 입력 + notes)
  const [signatures, setSignatures] = useState<SignaturesState>(EMPTY_SIGNATURES);
  // Phase 3.5 — FoulTypeModal state (어떤 선수의 어떤 팀에 추가할지)
  const [foulModalCtx, setFoulModalCtx] = useState<{
    team: "home" | "away";
    playerId: string;
    playerName: string;
    jerseyNumber: number | null;
  } | null>(null);
  // Phase 7-B — 라인업 state.
  //   - lineup === null → 모달 강제 표시 (양식 미렌더)
  //   - lineup === { home, away } → 양식 렌더 (출전 명단만 12행 X / 실제 명수 표시)
  //
  //   초기값:
  //     1. initialLineup.home/away 가 확정 = 사전 박제 → 모달 skip + 자동 fill
  //     2. 미확정 (둘 중 하나라도 null) → null → 모달 강제 표시
  //
  //   draft localStorage 복원 후 lineup 이 박제되어 있으면 그 값 우선 (운영 중 reload 케이스).
  const initialLineupComputed: {
    home: TeamLineupSelection;
    away: TeamLineupSelection;
  } | null =
    initialLineup?.home && initialLineup?.away
      ? { home: initialLineup.home, away: initialLineup.away }
      : null;
  const [lineup, setLineup] = useState<{
    home: TeamLineupSelection;
    away: TeamLineupSelection;
  } | null>(initialLineupComputed);
  // 모달 명시적 control — open 토글 (라인업 미확정 시 자동 true / 확정 시 false)
  const [lineupModalOpen, setLineupModalOpen] = useState<boolean>(
    initialLineupComputed === null
  );
  // Phase 7-C — Q4 / OT 종료 분기 modal state
  //   - null = 모달 닫힘
  //   - { mode, period } = 모달 열림 (어떤 종료 시점인지 / 어떤 period 가 종료되었는지)
  const [quarterEndModal, setQuarterEndModal] = useState<{
    mode: "quarter4" | "overtime";
    period: number;
  } | null>(null);
  // toast 알림 — Article 41 차단 + 5+ FT 자유투 부여 안내 + 쿼터 종료
  const { showToast } = useToast();

  // localStorage draft 복원 (mount 1회)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY_PREFIX + match.id);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<DraftPayload>;
        if (draft.header) setHeader(draft.header);
        if (draft.teamA) setTeamA(draft.teamA);
        if (draft.teamB) setTeamB(draft.teamB);
        // Phase 2 — runningScore 복원 (기존 draft 호환: 없으면 EMPTY)
        if (draft.runningScore) {
          // 방어: home/away 배열 + currentPeriod 검증
          const rs = draft.runningScore;
          if (
            Array.isArray(rs.home) &&
            Array.isArray(rs.away) &&
            typeof rs.currentPeriod === "number"
          ) {
            setRunningScore(rs);
          }
        }
        // Phase 3 — fouls 복원 (기존 draft 호환: 없으면 EMPTY)
        if (draft.fouls) {
          const fs = draft.fouls;
          if (Array.isArray(fs.home) && Array.isArray(fs.away)) {
            setFouls(fs);
          }
        }
        // Phase 4 — timeouts 복원 (기존 draft 호환: 없으면 EMPTY)
        if (draft.timeouts) {
          const ts = draft.timeouts;
          if (Array.isArray(ts.home) && Array.isArray(ts.away)) {
            setTimeouts(ts);
          }
        }
        // Phase 5 — signatures 복원 (기존 draft 호환: 없으면 EMPTY).
        //   방어: 객체 검증 + 모든 키가 문자열인지 단순 typeof 체크
        if (draft.signatures && typeof draft.signatures === "object") {
          const sig = draft.signatures;
          if (
            typeof sig.scorer === "string" &&
            typeof sig.refereeSign === "string"
          ) {
            // EMPTY 스프레드로 누락 키 방어 (구버전 draft 호환)
            setSignatures({ ...EMPTY_SIGNATURES, ...sig });
          }
        }
        // Phase 7-B — lineup 복원 (mid-game reload 후 출전 명단 / 선발 5인 유지).
        //   draft 에 lineup 박제되어 있으면 그 값 우선. UI 룰 (starters=5 + lineup≥5) 위반 시 skip.
        if (draft.lineup && typeof draft.lineup === "object") {
          const ln = draft.lineup;
          if (
            ln.home &&
            ln.away &&
            Array.isArray(ln.home.starters) &&
            Array.isArray(ln.home.substitutes) &&
            Array.isArray(ln.away.starters) &&
            Array.isArray(ln.away.substitutes) &&
            ln.home.starters.length === 5 &&
            ln.away.starters.length === 5
          ) {
            setLineup({ home: ln.home, away: ln.away });
            setLineupModalOpen(false);
          }
        }
      }
    } catch {
      // 손상된 draft = 무시
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // localStorage draft 저장 (5초 throttle — 입력 변경 후 일정 시간마다 자동 박제)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      try {
        const draft: DraftPayload = {
          header,
          teamA,
          teamB,
          runningScore,
          fouls,
          timeouts,
          signatures,
          lineup,
          savedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(
          DRAFT_KEY_PREFIX + match.id,
          JSON.stringify(draft)
        );
      } catch {
        // localStorage quota / disabled — 무시
      }
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [header, teamA, teamB, runningScore, fouls, timeouts, signatures, lineup, match.id]);

  // Period 진행/후퇴 — Phase 4 통합 전 임시 버튼 (PeriodScoresSection 안)
  function handleAdvancePeriod() {
    setRunningScore((prev) => ({
      ...prev,
      currentPeriod: Math.min(prev.currentPeriod + 1, 7),
    }));
  }
  function handleRetreatPeriod() {
    setRunningScore((prev) => ({
      ...prev,
      currentPeriod: Math.max(prev.currentPeriod - 1, 1),
    }));
  }

  // Phase 3.5 + Phase 7-C — "쿼터 종료" 큰 버튼 (PeriodScoresSection 의 onEndPeriod).
  //
  // 동작 분기 (사용자 결재 §5 §6):
  //   - period 1~3 종료 = 자동 다음 Period 진입 (기존 동작 유지)
  //   - period 4 (Q4) 종료 = QuarterEndModal 표시 (경기 종료 / OT1 진행 2 버튼)
  //   - period 5~7 (OTn) 종료 = QuarterEndModal 표시 (경기 종료 / 다음 OT 진행 / 동점 시 종료 비활성)
  function handleEndPeriod() {
    const endedPeriod = runningScore.currentPeriod;
    // Q1~Q3 종료 = 기존 동작 (자동 진입)
    if (endedPeriod <= 3) {
      setRunningScore((prev) => ({
        ...prev,
        currentPeriod: Math.min(prev.currentPeriod + 1, 7),
      }));
      showToast(`Q${endedPeriod} 종료 — Q${endedPeriod + 1} 진행`, "info");
      return;
    }
    // Q4 / OT 종료 = 모달 분기 (사용자 결재 §5 §6 — 자동 OT 진입 차단)
    setQuarterEndModal({
      mode: endedPeriod === 4 ? "quarter4" : "overtime",
      period: endedPeriod,
    });
  }

  // Phase 7-C — "경기 종료" 버튼 (QuarterEndModal 안). status="completed" + BFF submit 흐름은
  //   MatchEndButton 의 모달과 동일 — buildSubmitPayload + fetch 호출.
  //
  //   이유: 사용자가 Q4 종료 시점에서 별도 confirm 모달 (MatchEndButton) 통과 안 해도 즉시 종료.
  //   submit 흐름은 MatchEndButton 와 동일 path 사용 (단일 source) — fetch 직접 호출.
  async function handleEndMatchFromQuarterEnd() {
    try {
      const payload = buildSubmitPayload();
      const res = await fetch(`/api/web/score-sheet/${match.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        const errMsg =
          (typeof json?.error === "string" && json.error) ||
          json?.message ||
          "제출 실패 (알 수 없는 오류)";
        showToast(errMsg, "error");
        return;
      }
      showToast("매치 종료 완료 — 라이브 페이지에 발행됩니다.", "success");
      setQuarterEndModal(null);
      // 클라이언트 측 currentPeriod 는 진행 X (status=completed 박제됨)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`제출 실패: ${msg}`, "error");
    }
  }

  // Phase 7-C — "다음 OT 진행" 버튼 (QuarterEndModal 안).
  //   동작: currentPeriod++ (OT1/OT2/OT3 진입) + 모달 close + toast 안내.
  function handleContinueToOvertime() {
    setRunningScore((prev) => ({
      ...prev,
      currentPeriod: Math.min(prev.currentPeriod + 1, 7),
    }));
    const nextPeriod = runningScore.currentPeriod + 1;
    const nextLabel = nextPeriod <= 4 ? `Q${nextPeriod}` : `OT${nextPeriod - 4}`;
    showToast(`${nextLabel} 진행`, "info");
    setQuarterEndModal(null);
  }

  // Phase 3.5 — 파울 추가 요청 (모달 open) / 마지막 해제 / 종류 선택 분리.
  //
  // 흐름:
  //   1. TeamSection 빈 칸 클릭 → handleRequestAddFoul → 모달 open (선수 컨텍스트 박제)
  //   2. 모달에서 종류 선택 → handleSelectFoulType(type) → addFoul + 모달 close + toast 분기
  //   3. TeamSection 마지막 마킹 칸 클릭 → handleRequestRemoveFoul → 즉시 1건 해제

  function handleRequestAddFoul(team: "home" | "away", playerId: string) {
    // 모달 컨텍스트 박제 — 선수 이름 / 등번호 표시용
    const roster = team === "home" ? homeRoster.players : awayRoster.players;
    const player = roster.find((p) => p.tournamentTeamPlayerId === playerId);
    setFoulModalCtx({
      team,
      playerId,
      playerName: player?.displayName ?? "(이름 없음)",
      jerseyNumber: player?.jerseyNumber ?? null,
    });
  }

  function handleRequestRemoveFoul(team: "home" | "away", playerId: string) {
    setFouls((prev) => {
      const next = removeLastFoul(prev, team, playerId);
      if (next !== prev) {
        showToast("파울 1건 해제", "info");
      }
      return next;
    });
  }

  // Phase 4 — 타임아웃 추가 요청 (빈 칸 클릭).
  //
  // 흐름:
  //   1. TeamSection 빈 칸 클릭 → handleRequestAddTimeout
  //   2. addTimeout 호출 → Article 18-19 검증 (전반2/후반3/OT1)
  //   3. ok → state 갱신 + toast "전반 타임아웃 1/2" 류
  //   4. !ok → toast "전반 타임아웃 모두 사용 — 추가 불가" 류 (state 미변경)
  function handleRequestAddTimeout(team: "home" | "away") {
    setTimeouts((prev) => {
      const result = addTimeout(prev, team, {
        period: runningScore.currentPeriod,
      });
      const teamLabel = team === "home" ? "Team A" : "Team B";
      if (!result.ok) {
        // Article 18-19 차단 — toast 에러
        showToast(`${teamLabel} ${result.reason}`, "error");
        return prev;
      }
      // 정상 추가 — toast 안내 (잔여 표시)
      showToast(`${teamLabel} ${result.reason}`, "info");
      return result.state;
    });
  }

  // Phase 4 — 타임아웃 마지막 1건 해제 (마지막 칸 클릭).
  function handleRequestRemoveTimeout(team: "home" | "away") {
    setTimeouts((prev) => {
      const next = removeLastTimeout(prev, team);
      if (next !== prev) {
        const teamLabel = team === "home" ? "Team A" : "Team B";
        showToast(`${teamLabel} 타임아웃 1건 해제`, "info");
      }
      return next;
    });
  }

  // 모달 → 종류 선택 콜백 — addFoul 호출 + Article 41 alert + 5+ FT alert
  function handleSelectFoulType(type: FoulType) {
    if (!foulModalCtx) return;
    const { team, playerId } = foulModalCtx;
    setFouls((prev) => {
      const result = addFoul(prev, team, {
        playerId,
        period: runningScore.currentPeriod,
        type,
      });
      if (!result.ok) {
        // Article 41 차단 (이미 퇴장) — TeamSection 가 차단해야 하지만 안전망
        showToast(result.reason, "error");
        return prev;
      }
      // 마킹 후 합산 — Article 41 / 5+ FT 토스트
      const newTeamFouls =
        team === "home" ? result.state.home : result.state.away;
      const periodTeamCount = getTeamFoulCountByPeriod(
        newTeamFouls,
        runningScore.currentPeriod
      );

      // 5+ Team Fouls = 자유투 부여 toast
      if (periodTeamCount >= 5) {
        const teamLabel = team === "home" ? "Team A" : "Team B";
        showToast(
          `자유투 부여 — ${teamLabel} Period ${runningScore.currentPeriod} ${periodTeamCount}번째 파울`,
          "info"
        );
      }
      // Phase 3.5 — Article 41 퇴장 도달 toast (사유 분기)
      // 이유: 5반칙 / T 2회 / U 2회 / D 1회 = 4가지 사유 차별화 alert (사용자 결재 §1.2)
      const ejection = type;
      // type 자체로 빠른 분기 (D 는 1건만으로도 즉시 퇴장)
      if (ejection === "D") {
        showToast(`Disqualifying — 즉시 퇴장`, "info");
      } else {
        // 추가 후 임계 도달 케이스 검증 — 사유 분기 toast
        const playerFouls = newTeamFouls.filter((f) => f.playerId === playerId);
        const tCount = playerFouls.filter((f) => f.type === "T").length;
        const uCount = playerFouls.filter((f) => f.type === "U").length;
        if (tCount === 2) {
          showToast(`Technical 2회 — 퇴장`, "info");
        } else if (uCount === 2) {
          showToast(`Unsportsmanlike 2회 — 퇴장`, "info");
        } else if (playerFouls.length === 5) {
          // P+T+U+D 합 = 5 (5반칙)
          showToast(`5반칙 — 퇴장`, "info");
        }
      }
      return result.state;
    });
    // 모달 close
    setFoulModalCtx(null);
  }

  // Phase 3.5 — 경기 종료 BFF payload 빌더 (MatchEndButton 가 호출).
  //
  // 이유: status="completed" + running_score + fouls + quarter_scores 동시 박제.
  //   - quarter_scores: Phase 2 toQuarterScoresJson 헬퍼 재사용 (기존 sync API 호환)
  //   - running_score: position-mark 시계열 (PaperPBP score event 박제 source)
  //   - fouls: P/T/U/D 종류 + period (PaperPBP foul event 박제 source)
  //   - referee_main / umpire1 / umpire2 = header state 의 audit context 박제
  function buildSubmitPayload(): unknown {
    const final = computeFinalScore(runningScore);
    const quarterScores = toQuarterScoresJson(runningScore);
    // Phase 5 — signatures payload 박제.
    //   이유: BFF 가 match.settings.signatures JSON 으로 merge UPDATE (Phase 4 timeouts 패턴 재사용).
    //   notes 는 별도 컬럼 (TournamentMatch.notes) 박제 — BFF route 의 별도 update 흐름 활용.
    //   빈 값 키는 schema optional 로 자동 제거 (전송 부하 최소화 — 빈 객체면 통째 생략).
    const hasAnySig =
      signatures.scorer ||
      signatures.asstScorer ||
      signatures.timer ||
      signatures.shotClockOperator ||
      signatures.refereeSign ||
      signatures.umpire1Sign ||
      signatures.umpire2Sign ||
      signatures.captainSignature;
    return {
      home_score: final.homeTotal,
      away_score: final.awayTotal,
      quarter_scores: quarterScores,
      running_score: runningScore,
      fouls,
      // Phase 4 — timeouts (match.settings.timeouts JSON 박제)
      timeouts,
      // Phase 5 — signatures (match.settings.signatures JSON 박제). 빈 객체면 생략
      ...(hasAnySig
        ? {
            signatures: {
              scorer: signatures.scorer || undefined,
              asstScorer: signatures.asstScorer || undefined,
              timer: signatures.timer || undefined,
              shotClockOperator: signatures.shotClockOperator || undefined,
              refereeSign: signatures.refereeSign || undefined,
              umpire1Sign: signatures.umpire1Sign || undefined,
              umpire2Sign: signatures.umpire2Sign || undefined,
              captainSignature: signatures.captainSignature || undefined,
            },
          }
        : {}),
      // Phase 7-B — lineup (MatchLineupConfirmed upsert 박제). 미선택 = 생략.
      //   BFF 가 starters/substitutes 배열 받아 upsert (매치당 home/away 각 1건).
      //   향후 팀장 사전 제출 기능 = 같은 모델 upsert → 단일 source.
      ...(lineup
        ? {
            lineup: {
              home: {
                starters: lineup.home.starters,
                substitutes: lineup.home.substitutes,
              },
              away: {
                starters: lineup.away.starters,
                substitutes: lineup.away.substitutes,
              },
            },
          }
        : {}),
      status: "completed" as const,
      referee_main: header.referee || undefined,
      referee_sub1: header.umpire1 || undefined,
      referee_sub2: header.umpire2 || undefined,
      // Phase 5 — notes (TournamentMatch.notes 컬럼 — BFF route 의 기존 별도 update 흐름).
      //   빈 문자열은 BFF 가 무시 (overwrite 안 함).
      notes: signatures.notes || undefined,
    };
  }

  // Phase 7-B — 출전 명단 필터 + isStarter 재계산.
  //   lineup state 확정 시 양식 (TeamSection / RunningScoreGrid) 에 표시될 선수 = 출전 명단만.
  //   lineup === null = 모달 표시 단계 = 양식 미렌더.
  //
  //   isStarter 재계산: 사전 라인업 (DB) 의 isStarter 가 아닌 본 모달 결과 starters 기준.
  //   이유: 사전 라인업과 기록자 선택이 다를 수 있음 (실제 출전 = 기록자 선택 우선).
  const homeFilteredRoster: TeamRosterData =
    lineup === null
      ? homeRoster
      : (() => {
          const lineupSet = new Set([
            ...lineup.home.starters,
            ...lineup.home.substitutes,
          ]);
          const starterSet = new Set(lineup.home.starters);
          return {
            ...homeRoster,
            players: homeRoster.players
              .filter((p) => lineupSet.has(p.tournamentTeamPlayerId))
              .map((p) => ({
                ...p,
                isStarter: starterSet.has(p.tournamentTeamPlayerId),
                isInLineup: true,
              })),
          };
        })();
  const awayFilteredRoster: TeamRosterData =
    lineup === null
      ? awayRoster
      : (() => {
          const lineupSet = new Set([
            ...lineup.away.starters,
            ...lineup.away.substitutes,
          ]);
          const starterSet = new Set(lineup.away.starters);
          return {
            ...awayRoster,
            players: awayRoster.players
              .filter((p) => lineupSet.has(p.tournamentTeamPlayerId))
              .map((p) => ({
                ...p,
                isStarter: starterSet.has(p.tournamentTeamPlayerId),
                isInLineup: true,
              })),
          };
        })();

  // 모달 → 라인업 확정 콜백
  function handleLineupConfirm(result: LineupSelectionResult) {
    setLineup(result);
    setLineupModalOpen(false);
    showToast("라인업 확정 — 출전 명단만 양식에 표시됩니다.", "info");
  }

  return (
    // Phase 6 — score-sheet-print-root = _print.css 의 인쇄 스코프 prefix.
    //   인쇄 시 본 root 안의 5 영역 (FibaHeader / TeamSection 2개 / RunningScoreGrid /
    //   PeriodScoresSection / FooterSignatures) 가 A4 세로 1 페이지에 합본.
    //   `no-print` 자식들 (모달 / 안내 카드 / Toast) 는 인쇄 시 자동 제거.
    //
    // Phase 7-A — 디자인 정합 (FIBA PDF 1:1).
    //   카드 분리 → 단일 외곽 박스 (border 1px solid + rounded-0). shadow X.
    <main className="score-sheet-print-root mx-auto w-full max-w-screen-md px-2 py-2">
      {/* Phase 7-B — 라인업 미선택 시 진입 시점 안내 카드 + 모달 자동 표시.
          양식은 lineup 확정 후 렌더. */}
      {lineup === null && (
        <div
          className="no-print mb-2 px-3 py-3"
          style={{
            border: "1px solid var(--color-warning)",
            backgroundColor:
              "color-mix(in srgb, var(--color-warning) 12%, transparent)",
            color: "var(--color-warning)",
          }}
        >
          <p className="text-sm font-semibold">
            <span className="material-symbols-outlined mr-1 align-middle text-base">
              warning
            </span>
            오늘 출전 명단을 먼저 선택해주세요
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            기록을 시작하려면 양 팀 출전 명단 + 선발 5인을 선택해야 합니다.
          </p>
          <button
            type="button"
            onClick={() => setLineupModalOpen(true)}
            className="mt-2 px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: "var(--color-warning)",
              color: "#fff",
              border: "1px solid var(--color-warning)",
              touchAction: "manipulation",
            }}
          >
            라인업 선택 열기
          </button>
        </div>
      )}

      {/* Phase 7-B — 라인업 확정 후 양식 표시. 미확정 시 양식 영역 렌더 skip */}
      {lineup !== null && (
        <>
      {/* 상단 1/5 — FibaHeader */}
      <FibaHeader
        teamAName={homeRoster.teamName}
        teamBName={awayRoster.teamName}
        competitionName={tournament.name}
        scheduledAtLabel={match.scheduledAtLabel}
        gameNo={match.match_code ?? match.id}
        placeLabel={match.courtLabel}
        values={header}
        onChange={setHeader}
      />

      {/* Phase 2 = 좌 (TeamSection 2개 stack) + 우 (RunningScore + PeriodScores) */}
      {/* 태블릿 세로 768px 기준 — md 미만 = 1 컬럼, md 이상 = 2 컬럼 */}
      {/* Phase 7-B — 출전 명단만 양식에 표시 (homeFilteredRoster / awayFilteredRoster) */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* 좌측 컬럼 — Team A 상 / Team B 하 */}
        <div className="flex flex-col gap-3">
          <TeamSection
            sideLabel="Team A"
            teamName={homeFilteredRoster.teamName}
            players={homeFilteredRoster.players}
            values={teamA}
            onChange={setTeamA}
            fouls={fouls.home}
            onRequestAddFoul={(playerId) =>
              handleRequestAddFoul("home", playerId)
            }
            onRequestRemoveFoul={(playerId) =>
              handleRequestRemoveFoul("home", playerId)
            }
            currentPeriod={runningScore.currentPeriod}
            timeouts={timeouts.home}
            onRequestAddTimeout={() => handleRequestAddTimeout("home")}
            onRequestRemoveTimeout={() => handleRequestRemoveTimeout("home")}
          />
          <TeamSection
            sideLabel="Team B"
            teamName={awayFilteredRoster.teamName}
            players={awayFilteredRoster.players}
            values={teamB}
            onChange={setTeamB}
            fouls={fouls.away}
            onRequestAddFoul={(playerId) =>
              handleRequestAddFoul("away", playerId)
            }
            onRequestRemoveFoul={(playerId) =>
              handleRequestRemoveFoul("away", playerId)
            }
            currentPeriod={runningScore.currentPeriod}
            timeouts={timeouts.away}
            onRequestAddTimeout={() => handleRequestAddTimeout("away")}
            onRequestRemoveTimeout={() => handleRequestRemoveTimeout("away")}
          />
        </div>

        {/* 우측 컬럼 — Running Score grid + Period scores */}
        <div className="flex flex-col gap-3">
          <RunningScoreGrid
            state={runningScore}
            onChange={setRunningScore}
            homePlayers={homeFilteredRoster.players}
            awayPlayers={awayFilteredRoster.players}
            homeTeamName={homeFilteredRoster.teamName}
            awayTeamName={awayFilteredRoster.teamName}
          />
          <PeriodScoresSection
            state={runningScore}
            homeTeamName={homeFilteredRoster.teamName}
            awayTeamName={awayFilteredRoster.teamName}
            onAdvancePeriod={handleAdvancePeriod}
            onRetreatPeriod={handleRetreatPeriod}
            onEndPeriod={handleEndPeriod}
          />
        </div>
      </div>

      {/* Phase 5 — FooterSignatures (FIBA 양식 풋터 8 입력 + notes).
          이유: 헤더 referee/umpire1/umpire2 → 풋터 refereeSign/umpire1Sign/umpire2Sign 자동 prefill.
          MatchEndButton 위에 배치 = 경기 종료 전 서명 입력 흐름. */}
      <FooterSignatures
        values={signatures}
        onChange={setSignatures}
        headerReferee={header.referee}
        headerUmpire1={header.umpire1}
        headerUmpire2={header.umpire2}
      />

      {/* Phase 3.5 — 경기 종료 버튼 (BFF POST + 라이브 발행).
          이유: 운영자가 Q4(또는 OT) 종료 후 명시적 매치 종료 트리거.
          MatchEndButton 내부에서 confirm modal + 응답 처리 */}
      <MatchEndButton
        matchId={match.id}
        homeTeamName={homeFilteredRoster.teamName}
        awayTeamName={awayFilteredRoster.teamName}
        final={computeFinalScore(runningScore)}
        buildPayload={buildSubmitPayload}
      />

      {/* Phase 진행 상태 안내 — Phase 7 완성 시점 갱신.
          `no-print` = 인쇄 시 안내 카드 제거 (FIBA 양식 정합) */}
      <div
        className="no-print mt-4 px-3 py-2 text-xs"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-muted)",
          border: "1px solid var(--color-border)",
        }}
      >
        Phase 7 = FIBA PDF 디자인 정합 + 라인업 선택 + Q4/OT 분기 통합. 라인업
        다시 선택하려면 우상단 &quot;라인업 다시 선택&quot; 버튼 사용.
      </div>

      {/* Phase 7-B — 라인업 다시 선택 버튼 (양식 표시 후에도 운영자가 재선택 가능) */}
      <button
        type="button"
        onClick={() => setLineupModalOpen(true)}
        className="no-print mt-2 px-3 py-1.5 text-xs"
        style={{
          border: "1px solid var(--color-border)",
          color: "var(--color-text-muted)",
          touchAction: "manipulation",
        }}
        aria-label="라인업 다시 선택 (출전 명단 / 선발 5인)"
      >
        <span className="material-symbols-outlined mr-1 align-middle text-sm">
          edit
        </span>
        라인업 다시 선택
      </button>

      {/* Phase 3.5 — FoulTypeModal (전역 마운트 — open 시만 렌더) */}
      <FoulTypeModal
        open={foulModalCtx !== null}
        playerName={foulModalCtx?.playerName ?? ""}
        jerseyNumber={foulModalCtx?.jerseyNumber ?? null}
        period={runningScore.currentPeriod}
        onSelect={handleSelectFoulType}
        onCancel={() => setFoulModalCtx(null)}
      />
        </>
      )}

      {/* Phase 7-B — LineupSelectionModal (전역 마운트).
          lineupModalOpen=true 시만 렌더. 양식 미렌더 (lineup === null) 인 경우에도 표시. */}
      <LineupSelectionModal
        open={lineupModalOpen}
        homeTeamName={homeRoster.teamName}
        awayTeamName={awayRoster.teamName}
        homePlayers={homeRoster.players}
        awayPlayers={awayRoster.players}
        initialHome={lineup?.home}
        initialAway={lineup?.away}
        onConfirm={handleLineupConfirm}
        // 라인업이 한 번도 확정 안 된 상태 = 취소 불가 (양식 진입 차단)
        // 이미 확정된 상태에서 "라인업 다시 선택" = 취소 허용 (모달 닫기)
        onCancel={lineup !== null ? () => setLineupModalOpen(false) : undefined}
      />

      {/* Phase 7-C — QuarterEndModal (Q4 / OT 종료 분기) */}
      <QuarterEndModal
        open={quarterEndModal !== null}
        mode={quarterEndModal?.mode ?? "quarter4"}
        currentPeriod={quarterEndModal?.period ?? 4}
        homeTeamName={homeFilteredRoster.teamName}
        awayTeamName={awayFilteredRoster.teamName}
        homeTotal={computeFinalScore(runningScore).homeTotal}
        awayTotal={computeFinalScore(runningScore).awayTotal}
        onEndMatch={handleEndMatchFromQuarterEnd}
        onContinueToOvertime={handleContinueToOvertime}
        onCancel={() => setQuarterEndModal(null)}
      />
    </main>
  );
}
