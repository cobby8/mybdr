/**
 * 2026-05-12 — 대회-시리즈 연결 API (PR1) 회귀 가드.
 *
 * 검증 매트릭스 (planner-architect §3 API spec / §4 권한 정책 / §6 위험 / Q2 결재):
 *   1) 자기 대회 + 자기 시리즈 연결 → 200 + DB UPDATE (series_id=8 / 카운터 +1)
 *   2) 자기 대회 + 타인 시리즈 연결 → 403 (requireSeriesOwner SeriesPermissionError)
 *   3) 자기 대회 + 존재하지 않는 시리즈 → 404
 *   4) 자기 대회 + null 분리 → 200 + series_id=NULL (이전 시리즈 카운터 -1)
 *   5) in_progress 대회 + 다른 시리즈 이동 → 400 (status 가드 — Q2)
 *   6) in_progress 대회 + null 분리 → 200 (분리는 모든 status 허용 — Q2)
 *   7) 카운터 동기화 — 이전 시리즈 -1 / 새 시리즈 +1 양면 호출 검증
 *   8) super_admin 우회 — 타인 시리즈여도 200 (allowSuperAdmin=true)
 *
 * mock 전략: vi.doMock 으로 (auth / prisma / response) 격리.
 *   - requireTournamentAdmin 은 통과(userId/session 반환) 또는 error 분기 케이스만 다룸.
 *     본 PR 검증 focus = series_id 처리 로직 (requireTournamentAdmin 자체는 별도 회귀 가드).
 *   - prisma.$transaction 은 콜백을 받아 tx 객체로 실행. mock 은 콜백을 즉시 호출하며 tx
 *     에 (tournament_series.update / tournament.update) spy 부착.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const TOURNAMENT_ID = "t-uuid-abc";
const ORGANIZER_ID = BigInt(100);
const OTHER_USER_ID = BigInt(200);
const SUPER_ADMIN_ID = BigInt(999);
const MY_SERIES_ID = BigInt(8);
const OTHER_SERIES_ID = BigInt(9);

// requireTournamentAdmin 통과 시 반환할 auth 객체 (일반 운영자).
const AUTH_OK_ORGANIZER = {
  userId: ORGANIZER_ID,
  session: { sub: String(ORGANIZER_ID), role: "user" },
};

const AUTH_OK_SUPER_ADMIN = {
  userId: SUPER_ADMIN_ID,
  session: { sub: String(SUPER_ADMIN_ID), role: "super_admin" },
};

// mock spy 캡처용 — case 별 검증.
type MockCaptures = {
  seriesUpdateCalls: Array<{ where: { id: bigint }; data: unknown }>;
  tournamentUpdateCalls: Array<{ where: { id: string }; data: Record<string, unknown> }>;
  transactionCalled: number;
};

function setupMocks(opts: {
  auth: typeof AUTH_OK_ORGANIZER | typeof AUTH_OK_SUPER_ADMIN | { error: unknown };
  currentTournament: {
    status: string | null;
    series_id: bigint | null;
  } | null;
  /** requireSeriesOwner 가 SELECT 할 시리즈 row (null = 404, organizer_id 로 권한 판정) */
  targetSeries:
    | { id: bigint; organizer_id: bigint; name: string; tournaments_count: number | null }
    | null;
}): { captures: MockCaptures } {
  const captures: MockCaptures = {
    seriesUpdateCalls: [],
    tournamentUpdateCalls: [],
    transactionCalled: 0,
  };

  vi.doMock("@/lib/auth/tournament-auth", () => ({
    requireTournamentAdmin: vi.fn().mockResolvedValue(opts.auth),
  }));

  // tx 객체 — $transaction 콜백에 전달됨. 일반 prisma 호출과 동일 인터페이스.
  const tx = {
    tournament: {
      update: vi.fn().mockImplementation((args: { where: { id: string }; data: Record<string, unknown> }) => {
        captures.tournamentUpdateCalls.push(args);
        // UPDATE 결과 — series_id 반영된 row 반환 흉내.
        return Promise.resolve({
          id: args.where.id,
          ...args.data,
        });
      }),
    },
    tournament_series: {
      update: vi.fn().mockImplementation((args: { where: { id: bigint }; data: unknown }) => {
        captures.seriesUpdateCalls.push(args);
        return Promise.resolve({ id: args.where.id });
      }),
    },
  };

  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      // route 가 status/series_id 사전 조회용으로 사용.
      tournament: {
        findUnique: vi.fn().mockResolvedValue(opts.currentTournament),
        // settings 머지용 (본 PR 케이스에선 data.settings 미사용 — 호출 안 됨)
      },
      tournament_series: {
        findUnique: vi.fn().mockResolvedValue(opts.targetSeries),
      },
      tournamentMatch: {
        count: vi.fn().mockResolvedValue(0),
      },
      // $transaction(cb) 콜백 받아 tx 로 실행.
      $transaction: vi.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        captures.transactionCalled++;
        return cb(tx);
      }),
    },
  }));

  // services/tournament 은 series_id 미변경 케이스 path 에서만 호출 — series_id 케이스에선
  // route 가 $transaction 안에서 직접 tx.tournament.update 사용하므로 사실상 미호출.
  // 안전하게 mock 만 박아둠.
  vi.doMock("@/lib/services/tournament", () => ({
    getTournament: vi.fn().mockResolvedValue({ id: TOURNAMENT_ID }),
    updateTournament: vi.fn().mockResolvedValue({ id: TOURNAMENT_ID }),
  }));

  return { captures };
}

