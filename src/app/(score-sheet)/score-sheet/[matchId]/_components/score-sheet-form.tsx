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
import { useToast } from "@/contexts/toast-context";

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
  savedAt: string;
}

export function ScoreSheetForm({
  match,
  tournament,
  homeRoster,
  awayRoster,
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
  // Phase 3.5 — FoulTypeModal state (어떤 선수의 어떤 팀에 추가할지)
  const [foulModalCtx, setFoulModalCtx] = useState<{
    team: "home" | "away";
    playerId: string;
    playerName: string;
    jerseyNumber: number | null;
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
  }, [header, teamA, teamB, runningScore, fouls, timeouts, match.id]);

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

  // Phase 3.5 — "쿼터 종료" 큰 버튼 (PeriodScoresSection 의 onEndPeriod).
  //
  // 동작: currentPeriod++ + toast "Period N 종료". 사용자 결재 §4 채택.
  function handleEndPeriod() {
    const endedPeriod = runningScore.currentPeriod;
    const periodLabel = endedPeriod <= 4 ? `Q${endedPeriod}` : `OT${endedPeriod - 4}`;
    setRunningScore((prev) => ({
      ...prev,
      currentPeriod: Math.min(prev.currentPeriod + 1, 7),
    }));
    showToast(`${periodLabel} 종료 — 다음 Period 진행`, "info");
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
    return {
      home_score: final.homeTotal,
      away_score: final.awayTotal,
      quarter_scores: quarterScores,
      running_score: runningScore,
      fouls,
      // Phase 4 — timeouts (match.settings.timeouts JSON 박제)
      timeouts,
      status: "completed" as const,
      referee_main: header.referee || undefined,
      referee_sub1: header.umpire1 || undefined,
      referee_sub2: header.umpire2 || undefined,
    };
  }

  return (
    <main className="mx-auto w-full max-w-screen-md px-2 py-2">
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
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* 좌측 컬럼 — Team A 상 / Team B 하 */}
        <div className="flex flex-col gap-3">
          <TeamSection
            sideLabel="Team A"
            teamName={homeRoster.teamName}
            players={homeRoster.players}
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
            teamName={awayRoster.teamName}
            players={awayRoster.players}
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
            homePlayers={homeRoster.players}
            awayPlayers={awayRoster.players}
            homeTeamName={homeRoster.teamName}
            awayTeamName={awayRoster.teamName}
          />
          <PeriodScoresSection
            state={runningScore}
            homeTeamName={homeRoster.teamName}
            awayTeamName={awayRoster.teamName}
            onAdvancePeriod={handleAdvancePeriod}
            onRetreatPeriod={handleRetreatPeriod}
            onEndPeriod={handleEndPeriod}
          />
        </div>
      </div>

      {/* Phase 3.5 — 경기 종료 버튼 (BFF POST + 라이브 발행).
          이유: 운영자가 Q4(또는 OT) 종료 후 명시적 매치 종료 트리거.
          MatchEndButton 내부에서 confirm modal + 응답 처리 */}
      <MatchEndButton
        matchId={match.id}
        homeTeamName={homeRoster.teamName}
        awayTeamName={awayRoster.teamName}
        final={computeFinalScore(runningScore)}
        buildPayload={buildSubmitPayload}
      />

      {/* Phase 진행 상태 안내 */}
      <div
        className="mt-4 rounded-[4px] px-3 py-2 text-xs"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-muted)",
          border: "1px solid var(--color-border)",
        }}
      >
        Phase 4 = Time-outs (FIBA Article 18-19 전반2/후반3/OT1) 완성. 서명/노트 (Phase 5),
        인쇄 PDF (Phase 6) 는 후속 PR.
      </div>

      {/* Phase 3.5 — FoulTypeModal (전역 마운트 — open 시만 렌더) */}
      <FoulTypeModal
        open={foulModalCtx !== null}
        playerName={foulModalCtx?.playerName ?? ""}
        jerseyNumber={foulModalCtx?.jerseyNumber ?? null}
        period={runningScore.currentPeriod}
        onSelect={handleSelectFoulType}
        onCancel={() => setFoulModalCtx(null)}
      />
    </main>
  );
}
