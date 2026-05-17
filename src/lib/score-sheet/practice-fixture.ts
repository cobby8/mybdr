/**
 * 연습용 FIBA SCORESHEET fixture (2026-05-17 신규).
 *
 * 왜 (이유):
 *   미교육 기록원 / 신규 운영자가 운영 매치 없이도 종이 기록지 양식 전체 흐름을
 *   체험할 수 있도록 가상 매치 + 대회 + 양 팀 로스터(각 10명) fixture 박제.
 *   `/score-sheet/practice` 페이지가 본 fixture 를 import 해서 ScoreSheetForm 에
 *   prop 으로 전달. 운영 DB / API / Flutter 영향 0.
 *
 * 보존 (절대 룰):
 *   - DB 변경 0 (BigInt 미사용 / `practice` 문자열 ID)
 *   - 운영 페이지 `/score-sheet/[matchId]` 영향 0 (별도 라우트)
 *   - BFF 호출 0 (page.tsx + ScoreSheetForm 의 isPractice 분기가 모두 skip)
 *
 * shape 정합:
 *   - matchId = "practice" 특수 문자열 (BigInt 아님 — caller 가 분기)
 *   - RosterItem.tournamentTeamPlayerId = "practice-home-1" ~ "practice-away-10"
 *   - 시각: ScoreSheetForm 의 운영 props (TeamRosterData / MatchProp / TournamentProp)
 *     와 동일 shape — 운영 분기 없이도 폼 자연 렌더.
 */

import type { TeamRosterData, RosterItem } from "@/app/(score-sheet)/score-sheet/[matchId]/_components/team-section-types";

// ─────────────────────────────────────────────────────────────────────────────
// 1) 가상 대회 fixture — 운영 Tournament 모델과 동일 prop shape.
//    settings = {} (= recording_mode 미박제 → getRecordingMode fallback "flutter"
//    그러나 본 fixture 는 ScoreSheetForm 에 직접 전달 → recording_mode 가드 미진입).
// ─────────────────────────────────────────────────────────────────────────────
export const PRACTICE_TOURNAMENT = {
  id: "practice-tournament", // 운영 Tournament.id 와 충돌 0 (운영은 UUID v4)
  name: "연습 대회",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2) 가상 매치 fixture — MatchProp shape 정합.
//    id = "practice" 특수 ID (BigInt 변환 ❌ — caller 가 isPractice 로 분기).
//    scheduledAtLabel / courtLabel = 가상 표시값.
//    status = null (= 진행 중 매치 = isReadOnly=false / 수정 모드 미진입).
// ─────────────────────────────────────────────────────────────────────────────
export const PRACTICE_MATCH = {
  id: "practice",
  tournamentId: PRACTICE_TOURNAMENT.id,
  match_code: "PR-001",
  scheduledAtLabel: "연습 모드",
  courtLabel: "연습 코트",
  // 진행 매치 상태 = null / "scheduled" — Phase 23 RO 가드 미진입.
  // 사유: 종료 매치 = 수정 모드 강제 진입 + audit 박제 의도 → 연습 흐름과 모순.
  status: null,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3) 가상 선수 이름 생성기 — 박○○ / 김○○ / 이○○ 등 한국 보편 성씨.
//
//    왜 (이유):
//      운영 매치는 실제 선수명 (예: "박지성") 표시. 연습은 가상 — "박○○" 처럼
//      성 + 마스킹 으로 통일 → 운영자가 한 눈에 "연습 데이터" 인지 가능.
//      현실감 + 익명성 양면 확보.
//
//    룰:
//      - 10 + 10 = 20명 → 한국 성씨 20개 (중복 없이) 분배.
//      - jerseyNumber = 1 ~ 99 범위에서 운영 패턴 (4/7/10/14/22/24 등 가시성 높은 번호) 박제.
// ─────────────────────────────────────────────────────────────────────────────
const HOME_PLAYER_NAMES = [
  "박○○", "김○○", "이○○", "최○○", "정○○",
  "강○○", "조○○", "윤○○", "장○○", "임○○",
];
const AWAY_PLAYER_NAMES = [
  "한○○", "오○○", "서○○", "신○○", "권○○",
  "황○○", "안○○", "송○○", "류○○", "전○○",
];

