/**
 * 2026-05-11 — Phase 1-B sync route refactor 동등성 회귀 방지.
 *
 * 배경 (decisions.md [2026-05-11] §1):
 *   - 웹 전자기록지 BFF 와 Flutter sync route 가 동일 core 로직 호출 = 단일 source.
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

// ============================================================================
// 6. syncSingleMatch — MPS deleteMany NOT IN 가드 (F3-α / 2026-05-21)
// ============================================================================

/**
 * 2026-05-21 F3-α (errors.md [2026-05-21] paper 모드 3가지 특수 결함 — C 분류 fix):
 *   PBP `deleteMany NOT IN incoming local_id` 패턴 답습.
 *   강남구 paper 매치 159/164/186 = score-sheet submit 30+회 반복 호출 시
 *   다른 ttp set 전송 → 이전 박제 ttp 잔존 → MPS 사일런트 +2점 누적 재발.
 *
 * 4 케이스 검증 (C1~C4):
 *   C1: 기존 ttp [1,2,3] DB + incoming ttp [1,2,3] → upsert 3건 / delete 0건
 *   C2: 기존 ttp [1,2,3] DB + incoming ttp [1,2]   → ttp [3] 삭제 / [1,2] upsert
 *   C3: 기존 ttp [] DB + incoming ttp [4,5]        → create 2건 / delete 0건
 *   C4: player_stats=undefined                      → deleteMany 미실행 (전체 보존 / 회귀 0)
 *
 * 검증 방식 = deleteMany / upsert call args 스파이.
 * DB 부작용 (실 row 삭제/생성) 은 별도 e2e 영역.
 */
