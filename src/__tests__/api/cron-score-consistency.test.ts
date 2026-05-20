/**
 * 2026-05-21 PR-4 F2 — /api/cron/score-consistency 회귀 가드.
 *
 * 검증 매트릭스 (4 케이스):
 *   A1) 정합 매치만 1건 → audit INSERT 0
 *   A2) MPS != header 매치 1건 → audit INSERT 1 (mismatch_type=MPS_HEADER_DIFF)
 *   A3) QS=0/0 + 헤더 박제 매치 1건 → audit INSERT 1 (mismatch_type=QS_ZERO)
 *   A4) CRON_SECRET 누락 → 401 응답 / audit INSERT 0
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const VALID_SECRET = "test-cron-secret";

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.CRON_SECRET = VALID_SECRET;
});

// 합성 매치 데이터 — completed 매치 + 4 source 합산 결과를 mock prisma 가 반환
type FakeMatch = {
  id: bigint;
  tournamentId: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
  quarterScores: unknown;
  settings: unknown;
  // mock 용 추가: $queryRaw 결과 시나리오 (mps + pbp 팀별 합산)
  _mpsRaw?: Array<{ team_id: bigint; pts: bigint; cnt: bigint }>;
  _pbpRaw?: Array<{ team_id: bigint; pts: bigint; cnt: bigint }>;
};

/**
 * mock prisma 설정 — tournamentMatch.findMany + $queryRaw (mps + pbp) + score_consistency_audit.createMany
 *
 * $queryRaw 호출은 매치 1건당 2번 (mps + pbp) 순서 보장 → matchId 별 시나리오 큐 사용
 */
function setupMocks(matches: FakeMatch[]) {
  const createManyMock = vi.fn().mockResolvedValue({ count: 0 });

  // $queryRaw 호출 큐 — 매치 순서대로 mps→pbp→mps→pbp...
  const rawQueue: Array<Array<{ team_id: bigint; pts: bigint; cnt: bigint }>> = [];
  for (const m of matches) {
    rawQueue.push(m._mpsRaw ?? []);
    rawQueue.push(m._pbpRaw ?? []);
  }

  const queryRawMock = vi.fn().mockImplementation(() => {
    const next = rawQueue.shift();
    return Promise.resolve(next ?? []);
  });

  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      tournamentMatch: {
        findMany: vi.fn().mockResolvedValue(
          matches.map((m) => ({
            id: m.id,
            tournamentId: m.tournamentId,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            homeTeamId: m.homeTeamId,
            awayTeamId: m.awayTeamId,
            quarterScores: m.quarterScores,
            settings: m.settings,
          })),
        ),
      },
      score_consistency_audit: {
        createMany: createManyMock,
      },
      $queryRaw: queryRawMock,
    },
  }));

  return { createManyMock, queryRawMock };
}

function makeRequest(authHeader?: string) {
  const headers = new Headers();
  if (authHeader !== undefined) {
    headers.set("authorization", authHeader);
  }
  return new Request("https://test.local/api/cron/score-consistency", {
    method: "GET",
    headers,
  });
}

