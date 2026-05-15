/**
 * 2026-05-15 Phase 6 PR1 — 협회 마법사 API 3개 회귀 가드.
 *
 * 검증 매트릭스 (8 케이스):
 *   POST /api/web/admin/associations
 *     1) admin 통과 → 생성 성공 (200 + association 응답)
 *     2) 비로그인 / 일반 사용자 → 403 (admin-guard)
 *     3) name 누락 → 422 (Zod)
 *   POST /api/web/admin/associations/[id]/admins
 *     4) 정상 지정 → 200 (upsert create)
 *     5) 존재하지 않는 association_id → 404
 *     6) 중복 지정 (user_id @unique) → 200 (upsert update 같은 row)
 *   POST /api/web/admin/associations/[id]/fee-setting
 *     7) 정상 upsert → 200 (fee_setting)
 *     8) 음수 fee → 422 (Zod)
 *
 * mock 전략:
 *   - admin-guard.getAssociationAdmin 을 직접 vi.doMock (super_admin sentinel 통과 시뮬레이션).
 *   - prisma.association.create / .findUnique, prisma.associationAdmin.upsert,
 *     prisma.associationFeeSetting.upsert, prisma.user.findUnique 를 stub.
 *   - 응답은 apiSuccess() 통과 후 snake_case + BigInt toString — 응답 키 검증.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const ADMIN_USER_ID = BigInt(999);
const ASSOCIATION_ID = BigInt(42);
const TARGET_USER_ID = BigInt(100);

// admin-guard 통과 시 반환되는 결과 — super_admin sentinel 시나리오.
const ADMIN_GUARD_PASS = {
  userId: ADMIN_USER_ID,
  associationId: ASSOCIATION_ID,
  role: "__super_admin__",
};

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

type PrismaMocks = {
  associationCreate: ReturnType<typeof vi.fn>;
  associationFindUnique: ReturnType<typeof vi.fn>;
  userFindUnique: ReturnType<typeof vi.fn>;
  associationAdminUpsert: ReturnType<typeof vi.fn>;
  feeSettingUpsert: ReturnType<typeof vi.fn>;
};

/**
 * 공통 mock 셋업.
 * - admin-guard.getAssociationAdmin → opts.adminPass ? ADMIN_GUARD_PASS : null
 * - prisma 5 메서드 stub.
 *
 * 각 케이스에서 mockReturnValue/mockResolvedValue 로 결과 주입.
 */
function setupMocks(opts: { adminPass: boolean }): PrismaMocks {
  const mocks: PrismaMocks = {
    associationCreate: vi.fn(),
    associationFindUnique: vi.fn(),
    userFindUnique: vi.fn(),
    associationAdminUpsert: vi.fn(),
    feeSettingUpsert: vi.fn(),
  };

  vi.doMock("@/lib/auth/admin-guard", () => ({
    getAssociationAdmin: vi
      .fn()
      .mockResolvedValue(opts.adminPass ? ADMIN_GUARD_PASS : null),
    // 사용 안 함, 그래도 import 깨짐 방지.
    SUPER_ADMIN_SENTINEL_ROLE: "__super_admin__",
    hasPermission: vi.fn().mockReturnValue(true),
    requirePermission: vi.fn().mockReturnValue(null),
    isExecutive: vi.fn().mockReturnValue(false),
    PERMISSIONS: {},
  }));

  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      association: {
        create: mocks.associationCreate,
        findUnique: mocks.associationFindUnique,
      },
      user: {
        findUnique: mocks.userFindUnique,
      },
      associationAdmin: {
        upsert: mocks.associationAdminUpsert,
      },
      associationFeeSetting: {
        upsert: mocks.feeSettingUpsert,
      },
    },
  }));

  return mocks;
}