describe("match-sync — syncSingleMatch MPS deleteMany NOT IN 가드 (F3-α)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  /**
   * 공용 mock 헬퍼 — prisma + 의존 module 4종 격리.
   * caller 가 mpsDeleteMany / mpsUpsert / pbpDeleteMany spy 를 받아서 케이스별 검증.
   */
  function setupMocks() {
    const mpsDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const mpsUpsert = vi.fn().mockResolvedValue({});
    const pbpDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const updateMock = vi.fn().mockResolvedValue({});
    const findUniqueMock = vi.fn().mockResolvedValue({ format: "single_elimination" });

    vi.doMock("@/lib/db/prisma", () => ({
      prisma: {
        tournamentMatch: {
          findFirst: vi.fn(),
          update: updateMock,
        },
        tournament: {
          findUnique: findUniqueMock,
        },
        play_by_plays: { deleteMany: pbpDeleteMany },
        matchPlayerStat: {
          deleteMany: mpsDeleteMany,
          upsert: mpsUpsert,
        },
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
    vi.doMock("@/lib/tournaments/finalize-match-completion", () => ({
      finalizeMatchCompletion: vi.fn().mockResolvedValue({}),
    }));

    return { mpsDeleteMany, mpsUpsert, pbpDeleteMany };
  }

  // PlayerStatInput 풀 필드를 채우는 헬퍼 — minimal valid stat (% / efficiency 는 0 처리).
  function makeStat(ttpId: number, points = 0) {
    return {
      tournament_team_player_id: ttpId,
      tournament_team_id: 10,
      is_starter: false,
      minutes_played: 0,
      points,
      field_goals_made: 0,
      field_goals_attempted: 0,
      two_pointers_made: 0,
      two_pointers_attempted: 0,
      three_pointers_made: 0,
      three_pointers_attempted: 0,
      free_throws_made: 0,
      free_throws_attempted: 0,
      offensive_rebounds: 0,
      defensive_rebounds: 0,
      total_rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      personal_fouls: 0,
      technical_fouls: 0,
      unsportsmanlike_fouls: 0,
      plus_minus: 0,
      fouled_out: false,
      ejected: false,
    };
  }

  // existingMatch 스텁 — in_progress 로 두어 isReset 분기 회피 (isReset 은 status=scheduled 만).
  const existingMatchStub = {
    id: BigInt(999),
    tournamentId: "t-f3a",
    homeTeamId: BigInt(10),
    awayTeamId: BigInt(20),
    winner_team_id: null,
    status: "in_progress",
    started_at: new Date("2026-05-21T10:00:00Z"),
  };

  it("C1: incoming ttp [1,2,3] = 기존 ttp [1,2,3] → deleteMany 1회 호출 (NOT IN [1,2,3]) / upsert 3회", async () => {
    // 핵심 검증 = deleteMany 의 WHERE NOT IN 절이 incoming ttp 전체 포함 → 실제 삭제 row 0건이 보장됨.
    // (DB count=0 mock 이지만 NOT IN 절 args 가 정확한지가 본 케이스 핵심.)
    const { mpsDeleteMany, mpsUpsert } = setupMocks();
    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    const result = await syncSingleMatch({
      tournamentId: "t-f3a",
      match: {
        server_id: 999,
        home_score: 30,
        away_score: 25,
        status: "in_progress",
      },
      player_stats: [makeStat(1, 10), makeStat(2, 12), makeStat(3, 8)],
      existingMatch: existingMatchStub,
    });

    expect(result.ok).toBe(true);
    expect(mpsDeleteMany).toHaveBeenCalledTimes(1);
    // deleteMany call args = WHERE NOT IN incoming ttp [1,2,3] (BigInt 으로 변환됨)
    const deleteCall = mpsDeleteMany.mock.calls[0][0];
    expect(deleteCall.where.tournamentMatchId).toBe(BigInt(999));
    expect(deleteCall.where.NOT.tournamentTeamPlayerId.in).toEqual([
      BigInt(1),
      BigInt(2),
      BigInt(3),
    ]);
    // upsert 3회 호출 (incoming ttp 마다 1회)
    expect(mpsUpsert).toHaveBeenCalledTimes(3);
  });

  it("C2: incoming ttp [1,2] (기존 ttp [1,2,3] 가정) → deleteMany NOT IN [1,2] 호출 → ttp [3] 정정 삭제 / upsert 2회", async () => {
    // 핵심 케이스 = 강남구 매치 159 재현 (incoming set 이 기존보다 작음 → 잔존 ttp [3] 정정).
    const { mpsDeleteMany, mpsUpsert } = setupMocks();
    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    const result = await syncSingleMatch({
      tournamentId: "t-f3a",
      match: {
        server_id: 999,
        home_score: 22,
        away_score: 25,
        status: "in_progress",
      },
      player_stats: [makeStat(1, 10), makeStat(2, 12)],
      existingMatch: existingMatchStub,
    });

    expect(result.ok).toBe(true);
    expect(mpsDeleteMany).toHaveBeenCalledTimes(1);
    const deleteCall = mpsDeleteMany.mock.calls[0][0];
    // NOT IN [1,2] 로 호출 → DB level 에서 ttp [3] 자동 정정 삭제
    expect(deleteCall.where.NOT.tournamentTeamPlayerId.in).toEqual([BigInt(1), BigInt(2)]);
    // upsert 는 incoming ttp 2건만
    expect(mpsUpsert).toHaveBeenCalledTimes(2);
  });

  it("C3: 기존 ttp [] (신규 박제) + incoming ttp [4,5] → deleteMany NOT IN [4,5] (실 삭제 0) / upsert 2회", async () => {
    // 신규 매치 박제 케이스 — deleteMany 호출은 되지만 실 삭제 row 는 0 (DB 가 자동 처리).
    // 호출 자체는 회귀 0 (PBP 패턴과 동일 — 항상 NOT IN 가드 호출).
    const { mpsDeleteMany, mpsUpsert } = setupMocks();
    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    const result = await syncSingleMatch({
      tournamentId: "t-f3a",
      match: {
        server_id: 999,
        home_score: 0,
        away_score: 0,
        status: "in_progress",
      },
      player_stats: [makeStat(4, 0), makeStat(5, 0)],
      existingMatch: existingMatchStub,
    });

    expect(result.ok).toBe(true);
    expect(mpsDeleteMany).toHaveBeenCalledTimes(1);
    const deleteCall = mpsDeleteMany.mock.calls[0][0];
    expect(deleteCall.where.NOT.tournamentTeamPlayerId.in).toEqual([BigInt(4), BigInt(5)]);
    // create 분기 = upsert 호출 2회 (incoming ttp 마다 / Prisma upsert 의 create path)
    expect(mpsUpsert).toHaveBeenCalledTimes(2);
  });

  it("C4: player_stats=undefined → deleteMany 미호출 (회귀 0 / 기존 stat 전체 보존)", async () => {
    // 핵심 회귀 가드 — Flutter sync 가 stats 없이 점수만 박제하는 케이스 (legacy / in-progress).
    // 본 분기에서 deleteMany 호출하면 운영 stat 전체 손실 = 즉시 회귀 사고.
    const { mpsDeleteMany, mpsUpsert } = setupMocks();
    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    const result = await syncSingleMatch({
      tournamentId: "t-f3a",
      match: {
        server_id: 999,
        home_score: 30,
        away_score: 25,
        status: "in_progress",
      },
      // player_stats 미제공 — 본 케이스가 가장 중요 (회귀 0 보장)
      existingMatch: existingMatchStub,
    });

    expect(result.ok).toBe(true);
    // deleteMany 절대 호출 안됨 (player_stats undefined 분기 = if 블록 skip)
    expect(mpsDeleteMany).not.toHaveBeenCalled();
    expect(mpsUpsert).not.toHaveBeenCalled();
  });
});

// ============================================================================
// 7. syncSingleMatch — quarterScores 자동 갱신 통합 (F1 / 2026-05-23 / PR-5)
// ============================================================================

/**
 * 2026-05-23 PR-5 F1 (errors.md [2026-05-21] 점수 4 source 시스템 차원 결함 fix):
 *   매치 종료 시점 (status='completed' 신규 전환) quarterScores 자동 갱신 통합 검증.
 *   PURE 헬퍼 9 케이스 (quarter-scores-sync.test.ts) 통과 전제 +
 *   본 통합 4 케이스 = service tournamentMatch.update 의 data.quarterScores 정확성 보장.
 *
 * 4 케이스 검증 (Q-int-1 ~ Q-int-4):
 *   Q-int-1: paper 매치 + completed 신규 전환 + input.QS={...} + PBP 15/12
 *            → DB.QS = input.QS 그대로 (paper SSOT 보존 / autoQuarterScores 미적용)
 *   Q-int-2: Flutter 매치 + completed 신규 전환 + input.QS=0/0 + PBP 합=15/12
 *            → DB.QS = PBP 합 (autoQuarterScores 적용)
 *   Q-int-3: Flutter 매치 + in_progress 유지 + PBP 10건
 *            → DB.QS = input.QS 그대로 (autoQuarterScores 미적용 / 라이브 영향 0)
 *   Q-int-4: Flutter 매치 + completed → completed (재진입)
 *            → DB.QS = input.QS 그대로 (재진입 skip)
 */
describe("match-sync — syncSingleMatch quarterScores 자동 갱신 통합 (F1 / PR-5)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  /**
   * 공용 mock 헬퍼 — F3-α setupMocks 답습 (update spy 핵심).
   */
  function setupMocks() {
    const updateMock = vi.fn().mockResolvedValue({});
    const findUniqueMock = vi.fn().mockResolvedValue({ format: "single_elimination" });
    const pbpDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const pbpUpsert = vi.fn().mockResolvedValue({});

    vi.doMock("@/lib/db/prisma", () => ({
      prisma: {
        tournamentMatch: {
          findFirst: vi.fn(),
          update: updateMock,
        },
        tournament: {
          findUnique: findUniqueMock,
        },
        play_by_plays: { deleteMany: pbpDeleteMany, upsert: pbpUpsert },
        matchPlayerStat: { deleteMany: vi.fn(), upsert: vi.fn() },
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
    vi.doMock("@/lib/tournaments/finalize-match-completion", () => ({
      // 2026-05-23 F1 fix — finalizeMatchCompletion 반환 shape (warnings 배열 / status)
      //   service line 724 `warnings.push(...finalizeResult.warnings)` 가 iterable 요구.
      finalizeMatchCompletion: vi.fn().mockResolvedValue({
        status: "ok",
        warnings: [],
      }),
    }));

    return { updateMock, pbpUpsert };
  }

  /**
   * minimal PBP event 생성 헬퍼 — 22 필드 풀 채움 + 핵심 필드 override 허용.
   * is_made / points_scored / quarter / tournament_team_id 만 케이스별 변경.
   */
  function makePbp(overrides: {
    tournament_team_player_id?: number | null;
    quarter?: number;
    tournament_team_id?: number;
    action_type?: string;
    action_subtype?: string | null;
    points_scored?: number;
    is_made?: boolean | null;
    local_id?: string;
  }) {
    const tournamentTeamPlayerId =
      overrides.tournament_team_player_id === undefined
        ? 1
        : overrides.tournament_team_player_id;

    return {
      local_id: overrides.local_id ?? "pbp-test-1",
      tournament_team_player_id: tournamentTeamPlayerId,
      tournament_team_id: overrides.tournament_team_id ?? 10,
      quarter: overrides.quarter ?? 1,
      game_clock_seconds: 600,
      action_type: overrides.action_type ?? "score",
      action_subtype: overrides.action_subtype ?? null,
      is_made: overrides.is_made ?? true,
      points_scored: overrides.points_scored ?? 2,
      home_score_at_time: 0,
      away_score_at_time: 0,
      is_flagrant: false,
      is_technical: false,
      is_fastbreak: false,
      is_second_chance: false,
      is_from_turnover: false,
    };
  }

  const HOME_TID = 10;
  const AWAY_TID = 20;

  // Q-int-1: paper 매치 = DB.QS SSOT 보존 = 핵심 회귀 가드 (LIVE API L933 패턴)
  it("Q-int-1: paper 매치 + completed 신규 전환 + input.QS + PBP → input.QS 그대로 (paper SSOT)", async () => {
    const { updateMock } = setupMocks();
    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    // paper 매치 — settings.recording_mode = "paper"
    const paperExistingMatch = {
      id: BigInt(700),
      tournamentId: "t-paper",
      homeTeamId: BigInt(HOME_TID),
      awayTeamId: BigInt(AWAY_TID),
      winner_team_id: null,
      status: "in_progress",
      started_at: new Date("2026-05-23T10:00:00Z"),
      settings: { recording_mode: "paper" },
    };

    // input.QS = paper score-sheet BFF 박제 (정확 점수)
    const paperInputQs = {
      home: { q1: 15, q2: 12, q3: 18, q4: 13, ot: [] },
      away: { q1: 10, q2: 11, q3: 14, q4: 9, ot: [] },
    };

    // PBP 도 함께 박제 (paper score-sheet BFF 가 PBP 도 박제)
    const pbpInputs = [
      makePbp({ quarter: 1, tournament_team_id: HOME_TID, points_scored: 15 }),
      makePbp({ quarter: 2, tournament_team_id: HOME_TID, points_scored: 12 }),
      makePbp({ quarter: 1, tournament_team_id: AWAY_TID, points_scored: 10 }),
    ];

    const result = await syncSingleMatch({
      tournamentId: "t-paper",
      match: {
        server_id: 700,
        home_score: 58,
        away_score: 44,
        status: "completed",
        quarter_scores: paperInputQs,
      },
      play_by_plays: pbpInputs,
      existingMatch: paperExistingMatch,
    });

    expect(result.ok).toBe(true);
    // update data.quarterScores = input.QS 그대로 (paper SSOT 보존)
    expect(updateMock).toHaveBeenCalledTimes(1);
    const updateData = updateMock.mock.calls[0][0].data;
    // input.QS 가 그대로 유지되어야 함 (auto-sync skip)
    expect(updateData.quarterScores.home).toEqual(paperInputQs.home);
    expect(updateData.quarterScores.away).toEqual(paperInputQs.away);
  });

  // Q-int-2: Flutter 매치 + completed 신규 전환 = 정상 trigger 케이스 = 본 PR 의 핵심 효과
  it("Q-int-2: Flutter + completed 신규 전환 + input.QS=0/0 + PBP 합=15/12 → DB.QS = PBP 합 (auto-sync)", async () => {
    const { updateMock } = setupMocks();
    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    // Flutter 매치 (settings = null / 또는 settings.recording_mode 미박제)
    const flutterExistingMatch = {
      id: BigInt(701),
      tournamentId: "t-flutter",
      homeTeamId: BigInt(HOME_TID),
      awayTeamId: BigInt(AWAY_TID),
      winner_team_id: null,
      status: "in_progress",
      started_at: new Date("2026-05-23T10:00:00Z"),
      settings: null,
    };

    // input.QS = 0/0 박제 (Flutter app 의 QS=0/0 사고 케이스 / D 분류 10건 재현)
    const flutterBadInputQs = {
      home: { q1: 0, q2: 0, q3: 0, q4: 0, ot: [] },
      away: { q1: 0, q2: 0, q3: 0, q4: 0, ot: [] },
    };

    // PBP = home q1=10, q2=5 (합=15) / away q1=12 (합=12)
    const pbpInputs = [
      makePbp({
        local_id: "pbp-1",
        quarter: 1,
        tournament_team_id: HOME_TID,
        points_scored: 10,
      }),
      makePbp({
        local_id: "pbp-2",
        quarter: 2,
        tournament_team_id: HOME_TID,
        points_scored: 5,
      }),
      makePbp({
        local_id: "pbp-3",
        quarter: 1,
        tournament_team_id: AWAY_TID,
        points_scored: 12,
      }),
    ];

    const result = await syncSingleMatch({
      tournamentId: "t-flutter",
      match: {
        server_id: 701,
        home_score: 15,
        away_score: 12,
        status: "completed",
        quarter_scores: flutterBadInputQs,
      },
      play_by_plays: pbpInputs,
      existingMatch: flutterExistingMatch,
    });

    expect(result.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledTimes(1);
    const updateData = updateMock.mock.calls[0][0].data;
    // 자동 갱신 = PBP 합 으로 덮어쓰기 (input.QS=0/0 무시)
    expect(updateData.quarterScores.home.q1).toBe(10);
    expect(updateData.quarterScores.home.q2).toBe(5);
    expect(updateData.quarterScores.away.q1).toBe(12);
    expect(updateData.quarterScores.away.q2).toBe(0);
  });

  // Q-int-3: in_progress 유지 = 라이브 매치 영향 0 (auto-sync 미진입)
  it("Q-int-3: Flutter + in_progress 유지 + PBP 1건 → DB.QS = input.QS 그대로 (라이브 영향 0)", async () => {
    const { updateMock } = setupMocks();
    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    const flutterExistingMatch = {
      id: BigInt(702),
      tournamentId: "t-flutter",
      homeTeamId: BigInt(HOME_TID),
      awayTeamId: BigInt(AWAY_TID),
      winner_team_id: null,
      status: "in_progress",
      started_at: new Date("2026-05-23T10:00:00Z"),
      settings: null,
    };

    // input.QS = Flutter app 가 보낸 라이브 점수
    const liveInputQs = {
      home: { q1: 10, q2: 0, q3: 0, q4: 0, ot: [] },
      away: { q1: 8, q2: 0, q3: 0, q4: 0, ot: [] },
    };

    const pbpInputs = [
      makePbp({ quarter: 1, tournament_team_id: HOME_TID, points_scored: 10 }),
      makePbp({ quarter: 1, tournament_team_id: AWAY_TID, points_scored: 8 }),
    ];

    const result = await syncSingleMatch({
      tournamentId: "t-flutter",
      match: {
        server_id: 702,
        home_score: 10,
        away_score: 8,
        status: "in_progress", // ← in_progress 유지
        quarter_scores: liveInputQs,
      },
      play_by_plays: pbpInputs,
      existingMatch: flutterExistingMatch,
    });

    expect(result.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledTimes(1);
    const updateData = updateMock.mock.calls[0][0].data;
    // input.QS 그대로 (auto-sync 미진입 / 라이브 영향 0)
    expect(updateData.quarterScores.home).toEqual(liveInputQs.home);
    expect(updateData.quarterScores.away).toEqual(liveInputQs.away);
  });

  // Q-int-4: 재진입 (completed → completed) = 무한 덮어쓰기 방지
  it("Q-int-4: Flutter + completed → completed (재진입) → DB.QS = input.QS 그대로 (재진입 skip)", async () => {
    const { updateMock } = setupMocks();
    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    // 이미 completed 매치 (재sync 케이스 / 운영자 수동 정정 / Flutter 재시도)
    const completedExistingMatch = {
      id: BigInt(703),
      tournamentId: "t-flutter",
      homeTeamId: BigInt(HOME_TID),
      awayTeamId: BigInt(AWAY_TID),
      winner_team_id: BigInt(HOME_TID), // 이미 winner 결정
      status: "completed", // ← 이미 completed
      started_at: new Date("2026-05-23T10:00:00Z"),
      settings: null,
    };

    // 운영자가 정정한 input.QS (PBP 와 다를 수 있음 / 운영자 결재 반영)
    const adminCorrectedQs = {
      home: { q1: 20, q2: 15, q3: 18, q4: 12, ot: [] },
      away: { q1: 18, q2: 14, q3: 16, q4: 10, ot: [] },
    };

    const pbpInputs = [
      makePbp({ quarter: 1, tournament_team_id: HOME_TID, points_scored: 5 }),
    ];

    const result = await syncSingleMatch({
      tournamentId: "t-flutter",
      match: {
        server_id: 703,
        home_score: 65,
        away_score: 58,
        status: "completed",
        quarter_scores: adminCorrectedQs,
      },
      play_by_plays: pbpInputs,
      existingMatch: completedExistingMatch,
    });

    expect(result.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledTimes(1);
    const updateData = updateMock.mock.calls[0][0].data;
    // input.QS 그대로 (재진입 skip / 운영자 정정 보존)
    expect(updateData.quarterScores.home).toEqual(adminCorrectedQs.home);
    expect(updateData.quarterScores.away).toEqual(adminCorrectedQs.away);
  });

  it("Q-int-5: team-owned PBP null player id is upserted as null", async () => {
    const { pbpUpsert } = setupMocks();
    const { syncSingleMatch } = await import("@/lib/services/match-sync");

    const flutterExistingMatch = {
      id: BigInt(704),
      tournamentId: "t-flutter",
      homeTeamId: BigInt(HOME_TID),
      awayTeamId: BigInt(AWAY_TID),
      winner_team_id: null,
      status: "in_progress",
      started_at: new Date("2026-05-23T10:00:00Z"),
      settings: null,
    };

    const result = await syncSingleMatch({
      tournamentId: "t-flutter",
      match: {
        server_id: 704,
        home_score: 10,
        away_score: 8,
        status: "in_progress",
      },
      play_by_plays: [
        makePbp({
          local_id: "team-rebound-1",
          tournament_team_player_id: null,
          tournament_team_id: HOME_TID,
          action_type: "rebound",
          action_subtype: "defensive",
          points_scored: 0,
          is_made: null,
        }),
      ],
      existingMatch: flutterExistingMatch,
    });

    expect(result.ok).toBe(true);
    expect(pbpUpsert).toHaveBeenCalledTimes(1);
    const call = pbpUpsert.mock.calls[0][0];
    expect(call.create.tournament_team_player_id).toBeNull();
    expect(call.update.tournament_team_player_id).toBeNull();
  });
});
