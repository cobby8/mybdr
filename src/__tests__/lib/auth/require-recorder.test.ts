/**
 * 2026-05-15 — PR1 (recorder_admin 역할 신설) 회귀 가드.
 *
 * 검증 대상 = `requireRecorder(req, matchIdStr)` 권한 매트릭스:
 *   1) 일반 recorder (tournament_recorders 활성) → 본인 배정 대회만 통과 (회귀 0 검증)
 *   2) 일반 recorder + 다른 대회 매치 → forbidden (회귀 0)
 *   3) organizer 본인 → 통과
 *   4) super_admin (payload.role='super_admin') → 모든 대회 통과 (회귀 0)
 *   5) NEW PR1 — recorder_admin (payload.admin_role='recorder_admin') → 모든 대회 통과
 *   6) NEW PR1 — recorder_admin + tournament_recorders 미등록 → 여전히 통과 (전역 권한)
 *   7) 토큰 없음 → unauthorized
 *   8) 매치 없음 → notFound
 *
 * mock 패턴: canManageTournament.test.ts 와 동일 (vi.doMock + setupMocks).
 *
 * 보안 영향: PR1 add-only 분기 = 기존 super_admin / organizer / recorder 권한 변경 0 보장.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const MATCH_ID = "100";
const TOURNAMENT_ID = "tour-1";
const ORGANIZER_ID = BigInt(100);
const RECORDER_ID = BigInt(101);
const OUTSIDER_ID = BigInt(102);
const RECORDER_ADMIN_ID = BigInt(103);
const SUPER_ADMIN_ID = BigInt(104);

interface SetupOpts {
  /** prisma.tournamentMatch.findUnique 결과 — null 이면 404 분기 */
  match: { tournamentId: string } | null;
  /** verifyToken 결과 — null 이면 JWT 폴백 (API token 분기로 진입) */
  payload: {
    sub: string;
    email?: string;
    name?: string;
    role: string;
    admin_role?: string;
  } | null;
  /** prisma.tournament.findFirst (organizer 확인) 결과 */
  organizer?: { id: string } | null;
  /** prisma.tournament_recorders.findFirst (recorder 확인) 결과 */
  recorder?: { id: bigint } | null;
  /** prisma.tournament.findUnique (apiToken 폴백) 결과 */
  tournamentForApiToken?: { apiToken: string | null; organizerId: bigint } | null;
}

function setupMocks(opts: SetupOpts) {
  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      tournamentMatch: {
        findUnique: vi.fn().mockResolvedValue(opts.match),
      },
      tournament: {
        // organizer 확인 (findFirst) + apiToken 폴백 (findUnique) 양쪽 박제
        findFirst: vi.fn().mockResolvedValue(opts.organizer ?? null),
        findUnique: vi.fn().mockResolvedValue(opts.tournamentForApiToken ?? null),
      },
      tournament_recorders: {
        findFirst: vi.fn().mockResolvedValue(opts.recorder ?? null),
      },
    },
  }));

  vi.doMock("@/lib/auth/jwt", () => ({
    verifyToken: vi.fn().mockResolvedValue(opts.payload),
  }));

  // extractToken 은 req.headers.get("authorization") 직접 호출 — mock 불필요
  // (테스트 req 에 Bearer 토큰 명시)
}