/**
 * PATCH 요청 헬퍼 — body 와 함께 route handler 호출.
 * NextRequest 는 fetch Request 호환 → 가짜 객체 반환.
 */
function makeRequest(body: Record<string, unknown>) {
  return {
    json: async () => body,
  } as unknown as Parameters<
    typeof import("@/app/api/web/tournaments/[id]/route").PATCH
  >[0];
}

const makeCtx = () => ({ params: Promise.resolve({ id: TOURNAMENT_ID }) });

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("PATCH /api/web/tournaments/[id] — series_id 처리 (PR1)", () => {
  it("1) 자기 대회 + 자기 시리즈 연결 → 200 + 카운터 +1 + UPDATE 반영", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_ORGANIZER,
      currentTournament: { status: "draft", series_id: null },
      targetSeries: {
        id: MY_SERIES_ID,
        organizer_id: ORGANIZER_ID,
        name: "내 시리즈",
        tournaments_count: 0,
      },
    });

    const { PATCH } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await PATCH(makeRequest({ series_id: String(MY_SERIES_ID) }), makeCtx());

    expect(res.status).toBe(200);
    expect(captures.transactionCalled).toBe(1);
    // 새 시리즈 +1 만 호출 (이전 series_id=null)
    expect(captures.seriesUpdateCalls).toHaveLength(1);
    expect(captures.seriesUpdateCalls[0].where.id).toBe(MY_SERIES_ID);
    expect(captures.seriesUpdateCalls[0].data).toEqual({
      tournaments_count: { increment: 1 },
    });
    // tournament.update 호출 — series_id 박제
    expect(captures.tournamentUpdateCalls).toHaveLength(1);
    expect(captures.tournamentUpdateCalls[0].data.series_id).toBe(MY_SERIES_ID);
  });

  it("2) 자기 대회 + 타인 시리즈 연결 → 403", async () => {
    setupMocks({
      auth: AUTH_OK_ORGANIZER,
      currentTournament: { status: "draft", series_id: null },
      // organizer_id 가 다른 유저 → requireSeriesOwner 에서 403 throw
      targetSeries: {
        id: OTHER_SERIES_ID,
        organizer_id: OTHER_USER_ID,
        name: "타인 시리즈",
        tournaments_count: 5,
      },
    });

    const { PATCH } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await PATCH(makeRequest({ series_id: String(OTHER_SERIES_ID) }), makeCtx());

    expect(res.status).toBe(403);
  });

  it("3) 자기 대회 + 존재하지 않는 시리즈 → 404", async () => {
    setupMocks({
      auth: AUTH_OK_ORGANIZER,
      currentTournament: { status: "draft", series_id: null },
      targetSeries: null, // SELECT 결과 0건
    });

    const { PATCH } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await PATCH(makeRequest({ series_id: "99999" }), makeCtx());

    expect(res.status).toBe(404);
  });

  it("4) 자기 대회 + null 분리 (draft) → 200 + 이전 시리즈 -1", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_ORGANIZER,
      // 이미 series=8 에 묶여있는 상태에서 분리.
      currentTournament: { status: "draft", series_id: MY_SERIES_ID },
      targetSeries: null, // null 분리는 권한 검증 자체를 skip 하므로 미사용.
    });

    const { PATCH } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await PATCH(makeRequest({ series_id: null }), makeCtx());

    expect(res.status).toBe(200);
    // 이전 시리즈 -1 만 호출 (새 series_id=null → +1 skip)
    expect(captures.seriesUpdateCalls).toHaveLength(1);
    expect(captures.seriesUpdateCalls[0].where.id).toBe(MY_SERIES_ID);
    expect(captures.seriesUpdateCalls[0].data).toEqual({
      tournaments_count: { decrement: 1 },
    });
    // tournament.update — series_id=null 반영
    expect(captures.tournamentUpdateCalls[0].data.series_id).toBeNull();
  });

  it("5) in_progress 대회 + 다른 시리즈 이동 → 400 (status 가드)", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_ORGANIZER,
      currentTournament: { status: "in_progress", series_id: null },
      targetSeries: {
        id: MY_SERIES_ID,
        organizer_id: ORGANIZER_ID,
        name: "내 시리즈",
        tournaments_count: 0,
      },
    });

    const { PATCH } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await PATCH(makeRequest({ series_id: String(MY_SERIES_ID) }), makeCtx());

    expect(res.status).toBe(400);
    // transaction 진입 X — 카운터/UPDATE 모두 0
    expect(captures.transactionCalled).toBe(0);
    expect(captures.seriesUpdateCalls).toHaveLength(0);
    expect(captures.tournamentUpdateCalls).toHaveLength(0);
  });

  it("6) in_progress 대회 + null 분리 → 200 (분리는 모든 status 허용)", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_ORGANIZER,
      currentTournament: { status: "in_progress", series_id: MY_SERIES_ID },
      targetSeries: null,
    });

    const { PATCH } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await PATCH(makeRequest({ series_id: null }), makeCtx());

    expect(res.status).toBe(200);
    expect(captures.transactionCalled).toBe(1);
    // 이전 시리즈 -1 만
    expect(captures.seriesUpdateCalls).toHaveLength(1);
    expect(captures.seriesUpdateCalls[0].data).toEqual({
      tournaments_count: { decrement: 1 },
    });
  });

  it("7) 시리즈 변경 (이전→새) → 카운터 양면 동기화 (-1 / +1)", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_ORGANIZER,
      // 이전 series=9 (운영자 본인은 새 시리즈 8 로 옮기는 케이스 — 이전 시리즈 권한 검증은 안 함:
      // 본 PR 정책 = 새 시리즈만 권한 검증, 이전 시리즈는 카운터만 감소. 추후 정책 확장 시 검토.)
      currentTournament: { status: "draft", series_id: OTHER_SERIES_ID },
      targetSeries: {
        id: MY_SERIES_ID,
        organizer_id: ORGANIZER_ID,
        name: "내 시리즈",
        tournaments_count: 0,
      },
    });

    const { PATCH } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await PATCH(makeRequest({ series_id: String(MY_SERIES_ID) }), makeCtx());

    expect(res.status).toBe(200);
    expect(captures.seriesUpdateCalls).toHaveLength(2);
    // 이전 시리즈 -1
    const decCall = captures.seriesUpdateCalls.find(
      (c) => c.where.id === OTHER_SERIES_ID,
    );
    expect(decCall?.data).toEqual({ tournaments_count: { decrement: 1 } });
    // 새 시리즈 +1
    const incCall = captures.seriesUpdateCalls.find(
      (c) => c.where.id === MY_SERIES_ID,
    );
    expect(incCall?.data).toEqual({ tournaments_count: { increment: 1 } });
  });

  it("8) super_admin 우회 — 타인 시리즈여도 200", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_SUPER_ADMIN,
      currentTournament: { status: "draft", series_id: null },
      // organizer_id 가 타인 — 일반 유저면 403. super_admin 은 allowSuperAdmin=true 로 통과.
      targetSeries: {
        id: OTHER_SERIES_ID,
        organizer_id: OTHER_USER_ID,
        name: "타인 시리즈",
        tournaments_count: 5,
      },
    });

    const { PATCH } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await PATCH(makeRequest({ series_id: String(OTHER_SERIES_ID) }), makeCtx());

    expect(res.status).toBe(200);
    // 새 시리즈 +1 호출
    expect(captures.seriesUpdateCalls).toHaveLength(1);
    expect(captures.seriesUpdateCalls[0].where.id).toBe(OTHER_SERIES_ID);
    expect(captures.seriesUpdateCalls[0].data).toEqual({
      tournaments_count: { increment: 1 },
    });
  });
});

