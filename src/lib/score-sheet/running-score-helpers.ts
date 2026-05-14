/**
 * Running Score 순수 헬퍼 — DB / DOM 의존 없는 함수만 (vitest 단위 테스트 가능).
 *
 * 2026-05-12 — Phase 2 신규.
 *
 * 왜 (이유):
 *   점수 추론 / 합산 / PBP 변환 로직을 RunningScoreGrid (client) 와 BFF (server) 양쪽에서
 *   재사용 + vitest 회귀 방지. UI 와 분리해 테스트 케이스 10+ 검증 가능.
 *   `src/lib/score-sheet/` 위치 = server-safe (route group dir 의 client-side 옆에 두지 않음).
 *
 * 방법 (어떻게):
 *   - inferPoints: 새 마킹 position 과 직전 마킹 position 의 차이 = 1/2/3 점
 *   - sumByPeriod: ScoreMark[] → period 별 [home/away] 합산
 *   - computeFinalScore: 마지막 마킹 position = 팀 총점 + winner 결정
 *   - marksToPaperPBPInputs: ScoreMark[] → PaperPBPInput[] (BFF 박제용)
 */

import type {
  ScoreMark,
  RunningScoreState,
  PeriodScoreLine,
  FinalScore,
} from "./running-score-types";

// 점수 종류 추론 — 이전 마킹과의 position 차이로 1/2/3 결정
//
// 룰:
//   - 마지막 마킹이 없으면 (첫 득점) → position 자체가 1/2/3
//   - 마지막 마킹 position 보다 작으면 0 (역행 차단 — caller 가 처리)
//   - 차이가 4+ 면 4 (caller 가 alert + 차단)
export function inferPoints(
  marks: ScoreMark[],
  newPosition: number
): number {
  if (newPosition < 1) return 0;
  // 마지막 마킹 = 가장 큰 position (정렬 가정 — caller 가 sort 보장)
  const lastPosition = marks.length === 0 ? 0 : marks[marks.length - 1].position;
  return newPosition - lastPosition;
}

// 새 마킹 position 이 유효한지 검증 — 1/2/3 점 한정
//
// 룰:
//   - 1 ≤ diff ≤ 3 만 통과 (4+ 또는 음수 차단)
//   - position 1~160 범위
export function isValidMarkPosition(
  marks: ScoreMark[],
  newPosition: number,
  maxPosition: number = 160
): { ok: true; points: 1 | 2 | 3 } | { ok: false; reason: string } {
  if (newPosition < 1 || newPosition > maxPosition) {
    return { ok: false, reason: `칸 번호 범위 초과 (1~${maxPosition})` };
  }
  const diff = inferPoints(marks, newPosition);
  if (diff < 1) {
    return { ok: false, reason: "이전 마킹 이후 칸을 선택해주세요" };
  }
  if (diff > 3) {
    return {
      ok: false,
      reason: `한 번에 ${diff}점 득점 불가 — 칸 위치를 확인해주세요`,
    };
  }
  return { ok: true, points: diff as 1 | 2 | 3 };
}

// Period 별 점수 합산 — Running Score 마킹 → Period ①~④ + Extra
//
// 출력: period 오름차순 정렬된 [home/away] 합산 배열
//   ex) [{period: 1, homePoints: 18, awayPoints: 16}, ..., {period: 5, ...}]
export function sumByPeriod(state: RunningScoreState): PeriodScoreLine[] {
  const periodSet = new Set<number>();
  state.home.forEach((m) => periodSet.add(m.period));
  state.away.forEach((m) => periodSet.add(m.period));

  // 최소 1~4 Quarter 항상 표시 (마킹 0이라도)
  for (let p = 1; p <= 4; p += 1) {
    periodSet.add(p);
  }

  const periods = Array.from(periodSet).sort((a, b) => a - b);

  return periods.map((period) => {
    const homePoints = state.home
      .filter((m) => m.period === period)
      .reduce((acc, m) => acc + m.points, 0);
    const awayPoints = state.away
      .filter((m) => m.period === period)
      .reduce((acc, m) => acc + m.points, 0);
    return { period, homePoints, awayPoints };
  });
}

