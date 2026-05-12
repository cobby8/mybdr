/**
 * 2026-05-12 — 로그인 redirect 흐름 통합 헬퍼 회귀 방지.
 *
 * 검증 매트릭스 (planner-architect §통합 fix):
 *   1. isValidRedirect — open redirect 방어 7 케이스
 *   2. buildLoginRedirect — 정상 4 케이스 + 무효 fallback 1
 *   3. safeRedirect — 유효/무효/커스텀 fallback 3
 *
 * 순수 함수 — DB / Next.js 의존 0. mock 불필요.
 */

import { describe, it, expect } from "vitest";
import {
  isValidRedirect,
  buildLoginRedirect,
  safeRedirect,
  extractRedirectFromQuery,
  extractRedirectFromValues,
} from "@/lib/auth/redirect";

describe("isValidRedirect — open redirect 방어", () => {
  it("정상 절대 경로 → true", () => {
    expect(isValidRedirect("/tournament-admin/tournaments/123/wizard")).toBe(true);
    expect(isValidRedirect("/games/abc/guest-apply")).toBe(true);
    expect(isValidRedirect("/")).toBe(true);
  });

  it("외부 URL 차단 (https://...)", () => {
    expect(isValidRedirect("https://evil.com")).toBe(false);
    expect(isValidRedirect("http://evil.com/path")).toBe(false);
  });

  it("protocol-relative URL 차단 (//evil.com)", () => {
    // `//evil.com` 은 브라우저가 외부 호스트로 해석 — open redirect 위험
    expect(isValidRedirect("//evil.com")).toBe(false);
    expect(isValidRedirect("//evil.com/path")).toBe(false);
  });

  it("로그인 페이지 자체 차단 (/login) — 무한 루프 방지", () => {
    expect(isValidRedirect("/login")).toBe(false);
    expect(isValidRedirect("/login?error=xxx")).toBe(false);
    expect(isValidRedirect("/login/forgot")).toBe(false);
  });

  it("API 경로 차단 (/api/...)", () => {
    expect(isValidRedirect("/api/v1/users")).toBe(false);
    expect(isValidRedirect("/api/web/me")).toBe(false);
  });

  it("빈 문자열/null/undefined → false", () => {
    expect(isValidRedirect("")).toBe(false);
    expect(isValidRedirect(null)).toBe(false);
    expect(isValidRedirect(undefined)).toBe(false);
  });

  it("긴 URL 차단 (>2000자)", () => {
    const longPath = "/" + "a".repeat(2001);
    expect(isValidRedirect(longPath)).toBe(false);
    // 경계 — 정확히 2000자는 통과
    const okPath = "/" + "a".repeat(1999); // 총 2000자
    expect(isValidRedirect(okPath)).toBe(true);
  });

  it("javascript: 같은 의사 프로토콜 차단 (/로 시작 안 함)", () => {
    expect(isValidRedirect("javascript:alert(1)")).toBe(false);
    expect(isValidRedirect("data:text/html,<script>")).toBe(false);
  });
});

describe("buildLoginRedirect — 안전 인코딩 + 쿼리 보존", () => {
  it("정상 경로 + 쿼리 없음", () => {
    expect(buildLoginRedirect("/tournament-admin")).toBe(
      "/login?redirect=%2Ftournament-admin",
    );
  });

  it("정상 경로 + 쿼리스트링 (?step=2)", () => {
    expect(buildLoginRedirect("/tournament-admin/wizard", "?step=2")).toBe(
      "/login?redirect=%2Ftournament-admin%2Fwizard%3Fstep%3D2",
    );
  });

  it("정상 경로 + URLSearchParams 객체", () => {
    const params = new URLSearchParams("step=2&mode=edit");
    expect(buildLoginRedirect("/admin/users", params)).toBe(
      "/login?redirect=%2Fadmin%2Fusers%3Fstep%3D2%26mode%3Dedit",
    );
  });

  it("쿼리 없음 (빈 문자열 / null / URLSearchParams 빈 객체)", () => {
    // 빈 쿼리 = 쿼리 part 없음 (? 만 남기지 않음)
    expect(buildLoginRedirect("/admin", "")).toBe("/login?redirect=%2Fadmin");
    expect(buildLoginRedirect("/admin", null)).toBe("/login?redirect=%2Fadmin");
    expect(buildLoginRedirect("/admin", new URLSearchParams())).toBe(
      "/login?redirect=%2Fadmin",
    );
    // "?" 단독도 무시
    expect(buildLoginRedirect("/admin", "?")).toBe("/login?redirect=%2Fadmin");
  });

  it("한글 / 특수문자 안전 인코딩", () => {
    // 한글 경로 — encodeURIComponent 로 정상 인코딩
    expect(buildLoginRedirect("/teams/한국팀")).toMatch(/^\/login\?redirect=/);
    const built = buildLoginRedirect("/teams/한국팀");
    // 인코딩 후 디코딩하면 원본 복원
    const decoded = decodeURIComponent(built.split("redirect=")[1]);
    expect(decoded).toBe("/teams/한국팀");
  });

  it("무효 경로 → /login (쿼리 없음) fallback", () => {
    // 외부 URL
    expect(buildLoginRedirect("https://evil.com")).toBe("/login");
    // protocol-relative
    expect(buildLoginRedirect("//evil.com/path")).toBe("/login");
    // /login 자체 (무한 루프)
    expect(buildLoginRedirect("/login")).toBe("/login");
    // 절대 경로 아님
    expect(buildLoginRedirect("relative/path")).toBe("/login");
  });

  it("정상 경로 + 무효 쿼리 결합 → 그래도 안전 (쿼리는 fullPath 일부)", () => {
    // /admin + "?next=//evil.com" — 결과 fullPath 는 `/admin?next=//evil.com` 으로 valid (시작이 /admin)
    // 단 redirect 쿼리값 자체는 인코딩되므로 외부 URL 호출 안 됨.
    const built = buildLoginRedirect("/admin", "?next=//evil.com");
    expect(built).toMatch(/^\/login\?redirect=/);
    const decoded = decodeURIComponent(built.split("redirect=")[1]);
    expect(decoded).toBe("/admin?next=//evil.com");
  });
});

