/**
 * quarterScores 자동 갱신 PURE 헬퍼 — Sprint 2 PR-5 F1.
 *
 * 2026-05-23 신규 (errors.md [2026-05-21] 점수 4 source 시스템 차원 결함 fix).
 *
 * 왜 (이유):
 *   Flutter sync 매치 종료 시점에 quarter_scores 박제 0 (D 10건 + E 48건 = 58건 / 운영 56% 불일치).
 *   service `syncSingleMatch` 가 incoming PBP made events 합으로 자동 갱신 →
 *   매치 종료 시점 4 source (header / QS / MPS / PBP) 정합 보장.
 *
 *   LIVE API line 909~920 (PBP made events 합산 패턴) 답습 = 운영 검증된 패턴.
 *   LIVE API line 933 (paper override 패턴) 답습 = paper 매치 DB.QS SSOT 보존.
 *
 * 방법 (어떻게):
 *   - computeQuarterScoresFromPbp(pbpInputs, homeTeamIdNum): PURE / DB I/O 0 / vitest 가능
 *   - shouldAutoSyncQuarterScores(input): paper skip / in_progress skip / 재진입 skip / Flutter completed 신규 전환만 true
 *
 * 회귀 보장 (Sprint 1 F3-α + F3-β + F5 + F2 와 호출 순서 자연 통합):
 *   - paper 매치 = DB.QS = SSOT (score-sheet BFF 박제 / LIVE API L933 패턴 답습)
 *   - in_progress 매치 = QS 갱신 skip (라이브 영향 0)
 *   - 이미 completed 매치 (재sync) = QS 갱신 skip (재진입 영향 0)
 *   - F5 가 service 호출 직전 가드 → F5 통과 후 F1 자동 갱신 (자연 흐름)
 */

import type { PlayByPlayInput } from "../services/match-sync";

// quarterScores DB.JSON 표준 shape — Q1~Q4 + OT 배열 (LIVE API L909~920 패턴 일치).
//
// 룰:
//   - q1~q4 = regulation 4 쿼터 (정수)
//   - ot[] = 연장 1+ 쿼터 (0..N개 / OT1=index 0 / OT2=index 1 ...)
//   - 0 점도 박제 (NULL 금지) — LIVE API consumer 가 항상 numeric 가정
export type QuarterScoresJson = {
  home: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
  away: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
};

/**
 * incoming PBP made events 합 → quarterScores JSON 변환.
 *
 * LIVE API line 909~920 패턴 답습:
 *   - is_made === true + points_scored > 0 만 합산 (FT/2pt/3pt 모두 포함 / miss 제외)
 *   - quarter 1~4 = q1~q4 (regulation)
 *   - quarter 5+ = ot[] (정렬: ASC / OT1=index 0 / OT2=index 1 / ...)
 *   - tournament_team_id === homeTeamIdNum = home / 그 외 = away
 *
 * 룰 + edge case:
 *   - PBP 0건 → 모두 0 (정합 매치 또는 신규 매치 박제)
 *   - is_made=false (실패 슛) 제외
 *   - is_made=null (비-슛 이벤트 / 파울/리바운드) 제외
 *   - points_scored=0 또는 NULL 제외 (사일런트 0점 슛 events 방어)
 *
 * @param pbpInputs incoming PBP events (Flutter sync body 의 play_by_plays 그대로)
 * @param homeTeamIdNum match.homeTeamId (BigInt → Number 변환된 값)
 * @returns QuarterScoresJson — DB.quarterScores 컬럼에 그대로 박제 가능
 */