// fake Request 헬퍼 — JSON body POST.
function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/web/admin/associations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/web/admin/associations — 협회 생성", () => {
  it("1) admin 통과 → 협회 생성 성공 (200)", async () => {
    const mocks = setupMocks({ adminPass: true });
    mocks.associationCreate.mockResolvedValue({
      id: ASSOCIATION_ID,
      name: "서울특별시농구협회",
      code: "KBA-11",
      level: "sido",
      region_sido: "서울",
      parent_id: BigInt(1),
      created_at: new Date("2026-05-15T00:00:00.000Z"),
    });

    const { POST } = await import("@/app/api/web/admin/associations/route");
    const res = await POST(
      makeRequest({
        name: "서울특별시농구협회",
        code: "KBA-11",
        level: "sido",
        region_sido: "서울",
        parent_id: "1",
      })
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { association: Record<string, unknown> };
    // (a) BigInt → string 자동 변환.
    expect(json.association.id).toBe(String(ASSOCIATION_ID));
    expect(json.association.parent_id).toBe("1");
    // (b) snake_case 자동 변환 — region_sido / created_at 그대로 (이미 snake).
    expect(json.association.region_sido).toBe("서울");
    expect(json.association.code).toBe("KBA-11");
    // (c) prisma.create 정확 호출.
    expect(mocks.associationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "서울특별시농구협회",
          code: "KBA-11",
          level: "sido",
          region_sido: "서울",
          parent_id: BigInt(1),
        }),
      })
    );
  });

  it("2) 비로그인 / 일반 사용자 → 403 FORBIDDEN", async () => {
    setupMocks({ adminPass: false });

    const { POST } = await import("@/app/api/web/admin/associations/route");
    const res = await POST(
      makeRequest({
        name: "테스트협회",
        code: "TEST-01",
        level: "sido",
      })
    );

    expect(res.status).toBe(403);
    const json = (await res.json()) as { error: string; code: string };
    expect(json.code).toBe("FORBIDDEN");
  });

  it("3) name 누락 → 422 VALIDATION_ERROR", async () => {
    setupMocks({ adminPass: true });

    const { POST } = await import("@/app/api/web/admin/associations/route");
    const res = await POST(
      makeRequest({
        // name 미존재 — Zod min(2) 위반.
        code: "TEST-01",
        level: "sido",
      })
    );

    expect(res.status).toBe(422);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/web/admin/associations/[id]/admins — AssociationAdmin upsert", () => {
  it("4) 정상 지정 → 200 (upsert create)", async () => {
    const mocks = setupMocks({ adminPass: true });
    // Association + User 둘 다 존재.
    mocks.associationFindUnique.mockResolvedValue({ id: ASSOCIATION_ID });
    mocks.userFindUnique.mockResolvedValue({ id: TARGET_USER_ID });
    mocks.associationAdminUpsert.mockResolvedValue({
      id: BigInt(1),
      user_id: TARGET_USER_ID,
      association_id: ASSOCIATION_ID,
      role: "secretary_general",
      created_at: new Date("2026-05-15T00:00:00.000Z"),
    });

    const { POST } = await import(
      "@/app/api/web/admin/associations/[id]/admins/route"
    );
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: TARGET_USER_ID.toString() }),
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: ASSOCIATION_ID.toString() }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      association_admin: Record<string, unknown>;
    };
    // BigInt → string + snake_case.
    expect(json.association_admin.user_id).toBe(TARGET_USER_ID.toString());
    expect(json.association_admin.association_id).toBe(ASSOCIATION_ID.toString());
    expect(json.association_admin.role).toBe("secretary_general");
    // upsert 호출 검증 — user_id where + create+update 양면 박제.
    expect(mocks.associationAdminUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: TARGET_USER_ID },
        create: expect.objectContaining({
          user_id: TARGET_USER_ID,
          association_id: ASSOCIATION_ID,
        }),
      })
    );
  });

  it("5) 존재하지 않는 association_id → 404", async () => {
    const mocks = setupMocks({ adminPass: true });
    // Association 부재.
    mocks.associationFindUnique.mockResolvedValue(null);

    const { POST } = await import(
      "@/app/api/web/admin/associations/[id]/admins/route"
    );
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: TARGET_USER_ID.toString() }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "9999" }) });

    expect(res.status).toBe(404);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe("NOT_FOUND");
    // user.findUnique / upsert 호출 안 됨 (early return).
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.associationAdminUpsert).not.toHaveBeenCalled();
  });

  it("6) 중복 지정 (user_id @unique) → upsert update 같은 row 반환 (200)", async () => {
    const mocks = setupMocks({ adminPass: true });
    mocks.associationFindUnique.mockResolvedValue({ id: ASSOCIATION_ID });
    mocks.userFindUnique.mockResolvedValue({ id: TARGET_USER_ID });
    // upsert 가 같은 row 반환 (이미 association_id=ASSOCIATION_ID 일 경우 update).
    mocks.associationAdminUpsert.mockResolvedValue({
      id: BigInt(1),
      user_id: TARGET_USER_ID,
      association_id: ASSOCIATION_ID,
      role: "president", // 신규 role 로 갱신
      created_at: new Date("2026-05-15T00:00:00.000Z"),
    });

    const { POST } = await import(
      "@/app/api/web/admin/associations/[id]/admins/route"
    );
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: TARGET_USER_ID.toString(),
        role: "president",
      }),
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: ASSOCIATION_ID.toString() }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      association_admin: Record<string, unknown>;
    };
    expect(json.association_admin.role).toBe("president");
    // upsert update 분기 — role 갱신 박제.
    expect(mocks.associationAdminUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          association_id: ASSOCIATION_ID,
          role: "president",
        }),
      })
    );
  });
});

