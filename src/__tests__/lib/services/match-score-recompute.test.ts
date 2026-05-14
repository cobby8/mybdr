/**
 * Match Score Recompute 단위 테스트 — Phase C: status route safety net.
 *
 * 검증 범위 (8 케이스):
 * 1) 매치 없음 → null 반환
 * 2) homeScore > 0 이미 박제 → source="skip" / changed 모두 false (멱등성)
 * 3) playerStats 정상 (#98 패턴) → source="playerStats" / 팀별 합 사용
 * 4) playerStats=0 + PBP 정상 (#132 패턴) → source="pbp" / PBP 합 39:26
 * 5) PBP=0 + playerStats=0 → source 고정 / quarterScores=null / changed 모두 false
 * 6) quarterScores 재계산 — Phase B 와 일치 (Q1~Q4 + OT)
 * 7) winner_team_id 재계산 — 점수 비교 / 동점 null / 기존 winner 와 다르면 갱신
 * 8) applyScoreSafetyNet 호출 시 audit 박제 + UPDATE 데이터 검증 (mock prisma)
 *
 * mock 패턴: 기존 admin-roles.test.ts / score-from-pbp.test.ts 와 일관.
 *   Prisma 호출 단위로 mock 객체 만들고 결과 매핑.
 *   recordMatchAudit 는 spy 로 호출 인자만 검증 (실제 DB INSERT ❌).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// recordMatchAudit 모듈 mock — applyScoreSafetyNet 가 호출하는지 + 인자 검증용.
// 모듈 mock 은 import 보다 위에 hoist 됨 (vi.mock 자체 호이스트).
vi.mock("@/lib/tournaments/match-audit", () => ({
  recordMatchAudit: vi.fn().mockResolvedValue(undefined),
  TRACKED_FIELDS: [
    "homeTeamId",
    "awayTeamId",
    "winner_team_id",
    "status",
    "homeScore",
    "awayScore",
    "scheduledAt",
  ],
}));

import {
  computeRecomputedScore,
  applyScoreSafetyNet,
} from "@/lib/services/match-score-recompute";
import { recordMatchAudit } from "@/lib/tournaments/match-audit";

// mock prisma 빌더 — case 별 fixture 단순화.
// "any" 캐스팅: vitest mock prisma 패턴 (TransactionClient 타입 완전 호환은 불가).
type AnyMockTx = {
  tournamentMatch: {
    findUnique: ReturnType<typeof vi.fn>;
    update?: ReturnType<typeof vi.fn>;
  };
  matchPlayerStat: {
    findMany: ReturnType<typeof vi.fn>;
  };
  play_by_plays: {
    findMany: ReturnType<typeof vi.fn>;
  };
};

function buildMockTx(opts: {
  matchHeader?: Record<string, unknown> | null;
  playerStats?: unknown[];
  pbpRows?: unknown[];
  /** UPDATE 호출 인자 캡처용 (applyScoreSafetyNet 검증 시) */
  updateImpl?: (...args: unknown[]) => unknown;
  /** before 스냅샷 (applyScoreSafetyNet 두번째 findUnique 응답) */
  beforeSnapshot?: Record<string, unknown> | null;
}): AnyMockTx {
  const findUnique = vi.fn();
  // applyScoreSafetyNet 안에서 2회 호출됨: computeRecomputedScore + before 스냅샷.
  // 1차 = full select (matchHeader) / 2차 = before 스냅샷 (지정 시 사용).
  if (opts.beforeSnapshot !== undefined) {
    findUnique
      .mockResolvedValueOnce(opts.matchHeader ?? null)
      .mockResolvedValueOnce(opts.beforeSnapshot);
  } else {
    findUnique.mockResolvedValue(opts.matchHeader ?? null);
  }

  return {
    tournamentMatch: {
      findUnique,
      update: vi.fn().mockImplementation(opts.updateImpl ?? (async () => ({}))),
    },
    matchPlayerStat: {
      findMany: vi.fn().mockResolvedValue(opts.playerStats ?? []),
    },
    play_by_plays: {
      findMany: vi.fn().mockResolvedValue(opts.pbpRows ?? []),
    },
  };
}

beforeEach(() => {
  // recordMatchAudit mock 초기화 (각 케이스 독립 검증).
  (recordMatchAudit as ReturnType<typeof vi.fn>).mockClear();
});

