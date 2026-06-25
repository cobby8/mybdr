import { describe, expect, it, vi, beforeEach } from "vitest";

const getWebSessionMock = vi.fn();
const adminLogMock = vi.fn();

vi.mock("@/lib/auth/web-session", () => ({
  getWebSession: () => getWebSessionMock(),
}));

vi.mock("@/lib/admin/log", () => ({
  adminLog: (...args: unknown[]) => adminLogMock(...args),
}));

import { POST } from "@/app/api/web/admin/agents/record-app-impact/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/web/admin/agents/record-app-impact", {
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

describe("POST /api/web/admin/agents/record-app-impact", () => {
  beforeEach(() => {
    getWebSessionMock.mockReset();
    adminLogMock.mockReset();
    getWebSessionMock.mockResolvedValue({
      sub: "1",
      role: "super_admin",
    });
  });

  it("blocks non-super-admin users", async () => {
    getWebSessionMock.mockResolvedValue({ sub: "2", role: "user" });

    const { status, json } = await postJson({
      summary: "check anything",
    });

    expect(status).toBe(403);
    expect(json).toEqual({
      error: "super_admin permission required",
      code: "FORBIDDEN",
    });
    expect(adminLogMock).not.toHaveBeenCalled();
  });

  it("returns none for unrelated web UI changes", async () => {
    const { status, json } = await postJson({
      changed_files: ["src/app/(web)/about/page.tsx"],
      summary: "copy-only web UI change",
    });

    expect(status).toBe(200);
    expect(json.impact).toBe("none");
    expect(json.impact_label).toBe("none");
    expect(json.backward_compatibility).toBe("maintained");
    expect(json.api_contract_changes).toEqual(["none"]);
    expect(json.record_app).toMatchObject({
      repository: "https://github.com/cobby8/bdr_stat_v3.git",
      checked_commit: "7676a1a",
      app_version: "0.1.10+12",
    });
    expect(adminLogMock).toHaveBeenCalledWith(
      "record_app_impact_check",
      "agent",
      expect.objectContaining({
        targetType: "record_app",
        severity: "info",
        changesMade: expect.objectContaining({
          impact: "none",
          backward_compatibility: "maintained",
        }),
      }),
    );
  });

  it("flags api/v1 field additions as needs_review", async () => {
    const { status, json } = await postJson({
      changed_files: ["src/app/api/v1/matches/[id]/events/route.ts"],
      api_paths: ["/api/v1/matches/:id/events"],
      response_fields: { added: ["possession_arrow"] },
    });

    expect(status).toBe(200);
    expect(json.impact).toBe("needs_review");
    expect(json.api_contract_changes).toEqual(["field_addition"]);
    expect(json.backward_compatibility).toBe("unknown");
    expect(json.record_app_check_requests).toContain(
      "Check bdr_stat_v3 lib/data/api/api_client.dart endpoint mapping.",
    );
    expect(json.server_tests).toContain(
      "Verify snake_case payload/response compatibility.",
    );
  });

  it("flags removed response fields as risk", async () => {
    const { status, json } = await postJson({
      api_paths: ["/api/v1/matches/:id/events"],
      response_fields: { removed: ["home_score"] },
    });

    expect(status).toBe(200);
    expect(json.impact).toBe("risk");
    expect(json.api_contract_changes).toEqual(["field_removal"]);
    expect(json.backward_compatibility).toBe("may_break");
    expect(json.user_decision_required).toBe(true);
    expect(adminLogMock).toHaveBeenCalledWith(
      "record_app_impact_check",
      "agent",
      expect.objectContaining({
        severity: "warning",
        changesMade: expect.objectContaining({
          impact: "risk",
          user_decision_required: true,
        }),
      }),
    );
  });

  it("flags auth-related changes as risk", async () => {
    const { status, json } = await postJson({
      changed_files: ["src/lib/auth/require-recorder.ts"],
      summary: "change JWT refresh behavior for mobile recorder auth",
    });

    expect(status).toBe(200);
    expect(json.impact).toBe("risk");
    expect(json.api_contract_changes).toEqual(["auth_change"]);
    expect(json.record_app_check_requests).toContain(
      "Check test/di/auth_notifier_test.dart impact.",
    );
  });
});
