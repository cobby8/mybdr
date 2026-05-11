/**
 * 2026-05-11 — Phase 1-B-2 BFF (/api/web/score-sheet/[matchId]/submit) 회귀 방지.
 *
 * 검증 매트릭스:
 *   1. mode=flutter 매치 → 403 RECORDING_MODE_FLUTTER (paper 모드만 허용)
 *   2. zod 422 — 음수 점수 / status 비정상 값
 *   3. 정상 통과 → service 호출 (existingMatch 인자 전달 확인) + audit 박제 + apiSuccess
 *   4. service MATCH_NOT_FOUND → 404 전파
 *
 * DB / 권한 / service 모두 mock (vi.doMock — match-sync.test.ts 패턴).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const MATCH_ID = BigInt(700);
const TOURNAMENT_ID = "t-uuid-xyz";

function buildAccessOk(opts: {
  paper: boolean;
  user?: { id: bigint; nickname: string | null };
}) {
  return {
    user: opts.user ?? { id: BigInt(1), nickname: "관리자" },
    match: {
      id: MATCH_ID,
      tournamentId: TOURNAMENT_ID,
      homeTeamId: BigInt(11),
      awayTeamId: BigInt(22),
      winner_team_id: null,
      status: "in_progress",
      settings: opts.paper
        ? { recording_mode: "paper" }
        : { recording_mode: "flutter" },
      homeScore: 50,
      awayScore: 48,
      roundName: "결승",
      round_number: 4,
      match_number: 1,
      scheduledAt: new Date(),
      court_number: "1",
      venue_id: null,
      quarterScores: null,
      notes: null,
      match_code: "TEST-001",
    },
    tournament: {
      id: TOURNAMENT_ID,
      name: "테스트 대회",
      organizerId: BigInt(999),
      format: "single_elimination",
    },
  };
}

function setupRouteMocks(opts: {
  access: ReturnType<typeof buildAccessOk> | { error: { status: number } };
  syncResult?:
    | { ok: true; data: Record<string, unknown> }
    | { ok: false; code: string; message: string };
  auditCreate?: ReturnType<typeof vi.fn>;
}) {
  vi.doMock("@/lib/auth/require-score-sheet-access", () => ({
    requireScoreSheetAccess: vi.fn().mockResolvedValue(opts.access),
  }));

  const syncMock = vi.fn().mockResolvedValue(
    opts.syncResult ?? {
      ok: true,
      data: {
        server_match_id: 700,
        player_count: 0,
        play_by_play_count: 0,
        synced_at: new Date().toISOString(),
        post_process_status: "ok" as const,
      },
    }
  );
  vi.doMock("@/lib/services/match-sync", () => ({
    syncSingleMatch: syncMock,
  }));

  const auditFn = opts.auditCreate ?? vi.fn().mockResolvedValue({});
  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      tournamentMatch: { update: vi.fn().mockResolvedValue({}) },
      tournament_match_audits: { create: auditFn },
    },
  }));

  return { syncMock, auditFn };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/web/score-sheet/700/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  home_score: 80,
  away_score: 75,
  quarter_scores: {
    home: { q1: 20, q2: 20, q3: 20, q4: 20, ot: [] },
    away: { q1: 18, q2: 20, q3: 17, q4: 20, ot: [] },
  },
  status: "completed",
};

describe("score-sheet BFF — mode 가드 (1B-2)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("mode=flutter → 403 RECORDING_MODE_FLUTTER", async () => {
    setupRouteMocks({
      access: buildAccessOk({ paper: false }),
    });
    const { POST } = await import(
      "@/app/api/web/score-sheet/[matchId]/submit/route"
    );
    const req = makeRequest(VALID_BODY);
    const res = await POST(req as unknown as Parameters<typeof POST>[0], {
      params: Promise.resolve({ matchId: "700" }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("RECORDING_MODE_FLUTTER");
  });
});

describe("score-sheet BFF — zod 검증 (1B-2)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("음수 home_score → 422 VALIDATION_ERROR", async () => {
    setupRouteMocks({ access: buildAccessOk({ paper: true }) });
    const { POST } = await import(
      "@/app/api/web/score-sheet/[matchId]/submit/route"
    );
    const req = makeRequest({ ...VALID_BODY, home_score: -1 });
    const res = await POST(req as unknown as Parameters<typeof POST>[0], {
      params: Promise.resolve({ matchId: "700" }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("status 비정상 값 (cancelled) → 422 VALIDATION_ERROR", async () => {
    setupRouteMocks({ access: buildAccessOk({ paper: true }) });
    const { POST } = await import(
      "@/app/api/web/score-sheet/[matchId]/submit/route"
    );
    const req = makeRequest({ ...VALID_BODY, status: "cancelled" });
    const res = await POST(req as unknown as Parameters<typeof POST>[0], {
      params: Promise.resolve({ matchId: "700" }),
    });
    expect(res.status).toBe(422);
  });
});

describe("score-sheet BFF — 정상 통과 (1B-2)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("정상 paper 매치 → service 호출 (existingMatch 인자 전달) + audit 박제 + 200", async () => {
    const { syncMock, auditFn } = setupRouteMocks({
      access: buildAccessOk({ paper: true }),
    });
    const { POST } = await import(
      "@/app/api/web/score-sheet/[matchId]/submit/route"
    );
    const req = makeRequest(VALID_BODY);
    const res = await POST(req as unknown as Parameters<typeof POST>[0], {
      params: Promise.resolve({ matchId: "700" }),
    });
    expect(res.status).toBe(200);

    // service 호출 인자 검증 — existingMatch 가 전달되어야 함 (SELECT 2→1 통합)
    expect(syncMock).toHaveBeenCalledTimes(1);
    const callArg = syncMock.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.existingMatch).toBeTruthy();
    expect((callArg.existingMatch as { id: bigint }).id).toBe(MATCH_ID);
    expect((callArg.match as { home_score: number }).home_score).toBe(80);
    expect((callArg.match as { status: string }).status).toBe("completed");

    // audit 박제 호출 (source = "web-score-sheet")
    expect(auditFn).toHaveBeenCalledTimes(1);
    const auditArg = auditFn.mock.calls[0][0] as { data: { source: string } };
    expect(auditArg.data.source).toBe("web-score-sheet");

    // 응답 envelope (snake_case 자동 변환)
    const body = await res.json();
    expect(body.match_id).toBe(MATCH_ID.toString());
    expect(body.home_score).toBe(80);
    expect(body.away_score).toBe(75);
    expect(body.status).toBe("completed");
  });

  it("service MATCH_NOT_FOUND → 404 전파", async () => {
    setupRouteMocks({
      access: buildAccessOk({ paper: true }),
      syncResult: {
        ok: false,
        code: "MATCH_NOT_FOUND",
        message: "Match not found in tournament",
      },
    });
    const { POST } = await import(
      "@/app/api/web/score-sheet/[matchId]/submit/route"
    );
    const req = makeRequest(VALID_BODY);
    const res = await POST(req as unknown as Parameters<typeof POST>[0], {
      params: Promise.resolve({ matchId: "700" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("MATCH_NOT_FOUND");
  });
});