// Final Score + Winner 자동 결정
//
// 룰:
//   - homeTotal = home 마지막 마킹 position (마킹 = 누적 점수 위치)
//   - awayTotal = away 마지막 마킹 position
//   - 둘 다 0 = "none" (경기 미시작)
//   - 동점 = "tie"
//   - 큰 쪽 = "home" | "away"
export function computeFinalScore(state: RunningScoreState): FinalScore {
  const homeTotal =
    state.home.length === 0 ? 0 : state.home[state.home.length - 1].position;
  const awayTotal =
    state.away.length === 0 ? 0 : state.away[state.away.length - 1].position;

  if (homeTotal === 0 && awayTotal === 0) {
    return { homeTotal, awayTotal, winner: "none" };
  }
  if (homeTotal > awayTotal) {
    return { homeTotal, awayTotal, winner: "home" };
  }
  if (awayTotal > homeTotal) {
    return { homeTotal, awayTotal, winner: "away" };
  }
  return { homeTotal, awayTotal, winner: "tie" };
}

// quarterScores JSON 변환 — DB `match.quarterScores` 호환 (Flutter sync 와 동일 구조)
//
// 출력 형식: { home: { q1, q2, q3, q4, ot: [...] }, away: { q1, q2, q3, q4, ot: [...] } }
//   - q1~q4 = Period 1~4 점수
//   - ot = Period 5+ 점수 배열 ([OT1, OT2, ...])
export function toQuarterScoresJson(state: RunningScoreState): {
  home: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
  away: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
} {
  const lines = sumByPeriod(state);

  const home = { q1: 0, q2: 0, q3: 0, q4: 0, ot: [] as number[] };
  const away = { q1: 0, q2: 0, q3: 0, q4: 0, ot: [] as number[] };

  lines.forEach((line) => {
    if (line.period === 1) {
      home.q1 = line.homePoints;
      away.q1 = line.awayPoints;
    } else if (line.period === 2) {
      home.q2 = line.homePoints;
      away.q2 = line.awayPoints;
    } else if (line.period === 3) {
      home.q3 = line.homePoints;
      away.q3 = line.awayPoints;
    } else if (line.period === 4) {
      home.q4 = line.homePoints;
      away.q4 = line.awayPoints;
    } else if (line.period >= 5) {
      home.ot.push(line.homePoints);
      away.ot.push(line.awayPoints);
    }
  });

  return { home, away };
}

// PlayByPlayInput 변환 — service syncSingleMatch 가 박제할 PBP 형태
//
// 박제 룰:
//   - local_id = `paper-fix-{uuid}` — 종이 기록 식별자
//   - description = `[종이 기록] N점 득점`
//   - action_type = "shot_made" (1/2/3점 모두 made 슛으로 박제 — FT 는 Phase 3 확장)
//   - action_subtype = "1pt" | "2pt" | "3pt"
//   - quarter = period (1~7)
//   - tournament_team_id, tournament_team_player_id 는 caller (BFF) 가 채움
//
// 점수 시계열 박제:
//   - home_score_at_time / away_score_at_time = 마킹 시점 누적 점수
//   - 마킹 position = 누적 점수와 일치 (FIBA 양식 구조 — 마지막 칸 = 최종 점수)
export interface PaperPBPInput {
  local_id: string;
  tournament_team_player_id_str: string; // BFF 가 bigint 변환
  team_side: "home" | "away"; // BFF 가 tournament_team_id 변환
  quarter: number;
  action_type: "shot_made";
  action_subtype: "1pt" | "2pt" | "3pt";
  is_made: true;
  points_scored: 1 | 2 | 3;
  home_score_at_time: number;
  away_score_at_time: number;
  description: string;
}

// uuid v4 (브라우저 + node 양쪽 호환)
// 본 헬퍼는 server-side 호출도 가능 (BFF 가 호출) → globalThis.crypto.randomUUID 사용.
function generateUuid(): string {
  // crypto.randomUUID 는 Node 19+ + 모든 모던 브라우저 지원 (Edge runtime 포함)
  const cryptoLike = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoLike?.randomUUID) {
    return cryptoLike.randomUUID();
  }
  // fallback — Math.random 기반 (충분히 충돌 0 보장 X but 테스트 환경 한정)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// home/away 양쪽 마킹 → PaperPBPInput[] 변환 (시간 순서 정렬)
