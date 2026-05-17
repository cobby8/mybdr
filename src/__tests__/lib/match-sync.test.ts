/**
 * 2026-05-11 — Phase 1-B sync route refactor 동등성 회귀 방지.
 *
 * 배경 (decisions.md [2026-05-11] §1):
 *   - 웹 종이 기록지 BFF 와 Flutter sync route 가 동일 core 로직 호출 = 단일 source.
 *   - sync route 의 inline 분기 로직을 `src/lib/services/match-sync.ts` 에 추출.
 *   - **본 turn 보장: sync route 결과 (응답 데이터 + 부작용) 0 변경**.
 *
 * 검증 범위 (순수 헬퍼 4 종):
 *   1. correctScoresFromQuarters — BUG-04 quarter 합산 정합 보정
 *   2. decideWinnerTeamId — winner_team_id 자동 결정 (status / 점수 / 양 팀)
 *   3. computeStatRates — boxscore percentage 4 + efficiency NBA 표준
 *   4. isMatchReset — Flutter app 매치 reset 케이스 (scheduled + empty)
 *
 * DB 의존성 0 — 순수 함수 단위 테스트만. sync route 통합은 별도 e2e 영역.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  correctScoresFromQuarters,
  decideWinnerTeamId,
  computeStatRates,
  isMatchReset,
} from "@/lib/services/match-sync";

// ============================================================================
// 1. correctScoresFromQuarters — BUG-04 보정
// ============================================================================

describe("match-sync — correctScoresFromQuarters (BUG-04 quarter 합산 보정)", () => {
  it("quarter_scores 없으면 원본 그대로", () => {
    // Flutter app 이 quarter 별 점수 미보낸 경우 (legacy/in-progress) — home/away 그대로
    const result = correctScoresFromQuarters({
      home_score: 80,
      away_score: 75,
    });
    expect(result).toEqual({ homeScore: 80, awayScore: 75 });
  });

  it("quarter 합 = home/away score 일치 → 원본 그대로", () => {
    // 정상 sync — quarter 합 20+20+20+20 = 80 일치
    const result = correctScoresFromQuarters({
      home_score: 80,
      away_score: 75,
      quarter_scores: {
        home: { q1: 20, q2: 20, q3: 20, q4: 20 },
        away: { q1: 18, q2: 20, q3: 17, q4: 20 },
      },
    });
    expect(result).toEqual({ homeScore: 80, awayScore: 75 });
  });

  it("quarter 합 ≠ home/away score → quarter 합 우선 (BUG-04)", () => {
    // Flutter race condition — quarter 합 81 vs home_score 80 → quarter 우선 (81)
    const result = correctScoresFromQuarters({
      home_score: 80,
      away_score: 75,
      quarter_scores: {
        home: { q1: 21, q2: 20, q3: 20, q4: 20 }, // 합 = 81
        away: { q1: 18, q2: 20, q3: 17, q4: 20 }, // 합 = 75
      },
    });
    expect(result).toEqual({ homeScore: 81, awayScore: 75 });
  });

  it("연장 (ot 배열) 포함 합산", () => {
    // 연장 2번 진행 — base 80 + ot[10, 8] = 98
    const result = correctScoresFromQuarters({
      home_score: 98,
      away_score: 88,
      quarter_scores: {
        home: { q1: 20, q2: 20, q3: 20, q4: 20, ot: [10, 8] },
        away: { q1: 18, q2: 20, q3: 17, q4: 25, ot: [5, 3] },
      },
    });
    expect(result).toEqual({ homeScore: 98, awayScore: 88 });
  });

  it("quarter_scores 가 home/away 한쪽만 있으면 원본 그대로 (보정 skip)", () => {
    // Flutter app legacy 케이스 — home 만 보내고 away 누락 = 보정 skip
    const result = correctScoresFromQuarters({
      home_score: 80,
      away_score: 75,
      quarter_scores: {
        home: { q1: 21, q2: 20, q3: 20, q4: 20 },
        // away 미설정
      },
    });
    expect(result).toEqual({ homeScore: 80, awayScore: 75 });
  });

  it("quarter 누락 (q1 만 입력 + q2~q4 undefined) → ?? 0 처리", () => {
    // 1쿼터만 진행 중 — q2~q4 undefined 가 0 으로 처리되어야 함
    const result = correctScoresFromQuarters({
      home_score: 15,
      away_score: 10,
      quarter_scores: {
        home: { q1: 15 },
        away: { q1: 10 },
      },
    });
    expect(result).toEqual({ homeScore: 15, awayScore: 10 });
  });
});

// ============================================================================
// 2. decideWinnerTeamId — winner 자동 결정
// ============================================================================

describe("match-sync — decideWinnerTeamId (winner 자동 결정)", () => {
  const HOME = BigInt(100);
  const AWAY = BigInt(200);

  it("status ≠ completed → null (winner 결정 X)", () => {
    // in_progress / scheduled / cancelled 모두 결정 skip
    expect(
      decideWinnerTeamId({
        status: "in_progress",
        homeScore: 80,
        awayScore: 75,
        existingWinnerTeamId: null,
        homeTeamId: HOME,
        awayTeamId: AWAY,
      })
    ).toBe(null);
  });

  it("기존 winner 있으면 그대로 보존 (idempotent)", () => {
    // 운영자가 수동으로 winner 박은 매치 = sync 가 덮어쓰지 않음
    const existingWinner = HOME;
    expect(
      decideWinnerTeamId({
        status: "completed",
        homeScore: 70, // away 가 이긴 점수
        awayScore: 80,
        existingWinnerTeamId: existingWinner,
        homeTeamId: HOME,
        awayTeamId: AWAY,
      })
    ).toBe(HOME);
  });

  it("completed + home 점수 우위 → homeTeamId", () => {
    expect(
      decideWinnerTeamId({
        status: "completed",
        homeScore: 80,
        awayScore: 75,
        existingWinnerTeamId: null,
        homeTeamId: HOME,
        awayTeamId: AWAY,
      })
    ).toBe(HOME);
  });

  it("completed + away 점수 우위 → awayTeamId", () => {
    expect(
      decideWinnerTeamId({
        status: "completed",
        homeScore: 70,
        awayScore: 75,
        existingWinnerTeamId: null,
        homeTeamId: HOME,
        awayTeamId: AWAY,
      })
    ).toBe(AWAY);
  });

  it("completed + 동점 → null (수동 결정 필요)", () => {
    // 5x5 정규 농구 동점은 연장 — 사용자 결재 후 winner 박제. sync 는 결정 skip.
    expect(
      decideWinnerTeamId({
        status: "completed",
        homeScore: 80,
        awayScore: 80,
        existingWinnerTeamId: null,
        homeTeamId: HOME,
        awayTeamId: AWAY,
      })
    ).toBe(null);
  });

  it("completed + 양 팀 미설정 → null (결정 불가)", () => {
    // 토너먼트 진행 중 슬롯 미배정 매치 — winner 결정 X
    expect(
      decideWinnerTeamId({
        status: "completed",
        homeScore: 80,
        awayScore: 75,
        existingWinnerTeamId: null,
        homeTeamId: null,
        awayTeamId: AWAY,
      })
    ).toBe(null);
    expect(
      decideWinnerTeamId({
        status: "completed",
        homeScore: 80,
        awayScore: 75,
        existingWinnerTeamId: null,
        homeTeamId: HOME,
        awayTeamId: null,
      })
    ).toBe(null);
  });
});

// ============================================================================
// 3. computeStatRates — boxscore percentage + efficiency
// ============================================================================

describe("match-sync — computeStatRates (boxscore % / efficiency)", () => {
  const emptyStat = {
    field_goals_made: 0,
    field_goals_attempted: 0,
    three_pointers_made: 0,
    three_pointers_attempted: 0,
    free_throws_made: 0,
    free_throws_attempted: 0,
    two_pointers_made: 0,
    two_pointers_attempted: 0,
    points: 0,
    total_rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
  };

  it("시도 0 → % 모두 0 (0/0 NaN 방지)", () => {
    // 신규 매치 created 시점 — 시도 0 매치는 NaN 회피 필수
    const result = computeStatRates(emptyStat);
    expect(result.fgPct).toBe(0);
    expect(result.tpPct).toBe(0);
    expect(result.ftPct).toBe(0);
    expect(result.twoPct).toBe(0);
    expect(result.efficiency).toBe(0);
  });

  it("표준 % 계산 — 4/10 = 40% / 2/5 = 40% / 3/4 = 75%", () => {
    const result = computeStatRates({
      ...emptyStat,
      field_goals_made: 4,
      field_goals_attempted: 10,
      three_pointers_made: 2,
      three_pointers_attempted: 5,
      free_throws_made: 3,
      free_throws_attempted: 4,
      two_pointers_made: 2,
      two_pointers_attempted: 5,
    });
    expect(result.fgPct).toBe(40);
    expect(result.tpPct).toBe(40);
    expect(result.ftPct).toBe(75);
    expect(result.twoPct).toBe(40);
  });

  it("100% 케이스 — 5/5 = 100", () => {
    // 완벽 슛 케이스 — 분수 → 100 정확 (부동소수 정밀도 OK)
    const result = computeStatRates({
      ...emptyStat,
      field_goals_made: 5,
      field_goals_attempted: 5,
    });
    expect(result.fgPct).toBe(100);
  });

  it("efficiency 표준 공식 = PTS + REB + AST + STL + BLK - MISS_FG - MISS_FT - TO", () => {
    // 20 + 10 + 5 + 2 + 1 - (10-4) - (4-3) - 3 = 28
    const result = computeStatRates({
      field_goals_made: 4,
      field_goals_attempted: 10,
      three_pointers_made: 0,
      three_pointers_attempted: 0,
      free_throws_made: 3,
      free_throws_attempted: 4,
      two_pointers_made: 0,
      two_pointers_attempted: 0,
      points: 20,
      total_rebounds: 10,
      assists: 5,
      steals: 2,
      blocks: 1,
      turnovers: 3,
    });
    // 20+10+5+2+1=38, miss=6+1+3=10 → 28
    expect(result.efficiency).toBe(28);
  });

  it("부동소수 케이스 — 1/3 = 33.33...", () => {
    // 통산 합산 시 부동소수 정밀도 — sum 시 안전 (JS number 표준)
    const result = computeStatRates({
      ...emptyStat,
      field_goals_made: 1,
      field_goals_attempted: 3,
    });
    expect(result.fgPct).toBeCloseTo(33.333, 2);
  });
});

// ============================================================================
// 4. isMatchReset — Flutter app 매치 reset 감지
// ============================================================================

describe("match-sync — isMatchReset (Flutter app 매치 reset 감지)", () => {
  it("status=scheduled + stats 0 + plays 0 → true (reset)", () => {
    // Flutter app 이 매치 처음부터 다시 시작 — 서버 PBP/stats 잔류 삭제 필요
    expect(
      isMatchReset({
        status: "scheduled",
        playerStatsLength: 0,
        playByPlaysLength: 0,
      })
    ).toBe(true);
  });

  it("status=scheduled + stats 5 → false (보존)", () => {
    // 이전 진행 매치 sync 가 stats 보유 — reset 아님
    expect(
      isMatchReset({
        status: "scheduled",
        playerStatsLength: 5,
        playByPlaysLength: 0,
      })
    ).toBe(false);
  });

  it("status=scheduled + plays 10 → false (보존)", () => {
    // PBP 만 보낸 케이스 — reset 아님
    expect(
      isMatchReset({
        status: "scheduled",
        playerStatsLength: 0,
        playByPlaysLength: 10,
      })
    ).toBe(false);
  });

  it("status=in_progress / completed / cancelled → false (reset 아님)", () => {
    // scheduled 외 모든 status 는 reset 대상 아님
    for (const status of ["in_progress", "completed", "cancelled"]) {
      expect(
        isMatchReset({
          status,
          playerStatsLength: 0,
          playByPlaysLength: 0,
        })
      ).toBe(false);
    }
  });
});

// ============================================================================
// 5. syncSingleMatch — existingMatch 인자 분기 (1B-2 신규 / SELECT 2→1 통합)
// ============================================================================

/**
 * 1B-2: BFF 가 권한 가드용 SELECT 한 row 를 service 에 그대로 전달 → service 가 findFirst skip.
 * 본 테스트는 prisma.tournamentMatch.findFirst 호출 횟수만 검증 — DB 부작용 (update / upsert) 은
 * 별도 e2e 영역. status="scheduled" + stats/plays 0 으로 minimal path 만 통과.
 */