describe("requireSeriesOwner — 헬퍼 단위", () => {
  it("시리즈 없음 → SeriesPermissionError(404)", async () => {
    vi.doMock("@/lib/db/prisma", () => ({
      prisma: {
        tournament_series: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      },
    }));
    const { requireSeriesOwner, SeriesPermissionError } = await import(
      "@/lib/auth/series-permission"
    );
    await expect(
      requireSeriesOwner(BigInt(999), ORGANIZER_ID),
    ).rejects.toThrow(SeriesPermissionError);
    try {
      await requireSeriesOwner(BigInt(999), ORGANIZER_ID);
    } catch (e) {
      expect((e as InstanceType<typeof SeriesPermissionError>).status).toBe(404);
    }
  });

  it("organizer 불일치 → SeriesPermissionError(403)", async () => {
    vi.doMock("@/lib/db/prisma", () => ({
      prisma: {
        tournament_series: {
          findUnique: vi.fn().mockResolvedValue({
            id: OTHER_SERIES_ID,
            organizer_id: OTHER_USER_ID,
            name: "타인",
          }),
        },
      },
    }));
    const { requireSeriesOwner, SeriesPermissionError } = await import(
      "@/lib/auth/series-permission"
    );
    try {
      await requireSeriesOwner(OTHER_SERIES_ID, ORGANIZER_ID);
      // 위에서 throw 안 되면 실패
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(SeriesPermissionError);
      expect((e as InstanceType<typeof SeriesPermissionError>).status).toBe(403);
    }
  });

  it("super_admin 우회 — organizer 불일치여도 통과", async () => {
    vi.doMock("@/lib/db/prisma", () => ({
      prisma: {
        tournament_series: {
          findUnique: vi.fn().mockResolvedValue({
            id: OTHER_SERIES_ID,
            organizer_id: OTHER_USER_ID,
            name: "타인",
          }),
        },
      },
    }));
    const { requireSeriesOwner } = await import("@/lib/auth/series-permission");
    const series = await requireSeriesOwner(OTHER_SERIES_ID, ORGANIZER_ID, {
      allowSuperAdmin: true,
      session: { role: "super_admin" },
    });
    expect(series.id).toBe(OTHER_SERIES_ID);
  });
});