describe("POST /api/web/admin/associations/[id]/fee-setting — 단가표 upsert", () => {
  it("7) 정상 upsert → 200 (fee_setting)", async () => {
    const mocks = setupMocks({ adminPass: true });
    mocks.associationFindUnique.mockResolvedValue({ id: ASSOCIATION_ID });
    mocks.feeSettingUpsert.mockResolvedValue({
      id: BigInt(1),
      association_id: ASSOCIATION_ID,
      fee_main: 80000,
      fee_sub: 60000,
      fee_recorder: 40000,
      fee_timer: 40000,
      updated_at: new Date("2026-05-15T00:00:00.000Z"),
    });

    const { POST } = await import(
      "@/app/api/web/admin/associations/[id]/fee-setting/route"
    );
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        main_fee: 80000,
        sub_fee: 60000,
        recorder_fee: 40000,
        timer_fee: 40000,
      }),
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: ASSOCIATION_ID.toString() }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      fee_setting: Record<string, unknown>;
    };
    expect(json.fee_setting.fee_main).toBe(80000);
    expect(json.fee_setting.fee_sub).toBe(60000);
    expect(json.fee_setting.association_id).toBe(ASSOCIATION_ID.toString());
    // upsert 호출 검증 — schema 컬럼 4 정수 정확 박제.
    expect(mocks.feeSettingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { association_id: ASSOCIATION_ID },
        create: expect.objectContaining({
          fee_main: 80000,
          fee_sub: 60000,
          fee_recorder: 40000,
          fee_timer: 40000,
        }),
      })
    );
  });

  it("8) 음수 fee → 422 VALIDATION_ERROR", async () => {
    const mocks = setupMocks({ adminPass: true });

    const { POST } = await import(
      "@/app/api/web/admin/associations/[id]/fee-setting/route"
    );
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        main_fee: -1, // 음수 — Zod min(0) 위반.
        sub_fee: 60000,
        recorder_fee: 40000,
        timer_fee: 40000,
      }),
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: ASSOCIATION_ID.toString() }),
    });

    expect(res.status).toBe(422);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe("VALIDATION_ERROR");
    // upsert 호출 안 됨 (early return).
    expect(mocks.feeSettingUpsert).not.toHaveBeenCalled();
  });
});
