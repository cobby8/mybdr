/**
 * 2026-05-11 — Phase 1-B-2 권한 헬퍼 회귀 방지.
 *
 * 검증 매트릭스 (planner-architect §보안·운영 가드 / 사용자 결재):
 *   1. 익명 (web 세션 없음) → 401
 *   2. 매치 미존재 → 404
 *   3. super_admin → 통과
 *   4. organizer (tournament.organizerId === userId) → 통과
 *   5. tournamentAdminMember(isActive=true) → 통과
 *   6. tournament_recorders ∋ userId → 통과
 *   7. 일반 user → 403
 *   8. JWT 살아있지만 DB user 없음 → 401 USER_NOT_FOUND
 *
 * DB mock — vi.doMock 으로 prisma 격리 (match-sync.test.ts 패턴 동일).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const MATCH_ID = BigInt(500);
const TOURNAMENT_ID = "t-uuid-abc";

function setupMocks(opts: {
  session: { sub: string; role?: string; admin_role?: string } | null;
  match:
    | {
        id: bigint;
        tournamentId: string;
        homeTeamId: bigint | null;
        awayTeamId: bigint | null;
        winner_team_id: bigint | null;
        status: string | null;
        settings: unknown;
        homeScore: number | null;
        awayScore: number | null;
        roundName: string | null;
        round_number: number | null;
        match_number: number | null;
        scheduledAt: Date | null;
        court_number: string | null;
        venue_id: bigint | null;
        quarterScores: unknown;
        notes: string | null;
        match_code: string | null;
        tournament: {
          id: string;
          name: string | null;
          organizerId: bigint | null;
          format: string | null;
        };
      }
    | null;
  user: { id: bigint; nickname: string | null } | null;
  adminMember?: { id: bigint } | null;
  recorder?: { id: bigint } | null;
}) {
  vi.doMock("@/lib/auth/web-session", () => ({
    getWebSession: vi.fn().mockResolvedValue(opts.session),
  }));
  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      tournamentMatch: {
        findUnique: vi.fn().mockResolvedValue(opts.match),
      },
      tournamentAdminMember: {
        findFirst: vi.fn().mockResolvedValue(opts.adminMember ?? null),
      },
      tournament_recorders: {
        findFirst: vi.fn().mockResolvedValue(opts.recorder ?? null),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(opts.user),
      },
    },
  }));
}

const VALID_MATCH = {
  id: MATCH_ID,
  tournamentId: TOURNAMENT_ID,
  homeTeamId: BigInt(11),
  awayTeamId: BigInt(22),
  winner_team_id: null,
  status: "in_progress",
  settings: { recording_mode: "paper" },
  homeScore: 50,
  awayScore: 48,
  roundName: "결승",
  round_number: 4,
  match_number: 1,
  scheduledAt: new Date("2026-05-10T14:30:00Z"),
  court_number: "1",
  venue_id: null,
  quarterScores: null,
  notes: null,
  match_code: "26-GG-MD21-027",
  tournament: {
    id: TOURNAMENT_ID,
    name: "테스트 대회",
    organizerId: BigInt(999),
    format: "single_elimination",
  },
};

describe("requireScoreSheetAccess — 권한 매트릭스 (1B-2)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("익명 (세션 없음) → 401 UNAUTHORIZED", async () => {
    setupMocks({ session: null, match: VALID_MATCH, user: null });
    const { requireScoreSheetAccess } = await import(
      "@/lib/auth/require-score-sheet-access"
    );
    const result = await requireScoreSheetAccess(MATCH_ID);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });

  it("매치 미존재 → 404 MATCH_NOT_FOUND", async () => {
    setupMocks({
      session: { sub: "100" },
      match: null,
      user: null,
    });
    const { requireScoreSheetAccess } = await import(
      "@/lib/auth/require-score-sheet-access"
    );
    const result = await requireScoreSheetAccess(MATCH_ID);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(404);
    }
  });

  it("super_admin → 통과", async () => {
    setupMocks({
      session: { sub: "1", role: "super_admin" },
      match: VALID_MATCH,
      user: { id: BigInt(1), nickname: "관리자" },
    });
    const { requireScoreSheetAccess } = await import(
      "@/lib/auth/require-score-sheet-access"
    );
    const result = await requireScoreSheetAccess(MATCH_ID);
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.user.nickname).toBe("관리자");
      expect(result.match.id).toBe(MATCH_ID);
      expect(result.tournament.id).toBe(TOURNAMENT_ID);
    }
  });

  it("organizer (tournament.organizerId === userId) → 통과", async () => {
    // organizerId = 999 / userId = 999 일치
    setupMocks({
      session: { sub: "999" },
      match: VALID_MATCH,
      user: { id: BigInt(999), nickname: "주최자" },
    });
    const { requireScoreSheetAccess } = await import(
      "@/lib/auth/require-score-sheet-access"
    );
    const result = await requireScoreSheetAccess(MATCH_ID);
    expect("error" in result).toBe(false);
  });

  it("tournamentAdminMember(isActive=true) → 통과", async () => {
    setupMocks({
      session: { sub: "200" },
      match: VALID_MATCH,
      user: { id: BigInt(200), nickname: "운영자" },
      adminMember: { id: BigInt(7) },
    });
    const { requireScoreSheetAccess } = await import(
      "@/lib/auth/require-score-sheet-access"
    );
    const result = await requireScoreSheetAccess(MATCH_ID);
    expect("error" in result).toBe(false);
  });

  it("tournament_recorders ∋ userId → 통과", async () => {
    setupMocks({
      session: { sub: "300" },
      match: VALID_MATCH,
      user: { id: BigInt(300), nickname: "기록원" },
      recorder: { id: BigInt(13) },
    });
    const { requireScoreSheetAccess } = await import(
      "@/lib/auth/require-score-sheet-access"
    );
    const result = await requireScoreSheetAccess(MATCH_ID);
    expect("error" in result).toBe(false);
  });

  it("일반 user (어느 권한 그룹도 아님) → 403 FORBIDDEN", async () => {
    setupMocks({
      session: { sub: "777" },
      match: VALID_MATCH,
      user: { id: BigInt(777), nickname: "일반인" },
      // adminMember 와 recorder 모두 null (기본값)
    });
    const { requireScoreSheetAccess } = await import(
      "@/lib/auth/require-score-sheet-access"
    );
    const result = await requireScoreSheetAccess(MATCH_ID);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(403);
    }
  });

  it("JWT 살아있지만 DB user 없음 → 401 USER_NOT_FOUND", async () => {
    setupMocks({
      session: { sub: "1", role: "super_admin" }, // 권한 자체는 통과
      match: VALID_MATCH,
      user: null, // user SELECT 결과 없음
    });
    const { requireScoreSheetAccess } = await import(
      "@/lib/auth/require-score-sheet-access"
    );
    const result = await requireScoreSheetAccess(MATCH_ID);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });
});