//
// 정렬 룰:
//   - period 오름차순 → 같은 period 안 position 오름차순
//   - 양 팀이 같은 period 안에서는 시점 모호 → home 먼저 (안정 정렬)
//   - home_score_at_time / away_score_at_time 는 각 시점 누적 점수
export function marksToPaperPBPInputs(
  state: RunningScoreState
): PaperPBPInput[] {
  type TaggedMark = { mark: ScoreMark; side: "home" | "away" };
  const merged: TaggedMark[] = [
    ...state.home.map((m) => ({ mark: m, side: "home" as const })),
    ...state.away.map((m) => ({ mark: m, side: "away" as const })),
  ];

  merged.sort((a, b) => {
    if (a.mark.period !== b.mark.period) return a.mark.period - b.mark.period;
    if (a.side !== b.side) return a.side === "home" ? -1 : 1;
    return a.mark.position - b.mark.position;
  });

  let homeCum = 0;
  let awayCum = 0;
  return merged.map(({ mark, side }) => {
    if (side === "home") {
      homeCum = mark.position; // 마킹 position = 누적 점수
    } else {
      awayCum = mark.position;
    }
    const subtype: "1pt" | "2pt" | "3pt" =
      mark.points === 1 ? "1pt" : mark.points === 2 ? "2pt" : "3pt";
    return {
      local_id: `paper-fix-${generateUuid()}`,
      tournament_team_player_id_str: mark.playerId,
      team_side: side,
      quarter: mark.period,
      action_type: "shot_made" as const,
      action_subtype: subtype,
      is_made: true,
      points_scored: mark.points,
      home_score_at_time: homeCum,
      away_score_at_time: awayCum,
      description: `[종이 기록] ${mark.points}점 득점`,
    };
  });
}

// 마지막 마킹 1탭 해제 — pop 패턴
//
// 룰:
//   - state.home 또는 state.away 의 가장 큰 position 마킹 제거
//   - 빈 배열이면 변경 없음 (no-op)
//   - currentPeriod 는 변경 X (Period 종료 토글은 별도 — Phase 4)
export function undoLastMark(
  state: RunningScoreState,
  team: "home" | "away"
): RunningScoreState {
  if (team === "home") {
    if (state.home.length === 0) return state;
    return {
      ...state,
      home: state.home.slice(0, -1),
    };
  }
  if (state.away.length === 0) return state;
  return {
    ...state,
    away: state.away.slice(0, -1),
  };
}

// 새 마킹 추가 (검증 통과 후 호출) — 점수 자동 추론 + sort 보장
//
// 입력:
//   - newPosition = 1~160 (검증 통과 후 caller 가 호출)
//   - playerId = 선수 모달에서 선택된 TTP id
//
// 호출 전 검증:
//   - isValidMarkPosition 통과 후 호출
export function addMark(
  state: RunningScoreState,
  team: "home" | "away",
  newPosition: number,
  playerId: string,
  points: 1 | 2 | 3
): RunningScoreState {
  const newMark: ScoreMark = {
    position: newPosition,
    playerId,
    period: state.currentPeriod,
    points,
  };
  if (team === "home") {
    return {
      ...state,
      home: [...state.home, newMark],
    };
  }
  return {
    ...state,
    away: [...state.away, newMark],
  };
}

// 빈 상태 — 컴포넌트 초기값 + draft 복원 실패 시 fallback
export const EMPTY_RUNNING_SCORE: RunningScoreState = {
  home: [],
  away: [],
  currentPeriod: 1,
};

/**
 * Phase 23 (2026-05-14) — DB 에서 SELECT 한 paper-fix PBP row 의 최소 타입.
 *
 * 왜 (이유):
 *   재진입 시 자동 로드를 위해 `play_by_plays` 테이블 SELECT 결과를 ScoreMark / FoulMark 로
 *   역변환. Prisma 의존성 없이 (`Prisma.play_by_playsGetPayload<...>` import ❌) 순수 함수로
 *   유지해 server-safe + vitest 가능. `score-from-pbp.ts` 의 `PbpRowForScore` 패턴 그대로 카피
 *   + score-sheet 역변환 전용 필드 (home_score_at_time / away_score_at_time /
 *   tournament_team_player_id / id) 추가.
 *
 * 방법 (어떻게):
 *   - bigint | number | null 형태는 Prisma 가 그대로 반환 → 헬퍼 내부에서 Number() 캐스팅
 *   - description 은 PBP row 에 박제된 한국어 문자열 (foul 의 P/T/U/D 정규식 추출용)
 *   - id 는 정렬 안정성 보조키 (같은 quarter + 같은 score_at_time 동률 시)
 */
