/**
 * 2026-05-12 — POST /api/web/series/[id]/absorb-tournaments (PR3) 회귀 가드.
 *
 * 검증 매트릭스:
 *   1) 비로그인 → 401 (withWebAuth 차단)
 *   2) 자기 시리즈 + 자기 미연결 대회 1건 → 200 + absorbed=1, skipped=0, 카운터 +1
 *   3) 자기 시리즈 + (자기 대회 + 타인 대회) 혼합 → 200 + 자기 것만 absorbed, 타인은 skipped
 *   4) 타인 시리즈 → 403 (requireSeriesOwner)
 *   5) status in_progress 대회 포함 → in_progress 는 skipped, 나머지만 absorbed
 *   6) 카운터 양면 동기화 (이전 시리즈 -N / 새 시리즈 +absorbed.length)
 *   7) 빈 배열 / 51건 초과 / 비-uuid → 400 (zod)
 *
 * mock 전략:
 *   - tournament-series-link.test 패턴 답습 — withWebAuth 는 cookies/jwt mock 으로 통과.
 *   - prisma.tournament.findMany 결과로 후보 row 주입.
 *   - prisma.$transaction 콜백 즉시 실행 + tx.{tournament_series.update, tournament.updateMany} spy.
 *   - requireSeriesOwner 는 prisma.tournament_series.findUnique 결과로 분기 (organizer_id 일치 여부).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const SERIES_ID_STR = "8";
const SERIES_ID_BIG = BigInt(8);
const PREV_SERIES_ID_BIG = BigInt(9);
const ORGANIZER_ID = BigInt(100);
const OTHER_USER_ID = BigInt(200);

// 테스트용 대회 ID (UUID v4 형식 — zod v4 의 uuid() 는 RFC 4122 엄격: version nibble = 4, variant = 8/9/a/b).
// 13번째 문자가 version nibble (=4), 17번째 문자가 variant nibble (=8/9/a/b).
const T_OWN_DRAFT_1 = "11111111-1111-4111-8111-111111111111";
const T_OWN_DRAFT_2 = "22222222-2222-4222-8222-222222222222";
const T_OWN_INPROGRESS = "33333333-3333-4333-8333-333333333333";
const T_OTHER_OWNED = "44444444-4444-4444-8444-444444444444";
const T_OWN_PREV_SERIES = "55555555-5555-4555-8555-555555555555";

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

type Tournament = {
  id: string;
  organizerId: bigint;
  status: string;
  series_id: bigint | null;
};

type Captures = {
  seriesUpdateCalls: Array<{ where: { id: bigint }; data: unknown }>;
  tournamentUpdateManyCalls: Array<{ where: unknown; data: unknown }>;
  transactionCalled: number;
  findManyCalled: number;
};

function setupMocks(opts: {
  loggedIn: boolean;
  /** 시리즈 SELECT (requireSeriesOwner) — null 이면 404 */
  targetSeries:
    | { id: bigint; organizer_id: bigint; name: string; tournaments_count: number | null }
    | null;
  /** 후보 대회 일괄 SELECT 결과 — IN 절 통과한 row 들 */
  candidateTournaments: Tournament[];
}): { captures: Captures } {
  const captures: Captures = {
    seriesUpdateCalls: [],
    tournamentUpdateManyCalls: [],
    transactionCalled: 0,
    findManyCalled: 0,
  };

  // next/headers cookies — 로그인 여부 분기.
  vi.doMock("next/headers", () => ({
    cookies: vi.fn().mockResolvedValue({
      get: (_name: string) => (opts.loggedIn ? { value: "fake-token" } : undefined),
    }),
  }));

  // verifyToken — 로그인 시 organizer 세션 반환.
  vi.doMock("@/lib/auth/jwt", () => ({
    verifyToken: vi.fn().mockResolvedValue(
      opts.loggedIn ? { sub: String(ORGANIZER_ID), role: "user" } : null,
    ),
  }));

  // tx 객체 — $transaction 콜백 받음.
  const tx = {
    tournament_series: {
      update: vi.fn().mockImplementation((args: { where: { id: bigint }; data: unknown }) => {
        captures.seriesUpdateCalls.push(args);
        return Promise.resolve({ id: args.where.id });
      }),
    },
    tournament: {
      updateMany: vi.fn().mockImplementation((args: { where: unknown; data: unknown }) => {
        captures.tournamentUpdateManyCalls.push(args);
        return Promise.resolve({ count: 1 });
      }),
    },
  };

  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      tournament_series: {
        findUnique: vi.fn().mockResolvedValue(opts.targetSeries),
      },
      tournament: {
        findMany: vi.fn().mockImplementation(() => {
          captures.findManyCalled++;
          return Promise.resolve(opts.candidateTournaments);
        }),
      },
      $transaction: vi.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        captures.transactionCalled++;
        return cb(tx);
      }),
    },
  }));

  return { captures };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/web/series/8/absorb-tournaments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const makeCtx = () => ({ params: Promise.resolve({ id: SERIES_ID_STR }) });