// jerseyNumber 분배 — 운영 매치 통계 빈도 높은 번호 (4/7/10 등) 우선 박제.
//   동일 매치 안 양 팀 등번호 중복 허용 (FIBA 양식 = 팀 단위 unique 만 강제).
const HOME_JERSEY_NUMBERS = [4, 7, 10, 14, 22, 24, 30, 33, 41, 55];
const AWAY_JERSEY_NUMBERS = [5, 8, 11, 15, 23, 25, 31, 34, 42, 50];

// position 분배 — FIBA 5x5 기준 PG/SG/SF/PF/C 5종 + 후보 5 (= 동일 분포 반복).
//   운영 RosterItem.role 패턴 답습.
const POSITIONS = ["PG", "SG", "SF", "PF", "C", "PG", "SG", "SF", "PF", "C"];

/**
 * 한 팀 RosterItem 배열 생성 (10명).
 *
 * 룰:
 *   - tournamentTeamPlayerId = "practice-{side}-{index+1}" (1-based / string).
 *   - isStarter = 앞 5명 (= index 0~4) / 후보 = 뒤 5명 (5~9).
 *   - isInLineup = 전체 10명 모두 true (= 출전 명단 박제 / 라인업 모달 자동 confirm 대비).
 *   - userId = null (= 가상 선수 — 실제 user 미연결).
 */
function makePracticeRoster(
  side: "home" | "away",
  names: ReadonlyArray<string>,
  jerseys: ReadonlyArray<number>,
): RosterItem[] {
  return names.map((displayName, idx) => ({
    tournamentTeamPlayerId: `practice-${side}-${idx + 1}`,
    jerseyNumber: jerseys[idx] ?? idx + 1, // 안전 fallback
    role: POSITIONS[idx] ?? null,
    displayName,
    userId: null,
    // 앞 5명 = 선발 — 라인업 모달 자동 fill 시 starters 로 사용 (이미 page 가 모달 skip 분기 박제).
    isStarter: idx < 5,
    // 전체 10명 = 출전 명단 (= 후보 5인 포함) — 모달 confirm 결과와 동일 효과.
    isInLineup: true,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) 양 팀 RosterData fixture — TeamRosterData shape 정합.
//    confirmedStarters / confirmedSubstitutes = 사전 라인업 박제 (= page.tsx 가
//    initialLineup prop 으로 ScoreSheetForm 에 전달 → 모달 skip + 자동 fill).
// ─────────────────────────────────────────────────────────────────────────────
export const PRACTICE_HOME_ROSTER: TeamRosterData = {
  teamSide: "home",
  teamName: "연습팀 레드",
  tournamentTeamId: "practice-home-team", // 가상 — BFF 미호출 / DB 미참조
  hasConfirmedLineup: true, // 모달 자동 skip + initialLineup 자동 fill
  players: makePracticeRoster("home", HOME_PLAYER_NAMES, HOME_JERSEY_NUMBERS),
  // 앞 5명 = 선발 (FIBA 표준) / 뒤 5명 = 후보.
  confirmedStarters: ["practice-home-1", "practice-home-2", "practice-home-3", "practice-home-4", "practice-home-5"],
  confirmedSubstitutes: ["practice-home-6", "practice-home-7", "practice-home-8", "practice-home-9", "practice-home-10"],
};

export const PRACTICE_AWAY_ROSTER: TeamRosterData = {
  teamSide: "away",
  teamName: "연습팀 블루",
  tournamentTeamId: "practice-away-team",
  hasConfirmedLineup: true,
  players: makePracticeRoster("away", AWAY_PLAYER_NAMES, AWAY_JERSEY_NUMBERS),
  confirmedStarters: ["practice-away-1", "practice-away-2", "practice-away-3", "practice-away-4", "practice-away-5"],
  confirmedSubstitutes: ["practice-away-6", "practice-away-7", "practice-away-8", "practice-away-9", "practice-away-10"],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5) initialLineup fixture — ScoreSheetForm props 정합.
//    모달 skip 트리거 = hasConfirmedLineup=true + starters=5 + substitutes 박제.
//    page.tsx 가 본 값 그대로 prop drilling → 모달 자동 skip → 폼 즉시 진입.
// ─────────────────────────────────────────────────────────────────────────────
export const PRACTICE_INITIAL_LINEUP = {
  home: {
    starters: PRACTICE_HOME_ROSTER.confirmedStarters,
    substitutes: PRACTICE_HOME_ROSTER.confirmedSubstitutes,
  },
  away: {
    starters: PRACTICE_AWAY_ROSTER.confirmedStarters,
    substitutes: PRACTICE_AWAY_ROSTER.confirmedSubstitutes,
  },
};
