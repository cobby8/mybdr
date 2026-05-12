/**
 * 2026-05-12 (Phase C) — /api/web/series/[id] PATCH/DELETE 회귀 가드.
 *
 * 검증 매트릭스:
 *   PATCH 권한 (Q2 결재):
 *     1) organizer 본인 → 200
 *     2) 단체 owner → 200
 *     3) 단체 admin → 200
 *     4) 단체 member → 403
 *     5) 외부인 (organization_id NULL 시리즈) → 403
 *     6) super_admin → 200 (우회)
 *   PATCH organization_id 변경:
 *     7) NULL → 단체 변경: 새 organization series_count +1
 *     8) 단체 → 단체 변경: 이전 -1 / 새 +1 ($transaction)
 *     9) 단체 → NULL 분리: 이전 -1
 *     10) 새 단체 권한 없음 (일반 사용자) → 403
 *     11) super_admin 단체 변경 → 카운터 동기화 (권한 검증 우회)
 *   DELETE:
 *     12) ?hard=1 + super_admin → 200 + tournaments series_id NULL + organizations.series_count -1
 *     13) ?hard=1 + 일반 organizer → 403 (super_admin only)
 *     14) hard 미지정 (soft) → 400 (본 PR 미구현)
 *     15) 시리즈 없음 → 404
 *
 * mock 패턴: tournament-series-link.test.ts 와 동일 (vi.doMock + $transaction tx 객체).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const SERIES_ID_STR = "8";
const SERIES_ID = BigInt(8);
const ORGANIZER_ID = BigInt(100);
const OTHER_USER_ID = BigInt(200);
const SUPER_ADMIN_ID = BigInt(999);
const ORG_OWNER_ID = BigInt(300);
const ORG_ADMIN_ID = BigInt(301);
const ORG_MEMBER_ID = BigInt(302);
const ORG_ID_A = BigInt(10);
const ORG_ID_B = BigInt(20);

// withWebAuth 패턴 — ctx 객체 반환 (web-session.ts 패턴)
const makeAuthCtx = (userId: bigint, role: string = "user") => ({
  userId,
  session: { sub: String(userId), role },
});

type MockCaptures = {
  seriesUpdateCalls: Array<{ where: { id: bigint }; data: Record<string, unknown> }>;
  seriesDeleteCalls: Array<{ where: { id: bigint } }>;
  orgUpdateCalls: Array<{ where: { id: bigint }; data: unknown }>;
  tournamentUpdateManyCalls: Array<{ where: unknown; data: unknown }>;
  transactionCalled: number;
  adminLogCalls: Array<{ action: string; severity?: string }>;
};

interface SetupOpts {
  auth: ReturnType<typeof makeAuthCtx>;
  /** prisma.tournament_series.findUnique 첫 호출 (requireSeriesEditor 안) 결과 */
  seriesRow: {
    id: bigint;
    name: string;
    slug: string;
    description: string | null;
    is_public: boolean | null;
    organization_id: bigint | null;
    organizer_id: bigint;
    tournaments_count: number | null;
  } | null;
  /**
   * requireSeriesEditor 안의 organization_members.findFirst 결과.
   * organizer 본인 (auth.userId === seriesRow.organizer_id) 이거나 super_admin 이면 호출되지 않음.
   * 외부인 (organization_id 있는 시리즈) 만 호출됨.
   */
  membership?: { role: string } | null;
  /**
   * PATCH 시 organization_id 변경 — isOrganizationEditor 호출 결과 배열.
   * 호출 순서: 이전 단체 (NULL 이면 skip) → 새 단체 (NULL 이면 skip).
   * super_admin 이면 호출되지 않음.
   * requireSeriesEditor 안의 membership 호출은 본 배열에 포함되지 않음 (별도 처리).
   */
  orgEditorResults?: Array<{ id: bigint } | null>;
  /** organizations.findUnique (새 단체 status) 결과 */
  newOrgStatus?: { status: string } | null;
  /** DELETE Hard 시 tournament.delete throw 시뮬레이션 */
  deleteThrowsFkError?: boolean;
}

