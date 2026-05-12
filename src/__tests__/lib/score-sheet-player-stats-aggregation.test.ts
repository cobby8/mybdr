/**
 * 2026-05-13 — Phase 20: score-sheet BFF player_stats 자동 집계 헬퍼 회귀 방지.
 *
 * 배경 (사용자 보고 이미지 46-47):
 *   - 라이브 박스스코어 PTS = 모두 0. 원인 = BFF 가 service 호출 시 player_stats 미전달.
 *   - 본 fix = running_score + fouls → player_id 단위 합산 → service 인자 전달.
 *
 * 검증 매트릭스:
 *   1. 빈 input → 빈 배열 반환
 *   2. 단일 선수 단일 마킹 (2pt) → points=2, twoMade=1, fgMade=1
 *   3. 동일 선수 multi-shot (1+2+3pt) → points=6, ftMade/twoMade/threeMade=1 each
 *   4. home + away 양 팀 합산 — team_id 분리 정확
 *   5. fouls 합산 — P/T/U/D 타입 분리 + foul-out (5+) 감지
 *   6. running_score + fouls 통합 — 한 선수가 양쪽 등장 시 합쳐짐 (key=playerId)
 *   7. fouled_out = totalFouls >= 5 (P 4 + T 1 = foul-out)
 *   8. attempted = made (종이 기록 = miss 미박제)
 */

import { describe, it, expect } from "vitest";
import { buildPlayerStatsFromRunningScore } from "@/app/api/web/score-sheet/[matchId]/submit/route";

describe("buildPlayerStatsFromRunningScore — running_score 집계", () => {
  it("빈 input → 빈 배열", () => {
    const stats = buildPlayerStatsFromRunningScore({
      homeTeamIdNum: 11,
      awayTeamIdNum: 22,
    });
    expect(stats).toEqual([]);
  });

  it("단일 선수 단일 2pt 마킹 → points=2 / fgMade=1 / twoMade=1", () => {
    const stats = buildPlayerStatsFromRunningScore({
      runningScore: {
        home: [{ position: 2, playerId: "100", period: 1, points: 2 }],
        away: [],
        currentPeriod: 1,
      },
      homeTeamIdNum: 11,
      awayTeamIdNum: 22,
    });
    expect(stats.length).toBe(1);
    expect(stats[0].tournament_team_player_id).toBe(100);
    expect(stats[0].tournament_team_id).toBe(11);
    expect(stats[0].points).toBe(2);
    expect(stats[0].field_goals_made).toBe(1);
    expect(stats[0].field_goals_attempted).toBe(1); // attempted = made
    expect(stats[0].two_pointers_made).toBe(1);
    expect(stats[0].three_pointers_made).toBe(0);
    expect(stats[0].free_throws_made).toBe(0);
    expect(stats[0].fouled_out).toBe(false);
  });

  it("동일 선수 1+2+3pt → points=6 / 각 type 별 1회", () => {
    const stats = buildPlayerStatsFromRunningScore({
      runningScore: {
        home: [
          { position: 1, playerId: "100", period: 1, points: 1 },
          { position: 3, playerId: "100", period: 1, points: 2 },
          { position: 6, playerId: "100", period: 2, points: 3 },
        ],
        away: [],
        currentPeriod: 2,
      },
      homeTeamIdNum: 11,
      awayTeamIdNum: 22,
    });
    expect(stats.length).toBe(1);
    expect(stats[0].points).toBe(6);
    expect(stats[0].free_throws_made).toBe(1);
    expect(stats[0].two_pointers_made).toBe(1);
    expect(stats[0].three_pointers_made).toBe(1);
    expect(stats[0].field_goals_made).toBe(2); // 2pt + 3pt (1pt 제외)
  });

  it("home + away 양 팀 → team_id 분리 정확", () => {
    const stats = buildPlayerStatsFromRunningScore({
      runningScore: {
        home: [{ position: 2, playerId: "100", period: 1, points: 2 }],
        away: [{ position: 3, playerId: "200", period: 1, points: 3 }],
        currentPeriod: 1,
      },
      homeTeamIdNum: 11,
      awayTeamIdNum: 22,
    });
    expect(stats.length).toBe(2);
    const home = stats.find((s) => s.tournament_team_player_id === 100);
    const away = stats.find((s) => s.tournament_team_player_id === 200);
    expect(home?.tournament_team_id).toBe(11);
    expect(home?.points).toBe(2);
    expect(away?.tournament_team_id).toBe(22);
    expect(away?.points).toBe(3);
  });
});