describe("safeRedirect — 유효 통과 / 무효 fallback", () => {
  it("유효 경로 → 그대로", () => {
    expect(safeRedirect("/admin")).toBe("/admin");
    expect(safeRedirect("/games/abc/report")).toBe("/games/abc/report");
  });

  it("무효 경로 → 기본 fallback '/'", () => {
    expect(safeRedirect("https://evil.com")).toBe("/");
    expect(safeRedirect("//evil.com")).toBe("/");
    expect(safeRedirect("/login")).toBe("/");
    expect(safeRedirect("/api/v1/x")).toBe("/");
    expect(safeRedirect(null)).toBe("/");
    expect(safeRedirect(undefined)).toBe("/");
    expect(safeRedirect("")).toBe("/");
  });

  it("커스텀 fallback 사용", () => {
    expect(safeRedirect(null, "/dashboard")).toBe("/dashboard");
    expect(safeRedirect("https://evil.com", "/admin")).toBe("/admin");
    // fallback 자체가 무효해도 그대로 반환 (caller 책임)
    expect(safeRedirect(null, "//bad")).toBe("//bad");
  });

  it("유효 경로면 fallback 무관", () => {
    expect(safeRedirect("/teams", "/dashboard")).toBe("/teams");
  });
});

// 2026-05-12 callbackUrl 폴백 — proxy.ts 가 callbackUrl 쿼리로 redirect 시 사일런트 무시 차단.
describe("extractRedirectFromQuery — redirect 우선 / callbackUrl 폴백", () => {
  it("redirect 만 있는 경우 → redirect 반환", () => {
    const params = new URLSearchParams("redirect=%2Ftournament-admin");
    expect(extractRedirectFromQuery(params)).toBe("/tournament-admin");
  });

  it("callbackUrl 만 있는 경우 → callbackUrl 폴백 (proxy.ts 흐름)", () => {
    const params = new URLSearchParams("callbackUrl=%2Ftournament-admin%2Fseries%2Fnew");
    expect(extractRedirectFromQuery(params)).toBe("/tournament-admin/series/new");
  });

  it("둘 다 있으면 redirect 우선 (callbackUrl 무시)", () => {
    const params = new URLSearchParams(
      "redirect=%2Fadmin%2Fusers&callbackUrl=%2Ftournament-admin",
    );
    expect(extractRedirectFromQuery(params)).toBe("/admin/users");
  });

  it("둘 다 없거나 둘 다 무효 → null", () => {
    const empty = new URLSearchParams("");
    expect(extractRedirectFromQuery(empty)).toBeNull();
    // redirect = 외부 URL (무효) + callbackUrl 없음
    const invalid = new URLSearchParams("redirect=https%3A%2F%2Fevil.com");
    expect(extractRedirectFromQuery(invalid)).toBeNull();
    // 둘 다 무효
    const bothInvalid = new URLSearchParams(
      "redirect=https%3A%2F%2Fevil.com&callbackUrl=%2F%2Fevil.com",
    );
    expect(extractRedirectFromQuery(bothInvalid)).toBeNull();
  });

  it("redirect 무효 + callbackUrl 유효 → callbackUrl 반환 (폴백 동작)", () => {
    const params = new URLSearchParams(
      "redirect=https%3A%2F%2Fevil.com&callbackUrl=%2Fadmin",
    );
    expect(extractRedirectFromQuery(params)).toBe("/admin");
  });

  it("객체 인터페이스 (URLSearchParams 외) 도 동작", () => {
    // FormData 같은 평면 객체도 .get(key) 시그니처만 만족하면 OK.
    const fakeQuery = {
      get: (k: string) => (k === "callbackUrl" ? "/teams" : null),
    };
    expect(extractRedirectFromQuery(fakeQuery)).toBe("/teams");
  });
});

describe("extractRedirectFromValues — FormData 같은 (key) => value 인터페이스", () => {
  it("redirect 우선", () => {
    const fd = new FormData();
    fd.set("redirect", "/admin");
    fd.set("callbackUrl", "/tournament-admin");
    expect(
      extractRedirectFromValues((k) => (fd.get(k) as string | null) ?? null),
    ).toBe("/admin");
  });

  it("callbackUrl 폴백 (proxy.ts → 페이지 → server action 흐름)", () => {
    const fd = new FormData();
    fd.set("callbackUrl", "/tournament-admin/series/new");
    expect(
      extractRedirectFromValues((k) => (fd.get(k) as string | null) ?? null),
    ).toBe("/tournament-admin/series/new");
  });

  it("둘 다 없으면 null", () => {
    const fd = new FormData();
    expect(
      extractRedirectFromValues((k) => (fd.get(k) as string | null) ?? null),
    ).toBeNull();
  });

  it("무효 값 모두 차단", () => {
    const fd = new FormData();
    fd.set("redirect", "https://evil.com");
    fd.set("callbackUrl", "//evil.com");
    expect(
      extractRedirectFromValues((k) => (fd.get(k) as string | null) ?? null),
    ).toBeNull();
  });
});
