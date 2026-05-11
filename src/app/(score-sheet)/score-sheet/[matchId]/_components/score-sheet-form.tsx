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
  }, [header, teamA, teamB, runningScore, match.id]);

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
          />
          <TeamSection
            sideLabel="Team B"
            teamName={awayRoster.teamName}
            players={awayRoster.players}
            values={teamB}
            onChange={setTeamB}
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
