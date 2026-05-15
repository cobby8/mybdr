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
// Phase 23 PR6 (2026-05-15) — ConfirmModal (draft vs DB 우선순위 사용자 선택용).
//   기존 inline window.confirm() 대체 — 4종 모달 시각 정합 + 인쇄 차단 + 토큰 일관.
import { ConfirmModal } from "./confirm-modal";
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
  // Phase 19 PR-Stat3 (2026-05-15) — 6 stat 박제 (mid-game reload 후 OR/DR/A/S/B/TO 복원).
  //   사용자 결재 Q3 = match_player_stats 직접 박제 / DB 변경 0.
  playerStats: PlayerStatsState;
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
}: ScoreSheetFormProps) {
  const [header, setHeader] = useState<FibaHeaderInputs>(EMPTY_HEADER);
  const [teamA, setTeamA] = useState<TeamSectionInputs>(EMPTY_TEAM);
  const [teamB, setTeamB] = useState<TeamSectionInputs>(EMPTY_TEAM);
  // Phase 2 — Running Score state.
  // Phase 23 (2026-05-14) — DB SELECT 결과로 초기값 박제 (?? EMPTY_*).
  //   기존 동작 100% 보존: prop 미전달 (=undefined) 시 EMPTY 폴백 = 신규 매치 진입과 동일.
  const [runningScore, setRunningScore] = useState<RunningScoreState>(
    initialRunningScore ?? EMPTY_RUNNING_SCORE
  );
  // Phase 3 — Fouls state (FIBA 1-5 Player Fouls + Team Fouls 자동 합산 source)
  const [fouls, setFouls] = useState<FoulsState>(initialFouls ?? EMPTY_FOULS);
  // Phase 4 — Timeouts state (FIBA Article 18-19 전반2/후반3/OT1)
  const [timeouts, setTimeouts] = useState<TimeoutsState>(
    initialTimeouts ?? EMPTY_TIMEOUTS
  );
  // Phase 5 — Signatures state (FIBA 양식 풋터 8 입력 + notes).
  //   Phase 23: initialSignatures 가 있으면 EMPTY 와 spread merge (구버전 partial 박제 호환).
  //   initialNotes 가 있으면 signatures.notes 로 통합 (DB notes 컬럼 별도 — 폼은 signatures 단일 source).
  const [signatures, setSignatures] = useState<SignaturesState>(() => {
    const base = initialSignatures
      ? { ...EMPTY_SIGNATURES, ...initialSignatures }
      : EMPTY_SIGNATURES;
    // notes 는 TournamentMatch.notes 컬럼이 우선 (BFF 별도 update 흐름) — 있으면 덮어쓰기
    if (initialNotes && initialNotes.length > 0) {
      return { ...base, notes: initialNotes };
    }
    return base;
  });
  // Phase 3.5 — FoulTypeModal state (어떤 선수의 어떤 팀에 추가할지)
  const [foulModalCtx, setFoulModalCtx] = useState<{
    team: "home" | "away";
    playerId: string;
    playerName: string;
    jerseyNumber: number | null;
  } | null>(null);

  // Phase 19 PR-Stat3 (2026-05-15) — 6 stat (OR/DR/A/S/B/TO) state.
  //   사용자 결재 Q1 (위치) / Q2 (StatPopover) / Q3 (DB 변경 0 — match_player_stats 직접 박제).
  //   initialPlayerStats 가 있으면 page.tsx 의 match_player_stats SELECT 결과 사용 (재진입 자동 로드).
  //   양 팀 통합 단일 record (key = tournamentTeamPlayerId.toString()) — TeamSection 이 자신의 id 만 lookup.
  const [playerStats, setPlayerStats] = useState<PlayerStatsState>(
    initialPlayerStats ?? EMPTY_PLAYER_STATS
  );

  // Phase 19 PR-Stat3 — StatPopover state (어떤 선수의 어떤 stat 을 +1/-1 할지).
  //   null = 닫힘 / { ...컨텍스트 } = 열림. team 분기 = 안전망 (cell 클릭 시 caller 가 분기 처리).
  const [statPopoverCtx, setStatPopoverCtx] = useState<{
    team: "home" | "away";
    playerId: string;
    playerName: string;
    jerseyNumber: number | null;
    statKey: StatKey;
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

  // Phase 23 PR6 (2026-05-15) — ConfirmModal state (draft vs DB 우선순위 사용자 선택용).
  //
  // 왜 (이유):
  //   reviewer WARN 1건 = PR3 의 inline window.confirm() 가 운영 4종 모달 패턴과 다름.
  //   Promise 패턴으로 캡슐화 → ConfirmModal 의 onSelect / onClose 가 resolve(value) 호출.
  //   호출자는 `await confirmModal({ title, message, options })` 형태로 사용.
  //
  // 어떻게:
  //   - confirmState = null = 모달 닫힘 / { ...config, resolve } = 모달 열림
  //   - confirmModal(config) = Promise 반환 + resolve fn 박제. onSelect / onClose 에서 호출.
  //   - useEffect 안에서 await 가능. 4종 모달 + 새 ConfirmModal 동시 열림 0 (운영자 흐름상 단일).
  type ConfirmConfig = {
    title: string;
    message: ReactNode;
    options: { value: string; label: string; isPrimary?: boolean; isDestructive?: boolean }[];
    // 2026-05-15 (PR-SS-Manual-Wide) — 모달 폭 — default md / lg / xl. 설명서 = xl.
    size?: "md" | "lg" | "xl";
  };
  const [confirmState, setConfirmState] = useState<
    | (ConfirmConfig & { resolve: (value: string | null) => void })
    | null
  >(null);

  // confirm 모달 호출 헬퍼 — Promise 반환.
  //   - 선택 시 옵션 value 반환
  //   - ESC / backdrop 닫기 시 null 반환 (호출자가 취소 분기 처리)
  function confirmModal(cfg: ConfirmConfig): Promise<string | null> {
    return new Promise((resolve) => {
      setConfirmState({ ...cfg, resolve });
    });
  }

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
    setConfirmState(null);

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
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(DRAFT_KEY_PREFIX + match.id);
        } catch {
          /* localStorage 접근 실패 silent */
        }
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
  //   toolbar "설명서" 버튼 클릭 시 호출. ConfirmModal 재사용 — options 1개 (닫기) +
  //   message 에 작성법 7항목 JSX. 사용자 의도 = 플로팅 안내로 빠르게 확인 가능.
  async function handleOpenManual() {
    await confirmModal({
      title: "전자 기록지 작성법",
      size: "xl",
      message: (
        <div className="space-y-4 text-sm">
          {/* 색상/점수 표기 안내 박스 (작성법 위쪽). */}
          <PeriodColorLegend />

          {/* 경기 시작 전 */}
          <section>
            <h3 className="mb-1 text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              경기 시작 전
            </h3>
            <ol className="ml-5 list-decimal space-y-2 text-sm">
              <li>
                <strong>선수 명단 정하기</strong> — 화면 위쪽 <em>"라인업"</em> 버튼을 누르세요.
                양 팀에서 오늘 경기에 나올 선수들을 체크하고, 그 중 선발 5명을 따로 표시해주세요.
                라인업을 확정하면 선발 5명은 자동으로 <em>"P. in"</em> (코트 안) 표시가 됩니다.
                후보 선수는 실제로 경기에 들어갈 때 직접 "P. in" 칸을 눌러주세요.
              </li>
            </ol>
          </section>

          {/* 경기 진행 중 */}
          <section>
            <h3 className="mb-1 text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              경기 진행 중
            </h3>
            <ol start={2} className="ml-5 list-decimal space-y-2 text-sm">
              <li>
                <strong>점수 기록</strong> — 점수를 넣은 선수 행에서 해당 점수 칸을 누르세요.
                <span className="block">· (작은 점) = 1점 / ● (채워진 원) = 2점 / ◉ (테두리 원) = 3점</span>
                현재 쿼터 색깔로 표시됩니다 (Q1 검정 / Q2 빨강 / Q3 초록 / Q4 노랑).
              </li>
              <li>
                <strong>파울 기록</strong> — 파울을 한 선수의 <em>"Fouls"</em> 영역에서 1~5번
                칸 중 비어있는 첫 칸을 누르세요. 5번째 파울이 기록되면 더 이상 입력되지 않고
                화면에 알림이 뜹니다.
              </li>
              <li>
                <strong>팀 파울 누적</strong> — <em>"Team fouls"</em> 영역은 한 쿼터에서 팀이
                범한 전체 파울 수입니다. 1~4까지 표시하며, 4를 넘으면 다음 파울부터 상대 팀에게
                자유투를 부여한다는 안내가 화면에 뜹니다. <em>"Extra periods"</em> 는 연장전용입니다.
              </li>
              <li>
                <strong>타임아웃</strong> — 양 팀 <em>"Time-outs"</em> 영역에 표시합니다.
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li>윗줄 (Period ①②) = 전반 (1·2쿼터) 동안 쓸 수 있는 2개</li>
                  <li>가운데 줄 (Period ③④) = 후반 (3·4쿼터) 동안 쓸 수 있는 3개</li>
                  <li>아랫줄 (Extra periods) = 연장전</li>
                </ul>
                후반에 들어가면 전반 칸이 자동으로 잠겨서 더 이상 누를 수 없습니다.
              </li>
            </ol>
          </section>

          {/* 쿼터 / 경기 종료 */}
          <section>
            <h3 className="mb-1 text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              쿼터 / 경기 종료
            </h3>
            <ol start={6} className="ml-5 list-decimal space-y-2 text-sm">
              <li>
                <strong>쿼터 끝났을 때</strong> — 화면 아래쪽 <em>"Q1 종료" / "Q2 종료" …</em>
                버튼을 누르면 안내 창이 뜹니다.
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li>Q1~Q3 끝: "다음 쿼터 진행" 누르세요.</li>
                  <li>Q4 끝: 동점이면 "OT (연장전) 진행" / 점수 차이가 있으면 "경기 종료".</li>
                  <li>연장전 끝: 또 동점이면 추가 연장전 / 결판 나면 경기 종료.</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* 기타 기능 */}
          <section>
            <h3 className="mb-1 text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              기타 기능
            </h3>
            <ol start={7} className="ml-5 list-decimal space-y-2 text-sm">
              <li>
                <strong>잘못 기록했어요 (기록 취소)</strong> — 테스트로 입력했거나 처음부터
                다시 기록해야 할 때, 화면 위쪽 우측 <em>"기록 취소"</em> 버튼을 누르세요.
                경고 창이 뜨고, 확인하면 이 경기의 점수·파울·라인업·등번호 기록이 모두
                완전히 삭제되며 이전 페이지로 돌아갑니다.
                <span className="block text-xs" style={{ color: "var(--color-text-muted)" }}>
                  (대회 운영자만 가능 — 일반 기록원은 보이지 않습니다)
                </span>
              </li>
              <li>
                <strong>인쇄 / 전체화면</strong> — <em>"인쇄"</em> 버튼은 FIBA 공식 양식
                그대로 PDF/종이로 출력합니다. 화면 위쪽 <em>⛶ 전체화면</em> 버튼은 태블릿
                세로 모드로 양식만 크게 보여줍니다 (종료는 우상단 ✕).
              </li>
              <li>
                <strong>이전 페이지로</strong> — 화면 위쪽 좌측 <em>&lt;</em> 버튼을 누르면
                이 기록지에 들어오기 전 페이지 (경기 일정 / 대진표 등) 로 돌아갑니다.
              </li>
            </ol>
          </section>
        </div>
      ),
      options: [{ value: "close", label: "닫기", isPrimary: true }],
    });
    setConfirmState(null);
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
    // 모달 닫기 — Promise resolve 후 모달 unmount
    setConfirmState(null);

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

  // Phase 23 PR4 (2026-05-15) — status="completed" 매치 수정 가드 (사용자 결재 Q3).
  //
  // 왜 (이유):
  //   매치가 이미 종료된 상태 (status="completed") 인데 운영자가 score-sheet 재진입 = 수정 의도.
  //   사용자 결재 Q3 = 차단 ❌ / UI 경고 + audit 박제. 운영자가 사고를 인식할 수 있어야 함.
  //
  // 어떻게:
  //   1. isCompleted 플래그 — match.status === "completed" 일 때 true.
  //   2. mount 1회 노란 배너 표시 (cross-check 배너 패턴 일관 / no-print).
  //   3. mount 1회 cross-check-audit endpoint POST — context="completed_edit_entry".
  //   4. 운영자 submit 시 별도 audit POST — context="completed_edit_resubmit"
  //      (MatchEndButton 의 onSubmittedChange 콜백 분기 안에서 부모가 호출).
  //
  // 운영 동작 보존:
  //   - 운영자 input / submit 차단 ❌ — 배너 + audit 만.
  //   - audit fetch 실패 = console.warn + 진행 (silent fail).
  //   - status !== "completed" 매치 = 변경 0 (회귀 0).
  const isCompleted = match.status === "completed";

  // Phase 23 PR-EDIT1 (2026-05-15) — 종료 매치 수정 모드 state (사용자 결재 Q3).
  //
  // 왜 (이유):
  //   RO 차단 (PR-RO1~RO4) = isCompleted 단일 조건. 수정 모드 진입 = isCompleted=true + isEditMode=true.
  //   isEditMode=true 일 때 모든 차단 분기 우회 (사용자가 명시적으로 수정 동의).
  //
  // 어떻게:
  //   - default false (진입 시 RO 차단 유지)
  //   - toolbar "수정 모드" 버튼 클릭 → handleEnterEditMode() → confirm modal → 동의 시 setIsEditMode(true)
  //   - 모든 차단 분기 = `if (isCompleted && !isEditMode) return;` 패턴 (isEditMode 우회 분기)
  //
  // 운영 동작 보존:
  //   - 진행 중 매치 (isCompleted=false) = isEditMode 분기 무관 (이미 통과 / 회귀 0).
  //   - 종료 매치 + isEditMode=false = RO 차단 유지 (PR-RO 동작 보존).
  //   - 종료 매치 + isEditMode=true = 모든 차단 우회 + 재제출 시 audit 박제.
  const [isEditMode, setIsEditMode] = useState(false);

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
        const raw = window.localStorage.getItem(DRAFT_KEY_PREFIX + match.id);
        if (!raw) return;
        const draft = JSON.parse(raw) as Partial<DraftPayload>;

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
              // 모달 닫기 — Promise resolve 후 모달 unmount
              setConfirmState(null);
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
          // Phase 19 PR-Stat3 — 6 stat draft 박제
          playerStats,
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
  }, [header, teamA, teamB, runningScore, fouls, timeouts, signatures, lineup, playerStats, match.id]);

  // Period 진행/후퇴 — Phase 4 통합 전 임시 버튼 (PeriodScoresSection 안).
  // Phase 23 PR-RO2 (2026-05-15) — 종료 매치 차단 (사용자 결재 Q2 — 모든 핸들러 isCompleted early return).
  function handleAdvancePeriod() {
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3)
    setRunningScore((prev) => ({
      ...prev,
      currentPeriod: Math.min(prev.currentPeriod + 1, 9),
    }));
  }
  function handleRetreatPeriod() {
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3)
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3)
    const endedPeriod = runningScore.currentPeriod;
    // Q1~Q3 종료 = 기존 동작 (자동 진입)
    if (endedPeriod <= 3) {
      setRunningScore((prev) => ({
        ...prev,
        currentPeriod: Math.min(prev.currentPeriod + 1, 9),
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3 / quarter-end modal 진입점)
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3)
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3 / 모달 mount)
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3)
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3)
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3)
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3 / popover mount)
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3)
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3)
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
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3)
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

  // Phase 3.5 — 경기 종료 BFF payload 빌더 (MatchEndButton 가 호출).
  //
  // 이유: status="completed" + running_score + fouls + quarter_scores 동시 박제.
  //   - quarter_scores: Phase 2 toQuarterScoresJson 헬퍼 재사용 (기존 sync API 호환)
  //   - running_score: position-mark 시계열 (PaperPBP score event 박제 source)
  //   - fouls: P/T/U/D 종류 + period (PaperPBP foul event 박제 source)
  //   - referee_main / umpire1 / umpire2 = header state 의 audit context 박제
  // 2026-05-15 (PR-D / P2-7) — buildSubmitPayload 외부 추출.
  //   lib/score-sheet/build-submit-payload.ts 가 순수 함수로 박제. vitest 가능.
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
    });
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

  // 모달 → 라인업 확정 콜백.
  //
  // Phase 16 (2026-05-13) — 라인업 확정 시 starters + substitutes 전체 P.IN=true 자동 체크.
  //   이유: 사용자 결재 §1 — 출전 명단으로 박제된 선수 = 경기 출전 = P.IN 자동 마킹 부담 0.
  //   기존 동작: 운영자가 12명 P.IN 일일이 체크 → 중복 부담 + 라인업 의미와 모순.
  //   변경: 모달 confirm 시 양 팀 모든 라인업 선수의 playerIn=true 자동 fill (한 번에).
  function handleLineupConfirm(result: LineupSelectionResult) {
    if (isCompleted && !isEditMode) return; // Phase 23 PR-EDIT3 — 수정 모드 시 우회 (Q2 + Q3 — 라인업 재선택)
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
          if (isCompleted && !isEditMode) return;
          setMatchEndOpen(true);
        }}
        backHref="/admin"
        // PR-S2 후속 fix 3 (2026-05-14) — 종료 후 종료 버튼 disabled 시각 분기 (유지).
        endMatchDisabled={matchEndSubmitted}
        // Phase 23 PR-RO3 (2026-05-15) — 종료 매치 진입 시 경기 종료 버튼 hidden (사용자 결재 Q2).
        //   인쇄 / ← 메인 만 노출 / 종료 버튼 진입점 차단.
        // Phase 23 PR-EDIT3 (2026-05-15) — 수정 모드 시 = 경기 종료 다시 노출 (재제출 허용).
        //   isCompleted && !isEditMode 시만 hide (수정 모드 활성 시 종료 버튼 활성).
        hideEndMatch={isCompleted && !isEditMode}
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
          !isCompleted || isEditMode ? () => setLineupModalOpen(true) : undefined
        }
        // 2026-05-15 (PR-SS-Manual+Reselect) — 설명서 (작성법) 모달.
        onOpenManual={handleOpenManual}
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
        {/* 헤더 영역 (~10% / 110px) — 4 줄 컴팩트 inline 라벨 */}
        <div className="fiba-divider-bottom">
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
            readOnly={isCompleted && !isEditMode}
            frameless
          />
        </div>

        {/* Phase 15 (2026-05-12) — 본문 영역 좌:우 50:50 (FIBA PDF 정합).
            좌 = Team A (상) + Team B (중) + FooterSignatures (하) 세로 누적 (FIBA PDF 정합)
            우 = Running Score + Period Scores + Final + Winner 누적
            모바일 (md 미만) = 1 컬럼 / 태블릿 이상 = 2 컬럼 + 중앙 fiba-divider-right

            Phase 14 → Phase 15 핵심: 풋터가 frame 가로 펼침 (잘못된 위치) → 좌측 col 안 Team B 아래로 이동.
            이유 (사용자 결재 §1 / 이미지 35): FIBA PDF 정합 (좌측 = Team A + Team B + Coach + 풋터). */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* 좌측 컬럼 — Team A (상) + Team B (중) + FooterSignatures (하) (md 이상 = 우측 분할선).
              Phase 15: FooterSignatures 가 본 컬럼 안 마지막 child 로 이동 (FIBA PDF 정합). */}
          <div className="md-fiba-divider-right flex flex-col">
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
                disabled={isCompleted && !isEditMode}
                readOnly={isCompleted && !isEditMode}
                frameless
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
                disabled={isCompleted && !isEditMode}
                readOnly={isCompleted && !isEditMode}
                frameless
              />
            </div>
            {/* Phase 15 — FooterSignatures = 좌측 col 안 Team B 아래 (FIBA PDF 정합).
                2026-05-15 — mt-auto wrapper 추가. 좌측 column = Team A + Team B + FooterSignatures
                  stretch (grid stretch). FooterSignatures 가 bottom 정렬 = 우측 PeriodScoresSection
                  과 정확 매치 (양쪽 column 끝 자식 = bottom 베이스라인 동일). */}
            <div className="mt-auto">
            <FooterSignatures
              values={signatures}
              onChange={setSignatures}
              headerReferee={header.referee}
              headerUmpire1={header.umpire1}
              headerUmpire2={header.umpire2}
              // Phase 23 PR-RO2 (2026-05-15) — 종료 매치 input 차단 (사용자 결재 Q2)
              // Phase 23 PR-EDIT3 (2026-05-15) — 수정 모드 시 우회 (Q3 + Q5)
              readOnly={isCompleted && !isEditMode}
              frameless
            />
            </div>
          </div>

          {/* 우측 컬럼 — Running Score (상) + Period Scores + Final (하).
              FIBA PDF 정합 = Period scores 가 Running Score 박스 안 하단에 누적.
              2026-05-15 — RunningScoreGrid flex-1 + PeriodScoresSection mt-auto.
                좌측 column (Team A + B + Footer) 와 동일 height stretch + 끝 자식 bottom 정렬. */}
          <div className="flex flex-col">
            {/* PR-S6 (2026-05-14 rev2 롤백) — mode prop 제거. 시안 rev2 가 모드 토글을 제거하면서
                단일 모드 (= 기존 detail 동작) 통일.
                2026-05-15 — flex-1 wrapper 추가. Running Score 가 좌측 Team A+B 높이만큼 자동 확장. */}
            <div className="flex-1">
            <RunningScoreGrid
              state={runningScore}
              onChange={setRunningScore}
              homePlayers={homeFilteredRoster.players}
              awayPlayers={awayFilteredRoster.players}
              homeTeamName={homeFilteredRoster.teamName}
              awayTeamName={awayFilteredRoster.teamName}
              // Phase 23 PR-RO2 (2026-05-15) — 종료 매치 cell 클릭 차단 (사용자 결재 Q2).
              //   readOnly = onClick early return (모달 open / undo / addMark 차단)
              // Phase 23 PR-EDIT3 (2026-05-15) — 수정 모드 시 우회 (Q3 + Q5)
              readOnly={isCompleted && !isEditMode}
              frameless
              // 2026-05-15 — 쿼터 종료 = 헤더 우측 작은 버튼 (FIBA 양식 정합 / 기존 큰 버튼 영역 제거).
              onEndPeriod={isCompleted && !isEditMode ? undefined : handleEndPeriod}
            />
            </div>
            {/* Period scores + Final + Winner — Running Score 아래 누적 (FIBA PDF 정합).
                상단 분할선 = fiba-divider-top 으로 Running Score 와 시각 구분.
                2026-05-15 — mt-auto = column 의 bottom 정렬 (좌측 FooterSignatures 와 베이스라인 매치). */}
            <div className="fiba-divider-top mt-auto">
              <PeriodScoresSection
                state={runningScore}
                homeTeamName={homeFilteredRoster.teamName}
                awayTeamName={awayFilteredRoster.teamName}
                onAdvancePeriod={handleAdvancePeriod}
                onRetreatPeriod={handleRetreatPeriod}
                onEndPeriod={handleEndPeriod}
                // Phase 23 PR-RO2 (2026-05-15) — 종료 매치 OT 종료 빨강 버튼 차단 (사용자 결재 Q2)
                // Phase 23 PR-EDIT3 (2026-05-15) — 수정 모드 시 우회 (Q3 + Q5)
                disabled={isCompleted && !isEditMode}
                frameless
              />
            </div>
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
              window.localStorage.removeItem(DRAFT_KEY_PREFIX + match.id);
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
        open={(!isCompleted || isEditMode) && foulModalCtx !== null}
        playerName={foulModalCtx?.playerName ?? ""}
        jerseyNumber={foulModalCtx?.jerseyNumber ?? null}
        period={runningScore.currentPeriod}
        onSelect={handleSelectFoulType}
        onCancel={() => setFoulModalCtx(null)}
      />

      {/* Phase 19 PR-Stat2 (2026-05-15) — StatPopover (6 stat OR/DR/A/S/B/TO +1/-1).
          사용자 결재 Q2 = 신규 StatPopover (+1/-1 옵션) — 4종 모달 패턴과 다른 popover 형식.
          open 시만 렌더 — 운영 동작 보존 (FoulTypeModal 패턴 일관). */}
      {/* Phase 23 PR-RO2 (2026-05-15) — 종료 매치 차단 (open 강제 false / 이중 방어) */}
      <StatPopover
        open={(!isCompleted || isEditMode) && statPopoverCtx !== null}
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
        open={(!isCompleted || isEditMode) && lineupModalOpen}
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
        open={(!isCompleted || isEditMode) && quarterEndModal !== null}
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

      {/* Phase 23 PR6 (2026-05-15) — ConfirmModal (draft vs DB 우선순위 사용자 선택).
          inline window.confirm() 대체 — 4종 모달 시각 정합. confirmState !== null 시만 렌더. */}
      {confirmState && (
        <ConfirmModal
          open
          title={confirmState.title}
          message={confirmState.message}
          options={confirmState.options}
          size={confirmState.size}
          onSelect={(value) => confirmState.resolve(value)}
          onClose={() => confirmState.resolve(null)}
        />
      )}
    </main>
  );
}
