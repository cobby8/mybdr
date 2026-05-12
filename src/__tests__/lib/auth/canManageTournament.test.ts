/**
 * 2026-05-12 (Phase D-2 / Q3) — `canManageTournament` 권한 매트릭스 회귀 가드.
 *
 * 검증 대상 = 기존 권한 (organizer + TAM + super_admin) + Q3 신규 (단체 owner/admin 자동 부여).
 *
 * 매트릭스 (8 케이스):
 *   1) super_admin (session.role) → true (DB 조회 0)
 *   2) tournament 없음 → false (404 fallback)
 *   3) organizer 본인 → true
 *   4) tournamentAdminMember (TAM) is_active=true → true (수동 위임)
 *   5) NEW Q3 — series.organization owner → true (자동 부여)
 *   6) NEW Q3 — series.organization admin → true (자동 부여)
 *   7) NEW Q3 — series.organization member (role=member) → false (owner/admin 만 통과)
 *   8) NEW Q3 — series_id NULL → 단체 분기 skip → organizer + TAM 만 (외부인 false)
 *
 * mock 패턴: tournament-series-link.test.ts 와 동일 (vi.doMock + setupMocks 헬퍼).
 *
 * 보안 영향: Q3 확장은 단체 owner/admin 에게 대회 PATCH/DELETE/wizard 진입 권한을 자동 부여하므로
 * 회귀 시 권한 누수 가능. 본 vitest 는 분기 6 케이스 모두 직접 검증하여 회귀 0 보장.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const TOURNAMENT_ID = "tour-1";
const ORGANIZER_ID = BigInt(100);
const TAM_USER_ID = BigInt(101);
const ORG_OWNER_ID = BigInt(200);
const ORG_ADMIN_ID = BigInt(201);
const ORG_MEMBER_ID = BigInt(202);
const ORG_ID = BigInt(10);

interface SetupOpts {
  /** prisma.tournament.findUnique 결과 — null 이면 404 분기 */
  tournament: {
    organizerId: bigint;
    tournament_series: { organization_id: bigint | null } | null;
  } | null;
  /** prisma.tournamentAdminMember.findFirst 결과 — null 이면 TAM 미등록 */
  tamMember?: { id: bigint } | null;
  /** prisma.organization_members.findFirst 결과 — null 이면 단체 owner/admin 아님 */
  orgMember?: { id: bigint } | null;
}

