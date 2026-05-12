/**
 * 2026-05-12 (Phase E / Q1) — `requireOrganizationOwner` 권한 매트릭스 회귀 가드.
 *
 * 검증 대상 = 단체 archive/복구 같은 destructive 액션 전용 헬퍼.
 *
 * 매트릭스 (8 케이스):
 *   1) 단체 없음 → 404 (OrganizationPermissionError)
 *   2) super_admin (session.role) → 통과 (DB 멤버십 SELECT 0)
 *   3) admin_role super_admin → 통과
 *   4) owner 본인 (role='owner', is_active=true) → 통과
 *   5) admin (role='admin', is_active=true) → 403 (admin 차단 — Phase E 정책)
 *   6) member (role='member') → 403
 *   7) 외부인 (멤버십 없음) → 403
 *   8) 비활성 owner (is_active=false) → 403
 *
 * mock 패턴 = canManageTournament.test.ts 와 동일 (vi.doMock + setupMocks 헬퍼).
 *
 * 보안 영향: Phase E archive/복구 가 owner 만 가능해야 단체 lifecycle 결정 권한 누수 0.
 *   admin 통과 시 → admin 이 임의로 단체 보관/복구 반복 가능 (사용자 결정 위반).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const ORG_ID = BigInt(10);
const OWNER_ID = BigInt(100);
const ADMIN_ID = BigInt(101);
const MEMBER_ID = BigInt(102);
const OUTSIDER_ID = BigInt(999);
const SUPER_ADMIN_ID = BigInt(1);

interface SetupOpts {
  /** prisma.organizations.findUnique 결과 — null 이면 404 분기 */
  organization: { id: bigint; name: string; status: string } | null;
  /**
   * prisma.organization_members.findFirst 결과
   * — Phase E 헬퍼는 role='owner' && is_active=true 조건으로 SELECT
   * — null 이면 owner 검증 실패 (admin/member/외부인/비활성 모두 null)
   */
  ownerMembership?: { id: bigint } | null;
}

