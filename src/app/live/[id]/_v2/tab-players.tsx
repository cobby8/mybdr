"use client";

// 2026-04-22: Phase 2 GameResult v2 — 박스스코어 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L268~L287
//
// 2026-05-02: 옛 page.tsx BoxScoreTable 풀 복원 (사용자 요청)
// 이전: 단순 17 컬럼 인라인 테이블 (쿼터 필터 없음 / DNP 통합 / TOTAL 행 없음)
// 이후: 옛 BoxScoreTable 그대로 — 쿼터 필터 / DNP 분리 / 스타팅 정렬 / PTS 좌측 팀색 띠 /
//      안내 배너 / TOTAL 합산 행 / 19 컬럼 (#·이름·MIN·PTS·FG·FG%·3P·3P%·FT·FT%·OR·DR·REB·AST·STL·BLK·TO·PF·+/-)
// 이유: "기존에 구현했었던 기록 UI와 순서 그대로 복구" — 사용자 요청.

import { BoxScoreTable } from "./box-score-table";
import type { MatchDataV2 } from "./game-result";

export function TabPlayers({ match }: { match: MatchDataV2 }) {
  // OT 쿼터 분리 — 박스스코어 쿼터 필터 + 인쇄 페이지 분리에 사용.
  // 2026-05-20 OT2+ 분리: otCount = home.ot 배열 길이 (0=없음 / 1=OT1만 / 2=OT1+OT2 / N+).
  // 기존 hasOT 는 backward-compat (otCount > 0 시 자동 true).
  const otCount = match.quarter_scores?.home?.ot?.length ?? 0;
  const hasOT = otCount > 0;

  // 2026-05-13 FIBA Phase 21: 종이 매치 (recording_mode="paper") 박스스코어 슈팅 6 컬럼 hide.
  // 종이 기록지 = miss/FG attempted 미박제 → 시도수=성공수=항상 100% → 가짜 정확도 시각 노이즈 차단.
  // null/undefined (레거시 API 또는 미반영) = false 안전 fallback (Flutter 매치 19 컬럼 그대로).
  const isPaperMatch = match.recording_mode === "paper";
  const allPlayers = [...match.home_players, ...match.away_players];

  return (
    <div className="flex flex-col gap-4">
      {/* 홈팀 박스스코어 — 쿼터 필터 / DNP 분리 / TOTAL 행 모두 포함 */}
      <BoxScoreTable
        teamName={match.home_team.name}
        color={match.home_team.color}
        players={match.home_players}
        allPlayers={allPlayers}
        hasOT={hasOT}
        otCount={otCount}
        hasQuarterEventDetail={match.has_quarter_event_detail}
        isPaperMatch={isPaperMatch}
      />
      {/* 원정팀 박스스코어 */}
      <BoxScoreTable
        teamName={match.away_team.name}
        color={match.away_team.color}
        players={match.away_players}
        allPlayers={allPlayers}
        hasOT={hasOT}
        otCount={otCount}
        hasQuarterEventDetail={match.has_quarter_event_detail}
        isPaperMatch={isPaperMatch}
      />
    </div>
  );
}
