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
import type { TeamRosterData } from "./team-section-types";
import type { RunningScoreState } from "@/lib/score-sheet/running-score-types";
import { EMPTY_RUNNING_SCORE } from "@/lib/score-sheet/running-score-helpers";
import type { FoulsState } from "@/lib/score-sheet/foul-types";
import { EMPTY_FOULS } from "@/lib/score-sheet/foul-types";
import {
  addFoul,
  getPlayerFoulCount,
  getTeamFoulCountByPeriod,
  removeLastFoul,
} from "@/lib/score-sheet/foul-helpers";
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
  // toast 알림 — 5반칙 차단 + 5+ FT 자유투 부여 안내
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
  }, [header, teamA, teamB, runningScore, fouls, match.id]);

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

  // Phase 3 — Player Fouls 토글 (사용자 결재 §1 (a) / §2 (a) / §4 (a))
  //
  // 이유: TeamSection 의 Fouls 1-5 셀 클릭 시 분기 처리.
  //   - action="add": 다음 빈 칸 채움 (다음 파울 박제). 5반칙 도달 시 차단 + toast
  //   - action="remove": 마지막 마킹 1건 해제
  //   - 5+ Team Fouls 도달 시 자유투 부여 toast (사용자 결재 §4 (a))
  //   - 5반칙 도달 시 퇴장 안내 toast (사용자 결재 §2 (a))
  //
  // 방법: TeamSection button onClick 가 isLastFilled / isNextEmpty 로 add/remove 분기 후 호출.
  function handleToggleFoul(
    team: "home" | "away",
    playerId: string,
    action: "add" | "remove"
  ) {
    if (action === "remove") {
      setFouls((prev) => {
        const next = removeLastFoul(prev, team, playerId);
        if (next !== prev) {
          showToast("파울 1건 해제", "info");
        }
        return next;
      });
      return;
    }

    // action === "add"
    setFouls((prev) => {
      const result = addFoul(prev, team, {
        playerId,
        period: runningScore.currentPeriod,
      });
      if (!result.ok) {
        // 5반칙 차단 (TeamSection 의 isNextEmpty 가 막아야 하지만 안전망)
        showToast(result.reason, "error");
        return prev;
      }
      // 마킹 후 합산 — 5반칙 / 5+ FT toast
      const newTeamFouls =
        team === "home" ? result.state.home : result.state.away;
      const newPlayerCount = getPlayerFoulCount(newTeamFouls, playerId);
      const periodTeamCount = getTeamFoulCountByPeriod(
        newTeamFouls,
        runningScore.currentPeriod
      );

      // 5+ Team Fouls = 자유투 부여 toast (사용자 결재 §4 (a))
      if (periodTeamCount >= 5) {
        const teamLabel = team === "home" ? "Team A" : "Team B";
        showToast(
          `자유투 부여 — ${teamLabel} Period ${runningScore.currentPeriod} ${periodTeamCount}번째 파울`,
          "info"
        );
      }
      // 5번째 파울 도달 = 퇴장 안내 (사용자 결재 §2 (a))
      if (newPlayerCount === 5) {
        showToast(`5반칙 퇴장 — 추가 파울 박제 차단`, "info");
      }
      return result.state;
    });
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
            onToggleFoul={(playerId, action) =>
              handleToggleFoul("home", playerId, action)
            }
            currentPeriod={runningScore.currentPeriod}
          />
          <TeamSection
            sideLabel="Team B"
            teamName={awayRoster.teamName}
            players={awayRoster.players}
            values={teamB}
            onChange={setTeamB}
            fouls={fouls.away}
            onToggleFoul={(playerId, action) =>
              handleToggleFoul("away", playerId, action)
            }
            currentPeriod={runningScore.currentPeriod}
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
          />
        </div>
      </div>

      {/* Phase 2 진행 상태 안내 — Phase 3~6 영역은 추후 확장 */}
      <div
        className="mt-4 rounded-[4px] px-3 py-2 text-xs"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-muted)",
          border: "1px solid var(--color-border)",
        }}
      >
        Phase 2 = Running Score + Period 자동 + Final + Winner 완성.
        Team/Player Fouls (Phase 3), Time-outs (Phase 4), 서명·제출 (Phase 5),
        인쇄 PDF (Phase 6) 는 후속 PR 에서 추가 됩니다.
      </div>
    </main>
  );
}