function setupMocks(opts: SetupOpts) {
  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      organizations: {
        findUnique: vi.fn().mockResolvedValue(opts.organization),
      },
      organization_members: {
        findFirst: vi.fn().mockResolvedValue(opts.ownerMembership ?? null),
      },
    },
  }));
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("requireOrganizationOwner — 권한 매트릭스 (Phase E / Q1)", () => {
  it("1) 단체 없음 → 404 OrganizationPermissionError", async () => {
    setupMocks({ organization: null });
    const { requireOrganizationOwner, OrganizationPermissionError } =
      await import("@/lib/auth/org-permission");

    await expect(
      requireOrganizationOwner(ORG_ID, OWNER_ID, { role: "user" }),
    ).rejects.toMatchObject({
      name: "OrganizationPermissionError",
      status: 404,
    });

    // 명시적 instanceof 검증
    try {
      await requireOrganizationOwner(ORG_ID, OWNER_ID, { role: "user" });
    } catch (e) {
      expect(e).toBeInstanceOf(OrganizationPermissionError);
    }
  });

  it("2) super_admin (session.role) → 통과 (멤버십 SELECT 우회)", async () => {
    setupMocks({
      organization: { id: ORG_ID, name: "테스트단체", status: "approved" },
      // 멤버십 없어도 super_admin 우회
      ownerMembership: null,
    });
    const { requireOrganizationOwner } = await import("@/lib/auth/org-permission");

    const result = await requireOrganizationOwner(ORG_ID, SUPER_ADMIN_ID, {
      role: "super_admin",
    });

    expect(result.via).toBe("super_admin");
    expect(result.organization.id).toBe(ORG_ID);
  });

  it("3) admin_role='super_admin' (DB 세분화 필드) → 통과", async () => {
    setupMocks({
      organization: { id: ORG_ID, name: "테스트단체", status: "approved" },
      ownerMembership: null,
    });
    const { requireOrganizationOwner } = await import("@/lib/auth/org-permission");

    const result = await requireOrganizationOwner(ORG_ID, SUPER_ADMIN_ID, {
      admin_role: "super_admin",
    });

    expect(result.via).toBe("super_admin");
  });

  it("4) owner 본인 (role='owner', is_active=true) → 통과", async () => {
    setupMocks({
      organization: { id: ORG_ID, name: "테스트단체", status: "approved" },
      // findFirst 가 role='owner' && is_active=true 조건을 만족하는 row 반환
      ownerMembership: { id: BigInt(1) },
    });
    const { requireOrganizationOwner } = await import("@/lib/auth/org-permission");

    const result = await requireOrganizationOwner(ORG_ID, OWNER_ID, {
      role: "user",
    });

    expect(result.via).toBe("owner");
  });

  it("5) admin (role='admin') → 403 (Phase E 정책 — admin 차단)", async () => {
    setupMocks({
      organization: { id: ORG_ID, name: "테스트단체", status: "approved" },
      // 헬퍼의 SELECT 조건이 role='owner' 라 admin 은 매칭 X → null 반환
      ownerMembership: null,
    });
    const { requireOrganizationOwner } = await import("@/lib/auth/org-permission");

    await expect(
      requireOrganizationOwner(ORG_ID, ADMIN_ID, { role: "user" }),
    ).rejects.toMatchObject({
      name: "OrganizationPermissionError",
      status: 403,
    });
  });

  it("6) member (role='member') → 403", async () => {
    setupMocks({
      organization: { id: ORG_ID, name: "테스트단체", status: "approved" },
      ownerMembership: null,
    });
    const { requireOrganizationOwner } = await import("@/lib/auth/org-permission");

    await expect(
      requireOrganizationOwner(ORG_ID, MEMBER_ID, { role: "user" }),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it("7) 외부인 (멤버십 없음) → 403", async () => {
    setupMocks({
      organization: { id: ORG_ID, name: "테스트단체", status: "approved" },
      ownerMembership: null,
    });
    const { requireOrganizationOwner } = await import("@/lib/auth/org-permission");

    await expect(
      requireOrganizationOwner(ORG_ID, OUTSIDER_ID, { role: "user" }),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it("8) 비활성 owner (is_active=false) → 403", async () => {
    // 헬퍼의 SELECT 조건이 is_active=true 라 비활성 owner row 도 null 매칭
    setupMocks({
      organization: { id: ORG_ID, name: "테스트단체", status: "approved" },
      ownerMembership: null,
    });
    const { requireOrganizationOwner } = await import("@/lib/auth/org-permission");

    await expect(
      requireOrganizationOwner(ORG_ID, OWNER_ID, { role: "user" }),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it("9) allowSuperAdmin=false 옵션 → super_admin 도 owner 검증 받음 (멤버십 없으면 403)", async () => {
    setupMocks({
      organization: { id: ORG_ID, name: "테스트단체", status: "approved" },
      ownerMembership: null,
    });
    const { requireOrganizationOwner } = await import("@/lib/auth/org-permission");

    // super_admin 우회를 명시적으로 끔 → 멤버십 검증으로 fallback → null 이면 403
    await expect(
      requireOrganizationOwner(
        ORG_ID,
        SUPER_ADMIN_ID,
        { role: "super_admin" },
        { allowSuperAdmin: false },
      ),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it("10) 이미 archived 단체에서 owner 통과 (헬퍼는 status 검증 X — route 가 분기)", async () => {
    // 헬퍼는 단체 존재 + owner 만 검증. status='archived' 도 owner 면 통과 (복구 액션 자체는 가능해야 함)
    setupMocks({
      organization: { id: ORG_ID, name: "보관단체", status: "archived" },
      ownerMembership: { id: BigInt(1) },
    });
    const { requireOrganizationOwner } = await import("@/lib/auth/org-permission");

    const result = await requireOrganizationOwner(ORG_ID, OWNER_ID, {
      role: "user",
    });

    expect(result.via).toBe("owner");
    expect(result.organization.status).toBe("archived");
  });
});
