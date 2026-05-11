/**
 * FIBA SCORESHEET 폼 본체 (client) — Phase 1 골조.
 *
 * 2026-05-11 — Phase 1 신규 (planner-architect §B §컴포넌트 트리).
 *
 * 왜 (이유):
 *   기존 `(web)/score-sheet/` 의 ScoreSheetForm 은 Quarter Score Grid 기반 + 22 stat
 *   영역으로 FIBA 양식과 괴리. Phase 1 재설계 = FIBA 양식 1 페이지 A4 세로 정합.
 *   본 turn 은 FibaHeader + LeftColumn (Team A/B TeamSection) 까지만 골조 — Phase 2~6
 *   에서 RunningScoreGrid / Team fouls / Time-outs / 서명 / PDF 순 확장.
 *
 * 방법 (어떻게):
 *   - localStorage draft (5초 throttle / key = "fiba-score-sheet-draft-{matchId}")
 *     기존 패턴 재사용 — Phase 5 제출 시 localStorage 제거
 *   - 상태 분리: header / teamA / teamB / (Phase 2+: runningScore / teamFouls / playerFouls...)
 *   - Phase 1 = 제출 없음 (UI 만) — Phase 5 BFF 확장 시 활성화
 *   - 모바일 가로 차단 = layout 의 RotationGuard 가 담당 (form 내부 별도 분기 X)
 *
 * 절대 룰:
 *   - API / BFF 시그니처 변경 0 (Phase 1 = UI 만)
 *   - service syncSingleMatch 호출 0 (Phase 1 = 제출 미연결)
 */

"use client";

import { useEffect, useState } from "react";
import { FibaHeader, type FibaHeaderInputs } from "./fiba-header";
import { TeamSection, type TeamSectionInputs } from "./team-section";
import type { TeamRosterData } from "./team-section-types";

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

  // localStorage draft 복원 (mount 1회)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY_PREFIX + match.id);
      if (raw) {
        const draft = JSON.parse(raw) as DraftPayload;
        if (draft.header) setHeader(draft.header);
        if (draft.teamA) setTeamA(draft.teamA);
        if (draft.teamB) setTeamB(draft.teamB);
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
  }, [header, teamA, teamB, match.id]);

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

      {/* 좌 절반 (Phase 1 = 1 컬럼 — Team A 상 / Team B 하 stack) */}
      {/* 우 절반 (RunningScore) 은 Phase 2 에서 추가 — 본 turn 은 leftColumn 만 */}
      <div className="mt-3 grid grid-cols-1 gap-3">
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

      {/* Phase 1 진행 상태 안내 — Phase 2~6 영역은 추후 확장 */}
      <div
        className="mt-4 rounded-[4px] px-3 py-2 text-xs"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-muted)",
          border: "1px solid var(--color-border)",
        }}
      >
        Phase 1 골조 — Running Score (Phase 2), Team/Player Fouls (Phase 3),
        Time-outs (Phase 4), 서명·제출 (Phase 5), 인쇄 PDF (Phase 6) 는
        후속 PR 에서 추가 됩니다.
      </div>
    </main>
  );
}