describe("GET /api/cron/score-consistency — PR-4 F2 daily audit", () => {
  it("A1) 정합 매치만 1건 → audit INSERT 0", async () => {
    // 정합 매치: 헤더 14/16 = QS 14/16 = MPS 14/16 = PBP 14/16
    const { createManyMock } = setupMocks([
      {
        id: BigInt(100),
        tournamentId: "t-1",
        homeScore: 14,
        awayScore: 16,
        homeTeamId: BigInt(1),
        awayTeamId: BigInt(2),
        quarterScores: {
          home: { q1: 4, q2: 4, q3: 3, q4: 3, ot: [] },
          away: { q1: 4, q2: 4, q3: 4, q4: 4, ot: [] },
        },
        settings: { recording_mode: "flutter" },
        _mpsRaw: [
          { team_id: BigInt(1), pts: BigInt(14), cnt: BigInt(5) },
          { team_id: BigInt(2), pts: BigInt(16), cnt: BigInt(5) },
        ],
        _pbpRaw: [
          { team_id: BigInt(1), pts: BigInt(14), cnt: BigInt(8) },
          { team_id: BigInt(2), pts: BigInt(16), cnt: BigInt(9) },
        ],
      },
    ]);

    const { GET } = await import("@/app/api/cron/score-consistency/route");
    const res = await GET(makeRequest(`Bearer ${VALID_SECRET}`) as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.audited).toBe(1);
    expect(body.mismatches).toBe(0);
    // 정합 매치는 INSERT 호출 0 (createMany 자체 미호출)
    expect(createManyMock).not.toHaveBeenCalled();
  });

  it("A2) MPS != header 매치 1건 → audit INSERT 1 (MPS_HEADER_DIFF)", async () => {
    // C 분류 (강남구 159 패턴): 헤더 7/9 + QS 7/9 + PBP 7/9 + MPS 9/9 (사일런트 +2)
    const { createManyMock } = setupMocks([
      {
        id: BigInt(159),
        tournamentId: "t-gangnam",
        homeScore: 7,
        awayScore: 9,
        homeTeamId: BigInt(10),
        awayTeamId: BigInt(11),
        quarterScores: {
          home: { q1: 7, q2: 0, q3: 0, q4: 0, ot: [] },
          away: { q1: 9, q2: 0, q3: 0, q4: 0, ot: [] },
        },
        settings: { recording_mode: "paper" },
        _mpsRaw: [
          // MPS home 9 (헤더 7 보다 +2 / 사일런트)
          { team_id: BigInt(10), pts: BigInt(9), cnt: BigInt(5) },
          { team_id: BigInt(11), pts: BigInt(9), cnt: BigInt(5) },
        ],
        _pbpRaw: [
          { team_id: BigInt(10), pts: BigInt(7), cnt: BigInt(4) },
          { team_id: BigInt(11), pts: BigInt(9), cnt: BigInt(5) },
        ],
      },
    ]);

    const { GET } = await import("@/app/api/cron/score-consistency/route");
    const res = await GET(makeRequest(`Bearer ${VALID_SECRET}`) as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audited).toBe(1);
    expect(body.mismatches).toBe(1);
    // by_type = 배열 [{ type, count }] 형식 (apiSuccess snake_case 자동 변환 회피)
    expect(body.by_type).toEqual([{ type: "MPS_HEADER_DIFF", count: 1 }]);

    // createMany 1회 호출 + 데이터 검증
    expect(createManyMock).toHaveBeenCalledTimes(1);
    const insertedArg = createManyMock.mock.calls[0][0];
    expect(insertedArg.data).toHaveLength(1);
    expect(insertedArg.data[0].matchId).toBe(BigInt(159));
    expect(insertedArg.data[0].mismatchType).toBe("MPS_HEADER_DIFF");
    expect(insertedArg.data[0].details.headerHome).toBe(7);
    expect(insertedArg.data[0].details.mpsHome).toBe(9);
    expect(insertedArg.data[0].details.recordingMode).toBe("paper");
  });

  it("A3) QS=0/0 + 헤더 박제 매치 1건 → audit INSERT 1 (QS_ZERO)", async () => {
    // E 분류 (강남구 일부 매치 패턴): 헤더 21/15 + QS 0/0 + MPS=헤더 + PBP=헤더
    const { createManyMock } = setupMocks([
      {
        id: BigInt(170),
        tournamentId: "t-gangnam",
        homeScore: 21,
        awayScore: 15,
        homeTeamId: BigInt(20),
        awayTeamId: BigInt(21),
        quarterScores: {
          home: { q1: 0, q2: 0, q3: 0, q4: 0, ot: [] },
          away: { q1: 0, q2: 0, q3: 0, q4: 0, ot: [] },
        },
        settings: { recording_mode: "paper" },
        _mpsRaw: [
          { team_id: BigInt(20), pts: BigInt(21), cnt: BigInt(6) },
          { team_id: BigInt(21), pts: BigInt(15), cnt: BigInt(6) },
        ],
        _pbpRaw: [
          { team_id: BigInt(20), pts: BigInt(21), cnt: BigInt(10) },
          { team_id: BigInt(21), pts: BigInt(15), cnt: BigInt(7) },
        ],
      },
    ]);

    const { GET } = await import("@/app/api/cron/score-consistency/route");
    const res = await GET(makeRequest(`Bearer ${VALID_SECRET}`) as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audited).toBe(1);
    expect(body.mismatches).toBe(1);
    expect(body.by_type).toEqual([{ type: "QS_ZERO", count: 1 }]);

    expect(createManyMock).toHaveBeenCalledTimes(1);
    const insertedArg = createManyMock.mock.calls[0][0];
    expect(insertedArg.data[0].matchId).toBe(BigInt(170));
    expect(insertedArg.data[0].mismatchType).toBe("QS_ZERO");
    expect(insertedArg.data[0].details.qsHome).toBe(0);
    expect(insertedArg.data[0].details.qsAway).toBe(0);
    expect(insertedArg.data[0].details.headerHome).toBe(21);
  });

  it("A4) CRON_SECRET 누락 → 401 응답 / audit INSERT 0", async () => {
    const { createManyMock } = setupMocks([
      {
        id: BigInt(200),
        tournamentId: "t-1",
        homeScore: 7,
        awayScore: 9,
        homeTeamId: BigInt(1),
        awayTeamId: BigInt(2),
        quarterScores: null,
        settings: null,
        _mpsRaw: [],
        _pbpRaw: [],
      },
    ]);

    const { GET } = await import("@/app/api/cron/score-consistency/route");
    // Bearer 누락 (잘못된 secret)
    const res = await GET(makeRequest("Bearer wrong-secret") as never);

    expect(res.status).toBe(401);
    // SELECT + INSERT 모두 호출 0 — 가드 진입 즉시 차단
    expect(createManyMock).not.toHaveBeenCalled();
  });
});
