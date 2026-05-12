/**
 * 2026-05-12 (Phase B-3) — /api/cron/series-counter-audit DRY-RUN 회귀 가드.
 *
 * 검증 매트릭스:
 *   1) Bearer 가드 실패 → 401
 *   2) 모두 정합 → 200 + total_mismatches=0
 *   3) tournament_series 불일치 발견 → 200 + series.mismatches 박제 + UPDATE 0회
 *   4) organizations 불일치 발견 → 200 + organizations.mismatches 박제 + UPDATE 0회
 *   5) 양쪽 모두 불일치 → action_required 메시지 박제
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const VALID_SECRET = "test-cron-secret";

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.CRON_SECRET = VALID_SECRET;
});

function setupMocks(opts: {
  series: Array<{ id: bigint; name: string; tournaments_count: number | null; _count: { tournaments: number } }>;
  organizations: Array<{ id: bigint; name: string; series_count: number | null; _count: { series: number } }>;
}) {
  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      tournament_series: {
        findMany: vi.fn().mockResolvedValue(opts.series),
        // UPDATE 가 호출되면 안 됨 — DRY-RUN
        update: vi.fn().mockImplementation(() => {
          throw new Error("audit cron should not call UPDATE (DRY-RUN)");
        }),
      },
      organizations: {
        findMany: vi.fn().mockResolvedValue(opts.organizations),
        update: vi.fn().mockImplementation(() => {
          throw new Error("audit cron should not call UPDATE (DRY-RUN)");
        }),
      },
    },
  }));
}

function makeRequest(authHeader?: string) {
  const headers = new Headers();
  if (authHeader !== undefined) {
    headers.set("authorization", authHeader);
  }
  return new Request("https://test.local/api/cron/series-counter-audit", {
    method: "GET",
    headers,
  });
}

describe("GET /api/cron/series-counter-audit — Phase B-3 DRY-RUN audit", () => {
  it("1) Bearer 가드 실패 → 401", async () => {
    setupMocks({ series: [], organizations: [] });
    const { GET } = await import("@/app/api/cron/series-counter-audit/route");
    // NextRequest 가 아닌 Request 직접 — req.headers.get 사용 가능
    const res = await GET(makeRequest("Bearer wrong-secret") as never);
    expect(res.status).toBe(401);
  });

  it("2) 모두 정합 → 200 + total_mismatches=0", async () => {
    setupMocks({
      series: [
        { id: BigInt(1), name: "OK 시리즈 1", tournaments_count: 3, _count: { tournaments: 3 } },
        { id: BigInt(2), name: "OK 시리즈 2", tournaments_count: 0, _count: { tournaments: 0 } },
      ],
      organizations: [
        { id: BigInt(1), name: "OK 단체 1", series_count: 2, _count: { series: 2 } },
      ],
    });
    const { GET } = await import("@/app/api/cron/series-counter-audit/route");
    const res = await GET(makeRequest(`Bearer ${VALID_SECRET}`) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.mode).toBe("dry-run");
    expect(body.total_mismatches).toBe(0);
    expect(body.series.mismatch_count).toBe(0);
    expect(body.organizations.mismatch_count).toBe(0);
    expect(body.action_required).toBeNull();
  });

  it("3) tournament_series 불일치 발견 → mismatches 박제", async () => {
    setupMocks({
      series: [
        { id: BigInt(8), name: "BDR 시리즈", tournaments_count: 0, _count: { tournaments: 12 } },
        { id: BigInt(9), name: "정합", tournaments_count: 5, _count: { tournaments: 5 } },
      ],
      organizations: [],
    });
    const { GET } = await import("@/app/api/cron/series-counter-audit/route");
    const res = await GET(makeRequest(`Bearer ${VALID_SECRET}`) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.series.mismatch_count).toBe(1);
    expect(body.series.mismatches).toHaveLength(1);
    expect(body.series.mismatches[0].id).toBe("8");
    expect(body.series.mismatches[0].stored).toBe(0);
    expect(body.series.mismatches[0].actual).toBe(12);
    expect(body.series.mismatches[0].delta).toBe(12);
    expect(body.action_required).toMatch(/series-counter-recompute/);
  });

  it("4) organizations 불일치 발견 → mismatches 박제", async () => {
    setupMocks({
      series: [],
      organizations: [
        { id: BigInt(3), name: "강남구농구협회", series_count: 0, _count: { series: 1 } },
      ],
    });
    const { GET } = await import("@/app/api/cron/series-counter-audit/route");
    const res = await GET(makeRequest(`Bearer ${VALID_SECRET}`) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.organizations.mismatch_count).toBe(1);
    expect(body.organizations.mismatches[0].id).toBe("3");
    expect(body.organizations.mismatches[0].delta).toBe(1);
  });

  it("5) 양쪽 모두 불일치 → action_required 박제", async () => {
    setupMocks({
      series: [
        { id: BigInt(8), name: "S", tournaments_count: 0, _count: { tournaments: 12 } },
      ],
      organizations: [
        { id: BigInt(3), name: "O", series_count: 0, _count: { series: 1 } },
      ],
    });
    const { GET } = await import("@/app/api/cron/series-counter-audit/route");
    const res = await GET(makeRequest(`Bearer ${VALID_SECRET}`) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total_mismatches).toBe(2);
    expect(body.action_required).toBeTruthy();
  });
});
