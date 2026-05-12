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
  // OT 쿼터 존재 여부 — 박스스코어 쿼터 필터 버튼에 OT 노출 분기
  // quarter_scores 가 있으면 home.ot 배열 길이 확인. 없으면 false.
  const hasOT = (match.quarter_scores?.home?.ot?.length ?? 0) > 0;

  // 2026-05-13 FIBA Phase 21: 종이 매치 (recording_mode="paper") 박스스코어 슈팅 6 컬럼 hide.
  // 종이 기록지 = miss/FG attempted 미박제 → 시도수=성공수=항상 100% → 가짜 정확도 시각 노이즈 차단.
  // null/undefined (레거시 API 또는 미반영) = false 안전 fallback (Flutter 매치 19 컬럼 그대로).
  const isPaperMatch = match.recording_mode === "paper";

  return (
    <div className="flex flex-col gap-4">
      {/* 홈팀 박스스코어 — 쿼터 필터 / DNP 분리 / TOTAL 행 모두 포함 */}
      <BoxScoreTable
        teamName={match.home_team.name}
        color={match.home_team.color}
        players={match.home_players}
        hasOT={hasOT}
        hasQuarterEventDetail={match.has_quarter_event_detail}
        isPaperMatch={isPaperMatch}
      />
      {/* 원정팀 박스스코어 */}
      <BoxScoreTable
        teamName={match.away_team.name}
        color={match.away_team.color}
        players={match.away_players}
        hasOT={hasOT}
        hasQuarterEventDetail={match.has_quarter_event_detail}
        isPaperMatch={isPaperMatch}
      />
    </div>
  );
}
