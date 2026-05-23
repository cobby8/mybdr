/**
 * 2026-05-23 — PR-5 F1 quarterScores 자동 갱신 PURE 헬퍼 회귀 방지.
 *
 * 검증 범위 (위임 §F1 — 9 케이스):
 *   PURE 헬퍼 5 케이스 (Q1~Q5):
 *     Q1. Q1~Q4 made events 정확 분포 → q1~q4 정확 / ot=[]
 *     Q2. OT1+OT2 (quarter=5+6) → ot.length===2
 *     Q3. PBP 0건 → 모두 0
 *     Q4. is_made=false 혼합 → made 만 합산
 *     Q5. is_made=null 혼합 → null 제외
 *
 *   trigger 헬퍼 4 케이스 (Q6~Q9):
 *     Q6. paper + completed 전환 → false (skip)
 *     Q7. Flutter + completed 신규 전환 + PBP 10건 → true
 *     Q8. Flutter + in_progress 유지 → false
 *     Q9. Flutter + completed → completed (재진입) → false
 *
 * DB 의존성 0 — PURE 헬퍼 단위 테스트만. service 통합은 match-sync.test.ts 별도 영역.
 */

import { describe, it, expect } from "vitest";
import {
  computeQuarterScoresFromPbp,
  shouldAutoSyncQuarterScores,
} from "@/lib/tournaments/quarter-scores-sync";
import type { PlayByPlayInput } from "@/lib/services/match-sync";

// ============================================================================
// PlayByPlayInput minimal 헬퍼 — 22 필드 + 부가 채움 (테스트 핵심 필드만 변경 가능)
// ============================================================================

/**
 * minimal PBP event 생성 헬퍼 — 22 필드 풀 채움 + 핵심 필드 override 허용.
 * is_made / points_scored / quarter / tournament_team_id 만 케이스별 변경.
 */
function makePbp(overrides: Partial<PlayByPlayInput>): PlayByPlayInput {
  return {
    local_id: "test-pbp-1",
    tournament_team_player_id: 1,
    tournament_team_id: 10, // 기본 = home (homeTeamIdNum=10)
    quarter: 1,
    game_clock_seconds: 600,
    action_type: "score",
    is_made: true,
    points_scored: 2,
    home_score_at_time: 0,
    away_score_at_time: 0,
    is_flagrant: false,
    is_technical: false,
    is_fastbreak: false,
    is_second_chance: false,
    is_from_turnover: false,
    ...overrides,
  };
}

// ============================================================================
// PURE 헬퍼 computeQuarterScoresFromPbp — Q1~Q5 (5 케이스)
// ============================================================================