describe("POST /api/web/series/[id]/absorb-tournaments — 다건 흡수 (PR3)", () => {
  it("1) 비로그인 → 401", async () => {
    setupMocks({
      loggedIn: false,
      targetSeries: null,
      candidateTournaments: [],
    });
    const { POST } = await import(
      "@/app/api/web/series/[id]/absorb-tournaments/route"
    );
    const res = await POST(makeRequest({ tournament_ids: [T_OWN_DRAFT_1] }), makeCtx());
    expect(res.status).toBe(401);
  });

  it("2) 자기 시리즈 + 자기 draft 대회 1건 → 200 + absorbed 1 / 카운터 +1", async () => {
    const { captures } = setupMocks({
      loggedIn: true,
      targetSeries: {
        id: SERIES_ID_BIG,
        organizer_id: ORGANIZER_ID,
        name: "내 시리즈",
        tournaments_count: 0,
      },
      candidateTournaments: [
        {
          id: T_OWN_DRAFT_1,
          organizerId: ORGANIZER_ID,
          status: "draft",
          series_id: null,
        },
      ],
    });
    const { POST } = await import(
      "@/app/api/web/series/[id]/absorb-tournaments/route"
    );
    const res = await POST(makeRequest({ tournament_ids: [T_OWN_DRAFT_1] }), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    // apiSuccess 가 한 번 더 래핑 — { absorbed, skipped } 가 data 키 안에 있을 수도, 그냥 root 일 수도.
    // 본 route 는 apiSuccess({ absorbed, skipped }) 호출 → { absorbed, skipped } root 직렬화 (apiSuccess 가 키만 변환, 래핑 X).
    const data = body.data ?? body;
    expect(data.absorbed).toEqual([T_OWN_DRAFT_1]);
    expect(data.skipped).toEqual([]);
    // 새 시리즈 +1 만 호출 (이전 series_id = null)
    expect(captures.seriesUpdateCalls).toHaveLength(1);
    expect(captures.seriesUpdateCalls[0].where.id).toBe(SERIES_ID_BIG);
    expect(captures.seriesUpdateCalls[0].data).toEqual({
      tournaments_count: { increment: 1 },
    });
    expect(captures.transactionCalled).toBe(1);
  });

  it("3) 혼합 (자기 + 타인 대회) → 자기 것만 absorbed, 타인은 skipped", async () => {
    const { captures } = setupMocks({
      loggedIn: true,
      targetSeries: {
        id: SERIES_ID_BIG,
        organizer_id: ORGANIZER_ID,
        name: "내 시리즈",
        tournaments_count: 0,
      },
      candidateTournaments: [
        {
          id: T_OWN_DRAFT_1,
          organizerId: ORGANIZER_ID,
          status: "draft",
          series_id: null,
        },
        {
          id: T_OTHER_OWNED,
          organizerId: OTHER_USER_ID, // 타인 소유
          status: "draft",
          series_id: null,
        },
      ],
    });
    const { POST } = await import(
      "@/app/api/web/series/[id]/absorb-tournaments/route"
    );
    const res = await POST(
      makeRequest({ tournament_ids: [T_OWN_DRAFT_1, T_OTHER_OWNED] }),
      makeCtx(),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const data = body.data ?? body;
    expect(data.absorbed).toEqual([T_OWN_DRAFT_1]);
    expect(data.skipped).toHaveLength(1);
    expect(data.skipped[0].id).toBe(T_OTHER_OWNED);
    expect(data.skipped[0].reason).toMatch(/본인 소유/);
    // 새 시리즈 +1 만 (absorbed 1건)
    expect(captures.seriesUpdateCalls).toHaveLength(1);
    expect(captures.seriesUpdateCalls[0].data).toEqual({
      tournaments_count: { increment: 1 },
    });
  });

  it("4) 타인 시리즈 (organizer_id 불일치) → 403", async () => {
    const { captures } = setupMocks({
      loggedIn: true,
      targetSeries: {
        id: SERIES_ID_BIG,
        organizer_id: OTHER_USER_ID, // 타인 소유 시리즈
        name: "타인 시리즈",
        tournaments_count: 0,
      },
      candidateTournaments: [],
    });
    const { POST } = await import(
      "@/app/api/web/series/[id]/absorb-tournaments/route"
    );
    const res = await POST(makeRequest({ tournament_ids: [T_OWN_DRAFT_1] }), makeCtx());
    expect(res.status).toBe(403);
    // findMany / transaction 모두 진입 X.
    expect(captures.findManyCalled).toBe(0);
    expect(captures.transactionCalled).toBe(0);
  });

  it("5) in_progress 대회 포함 → in_progress 는 skipped, draft 만 absorbed", async () => {
    const { captures } = setupMocks({
      loggedIn: true,
      targetSeries: {
        id: SERIES_ID_BIG,
        organizer_id: ORGANIZER_ID,
        name: "내 시리즈",
        tournaments_count: 0,
      },
      candidateTournaments: [
        {
          id: T_OWN_DRAFT_1,
          organizerId: ORGANIZER_ID,
          status: "draft",
          series_id: null,
        },
        {
          id: T_OWN_INPROGRESS,
          organizerId: ORGANIZER_ID,
          status: "in_progress", // status 가드 차단
          series_id: null,
        },
      ],
    });
    const { POST } = await import(
      "@/app/api/web/series/[id]/absorb-tournaments/route"
    );
    const res = await POST(
      makeRequest({ tournament_ids: [T_OWN_DRAFT_1, T_OWN_INPROGRESS] }),
      makeCtx(),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const data = body.data ?? body;
    expect(data.absorbed).toEqual([T_OWN_DRAFT_1]);
    expect(data.skipped).toHaveLength(1);
    expect(data.skipped[0].id).toBe(T_OWN_INPROGRESS);
    expect(data.skipped[0].reason).toMatch(/진행 중|종료/);
    // 새 시리즈 +1 (absorbed 1건만)
    expect(captures.seriesUpdateCalls).toHaveLength(1);
    expect(captures.seriesUpdateCalls[0].data).toEqual({
      tournaments_count: { increment: 1 },
    });
  });

  it("6) 카운터 양면 동기화 — 이전 시리즈 -1 / 새 시리즈 +N", async () => {
    const { captures } = setupMocks({
      loggedIn: true,
      targetSeries: {
        id: SERIES_ID_BIG,
        organizer_id: ORGANIZER_ID,
        name: "내 시리즈",
        tournaments_count: 0,
      },
      candidateTournaments: [
        // 이미 다른 시리즈에 박힌 대회 (이전 카운터 -1 대상)
        {
          id: T_OWN_PREV_SERIES,
          organizerId: ORGANIZER_ID,
          status: "draft",
          series_id: PREV_SERIES_ID_BIG,
        },
        // 미연결 대회 (이전 카운터 영향 없음)
        {
          id: T_OWN_DRAFT_1,
          organizerId: ORGANIZER_ID,
          status: "draft",
          series_id: null,
        },
      ],
    });
    const { POST } = await import(
      "@/app/api/web/series/[id]/absorb-tournaments/route"
    );
    const res = await POST(
      makeRequest({ tournament_ids: [T_OWN_PREV_SERIES, T_OWN_DRAFT_1] }),
      makeCtx(),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const data = body.data ?? body;
    expect(data.absorbed).toHaveLength(2);
    // 카운터 호출 = 이전 시리즈 -1 (1회) + 새 시리즈 +2 (1회) = 총 2건.
    expect(captures.seriesUpdateCalls).toHaveLength(2);
    const decCall = captures.seriesUpdateCalls.find(
      (c) => c.where.id === PREV_SERIES_ID_BIG,
    );
    expect(decCall?.data).toEqual({ tournaments_count: { decrement: 1 } });
    const incCall = captures.seriesUpdateCalls.find(
      (c) => c.where.id === SERIES_ID_BIG,
    );
    expect(incCall?.data).toEqual({ tournaments_count: { increment: 2 } });
    // updateMany 1회 (absorbed 2건 함께)
    expect(captures.tournamentUpdateManyCalls).toHaveLength(1);
  });

  it("7-a) 빈 배열 → 400 (zod min 1)", async () => {
    setupMocks({
      loggedIn: true,
      targetSeries: {
        id: SERIES_ID_BIG,
        organizer_id: ORGANIZER_ID,
        name: "내 시리즈",
        tournaments_count: 0,
      },
      candidateTournaments: [],
    });
    const { POST } = await import(
      "@/app/api/web/series/[id]/absorb-tournaments/route"
    );
    const res = await POST(makeRequest({ tournament_ids: [] }), makeCtx());
    expect(res.status).toBe(400);
  });

  it("7-b) 비-uuid 문자열 → 400 (zod uuid)", async () => {
    setupMocks({
      loggedIn: true,
      targetSeries: {
        id: SERIES_ID_BIG,
        organizer_id: ORGANIZER_ID,
        name: "내 시리즈",
        tournaments_count: 0,
      },
      candidateTournaments: [],
    });
    const { POST } = await import(
      "@/app/api/web/series/[id]/absorb-tournaments/route"
    );
    const res = await POST(makeRequest({ tournament_ids: ["not-a-uuid"] }), makeCtx());
    expect(res.status).toBe(400);
  });
});