describe("match-sync — syncSingleMatch existingMatch 분기 (SELECT 통합)", () => {
  // 이유: service 내부 prisma 호출을 spy 로 검증 → vi.mock 으로 prisma module 격리.
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("existingMatch 제공 + id/tournamentId 일치 → findFirst 호출 0 (SELECT skip)", async () => {
    // prisma 동적 mock — match-sync.ts 가 import 한 prisma 가 본 mock 으로 치환
    const findFirstMock = vi.fn();
    const updateMock = vi.fn().mockResolvedValue({});
    const findUniqueMock = vi.fn().mockResolvedValue({ format: "single_elimination" });
    vi.doMock("@/lib/db/prisma", () => ({
      prisma: {
        tournamentMatch: {
          findFirst: findFirstMock,
          update: updateMock,
        },
        tournament: {
          findUnique: findUniqueMock,
        },
        play_by_plays: { deleteMany: vi.fn() },
        matchPlayerStat: { deleteMany: vi.fn() },
      },
    }));
    vi.doMock("@/lib/tournaments/update-standings", () => ({
      advanceWinner: vi.fn(),
      updateTeamStandings: vi.fn(),
    }));
    vi.doMock("@/lib/tournaments/dual-progression", () => ({
      progressDualMatch: vi.fn(),
    }));
    vi.doMock("@vercel/functions", () => ({ waitUntil: vi.fn() }));
    vi.doMock("@/lib/news/auto-publish-match-brief", () => ({
      triggerMatchBriefPublish: vi.fn(),
    }));

    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    const existingMatch = {
      id: BigInt(123),
      tournamentId: "t-abc",
      homeTeamId: BigInt(10),
      awayTeamId: BigInt(20),
      winner_team_id: null,
      status: "scheduled",
      started_at: null, // 2026-05-17 fix A — auto-register 윈도우 가드용
    };

    const result = await syncSingleMatch({
      tournamentId: "t-abc",
      match: {
        server_id: 123,
        home_score: 0,
        away_score: 0,
        status: "scheduled",
      },
      existingMatch,
    });

    expect(result.ok).toBe(true);
    // 핵심 검증 — findFirst 호출 0회 (existingMatch 재사용 = SELECT skip)
    expect(findFirstMock).not.toHaveBeenCalled();
    // update 는 호출 (sync 본체 진행)
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("existingMatch 미제공 → findFirst 1회 호출 (기존 동작 보존)", async () => {
    // 하위 호환 — sync route 가 기존처럼 호출 시 service 가 SELECT 1회 수행
    const findFirstMock = vi.fn().mockResolvedValue({
      id: BigInt(124),
      tournamentId: "t-xyz",
      homeTeamId: BigInt(11),
      awayTeamId: BigInt(21),
      winner_team_id: null,
      status: "scheduled",
    });
    const updateMock = vi.fn().mockResolvedValue({});
    const findUniqueMock = vi.fn().mockResolvedValue({ format: "single_elimination" });
    vi.doMock("@/lib/db/prisma", () => ({
      prisma: {
        tournamentMatch: {
          findFirst: findFirstMock,
          update: updateMock,
        },
        tournament: {
          findUnique: findUniqueMock,
        },
        play_by_plays: { deleteMany: vi.fn() },
        matchPlayerStat: { deleteMany: vi.fn() },
      },
    }));
    vi.doMock("@/lib/tournaments/update-standings", () => ({
      advanceWinner: vi.fn(),
      updateTeamStandings: vi.fn(),
    }));
    vi.doMock("@/lib/tournaments/dual-progression", () => ({
      progressDualMatch: vi.fn(),
    }));
    vi.doMock("@vercel/functions", () => ({ waitUntil: vi.fn() }));
    vi.doMock("@/lib/news/auto-publish-match-brief", () => ({
      triggerMatchBriefPublish: vi.fn(),
    }));

    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    const result = await syncSingleMatch({
      tournamentId: "t-xyz",
      match: {
        server_id: 124,
        home_score: 0,
        away_score: 0,
        status: "scheduled",
      },
      // existingMatch 미제공 — 기존 sync route 호출 패턴
    });

    expect(result.ok).toBe(true);
    // 핵심 검증 — findFirst 1회 호출 (회귀 0)
    expect(findFirstMock).toHaveBeenCalledTimes(1);
  });
});