function setupMocks(opts: SetupOpts): { captures: MockCaptures } {
  const captures: MockCaptures = {
    seriesUpdateCalls: [],
    seriesDeleteCalls: [],
    orgUpdateCalls: [],
    tournamentUpdateManyCalls: [],
    transactionCalled: 0,
    adminLogCalls: [],
  };

  // withWebAuth mock — 핸들러 함수에 (req, ctx, authCtx) 전달
  vi.doMock("@/lib/auth/web-session", () => ({
    withWebAuth: (
      handler: (req: Request, ctx: unknown, authCtx: unknown) => Promise<Response>,
    ) => {
      // GET 은 (req, routeCtx, authCtx) / PATCH/DELETE 도 동일 시그니처
      return (req: Request, routeCtx: unknown) => handler(req, routeCtx, opts.auth);
    },
    getWebSession: vi.fn(),
  }));

  vi.doMock("@/lib/admin/log", () => ({
    adminLog: vi.fn().mockImplementation(async (action: string, _r: string, options?: { severity?: string }) => {
      captures.adminLogCalls.push({ action, severity: options?.severity });
    }),
  }));

  // organization_members.findFirst 호출 시퀀스 박제:
  //   - 외부인 케이스: [membership] (requireSeriesEditor) + [...orgEditorResults]
  //   - organizer 본인/super_admin 케이스: [...orgEditorResults] 만
  // isOrganizer 판정으로 분기 — opts.seriesRow null 이면 호출 자체 0
  const isOrganizerCase = !!opts.seriesRow && opts.seriesRow.organizer_id === opts.auth.userId;
  const isSuperAdminCase = opts.auth.session?.role === "super_admin";
  // requireSeriesEditor 가 membership 호출하는 케이스 = 외부인 + organization_id 있음
  const requiresMembershipCheck =
    !isOrganizerCase &&
    !isSuperAdminCase &&
    !!opts.seriesRow &&
    opts.seriesRow.organization_id !== null;

  const callSequence: Array<{ role: string } | null> = [];
  if (requiresMembershipCheck) {
    callSequence.push(opts.membership ?? null);
  }
  if (opts.orgEditorResults) {
    for (const r of opts.orgEditorResults) {
      // isOrganizationEditor 는 { id } 또는 null 반환. 본 mock 은 role 정보 무관.
      callSequence.push(r as { role: string } | null);
    }
  }
  let orgEditorCallCount = 0;

  // tx 객체 — $transaction 콜백에 전달
  const tx = {
    organizations: {
      update: vi.fn().mockImplementation((args: { where: { id: bigint }; data: unknown }) => {
        captures.orgUpdateCalls.push(args);
        return Promise.resolve({ id: args.where.id });
      }),
    },
    tournament_series: {
      update: vi.fn().mockImplementation((args: { where: { id: bigint }; data: Record<string, unknown> }) => {
        captures.seriesUpdateCalls.push(args);
        return Promise.resolve({
          id: args.where.id,
          name: (args.data.name as string) ?? opts.seriesRow?.name ?? "",
          description: (args.data.description as string | null) ?? opts.seriesRow?.description ?? null,
          is_public: (args.data.is_public as boolean) ?? opts.seriesRow?.is_public ?? true,
          organization_id: args.data.organization_id !== undefined
            ? (args.data.organization_id as bigint | null)
            : opts.seriesRow?.organization_id ?? null,
        });
      }),
      delete: vi.fn().mockImplementation((args: { where: { id: bigint } }) => {
        captures.seriesDeleteCalls.push(args);
        return Promise.resolve({ id: args.where.id });
      }),
    },
    tournament: {
      updateMany: vi.fn().mockImplementation((args: { where: unknown; data: unknown }) => {
        captures.tournamentUpdateManyCalls.push(args);
        return Promise.resolve({ count: 3 });
      }),
    },
  };

  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      tournament_series: {
        findUnique: vi.fn().mockResolvedValue(opts.seriesRow),
        update: vi.fn().mockImplementation((args: { where: { id: bigint }; data: Record<string, unknown> }) => {
          captures.seriesUpdateCalls.push(args);
          return Promise.resolve({
            id: args.where.id,
            name: (args.data.name as string) ?? opts.seriesRow?.name ?? "",
            description: (args.data.description as string | null) ?? opts.seriesRow?.description ?? null,
            is_public: (args.data.is_public as boolean) ?? opts.seriesRow?.is_public ?? true,
            organization_id: opts.seriesRow?.organization_id ?? null,
          });
        }),
      },
      organization_members: {
        // 사전 계산된 callSequence 순차 반환
        findFirst: vi.fn().mockImplementation(() => {
          const idx = orgEditorCallCount;
          orgEditorCallCount++;
          const result = callSequence[idx] ?? null;
          return Promise.resolve(result);
        }),
      },
      organizations: {
        findUnique: vi.fn().mockResolvedValue(opts.newOrgStatus ?? { status: "approved" }),
        update: vi.fn().mockImplementation((args: { where: { id: bigint }; data: unknown }) => {
          captures.orgUpdateCalls.push(args);
          return Promise.resolve({ id: args.where.id });
        }),
      },
      tournament: {
        updateMany: vi.fn().mockImplementation((args: { where: unknown; data: unknown }) => {
          captures.tournamentUpdateManyCalls.push(args);
          return Promise.resolve({ count: 3 });
        }),
      },
      $transaction: vi.fn().mockImplementation(async (cb: (t: unknown) => Promise<unknown>) => {
        captures.transactionCalled++;
        if (opts.deleteThrowsFkError) {
          // delete 안에서 throw 시뮬레이션 — Hard DELETE 테스트
          throw new Error("Foreign key constraint failed (P2003)");
        }
        return cb(tx);
      }),
    },
  }));

  return { captures };
}

