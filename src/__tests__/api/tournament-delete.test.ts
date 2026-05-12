/**
 * 2026-05-12 — DELETE /api/web/tournaments/[id] — Phase B 정합성 가드 회귀 가드.
 *
 * 검증 매트릭스 (6 케이스):
 *   1) Soft DELETE (기본) — organizer 본인 → 200 + status='cancelled' UPDATE
 *   2) Soft DELETE — 이미 cancelled 상태 → 200 + alreadyCancelled=true (멱등 처리)
 *   3) Hard DELETE (?hard=1) — super_admin 만 통과 → 200 + tournament.delete + series 카운터 -1
 *   4) Hard DELETE — organizer 본인 (super_admin 아님) → 403
 *   5) Hard DELETE — series_id=null 인 대회 → 200 + 카운터 UPDATE 0회 (skip)
 *   6) Hard DELETE — FK 위반 (관련 매치/팀 잔존) → 409
 *
 * mock 패턴: tournament-series-link.test.ts 와 동일 (vi.doMock + $transaction tx 객체).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const TOURNAMENT_ID = "t-uuid-delete";
const ORGANIZER_ID = BigInt(100);
const SUPER_ADMIN_ID = BigInt(999);
const SERIES_ID = BigInt(8);

const AUTH_OK_ORGANIZER = {
  userId: ORGANIZER_ID,
  session: { sub: String(ORGANIZER_ID), role: "user" },
};

const AUTH_OK_SUPER_ADMIN = {
  userId: SUPER_ADMIN_ID,
  session: { sub: String(SUPER_ADMIN_ID), role: "super_admin" },
};

type MockCaptures = {
  tournamentUpdateCalls: Array<{ where: { id: string }; data: Record<string, unknown> }>;
  tournamentDeleteCalls: Array<{ where: { id: string } }>;
  seriesUpdateCalls: Array<{ where: { id: bigint }; data: unknown }>;
  transactionCalled: number;
  adminLogCalls: Array<{ action: string; severity?: string }>;
};

function setupMocks(opts: {
  auth: typeof AUTH_OK_ORGANIZER | typeof AUTH_OK_SUPER_ADMIN;
  currentTournament: {
    id: string;
    name: string;
    status: string | null;
    series_id: bigint | null;
    organizerId: bigint;
  } | null;
  /** Hard DELETE 시 tournament.delete 가 throw 할 에러 (FK 위반 시뮬레이션) */
  deleteThrowsFkError?: boolean;
}): { captures: MockCaptures } {
  const captures: MockCaptures = {
    tournamentUpdateCalls: [],
    tournamentDeleteCalls: [],
    seriesUpdateCalls: [],
    transactionCalled: 0,
    adminLogCalls: [],
  };

  vi.doMock("@/lib/auth/tournament-auth", () => ({
    requireTournamentAdmin: vi.fn().mockResolvedValue(opts.auth),
  }));

  vi.doMock("@/lib/admin/log", () => ({
    adminLog: vi.fn().mockImplementation(async (action: string, _resourceType: string, options?: { severity?: string }) => {
      captures.adminLogCalls.push({ action, severity: options?.severity });
    }),
  }));

  // tx 객체 — $transaction 콜백에 전달.
  const tx = {
    tournament: {
      delete: vi.fn().mockImplementation((args: { where: { id: string } }) => {
        if (opts.deleteThrowsFkError) {
          // Prisma P2003 FK 위반 흉내
          throw new Error("Foreign key constraint failed (P2003)");
        }
        captures.tournamentDeleteCalls.push(args);
        return Promise.resolve({ id: args.where.id });
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
      tournament: {
        findUnique: vi.fn().mockResolvedValue(opts.currentTournament),
        update: vi.fn().mockImplementation((args: { where: { id: string }; data: Record<string, unknown> }) => {
          captures.tournamentUpdateCalls.push(args);
          return Promise.resolve({ id: args.where.id, ...args.data });
        }),
      },
      $transaction: vi.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        captures.transactionCalled++;
        return cb(tx);
      }),
    },
  }));

  // 의존 모듈 stub (실제 호출 X)
  vi.doMock("@/lib/services/tournament", () => ({
    getTournament: vi.fn(),
    updateTournament: vi.fn(),
  }));

  return { captures };
}

/**
 * DELETE 요청 헬퍼 — searchParams 지원 위해 nextUrl.searchParams 가짜 박제.
 */
function makeRequest(searchParams: Record<string, string> = {}) {
  const url = new URL("https://test.local/api/web/tournaments/" + TOURNAMENT_ID);
  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }
  return {
    nextUrl: url,
  } as unknown as Parameters<
    typeof import("@/app/api/web/tournaments/[id]/route").DELETE
  >[0];
}