describe("quarter-scores-sync — computeQuarterScoresFromPbp (PURE / Q1~Q5)", () => {
  // Q1: regulation 매치 정확 분포 = 가장 흔한 케이스 / LIVE API L909~920 동등성 보장
  it("Q1: Q1~Q4 made events 정확 분포 (home q1=1, q2=2, q3=3, q4=4 / away q1=2, q2=2, q3=2, q4=2)", () => {
    const HOME_TID = 10;
    const AWAY_TID = 20;
    const pbpInputs: PlayByPlayInput[] = [
      // home q1=1점 (FT 1)
      makePbp({ quarter: 1, tournament_team_id: HOME_TID, points_scored: 1 }),
      // home q2=2점 (2pt 1)
      makePbp({ quarter: 2, tournament_team_id: HOME_TID, points_scored: 2 }),
      // home q3=3점 (3pt 1)
      makePbp({ quarter: 3, tournament_team_id: HOME_TID, points_scored: 3 }),
      // home q4=4점 (2pt 2)
      makePbp({ quarter: 4, tournament_team_id: HOME_TID, points_scored: 2 }),
      makePbp({ quarter: 4, tournament_team_id: HOME_TID, points_scored: 2 }),
      // away q1=2, q2=2, q3=2, q4=2 (각 1슛씩)
      makePbp({ quarter: 1, tournament_team_id: AWAY_TID, points_scored: 2 }),
      makePbp({ quarter: 2, tournament_team_id: AWAY_TID, points_scored: 2 }),
      makePbp({ quarter: 3, tournament_team_id: AWAY_TID, points_scored: 2 }),
      makePbp({ quarter: 4, tournament_team_id: AWAY_TID, points_scored: 2 }),
    ];
    const result = computeQuarterScoresFromPbp(pbpInputs, HOME_TID);
    expect(result.home).toEqual({ q1: 1, q2: 2, q3: 3, q4: 4, ot: [] });
    expect(result.away).toEqual({ q1: 2, q2: 2, q3: 2, q4: 2, ot: [] });
  });

  // Q2: OT1+OT2 분리 = 매치 124 사고 케이스 재현 가능 보장
  it("Q2: OT1+OT2 (quarter=5+6) made events → ot=[OT1, OT2] 분리", () => {
    const HOME_TID = 10;
    const AWAY_TID = 20;
    const pbpInputs: PlayByPlayInput[] = [
      // regulation 0 (편의상 OT 만 박제)
      // OT1 = home 5, away 5 (q=5)
      makePbp({ quarter: 5, tournament_team_id: HOME_TID, points_scored: 3 }),
      makePbp({ quarter: 5, tournament_team_id: HOME_TID, points_scored: 2 }),
      makePbp({ quarter: 5, tournament_team_id: AWAY_TID, points_scored: 5 }),
      // OT2 = home 7, away 12 (q=6)
      makePbp({ quarter: 6, tournament_team_id: HOME_TID, points_scored: 4 }),
      makePbp({ quarter: 6, tournament_team_id: HOME_TID, points_scored: 3 }),
      makePbp({ quarter: 6, tournament_team_id: AWAY_TID, points_scored: 6 }),
      makePbp({ quarter: 6, tournament_team_id: AWAY_TID, points_scored: 6 }),
    ];
    const result = computeQuarterScoresFromPbp(pbpInputs, HOME_TID);
    // regulation 모두 0 (OT 만 박제)
    expect(result.home.q1).toBe(0);
    expect(result.home.q2).toBe(0);
    expect(result.home.q3).toBe(0);
    expect(result.home.q4).toBe(0);
    // OT1 / OT2 분리
    expect(result.home.ot).toEqual([5, 7]); // OT1=5 / OT2=7
    expect(result.away.ot).toEqual([5, 12]); // OT1=5 / OT2=12
    expect(result.home.ot.length).toBe(2);
    expect(result.away.ot.length).toBe(2);
  });

  // Q3: PBP 0건 = 정합 매치 / 신규 매치 박제 케이스 (회귀 0 보장)
  it("Q3: PBP 0건 → 모두 0 (ot=[])", () => {
    const result = computeQuarterScoresFromPbp([], 10);
    expect(result.home).toEqual({ q1: 0, q2: 0, q3: 0, q4: 0, ot: [] });
    expect(result.away).toEqual({ q1: 0, q2: 0, q3: 0, q4: 0, ot: [] });
  });

  // Q4: is_made=false (miss) 제외 = LIVE API L913 패턴 정확 답습
  it("Q4: is_made=false 혼합 → made 만 합산 (miss 제외)", () => {
    const HOME_TID = 10;
    const pbpInputs: PlayByPlayInput[] = [
      // made 2점 (이게 합산되어야 함)
      makePbp({
        quarter: 1,
        tournament_team_id: HOME_TID,
        points_scored: 2,
        is_made: true,
      }),
      // miss = is_made=false → 제외
      makePbp({
        quarter: 1,
        tournament_team_id: HOME_TID,
        points_scored: 2,
        is_made: false,
      }),
      makePbp({
        quarter: 1,
        tournament_team_id: HOME_TID,
        points_scored: 3,
        is_made: false,
      }),
    ];
    const result = computeQuarterScoresFromPbp(pbpInputs, HOME_TID);
    // home q1 = 2 점 (miss 2건 제외) / away 0
    expect(result.home.q1).toBe(2);
    expect(result.away.q1).toBe(0);
  });

  // Q5: is_made=null (비-슛 이벤트 / 파울/리바운드) 제외 = PBP 22 필드 schema 보장
  it("Q5: is_made=null 혼합 → null 제외 (정확 0 합산)", () => {
    const HOME_TID = 10;
    const pbpInputs: PlayByPlayInput[] = [
      // is_made=null = 비-슛 이벤트 (파울 / 리바운드 / 어시스트 등)
      makePbp({
        quarter: 1,
        tournament_team_id: HOME_TID,
        points_scored: 0,
        is_made: null,
      }),
      makePbp({
        quarter: 2,
        tournament_team_id: HOME_TID,
        points_scored: 0,
        is_made: null,
      }),
      // made 2점 (1건만 합산)
      makePbp({
        quarter: 3,
        tournament_team_id: HOME_TID,
        points_scored: 2,
        is_made: true,
      }),
    ];
    const result = computeQuarterScoresFromPbp(pbpInputs, HOME_TID);
    expect(result.home).toEqual({ q1: 0, q2: 0, q3: 2, q4: 0, ot: [] });
    expect(result.away).toEqual({ q1: 0, q2: 0, q3: 0, q4: 0, ot: [] });
  });
});