const makeRouteCtx = () => ({ params: Promise.resolve({ id: SERIES_ID_STR }) });

function makeRequest(method: "PATCH" | "DELETE", body?: unknown, search?: string) {
  const url = `https://test.local/api/web/series/${SERIES_ID_STR}${search ?? ""}`;
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const SERIES_BASE = {
  id: SERIES_ID,
  name: "BDR 시리즈",
  slug: "bdr-series",
  description: null,
  is_public: true,
  organization_id: null as bigint | null,
  organizer_id: ORGANIZER_ID,
  tournaments_count: 12,
};

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("PATCH /api/web/series/[id] — 권한 매트릭스 (Q2)", () => {
  it("1) organizer 본인 → 200 + name 변경", async () => {
    setupMocks({
      auth: makeAuthCtx(ORGANIZER_ID),
      seriesRow: { ...SERIES_BASE },
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(makeRequest("PATCH", { name: "새 이름" }), makeRouteCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("새 이름");
  });

  it("2) 단체 owner → 200", async () => {
    setupMocks({
      auth: makeAuthCtx(ORG_OWNER_ID),
      seriesRow: { ...SERIES_BASE, organization_id: ORG_ID_A, organizer_id: OTHER_USER_ID },
      membership: { role: "owner" },
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(makeRequest("PATCH", { name: "owner 변경" }), makeRouteCtx());
    expect(res.status).toBe(200);
  });

  it("3) 단체 admin → 200", async () => {
    setupMocks({
      auth: makeAuthCtx(ORG_ADMIN_ID),
      seriesRow: { ...SERIES_BASE, organization_id: ORG_ID_A, organizer_id: OTHER_USER_ID },
      membership: { role: "admin" },
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(makeRequest("PATCH", { name: "admin 변경" }), makeRouteCtx());
    expect(res.status).toBe(200);
  });

  it("4) 단체 member → 403", async () => {
    setupMocks({
      auth: makeAuthCtx(ORG_MEMBER_ID),
      seriesRow: { ...SERIES_BASE, organization_id: ORG_ID_A, organizer_id: OTHER_USER_ID },
      membership: null, // findFirst with role IN [owner, admin] = null
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(makeRequest("PATCH", { name: "member 시도" }), makeRouteCtx());
    expect(res.status).toBe(403);
  });

  it("5) 외부인 (organization_id NULL 시리즈) → 403", async () => {
    setupMocks({
      auth: makeAuthCtx(OTHER_USER_ID),
      seriesRow: { ...SERIES_BASE, organization_id: null, organizer_id: ORGANIZER_ID },
      membership: null,
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(makeRequest("PATCH", { name: "외부인" }), makeRouteCtx());
    expect(res.status).toBe(403);
  });

  it("6) super_admin → 200 (우회)", async () => {
    setupMocks({
      auth: makeAuthCtx(SUPER_ADMIN_ID, "super_admin"),
      seriesRow: { ...SERIES_BASE, organizer_id: OTHER_USER_ID },
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(makeRequest("PATCH", { name: "super 변경" }), makeRouteCtx());
    expect(res.status).toBe(200);
  });

  it("시리즈 없음 → 404", async () => {
    setupMocks({
      auth: makeAuthCtx(ORGANIZER_ID),
      seriesRow: null,
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(makeRequest("PATCH", { name: "x" }), makeRouteCtx());
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/web/series/[id] — organization_id 변경 + 카운터 동기화", () => {
  it("7) NULL → 단체 변경: 새 organization series_count +1", async () => {
    const { captures } = setupMocks({
      auth: makeAuthCtx(ORGANIZER_ID),
      seriesRow: { ...SERIES_BASE, organization_id: null },
      orgEditorResults: [{ id: BigInt(1) }], // 새 단체 권한 OK (이전 NULL — skip)
      newOrgStatus: { status: "approved" },
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(
      makeRequest("PATCH", { organization_id: ORG_ID_A.toString() }),
      makeRouteCtx(),
    );
    expect(res.status).toBe(200);
    expect(captures.transactionCalled).toBe(1);
    // 새 단체 +1
    expect(captures.orgUpdateCalls).toHaveLength(1);
    expect(captures.orgUpdateCalls[0].where.id).toBe(ORG_ID_A);
    expect(captures.orgUpdateCalls[0].data).toEqual({ series_count: { increment: 1 } });
  });

  it("8) 단체 A → 단체 B 변경: 이전 -1 / 새 +1", async () => {
    const { captures } = setupMocks({
      auth: makeAuthCtx(ORGANIZER_ID),
      seriesRow: { ...SERIES_BASE, organization_id: ORG_ID_A },
      orgEditorResults: [{ id: BigInt(1) }, { id: BigInt(2) }], // 이전 + 새 단체 모두 권한 OK
      newOrgStatus: { status: "approved" },
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(
      makeRequest("PATCH", { organization_id: ORG_ID_B.toString() }),
      makeRouteCtx(),
    );
    expect(res.status).toBe(200);
    expect(captures.transactionCalled).toBe(1);
    // 이전 -1 / 새 +1
    expect(captures.orgUpdateCalls).toHaveLength(2);
    const decrementCall = captures.orgUpdateCalls.find(
      (c) => c.where.id === ORG_ID_A,
    );
    const incrementCall = captures.orgUpdateCalls.find(
      (c) => c.where.id === ORG_ID_B,
    );
    expect(decrementCall?.data).toEqual({ series_count: { decrement: 1 } });
    expect(incrementCall?.data).toEqual({ series_count: { increment: 1 } });
  });

  it("9) 단체 → NULL 분리: 이전 -1", async () => {
    const { captures } = setupMocks({
      auth: makeAuthCtx(ORGANIZER_ID),
      seriesRow: { ...SERIES_BASE, organization_id: ORG_ID_A },
      orgEditorResults: [{ id: BigInt(1) }], // 이전 단체 권한 OK
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(
      makeRequest("PATCH", { organization_id: null }),
      makeRouteCtx(),
    );
    expect(res.status).toBe(200);
    expect(captures.transactionCalled).toBe(1);
    // 이전 -1만 (새 단체 NULL → skip)
    expect(captures.orgUpdateCalls).toHaveLength(1);
    expect(captures.orgUpdateCalls[0].where.id).toBe(ORG_ID_A);
    expect(captures.orgUpdateCalls[0].data).toEqual({ series_count: { decrement: 1 } });
  });

  it("10) 새 단체 권한 없음 (일반 사용자) → 403", async () => {
    const { captures } = setupMocks({
      auth: makeAuthCtx(ORGANIZER_ID),
      seriesRow: { ...SERIES_BASE, organization_id: null },
      orgEditorResults: [null], // 새 단체 권한 없음
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(
      makeRequest("PATCH", { organization_id: ORG_ID_A.toString() }),
      makeRouteCtx(),
    );
    expect(res.status).toBe(403);
    // 권한 검증 실패 → transaction 진입 X
    expect(captures.transactionCalled).toBe(0);
  });

  it("11) super_admin 단체 변경 → 카운터 동기화 (권한 검증 우회)", async () => {
    const { captures } = setupMocks({
      auth: makeAuthCtx(SUPER_ADMIN_ID, "super_admin"),
      seriesRow: { ...SERIES_BASE, organization_id: ORG_ID_A, organizer_id: OTHER_USER_ID },
      // orgEditorResults 미설정 — super_admin 우회로 isOrganizationEditor 호출 안 함
      newOrgStatus: { status: "approved" },
    });
    const { PATCH } = await import("@/app/api/web/series/[id]/route");
    const res = await PATCH(
      makeRequest("PATCH", { organization_id: ORG_ID_B.toString() }),
      makeRouteCtx(),
    );
    expect(res.status).toBe(200);
    expect(captures.transactionCalled).toBe(1);
    // 카운터는 여전히 동기화 (정합성 보존)
    expect(captures.orgUpdateCalls).toHaveLength(2);
  });
});

describe("DELETE /api/web/series/[id]", () => {
  it("12) ?hard=1 + super_admin → 200 + tournaments NULL + organizations -1", async () => {
    const { captures } = setupMocks({
      auth: makeAuthCtx(SUPER_ADMIN_ID, "super_admin"),
      seriesRow: { ...SERIES_BASE, organization_id: ORG_ID_A },
    });
    const { DELETE } = await import("@/app/api/web/series/[id]/route");
    const res = await DELETE(makeRequest("DELETE", undefined, "?hard=1"), makeRouteCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(body.mode).toBe("hard");

    // tournament.updateMany — series_id NULL
    expect(captures.tournamentUpdateManyCalls).toHaveLength(1);
    expect(captures.tournamentUpdateManyCalls[0].data).toEqual({ series_id: null });

    // organizations.series_count -1
    expect(captures.orgUpdateCalls).toHaveLength(1);
    expect(captures.orgUpdateCalls[0].where.id).toBe(ORG_ID_A);
    expect(captures.orgUpdateCalls[0].data).toEqual({ series_count: { decrement: 1 } });

    // series.delete
    expect(captures.seriesDeleteCalls).toHaveLength(1);

    // critical adminLog
    expect(captures.adminLogCalls.some((c) => c.action === "series_hard_delete" && c.severity === "critical")).toBe(true);
  });

  it("13) ?hard=1 + 일반 organizer → 403 (super_admin only)", async () => {
    const { captures } = setupMocks({
      auth: makeAuthCtx(ORGANIZER_ID),
      seriesRow: { ...SERIES_BASE, organization_id: ORG_ID_A },
    });
    const { DELETE } = await import("@/app/api/web/series/[id]/route");
    const res = await DELETE(makeRequest("DELETE", undefined, "?hard=1"), makeRouteCtx());
    expect(res.status).toBe(403);
    expect(captures.transactionCalled).toBe(0);
    expect(captures.seriesDeleteCalls).toHaveLength(0);
  });

  it("14) hard 미지정 (soft) → 400 (본 PR 미구현)", async () => {
    const { captures } = setupMocks({
      auth: makeAuthCtx(SUPER_ADMIN_ID, "super_admin"),
      seriesRow: { ...SERIES_BASE },
    });
    const { DELETE } = await import("@/app/api/web/series/[id]/route");
    const res = await DELETE(makeRequest("DELETE"), makeRouteCtx());
    expect(res.status).toBe(400);
    expect(captures.transactionCalled).toBe(0);
  });

  it("15) Hard DELETE — 시리즈 없음 → 404", async () => {
    setupMocks({
      auth: makeAuthCtx(SUPER_ADMIN_ID, "super_admin"),
      seriesRow: null,
    });
    const { DELETE } = await import("@/app/api/web/series/[id]/route");
    const res = await DELETE(makeRequest("DELETE", undefined, "?hard=1"), makeRouteCtx());
    expect(res.status).toBe(404);
  });
});
