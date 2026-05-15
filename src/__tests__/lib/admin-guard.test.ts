/**
 * 2026-05-11 Phase 1-B — admin-guard.ts (referee/admin 인증 + 12 permission) 회귀 방지.
 * 2026-05-15 PR3 — recorder_admin sentinel 분기 추가 (Q2 결재 = 옵션 A 협회 12 permission 전체 통과).
 *
 * 검증 매트릭스 (planner-architect §Phase 1-B / 사용자 결재 §1 옵션 (c) sentinel):
 *   sentinel 분기 (super_admin):
 *     1. super_admin + AssociationAdmin row 존재 → sentinel role + 첫 활성 협회 자동 선택
 *     2. super_admin + 협회 매핑 없음 + Association row 있음 → sentinel role + 첫 협회 fallback
 *     3. super_admin + 협회 0개 운영 → sentinel role + associationId=0n
 *     4. super_admin admin_role 만 (role=free) → sentinel 통과 (admin_role super_admin)
 *
 *   hasPermission sentinel 자동 통과 (12 permission 모두):
 *     5. sentinel role + referee_manage → true
 *     6. sentinel role + settlement_manage → true
 *     7. sentinel role + document_print → true (가장 제한적 — sg 만)
 *     8. sentinel role + 모든 12 permission → true (반복 검증)
 *
 *   일반 association_admin 보존:
 *     9. 일반 association_admin + 매핑 존재 → AdminGuardResult role (sg/refchief 등)
 *     10. 일반 user (admin_role 미설정) → null
 *     11. association_admin + 매핑 없음 → null
 *     12. session 없음 → null
 *
 *   isExecutive sentinel:
 *     13. sentinel role → isExecutive false (super_admin = 임원 아님)
 *
 *   requirePermission sentinel:
 *     14. sentinel role + 모든 permission → null (통과)
 *
 *   PR3 recorder_admin sentinel (2026-05-15):
 *     15. recorder_admin + AssociationAdmin row 존재 → sentinel role + 첫 활성 협회 자동 선택
 *     16. recorder_admin + 협회 0개 운영 → sentinel role + associationId=0n
 *     17. recorder_admin 단독 (User.admin_role="recorder_admin") + 매핑 없음 → sentinel 통과 (admin_role 검증 skip)
 *     18. recorder_admin + 모든 12 permission → true (sentinel 흡수 — Q2 옵션 A)
 *     19. recorder_admin 도 admin_role="recorder_admin" (role=free) 케이스 회귀 가드
 *
 * DB mock — vi.doMock 으로 prisma + getWebSession 격리.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const SUPER_ADMIN_USER_ID = "1";
const REGULAR_USER_ID = "100";

function setupMocks(opts: {
  session: { sub: string; role?: string; admin_role?: string } | null;
  // super_admin 경로 — 협회 admin 첫 매핑 (없을 수도)
  firstAssociationAdmin?: { association_id: bigint } | null;
  // super_admin 경로 — Association 첫 row (협회 admin 0건 fallback)
  firstAssociation?: { id: bigint } | null;
  // 일반 user 경로 — User.admin_role
  user?: { admin_role: string | null } | null;
  // 일반 association_admin 매핑
  adminMapping?: { association_id: bigint; role: string } | null;
}) {
  vi.doMock("@/lib/auth/web-session", () => ({
    getWebSession: vi.fn().mockResolvedValue(opts.session),
  }));
  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      associationAdmin: {
        findFirst: vi
          .fn()
          .mockResolvedValue(opts.firstAssociationAdmin ?? null),
        findUnique: vi.fn().mockResolvedValue(opts.adminMapping ?? null),
      },
      association: {
        findFirst: vi.fn().mockResolvedValue(opts.firstAssociation ?? null),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(opts.user ?? null),
      },
    },
  }));
}

describe("admin-guard.ts — Phase 1-B super_admin sentinel + 12 permission", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────
  // getAssociationAdmin — sentinel 분기 (super_admin)
  // ──────────────────────────────────────────────────────────

  it("(1) super_admin + AssociationAdmin row 존재 → sentinel role + 첫 활성 협회 자동 선택", async () => {
    setupMocks({
      session: { sub: SUPER_ADMIN_USER_ID, role: "super_admin" },
      firstAssociationAdmin: { association_id: BigInt(42) },
    });
    const { getAssociationAdmin, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    const result = await getAssociationAdmin();
    expect(result).not.toBeNull();
    expect(result!.role).toBe(SUPER_ADMIN_SENTINEL_ROLE);
    expect(result!.associationId).toBe(BigInt(42));
    expect(result!.userId).toBe(BigInt(SUPER_ADMIN_USER_ID));
  });

  it("(2) super_admin + 협회 매핑 0 + Association 첫 row → sentinel + 협회 fallback", async () => {
    setupMocks({
      session: { sub: SUPER_ADMIN_USER_ID, role: "super_admin" },
      firstAssociationAdmin: null,
      firstAssociation: { id: BigInt(99) },
    });
    const { getAssociationAdmin, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    const result = await getAssociationAdmin();
    expect(result!.role).toBe(SUPER_ADMIN_SENTINEL_ROLE);
    expect(result!.associationId).toBe(BigInt(99));
  });

  it("(3) super_admin + 협회 0개 운영 → sentinel + associationId=0n", async () => {
    setupMocks({
      session: { sub: SUPER_ADMIN_USER_ID, role: "super_admin" },
      firstAssociationAdmin: null,
      firstAssociation: null,
    });
    const { getAssociationAdmin, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    const result = await getAssociationAdmin();
    expect(result!.role).toBe(SUPER_ADMIN_SENTINEL_ROLE);
    expect(result!.associationId).toBe(BigInt(0));
  });

  it("(4) super_admin admin_role only (role=free) → sentinel 통과", async () => {
    setupMocks({
      session: {
        sub: SUPER_ADMIN_USER_ID,
        role: "free",
        admin_role: "super_admin",
      },
      firstAssociationAdmin: { association_id: BigInt(5) },
    });
    const { getAssociationAdmin, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    const result = await getAssociationAdmin();
    expect(result!.role).toBe(SUPER_ADMIN_SENTINEL_ROLE);
    expect(result!.associationId).toBe(BigInt(5));
  });

  // ──────────────────────────────────────────────────────────
  // hasPermission — sentinel 자동 통과 (12 permission)
  // ──────────────────────────────────────────────────────────

  it("(5) sentinel role + referee_manage → true", async () => {
    setupMocks({ session: null });
    const { hasPermission, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    expect(hasPermission(SUPER_ADMIN_SENTINEL_ROLE, "referee_manage")).toBe(
      true,
    );
  });

  it("(6) sentinel role + settlement_manage → true (sg 만 허용 권한도 통과)", async () => {
    setupMocks({ session: null });
    const { hasPermission, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    expect(hasPermission(SUPER_ADMIN_SENTINEL_ROLE, "settlement_manage")).toBe(
      true,
    );
  });

  it("(7) sentinel role + document_print → true (sg only 가장 제한적)", async () => {
    setupMocks({ session: null });
    const { hasPermission, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    expect(hasPermission(SUPER_ADMIN_SENTINEL_ROLE, "document_print")).toBe(
      true,
    );
  });

  it("(8) sentinel role + 모든 12 permission → true (반복 가드)", async () => {
    setupMocks({ session: null });
    const { hasPermission, PERMISSIONS, SUPER_ADMIN_SENTINEL_ROLE } =
      await import("@/lib/auth/admin-guard");
    const allPermissions = Object.keys(PERMISSIONS) as Array<
      keyof typeof PERMISSIONS
    >;
    expect(allPermissions.length).toBe(12); // 12 permission 매트릭스 보장
    for (const p of allPermissions) {
      expect(hasPermission(SUPER_ADMIN_SENTINEL_ROLE, p)).toBe(true);
    }
  });

  // ──────────────────────────────────────────────────────────
  // 일반 association_admin 보존 (회귀 가드)
  // ──────────────────────────────────────────────────────────

  it("(9) 일반 association_admin + 매핑 존재 → AdminGuardResult (role 보존)", async () => {
    setupMocks({
      session: { sub: REGULAR_USER_ID, role: "free" },
      user: { admin_role: "association_admin" },
      adminMapping: { association_id: BigInt(7), role: "secretary_general" },
    });
    const { getAssociationAdmin } = await import("@/lib/auth/admin-guard");
    const result = await getAssociationAdmin();
    expect(result).not.toBeNull();
    expect(result!.role).toBe("secretary_general");
    expect(result!.associationId).toBe(BigInt(7));
    expect(result!.userId).toBe(BigInt(REGULAR_USER_ID));
  });

  it("(10) 일반 user (admin_role 미설정) → null", async () => {
    setupMocks({
      session: { sub: REGULAR_USER_ID, role: "free" },
      user: { admin_role: null },
    });
    const { getAssociationAdmin } = await import("@/lib/auth/admin-guard");
    const result = await getAssociationAdmin();
    expect(result).toBeNull();
  });

  it("(11) association_admin + 매핑 없음 → null", async () => {
    setupMocks({
      session: { sub: REGULAR_USER_ID, role: "free" },
      user: { admin_role: "association_admin" },
      adminMapping: null,
    });
    const { getAssociationAdmin } = await import("@/lib/auth/admin-guard");
    const result = await getAssociationAdmin();
    expect(result).toBeNull();
  });

  it("(12) session 없음 → null", async () => {
    setupMocks({ session: null });
    const { getAssociationAdmin } = await import("@/lib/auth/admin-guard");
    const result = await getAssociationAdmin();
    expect(result).toBeNull();
  });

  // ──────────────────────────────────────────────────────────
  // isExecutive + requirePermission sentinel
  // ──────────────────────────────────────────────────────────

  it("(13) sentinel role → isExecutive false (super_admin = 임원 아님)", async () => {
    setupMocks({ session: null });
    const { isExecutive, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    // sentinel role = `__super_admin__` 은 EXECUTIVE_ROLES 에 없음 → false
    expect(isExecutive(SUPER_ADMIN_SENTINEL_ROLE)).toBe(false);
  });

  it("(14) sentinel role + requirePermission → null (통과)", async () => {
    setupMocks({ session: null });
    const { requirePermission, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    expect(
      requirePermission(SUPER_ADMIN_SENTINEL_ROLE, "referee_manage"),
    ).toBeNull();
    expect(
      requirePermission(SUPER_ADMIN_SENTINEL_ROLE, "settlement_manage"),
    ).toBeNull();
    expect(
      requirePermission(SUPER_ADMIN_SENTINEL_ROLE, "admin_manage"),
    ).toBeNull();
  });

  // ──────────────────────────────────────────────────────────
  // 2026-05-15 PR3 — recorder_admin sentinel (Q2 결재 = 옵션 A)
  //   recorder_admin 도 super_admin 동일 sentinel role 반환 → 협회 12 permission 자동 통과.
  //   isRecorderAdmin (admin-guard 내부 호출) 는 isSuperAdmin 자동 흡수하므로,
  //   admin_role="recorder_admin" 단독 사용자도 동일 경로 통과.
  // ──────────────────────────────────────────────────────────

  it("(15) recorder_admin + AssociationAdmin row 존재 → sentinel role + 첫 활성 협회 자동 선택", async () => {
    setupMocks({
      // role 은 일반 (free) / admin_role 만 recorder_admin — Q1 자동 흡수 패턴 분리 케이스
      session: {
        sub: REGULAR_USER_ID,
        role: "free",
        admin_role: "recorder_admin",
      },
      firstAssociationAdmin: { association_id: BigInt(13) },
    });
    const { getAssociationAdmin, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    const result = await getAssociationAdmin();
    expect(result).not.toBeNull();
    expect(result!.role).toBe(SUPER_ADMIN_SENTINEL_ROLE);
    expect(result!.associationId).toBe(BigInt(13));
    expect(result!.userId).toBe(BigInt(REGULAR_USER_ID));
  });

  it("(16) recorder_admin + 협회 0개 운영 → sentinel + associationId=0n", async () => {
    setupMocks({
      session: {
        sub: REGULAR_USER_ID,
        role: "free",
        admin_role: "recorder_admin",
      },
      firstAssociationAdmin: null,
      firstAssociation: null,
    });
    const { getAssociationAdmin, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    const result = await getAssociationAdmin();
    expect(result!.role).toBe(SUPER_ADMIN_SENTINEL_ROLE);
    expect(result!.associationId).toBe(BigInt(0));
  });

  it("(17) recorder_admin 단독 + AssociationAdmin 매핑 없음 → sentinel 통과 (admin_role association 검증 skip)", async () => {
    // 이유: sentinel 흐름은 User.admin_role / AssociationAdmin 매핑 검증을 skip — recorder_admin 도 동일.
    // user.findUnique 가 호출되어도 결과 무관 (sentinel 분기에서 일찍 return 보장 검증).
    setupMocks({
      session: {
        sub: REGULAR_USER_ID,
        role: "free",
        admin_role: "recorder_admin",
      },
      firstAssociationAdmin: { association_id: BigInt(21) },
      // 일반 사용자 user 매핑 없음 케이스 — sentinel 이 먼저 처리되어 user.findUnique 도달 X
      user: null,
      adminMapping: null,
    });
    const { getAssociationAdmin, SUPER_ADMIN_SENTINEL_ROLE } = await import(
      "@/lib/auth/admin-guard"
    );
    const result = await getAssociationAdmin();
    expect(result).not.toBeNull();
    expect(result!.role).toBe(SUPER_ADMIN_SENTINEL_ROLE);
    expect(result!.associationId).toBe(BigInt(21));
  });

  it("(18) recorder_admin sentinel + 12 permission 모두 통과 (Q2 옵션 A)", async () => {
    // hasPermission 자체는 role 문자열 기준 — sentinel role 흡수 보장.
    // getAssociationAdmin → sentinel role 반환 → 호출자가 hasPermission(sentinel, *) 호출 시 true.
    setupMocks({
      session: {
        sub: REGULAR_USER_ID,
        role: "free",
        admin_role: "recorder_admin",
      },
      firstAssociationAdmin: { association_id: BigInt(8) },
    });
    const { getAssociationAdmin, hasPermission, PERMISSIONS } = await import(
      "@/lib/auth/admin-guard"
    );
    const result = await getAssociationAdmin();
    expect(result).not.toBeNull();
    // 12 permission 전체 반복 가드
    const allPermissions = Object.keys(PERMISSIONS) as Array<
      keyof typeof PERMISSIONS
    >;
    for (const p of allPermissions) {
      expect(hasPermission(result!.role, p)).toBe(true);
    }
  });

  it("(19) 일반 user (admin_role=null) → recorder_admin 분기 미통과 → null (회귀 가드)", async () => {
    // recorder_admin 도 super_admin 도 아닌 일반 사용자 — sentinel 분기 false / association_admin 검증 모두 실패.
    setupMocks({
      session: { sub: REGULAR_USER_ID, role: "free" },
      user: { admin_role: null },
      adminMapping: null,
    });
    const { getAssociationAdmin } = await import("@/lib/auth/admin-guard");
    const result = await getAssociationAdmin();
    expect(result).toBeNull();
  });
});