const makeCtx = () => ({ params: Promise.resolve({ id: TOURNAMENT_ID }) });

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("DELETE /api/web/tournaments/[id] — Phase B 정합성 가드", () => {
  it("1) Soft DELETE (기본) — organizer 본인 → 200 + status='cancelled' UPDATE", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_ORGANIZER,
      currentTournament: {
        id: TOURNAMENT_ID,
        name: "테스트 대회",
        status: "draft",
        series_id: null,
        organizerId: ORGANIZER_ID,
      },
    });

    const { DELETE } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await DELETE(makeRequest(), makeCtx());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(body.mode).toBe("soft");

    // tournament.update — status='cancelled'
    expect(captures.tournamentUpdateCalls).toHaveLength(1);
    expect(captures.tournamentUpdateCalls[0].data.status).toBe("cancelled");

    // $transaction 안 씀 (soft 는 단순 UPDATE)
    expect(captures.transactionCalled).toBe(0);

    // adminLog warning 박제
    expect(captures.adminLogCalls).toHaveLength(1);
    expect(captures.adminLogCalls[0].action).toBe("tournament_soft_delete");
    expect(captures.adminLogCalls[0].severity).toBe("warning");
  });

  it("2) Soft DELETE — 이미 cancelled → 200 + alreadyCancelled=true (멱등)", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_ORGANIZER,
      currentTournament: {
        id: TOURNAMENT_ID,
        name: "이미 취소된 대회",
        status: "cancelled",
        series_id: null,
        organizerId: ORGANIZER_ID,
      },
    });

    const { DELETE } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await DELETE(makeRequest(), makeCtx());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    // apiSuccess 자동 snake_case 변환 — alreadyCancelled → already_cancelled
    expect(body.already_cancelled).toBe(true);

    // UPDATE 호출 0회 (멱등 처리)
    expect(captures.tournamentUpdateCalls).toHaveLength(0);
    // adminLog 호출 0회 (이미 cancelled)
    expect(captures.adminLogCalls).toHaveLength(0);
  });

  it("3) Hard DELETE — super_admin 통과 → 200 + delete + series 카운터 -1", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_SUPER_ADMIN,
      currentTournament: {
        id: TOURNAMENT_ID,
        name: "Hard 삭제 대회",
        status: "draft",
        series_id: SERIES_ID,
        organizerId: ORGANIZER_ID,
      },
    });

    const { DELETE } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await DELETE(makeRequest({ hard: "1" }), makeCtx());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(body.mode).toBe("hard");

    // $transaction 호출
    expect(captures.transactionCalled).toBe(1);
    // tournament.delete 호출
    expect(captures.tournamentDeleteCalls).toHaveLength(1);
    expect(captures.tournamentDeleteCalls[0].where.id).toBe(TOURNAMENT_ID);
    // series 카운터 -1
    expect(captures.seriesUpdateCalls).toHaveLength(1);
    expect(captures.seriesUpdateCalls[0].where.id).toBe(SERIES_ID);
    expect(captures.seriesUpdateCalls[0].data).toEqual({
      tournaments_count: { decrement: 1 },
    });

    // adminLog critical
    expect(captures.adminLogCalls).toHaveLength(1);
    expect(captures.adminLogCalls[0].action).toBe("tournament_hard_delete");
    expect(captures.adminLogCalls[0].severity).toBe("critical");
  });

  it("4) Hard DELETE — organizer 본인 (super_admin 아님) → 403", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_ORGANIZER,
      currentTournament: {
        id: TOURNAMENT_ID,
        name: "권한 없음 대회",
        status: "draft",
        series_id: SERIES_ID,
        organizerId: ORGANIZER_ID,
      },
    });

    const { DELETE } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await DELETE(makeRequest({ hard: "1" }), makeCtx());

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error || body.message).toMatch(/super_admin/);

    // 어떤 destructive 호출도 없음
    expect(captures.tournamentDeleteCalls).toHaveLength(0);
    expect(captures.seriesUpdateCalls).toHaveLength(0);
    expect(captures.transactionCalled).toBe(0);
  });

  it("5) Hard DELETE — series_id=null 인 대회 → 200 + 카운터 UPDATE 0회", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_SUPER_ADMIN,
      currentTournament: {
        id: TOURNAMENT_ID,
        name: "개인 대회",
        status: "draft",
        series_id: null, // 시리즈 미연결
        organizerId: ORGANIZER_ID,
      },
    });

    const { DELETE } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await DELETE(makeRequest({ hard: "1" }), makeCtx());

    expect(res.status).toBe(200);
    expect(captures.tournamentDeleteCalls).toHaveLength(1);
    // 카운터 UPDATE 호출 X (series_id null skip)
    expect(captures.seriesUpdateCalls).toHaveLength(0);
  });

  it("6) Hard DELETE — FK 위반 (관련 매치/팀 잔존) → 409", async () => {
    const { captures } = setupMocks({
      auth: AUTH_OK_SUPER_ADMIN,
      currentTournament: {
        id: TOURNAMENT_ID,
        name: "관련 데이터 있는 대회",
        status: "draft",
        series_id: SERIES_ID,
        organizerId: ORGANIZER_ID,
      },
      deleteThrowsFkError: true,
    });

    const { DELETE } = await import("@/app/api/web/tournaments/[id]/route");
    const res = await DELETE(makeRequest({ hard: "1" }), makeCtx());

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error || body.message).toMatch(/관련.*매치|팀|통계/);

    // delete 호출은 시도됐지만 실패
    expect(captures.transactionCalled).toBe(1);
    // adminLog 호출 X (실패해서 박제 단계 도달 못함)
    expect(captures.adminLogCalls).toHaveLength(0);
  });
});
