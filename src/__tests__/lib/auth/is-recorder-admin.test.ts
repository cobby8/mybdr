/**
 * 2026-05-15 — PR1 (recorder_admin 역할 신설) 회귀 가드.
 *
 * 검증 대상 = `isRecorderAdmin(session)` 4 + 2 케이스:
 *   1) admin_role="recorder_admin" → true (정상 케이스)
 *   2) isAdmin=true 사용자 (role="super_admin") → true (Q1 자동 흡수)
 *   3) admin_role="super_admin" (DB 세분화 필드) → true (Q1 자동 흡수)
 *   4) 일반 user (role="free") → false
 *   5) session=null → false (미로그인 방어)
 *   6) session=undefined → false (방어)
 *
 * 안전성: 본 헬퍼는 DB 조회 0 (payload 만 평가) — mock 0건.
 */

import { describe, it, expect } from "vitest";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";

describe("isRecorderAdmin — 전역 기록원 관리자 권한 판정 (PR1)", () => {
  it("1) admin_role='recorder_admin' → true (정상 케이스)", () => {
    // DB User.admin_role 컬럼에 'recorder_admin' 박제된 사용자 → 모든 대회 통과
    const session = {
      role: "free",
      admin_role: "recorder_admin",
    };
    expect(isRecorderAdmin(session)).toBe(true);
  });

  it("2) role='super_admin' (isAdmin=true 사용자 JWT) → true (Q1 자동 흡수)", () => {
    // 사유: super_admin = 전능 정책 일관 — recorder_admin 가드도 자동 통과
    const session = {
      role: "super_admin",
    };
    expect(isRecorderAdmin(session)).toBe(true);
  });

  it("3) admin_role='super_admin' (DB 세분화 필드) → true (Q1 자동 흡수)", () => {
    // jwt.ts L46 — isAdmin=true 사용자는 admin_role 도 자동으로 'super_admin' 박제
    const session = {
      role: "super_admin",
      admin_role: "super_admin",
    };
    expect(isRecorderAdmin(session)).toBe(true);
  });

  it("4) 일반 user (role='free', admin_role 없음) → false", () => {
    // 일반 사용자 — recorder 권한도, 관리자 권한도 없음
    const session = {
      role: "free",
    };
    expect(isRecorderAdmin(session)).toBe(false);
  });

  it("5) session=null → false (미로그인 방어)", () => {
    expect(isRecorderAdmin(null)).toBe(false);
  });

  it("6) session=undefined → false (방어)", () => {
    expect(isRecorderAdmin(undefined)).toBe(false);
  });

  it("7) admin_role='org_admin' (다른 세분화 역할) → false (정확 매칭 의무)", () => {
    // recorder_admin 만 통과 — org_admin / content_admin 등 다른 역할은 자동 흡수 X
    const session = {
      role: "free",
      admin_role: "org_admin",
    };
    expect(isRecorderAdmin(session)).toBe(false);
  });

  it("8) tournament_admin (membershipType=3) → false (대회 운영 = 별도 분기)", () => {
    // tournament_admin 은 본인 대회 운영만 — 전역 기록원 관리자 권한 X
    const session = {
      role: "tournament_admin",
    };
    expect(isRecorderAdmin(session)).toBe(false);
  });
});
