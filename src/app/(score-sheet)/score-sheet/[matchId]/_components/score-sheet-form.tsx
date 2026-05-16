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

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FibaHeader, type FibaHeaderInputs } from "./fiba-header";
import { TeamSection, type TeamSectionInputs } from "./team-section";
import { RunningScoreGrid } from "./running-score-grid";
import { PeriodScoresSection } from "./period-scores-section";
import { FoulTypeModal } from "./foul-type-modal";
import { MatchEndButton } from "./match-end-button";
// Phase 17 (2026-05-13) — 쿼터별 색상 안내 Legend (frame 외부 / no-print).
// 2026-05-15 (PR-SS-Manual-Legend) — PeriodColorLegend = 설명서 모달 안에서 사용 (box 형태).
import { PeriodColorLegend } from "./period-color-legend";
import type { TeamRosterData } from "./team-section-types";
import type { RunningScoreState } from "@/lib/score-sheet/running-score-types";
import {
  EMPTY_RUNNING_SCORE,
  computeFinalScore,
  toQuarterScoresJson,
} from "@/lib/score-sheet/running-score-helpers";
// 2026-05-15 (PR-D / P2-7) — buildSubmitPayload 외부 추출 (순수 함수, vitest 가능).
import { buildSubmitPayload as buildSubmitPayloadHelper } from "@/lib/score-sheet/build-submit-payload";
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
// Phase 19 PR-Stat3 (2026-05-15) — player stats state wiring (6 stat: OR/DR/A/S/B/TO).
//   사용자 결재 Q1 (위치) / Q2 (StatPopover) / Q3 (match_player_stats 직접 박제 / DB 변경 0).
import type {
  PlayerStatsState,
  StatKey,
} from "@/lib/score-sheet/player-stats-types";
import { EMPTY_PLAYER_STATS } from "@/lib/score-sheet/player-stats-types";
import {
  addStat,
  removeStat,
  getStat,
} from "@/lib/score-sheet/player-stats-helpers";
import { StatPopover } from "./stat-popover";
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
// 2026-05-16 (PR-PBP-Edit) — PBP 조회/수정 플로팅 모달.
//   toolbar "기록수정" 버튼 → form 의 setPbpEditModalOpen(true) → 모달 표시.
//   "저장" 시 onApply 콜백으로 next marks 전달 → setRunningScore() 박제.
import { PbpEditModal } from "./pbp-edit-modal";
// 2026-05-16 (PR-Possession-2) — 공격권 (Alternating Possession) 박제.
//   PR-1 (PURE 헬퍼 + 타입) 머지 완료 후 본 PR (UI + state + 모달) 진입.
//   - PossessionState / EMPTY_POSSESSION = state 타입 + 초기값
//   - applyOpeningJumpBall / applyHeldBall / togglePossession = 4 handler 안에서 사용
//   - JumpBallModal = 라인업 confirm 후 자동 open / PossessionConfirmModal = 헤더 화살표 클릭 시 open
import type { PossessionState } from "@/lib/score-sheet/possession-types";
import { EMPTY_POSSESSION } from "@/lib/score-sheet/possession-types";
import {
  applyOpeningJumpBall,
  applyHeldBall,
  togglePossession,
} from "@/lib/score-sheet/possession-helpers";
import { JumpBallModal } from "./jump-ball-modal";
import { PossessionConfirmModal } from "./possession-confirm-modal";
// 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
//   사용자 결재 권장안 — Coach row 우측 3 cells (B/C/B_HEAD/B_BENCH 라디오) + Delay row 자동 분기.
//   PURE 헬퍼 (vitest 가능) + state 박제 본 form 단일 source.
import type {
  BenchTechnicalState,
  DelayOfGameState,
  CoachFoulKind,
} from "@/lib/score-sheet/bench-tech-types";
import {
  EMPTY_BENCH_TECHNICAL,
  EMPTY_DELAY_OF_GAME,
  COACH_FOUL_KIND_LABEL,
} from "@/lib/score-sheet/bench-tech-types";
import {
  addCoachFoul,
  removeLastCoachFoul,
  addDelayEvent,
  removeLastDelayEvent,
} from "@/lib/score-sheet/bench-tech-helpers";
import { BenchTechModal } from "./bench-tech-modal";
// 2026-05-15 (PR-D-2) — ConfirmModal Promise 패턴 외부화 (ConfirmModalProvider).
//   form 안 ConfirmModal JSX 마운트 불필요 (Provider 가 담당) + useConfirm 훅 사용.
import { useConfirm } from "../../../_components/confirm-modal-provider";
// 2026-05-15 (PR-D-3) — 수정 모드 / read-only 가드 단일 source.
import { useEditModeGuard } from "../_hooks/use-edit-mode-guard";
// 2026-05-15 (PR-D-4b) — input state 묶음 (header / signatures / teamA / teamB) 훅.
import { useScoreSheetInputState } from "../_hooks/use-score-sheet-input-state";
// 2026-05-15 (PR-D-4c) — 핵심 기록 state 6건 통합 훅.
import { useScoreSheetRecordState } from "../_hooks/use-score-sheet-record-state";
// 2026-05-15 (PR-D-4a) — draft localStorage IO 순수 함수 (vitest 가능).
import { loadDraft, saveDraft, clearDraft } from "@/lib/score-sheet/draft-storage";
// Phase 19 PR-S2 (2026-05-14) — 시안 .ss-toolbar 운영 도입 (back + 모드 토글 + 인쇄 + 경기 종료).
//   사용자 결재 D5/D6 — 운영 함수 호출 100% 보존 / 시각 위치만 통합.
import { ScoreSheetToolbar } from "../../../_components/score-sheet-toolbar";

interface MatchProp {
  id: string;
  tournamentId: string;
  match_code: string | null;
  scheduledAtLabel: string | null; // "2026-05-11 14:00" 류 (page.tsx 에서 toLocaleString 처리)
  courtLabel: string | null;
  // Phase 23 PR4 (2026-05-15) — status="completed" 매치 수정 가드 (사용자 결재 Q3).
  //   차단 ❌ / UI 경고 배너 + audit 박제 (변경 허용).
  //   "completed" 이면 mount 1회 노란 배너 표시 + cross-check-audit endpoint 호출.
  status?: string | null;
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
  // Phase 23 (2026-05-14) — 매치 재진입 시 자동 로드 props (매치 218 사고 영구 차단).
  //
  // 왜 (이유):
  //   기존 = 빈 폼으로 진입 → 운영자가 빈 폼 위 다시 제출하면 기존 PBP 박제 흡수.
  //   변경 = page.tsx 가 DB SELECT (PBP + settings.timeouts/signatures + notes) 후 헬퍼로
  //     역변환한 초기값을 prop drilling → useState 초기값으로 사용 → 기존 박제 안전 보존.
  //
  // 우선순위 룰 (사용자 결재 Q1):
  //   - 기본 = DB 우선 (props 값을 useState 초기값으로 즉시 사용)
  //   - localStorage draft 가 더 최신이면 (draft.savedAt > match.updatedAt) confirm 모달 표시 후 사용자 선택
  //   - draft 없거나 더 오래됨 = DB 그대로 (props 값 유지)
  //
  // BigInt 직렬화 (errors.md 2026-04-17): 모든 ID 는 string. page.tsx 의 .toString() 변환 결과.
  initialRunningScore?: RunningScoreState;
  initialFouls?: FoulsState;
  initialTimeouts?: TimeoutsState;
  initialSignatures?: SignaturesState;
  initialNotes?: string;
  // Phase 19 PR-Stat3 (2026-05-15) — match_player_stats SELECT 결과 자동 로드 (사용자 결재 Q3).
  //   DB 변경 0 — match_player_stats 직접 박제. page.tsx 가 SELECT 후 직렬화 전달.
  //   미전달 (=undefined) 시 EMPTY 폴백 = 신규 매치 진입과 동일.
  initialPlayerStats?: PlayerStatsState;
  // cross-check 용 (사용자 결재 Q4) — PBP 합산 (initialRunningScore 기준 toQuarterScoresJson)
  //   과 본 값이 mismatch 면 경고 배너 + console.warn. shape 는 BFF submit 와 동일.
  initialQuarterScoresDB?: Record<string, unknown>;
  // draft 우선순위 비교용 — ISO 8601 (page.tsx 가 Date.toISOString() 변환)
  matchUpdatedAtISO?: string | null;
  // 사용자 결재 Q2 — PBP 0건 + quarter_scores 만 있는 매치 안내 배너 트리거.
  //   pbpCount === 0 && initialQuarterScoresDB 가 있으면 정보 배너 표시.
  pbpCount?: number;
  // Phase 23 PR-EDIT2 (2026-05-15) — 종료 매치 수정 모드 권한 (사용자 결재 Q4).
  //
  //   - true  = super_admin / organizer / TAM → toolbar "수정 모드" 버튼 노출.
  //   - false = recorder / recorder_admin / 일반 → 버튼 미노출 (RO 차단 유지).
  //   - undefined = 진행 중 매치 (변경 0) — page.tsx 가 항상 boolean 전달하지만 안전 fallback.
  //
  //   page.tsx 의 checkScoreSheetEditAccess() 결과. 진행 매치 = 본 prop 미사용 (isCompleted=false 분기).
  canEdit?: boolean;
  // Phase 23 PR-EDIT4 (2026-05-15) — 종료 매치 수정 이력 (사용자 결재 Q7 옵션 A).
  //
  //   audit log SELECT 결과 (page.tsx 가 박제). 노란 배너 아래 inline "수정 이력 N건" 표시.
  //   완료 매치 + 이력 1건 이상 시만 렌더 (진행 매치 = 빈 배열).
  //   배열 순서 = occurredAt DESC (최신 우선).
  editAuditLogs?: Array<{
    id: string;
    context: string;
    source: string | null;
    occurredAt: string;
    userId: string | null;
    userNickname: string | null;
  }>;
  // 2026-05-16 (긴급 박제 — 전후반 모드 / 사용자 보고 이미지 #160).
  //
  // 왜 (이유):
  //   page.tsx 가 match.settings.period_format SELECT 결과 prop drilling.
  //   localStorage draft 의 periodFormat 과 우선순위 비교 → useState 초기값 결정.
  //
  // 우선순위:
  //   1. localStorage draft.periodFormat (운영자 토글 즉시 반영 / 새로고침 보존)
  //   2. server initialPeriodFormat (DB settings.period_format — 다른 브라우저 / 첫 진입)
  //   3. "quarters" (기본값 / 호환성)
  //
  //   사유: 운영자가 score-sheet 안에서 토글한 즉시 = localStorage 박제 → 우선.
  //   서버 박제는 BFF submit 시점 → 다른 브라우저 / 첫 진입 시 SSOT.
  initialPeriodFormat?: "halves" | "quarters";
  // 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
  //   page.tsx 가 match.settings.bench_technicals / match.settings.delay_of_game SELECT
  //   결과 prop drilling (운영 중 새로고침 = server SSOT 우선).
  //   localStorage draft 의 동일 필드와 비교 → useState 초기값 결정 (운영자 즉시 박제 우선).
  //
  //   미전달 (= undefined) = EMPTY 초기값 (구버전 매치 호환).
  initialBenchTechnical?: BenchTechnicalState;
  initialDelayOfGame?: DelayOfGameState;
}

// 2026-05-15 (PR-D-4a) — draft localStorage IO 가 lib/score-sheet/draft-storage.ts
//   순수 함수로 외부화. form 안 직접 localStorage 호출 0.
//   DRAFT_KEY_PREFIX 는 draft-storage.ts 내부 상수 (운영 키 보존).

// 2026-05-15 (PR-D-4b) — EMPTY_HEADER / EMPTY_TEAM 이 useScoreSheetInputState 훅 안으로 이동.
//   필요 시 훅에서 import (외부 export 유지).

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
  // Phase 19 PR-Stat3 (2026-05-15) — 6 stat 박제 (mid-game reload 후 OR/DR/A/S/B/TO 복원).
  //   사용자 결재 Q3 = match_player_stats 직접 박제 / DB 변경 0.
  playerStats: PlayerStatsState;
  // 2026-05-16 (PR-Possession-2) — 공격권 박제 (mid-game reload 후 화살표 + 점프볼 이벤트 복원).
  //   optional = 구버전 draft 호환 (없으면 EMPTY_POSSESSION fallback).
  possession?: PossessionState;
  // 2026-05-16 (긴급 박제 — 전후반 모드 / 강남구 i3 종별)
  //   optional = 구버전 draft 호환 (없으면 "quarters" fallback).
  //   localStorage 박제로 새로고침 시 토글 보존 (page.tsx 변경 0 — 시간 부족 시 ok).
  periodFormat?: "halves" | "quarters";
  // 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
  //   optional = 구버전 draft 호환 (없으면 EMPTY fallback).
  //   localStorage 박제로 새로고침 시 박제 상태 보존 — 서버 settings 와 양방향 sync.
  benchTechnical?: BenchTechnicalState;
  delayOfGame?: DelayOfGameState;
  savedAt: string;
}

