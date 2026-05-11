/**
 * 2026-05-11 — admin 마이페이지 Phase 1 — `getAdminRoles()` 회귀 방지.
 *
 * 검증 매트릭스 (planner-architect §admin/me / 사용자 결재 §6):
 *   1. 익명 세션 (session=null) → 모든 boolean false / 모든 리스트 비어있음
 *   2. super_admin (session.role) → superAdmin=true / roles ⊇ ["super_admin"]
 *   3. site_admin (session.admin_role) → siteAdmin=true / roles ⊇ ["site_admin"]
 *   4. tournament_admin (session.role) → tournamentAdmin=true / roles ⊇ ["tournament_admin"]
 *   5. tournamentAdminMembers 리스트 → tam JOIN tournament.name 매핑
 *   6. tournament_recorders 리스트 → recorder JOIN tournament.name 매핑
 *   7. partner_member 단일 → partner JOIN partners.name 매핑
 *   8. org_member 단일 → org JOIN organizations.name 매핑
 *   9. super_admin 일 때 partner/org 가 있어도 roles 배열에는 push 안 함 (AdminLayout 원본 로직 보존)
 *   10. DB SELECT 실패 → 안전 폴백 (boolean 만 유지, 리스트/멤버 empty)
 *
 * DB mock — vi.doMock 으로 prisma 격리 (require-score-sheet-access.test.ts 패턴 동일).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const USER_ID = BigInt(100);

interface TamRow {
  tournamentId: string;
  role: string;
  tournament: { name: string | null } | null;
}
interface RecorderRow {
  tournamentId: string;
  tournament: { name: string | null } | null;
}
interface PartnerRow {
  partner_id: bigint;
  role: string;
  partner: { name: string } | null;
}
interface OrgRow {
  organization_id: bigint;
  role: string;
  organization: { name: string } | null;
}

function setupMocks(opts: {
  tamRows?: TamRow[];
  recorderRows?: RecorderRow[];
  partnerRow?: PartnerRow | null;
  orgRow?: OrgRow | null;
  // DB SELECT 실패 시나리오용 — true 면 findMany/findFirst 모두 throw
  dbFails?: boolean;
}) {
  const makeMock = <T,>(value: T) =>
    opts.dbFails
      ? vi.fn().mockRejectedValue(new Error("DB unavailable"))
      : vi.fn().mockResolvedValue(value);

  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      tournamentAdminMember: {
        findMany: makeMock(opts.tamRows ?? []),
      },
      tournament_recorders: {
        findMany: makeMock(opts.recorderRows ?? []),
      },
      partner_members: {
        findFirst: makeMock(opts.partnerRow ?? null),
      },
      organization_members: {
        findFirst: makeMock(opts.orgRow ?? null),
      },
    },
  }));
  // get-auth-user 는 admin-roles 가 import 만 하고 직접 호출 X (getAdminRolesFromAuth 만 호출).
  // 본 테스트는 getAdminRoles 직접 호출 → get-auth-user mock 불필요. 단 import 그래프 깨지지
  // 않게 빈 모듈로 mock.
  vi.doMock("@/lib/auth/get-auth-user", () => ({
    getAuthUser: vi.fn(),
  }));
}

describe("getAdminRoles — admin 권한 매트릭스 헬퍼 (admin 마이페이지 Phase 1)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("(1) 익명 세션 (session=null) → 모든 boolean false / 리스트 empty", async () => {
    setupMocks({});
    const { getAdminRoles } = await import("@/lib/auth/admin-roles");
    const summary = await getAdminRoles(USER_ID, null);
    expect(summary.superAdmin).toBe(false);
    expect(summary.siteAdmin).toBe(false);
    expect(summary.tournamentAdmin).toBe(false);
    expect(summary.tournamentAdminMembers).toEqual([]);
    expect(summary.tournamentRecorders).toEqual([]);
    expect(summary.partnerMember).toBeNull();
    expect(summary.orgMember).toBeNull();
    expect(summary.roles).toEqual([]);
  });

  it("(2) super_admin (session.role) → superAdmin=true / roles 포함", async () => {
    setupMocks({});
    const { getAdminRoles } = await import("@/lib/auth/admin-roles");
    const summary = await getAdminRoles(USER_ID, { role: "super_admin" });
    expect(summary.superAdmin).toBe(true);
    expect(summary.roles).toContain("super_admin");
  });

  it("(3) site_admin (session.admin_role) → siteAdmin=true / roles 포함", async () => {
    setupMocks({});
    const { getAdminRoles } = await import("@/lib/auth/admin-roles");
    const summary = await getAdminRoles(USER_ID, {
      role: "free",
      admin_role: "site_admin",
    });
    expect(summary.siteAdmin).toBe(true);
    expect(summary.roles).toContain("site_admin");
  });

  it("(4) tournament_admin (session.role) → tournamentAdmin=true / roles 포함", async () => {
    setupMocks({});
    const { getAdminRoles } = await import("@/lib/auth/admin-roles");
    const summary = await getAdminRoles(USER_ID, { role: "tournament_admin" });
    expect(summary.tournamentAdmin).toBe(true);
    expect(summary.roles).toContain("tournament_admin");
  });

  it("(5) tournamentAdminMembers — JOIN tournament.name 매핑", async () => {
    setupMocks({
      tamRows: [
        {
          tournamentId: "t-uuid-1",
          role: "admin",
          tournament: { name: "강남구협회장배" },
        },
        {
          tournamentId: "t-uuid-2",
          role: "manager",
          tournament: { name: null }, // null name 안전 처리
        },
      ],
    });
    const { getAdminRoles } = await import("@/lib/auth/admin-roles");
    const summary = await getAdminRoles(USER_ID, { role: "free" });
    expect(summary.tournamentAdminMembers).toHaveLength(2);
    expect(summary.tournamentAdminMembers[0]).toEqual({
      tournamentId: "t-uuid-1",
      tournamentName: "강남구협회장배",
      role: "admin",
    });
    expect(summary.tournamentAdminMembers[1].tournamentName).toBeNull();
    expect(summary.tournamentAdminMembers[1].role).toBe("manager");
  });

  it("(6) tournament_recorders — JOIN tournament.name 매핑", async () => {
    setupMocks({
      recorderRows: [
        {
          tournamentId: "t-uuid-3",
          tournament: { name: "열혈최강전" },
        },
      ],
    });
    const { getAdminRoles } = await import("@/lib/auth/admin-roles");
    const summary = await getAdminRoles(USER_ID, { role: "free" });
    expect(summary.tournamentRecorders).toHaveLength(1);
    expect(summary.tournamentRecorders[0]).toEqual({
      tournamentId: "t-uuid-3",
      tournamentName: "열혈최강전",
    });
  });

  it("(7) partner_member 단일 — JOIN partners.name 매핑", async () => {
    setupMocks({
      partnerRow: {
        partner_id: BigInt(42),
        role: "owner",
        partner: { name: "엠바고스포츠" },
      },
    });
    const { getAdminRoles } = await import("@/lib/auth/admin-roles");
    const summary = await getAdminRoles(USER_ID, { role: "free" });
    expect(summary.partnerMember).toEqual({
      partnerId: "42",
      partnerName: "엠바고스포츠",
      role: "owner",
    });
    // super_admin 이 아니므로 roles 에 partner_member 포함
    expect(summary.roles).toContain("partner_member");
  });

  it("(8) org_member 단일 — JOIN organizations.name 매핑", async () => {
    setupMocks({
      orgRow: {
        organization_id: BigInt(77),
        role: "admin",
        organization: { name: "서울농구협회" },
      },
    });
    const { getAdminRoles } = await import("@/lib/auth/admin-roles");
    const summary = await getAdminRoles(USER_ID, { role: "free" });
    expect(summary.orgMember).toEqual({
      organizationId: "77",
      organizationName: "서울농구협회",
      role: "admin",
    });
    // super_admin 이 아니므로 roles 에 org_member 포함
    expect(summary.roles).toContain("org_member");
  });

  it("(9) super_admin + partner/org 가 있어도 roles 에 partner/org push 안 함 (AdminLayout 원본 로직 보존)", async () => {
    setupMocks({
      partnerRow: {
        partner_id: BigInt(1),
        role: "owner",
        partner: { name: "P" },
      },
      orgRow: {
        organization_id: BigInt(2),
        role: "admin",
        organization: { name: "O" },
      },
    });
    const { getAdminRoles } = await import("@/lib/auth/admin-roles");
    const summary = await getAdminRoles(USER_ID, { role: "super_admin" });
    expect(summary.superAdmin).toBe(true);
    // partner/org 데이터 자체는 표시용으로 유지
    expect(summary.partnerMember).not.toBeNull();
    expect(summary.orgMember).not.toBeNull();
    // 그러나 roles 배열 (메뉴 필터 source) 에는 partner_member / org_member push 안 됨
    expect(summary.roles).toContain("super_admin");
    expect(summary.roles).not.toContain("partner_member");
    expect(summary.roles).not.toContain("org_member");
  });

  it("(10) DB SELECT 실패 → 안전 폴백 (boolean 유지 + 리스트/멤버 empty)", async () => {
    setupMocks({ dbFails: true });
    const { getAdminRoles } = await import("@/lib/auth/admin-roles");
    const summary = await getAdminRoles(USER_ID, {
      role: "super_admin",
      admin_role: "site_admin",
    });
    // JWT 기반 boolean 은 유지
    expect(summary.superAdmin).toBe(true);
    expect(summary.siteAdmin).toBe(true);
    // DB 실패 → 리스트/멤버 empty
    expect(summary.tournamentAdminMembers).toEqual([]);
    expect(summary.tournamentRecorders).toEqual([]);
    expect(summary.partnerMember).toBeNull();
    expect(summary.orgMember).toBeNull();
    // roles 배열은 boolean 기반 권한 (super/site) 만 포함
    expect(summary.roles).toContain("super_admin");
    expect(summary.roles).toContain("site_admin");
  });
});