export type PaperPBPRow = {
  id: bigint | number;
  quarter: number | null;
  action_type: string | null;
  action_subtype: string | null;
  is_made: boolean | null;
  points_scored: number | null;
  home_score_at_time: number | null;
  away_score_at_time: number | null;
  tournament_team_id: bigint | number | null;
  tournament_team_player_id: bigint | number | null;
  description: string | null;
};

// PaperPBPRow 의 team_id 가 home 인지 away 인지 판정 (mixed 매치 안전망)
//
// 룰:
//   - tournament_team_id === homeTeamId → "home"
//   - tournament_team_id === awayTeamId → "away"
//   - 외 (NULL / 다른 팀 / 가비지) → null (caller 가 row 무시)
//
// BigInt 비교 함정 (errors.md 2026-04-17 박제 패턴) 회피:
//   - bigint === string 비교는 항상 false
//   - Number() 캐스팅 후 비교 (score-from-pbp.ts 동일 패턴)
function detectTeamSide(
  teamId: bigint | number | null,
  homeIdNum: number,
  awayIdNum: number,
): "home" | "away" | null {
  if (teamId === null || teamId === undefined) return null;
  const idNum = Number(teamId);
  if (Number.isNaN(idNum)) return null;
  if (idNum === homeIdNum) return "home";
  if (idNum === awayIdNum) return "away";
  return null;
}

/**
 * 역변환 — DB PBP row → RunningScoreState (Phase 23 PR1).
 *
 * 왜 (이유):
 *   `marksToPaperPBPInputs` 의 정방향 박제와 대칭. score-sheet 재진입 시 page.tsx 가
 *   `play_by_plays.findMany` 로 SELECT 한 row 를 ScoreSheetForm 의 useState 초기값으로
 *   복원하기 위한 단일 source 역변환 헬퍼.
 *
 * 방법 (어떻게):
 *   1. action_type === "shot_made" + is_made 만 필터 (foul / shot_missed 등 무시)
 *   2. tournament_team_id 로 home/away 판정 (Number() 캐스팅 비교 — bigint/number/string 안전)
 *   3. 정렬:
 *      - home 측 = quarter ASC → home_score_at_time ASC → id ASC (안정성)
 *      - away 측 = quarter ASC → away_score_at_time ASC → id ASC
 *   4. ScoreMark 매핑:
 *      - position = 해당 side 의 score_at_time (정방향 = 마킹 직후 누적값을 저장)
 *      - playerId = tournament_team_player_id.toString() (BigInt → string)
 *      - period = quarter ?? 1 (NULL fallback)
 *      - points = points_scored ∈ {1, 2, 3} (action_subtype 폴백 ❌ — 의뢰 §1.4)
 *   5. currentPeriod = max(home/away 의 period 최대값, 1) — 호출자 책임 보강 가능
 *
 * 입력:
 *   - pbpRows: DB SELECT 결과 (paper-fix-* prefix 가드는 caller 책임)
 *   - homeTeamId / awayTeamId: bigint | string (매치 헤더에서 가져옴)
 *
 * 출력:
 *   - RunningScoreState = { home, away, currentPeriod }
 *
 * 안전망:
 *   - mixed 매치 (home/away 외 team_id) → 해당 row 무시 (절대 추가 X)
 *   - points_scored 가 1/2/3 외 값 → 그대로 통과 (caller 검증 책임 — 정방향이 1/2/3 만 박제)
 *     단 TypeScript 타입은 1|2|3 유지 → 단정 (as 1|2|3) 필요
 *   - quarter NULL → 1 로 폴백
 */