export function ScoreSheetForm({
  match,
  tournament,
  homeRoster,
  awayRoster,
  initialLineup,
  // Phase 23 (2026-05-14) — 매치 재진입 시 자동 로드 props (PR2 page.tsx 가 박제)
  initialRunningScore,
  initialFouls,
  initialTimeouts,
  initialSignatures,
  initialNotes,
  initialQuarterScoresDB,
  matchUpdatedAtISO,
  pbpCount,
  // Phase 19 PR-Stat3 (2026-05-15) — 6 stat 자동 로드 (사용자 결재 Q3 = match_player_stats 직접 박제).
  initialPlayerStats,
  // Phase 23 PR-EDIT2 (2026-05-15) — 수정 모드 권한 (사용자 결재 Q4).
  //   true = super/organizer/TAM (수정 가능) / false = recorder/일반 (RO 유지).
  canEdit,
  // Phase 23 PR-EDIT4 (2026-05-15) — 수정 이력 inline (사용자 결재 Q7 옵션 A).
  editAuditLogs,
  // 2026-05-16 (긴급 박제 — 전후반 모드 / 사용자 보고 이미지 #160).
  //   server settings.period_format SELECT 결과 (page.tsx prop drilling).
  initialPeriodFormat,
  // 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
  initialBenchTechnical,
  initialDelayOfGame,
}: ScoreSheetFormProps) {
  // 2026-05-15 (PR-D-4b) — input state 묶음 (header / signatures / teamA / teamB) 훅 단일 source.
  const inputState = useScoreSheetInputState({
    initialSignatures,
    initialNotes,
  });
  const { header, setHeader, teamA, setTeamA, teamB, setTeamB, signatures, setSignatures } = inputState;
  // 2026-05-15 (PR-D-4c) — 핵심 기록 state 6건 (runningScore/fouls/timeouts/playerStats/lineup/lineupModalOpen)
  //   useScoreSheetRecordState 훅 단일 source.
  const recordState = useScoreSheetRecordState({
    initialRunningScore,
    initialFouls,
    initialTimeouts,
    initialPlayerStats,
    initialLineup,
  });
  const {
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
  } = recordState;
  // 2026-05-15 (PR-D-4b) — signatures state 가 useScoreSheetInputState 훅 안으로 이동.
  //   기존 lazy init (initialSignatures spread + initialNotes 우선) 동일하게 보존.
  // Phase 3.5 — FoulTypeModal state (어떤 선수의 어떤 팀에 추가할지)
  const [foulModalCtx, setFoulModalCtx] = useState<{
    team: "home" | "away";
    playerId: string;
    playerName: string;
    jerseyNumber: number | null;
  } | null>(null);

  // 2026-05-15 (PR-D-4c) — playerStats state 가 useScoreSheetRecordState 훅 안으로 이동.

  // Phase 19 PR-Stat3 — StatPopover state (어떤 선수의 어떤 stat 을 +1/-1 할지).
  //   null = 닫힘 / { ...컨텍스트 } = 열림. team 분기 = 안전망 (cell 클릭 시 caller 가 분기 처리).
  const [statPopoverCtx, setStatPopoverCtx] = useState<{
    team: "home" | "away";
    playerId: string;
    playerName: string;
    jerseyNumber: number | null;
    statKey: StatKey;
  } | null>(null);
  // 2026-05-15 (PR-D-4c) — lineup / lineupModalOpen / initialLineupComputed 가
  //   useScoreSheetRecordState 훅 안으로 이동.
  // Phase 7-C — Q4 / OT 종료 분기 modal state
  //   - null = 모달 닫힘
  //   - { mode, period } = 모달 열림 (어떤 종료 시점인지 / 어떤 period 가 종료되었는지)
  const [quarterEndModal, setQuarterEndModal] = useState<{
    mode: "quarter4" | "overtime";
    period: number;
  } | null>(null);
  // 2026-05-16 (PR-PBP-Edit) — PBP 조회/수정 모달 open state.
  //   toolbar "기록수정" 버튼 클릭 시 true / 모달 안 "취소" / "저장" / ESC / backdrop 시 false.
  const [pbpEditModalOpen, setPbpEditModalOpen] = useState(false);
  // PR-S6 (2026-05-14 rev2 롤백) — scoreMode state 제거. 시안 rev2 가 모드 토글을 제거하면서
  //   단일 모드 (= 기존 detail 동작) 통일. PR-S2 의 toolbar 의 다른 영역 (back/인쇄/종료) 은 유지.
  // Phase 19 PR-S2 — MatchEndButton controlled open state.
  //   왜: 시안 toolbar 의 "경기 종료" 버튼이 MatchEndButton 의 confirm modal trigger 위임.
  //   기존 MatchEndButton 의 confirm modal + BFF submit + submitted 토스트 흐름 100% 보존.
  const [matchEndOpen, setMatchEndOpen] = useState(false);
  // PR-S2 후속 fix 3 (2026-05-14) — MatchEndButton 의 submitted 상태 추적.
  //   왜: toolbar 의 "경기 종료" 버튼이 submitted 인지 알아야 시각 disabled 분기 가능.
  //   MatchEndButton 내부 submitted state 를 onSubmittedChange 콜백으로 끌어올림 (lifting state up).
  const [matchEndSubmitted, setMatchEndSubmitted] = useState(false);

  // 2026-05-16 (PR-Possession-2) — 공격권 (Alternating Possession) state 3건.
  //
  // possession: 화살표 + Opening Jump Ball + 헬드볼 이벤트 시계열 (PR-1 헬퍼 사용).
  //   EMPTY_POSSESSION = { arrow: null, openingJumpBall: null, heldBallEvents: [] }
  //   draft 복원 시 useEffect 안에서 setPossession (구버전 draft 호환 = optional).
  //
  // jumpBallModalOpen: 라인업 confirm 직후 자동 open (possession.openingJumpBall=null 시).
  //   isReadOnly 매치 = open 강제 false (이중 방어).
  //
  // heldBallConfirmOpen: 헤더 화살표 클릭 시 open (PossessionConfirmModal).
  //   "확인" → applyHeldBall + toast 5초 / "취소" → 닫기.
  const [possession, setPossession] = useState<PossessionState>(EMPTY_POSSESSION);
  const [jumpBallModalOpen, setJumpBallModalOpen] = useState(false);
  const [heldBallConfirmOpen, setHeldBallConfirmOpen] = useState(false);

  // 2026-05-16 (긴급 박제 — 전후반 모드 / 강남구 i3 종별)
  //
  // 왜 (이유):
  //   종이 기록지가 전후반 (2 period) 모드 운영 매치 (강남구 i3 등) 대응. 4쿼터 기본 유지 +
  //   toolbar 토글로 즉시 전환. DB schema 변경 0 — localStorage draft 박제로 새로고침 시 보존.
  //
  // 어떻게:
  //   - 초기값 = initialPeriodFormat (server settings.period_format) ?? "quarters" (4쿼터 / 호환 유지).
  //     사유: 사용자 보고 이미지 #160 — 박제 후 다시 새로고침 시 server settings 가 SSOT
  //         → 다른 브라우저 / 첫 진입 시 라벨 일관성 보장.
  //   - toolbar [전후반] 버튼 클릭 시 togglePeriodFormat 호출 → halves ↔ quarters 토글.
  //   - localStorage 복원 = 아래 useEffect (loadDraft) 에서 setPeriodFormat (draft.periodFormat 있을 시).
  //     사유: 운영자 즉시 토글 우선 (localStorage > server > 기본값) — useEffect 가 mount 후 덮어씀.
  const [periodFormat, setPeriodFormat] = useState<"halves" | "quarters">(
    initialPeriodFormat ?? "quarters",
  );
  const togglePeriodFormat = () => {
    setPeriodFormat((prev) => (prev === "halves" ? "quarters" : "halves"));
  };

  // 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
  //
  // 왜 (이유):
  //   FIBA Article 36.3 / 36.4 — Coach 본인 위반 (C) / Asst / 벤치 인원 위반 (B) →
  //   모두 Head Coach 통계 가산. 누적 3건 = 추방 (사용자 결재 권장안).
  //   Article 36.2.3 — 팀 단위 지연 위반. 1차 W (점수 변동 0) / 2차+ T (자유투 1개 — 운영자 수동).
  //
  // state 초기값 우선순위:
  //   1. localStorage draft (운영자 즉시 박제 우선 — 새로고침 보존)
  //      → 아래 useEffect (loadDraft) 가 setBenchTechnical / setDelayOfGame 호출.
  //   2. server initial* (DB settings.bench_technicals / delay_of_game — page.tsx prop drilling)
  //   3. EMPTY_* (신규 매치 / 구버전 호환)
  //
  //   useState 초기값 = server initial 우선 → useEffect 가 localStorage 박제 시 override.
  const [benchTechnical, setBenchTechnical] = useState<BenchTechnicalState>(
    initialBenchTechnical ?? EMPTY_BENCH_TECHNICAL,
  );
  const [delayOfGame, setDelayOfGame] = useState<DelayOfGameState>(
    initialDelayOfGame ?? EMPTY_DELAY_OF_GAME,
  );

  // BenchTechModal 컨텍스트 — 어느 팀의 코치 위반인지 (모달 open 시 박제 / close 시 null).
  const [benchTechModalCtx, setBenchTechModalCtx] = useState<{
    team: "home" | "away";
    teamLabel: string;
  } | null>(null);

  // 2026-05-15 (PR-D-2) — ConfirmModal Promise 패턴이 ConfirmModalProvider 로 외부화.
  //   기존 useState/타입/JSX 마운트 = score-sheet route group layout 의 Provider 가 담당.
  //   호출자 = useConfirm() 훅 + await confirmModal({...}). resolve 후 자동 close.
  const confirmModal = useConfirm();

  // Phase 23 PR-EDIT1 (2026-05-15) — 종료 매치 수정 모드 진입 (사용자 결재 Q3).
  //
  // 왜 (이유):
  //   종료 매치 + canEdit=true 사용자가 toolbar "수정 모드" 버튼 클릭 시 호출.
  //   confirm modal 로 "audit 박제됩니다. 정말로?" 확인 후 동의 시 setIsEditMode(true) → 차단 우회.
  //
  // 어떻게:
  //   1. confirmModal 호출 (Promise) — 사용자 선택 await.
  //   2. value === "enter" → setIsEditMode(true) + audit POST (context="completed_edit_mode_enter").
  //   3. 그 외 (ESC / "cancel" / null) → 무동작 (isEditMode 그대로 false 유지).
  //
  // audit 박제:
  //   - 진입 audit POST `/api/web/score-sheet/{matchId}/cross-check-audit`
  //   - warning_type = "completed_edit_mode_enter" (PR-RO4 의 cross-check-audit endpoint 재사용)
  //   - fire-and-forget (실패 시 console.warn / 진행 차단 안 함)
  //   - PR-RO2 의 mount 1회 audit (entry) 와는 별도 — toolbar 버튼 명시 진입 의도 박제.
  // 2026-05-15 (PR-Record-Cancel-UI) — 기록 취소 핸들러.
  //   1. 경고 ConfirmModal (되돌릴 수 없음 명시)
  //   2. 동의 시 /api/web/score-sheet/{matchId}/reset POST
  //   3. 성공 시 toast + window.location.reload() (양식 빈 상태로 재진입)
  //   4. 실패 시 toast (error)
  //   권한: BFF 가 super_admin / organizer / TAM 만 통과 (recorder 차단).
  async function handleCancelRecord() {
    if (!canEdit) return; // recorder 단일 = 버튼이 이미 미노출이지만 이중 방어

    const choice = await confirmModal({
      title: "기록 취소 — 매치 완전 초기화",
      message: (
        <>
          <p>이 매치의 모든 기록을 삭제하고 처음부터 다시 시작합니다.</p>
          <ul className="mt-2 list-inside list-disc text-sm">
            <li>득점/파울 (PBP), 선수 스탯, 라인업, 등번호 모두 삭제됩니다.</li>
            <li>매치 상태가 &quot;예정&quot;으로 초기화됩니다.</li>
            <li>되돌릴 수 없습니다. 운영자 책임으로 진행해주세요.</li>
          </ul>
        </>
      ),
      options: [
        { value: "cancel", label: "취소" },
        { value: "confirm", label: "기록 취소 (완전 초기화)", isDestructive: true },
      ],
    });

    if (choice !== "confirm") return;

    try {
      const res = await fetch(`/api/web/score-sheet/${match.id}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(data.error ?? "기록 취소에 실패했습니다.", "error");
        return;
      }
      showToast("매치가 초기화되었습니다.", "success");
      // 2026-05-15 (사용자 추가 요청) — 기록 취소 시 선수 선택 (draft) 도 초기화 + 이전 페이지로 나가기.
      //   reset 후 reload (같은 페이지) → 사용자 의도와 다름. router.back() 으로 진입 경로 (경기일정/대진표) 복귀.
      //   draft localStorage 도 같이 삭제 (key = score-sheet-draft-{matchId}).
      // draft localStorage 도 같이 삭제 (2026-05-15 PR-D-4a — clearDraft 헬퍼 사용).
      clearDraft(match.id);
      if (typeof window !== "undefined") {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "/admin";
        }
      }
    } catch (err) {
      console.error("[handleCancelRecord] fetch failed:", err);
      showToast("네트워크 오류로 기록 취소에 실패했습니다.", "error");
    }
  }

  // 2026-05-15 (PR-SS-Manual+Reselect) — 설명서 (작성법) 모달.
  // 2026-05-16 (PR-SS-Manual-v3) — 공격권 (Possession Arrow) 섹션 추가 + 색상 안내 박스화:
  //   (1) 신규 섹션 = 공격권 표시 (FIBA Alternating Possession) — 첫 점프볼 / 화살표 / 헬드볼 /
  //       쿼터 종료 자동 토글 4건. 위치 = 4번 "쿼터 종료" 뒤 (5번째 신규 섹션).
  //   (2) 시인성 개선 = PeriodColorLegend 를 다른 6 섹션과 동일 sectionBoxStyle 박스로 감싸
  //       라벨 (h3 "쿼터별 색상 / 점수 표기") + padding 통일.
  //   (3) 비개발자 표현 = "점프볼(공중 던진 공 잡기)" / "헬드볼(두 팀이 공 동시에 잡음)" 풀어 설명.
  //   (4) 기존 5/6 → 6/7 번호 밀림 (잘못 기록했을 때 / 전체화면).
  //   왜 (이유):
  //     PR-Possession-2 박제로 헤더에 점유 화살표 + JumpBallModal + PossessionConfirmModal 추가.
  //     운영자가 모달 한 번에 점유권 흐름 (첫 점프볼 → 화살표 → 헬드볼 클릭 → 쿼터 자동 토글)
  //     전체를 파악하도록 신규 섹션 박제. 비개발자 표현으로 점프볼/헬드볼 정의 풀이 동봉.
  //   ConfirmModal 호출 패턴 변경 0 (title / size / options 그대로) — JSX 본문만 교체.
  async function handleOpenManual() {
    // 섹션 박스 공통 스타일 — borderLeft 3px accent + 부드러운 배경 + padding.
    //   시인성 = 섹션 간 명확한 구분선 (시안 룰 §10 var(--color-*) 토큰 만).
    const sectionBoxStyle: React.CSSProperties = {
      borderLeft: "3px solid var(--color-accent)",
      backgroundColor: "var(--color-surface)",
      padding: "12px 14px",
      borderRadius: "4px", // CLAUDE.md §디자인 핵심 — 버튼 radius 4px 룰 정합
    };

    // h3 공통 스타일 — 16px 굵게 + 아이콘 정합 (gap 8px).
    const sectionH3Style: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "10px",
      fontSize: "16px",
      fontWeight: 700,
      color: "var(--color-text-primary)",
    };

    // 아이콘 공통 스타일 — material-symbols-outlined / accent 색 (빨강 본문 금지 룰 ✅).
    const iconStyle: React.CSSProperties = {
      fontSize: "20px",
      color: "var(--color-accent)",
      lineHeight: 1,
    };

    // 본문 ol / ul 공통 스타일 — 14px + line-height 1.7 (시인성 향상).
    const bodyTextStyle: React.CSSProperties = {
      fontSize: "14px",
      lineHeight: 1.7,
      color: "var(--color-text-primary)",
    };

    // 강조 (bold) 공통 — info 색 (빨강 금지 룰 §10).
    //   inline 사용 = `<strong style={emphasisStyle}>…</strong>` 패턴.
    const emphasisStyle: React.CSSProperties = {
      fontWeight: 700,
      color: "var(--color-info)",
    };

    await confirmModal({
      title: "전자 기록지 작성법",
      size: "xl",
      message: (
        <div className="space-y-4" style={bodyTextStyle}>
          {/* 색상/점수 표기 안내 — Legend 자체는 inline 컴포넌트(작음) → 시인성 향상 위해
              섹션 박스로 한 번 더 감싸서 다른 6개 섹션과 동일 라벨/스타일 정합 갖춤.
              (2026-05-16 PR-SS-Manual-Legend-v2 — 라벨 명시 + padding 통일). */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                palette
              </span>
              쿼터별 색상 / 점수 표기
            </h3>
            <PeriodColorLegend />
          </section>

          {/* (1) 매치 상태 표시 — 신규 박제 (헤더 우상단 뱃지 + 라벨 안내). */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                info
              </span>
              매치 상태 보는 법
            </h3>
            <ul className="ml-5 list-disc space-y-2" style={bodyTextStyle}>
              <li>
                화면 <strong style={emphasisStyle}>오른쪽 위 빨강 박스</strong>가 지금 경기의
                현재 쿼터를 알려줍니다 (예: <em>Q1 / Q2 / Q3 / Q4 / OT1</em>).
                연장전에 들어가면 자동으로 <em>OT1, OT2…</em> 로 바뀝니다.
              </li>
              <li>
                박스 바로 <strong style={emphasisStyle}>아래 작은 회색 글씨</strong>는 매치 상태입니다.
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li>"경기 전" — 아직 첫 점수가 기록되지 않은 상태</li>
                  <li>"경기 중" — 점수가 1개 이상 기록된 진행 중인 상태</li>
                  <li>"경기 종료" — 최종 결과가 제출된 상태</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* (2) 경기 시작 전 — 라인업. */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                groups
              </span>
              경기 시작 전 (선수 명단)
            </h3>
            <ol className="ml-5 list-decimal space-y-2" style={bodyTextStyle}>
              <li>
                화면 위쪽 <strong style={emphasisStyle}>"라인업"</strong> 버튼을 누르세요.
                양 팀에서 오늘 경기에 나올 선수들을 체크하고, 그 중 <em>선발 5명</em>을 따로
                표시해주세요. 라인업을 확정하면 선발 5명은 자동으로 <em>"P. in"</em>
                (코트 안) 표시가 됩니다. 후보 선수는 실제로 경기에 들어갈 때 직접
                "P. in" 칸을 눌러주세요.
              </li>
            </ol>
          </section>

          {/* (3) 경기 진행 중 — 점수/파울/타임아웃/개인기록. */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                sports_basketball
              </span>
              경기 진행 중 (점수·파울·기록)
            </h3>
            <ol className="ml-5 list-decimal space-y-2" style={bodyTextStyle}>
              <li>
                <strong style={emphasisStyle}>점수 기록</strong> — 점수를 넣은 선수 행에서 해당
                점수 칸을 누르세요. 표기는 <em>·</em> (작은 점) = 1점 / <em>●</em> (채워진 원) = 2점 /
                <em> ◉</em> (테두리 있는 원) = 3점. 현재 쿼터 색깔로 표시됩니다
                (Q1 검정 / Q2 빨강 / Q3 초록 / Q4 노랑).
              </li>
              <li>
                <strong style={emphasisStyle}>파울 기록</strong> — 파울을 한 선수의
                <em> "Fouls"</em> 영역에서 1~5번 칸 중 비어있는 첫 칸을 누르세요.
                <strong style={emphasisStyle}> 5번째 파울</strong>이 기록되면 더 이상
                입력되지 않고 "5반칙 퇴장" 알림이 뜹니다.
              </li>
              <li>
                <strong style={emphasisStyle}>팀 파울 누적</strong> — <em>"Team fouls"</em>
                영역은 한 쿼터에서 팀이 범한 전체 파울 수입니다. 1~4까지 표시하며,
                4를 넘으면 다음 파울부터 상대 팀에게 자유투를 부여한다는 안내가 뜹니다.
                <em> "Extra periods"</em> 는 연장전용입니다.
              </li>
              <li>
                <strong style={emphasisStyle}>타임아웃</strong> — 양 팀
                <em> "Time-outs"</em> 영역에 표시합니다.
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li>윗줄 (Period ①②) = 전반 (1·2쿼터) 동안 쓸 수 있는 2개</li>
                  <li>가운데 줄 (Period ③④) = 후반 (3·4쿼터) 동안 쓸 수 있는 3개</li>
                  <li>아랫줄 (Extra periods) = 연장전</li>
                </ul>
                후반에 들어가면 전반 칸이 자동으로 잠겨서 더 이상 누를 수 없습니다.
              </li>
              <li>
                <strong style={emphasisStyle}>개인 기록 (OR/DR/A/S/B/TO)</strong> — 선수 행
                오른쪽 끝 <em>6칸</em>은 개인 세부 기록입니다.
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li><strong>OR</strong> = 공격 리바운드 / <strong>DR</strong> = 수비 리바운드</li>
                  <li><strong>A</strong> = 어시스트 / <strong>S</strong> = 스틸 / <strong>B</strong> = 블록</li>
                  <li><strong>TO</strong> = 턴오버</li>
                </ul>
                각 칸을 누르면 작은 창이 떠서 <em>[+1] / [-1]</em> 버튼으로 숫자를
                늘리거나 줄일 수 있습니다. 잘못 눌렀으면 [-1] 로 되돌리세요.
              </li>
            </ol>
          </section>

          {/* (4) 쿼터 / 경기 종료 — Running Score 헤더 이전·다음 쿼터 버튼 박제. */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                flag
              </span>
              쿼터 / 경기 종료
            </h3>
            <ol className="ml-5 list-decimal space-y-2" style={bodyTextStyle}>
              <li>
                <strong style={emphasisStyle}>쿼터가 끝났을 때</strong> — 화면 아래쪽
                <em> "Q1 종료" / "Q2 종료" …</em> 버튼을 누르면 안내 창이 뜹니다.
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li>Q1~Q3 끝: <em>"다음 쿼터 진행"</em>을 누르세요.</li>
                  <li>Q4 끝: 동점이면 <em>"OT (연장전) 진행"</em> / 점수 차이가 있으면 <em>"경기 종료"</em>.</li>
                  <li>연장전 끝: 또 동점이면 추가 연장전 / 결판 나면 경기 종료.</li>
                </ul>
              </li>
              <li>
                <strong style={emphasisStyle}>이전 / 다음 쿼터 버튼</strong> — Running Score
                영역 위쪽 우측에 <em>◀ 이전 쿼터 / 다음 쿼터 ▶</em> 버튼이 있습니다.
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li><em>다음 쿼터</em> = 현재 쿼터를 건너뛰고 다음 쿼터로 이동 (점수 입력 X)</li>
                  <li><em>이전 쿼터</em> = 잘못 종료한 쿼터를 되돌릴 때 사용</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* (5) 공격권 표시 (FIBA Alternating Possession) — 신규 박제 (2026-05-16 PR-Possession-2).
              왜: 운영자가 첫 점프볼 / 헬드볼 / 쿼터 종료 자동 토글 흐름을 모달 한 번에 파악.
              비개발자 표현 = "점프볼(공중 던진 공 잡기)" / "헬드볼(두 팀이 공 동시에 잡음)" 풀어 설명. */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                sync_alt
              </span>
              공격권 표시 (FIBA Alternating Possession)
            </h3>
            <ol className="ml-5 list-decimal space-y-2" style={bodyTextStyle}>
              <li>
                <strong style={emphasisStyle}>첫 점프볼 (공중 던진 공 잡기)</strong> — 라인업을
                확정하면 자동으로 작은 창이 뜹니다. <em>점프볼을 이긴 팀</em>과
                <em> 그 선수</em>를 골라주세요. 이긴 팀이 첫 공격권을 가져가며, 화면
                위쪽 쿼터 뱃지 옆에 <strong style={emphasisStyle}>회색 화살표</strong>가 나타납니다.
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li><em>←</em> 표시 = 다음 점유권은 <strong>어웨이 팀</strong></li>
                  <li><em>→</em> 표시 = 다음 점유권은 <strong>홈 팀</strong></li>
                </ul>
              </li>
              <li>
                <strong style={emphasisStyle}>공격권 화살표 보는 법</strong> — 헤더 쿼터 뱃지
                <em> 왼쪽</em>에 항상 표시됩니다. 화살표가 가리키는 팀이
                <em> 다음번에 공격권을 가져갈 팀</em>입니다 (FIBA 점프볼 / 헬드볼 룰).
              </li>
              <li>
                <strong style={emphasisStyle}>헬드볼 (두 팀이 공 동시에 잡음) 발생 시</strong> —
                두 팀 선수가 동시에 공을 잡았을 때, 헤더의
                <em> 회색 화살표를 직접 눌러주세요</em>. 작은 확인 창이 뜨며
                <em> "헬드볼 발생 — 공격권 [팀 이름]"</em> 으로 나타납니다. 확인을 누르면 그
                팀이 공격권을 가져가고, 화살표는 자동으로 <strong>반대 팀 방향</strong>으로
                바뀝니다 (다음 헬드볼은 반대 팀).
              </li>
              <li>
                <strong style={emphasisStyle}>쿼터가 끝나면 자동으로 바뀝니다</strong> —
                <em> "다음 쿼터"</em> 버튼을 누르는 순간 화살표가 자동으로 반대 방향으로
                토글됩니다 (FIBA 공식 룰 Art. 12.5). 운영자가 따로 누를 필요는 없으며,
                토스트 알림 <em>"다음 쿼터 공격권 = [팀]"</em>이 잠깐 표시됩니다.
              </li>
            </ol>
          </section>

          {/* (6) 벤치 테크니컬 파울 (B/C) — 2026-05-17 신규 박제 (사용자 지시).
              왜: 운영자가 Coach row 우측 3 cells 클릭 → C/B 선택 모달 흐름을 모달 한 번에 파악.
              비개발자 표현 = "C 파울 = 코치 본인 위반" / "B 파울 = 어시스트 또는 벤치 인원 위반"
              FIBA Article 36.3 (Coach T) / 36.4 (Bench T). */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                psychology_alt
              </span>
              벤치 테크니컬 파울 (B/C)
            </h3>
            <ol className="ml-5 list-decimal space-y-2" style={bodyTextStyle}>
              <li>
                <strong style={emphasisStyle}>C 파울 (Head Coach 본인 위반)</strong> — 헤드 코치가
                직접 룰을 어겼을 때 (예: 심판에게 거칠게 항의, 의자 차기 등). 모든 책임이
                <em> 헤드 코치 본인</em>에게 박제됩니다.
              </li>
              <li>
                <strong style={emphasisStyle}>B 파울 (어시 코치 / 벤치 인원 위반)</strong> —
                어시스턴트 코치, 대체 선수, 팀 관계자가 위반했을 때. 그러나 결국
                <em> 헤드 코치 책임</em>으로 누적 박제됩니다 (FIBA 룰 — 벤치 통솔 책임).
              </li>
              <li>
                <strong style={emphasisStyle}>입력 방법</strong> — Coach 행 <em>우측 빈 cell</em>을
                누르면 작은 창이 떠서 <em>Head Coach (C)</em> / <em>Head Coach (B)</em> /
                <em> Asst Coach (B)</em> 중 하나를 고를 수 있습니다.
              </li>
              <li>
                <strong style={emphasisStyle}>누적 룰 / 추방 자동 알림</strong> —
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li>Head Coach <em>누적 3개</em> (C×2 또는 C×1+B×2 또는 B×3) → 자동 추방 + toast 알림</li>
                  <li>Asst Coach <em>누적 2개</em> → 추방</li>
                  <li>추방되면 4번째 cell 은 자동으로 잠겨서 더 누를 수 없습니다.</li>
                </ul>
              </li>
              <li>
                <strong style={emphasisStyle}>자유투 부여</strong> — 벤치 테크니컬 1건 당
                <em> 상대 자유투 1개</em>가 부여됩니다. 자유투는 운영자가 Running Score 영역에서
                <em> 별도로 1점</em>을 마킹해주세요 (자동 박제 아님).
                <span className="block text-xs" style={{ color: "var(--color-text-muted)", marginTop: 4 }}>
                  (FIBA 공식 룰 Article 36.3 / 36.4)
                </span>
              </li>
            </ol>
          </section>

          {/* (7) 딜레이 오브 게임 (W/T) — 2026-05-17 신규 박제 (사용자 지시).
              왜: Team fouls 박스 안 좌측 [W][T1~T5] cells 자동 분기 (1차=W / 2차+=T) 흐름 운영자 인지.
              비개발자 표현 = "공 안 잡음 / 라인 밟기 / 던지기 전 상대 공 만짐 등".
              FIBA Article 36.2.3. */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                schedule
              </span>
              딜레이 오브 게임 (지연 위반)
            </h3>
            <ol className="ml-5 list-decimal space-y-2" style={bodyTextStyle}>
              <li>
                <strong style={emphasisStyle}>어떤 상황에 박제하나요?</strong> — 경기 흐름을
                지연시키는 사소한 위반들입니다.
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li>슛 후 공을 빨리 안 잡고 미루는 경우</li>
                  <li>Throw-in (사이드 인) 할 때 라인 밟기</li>
                  <li>던지기 전에 상대 팀 공을 만지는 경우 등</li>
                </ul>
              </li>
              <li>
                <strong style={emphasisStyle}>1차 위반 = 경고 (W)</strong> — 매치당 <em>1회만</em>
                자동으로 W (Warning) 가 박제됩니다. 점수 변동은 없습니다.
              </li>
              <li>
                <strong style={emphasisStyle}>2차 이후 위반 = 테크니컬 파울 (T)</strong> —
                같은 팀의 두 번째 지연 위반부터는 자동으로 <em>T (Technical Foul)</em> 로
                박제됩니다. <em>상대 팀 자유투 1개</em>가 부여됩니다 (운영자가 Running Score 영역에서
                별도로 1점 마킹).
              </li>
              <li>
                <strong style={emphasisStyle}>입력 방법</strong> — Team fouls 박스 안 좌측
                <em> Delay [W][T1~T5]</em> cells 를 차례로 누르면 됩니다.
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li>첫 번째 클릭 = 자동 <strong>W (경고)</strong> 박제</li>
                  <li>두 번째 클릭부터 = 자동 <strong>T (자유투 1개)</strong> 박제</li>
                </ul>
                <span className="block text-xs" style={{ color: "var(--color-text-muted)", marginTop: 4 }}>
                  (FIBA 공식 룰 Article 36.2.3)
                </span>
              </li>
            </ol>
          </section>

          {/* (8) 전후반 모드 — 2026-05-17 갱신 (사용자 지시 = i3 자동 박제 제거 / 일반 운영자 설명만).
              왜: 일부 대회는 4쿼터 대신 전반/후반 2 피리어드로 진행. 운영자가 toolbar [전후반] 토글로 전환. */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                schedule
              </span>
              전후반 모드 (2 피리어드)
            </h3>
            <ol className="ml-5 list-decimal space-y-2" style={bodyTextStyle}>
              <li>
                <strong style={emphasisStyle}>전후반 모드란?</strong> — 4쿼터가 아닌
                <em> 전반·후반 2 피리어드</em> 로 진행되는 매치 (예: 유소년부 / 특정 종별).
              </li>
              <li>
                <strong style={emphasisStyle}>모드 전환</strong> — 화면 위쪽 <em>"전후반"</em> 버튼을
                누르면 전후반 모드가 활성됩니다. 버튼이 <strong style={emphasisStyle}>빨강 outline</strong>
                + "<em>전후반 ON</em>" 으로 변경되면 활성된 것입니다. 다시 누르면 4쿼터 모드로 돌아갑니다.
              </li>
              <li>
                <strong style={emphasisStyle}>전후반 모드 표시 변화</strong>:
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li>쿼터 뱃지 = <em>전반 / 후반 / OT</em> (Q1/Q2/Q3/Q4 ❌)</li>
                  <li>Team fouls / Time-outs 영역 = 전반 / 후반 라벨</li>
                  <li>후반 종료 시 = "후반 종료" 모달 (= 4쿼터의 Q4 종료와 동일 흐름)</li>
                  <li>라이브 페이지 점수 표시 = 전후반 합산 자동</li>
                </ul>
              </li>
              <li>
                <strong style={emphasisStyle}>새로고침 보존</strong> — 한 번 전후반 모드를 켜면
                새로고침해도 같은 매치 진입 시 자동으로 다시 활성됩니다 (브라우저 단위 박제).
              </li>
            </ol>
          </section>

          {/* (9) 수정 기능 — 신규 박제 (기록수정 / 라인업 재선택 / 이전 쿼터). */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                edit_note
              </span>
              잘못 기록했을 때 (수정 기능)
            </h3>
            <ol className="ml-5 list-decimal space-y-2" style={bodyTextStyle}>
              <li>
                <strong style={emphasisStyle}>점수 / 선수 수정</strong> — 화면 위쪽
                <em> "기록수정"</em> 버튼을 누르세요. 지금까지 기록된 모든 득점이
                쿼터별 시간 순으로 나타나며, 각 항목에서 <em>1↔2↔3점</em> 변경,
                선수 교체, 삭제 가 가능합니다. 수정한 뒤 <em>"저장"</em>을 누르면
                바로 반영됩니다.
              </li>
              <li>
                <strong style={emphasisStyle}>라인업 다시 선택</strong> — 시작 라인업 5명을
                잘못 골랐을 때 화면 위쪽 <em>"라인업"</em> 버튼을 다시 누르면
                선발 5명을 새로 고를 수 있습니다.
              </li>
              <li>
                <strong style={emphasisStyle}>전체 초기화 (기록 취소)</strong> — 테스트로
                입력했거나 처음부터 다시 기록해야 할 때, 화면 위쪽 우측
                <em> "기록 취소"</em> 버튼을 누르세요. 경고 창이 뜨고, 확인하면
                이 경기의 점수·파울·라인업·등번호 기록이 모두 완전히 삭제되며
                이전 페이지로 돌아갑니다.
                <span className="block text-xs" style={{ color: "var(--color-text-muted)", marginTop: 4 }}>
                  (대회 운영자만 가능 — 일반 기록원은 이 버튼이 보이지 않습니다)
                </span>
              </li>
            </ol>
          </section>

          {/* (10) 전체화면 / 인쇄 — 신규 박제 (toolbar 전체화면 버튼 + ESC). */}
          <section style={sectionBoxStyle}>
            <h3 style={sectionH3Style}>
              <span className="material-symbols-outlined" style={iconStyle} aria-hidden="true">
                fullscreen
              </span>
              전체화면 모드 / 인쇄
            </h3>
            <ol className="ml-5 list-decimal space-y-2" style={bodyTextStyle}>
              <li>
                <strong style={emphasisStyle}>전체화면 모드</strong> — 화면 위쪽
                <em> "⛶ 전체화면"</em> 버튼을 누르면 도구 모음 (라인업 / 설명서 등) 이
                숨겨지고 양식만 크게 보입니다.
                <span className="block" style={{ color: "var(--color-text-muted)", marginTop: 4 }}>
                  추천 환경 = <strong>태블릿 세로 모드</strong> (양식이 한 화면에 깔끔히 들어옴).
                  종료는 키보드 <em>ESC</em> 또는 우상단 <em>✕</em> 버튼.
                </span>
              </li>
              <li>
                <strong style={emphasisStyle}>인쇄</strong> — <em>"인쇄"</em> 버튼은 FIBA
                공식 양식 그대로 PDF / 종이로 출력합니다 (배경 색상 자동 보존).
              </li>
              <li>
                <strong style={emphasisStyle}>이전 페이지로</strong> — 화면 위쪽 좌측
                <em> &lt;</em> 버튼을 누르면 이 기록지에 들어오기 전 페이지
                (경기 일정 / 대진표 등) 로 돌아갑니다.
              </li>
            </ol>
          </section>
        </div>
      ),
      options: [{ value: "close", label: "닫기", isPrimary: true }],
    });
  }

  // 2026-05-16 (PR-PBP-Edit) — PBP 조회/수정 모달 "저장" 콜백.
  //
  // 왜 (이유):
  //   모달이 임시 state (draftMarks) 안에서 수정/삭제를 한 뒤 운영자가 "저장" 클릭 시
  //   본 콜백으로 next marks 전달 → setRunningScore() 박제. currentPeriod 는 prev 유지.
  //   이후 form 의 기존 useEffect 가 5초 throttle draft localStorage 자동 박제.
  //
  // 어떻게:
  //   - next.home / next.away 만 받음 (currentPeriod 는 caller 가 변경 X — 모달 룰).
  //   - 즉시 BFF 호출 X (planner-architect 결정 plan §2 — form 자연 흐름에서 submit BFF 재사용).
  //
  // 안전망:
  //   - isReadOnly 시 호출 0 (toolbar 버튼이 이미 미노출이지만 이중 방어).
  function handleApplyPbpEdit(next: {
    home: typeof runningScore.home;
    away: typeof runningScore.away;
  }) {
    if (isReadOnly) return;
    setRunningScore((prev) => ({
      ...prev,
      home: next.home,
      away: next.away,
      // currentPeriod 는 변경 X — 모달 안에서 쿼터 변경 미허용 (planner-architect §3 범위 제외).
    }));
  }

  async function handleEnterEditMode() {
    if (!isCompleted) return; // 진행 매치 = 호출 불가 (안전망)
    if (!canEdit) return; // 권한 없음 = 호출 불가 (UI 버튼이 이미 미노출이지만 이중 방어)

    const choice = await confirmModal({
      title: "종료 매치 수정 모드 진입",
      message: (
        <>
          <p>이 매치는 이미 종료된 상태입니다.</p>
          <ul className="mt-2 list-inside list-disc text-sm">
            <li>수정 모드 진입 시 모든 입력/버튼이 활성화됩니다.</li>
            <li>재제출 시 audit 로그에 기록됩니다.</li>
            <li>운영자 책임으로 진행해주세요.</li>
          </ul>
        </>
      ),
      options: [
        { value: "enter", label: "수정 모드 진입", isDestructive: true },
        { value: "cancel", label: "취소" },
      ],
    });

    if (choice !== "enter") return; // 사용자 취소 / ESC = 진입 안 함

    setIsEditMode(true);

    // 진입 audit POST — fire-and-forget (PR-RO2 entry audit 패턴 일관).
    //   warning_type = "completed_edit_mode_enter" — toolbar 명시 진입 의도 박제 (mount 1회 audit 와 별도).
    if (typeof window !== "undefined") {
      fetch(`/api/web/score-sheet/${match.id}/cross-check-audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warning_type: "completed_edit_mode_enter",
          details: {
            extra: {
              match_status: match.status ?? null,
              match_updated_at: matchUpdatedAtISO ?? null,
              pbp_count: pbpCount ?? 0,
            },
          },
        }),
      }).catch((err) => {
        console.warn(
          "[score-sheet:Phase23:PR-EDIT1] completed-edit-mode-enter audit 실패",
          err,
        );
      });
    }

    showToast("수정 모드 활성 — 모든 입력이 활성화되었습니다.", "info");
  }
  // toast 알림 — Article 41 차단 + 5+ FT 자유투 부여 안내 + 쿼터 종료
  // PR-Stat3.9 (2026-05-15) — toast-context.tsx 의 useToast throw 제거 + default no-op 박제.
  //   Next.js 16 Turbopack dev hot reload 시 ToastProvider 모듈 분리 안전망.
  const { showToast } = useToast();

  // Phase 23 (2026-05-14) — cross-check: PBP 합산 vs DB quarter_scores mismatch 감지.
  //
  // 왜 (이유 — 사용자 결재 Q4):
  //   PBP 합산을 ScoreMarks 단일 source 로 사용. quarter_scores 는 별도 박제 흐름 (예: paper 매치
  //   q3 박제 시 quarter_scores 만 갱신된 케이스). 두 source mismatch 면 운영자 알림 + 로깅.
  //
  // 어떻게:
  //   - audit endpoint 부재 (route 미존재) → console.warn 로깅 + UI 노란 배너 (mount 1회).
  //   - mismatch 판정: Q1~Q4 + OT 각 위치 비교 (간단 shallow 비교).
  //   - 정확도: PBP 합산은 점수만 박제 (자유투 1점 / 야투 2/3점 score event 만). PBP 미박제된
  //     q3 = 0 vs DB 박제값 ≠ 0 = mismatch (정상 알림 케이스).
  //
  // 결과: useState 로 mismatch 메시지 1회 박제 → 노란 배너 렌더. PR4 에서 audit endpoint 박제 시 호출 추가.
  const [crossCheckWarning, setCrossCheckWarning] = useState<string | null>(
    null,
  );

  // 2026-05-15 (PR-B / P1-5) — useRef 플래그로 HMR 시 중복 비교 차단.
  const crossCheckFired = useRef(false);
  useEffect(() => {
    if (!initialQuarterScoresDB || !initialRunningScore) return;
    if (crossCheckFired.current) return;
    crossCheckFired.current = true;
    // Phase 23 PR6 (2026-05-15) — Q1~Q4 + OT (Q5~Q8) 합산 비교.
    //   이전 PR2+PR3 = Q1~Q4 만 (reviewer WARN 2건). DB quarter_scores shape = ot: number[] 배열.
    //   PBP 합산 toQuarterScoresJson 도 ot: number[] 배열 (running-score-helpers L131 동일 shape).
    //   매핑: ot[0]=OT1=Q5 / ot[1]=OT2=Q6 / ot[2]=OT3=Q7 / ot[3]=OT4=Q8 (이론적 — 운영은 OT3 까지).
    try {
      // PBP 합산 (toQuarterScoresJson 와 동일 형식)
      const pbpSum = toQuarterScoresJson(initialRunningScore);
      const dbHome = (initialQuarterScoresDB.home ?? {}) as Record<
        string,
        unknown
      >;
      const dbAway = (initialQuarterScoresDB.away ?? {}) as Record<
        string,
        unknown
      >;
      const diffs: string[] = [];
      // 1. Q1~Q4 (정규 쿼터) 비교 — 기존 동작 보존
      const qs = ["q1", "q2", "q3", "q4"] as const;
      for (const q of qs) {
        const pHome = pbpSum.home[q];
        const pAway = pbpSum.away[q];
        const dHome = Number(dbHome[q] ?? 0);
        const dAway = Number(dbAway[q] ?? 0);
        if (pHome !== dHome) {
          diffs.push(
            `${q.toUpperCase()} Home PBP=${pHome} / DB=${dHome}`,
          );
        }
        if (pAway !== dAway) {
          diffs.push(
            `${q.toUpperCase()} Away PBP=${pAway} / DB=${dAway}`,
          );
        }
      }
      // 2. OT (Q5~Q8) 비교 — Phase 23 PR6 신규.
      //    DB ot 와 PBP ot 둘 다 number[] 배열 / 길이 차이도 mismatch 로 박제.
      //    DB ot 누락 = 빈 배열로 안전 처리 / 비배열 (구버전 paper 매치) = 0건 배열로 fallback.
      const dbOtHomeRaw = dbHome.ot;
      const dbOtAwayRaw = dbAway.ot;
      const dbOtHome: number[] = Array.isArray(dbOtHomeRaw)
        ? (dbOtHomeRaw as unknown[]).map((v) => Number(v ?? 0))
        : [];
      const dbOtAway: number[] = Array.isArray(dbOtAwayRaw)
        ? (dbOtAwayRaw as unknown[]).map((v) => Number(v ?? 0))
        : [];
      const pbpOtHome = pbpSum.home.ot ?? [];
      const pbpOtAway = pbpSum.away.ot ?? [];
      // 길이 차이 → mismatch (PBP 가 OT1만 있는데 DB 가 OT1+OT2 있는 등)
      // max length 기준 loop — 한 쪽 0이면 다른 쪽 값 자체가 diff.
      const maxOtLen = Math.max(
        pbpOtHome.length,
        pbpOtAway.length,
        dbOtHome.length,
        dbOtAway.length,
      );
      for (let i = 0; i < maxOtLen; i++) {
        const otLabel = `OT${i + 1}`;
        // q-style 라벨 (Q5/Q6/...) 동시 표기 — 운영자 인식 호환
        const qLabel = `Q${i + 5}`;
        const pHome = pbpOtHome[i] ?? 0;
        const pAway = pbpOtAway[i] ?? 0;
        const dHome = dbOtHome[i] ?? 0;
        const dAway = dbOtAway[i] ?? 0;
        if (pHome !== dHome) {
          diffs.push(
            `${qLabel}/${otLabel} Home PBP=${pHome} / DB=${dHome}`,
          );
        }
        if (pAway !== dAway) {
          diffs.push(
            `${qLabel}/${otLabel} Away PBP=${pAway} / DB=${dAway}`,
          );
        }
      }
      if (diffs.length > 0) {
        const msg = `PBP 합산과 DB quarter_scores 가 다릅니다 (PBP 신뢰 — 사용자 결재 Q4): ${diffs.join(", ")}`;
        setCrossCheckWarning(msg);
        // audit endpoint 부재 → console.warn 로깅 (PR4 에서 endpoint 박제 시 호출 추가)
        console.warn("[score-sheet:Phase23:cross-check]", msg);
      }
    } catch (err) {
      // 비교 실패 = 운영 영향 0 (배너만 미표시)
      console.warn("[score-sheet:Phase23:cross-check] failed", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 23 (2026-05-14) — PBP 0건 + quarter_scores 만 있는 매치 안내 배너 트리거 (사용자 결재 Q2).
  //   재박제 시 PBP 새로 생성됨 → 기존 quarter_scores 값은 cross-check 로 표시만.
  const hasOnlyQuarterScores =
    pbpCount === 0 &&
    initialQuarterScoresDB !== undefined &&
    Object.keys(initialQuarterScoresDB).length > 0;

  // 2026-05-15 (PR-D-3) — isCompleted / isEditMode / isReadOnly = useEditModeGuard 훅 단일 source.
  //   기존 17개 위치 산재 `isReadOnly` 패턴 → isReadOnly 단일 표현 통일.
  //
  // 운영 동작 보존:
  //   - 진행 중 매치 (isCompleted=false) = isReadOnly=false → 기존 동작 보존.
  //   - 종료 매치 + isEditMode=false = isReadOnly=true → RO 차단 유지 (PR-RO 동작 보존).
  //   - 종료 매치 + isEditMode=true = isReadOnly=false → 사용자 명시 동의 후 수정 가능.
  const { isCompleted, isEditMode, setIsEditMode, isReadOnly } = useEditModeGuard(match);

  // Phase 23 PR-EDIT4 (2026-05-15) — 수정 이력 펼침 토글 (사용자 결재 Q7).
  //   기본 = 접힘 (배너만 N건 표시) / 클릭 시 = 펼침 (행 리스트 표시).
  const [auditExpanded, setAuditExpanded] = useState(false);

  // 진입 audit POST — mount 1회 / isCompleted=true 일 때만.
  //   endpoint = /api/web/score-sheet/{matchId}/cross-check-audit (PR5-A 재사용)
  //   warning_type = "completed_edit_entry" (Zod enum 확장)
  //   details = { match_status, match_updated_at, pbp_count } (운영자 추적용 메타)
  // 2026-05-15 (PR-B / P1-5) — useRef 플래그로 HMR / re-mount 시 중복 audit 차단.
  //   이전: [] 의존성만 = HMR 시 effect 재실행 → 중복 INSERT 사고 가능.
  const auditEntryFired = useRef(false);
  useEffect(() => {
    if (!isCompleted) return;
    if (auditEntryFired.current) return;
    auditEntryFired.current = true;
    if (typeof window === "undefined") return;
    // fetch 는 fire-and-forget — 응답 무시. 실패 = console.warn + 진행.
    fetch(`/api/web/score-sheet/${match.id}/cross-check-audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        warning_type: "completed_edit_entry",
        details: {
          extra: {
            match_status: match.status ?? null,
            match_updated_at: matchUpdatedAtISO ?? null,
            pbp_count: pbpCount ?? 0,
          },
        },
      }),
    }).catch((err) => {
      // audit endpoint 실패 = 운영자 차단 ❌ (사용자 결재 Q3).
      console.warn(
        "[score-sheet:Phase23:PR4] completed-edit-entry audit 실패",
        err,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 16 (2026-05-13) — 사전 확정 라인업 (initialLineup) 진입 시 P.IN 자동 체크 (mount 1회).
  // 2026-05-15 (PR-Score-Sheet-Cleanup) — 사용자 보고 "출전 안 한 선수도 P.IN 체크됨".
  //   이전 박제: starters + substitutes 모두 P.IN=true → 경기에 한 번도 안 들어간 후보 선수도 체크됨 (FIBA 양식 룰 위반).
  //   fix: **starters (5명) 만 P.IN=true 자동 박제**. substitutes 는 default false (교체 실제 들어올 때 기록원 수동 체크).
  //   draft 복원 이전 mount 1회 — draft 복원 후 일부 P.IN=true 면 skip.
  useEffect(() => {
    if (!initialLineupComputed) return;
    setTeamA((prev) => {
      const hasAny = Object.values(prev.players).some((p) => p.playerIn);
      if (hasAny) return prev;
      const next: Record<string, { licence: string; playerIn: boolean }> = {
        ...prev.players,
      };
      // 2026-05-15 — starters 만 자동 P.IN=true (5명). substitutes 는 default false.
      for (const id of initialLineupComputed.home.starters) {
        const existing = next[id] ?? { licence: "", playerIn: false };
        next[id] = { ...existing, playerIn: true };
      }
      return { ...prev, players: next };
    });
    setTeamB((prev) => {
      const hasAny = Object.values(prev.players).some((p) => p.playerIn);
      if (hasAny) return prev;
      const next: Record<string, { licence: string; playerIn: boolean }> = {
        ...prev.players,
      };
      for (const id of initialLineupComputed.away.starters) {
        const existing = next[id] ?? { licence: "", playerIn: false };
        next[id] = { ...existing, playerIn: true };
      }
      return { ...prev, players: next };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // localStorage draft 복원 (mount 1회).
  //
  // Phase 23 (2026-05-14) — draft vs DB 우선순위 (사용자 결재 Q1).
  //   기본 = DB 우선 (props 가 useState 초기값으로 이미 박제됨 — draft 적용 안 함).
  //   draft.savedAt > matchUpdatedAtISO 시 = draft 가 더 최신 = ConfirmModal 로 사용자 선택.
  //     - 사용자 OK → draft 로 덮어쓰기 (기존 동작 유지)
  //     - 사용자 Cancel → DB 유지 (props 값 유지)
  //   draft 없거나 더 오래됨 = DB 유지 (props 값 유지 / draft 무시).
  //
  // Phase 23 PR6 (2026-05-15) — reviewer WARN 1건 fix:
  //   기존 inline window.confirm() → ConfirmModal 컴포넌트 (Promise 패턴) 교체.
  //   useEffect 내부 비동기 (async IIFE) 로 변경 — 4종 모달 시각 정합 / 인쇄 차단 / 토큰 일관.
  //   동작 룰은 100% 보존 (사용자 결재 Q1 흐름 동일).
  useEffect(() => {
    if (typeof window === "undefined") return;
    // async IIFE — useEffect 내부에서 ConfirmModal Promise await 가능.
    //   useEffect cleanup 미사용 (mount 1회 + 모달 호출 후 회수 불필요).
    (async () => {
      try {
        // 2026-05-15 (PR-D-4a) — loadDraft 헬퍼 사용 (직접 localStorage 호출 X).
        const draft = loadDraft(match.id) as Partial<DraftPayload> | null;
        if (!draft) return;

        // Phase 23 — draft vs DB 비교. matchUpdatedAtISO 가 없으면 (신규 매치) draft 그대로 적용.
        let applyDraft = true;
        if (matchUpdatedAtISO && draft.savedAt) {
          try {
            const draftTime = new Date(draft.savedAt).getTime();
            const dbTime = new Date(matchUpdatedAtISO).getTime();
            // draft 가 DB 보다 더 최신이고 props (DB) 가 있는 경우만 사용자 confirm.
            // DB props 가 모두 비어 있으면 (신규 매치 + draft 만 존재) draft 그대로 적용.
            const hasDBContent =
              (initialRunningScore !== undefined &&
                (initialRunningScore.home.length > 0 ||
                  initialRunningScore.away.length > 0)) ||
              (initialFouls !== undefined &&
                (initialFouls.home.length > 0 ||
                  initialFouls.away.length > 0));
            if (draftTime > dbTime && hasDBContent) {
              // Phase 23 PR6 — ConfirmModal 호출 (Promise await).
              //   선택값: "draft" = 임시 저장본 우선 / "db" = DB 박제본 유지
              //   null (ESC/backdrop) = 안전 기본 = DB 유지 (사고 방지 최우선)
              const choice = await confirmModal({
                title: "임시 저장본 vs DB 박제본",
                message: (
                  <>
                    <p>
                      이 매치는 이미 박제된 기록이 있고, 진행 중인 임시 저장본이 더 최신입니다.
                    </p>
                    <ul className="mt-2 list-inside list-disc">
                      <li>임시 저장본으로 진행 = DB 박제는 제출 시 덮어쓰기</li>
                      <li>DB 박제본으로 진행 = 임시 저장본 무시</li>
                    </ul>
                  </>
                ),
                options: [
                  { value: "draft", label: "임시 저장본으로 진행", isPrimary: true },
                  { value: "db", label: "DB 박제본으로 진행" },
                ],
              });
              applyDraft = choice === "draft";
            } else if (draftTime <= dbTime && hasDBContent) {
              // DB 가 더 최신 = draft 무시 (사고 방지 최우선)
              applyDraft = false;
            }
            // else: DB content 0 = draft 그대로 적용 (신규 매치 + draft)
          } catch {
            // Date 파싱 실패 = 안전한 기본 (draft 적용 — 기존 동작 호환)
            applyDraft = true;
          }
        }
        if (!applyDraft) {
          return; // DB props 값 유지 (useState 초기값 그대로)
        }

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
        // Phase 19 PR-Stat3 (2026-05-15) — playerStats 복원 (기존 draft 호환: 없으면 EMPTY).
        //   방어: 객체 검증 + key=string + value={or,dr,a,s,b,to} shape 약식 검증.
        if (draft.playerStats && typeof draft.playerStats === "object") {
          const ps = draft.playerStats;
          // shape 검증 — 하나라도 PlayerStat shape 면 통과 (구버전 draft 호환).
          //   완전 미준수 = 무시 (안전망).
          const isValid = Object.values(ps).every(
            (v) =>
              v !== null &&
              typeof v === "object" &&
              typeof (v as unknown as Record<string, unknown>).or === "number"
          );
          if (isValid) {
            setPlayerStats(ps);
          }
        }
        // 2026-05-16 (긴급 박제 — 전후반 모드) — periodFormat 복원 (구버전 draft 호환: 없으면 "quarters").
        //   방어: "halves" | "quarters" 외 값 = 무시 (안전망).
        if (draft.periodFormat === "halves" || draft.periodFormat === "quarters") {
          setPeriodFormat(draft.periodFormat);
        }
        // 2026-05-16 (PR-Possession-2) — possession 복원 (구버전 draft 호환: 없으면 EMPTY).
        //   방어: arrow ∈ {"home","away",null} + openingJumpBall null|{winner,winnerPlayerId} +
        //         heldBallEvents = 배열. shape 위반 시 EMPTY 유지 (안전망).
        if (draft.possession && typeof draft.possession === "object") {
          const ps = draft.possession;
          const arrowOk =
            ps.arrow === "home" || ps.arrow === "away" || ps.arrow === null;
          const ojbOk =
            ps.openingJumpBall === null ||
            (typeof ps.openingJumpBall === "object" &&
              ps.openingJumpBall !== null &&
              (ps.openingJumpBall as { winner?: unknown }).winner !== undefined);
          const hbOk = Array.isArray(ps.heldBallEvents);
          if (arrowOk && ojbOk && hbOk) {
            setPossession(ps);
          }
        }
        // 2026-05-16 (긴급 박제 — Bench Technical) — benchTechnical 복원.
        //   shape 검증: home/away 객체 + head 배열 (assistant 보존용 / 현재 미사용 — fallback [] 로 안전 박제).
        if (draft.benchTechnical && typeof draft.benchTechnical === "object") {
          const bt = draft.benchTechnical;
          if (
            bt.home &&
            bt.away &&
            typeof bt.home === "object" &&
            typeof bt.away === "object" &&
            Array.isArray((bt.home as { head?: unknown }).head) &&
            Array.isArray((bt.away as { head?: unknown }).head)
          ) {
            // assistant 필드 누락 안전망 (구버전 draft 호환 — [] 로 강제).
            setBenchTechnical({
              home: {
                head: (bt.home as { head: unknown[] }).head as BenchTechnicalState["home"]["head"],
                assistant: Array.isArray((bt.home as { assistant?: unknown }).assistant)
                  ? ((bt.home as { assistant: unknown[] }).assistant as BenchTechnicalState["home"]["assistant"])
                  : [],
              },
              away: {
                head: (bt.away as { head: unknown[] }).head as BenchTechnicalState["away"]["head"],
                assistant: Array.isArray((bt.away as { assistant?: unknown }).assistant)
                  ? ((bt.away as { assistant: unknown[] }).assistant as BenchTechnicalState["away"]["assistant"])
                  : [],
              },
            });
          }
        }
        // 2026-05-16 (긴급 박제 — Delay of Game) — delayOfGame 복원.
        //   shape 검증: home/away 객체 + warned boolean + technicals number.
        if (draft.delayOfGame && typeof draft.delayOfGame === "object") {
          const dog = draft.delayOfGame;
          if (
            dog.home &&
            dog.away &&
            typeof dog.home === "object" &&
            typeof dog.away === "object" &&
            typeof (dog.home as { warned?: unknown }).warned === "boolean" &&
            typeof (dog.away as { warned?: unknown }).warned === "boolean" &&
            typeof (dog.home as { technicals?: unknown }).technicals === "number" &&
            typeof (dog.away as { technicals?: unknown }).technicals === "number"
          ) {
            setDelayOfGame(dog);
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
      } catch {
        // 손상된 draft = 무시
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // localStorage draft 저장 (5초 throttle — 입력 변경 후 일정 시간마다 자동 박제)
  // Phase 19 PR-Stat3 (2026-05-15) — playerStats 도 draft 박제 (mid-game reload 6 stat 복원).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      // 2026-05-15 (PR-D-4a) — saveDraft 헬퍼 사용. savedAt 자동 박제.
      // 2026-05-16 (PR-Possession-2) — possession 박제 (mid-game reload 후 화살표 복원).
      // 2026-05-16 (긴급 박제 — 전후반 모드) — periodFormat 박제.
      //   draft-storage.ts 의 saveDraft 시그니처는 Record<string, unknown> 류 — 추가 key 호환.
      saveDraft(match.id, {
        header,
        teamA,
        teamB,
        runningScore,
        fouls,
        timeouts,
        signatures,
        lineup,
        playerStats,
        possession,
        periodFormat,
        // 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
        benchTechnical,
        delayOfGame,
      });
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [header, teamA, teamB, runningScore, fouls, timeouts, signatures, lineup, playerStats, possession, periodFormat, benchTechnical, delayOfGame, match.id]);

  // Period 진행/후퇴 — Phase 4 통합 전 임시 버튼 (PeriodScoresSection 안).
  // Phase 23 PR-RO2 (2026-05-15) — 종료 매치 차단 (사용자 결재 Q2 — 모든 핸들러 isCompleted early return).
  function handleAdvancePeriod() {
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일)
    setRunningScore((prev) => ({
      ...prev,
      currentPeriod: Math.min(prev.currentPeriod + 1, 9),
    }));
  }
  function handleRetreatPeriod() {
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일)
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
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일)
    const endedPeriod = runningScore.currentPeriod;
    // 2026-05-16 (PR-Possession-2) — 쿼터 종료 시 공격권 자동 토글 (FIBA Article 12).
    //   룰: 쿼터 종료 = 다음 쿼터 시작 공격권 = 이전 쿼터 시작과 반대.
    //   arrow === null (Opening Jump Ball 미박제) 시 togglePossession 가 state 그대로 반환 (헬퍼 가드).
    //   토글 후 새 arrow 값을 toast 메시지에서 안내 (운영자가 양 팀 모두 인지하도록 5초).
    let nextArrowLabel: string | null = null;
    if (possession.arrow !== null) {
      const nextPossession = togglePossession(possession);
      setPossession(nextPossession);
      // 토글 후 새 arrow = nextPossession.arrow (= 반대 팀)
      nextArrowLabel =
        nextPossession.arrow === "home"
          ? homeFilteredRoster.teamName
          : nextPossession.arrow === "away"
            ? awayFilteredRoster.teamName
            : null;
    }
    // 2026-05-16 (긴급 박제 — 전후반 모드 / 강남구 i3 종별):
    //   halves 모드 분기 = period 1 (전반) 종료 시 자동 후반 진입 / period 2 (후반) 종료 시 경기 종료 모달.
    //   quarters 모드 = 기존 동작 (Q1~Q3 자동 / Q4 → 모달 / OT → 모달).
    if (periodFormat === "halves") {
      // 전반 (period 1) 종료 = 자동 후반 진입
      if (endedPeriod === 1) {
        setRunningScore((prev) => ({
          ...prev,
          currentPeriod: Math.min(prev.currentPeriod + 1, 9),
        }));
        if (nextArrowLabel) {
          showToast(
            `전반 종료 — 후반 진행 / 다음 공격권 = ${nextArrowLabel}`,
            "info",
          );
        } else {
          showToast("전반 종료 — 후반 진행", "info");
        }
        return;
      }
      // 후반 (period 2) 종료 = 경기 종료 모달 (= quarters 의 Q4 와 동일 흐름).
      //   OT 진행 가능 (동점 시) → QuarterEndModal 의 "OT 진행" 버튼 활용.
      //   QuarterEndModal 의 mode="quarter4" 분기 재사용 (UI 라벨은 모달 안 별도 처리 — 시간 부족 시 그대로).
      if (endedPeriod === 2) {
        setQuarterEndModal({
          mode: "quarter4",
          period: endedPeriod,
        });
        return;
      }
      // halves OT (period 3+) 종료 = overtime 모달 (= quarters 의 OT 와 동일 흐름).
      setQuarterEndModal({
        mode: "overtime",
        period: endedPeriod,
      });
      return;
    }
    // Q1~Q3 종료 = 기존 동작 (자동 진입)
    if (endedPeriod <= 3) {
      setRunningScore((prev) => ({
        ...prev,
        currentPeriod: Math.min(prev.currentPeriod + 1, 9),
      }));
      // 2026-05-16 (PR-Possession-2) — 토글 발생 시 toast 추가 안내 (양 팀 인지).
      //   showToast 자체는 duration 미지원 → 메시지 안 "공격권" 키워드로 운영자 시각 강조.
      if (nextArrowLabel) {
        showToast(
          `Q${endedPeriod} 종료 — Q${endedPeriod + 1} 진행 / 다음 쿼터 공격권 = ${nextArrowLabel}`,
          "info"
        );
      } else {
        showToast(`Q${endedPeriod} 종료 — Q${endedPeriod + 1} 진행`, "info");
      }
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
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일 / quarter-end modal 진입점)
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
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일)
    setRunningScore((prev) => ({
      ...prev,
      currentPeriod: Math.min(prev.currentPeriod + 1, 9),
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
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일 / 모달 mount)
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
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일)
    // PR-Stat3.5 (2026-05-15) — React 19 strict mode updater double-invoke 회피.
    //   기존 setFouls(prev => ...) 패턴 = strict mode 의 dev double-invoke 가 updater 2회 호출
    //   → queueMicrotask 도 2회 schedule → toast 2회 (사용자 보고 이미지 #30).
    //   수정: closure state 사용 + setFouls(next) 일반 인자 / showToast 는 함수 body 1회 호출.
    const next = removeLastFoul(fouls, team, playerId);
    setFouls(next);
    if (next !== fouls) {
      showToast("파울 1건 해제", "info");
    }
  }

  // Phase 4 — 타임아웃 추가 요청 (빈 칸 클릭).
  //
  // 흐름:
  //   1. TeamSection 빈 칸 클릭 → handleRequestAddTimeout
  //   2. addTimeout 호출 → Article 18-19 검증 (전반2/후반3/OT1)
  //   3. ok → state 갱신 + toast "전반 타임아웃 1/2" 류
  //   4. !ok → toast "전반 타임아웃 모두 사용 — 추가 불가" 류 (state 미변경)
  function handleRequestAddTimeout(team: "home" | "away") {
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일)
    // PR-Stat3.5 (2026-05-15) — closure state + setX(next) 패턴 (updater 미사용 — strict mode double-invoke 회피).
    const result = addTimeout(timeouts, team, {
      period: runningScore.currentPeriod,
    });
    const teamLabel = team === "home" ? "Team A" : "Team B";
    if (!result.ok) {
      showToast(`${teamLabel} ${result.reason}`, "error");
      return;
    }
    setTimeouts(result.state);
    showToast(`${teamLabel} ${result.reason}`, "info");
  }

  // Phase 4 — 타임아웃 마지막 1건 해제 (마지막 칸 클릭).
  function handleRequestRemoveTimeout(team: "home" | "away") {
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일)
    const next = removeLastTimeout(timeouts, team);
    setTimeouts(next);
    if (next !== timeouts) {
      const teamLabel = team === "home" ? "Team A" : "Team B";
      showToast(`${teamLabel} 타임아웃 1건 해제`, "info");
    }
  }

  // Phase 19 PR-Stat3 (2026-05-15) — 6 stat (OR/DR/A/S/B/TO) 핸들러.
  //
  // 흐름:
  //   1. TeamSection stat cell 클릭 → handleRequestOpenStatPopover → 컨텍스트 박제 + popover open
  //   2. StatPopover 의 [+1] 버튼 → handleAddStat → addStat 헬퍼 호출 + state 갱신
  //   3. StatPopover 의 [-1] 버튼 → handleRemoveStat → removeStat 헬퍼 호출 (min 0)
  //   4. backdrop / ESC / 닫기 버튼 → setStatPopoverCtx(null)
  //
  // 사용자 결재 Q2 = StatPopover (+1/-1 2 옵션 만).
  function handleRequestOpenStatPopover(
    team: "home" | "away",
    playerId: string,
    statKey: StatKey
  ) {
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일 / popover mount)
    // 컨텍스트 박제 — 선수명 / 등번호 표시용 (FoulTypeModal 패턴 일관).
    const roster = team === "home" ? homeRoster.players : awayRoster.players;
    const player = roster.find((p) => p.tournamentTeamPlayerId === playerId);
    setStatPopoverCtx({
      team,
      playerId,
      playerName: player?.displayName ?? "(이름 없음)",
      jerseyNumber: player?.jerseyNumber ?? null,
      statKey,
    });
  }

  function handleAddStat() {
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일)
    if (!statPopoverCtx) return;
    const { playerId, statKey } = statPopoverCtx;
    // PR-Stat3.5 (2026-05-15) — closure state + setX(next) 패턴.
    setPlayerStats(addStat(playerStats, playerId, statKey));
    showToast(
      `${statKey.toUpperCase()} +1 (${statPopoverCtx.playerName})`,
      "info"
    );
    setStatPopoverCtx(null);
  }

  function handleRemoveStat() {
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일)
    if (!statPopoverCtx) return;
    const { playerId, statKey } = statPopoverCtx;
    const ctx = statPopoverCtx;
    // PR-Stat3.5 (2026-05-15) — closure state + setX(next) 패턴.
    const next = removeStat(playerStats, playerId, statKey);
    setPlayerStats(next);
    if (next !== playerStats) {
      showToast(`${statKey.toUpperCase()} -1 (${ctx.playerName})`, "info");
    }
    setStatPopoverCtx(null);
  }

  // 모달 → 종류 선택 콜백 — addFoul 호출 + Article 41 alert + 5+ FT alert
  function handleSelectFoulType(type: FoulType) {
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일)
    if (!foulModalCtx) return;
    const { team, playerId } = foulModalCtx;
    // PR-Stat3.5 (2026-05-15) — closure state + setX(next) 패턴.
    const result = addFoul(fouls, team, {
      playerId,
      period: runningScore.currentPeriod,
      type,
    });
    if (!result.ok) {
      showToast(result.reason, "error");
      setFoulModalCtx(null);
      return;
    }
    setFouls(result.state);

    const newTeamFouls =
      team === "home" ? result.state.home : result.state.away;
    const periodTeamCount = getTeamFoulCountByPeriod(
      newTeamFouls,
      runningScore.currentPeriod
    );
    if (periodTeamCount >= 5) {
      const teamLabel = team === "home" ? "Team A" : "Team B";
      showToast(
        `자유투 부여 — ${teamLabel} Period ${runningScore.currentPeriod} ${periodTeamCount}번째 파울`,
        "info",
      );
    }
    const ejection = type;
    if (ejection === "D") {
      showToast(`Disqualifying — 즉시 퇴장`, "info");
    } else {
      const playerFouls = newTeamFouls.filter((f) => f.playerId === playerId);
      const tCount = playerFouls.filter((f) => f.type === "T").length;
      const uCount = playerFouls.filter((f) => f.type === "U").length;
      if (tCount === 2) {
        showToast(`Technical 2회 — 퇴장`, "info");
      } else if (uCount === 2) {
        showToast(`Unsportsmanlike 2회 — 퇴장`, "info");
      } else if (playerFouls.length === 5) {
        showToast(`5반칙 — 퇴장`, "info");
      }
    }
    setFoulModalCtx(null);
  }

  // 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
  //
  // 흐름 (Bench Technical):
  //   1. TeamSection Coach row 우측 빈 cell 클릭 → handleRequestAddCoachFoul(team)
  //      → setBenchTechModalCtx({ team, teamLabel }) (모달 open).
  //   2. BenchTechModal 의 3 옵션 (C / B_HEAD / B_BENCH) 클릭 → handleSelectCoachFoul(kind)
  //      → addCoachFoul 헬퍼 호출 → setBenchTechnical / toast 분기 + 추방 도달 시 추방 toast.
  //   3. TeamSection 마지막 마킹 cell 클릭 → handleRequestRemoveLastCoachFoul(team)
  //      → removeLastCoachFoul 헬퍼 호출 → setBenchTechnical / toast.
  //
  // 흐름 (Delay of Game):
  //   1. TeamSection Delay row cell 클릭 → handleRequestDelayClick(team)
  //      → addDelayEvent 헬퍼 호출 → 자동 분기 (warned=false → W / true → T) → toast 분기.
  //   2. TeamSection 마지막 cell 클릭 → handleRequestRemoveLastDelay(team)
  //      → removeLastDelayEvent 헬퍼 호출 → setDelayOfGame / toast.
  //
  // PR-Stat3.5 (2026-05-15) 패턴 = closure state + setX(next) (strict mode double-invoke 회피).
  function handleRequestAddCoachFoul(team: "home" | "away") {
    if (isReadOnly) return;
    const teamLabel =
      team === "home"
        ? homeFilteredRoster?.teamName || "Team A"
        : awayFilteredRoster?.teamName || "Team B";
    setBenchTechModalCtx({ team, teamLabel });
  }

  function handleRequestRemoveLastCoachFoul(team: "home" | "away") {
    if (isReadOnly) return;
    const next = removeLastCoachFoul(benchTechnical, team);
    setBenchTechnical(next);
    if (next !== benchTechnical) {
      showToast("Coach Foul 1건 해제", "info");
    }
  }

  function handleSelectCoachFoul(kind: CoachFoulKind) {
    if (isReadOnly) return;
    if (!benchTechModalCtx) return;
    const { team, teamLabel } = benchTechModalCtx;
    const result = addCoachFoul(benchTechnical, team, {
      kind,
      period: runningScore.currentPeriod,
    });
    if (!result.ok) {
      // 추방 도달 후 추가 시도 차단 (cell 이미 disabled — 안전망)
      showToast(result.reason, "error");
      setBenchTechModalCtx(null);
      return;
    }
    setBenchTechnical(result.state);
    // 박제 toast — kind 라벨 (사용자 인지)
    showToast(
      `${teamLabel} ${COACH_FOUL_KIND_LABEL[kind]} 박제 — 상대 자유투 1개 (운영자 별도 박제)`,
      "info",
    );
    // 추방 도달 시 별도 toast (3건 누적 = Head Coach 추방)
    if (result.ejected) {
      showToast(
        `${teamLabel} Head Coach 추방 (누적 3건) — 어시 코치 인계`,
        "info",
      );
    }
    setBenchTechModalCtx(null);
  }

  function handleRequestDelayClick(team: "home" | "away") {
    if (isReadOnly) return;
    const result = addDelayEvent(delayOfGame, team);
    setDelayOfGame(result.state);
    const teamLabel =
      team === "home"
        ? homeFilteredRoster?.teamName || "Team A"
        : awayFilteredRoster?.teamName || "Team B";
    if (result.kind === "W") {
      showToast(
        `${teamLabel} Delay of Game 1차 경고 (W) — 다음 위반부터 T (자유투 1개)`,
        "info",
      );
    } else {
      showToast(
        `${teamLabel} Delay of Game T 박제 — 상대 자유투 1개 (운영자 별도 박제)`,
        "info",
      );
    }
  }

  function handleRequestRemoveLastDelay(team: "home" | "away") {
    if (isReadOnly) return;
    const next = removeLastDelayEvent(delayOfGame, team);
    setDelayOfGame(next);
    if (next !== delayOfGame) {
      const teamLabel =
        team === "home"
          ? homeFilteredRoster?.teamName || "Team A"
          : awayFilteredRoster?.teamName || "Team B";
      showToast(`${teamLabel} Delay 1건 해제`, "info");
    }
  }

  // Phase 3.5 — 경기 종료 BFF payload 빌더 (MatchEndButton 가 호출).
  //
  // 이유: status="completed" + running_score + fouls + quarter_scores 동시 박제.
  //   - quarter_scores: Phase 2 toQuarterScoresJson 헬퍼 재사용 (기존 sync API 호환)
  //   - running_score: position-mark 시계열 (PaperPBP score event 박제 source)
  //   - fouls: P/T/U/D 종류 + period (PaperPBP foul event 박제 source)
  //   - referee_main / umpire1 / umpire2 = header state 의 audit context 박제
  // 2026-05-15 (PR-D / P2-7) — buildSubmitPayload 외부 추출.
  //   lib/score-sheet/build-submit-payload.ts 가 순수 함수로 박제. vitest 가능.
  // 2026-05-16 (PR-Possession-3) — possession 키 추가 박제 (openingJumpBall 박혀있을 때만).
  function buildSubmitPayload(): unknown {
    return buildSubmitPayloadHelper({
      runningScore,
      fouls,
      timeouts,
      playerStats,
      signatures,
      header,
      lineup,
      isEditMode,
      possession:
        possession.openingJumpBall !== null
          ? {
              arrow: possession.arrow,
              openingJumpBall: possession.openingJumpBall,
              heldBallEvents: possession.heldBallEvents,
            }
          : undefined,
      // 2026-05-16 (긴급 박제 — 전후반 모드 / 사용자 보고 이미지 #160) — period_format DB 박제.
      //   halves 모드 매치 = "halves" 전송 / quarters 모드 = "quarters" 전송 (기본값과 동일 → 운영 영향 0).
      //   BFF 가 match.settings.period_format 키에 박제 → 라이브 페이지가 SELECT 후 라벨 분기.
      periodFormat,
      // 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
      //   박제 cell 0 + technicals 0 + warned false = EMPTY 상태 = 키 생략 (BFF UPDATE skip — 운영 영향 0).
      //   1건이라도 박제됐으면 전체 snapshot 전송 (BFF settings JSON merge + PBP action_subtype 박제).
      benchTechnical:
        benchTechnical.home.head.length > 0 ||
        benchTechnical.away.head.length > 0
          ? benchTechnical
          : undefined,
      delayOfGame:
        delayOfGame.home.warned ||
        delayOfGame.away.warned ||
        delayOfGame.home.technicals > 0 ||
        delayOfGame.away.technicals > 0
          ? delayOfGame
          : undefined,
    });
  }

  // 2026-05-16 (긴급 박제 — 라이브 자동 sync / 시합 직전).
  //
  // 왜 (이유):
  //   운영자가 score-sheet 마킹할 때마다 수동 submit 없이도 라이브 페이지가 실시간으로 점수/PBP 노출되어야 함.
  //   사용자 명시 사양: "score-sheet 가 10초마다 자동으로 라이브 페이지에 데이터 전송".
  //   기존 흐름 = "경기 종료" 버튼 / "Q4 종료 → 종료" 분기에서만 BFF submit → 진행 중 매치 라이브 노출 0.
  //
  // 어떻게:
  //   1. 10초 interval 로 동일 BFF submit endpoint 호출 (단일 source — 별도 endpoint 0).
  //   2. payload = buildSubmitPayload() 결과의 status 만 "in_progress" 로 override (헬퍼 변경 0).
  //   3. status="in_progress" → service 가 TournamentMatch.status="in_progress" 박제 + quarter_scores
  //      + running_score + PBP + MatchPlayerStat 모두 박제 / completed 신규 전환 0 = triggerMatchBrief skip.
  //   4. 라이브 페이지 = 이미 3초 polling 박혀있음 (page.tsx:498 POLL_INTERVAL) → 별도 박제 0.
  //
  // 트리거 조건 (셋 다 만족 시만 interval 활성):
  //   - lineup !== null    = 라인업 모달 confirm 완료 (시즌 시작 시점부터 마킹 가능)
  //   - !isReadOnly        = 진행 중 매치 (종료 매치 + 수정 모드 미진입 = sync 0)
  //   - !matchEndSubmitted = "경기 종료" 미박제 (= 자동 sync 와 종료 submit 충돌 0)
  //
  // 에러 처리:
  //   - silent fail = 운영자 화면 toast 노이즈 0 (사용자 명시 사양).
  //   - console.warn 만 = 개발자 디버깅용 흔적 보존.
  //
  // closure stale state 회피:
  //   - useRef 로 latest buildSubmitPayload 함수 추적. 매 렌더마다 ref.current 갱신.
  //   - setInterval 콜백 = ref.current() 호출 → 항상 최신 state 참조 (state 갱신마다 effect 재설정 0).
  const buildSubmitPayloadRef = useRef<() => unknown>(buildSubmitPayload);
  useEffect(() => {
    buildSubmitPayloadRef.current = buildSubmitPayload;
  });

  useEffect(() => {
    // 자동 sync 비활성 조건 (위 3 트리거) — 한 가지라도 false 면 interval 미설치.
    if (lineup === null) return;
    if (isReadOnly) return;
    if (matchEndSubmitted) return;

    const intervalId = setInterval(() => {
      // 매 호출 시 latest state 기반 payload 생성 (ref 패턴).
      const basePayload = buildSubmitPayloadRef.current() as Record<string, unknown>;
      // status override = "in_progress" — BFF zod 가 이미 enum 에 포함.
      //   service 가 TournamentMatch.status="in_progress" 박제 (scheduled → in_progress 자동 전환).
      const payload = { ...basePayload, status: "in_progress" as const };

      // fire-and-forget — 응답 무시. 운영자 화면 영향 0.
      fetch(`/api/web/score-sheet/${match.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      }).catch((err) => {
        // silent fail — toast 0 / console.warn 만 (디버깅용 흔적).
        console.warn("[score-sheet] 자동 sync 실패 (silent):", err);
      });
    }, 10_000);

    return () => clearInterval(intervalId);
  }, [lineup, isReadOnly, matchEndSubmitted, match.id]);

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

  // 모달 → 라인업 확정 콜백.
  //
  // Phase 16 (2026-05-13) — 라인업 확정 시 starters + substitutes 전체 P.IN=true 자동 체크.
  //   이유: 사용자 결재 §1 — 출전 명단으로 박제된 선수 = 경기 출전 = P.IN 자동 마킹 부담 0.
  //   기존 동작: 운영자가 12명 P.IN 일일이 체크 → 중복 부담 + 라인업 의미와 모순.
  //   변경: 모달 confirm 시 양 팀 모든 라인업 선수의 playerIn=true 자동 fill (한 번에).
  function handleLineupConfirm(result: LineupSelectionResult) {
    if (isReadOnly) return; // Phase 23 PR-EDIT3 (PR-D-3 isReadOnly 통일 — 라인업 재선택)
    setLineup(result);
    setLineupModalOpen(false);
    // 양 팀 라인업 (starters + substitutes) 의 모든 선수 playerIn=true 자동 set.
    // 한 사이드씩 patch — TeamSectionInputs.players 의 기존 값 보존 (licence 등).
    setTeamA((prev) => {
      const next: Record<string, { licence: string; playerIn: boolean }> = {
        ...prev.players,
      };
      // 2026-05-15 (PR-Score-Sheet-Cleanup) — starters (5인) 만 P.IN=true 자동.
      //   이전: starters + substitutes 모두 true → 한 번도 안 들어간 후보까지 체크되는 버그.
      //   substitutes 는 후보 — 실제 교체 들어올 때 기록원이 수동 체크 (FIBA 양식 정합).
      for (const id of result.home.starters) {
        const existing = next[id] ?? { licence: "", playerIn: false };
        next[id] = { ...existing, playerIn: true };
      }
      return { ...prev, players: next };
    });
    setTeamB((prev) => {
      const next: Record<string, { licence: string; playerIn: boolean }> = {
        ...prev.players,
      };
      for (const id of result.away.starters) {
        const existing = next[id] ?? { licence: "", playerIn: false };
        next[id] = { ...existing, playerIn: true };
      }
      return { ...prev, players: next };
    });
    showToast(
      "라인업 확정 — 선발 5인 자동 P.IN 체크 (후보는 교체 시 수동 체크)",
      "info"
    );
    // 2026-05-16 (긴급 박제 — 점프볼 버튼 박제 / 시합 운영 중):
    //   기존 박제 = 라인업 confirm 직후 점프볼 모달 자동 trigger.
    //   변경 = trigger 제거 (사용자 명시). 운영자가 헤더 [점프볼] 버튼 클릭 시 수동 open.
    //   사유: 자동 open = 운영자 흐름 끊김 + 라인업 확정 단계에서 점프볼 강제 → UX 부담.
    //   대체 = fiba-header 의 화살표 자리에 [점프볼] 버튼 노출 (openingJumpBall === null 시) →
    //     클릭 시 handleArrowClick 호출 → 본 form 의 분기 (아래 handleArrowClick) 가 처리.
  }

  // 2026-05-16 (PR-Possession-2) — 점프볼 모달 confirm 핸들러.
  //
  // 흐름:
  //   1. JumpBallModal "확정" → onConfirm(winner, winnerPlayerId) 호출
  //   2. applyOpeningJumpBall (PR-1 헬퍼) 호출 → arrow = loser 방향 박제
  //   3. 모달 close + 운영자 안내 toast (어느 팀이 첫 공격권을 가졌는지)
  //
  // 룰:
  //   - winner = 점프볼 승자 (= 첫 점유 팀) → arrow 는 반대 (loser) 방향
  //   - winnerPlayerId = 옵셔널 (null 허용 — 모달에서 선수 미선택 시)
  //   - isReadOnly 가드 = open 분기 가드 + 본 handler 가드 = 이중 방어
  function handleJumpBallConfirm(
    winner: "home" | "away",
    winnerPlayerId: string | null
  ) {
    if (isReadOnly) return;
    // applyOpeningJumpBall = PURE 헬퍼 → state.arrow = loser 방향 / openingJumpBall 박제
    setPossession(applyOpeningJumpBall(possession, winner, winnerPlayerId));
    setJumpBallModalOpen(false);
    // toast 안내 — 승자 팀 이름 + 화살표 방향 (= 반대 팀) 명시
    const winnerName =
      winner === "home"
        ? homeFilteredRoster.teamName
        : awayFilteredRoster.teamName;
    const loserName =
      winner === "home"
        ? awayFilteredRoster.teamName
        : homeFilteredRoster.teamName;
    showToast(
      `점프볼 승리 = ${winnerName} (첫 공격권) / 다음 공격권 화살표 = ${loserName}`,
      "info"
    );

    // 2026-05-16 (긴급 박제 — 점프볼 = 매치 시작 즉시 sync / 시합 운영 중).
    //
    // 왜 (이유):
    //   기존 = 10초 interval 자동 sync — 점프볼 박제 후 최대 10초 지연 → 라이브 페이지 노출 늦음.
    //   사용자 명시 = "점프볼 박제 시점에 즉시 sync (첫 기록 인식)" → 매치 status="in_progress" 즉시 전환.
    //
    // 어떻게:
    //   - setPossession 은 React state 갱신 (다음 렌더에서 ref 가 latest payload 반영).
    //   - setTimeout(0) 으로 macrotask 큐에 넣어 다음 tick 에 실행 → 그 시점에 useEffect 가
    //     buildSubmitPayloadRef.current 를 latest payload builder 로 갱신 완료.
    //   - 동일 BFF endpoint 호출 + status="in_progress" override (10초 interval 과 같은 방식).
    //   - silent fail = toast 0 / console.warn 만 (운영자 흐름 방해 0).
    //
    // 보존:
    //   - 10초 interval 자동 sync 그대로 유지 (별도 useEffect 변경 0).
    //   - 점프볼 즉시 sync = "1회 추가 호출" — interval 미간섭.
    setTimeout(() => {
      try {
        const basePayload = buildSubmitPayloadRef.current() as Record<string, unknown>;
        const payload = { ...basePayload, status: "in_progress" as const };
        fetch(`/api/web/score-sheet/${match.id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        }).catch((err) => {
          console.warn("[score-sheet] 점프볼 즉시 sync 실패 (silent):", err);
        });
      } catch (err) {
        console.warn("[score-sheet] 점프볼 즉시 sync payload build 실패 (silent):", err);
      }
    }, 0);
  }

  // 2026-05-16 (PR-Possession-2) — 헬드볼 confirm 모달 confirm 핸들러.
  //
  // 흐름:
  //   1. 헤더 화살표 클릭 → setHeldBallConfirmOpen(true) → 모달 표시
  //   2. PossessionConfirmModal "확인" → onConfirm 호출 (본 handler)
  //   3. applyHeldBall (PR-1 헬퍼) 호출 → heldBallEvents push + arrow 토글
  //   4. 모달 close + toast 5초 안내 (= 메시지 안 키워드 "공격권" 로 강조)
  //
  // 룰:
  //   - applyHeldBall 의 takingTeam = 현재 arrow 값 (= 화살표 방향 팀) — 이벤트 박제 후 arrow 토글
  //   - arrow=null 가드 = applyHeldBall 내부에서 state 그대로 반환 (안전망)
  function handleHeldBallConfirm() {
    if (isReadOnly) return;
    if (possession.arrow === null) return; // 안전망 (Opening Jump Ball 선행 필수)
    // 공격권 획득 팀 = 현재 arrow (토글 전)
    const takingTeamName =
      possession.arrow === "home"
        ? homeFilteredRoster.teamName
        : awayFilteredRoster.teamName;
    setPossession(applyHeldBall(possession, runningScore.currentPeriod));
    setHeldBallConfirmOpen(false);
    showToast(
      `헬드볼 발생 — 공격권 = ${takingTeamName} (화살표는 반대 팀으로 토글됨)`,
      "info"
    );
  }

  // 2026-05-16 (PR-Possession-2) — 헤더 화살표 클릭 핸들러.
  //
  // 흐름 (긴급 박제 — 점프볼 버튼 박제 / 시합 운영 중):
  //   1. FibaHeader 의 화살표/[점프볼] 버튼 클릭 → onArrowClick 콜백 = 본 handler
  //   2. isReadOnly 가드 (수정 모드 미진입 시 차단)
  //   3. 분기:
  //      - openingJumpBall === null (= [점프볼] 버튼 노출 상태) → setJumpBallModalOpen(true)
  //        (점프볼 모달 수동 open — 라인업 confirm 직후 자동 trigger 제거됨)
  //      - openingJumpBall 박제됨 (= 화살표 ←/→ 노출 상태) → setHeldBallConfirmOpen(true)
  //        (헬드볼 confirm 모달 — 기존 동작 보존)
  function handleArrowClick() {
    if (isReadOnly) return;
    if (possession.openingJumpBall === null) {
      // 첫 점프볼 미박제 = [점프볼] 버튼 노출 상태 → 점프볼 모달 직접 open
      setJumpBallModalOpen(true);
      return;
    }
    // 점프볼 박제 완료 = 화살표 노출 상태 → 헬드볼 confirm 모달
    setHeldBallConfirmOpen(true);
  }

  return (
    // Phase 6 → Phase 9 — score-sheet-print-root = _print.css 의 인쇄 스코프 prefix.
    //   Phase 9 (2026-05-12) = A4 1 페이지 fit + FIBA PDF 정합 레이아웃 재배치.
    //   좌측 = Team A (상) + Team B (하) 세로 분할 (FIBA PDF 정합)
    //   우측 = Running Score (상) + Period Scores + Final + Winner (하)
    //   최하단 = FooterSignatures 가로 펼침 (1~2 줄 컴팩트)
    //
    //   페이지 폭 = max-w-screen-md (768px) 가 아닌 A4 비율에 가깝게 조절 — 화면 시각 fit.
    //   인쇄 시 = _print.css 의 198mm × 285mm 강제.
    <main className="score-sheet-print-root mx-auto w-full max-w-[820px] px-1 py-1">
      {/* Phase 23 PR4 (2026-05-15) — status="completed" 매치 수정 가드 (사용자 결재 Q3).
          차단 ❌ / UI 경고 배너 + audit 박제 (변경 허용).
          운영자가 종료된 매치를 재진입하면 즉시 인식 + 재제출 시 audit 박제로 추적. */}
      {isCompleted && (
        <div
          className="no-print mb-2 px-3 py-2 text-xs"
          style={{
            // Phase 23 PR-EDIT1 (2026-05-15) — 수정 모드 활성 시 빨강 indicator (운영자 인지 시각 강조).
            border: isEditMode
              ? "1px solid var(--color-primary)"
              : "1px solid var(--color-warning)",
            backgroundColor: isEditMode
              ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
              : "color-mix(in srgb, var(--color-warning) 12%, transparent)",
            color: isEditMode
              ? "var(--color-primary)"
              : "var(--color-warning)",
          }}
        >
          <p className="font-semibold">
            <span className="material-symbols-outlined mr-1 align-middle text-base">
              {isEditMode ? "edit" : "warning"}
            </span>
            {isEditMode
              ? "수정 모드 활성 중 — 모든 입력이 활성화되었습니다"
              : "이 매치는 종료된 상태입니다"}
          </p>
          <p className="mt-1" style={{ color: "var(--color-text-muted)" }}>
            {isEditMode
              ? "재제출 시 audit 로그에 기록됩니다. 변경 사항을 확인 후 진행해주세요."
              : canEdit
              ? "수정하려면 상단 '수정 모드' 버튼을 눌러 진입하세요. 입력은 차단된 상태입니다."
              : "수정 후 재제출하면 audit 로그에 기록됩니다. 운영자 책임으로 진행해주세요."}
          </p>
        </div>
      )}

      {/* Phase 23 PR-EDIT4 (2026-05-15) — 종료 매치 수정 이력 inline 표시 (사용자 결재 Q7 옵션 A).
          종료 매치 + 이력 1건 이상 시만 표시. 기본 = 접힘 (N건 + 펼치기 버튼).
          클릭 시 = 펼침 (행 리스트 표시 / 누가/언제/무엇).
          운영 매치 상세 페이지 미존재 — 본 위치 = 운영자 추적 단일 source. */}
      {isCompleted && editAuditLogs && editAuditLogs.length > 0 && (
        <div
          className="no-print mb-2 px-3 py-2 text-xs"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
        >
          <button
            type="button"
            onClick={() => setAuditExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between"
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "inherit",
            }}
            aria-expanded={auditExpanded}
            aria-label="수정 이력 펼침 토글"
          >
            <span className="font-semibold">
              <span className="material-symbols-outlined mr-1 align-middle text-base">
                history
              </span>
              수정 이력 {editAuditLogs.length}건
            </span>
            <span className="material-symbols-outlined align-middle text-base">
              {auditExpanded ? "expand_less" : "expand_more"}
            </span>
          </button>
          {auditExpanded && (
            <ul
              className="mt-2 space-y-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              {editAuditLogs.map((entry) => {
                // context 분류 — 진입 / 재제출 / 명시 진입 구분 (운영자 추적용)
                const kind = entry.context.includes("completed_edit_resubmit")
                  ? "재제출"
                  : entry.context.includes("completed_edit_mode_enter")
                  ? "수정 모드 진입"
                  : entry.context.includes("completed_edit_entry")
                  ? "종료 매치 재진입"
                  : "기타 수정";
                return (
                  <li
                    key={entry.id}
                    className="flex items-center gap-2 border-t pt-1"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <span
                      className="inline-block min-w-[88px] font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {kind}
                    </span>
                    <span style={{ minWidth: 110 }}>
                      {new Date(entry.occurredAt).toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>{entry.userNickname ?? "(익명)"}</span>
                    {entry.source && (
                      <span
                        className="ml-auto"
                        style={{
                          color: "var(--color-text-muted)",
                          fontSize: "0.65rem",
                        }}
                      >
                        {entry.source}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Phase 23 (2026-05-14) — cross-check 경고 배너 (사용자 결재 Q4).
          PBP 합산 vs DB quarter_scores mismatch 시 노란 배너 + 메시지 + console.warn 로깅.
          매치 218 같은 사고 = 운영자가 빈 폼 위에 다시 제출 → 본 배너로 즉시 인식 가능. */}
      {crossCheckWarning && (
        <div
          className="no-print mb-2 px-3 py-2 text-xs"
          style={{
            border: "1px solid var(--color-warning)",
            backgroundColor:
              "color-mix(in srgb, var(--color-warning) 12%, transparent)",
            color: "var(--color-warning)",
          }}
        >
          <p className="font-semibold">
            <span className="material-symbols-outlined mr-1 align-middle text-base">
              warning
            </span>
            점수 불일치 경고
          </p>
          <p className="mt-1" style={{ color: "var(--color-text-muted)" }}>
            {crossCheckWarning}
          </p>
        </div>
      )}

      {/* 2026-05-15 (PR-Score-Sheet-Cleanup) — "PBP 없이 quarter 점수만 박제된 매치"
          안내 박스 제거 (사용자 보고 — 기록원에게 혼선만 발생).
          이전 박제는 운영 디버깅 용도였으나 기록원 입장 = 의미 불명 + 작업 흐름 방해.
          필요시 super_admin 진단 페이지에서 재노출 검토. */}

      {/* Phase 19 PR-S2 (2026-05-14) — 시안 .ss-toolbar (back + 모드 토글 + 인쇄 + 경기 종료).
          위치 = PeriodColorLegend 직전 (frame 외부 최상단). 운영 함수 호출 100% 보존:
            - onPrint  = window.print() 직접 호출 (기존 PrintButton 와 동일 동작)
            - onEndMatch = setMatchEndOpen(true) → 아래 MatchEndButton 의 controlled open trigger
              → confirm modal + BFF submit + submitted 토스트 흐름 그대로
            - backHref = "/admin" (운영 thin bar 의 "← 매치 관리로" 와 동일)
          gameNo = FibaHeader 와 동일 source (match.match_code ?? match.id). */}
      <ScoreSheetToolbar
        gameNo={match.match_code ?? match.id}
        onPrint={() => {
          if (typeof window !== "undefined") window.print();
        }}
        onEndMatch={() => {
          // Phase 23 PR-RO3 (2026-05-15) — 종료 매치 차단 (사용자 결재 Q2 — 이중 방어).
          //   hideEndMatch 시 button 자체 render 0 이지만, onClick 까지 가드 (회귀 안전망).
          // Phase 23 PR-EDIT3 (2026-05-15) — 수정 모드 시 우회 (재제출 허용 — 사용자 결재 Q5).
          if (isReadOnly) return;
          setMatchEndOpen(true);
        }}
        backHref="/admin"
        // PR-S2 후속 fix 3 (2026-05-14) — 종료 후 종료 버튼 disabled 시각 분기 (유지).
        endMatchDisabled={matchEndSubmitted}
        // Phase 23 PR-RO3 (2026-05-15) — 종료 매치 진입 시 경기 종료 버튼 hidden (사용자 결재 Q2).
        //   인쇄 / ← 메인 만 노출 / 종료 버튼 진입점 차단.
        // Phase 23 PR-EDIT3 (2026-05-15) — 수정 모드 시 = 경기 종료 다시 노출 (재제출 허용).
        //   isReadOnly 시만 hide (수정 모드 활성 시 종료 버튼 활성).
        hideEndMatch={isReadOnly}
        // Phase 23 PR-EDIT1 (2026-05-15) — 수정 모드 진입 (사용자 결재 Q3 + Q4).
        //   canEdit (page.tsx 가 권한 산출) + 종료 매치 시 "수정 모드" 버튼 노출.
        //   onEnterEditMode = confirm modal → 동의 시 setIsEditMode(true).
        //   isEditMode = 현재 수정 모드 활성 여부 (시각 indicator 분기).
        canEdit={canEdit}
        onEnterEditMode={handleEnterEditMode}
        isEditMode={isEditMode}
        // 2026-05-15 (PR-Record-Cancel-UI) — 기록 취소 trigger (super/organizer/TAM 만).
        //   recorder 단일 = 버튼 미노출 (canEdit 분기 재사용).
        onCancelRecord={canEdit ? handleCancelRecord : undefined}
        // 2026-05-15 (PR-SS-Manual+Reselect) — 라인업 다시 선택 (헤더 이동).
        //   종료 매치 = undefined (PR-RO2 룰). 수정 모드 진입 시 = 허용.
        onReselectLineup={
          !isReadOnly ? () => setLineupModalOpen(true) : undefined
        }
        // 2026-05-15 (PR-SS-Manual+Reselect) — 설명서 (작성법) 모달.
        onOpenManual={handleOpenManual}
        // 2026-05-16 (PR-PBP-Edit) — 기록 수정 모달 (라인업 ↔ 설명서 사이).
        //   진행 매치 + 수정 모드 매치 = 콜백 전달 / 종료 매치 + 수정 모드 미진입 = undefined (버튼 미노출).
        //   onReselectLineup 의 isReadOnly 룰 정합.
        onOpenPbpEdit={
          !isReadOnly ? () => setPbpEditModalOpen(true) : undefined
        }
        // 2026-05-16 (긴급 박제 — 전후반 모드 / 강남구 i3 종별).
        //   toolbar 의 "전후반" 토글 버튼 wiring. isReadOnly (종료/RO) 시 = undefined → 버튼 미노출.
        //   진행 매치 + 수정 모드 매치 = 토글 가능.
        periodFormat={periodFormat}
        onTogglePeriodFormat={isReadOnly ? undefined : togglePeriodFormat}
      />

      {/* 2026-05-15 (PR-SS-54) — 별도 PeriodColorLegend 박스 제거.
          color/점수 안내 = ScoreSheetToolbar 중앙 inline 모드로 통합 (사용자 요청). */}

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
      {/* Phase 9 — FIBA PDF 1:1 정합 + A4 1 페이지 fit 단일 외곽 박스.
          이유 (사용자 결재): A4 한 장 안에 모든 영역 + FIBA PDF 정확 레이아웃.
          구조:
            ├─ FibaHeader (헤더 영역 ~10% / 컴팩트 4 줄)
            ├─ 본문 영역 ~75% (좌:우 50:50)
            │   ├─ 좌측 ← Team A (상) + Team B (하) 세로 분할 (FIBA PDF 정합)
            │   └─ 우측 ← Running Score + Period Scores + Final + Winner 누적
            └─ FooterSignatures 가로 펼침 (풋터 영역 ~15% / 1~2 줄 컴팩트) */}
      <div className="score-sheet-fiba-frame w-full">
        {/* 헤더 영역 (~10% / 110px) — 4 줄 컴팩트 inline 라벨.
            2026-05-16 (PR-Layout-Unify) — fiba-divider-bottom (1px) → inline 2px 박제. 영역 구분 두께 통일. */}
        <div style={{ borderBottom: "2px solid #1A1E27" }}>
          <FibaHeader
            teamAName={homeRoster.teamName}
            teamBName={awayRoster.teamName}
            competitionName={tournament.name}
            scheduledAtLabel={match.scheduledAtLabel}
            gameNo={match.match_code ?? match.id}
            placeLabel={match.courtLabel}
            values={header}
            onChange={setHeader}
            // Phase 23 PR-RO2 (2026-05-15) — 종료 매치 input 차단 (사용자 결재 Q2)
            readOnly={isReadOnly}
            frameless
            // 2026-05-16 (PR-Quarter-Badge) — 우상단 쿼터 뱃지 wiring (사용자 보고 이미지 #130).
            //   currentPeriod = runningScore.currentPeriod (Q1~Q4 / OT1~)
            //   matchEnded = matchEndSubmitted (경기 종료 시 "경기 종료" 표시)
            currentPeriod={runningScore.currentPeriod}
            matchEnded={matchEndSubmitted}
            // 2026-05-16 (PR-Quarter-Badge-v3) — 뱃지 하단 상태 라벨 산출용 (사용자 보고 이미지 #157).
            //   RunningScoreState.marks 는 home/away 분리 → 두 배열 합산.
            //   0 = "경기 전" / 1+ = "경기 중" / matchEnded=true 우선 = "경기 종료".
            marksCount={runningScore.home.length + runningScore.away.length}
            // 2026-05-16 (PR-Possession-2) — 공격권 화살표 wiring.
            //   possessionArrow = possession.arrow ("home"/"away"/null).
            //     null = 첫 점프볼 미박제 = 화살표 미노출 (운영 호환 / 기존 paper 매치 영향 0).
            //   onArrowClick = isReadOnly 시 undefined (read-only / 클릭 비활성) /
            //                  그 외 = handleArrowClick (헬드볼 confirm 모달 trigger).
            possessionArrow={possession.arrow}
            onArrowClick={isReadOnly ? undefined : handleArrowClick}
            // 2026-05-16 (긴급 박제 — 전후반 모드) — 쿼터 뱃지 라벨 분기 (Q{N} ↔ "전반/후반/OT{N}").
            periodFormat={periodFormat}
          />
        </div>

        {/* Phase 15 (2026-05-12) — 본문 영역 좌:우 50:50 (FIBA PDF 정합).
            좌 = Team A (상) + Team B (중) + FooterSignatures (하) 세로 누적 (FIBA PDF 정합)
            우 = Running Score + Period Scores + Final + Winner 누적
            모바일 (md 미만) = 1 컬럼 / 태블릿 이상 = 2 컬럼 + 중앙 fiba-divider-right

            Phase 14 → Phase 15 핵심: 풋터가 frame 가로 펼침 (잘못된 위치) → 좌측 col 안 Team B 아래로 이동.
            이유 (사용자 결재 §1 / 이미지 35): FIBA PDF 정합 (좌측 = Team A + Team B + Coach + 풋터). */}
        {/* 2026-05-15 (PR-E-2) — grid 2x2 정합 (사용자 요청):
            좌상 = Team A+B (한 cell 묶음) / 우상 = Running Score
            좌하 = Signatures / 우하 = Period Scores
            grid auto rows = max(좌, 우) → 같은 row 양 자식 자동 stretch (자식 잘림 0). */}
        {/* 2026-05-16 (PR-Layout-Unify) — 사용자 보고 fix.
            grid 부모 = gap 2px + backgroundColor 검정 (light 강제 + cell #fff bg 박혀 갭만 검정).
            자식 cell wrapper = inline border 제거 (grid gap 으로 영역 구분만 의존).
            divider class (md-fiba-divider-right / fiba-divider-bottom) 제거 — 중복 1px 차단.
            data-grid-frame="2x2" = 인쇄 시 background 검정 강제 (_print.css PR-Print-Grid-Bg). */}
        <div
          className="grid grid-cols-1 md:grid-cols-2"
          data-grid-frame="2x2"
          style={{ gap: "2px", backgroundColor: "#1A1E27" }}
        >
          {/* 좌상 — Team A + Team B 묶음 cell. inline border 제거 (grid gap 의존). */}
          <div className="flex flex-col" data-ss-area="left-top">
            {/* Team A — 상단 (Time-outs + Team Fouls + Players 12행 + Coach) */}
            <div className="fiba-divider-bottom">
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
                // Phase 19 PR-Stat3 — 6 stat wiring (양 팀 통합 record / TeamSection 이 자신의 id 만 lookup)
                playerStats={playerStats}
                onRequestOpenStatPopover={(playerId, statKey) =>
                  handleRequestOpenStatPopover("home", playerId, statKey)
                }
                // Phase 23 PR-RO2 (2026-05-15) — 종료 매치 차단 (사용자 결재 Q2).
                //   disabled = button (foul/timeout/stat cell) + checkbox 차단
                //   readOnly = input (coach/asstCoach) 차단
                disabled={isReadOnly}
                readOnly={isReadOnly}
                frameless
                // 2026-05-16 (긴급 박제 — 전후반 모드) — Team fouls Period 라벨 + timeout phase 분기.
                periodFormat={periodFormat}
                // 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
                benchTechnical={benchTechnical.home}
                onRequestAddCoachFoul={() => handleRequestAddCoachFoul("home")}
                onRequestRemoveLastCoachFoul={() =>
                  handleRequestRemoveLastCoachFoul("home")
                }
                delayOfGame={delayOfGame.home}
                onRequestDelayClick={() => handleRequestDelayClick("home")}
                onRequestRemoveLastDelay={() =>
                  handleRequestRemoveLastDelay("home")
                }
              />
            </div>
            {/* Team B — 중단 (FIBA PDF 정합 — Team A 와 동일 구조 세로 분할).
                Phase 15: 하단 → 중단 (아래에 풋터 추가). */}
            <div className="fiba-divider-bottom">
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
                // Phase 19 PR-Stat3 — 6 stat wiring (양 팀 통합 record / TeamSection 이 자신의 id 만 lookup)
                playerStats={playerStats}
                onRequestOpenStatPopover={(playerId, statKey) =>
                  handleRequestOpenStatPopover("away", playerId, statKey)
                }
                // Phase 23 PR-RO2 (2026-05-15) — 종료 매치 차단 (사용자 결재 Q2 — Team A 와 동일 패턴)
                disabled={isReadOnly}
                readOnly={isReadOnly}
                frameless
                // 2026-05-16 (긴급 박제 — 전후반 모드) — Team B 도 동일 wiring.
                periodFormat={periodFormat}
                // 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
                benchTechnical={benchTechnical.away}
                onRequestAddCoachFoul={() => handleRequestAddCoachFoul("away")}
                onRequestRemoveLastCoachFoul={() =>
                  handleRequestRemoveLastCoachFoul("away")
                }
                delayOfGame={delayOfGame.away}
                onRequestDelayClick={() => handleRequestDelayClick("away")}
                onRequestRemoveLastDelay={() =>
                  handleRequestRemoveLastDelay("away")
                }
              />
            </div>
          </div>

          {/* 우상 — Running Score. inline border 제거 (grid gap 의존). */}
          <div data-ss-area="right-top">
            <RunningScoreGrid
              state={runningScore}
              onChange={setRunningScore}
              homePlayers={homeFilteredRoster.players}
              awayPlayers={awayFilteredRoster.players}
              homeTeamName={homeFilteredRoster.teamName}
              awayTeamName={awayFilteredRoster.teamName}
              readOnly={isReadOnly}
              frameless
              onEndPeriod={isReadOnly ? undefined : handleEndPeriod}
              // 2026-05-16 (PR-Quarter-Retreat) — 사용자 보고. 2쿼터+ 시 "이전 쿼터" 버튼.
              //   handleRetreatPeriod = confirm modal + setRunningScore (currentPeriod-1).
              //   종료/read-only 매치 = undefined (수정 모드 진입 시 활성).
              onRetreatPeriod={isReadOnly ? undefined : handleRetreatPeriod}
            />
          </div>

          {/* 좌하 — Signatures (Scorer/Timer/Referee/Umpire/Captain 등). inline border 제거 (grid gap 의존). */}
          <div data-ss-area="left-bottom">
            <FooterSignatures
              values={signatures}
              onChange={setSignatures}
              headerReferee={header.referee}
              headerUmpire1={header.umpire1}
              headerUmpire2={header.umpire2}
              readOnly={isReadOnly}
              frameless
            />
          </div>

          {/* 우하 — Period Scores + Final + Winner. inline border 제거 (grid gap 의존). */}
          <div data-ss-area="right-bottom">
              <PeriodScoresSection
                state={runningScore}
                homeTeamName={homeFilteredRoster.teamName}
                awayTeamName={awayFilteredRoster.teamName}
                onAdvancePeriod={handleAdvancePeriod}
                onRetreatPeriod={handleRetreatPeriod}
                onEndPeriod={handleEndPeriod}
                // Phase 23 PR-RO2 (2026-05-15) — 종료 매치 OT 종료 빨강 버튼 차단 (사용자 결재 Q2)
                // Phase 23 PR-EDIT3 (2026-05-15) — 수정 모드 시 우회 (Q3 + Q5)
                disabled={isReadOnly}
                frameless
                // 2026-05-16 (PR-Winner-Gate) — 경기 종료 시에만 NAME OF WINNING TEAM 표시.
                matchEnded={matchEndSubmitted}
                // 2026-05-16 (긴급 박제 — 전후반 모드) — Period row 라벨 분기 (전반/후반 + Q3/Q4 hide).
                periodFormat={periodFormat}
              />
          </div>
        </div>
      </div>

      {/* Phase 17 — 쿼터별 색상 안내 Legend (사용자 결재 §6).
          Phase 20.1 (2026-05-13 사용자 보고 이미지 48) — 위치 변경: frame 외부 하단 → 제거 (frame 콘텐츠 overflow + Final Score/Captain 영역과 시각 겹침).
          본 위치 = frame 외부 상단으로 이동 (return main 안 frame 직전 / 진입 즉시 운영자 인식). */}

      {/* Phase 3.5 — 경기 종료 버튼 (BFF POST + 라이브 발행).
          이유: 운영자가 Q4(또는 OT) 종료 후 명시적 매치 종료 트리거.
          MatchEndButton 내부에서 confirm modal + 응답 처리.

          Phase 19 PR-S2 (2026-05-14) — controlled mode:
            - frame 하단 큰 "경기 종료" 버튼 + 종료 후 카드 hide (hideTriggerButton=true).
              → 시안 toolbar 가 trigger 흡수 → 시각 중복 방지.
            - open / onOpenChange = 외부 toolbar 가 모달 open 제어 (matchEndOpen state).
            - confirm modal + BFF submit + 토스트 흐름 = 100% 보존 (컴포넌트 내부 그대로).
            - buildPayload / final / props 모두 기존 그대로. */}
      <MatchEndButton
        matchId={match.id}
        homeTeamName={homeFilteredRoster.teamName}
        awayTeamName={awayFilteredRoster.teamName}
        final={computeFinalScore(runningScore)}
        buildPayload={buildSubmitPayload}
        open={matchEndOpen}
        onOpenChange={setMatchEndOpen}
        hideTriggerButton
        // PR-S2 후속 fix 3 (2026-05-14) — submitted 상태를 외부로 lifting.
        //   toolbar 의 "경기 종료" 버튼 disabled 시각 분기를 위함. 콜백 외 영향 0.
        //
        // Phase 23 PR4 (2026-05-15) — submit audit 보강 (사용자 결재 Q3).
        //   completed 매치 재제출 시 audit endpoint 호출 — context="completed_edit_resubmit".
        //   isCompleted + submitted=true 전환 시 1회 fetch (fire-and-forget).
        //   MatchEndButton 내부 변경 0 (lifting state up 패턴 유지).
        onSubmittedChange={(submitted) => {
          setMatchEndSubmitted(submitted);
          // 2026-05-15 (PR-A / P1-4) — submit 성공 시 draft 자동 삭제.
          //   이전: reset 만 삭제 → 다음 진입 시 draft.savedAt > matchUpdatedAt 으로
          //   불필요한 ConfirmModal 노출. submit 성공 = DB 최신 = draft 무가치.
          if (submitted && typeof window !== "undefined") {
            try {
              clearDraft(match.id);
            } catch {
              /* localStorage 접근 실패 silent */
            }
          }
          // 완료된 매치 재제출 시 audit 박제 (사용자 결재 Q3 — 차단 ❌ / 추적만)
          if (submitted && isCompleted && typeof window !== "undefined") {
            fetch(`/api/web/score-sheet/${match.id}/cross-check-audit`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                warning_type: "completed_edit_resubmit",
                details: {
                  extra: {
                    match_status: match.status ?? null,
                    match_updated_at: matchUpdatedAtISO ?? null,
                    pbp_count: pbpCount ?? 0,
                  },
                },
              }),
            }).catch((err) => {
              // audit 실패 = 운영 영향 0 (재제출 자체는 성공 / 추적만 미박제)
              console.warn(
                "[score-sheet:Phase23:PR4] completed-edit-resubmit audit 실패",
                err,
              );
            });
          }
        }}
      />

      {/* 2026-05-15 (PR-SS-Manual+Reselect) — Phase 9 안내 박스 + "라인업 다시 선택"
          버튼 form 하단에서 제거. 라인업 다시 선택 = toolbar 우측으로 이동
          (사용자 요청). 설명서 = toolbar "설명서" 버튼 → ConfirmModal 모달. */}

      {/* Phase 3.5 — FoulTypeModal (전역 마운트 — open 시만 렌더).
          Phase 23 PR-RO2 (2026-05-15) — 종료 매치 차단 (사용자 결재 Q2 — open 강제 false).
            handleRequestAddFoul 가드 + open 분기 가드 = 이중 방어. */}
      <FoulTypeModal
        open={(!isReadOnly) && foulModalCtx !== null}
        playerName={foulModalCtx?.playerName ?? ""}
        jerseyNumber={foulModalCtx?.jerseyNumber ?? null}
        period={runningScore.currentPeriod}
        onSelect={handleSelectFoulType}
        onCancel={() => setFoulModalCtx(null)}
      />

      {/* 2026-05-16 (긴급 박제 — Bench Technical / FIBA Article 36.3 / 36.4).
          Coach row 우측 빈 cell 클릭 시 open — C / B_HEAD / B_BENCH 라디오 선택.
          종료 매치 차단 (open 강제 false / 이중 방어). */}
      <BenchTechModal
        open={(!isReadOnly) && benchTechModalCtx !== null}
        teamLabel={benchTechModalCtx?.teamLabel ?? ""}
        period={runningScore.currentPeriod}
        onSelect={handleSelectCoachFoul}
        onCancel={() => setBenchTechModalCtx(null)}
      />

      {/* Phase 19 PR-Stat2 (2026-05-15) — StatPopover (6 stat OR/DR/A/S/B/TO +1/-1).
          사용자 결재 Q2 = 신규 StatPopover (+1/-1 옵션) — 4종 모달 패턴과 다른 popover 형식.
          open 시만 렌더 — 운영 동작 보존 (FoulTypeModal 패턴 일관). */}
      {/* Phase 23 PR-RO2 (2026-05-15) — 종료 매치 차단 (open 강제 false / 이중 방어) */}
      <StatPopover
        open={(!isReadOnly) && statPopoverCtx !== null}
        playerName={statPopoverCtx?.playerName ?? ""}
        jerseyNumber={statPopoverCtx?.jerseyNumber ?? null}
        statKey={statPopoverCtx?.statKey ?? "or"}
        currentValue={
          statPopoverCtx
            ? getStat(
                playerStats,
                statPopoverCtx.playerId,
                statPopoverCtx.statKey
              )
            : 0
        }
        onAdd={handleAddStat}
        onRemove={handleRemoveStat}
        onClose={() => setStatPopoverCtx(null)}
      />
        </>
      )}

      {/* Phase 7-B — LineupSelectionModal (전역 마운트).
          lineupModalOpen=true 시만 렌더. 양식 미렌더 (lineup === null) 인 경우에도 표시.
          Phase 23 PR-RO2 (2026-05-15) — 종료 매치 차단 (사용자 결재 Q2 — open 강제 false).
            라인업 재선택 진입점 차단 (handleLineupConfirm 가드 + open 분기 가드 이중 방어). */}
      <LineupSelectionModal
        open={(!isReadOnly) && lineupModalOpen}
        homeTeamName={homeRoster.teamName}
        awayTeamName={awayRoster.teamName}
        homePlayers={homeRoster.players}
        awayPlayers={awayRoster.players}
        initialHome={lineup?.home}
        initialAway={lineup?.away}
        onConfirm={handleLineupConfirm}
        // 2026-05-15 (PR-Lineup-Close-UX) — onCancel 항상 박제. 사용자 보고
        //   "라이브 페이지에서 X/닫기 없음". 닫기 후 양식이 lineup null 인 채
        //   렌더되어도 사용자가 다시 "라인업 다시 선택" 트리거로 진입 가능.
        //   기존 박제: lineup === null 시 onCancel undefined → 모달 강제 = 닫기 0.
        onCancel={() => setLineupModalOpen(false)}
        // Phase 7.1 — 12명 cap 경고 / 13번째 차단 toast 책임 주입
        onToast={showToast}
      />

      {/* Phase 7-C — QuarterEndModal (Q4 / OT 종료 분기).
          Phase 23 PR-RO2 (2026-05-15) — 종료 매치 차단 (open 강제 false / 이중 방어) */}
      <QuarterEndModal
        open={(!isReadOnly) && quarterEndModal !== null}
        mode={quarterEndModal?.mode ?? "quarter4"}
        currentPeriod={quarterEndModal?.period ?? 4}
        homeTeamName={homeFilteredRoster.teamName}
        awayTeamName={awayFilteredRoster.teamName}
        homeTotal={computeFinalScore(runningScore).homeTotal}
        awayTotal={computeFinalScore(runningScore).awayTotal}
        onEndMatch={handleEndMatchFromQuarterEnd}
        onContinueToOvertime={handleContinueToOvertime}
        onCancel={() => setQuarterEndModal(null)}
        // 2026-05-16 (긴급 박제 — 전후반 모드 / 사용자 보고 이미지 #160).
        //   halves 모드 매치 = "후반 종료" 라벨 / quarters 모드 = "Q4 종료" (기존 보존).
        periodFormat={periodFormat}
      />

      {/* 2026-05-16 (PR-PBP-Edit) — PBP 조회/수정 플로팅 모달.
          toolbar "기록수정" 버튼 → setPbpEditModalOpen(true) → 본 모달 표시.
          "저장" 시 handleApplyPbpEdit → setRunningScore() 박제 (즉시 BFF 호출 X — form 자연 흐름).
          종료 매치 + 수정 모드 미진입 시 open=false 강제 (이중 방어 — toolbar 버튼이 이미 미노출). */}
      <PbpEditModal
        open={(!isReadOnly) && pbpEditModalOpen}
        marks={runningScore}
        homeRoster={homeRoster.players}
        awayRoster={awayRoster.players}
        homeTeamName={homeRoster.teamName}
        awayTeamName={awayRoster.teamName}
        onApply={handleApplyPbpEdit}
        onClose={() => setPbpEditModalOpen(false)}
      />

      {/* 2026-05-16 (PR-Possession-2) — JumpBallModal (경기 시작 점프볼 승자 선택).
          라인업 confirm 직후 자동 open (handleLineupConfirm 가드).
          isReadOnly 시 open 강제 false (이중 방어 — handler 가드 + 본 분기 가드).
          lineup === null 시 출전 명단이 없으므로 모달 안의 dropdown 도 빈 배열. */}
      <JumpBallModal
        open={(!isReadOnly) && jumpBallModalOpen}
        homeTeamName={homeFilteredRoster.teamName}
        awayTeamName={awayFilteredRoster.teamName}
        homePlayers={homeFilteredRoster.players}
        awayPlayers={awayFilteredRoster.players}
        onConfirm={handleJumpBallConfirm}
        onClose={() => setJumpBallModalOpen(false)}
      />

      {/* 2026-05-16 (PR-Possession-2) — PossessionConfirmModal (헬드볼 발생 시 공격권 변경 확인).
          헤더 화살표 클릭 시 open (handleArrowClick).
          takingTeam = possession.arrow (화살표 방향 = 공격권 획득 팀).
            possession.arrow === null 시 = 안전망 fallback "home" (실제 상황 = 발생 불가 — Opening Jump Ball 선행 필수).
          isReadOnly 시 open 강제 false (이중 방어 — handler 가드 + 본 분기 가드). */}
      <PossessionConfirmModal
        open={(!isReadOnly) && heldBallConfirmOpen}
        takingTeam={possession.arrow ?? "home"}
        takingTeamName={
          possession.arrow === "home"
            ? homeFilteredRoster.teamName
            : possession.arrow === "away"
              ? awayFilteredRoster.teamName
              : ""
        }
        onConfirm={handleHeldBallConfirm}
        onClose={() => setHeldBallConfirmOpen(false)}
      />

      {/* 2026-05-15 (PR-D-2) — ConfirmModal JSX 마운트는 ConfirmModalProvider 가 담당.
          form 안 직접 마운트 불필요. score-sheet route group layout 에 한 번 mount. */}
    </main>
  );
}
