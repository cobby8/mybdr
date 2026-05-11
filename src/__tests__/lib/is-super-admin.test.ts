/**
 * 2026-05-11 Phase 2 — isSuperAdmin 단일 source 회귀 방지.
 *
 * 검증 매트릭스 (planner-architect §isSuperAdmin 통합):
 *   1. session=null → false (미로그인)
 *   2. session=undefined → false
 *   3. session.role==="super_admin" → true (isAdmin=true JWT)
 *   4. session.admin_role==="super_admin" → true (DB 세분화 필드)
 *   5. 둘 다 super_admin → true (중복 안전)
 *   6. 둘 다 미설정 → false
 *   7. 다른 role (tournament_admin / org_admin) → false
 *
 * DB 조회 0 / 순수 함수 — mock 불필요.
 */

import { describe, it, expect } from "vitest";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

describe("isSuperAdmin — 단일 source 통합 (Phase 2)", () => {
  it("session=null → false (미로그인)", () => {
    expect(isSuperAdmin(null)).toBe(false);
  });

  it("session=undefined → false", () => {
    expect(isSuperAdmin(undefined)).toBe(false);
  });

  it("session.role === 'super_admin' → true (isAdmin=true JWT)", () => {
    expect(isSuperAdmin({ role: "super_admin" })).toBe(true);
  });

  it("session.admin_role === 'super_admin' → true (DB 세분화 필드)", () => {
    expect(isSuperAdmin({ admin_role: "super_admin" })).toBe(true);
  });

  it("session.role + admin_role 둘 다 'super_admin' → true (중복 안전)", () => {
    expect(
      isSuperAdmin({ role: "super_admin", admin_role: "super_admin" }),
    ).toBe(true);
  });

  it("session 빈 객체 → false (role/admin_role 미설정)", () => {
    expect(isSuperAdmin({})).toBe(false);
  });

  it("session.role === 'tournament_admin' → false (다른 role)", () => {
    expect(isSuperAdmin({ role: "tournament_admin" })).toBe(false);
  });

  it("session.admin_role === 'site_admin' → false (다른 admin_role)", () => {
    expect(isSuperAdmin({ admin_role: "site_admin" })).toBe(false);
  });

  it("session.admin_role === 'org_admin' → false (다른 admin_role)", () => {
    expect(isSuperAdmin({ admin_role: "org_admin" })).toBe(false);
  });

  it("session.role === 'free' → false (membershipType 0)", () => {
    expect(isSuperAdmin({ role: "free" })).toBe(false);
  });
});