describe("computeRecomputedScore", () => {
  it("1) 매치 없음 → null 반환", async () => {
    const tx = buildMockTx({ matchHeader: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await computeRecomputedScore(tx as any, BigInt(999));
    expect(result).toBeNull();
  });

  it("2) homeScore > 0 이미 박제 → source='skip' / 모든 changed=false (멱등성)", async () => {
    const tx = buildMockTx({
      matchHeader: {
        id: BigInt(132),
        homeScore: 39, // 이미 박제됨
        awayScore: 26,
        quarterScores: { home: {}, away: {} },
        winner_team_id: BigInt(245),
        homeTeamId: BigInt(245),
        awayTeamId: BigInt(999),
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await computeRecomputedScore(tx as any, BigInt(132));
    expect(result).not.toBeNull();
    expect(result!.source).toBe("skip");
    expect(result!.changed.homeScore).toBe(false);
    expect(result!.changed.awayScore).toBe(false);
    expect(result!.changed.quarterScores).toBe(false);
    expect(result!.changed.winnerTeamId).toBe(false);
    // 기존 값 그대로 반환
    expect(result!.homeScore).toBe(39);
    expect(result!.awayScore).toBe(26);
  });

  it("3) playerStats 정상 박제 (#98 패턴) → source='playerStats' / 팀별 합 사용", async () => {
    // home=245 / away=999. playerStats home 합 = 30 (15+15) / away 합 = 20.
    const tx = buildMockTx({
      matchHeader: {
        id: BigInt(98),
        homeScore: 0, // sync 누락 → 보정 진입
        awayScore: 0,
        quarterScores: null,
        winner_team_id: null,
        homeTeamId: BigInt(245),
        awayTeamId: BigInt(999),
      },
      playerStats: [
        { points: 15, tournamentTeamPlayer: { tournamentTeamId: BigInt(245) } },
        { points: 15, tournamentTeamPlayer: { tournamentTeamId: BigInt(245) } },
        { points: 20, tournamentTeamPlayer: { tournamentTeamId: BigInt(999) } },
      ],
      pbpRows: [], // PBP 없음 — playerStats 가 source
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await computeRecomputedScore(tx as any, BigInt(98));
    expect(result!.source).toBe("playerStats");
    expect(result!.homeScore).toBe(30);
    expect(result!.awayScore).toBe(20);
    expect(result!.changed.homeScore).toBe(true);
    expect(result!.changed.awayScore).toBe(true);
    // PBP=0 이라 quarterScores 보정 ❌
    expect(result!.quarterScores).toBeNull();
    expect(result!.changed.quarterScores).toBe(false);
    // winner = home (30>20)
    expect(result!.winnerTeamId?.toString()).toBe("245");
    expect(result!.changed.winnerTeamId).toBe(true);
  });

  it("4) playerStats=0 + PBP 정상 (#132 패턴) → source='pbp' / PBP 합 39:26", async () => {
    // 매치 #132 실측 — playerStats 26행 모두 pts=0, PBP 만 박제.
    // Q1: home 15:10 / Q2: 6:6 / Q3: 5:2 / Q4: 13:8 → total 39:26
    const homeTeamId = BigInt(245);
    const awayTeamId = BigInt(999);
    type FakePbp = {
      quarter: number | null;
      action_type: string | null;
      is_made: boolean | null;
      points_scored: number | null;
      tournament_team_id: bigint | number | null;
    };
    const pbpRows: FakePbp[] = [];
    const push = (team: bigint, q: number, total: number) => {
      let remaining = total;
      while (remaining > 0) {
        const pts = remaining >= 2 ? 2 : 1;
        pbpRows.push({
          quarter: q,
          action_type: "made_shot",
          is_made: true,
          points_scored: pts,
          tournament_team_id: team,
        });
        remaining -= pts;
      }
    };
    push(homeTeamId, 1, 15);
    push(awayTeamId, 1, 10);
    push(homeTeamId, 2, 6);
    push(awayTeamId, 2, 6);
    push(homeTeamId, 3, 5);
    push(awayTeamId, 3, 2);
    push(homeTeamId, 4, 13);
    push(awayTeamId, 4, 8);

    const tx = buildMockTx({
      matchHeader: {
        id: BigInt(132),
        homeScore: 0,
        awayScore: 0,
        quarterScores: null,
        winner_team_id: BigInt(245), // 이미 winner 부여됨 (Phase A apply 와 일관)
        homeTeamId,
        awayTeamId,
      },
      playerStats: [
        // 잔존 26행 — 모두 pts=0
        { points: 0, tournamentTeamPlayer: { tournamentTeamId: homeTeamId } },
        { points: 0, tournamentTeamPlayer: { tournamentTeamId: awayTeamId } },
      ],
      pbpRows,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await computeRecomputedScore(tx as any, BigInt(132));
    expect(result!.source).toBe("pbp");
    expect(result!.homeScore).toBe(39);
    expect(result!.awayScore).toBe(26);
    // quarterScores PBP 기반 박제
    expect(result!.quarterScores).not.toBeNull();
    expect(result!.quarterScores!.home).toEqual({ q1: 15, q2: 6, q3: 5, q4: 13, ot: [] });
    expect(result!.quarterScores!.away).toEqual({ q1: 10, q2: 6, q3: 2, q4: 8, ot: [] });
    expect(result!.changed.homeScore).toBe(true);
    expect(result!.changed.awayScore).toBe(true);
    expect(result!.changed.quarterScores).toBe(true);
    // winner 245 = 기존과 동일 → 변경 X
    expect(result!.winnerTeamId?.toString()).toBe("245");
    expect(result!.changed.winnerTeamId).toBe(false);
  });

  it("5) PBP=0 + playerStats=0 → source='pbp' / homeScore=0,awayScore=0 / quarterScores=null / changed 모두 false", async () => {
    const tx = buildMockTx({
      matchHeader: {
        id: BigInt(500),
        homeScore: 0,
        awayScore: 0,
        quarterScores: null,
        winner_team_id: null,
        homeTeamId: BigInt(1),
        awayTeamId: BigInt(2),
      },
      playerStats: [],
      pbpRows: [],
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await computeRecomputedScore(tx as any, BigInt(500));
    // source 는 결정되지만 (pbp fallback) 모든 값 0 → changed 모두 false → UPDATE 진입 ❌
    expect(result!.source).toBe("pbp");
    expect(result!.homeScore).toBe(0);
    expect(result!.awayScore).toBe(0);
    expect(result!.quarterScores).toBeNull();
    expect(result!.changed.homeScore).toBe(false);
    expect(result!.changed.awayScore).toBe(false);
    expect(result!.changed.quarterScores).toBe(false);
    // winner 동점=null → 기존 null 과 같음 → 변경 X
    expect(result!.winnerTeamId).toBeNull();
    expect(result!.changed.winnerTeamId).toBe(false);
  });

  it("6) quarterScores 재계산 — OT 포함 (Q5 OT1, Q6 OT2)", async () => {
    // PBP — Q1 + Q5 OT1 + Q6 OT2 시나리오
    const pbpRows = [
      { quarter: 1, action_type: "made_shot", is_made: true, points_scored: 10, tournament_team_id: BigInt(1) },
      { quarter: 1, action_type: "made_shot", is_made: true, points_scored: 8, tournament_team_id: BigInt(2) },
      { quarter: 5, action_type: "made_shot", is_made: true, points_scored: 5, tournament_team_id: BigInt(1) },
      { quarter: 5, action_type: "made_shot", is_made: true, points_scored: 3, tournament_team_id: BigInt(2) },
      { quarter: 6, action_type: "made_shot", is_made: true, points_scored: 4, tournament_team_id: BigInt(1) },
      { quarter: 6, action_type: "made_shot", is_made: true, points_scored: 2, tournament_team_id: BigInt(2) },
    ];
    const tx = buildMockTx({
      matchHeader: {
        id: BigInt(700),
        homeScore: 0,
        awayScore: 0,
        quarterScores: null,
        winner_team_id: null,
        homeTeamId: BigInt(1),
        awayTeamId: BigInt(2),
      },
      playerStats: [],
      pbpRows,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await computeRecomputedScore(tx as any, BigInt(700));
    expect(result!.source).toBe("pbp");
    expect(result!.quarterScores).not.toBeNull();
    expect(result!.quarterScores!.home).toEqual({ q1: 10, q2: 0, q3: 0, q4: 0, ot: [5, 4] });
    expect(result!.quarterScores!.away).toEqual({ q1: 8, q2: 0, q3: 0, q4: 0, ot: [3, 2] });
    // total = home 19, away 13
    expect(result!.homeScore).toBe(19);
    expect(result!.awayScore).toBe(13);
  });

  it("7) winner_team_id 재계산 — 동점(null) + 기존 winner 다를 때 갱신", async () => {
    // 케이스 A: 동점 → winnerTeamId = null
    const txA = buildMockTx({
      matchHeader: {
        id: BigInt(800),
        homeScore: 0,
        awayScore: 0,
        quarterScores: null,
        winner_team_id: BigInt(1), // 기존엔 home 으로 잘못 부여됨
        homeTeamId: BigInt(1),
        awayTeamId: BigInt(2),
      },
      playerStats: [
        { points: 10, tournamentTeamPlayer: { tournamentTeamId: BigInt(1) } },
        { points: 10, tournamentTeamPlayer: { tournamentTeamId: BigInt(2) } },
      ],
      pbpRows: [],
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultA = await computeRecomputedScore(txA as any, BigInt(800));
    expect(resultA!.winnerTeamId).toBeNull(); // 동점
    expect(resultA!.changed.winnerTeamId).toBe(true); // 기존 1 → null 변경

    // 케이스 B: away 가 winner — 기존 winner 와 다르면 변경.
    const txB = buildMockTx({
      matchHeader: {
        id: BigInt(801),
        homeScore: 0,
        awayScore: 0,
        quarterScores: null,
        winner_team_id: BigInt(1), // 잘못 부여됨
        homeTeamId: BigInt(1),
        awayTeamId: BigInt(2),
      },
      playerStats: [
        { points: 10, tournamentTeamPlayer: { tournamentTeamId: BigInt(1) } },
        { points: 30, tournamentTeamPlayer: { tournamentTeamId: BigInt(2) } },
      ],
      pbpRows: [],
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultB = await computeRecomputedScore(txB as any, BigInt(801));
    expect(resultB!.winnerTeamId?.toString()).toBe("2"); // away
    expect(resultB!.changed.winnerTeamId).toBe(true);
  });

  it("8) applyScoreSafetyNet — UPDATE 호출 + audit 박제 검증 (mock prisma)", async () => {
    // #132 PBP 시나리오 재사용 (단순화) — home=39 / away=26 / winner 변경 없음.
    const homeTeamId = BigInt(245);
    const awayTeamId = BigInt(999);
    const pbpRows = [
      { quarter: 1, action_type: "made_shot", is_made: true, points_scored: 39, tournament_team_id: homeTeamId },
      { quarter: 1, action_type: "made_shot", is_made: true, points_scored: 26, tournament_team_id: awayTeamId },
    ];
    const updateCalls: Array<{ where: unknown; data: unknown }> = [];
    const tx = buildMockTx({
      matchHeader: {
        id: BigInt(132),
        homeScore: 0,
        awayScore: 0,
        quarterScores: null,
        winner_team_id: BigInt(245),
        homeTeamId,
        awayTeamId,
      },
      playerStats: [],
      pbpRows,
      beforeSnapshot: {
        homeScore: 0,
        awayScore: 0,
        winner_team_id: BigInt(245),
      },
      updateImpl: async (args: unknown) => {
        updateCalls.push(args as { where: unknown; data: unknown });
        return {};
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await applyScoreSafetyNet(tx as any, BigInt(132), "test-context");
    expect(result).not.toBeNull();
    expect(result!.source).toBe("pbp");
    expect(result!.homeScore).toBe(39);
    expect(result!.awayScore).toBe(26);

    // UPDATE 1회 호출됨 — homeScore + awayScore + quarterScores 박제 (winner 변경 X).
    expect(updateCalls.length).toBe(1);
    const updateData = (updateCalls[0].data as Record<string, unknown>);
    expect(updateData.homeScore).toBe(39);
    expect(updateData.awayScore).toBe(26);
    expect(updateData.quarterScores).toBeDefined();
    expect(updateData.winner_team_id).toBeUndefined(); // 변경 X

    // recordMatchAudit 1회 호출됨 — source="system" + context="test-context".
    expect(recordMatchAudit).toHaveBeenCalledTimes(1);
    const auditArgs = (recordMatchAudit as ReturnType<typeof vi.fn>).mock.calls[0];
    // 인자: (tx, matchId, before, after, source, context, changedBy)
    expect(auditArgs[1]).toBe(BigInt(132));
    expect(auditArgs[2]).toEqual({ homeScore: 0, awayScore: 0 }); // before (winner 변경 X 라 제외)
    expect(auditArgs[3]).toEqual({ homeScore: 39, awayScore: 26 }); // after
    expect(auditArgs[4]).toBe("system");
    expect(auditArgs[5]).toBe("test-context");
    expect(auditArgs[6]).toBeNull(); // changedBy
  });
});