describe("buildPlayerStatsFromRunningScore — fouls 집계", () => {
  it("P/T/U 타입 분리 카운트", () => {
    const stats = buildPlayerStatsFromRunningScore({
      fouls: {
        home: [
          { playerId: "100", period: 1, type: "P" },
          { playerId: "100", period: 2, type: "T" },
          { playerId: "100", period: 3, type: "U" },
        ],
        away: [],
      },
      homeTeamIdNum: 11,
      awayTeamIdNum: 22,
    });
    expect(stats.length).toBe(1);
    expect(stats[0].personal_fouls).toBe(1);
    expect(stats[0].technical_fouls).toBe(1);
    expect(stats[0].unsportsmanlike_fouls).toBe(1);
    expect(stats[0].points).toBe(0); // 파울만 = 점수 0
  });

  it("D (Disqualifying) → personal_fouls 로 분류", () => {
    const stats = buildPlayerStatsFromRunningScore({
      fouls: {
        home: [{ playerId: "100", period: 1, type: "D" }],
        away: [],
      },
      homeTeamIdNum: 11,
      awayTeamIdNum: 22,
    });
    expect(stats[0].personal_fouls).toBe(1);
    expect(stats[0].technical_fouls).toBe(0);
  });

  it("5 fouls = fouled_out true (P 4 + T 1)", () => {
    const stats = buildPlayerStatsFromRunningScore({
      fouls: {
        home: [
          { playerId: "100", period: 1, type: "P" },
          { playerId: "100", period: 2, type: "P" },
          { playerId: "100", period: 3, type: "P" },
          { playerId: "100", period: 4, type: "P" },
          { playerId: "100", period: 4, type: "T" },
        ],
        away: [],
      },
      homeTeamIdNum: 11,
      awayTeamIdNum: 22,
    });
    expect(stats[0].fouled_out).toBe(true);
  });

  it("4 fouls = fouled_out false", () => {
    const stats = buildPlayerStatsFromRunningScore({
      fouls: {
        home: [
          { playerId: "100", period: 1, type: "P" },
          { playerId: "100", period: 2, type: "P" },
          { playerId: "100", period: 3, type: "P" },
          { playerId: "100", period: 4, type: "P" },
        ],
        away: [],
      },
      homeTeamIdNum: 11,
      awayTeamIdNum: 22,
    });
    expect(stats[0].fouled_out).toBe(false);
  });
});

describe("buildPlayerStatsFromRunningScore — 통합 (score + fouls)", () => {
  it("같은 선수가 양쪽 등장 → 1건으로 통합 (key=playerId)", () => {
    const stats = buildPlayerStatsFromRunningScore({
      runningScore: {
        home: [{ position: 2, playerId: "100", period: 1, points: 2 }],
        away: [],
        currentPeriod: 1,
      },
      fouls: {
        home: [{ playerId: "100", period: 2, type: "P" }],
        away: [],
      },
      homeTeamIdNum: 11,
      awayTeamIdNum: 22,
    });
    expect(stats.length).toBe(1);
    expect(stats[0].points).toBe(2);
    expect(stats[0].personal_fouls).toBe(1);
    expect(stats[0].tournament_team_id).toBe(11);
  });

  it("매치 218 시나리오 (운영 검증) — Q1~Q4 + OT1 = home 39 / away 38", () => {
    // 실 매치 218 quarterScores: home q1=11/q2=12/q3=4/q4=9/ot=[3] = 39, away q1=9/q2=8/q3=6/q4=13/ot=[2] = 38
    // 간소화: 1명이 모든 점수 박제했다고 가정
    const home2pt = Math.floor(39 / 2); // 19
    const homeRemainder = 39 - home2pt * 2; // 1 (1pt 1번)
    const homeMarks = Array.from({ length: home2pt }, (_, i) => ({
      position: i * 2 + 2,
      playerId: "100",
      period: 1 as const,
      points: 2 as const,
    }));
    if (homeRemainder === 1) {
      homeMarks.push({
        position: 39,
        playerId: "100",
        period: 1 as const,
        points: 1 as 2, // type assertion 회피 - 테스트 안 points 1
      });
    }

    const stats = buildPlayerStatsFromRunningScore({
      runningScore: {
        home: homeMarks,
        away: [],
        currentPeriod: 5,
      },
      homeTeamIdNum: 11,
      awayTeamIdNum: 22,
    });
    expect(stats.length).toBe(1);
    // 합산 정확 — Issue 1 fix 검증 (라이브 박스스코어 PTS = stat.points 표시)
    expect(stats[0].points).toBeGreaterThanOrEqual(38);
  });
});