export function computeQuarterScoresFromPbp(
  pbpInputs: PlayByPlayInput[],
  homeTeamIdNum: number
): QuarterScoresJson {
  // quarter 별 home/away 누적 합산 — 빈 객체 시작 후 made event 마다 +=
  const qMap: Record<number, { home: number; away: number }> = {};
  for (const p of pbpInputs) {
    // is_made === true 만 합산 (miss / 비-슛 이벤트 / NULL 제외)
    if (p.is_made !== true) continue;
    const pts = p.points_scored ?? 0;
    // 0점 슛 (사일런트 events / Flutter 앱 race) 방어
    if (pts <= 0) continue;
    // quarter 미박제 시 q1 fallback (Flutter app legacy 케이스)
    const q = p.quarter ?? 1;
    if (!qMap[q]) qMap[q] = { home: 0, away: 0 };
    // tournament_team_id 비교 — Number 변환 (PBP input 의 ttp_team_id 가 number 타입)
    if (Number(p.tournament_team_id) === homeTeamIdNum) {
      qMap[q].home += pts;
    } else {
      qMap[q].away += pts;
    }
  }
  // 정합 출력 shape — q1~q4 = 정수 / ot = 배열 (OT 미발생 = 빈 배열)
  const result: QuarterScoresJson = {
    home: {
      q1: qMap[1]?.home ?? 0,
      q2: qMap[2]?.home ?? 0,
      q3: qMap[3]?.home ?? 0,
      q4: qMap[4]?.home ?? 0,
      ot: [],
    },
    away: {
      q1: qMap[1]?.away ?? 0,
      q2: qMap[2]?.away ?? 0,
      q3: qMap[3]?.away ?? 0,
      q4: qMap[4]?.away ?? 0,
      ot: [],
    },
  };
  // OT 분리 — quarter > 4 인 키만 ASC 정렬 후 ot[] push (OT1 → OT2 → ...)
  const otQuarters = Object.keys(qMap)
    .map(Number)
    .filter((n) => n > 4)
    .sort((a, b) => a - b);
  for (const q of otQuarters) {
    result.home.ot.push(qMap[q].home);
    result.away.ot.push(qMap[q].away);
  }
  return result;
}

// 자동 갱신 trigger 판정 입력 — paper / Flutter 양면 보호 + status 전환 캡처.
//
// 룰:
//   - recordingMode = "paper" → 무조건 skip (DB.QS = SSOT 보존)
//   - newStatus !== "completed" → skip (in_progress / scheduled = 라이브 영향 0)
//   - previousStatus === "completed" → skip (재진입 sync = QS 박제 흐름 보존 / 무한 덮어쓰기 방지)
//   - pbpCount === 0 → skip (PBP 0 = 갱신 의미 0 = NULL/0 박제 회피)
//   - 그 외 (Flutter + 신규 completed 전환 + PBP 1+) → true
export type ShouldAutoSyncInput = {
  // 2026-06-22: RecordingMode 3값화(manual 추가) 대응 — 매치 레벨 getRecordingMode 는
  //   실제로 flutter/paper 만 반환(manual 은 대회 레벨 전용)하나, 타입 정합 위해 허용.
  //   manual 은 paper 가 아니라 아래 분기에서 flutter 와 동일 취급(매치엔 안 들어옴).
  recordingMode: "flutter" | "paper" | "manual";
  newStatus: string;
  previousStatus: string;
  pbpCount: number;
};

/**
 * 자동 갱신 trigger 조건 결정 — 4 가드 조합.
 *
 * 호출 위치: service `syncSingleMatch` 안 (tournamentMatch.update 직전).
 *
 * 보호 룰 (회귀 0 보장):
 *   1. paper 매치 = DB.QS = SSOT (score-sheet BFF 박제 / LIVE API L933 패턴)
 *   2. in_progress / scheduled = 라이브 영향 0 (Flutter app 자동 sync 빈도 高)
 *   3. 이미 completed = 재진입 sync (수동 정정 / Flutter 재시도) 영향 0
 *   4. PBP 0건 = 갱신 source 부재 → input.quarter_scores fallback (regulation 매치 박제 흐름 보존)
 *
 * @param input 호출자가 service 안에서 매핑한 4 가드 input
 * @returns true → computeQuarterScoresFromPbp 결과로 quarter_scores 박제 / false → input.quarter_scores 보존
 */
export function shouldAutoSyncQuarterScores(input: ShouldAutoSyncInput): boolean {
  // 1) paper 매치 = DB.QS SSOT 보존 (LIVE API L933 패턴)
  if (input.recordingMode === "paper") return false;
  // 2) newStatus !== "completed" = 라이브/스케줄 매치 영향 0
  if (input.newStatus !== "completed") return false;
  // 3) previousStatus === "completed" = 재진입 sync skip
  if (input.previousStatus === "completed") return false;
  // 4) PBP 0건 = 갱신 source 부재 (input.quarter_scores 보존)
  if (input.pbpCount === 0) return false;
  // 5) 그 외 = Flutter + 신규 completed 전환 + PBP 1+ → auto-sync 진입
  return true;
}