// ============================================================================
// trigger 헬퍼 shouldAutoSyncQuarterScores — Q6~Q9 (4 케이스)
// ============================================================================

describe("quarter-scores-sync — shouldAutoSyncQuarterScores (trigger / Q6~Q9)", () => {
  // Q6: paper 매치 = DB.QS SSOT 보존 (LIVE API L933 패턴) — 회귀 핵심 가드
  it("Q6: paper + completed 신규 전환 → false (DB.QS SSOT 보존)", () => {
    const result = shouldAutoSyncQuarterScores({
      recordingMode: "paper",
      newStatus: "completed",
      previousStatus: "in_progress",
      pbpCount: 10,
    });
    expect(result).toBe(false);
  });

  // Q7: Flutter + completed 신규 전환 + PBP 10건 = 정상 trigger 케이스
  it("Q7: Flutter + completed 신규 전환 + PBP 10건 → true (auto-sync 진입)", () => {
    const result = shouldAutoSyncQuarterScores({
      recordingMode: "flutter",
      newStatus: "completed",
      previousStatus: "in_progress",
      pbpCount: 10,
    });
    expect(result).toBe(true);
  });

  // Q8: in_progress 유지 = 라이브 매치 영향 0 (Flutter sync 빈도 高)
  it("Q8: Flutter + in_progress 유지 → false (라이브 영향 0)", () => {
    const result = shouldAutoSyncQuarterScores({
      recordingMode: "flutter",
      newStatus: "in_progress",
      previousStatus: "in_progress",
      pbpCount: 5,
    });
    expect(result).toBe(false);
  });

  // Q9: 재진입 sync (completed → completed) = 무한 덮어쓰기 방지
  it("Q9: Flutter + completed → completed (재진입 sync) → false (재진입 skip)", () => {
    const result = shouldAutoSyncQuarterScores({
      recordingMode: "flutter",
      newStatus: "completed",
      previousStatus: "completed",
      pbpCount: 10,
    });
    expect(result).toBe(false);
  });

  // 보너스: PBP 0건 = 갱신 source 부재 (input.quarter_scores 보존)
  it("보너스: Flutter + completed 신규 전환 + PBP 0건 → false (PBP 0 = 갱신 source 부재)", () => {
    const result = shouldAutoSyncQuarterScores({
      recordingMode: "flutter",
      newStatus: "completed",
      previousStatus: "in_progress",
      pbpCount: 0,
    });
    expect(result).toBe(false);
  });
});