function makeReq(token: string = "test-token"): NextRequest {
  // NextRequest 는 URL 생성자 호출 시 절대 URL 필요
  return new NextRequest("http://localhost/api/v1/matches/100/events", {
    headers: { authorization: `Bearer ${token}` },
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("requireRecorder — 권한 매트릭스 (PR1)", () => {
  it("1) 일반 recorder (tournament_recorders 활성) + 본인 배정 대회 → 통과 (회귀 0)", async () => {
    setupMocks({
      match: { tournamentId: TOURNAMENT_ID },
      payload: {
        sub: RECORDER_ID.toString(),
        role: "free", // recorder 는 별도 role 없음 — DB tournament_recorders 로만 판정
      },
      organizer: null, // organizer 아님
      recorder: { id: BigInt(1) }, // tournament_recorders 활성 row 있음
    });
    const { requireRecorder } = await import("@/lib/auth/require-recorder");
    const result = await requireRecorder(makeReq(), MATCH_ID);
    // 통과 시 RecorderContext 반환 ({ userId, tournamentId, matchId })
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("tournamentId", TOURNAMENT_ID);
  });

  it("2) 일반 recorder + 다른 대회 매치 (tournament_recorders 미등록) → forbidden (회귀 0)", async () => {
    setupMocks({
      match: { tournamentId: TOURNAMENT_ID },
      payload: {
        sub: OUTSIDER_ID.toString(),
        role: "free",
      },
      organizer: null,
      recorder: null, // tournament_recorders row 없음 → 차단
    });
    const { requireRecorder } = await import("@/lib/auth/require-recorder");
    const result = await requireRecorder(makeReq(), MATCH_ID);
    // forbidden 응답 = NextResponse 인스턴스 (status 403)
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(403);
    }
  });

  it("3) organizer 본인 → 통과 (회귀 0)", async () => {
    setupMocks({
      match: { tournamentId: TOURNAMENT_ID },
      payload: {
        sub: ORGANIZER_ID.toString(),
        role: "tournament_admin",
      },
      organizer: { id: TOURNAMENT_ID }, // organizer 본인 → 즉시 통과
      recorder: null, // organizer 통과 시 recorder SELECT 미발생
    });
    const { requireRecorder } = await import("@/lib/auth/require-recorder");
    const result = await requireRecorder(makeReq(), MATCH_ID);
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("tournamentId", TOURNAMENT_ID);
  });

  it("4) super_admin (payload.role='super_admin') → 모든 대회 통과 (회귀 0)", async () => {
    setupMocks({
      match: { tournamentId: TOURNAMENT_ID },
      payload: {
        sub: SUPER_ADMIN_ID.toString(),
        role: "super_admin", // 즉시 통과 — DB 조회 skip
      },
      // organizer / recorder SELECT 자체 발생 안 함
    });
    const { requireRecorder } = await import("@/lib/auth/require-recorder");
    const result = await requireRecorder(makeReq(), MATCH_ID);
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("tournamentId", TOURNAMENT_ID);
  });

  it("5) NEW PR1 — recorder_admin (payload.admin_role='recorder_admin') → 모든 대회 통과", async () => {
    setupMocks({
      match: { tournamentId: TOURNAMENT_ID },
      payload: {
        sub: RECORDER_ADMIN_ID.toString(),
        role: "free", // 일반 사용자 role
        admin_role: "recorder_admin", // 전역 기록원 관리자 박제
      },
      // organizer / recorder SELECT 자체 발생 안 함 (즉시 통과 분기)
    });
    const { requireRecorder } = await import("@/lib/auth/require-recorder");
    const result = await requireRecorder(makeReq(), MATCH_ID);
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("tournamentId", TOURNAMENT_ID);
  });

  it("6) NEW PR1 — recorder_admin + tournament_recorders 미등록 → 여전히 통과 (전역 권한)", async () => {
    // 핵심: tournament_recorders row 없어도 (organizer 아니어도) recorder_admin = 통과
    setupMocks({
      match: { tournamentId: TOURNAMENT_ID },
      payload: {
        sub: RECORDER_ADMIN_ID.toString(),
        role: "free",
        admin_role: "recorder_admin",
      },
      organizer: null,
      recorder: null, // 본인 배정 대회 아니어도 통과
    });
    const { requireRecorder } = await import("@/lib/auth/require-recorder");
    const result = await requireRecorder(makeReq(), MATCH_ID);
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("tournamentId", TOURNAMENT_ID);
  });

  it("7) 토큰 없음 → unauthorized", async () => {
    setupMocks({
      match: { tournamentId: TOURNAMENT_ID },
      payload: null,
    });
    const { requireRecorder } = await import("@/lib/auth/require-recorder");
    // 토큰 없는 req — authorization 헤더 미설정
    const reqWithoutToken = new NextRequest("http://localhost/api/v1/matches/100/events");
    const result = await requireRecorder(reqWithoutToken, MATCH_ID);
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(401);
    }
  });

  it("8) 매치 없음 → notFound", async () => {
    setupMocks({
      match: null, // tournamentMatch.findUnique → null
      payload: {
        sub: RECORDER_ID.toString(),
        role: "free",
      },
    });
    const { requireRecorder } = await import("@/lib/auth/require-recorder");
    const result = await requireRecorder(makeReq(), MATCH_ID);
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(404);
    }
  });
});