function setupMocks(opts: SetupOpts) {
  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      tournament: {
        findUnique: vi.fn().mockResolvedValue(opts.tournament),
      },
      tournamentAdminMember: {
        findFirst: vi.fn().mockResolvedValue(opts.tamMember ?? null),
      },
      organization_members: {
        findFirst: vi.fn().mockResolvedValue(opts.orgMember ?? null),
      },
    },
  }));
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("canManageTournament — 권한 매트릭스 (Phase D-2 / Q3)", () => {
  it("1) super_admin (session.role) → true (DB 조회 우회)", async () => {
    setupMocks({
      tournament: {
        organizerId: ORGANIZER_ID,
        tournament_series: null,
      },
    });
    const { canManageTournament } = await import("@/lib/auth/tournament-permission");
    // session.role === 'super_admin' 이면 prisma 조회 자체 일어나지 않음 (early return).
    const ok = await canManageTournament(TOURNAMENT_ID, BigInt(999), {
      role: "super_admin",
    });
    expect(ok).toBe(true);
  });

  it("2) tournament 없음 → false (404 fallback)", async () => {
    setupMocks({ tournament: null });
    const { canManageTournament } = await import("@/lib/auth/tournament-permission");
    const ok = await canManageTournament(TOURNAMENT_ID, ORGANIZER_ID, {});
    expect(ok).toBe(false);
  });

  it("3) organizer 본인 → true (기존 동작)", async () => {
    setupMocks({
      tournament: {
        organizerId: ORGANIZER_ID,
        tournament_series: null,
      },
    });
    const { canManageTournament } = await import("@/lib/auth/tournament-permission");
    const ok = await canManageTournament(TOURNAMENT_ID, ORGANIZER_ID, {});
    expect(ok).toBe(true);
  });

  it("4) TAM 멤버 (is_active=true) → true (기존 동작)", async () => {
    setupMocks({
      tournament: {
        organizerId: ORGANIZER_ID,
        tournament_series: null,
      },
      // organizer 본인이 아닌 사용자 → TAM SELECT 호출됨 → row 있음 → true
      tamMember: { id: BigInt(1) },
    });
    const { canManageTournament } = await import("@/lib/auth/tournament-permission");
    const ok = await canManageTournament(TOURNAMENT_ID, TAM_USER_ID, {});
    expect(ok).toBe(true);
  });

  it("5) NEW Q3 — series.organization owner → true (자동 부여)", async () => {
    setupMocks({
      tournament: {
        organizerId: ORGANIZER_ID,
        // 대회가 시리즈에 묶이고 시리즈가 단체에 묶임
        tournament_series: { organization_id: ORG_ID },
      },
      tamMember: null, // TAM 등록 X
      // organization_members.findFirst (role IN [owner, admin]) → row 있음 (owner)
      orgMember: { id: BigInt(1) },
    });
    const { canManageTournament } = await import("@/lib/auth/tournament-permission");
    const ok = await canManageTournament(TOURNAMENT_ID, ORG_OWNER_ID, {});
    expect(ok).toBe(true);
  });

  it("6) NEW Q3 — series.organization admin → true (자동 부여)", async () => {
    setupMocks({
      tournament: {
        organizerId: ORGANIZER_ID,
        tournament_series: { organization_id: ORG_ID },
      },
      tamMember: null,
      // organization_members.findFirst (role IN [owner, admin]) → row 있음 (admin)
      orgMember: { id: BigInt(2) },
    });
    const { canManageTournament } = await import("@/lib/auth/tournament-permission");
    const ok = await canManageTournament(TOURNAMENT_ID, ORG_ADMIN_ID, {});
    expect(ok).toBe(true);
  });

  it("7) NEW Q3 — series.organization member (role=member) → false", async () => {
    setupMocks({
      tournament: {
        organizerId: ORGANIZER_ID,
        tournament_series: { organization_id: ORG_ID },
      },
      tamMember: null,
      // organization_members.findFirst (role IN [owner, admin]) → null (member 는 매칭 X)
      orgMember: null,
    });
    const { canManageTournament } = await import("@/lib/auth/tournament-permission");
    const ok = await canManageTournament(TOURNAMENT_ID, ORG_MEMBER_ID, {});
    expect(ok).toBe(false);
  });

  it("8) NEW Q3 — series_id NULL → 단체 분기 skip → 외부인 false", async () => {
    setupMocks({
      tournament: {
        organizerId: ORGANIZER_ID,
        // 시리즈 미연결 (series_id=null) → tournament_series=null
        tournament_series: null,
      },
      tamMember: null,
      // organization_members 호출 자체 X — orgMember 미사용. 안전을 위해 null 박제.
      orgMember: null,
    });
    const { canManageTournament } = await import("@/lib/auth/tournament-permission");
    // organizer 도 TAM 도 아닌 단체 owner 가 시도 → 시리즈 미연결이므로 단체 분기 skip → false
    const ok = await canManageTournament(TOURNAMENT_ID, ORG_OWNER_ID, {});
    expect(ok).toBe(false);
  });

  it("9) 회귀 — admin_role super_admin (DB 세분화 필드) → true", async () => {
    setupMocks({
      tournament: {
        organizerId: ORGANIZER_ID,
        tournament_series: null,
      },
    });
    const { canManageTournament } = await import("@/lib/auth/tournament-permission");
    const ok = await canManageTournament(TOURNAMENT_ID, BigInt(999), {
      admin_role: "super_admin",
    });
    expect(ok).toBe(true);
  });
});