export function pbpToScoreMarks(
  pbpRows: PaperPBPRow[],
  homeTeamId: bigint | string | number,
  awayTeamId: bigint | string | number,
): RunningScoreState {
  // (a) 팀 ID 사전 캐스팅 — bigint/string/number 모두 Number 로 비교 (errors.md 2026-04-17 회피)
  const homeIdNum = Number(homeTeamId);
  const awayIdNum = Number(awayTeamId);

  // (b) shot_made 만 필터 + side 판정 + 매핑 1패스
  type Tagged = { mark: ScoreMark; side: "home" | "away"; id: number };
  const tagged: Tagged[] = [];
  for (const row of pbpRows) {
    if (row.action_type !== "shot_made") continue;
    // is_made === false 인 shot_made 는 정방향이 박제하지 않지만 안전망
    if (row.is_made === false) continue;
    const side = detectTeamSide(row.tournament_team_id, homeIdNum, awayIdNum);
    if (side === null) continue; // mixed 매치 안전망 — 무시
    if (row.tournament_team_player_id === null || row.tournament_team_player_id === undefined) {
      continue; // 선수 미지정 (정방향 박제는 항상 포함 — 안전망)
    }
    const period = row.quarter ?? 1;
    // position = 해당 side 의 score_at_time (정방향 정렬과 일치)
    const position =
      side === "home"
        ? row.home_score_at_time ?? 0
        : row.away_score_at_time ?? 0;
    // points = points_scored 우선 (action_subtype 폴백은 정방향이 항상 박제하므로 불필요)
    const pointsRaw = row.points_scored ?? 0;
    if (pointsRaw < 1 || pointsRaw > 3) continue; // 정합성 가드 (1/2/3 외 값 무시)
    const points = pointsRaw as 1 | 2 | 3;
    const playerId = row.tournament_team_player_id.toString();
    tagged.push({
      mark: { position, playerId, period, points },
      side,
      id: Number(row.id),
    });
  }

  // (c) home / away 분리 + 정렬
  //     - 정방향이 같은 quarter 안에서 home 먼저 + position ASC 로 박제 →
  //       역변환은 side 별 분리 후 quarter → score_at_time → id 순으로 안정 정렬
  const homeTagged = tagged.filter((t) => t.side === "home");
  const awayTagged = tagged.filter((t) => t.side === "away");

  const compare = (a: Tagged, b: Tagged): number => {
    if (a.mark.period !== b.mark.period) return a.mark.period - b.mark.period;
    if (a.mark.position !== b.mark.position) return a.mark.position - b.mark.position;
    return a.id - b.id; // 보조 정렬 (안정성)
  };
  homeTagged.sort(compare);
  awayTagged.sort(compare);

  const home = homeTagged.map((t) => t.mark);
  const away = awayTagged.map((t) => t.mark);

  // (d) currentPeriod 결정 — 호출자가 match.status 모르므로 안전한 폴백
  //     max(home/away period 최대값, 1)
  //     호출자가 status 알면 별도 보정 가능 (PR2 책임)
  const maxHomePeriod = home.reduce((acc, m) => Math.max(acc, m.period), 0);
  const maxAwayPeriod = away.reduce((acc, m) => Math.max(acc, m.period), 0);
  const currentPeriod = Math.max(maxHomePeriod, maxAwayPeriod, 1);

  return { home, away, currentPeriod };
}

/**
 * Phase 18 (2026-05-13) — FIBA 표준 1/2/3점 시각 표기 변형 키.
 *
 * 왜 (이유):
 *   FIBA PDF (이미지 43-44) = 점수 종류별 시각 구분.
 *     1점 (자유투) = · (작은 점)
 *     2점 (필드골) = ● (큰 점)
 *     3점 (3점슛) = ● + 외곽 ○ (큰 점 + 동그라미)
 *   사용자 결재 §2. UI 컴포넌트 (running-score-grid.tsx ScoreMarkIcon /
 *   period-color-legend.tsx) 양쪽이 본 헬퍼를 단일 source 로 사용 → 회귀 vitest 가능.
 *
 * 어떻게:
 *   - 1 → "dot" / 2 → "filled" / 3 → "filled-ring"
 *   - 컴포넌트 분기는 키 비교만 / 시각 구현은 컴포넌트 책임 (color/size 등)
 */
export type ScoreMarkVariant = "dot" | "filled" | "filled-ring";

/**
 * points (1/2/3) → variant 키.
 *
 * 안전: 범위 밖 입력은 'filled' fallback (2점) — UI 폭주 X.
 */
export function getScoreMarkVariant(points: 1 | 2 | 3): ScoreMarkVariant {
  if (points === 1) return "dot";
  if (points === 3) return "filled-ring";
  return "filled";
}
