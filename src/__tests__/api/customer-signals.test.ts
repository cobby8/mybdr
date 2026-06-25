import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWebSession: vi.fn(),
  checkRateLimit: vi.fn(),
  scheduleCustomerSignalReport: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    suggestions: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/web-session", () => ({
  getWebSession: () => mocks.getWebSession(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  RATE_LIMITS: {
    customerSignal: { maxRequests: 5, windowMs: 60_000 },
  },
  checkRateLimit: (...args: unknown[]) => mocks.checkRateLimit(...args),
}));

vi.mock("@/lib/security/get-client-ip", () => ({
  getClientIp: () => "127.0.0.1",
}));

vi.mock("@/lib/customer-signals/report-mailer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/customer-signals/report-mailer")>();
  return {
    ...actual,
    scheduleCustomerSignalReport: (...args: unknown[]) =>
      mocks.scheduleCustomerSignalReport(...args),
  };
});

import { POST } from "@/app/api/web/customer-signals/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/web/customer-signals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as Parameters<typeof POST>[0];
}

async function postJson(body: unknown) {
  const res = await POST(makeRequest(body));
  return {
    status: res.status,
    json: (await res.json()) as Record<string, unknown>,
  };
}

describe("POST /api/web/customer-signals", () => {
  beforeEach(() => {
    mocks.getWebSession.mockReset();
    mocks.checkRateLimit.mockReset();
    mocks.scheduleCustomerSignalReport.mockReset();
    mocks.prisma.user.findUnique.mockReset();
    mocks.prisma.suggestions.create.mockReset();

    mocks.getWebSession.mockResolvedValue(null);
    mocks.checkRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetAt: Date.now() + 60_000,
      limit: 5,
    });
  });

  it("queues anonymous customer signal email without DB write", async () => {
    const { status, json } = await postJson({
      type: "site_error",
      title: "결제 오류",
      content: "결제 실패 화면에서 버튼이 동작하지 않습니다.",
      contactEmail: "customer@example.com",
      pageUrl: "/pricing/fail",
    });

    expect(status).toBe(201);
    expect(json).toMatchObject({
      stored: false,
      suggestion_id: null,
      email_report_queued: true,
    });
    expect(mocks.prisma.suggestions.create).not.toHaveBeenCalled();
    expect(mocks.scheduleCustomerSignalReport).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "site_error",
        priority: "urgent",
        contactEmail: "customer@example.com",
      }),
    );
  });

  it("stores logged-in customer signal as suggestion and queues email", async () => {
    mocks.getWebSession.mockResolvedValue({ sub: "7", role: "user" });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: BigInt(7),
      nickname: "수빈",
      email: "subin@example.com",
    });
    mocks.prisma.suggestions.create.mockResolvedValue({ id: BigInt(55) });

    const { status, json } = await postJson({
      type: "correction_request",
      title: "코트 정보 수정",
      content: "운영 시간이 달라졌습니다.",
    });

    expect(status).toBe(201);
    expect(json).toMatchObject({
      stored: true,
      suggestion_id: "55",
    });
    expect(mocks.prisma.suggestions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: BigInt(7),
          category: "correction_request",
          priority: 1,
        }),
      }),
    );
    expect(mocks.scheduleCustomerSignalReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reporter: expect.objectContaining({
          id: "7",
          email: "subin@example.com",
        }),
        adminUrl: "/admin/suggestions",
      }),
    );
  });

  it("blocks rate-limited requests", async () => {
    mocks.checkRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
      limit: 5,
    });

    const { status, json } = await postJson({
      type: "inquiry",
      title: "문의",
      content: "문의 내용입니다.",
    });

    expect(status).toBe(429);
    expect(json.code).toBe("RATE_LIMITED");
    expect(mocks.scheduleCustomerSignalReport).not.toHaveBeenCalled();
  });
});
