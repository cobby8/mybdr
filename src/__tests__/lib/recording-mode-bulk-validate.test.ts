/**
 * 2026-05-11 — Phase 1 tournament-admin recording-mode/bulk route zod 검증 회귀.
 *
 * 본 테스트는 bulk route 의 PostBodySchema (zod) 가 사용자 결재 §3 룰을 정확히 강제하는지 확인.
 *
 * 검증 항목:
 *   1. 정상 입력 → success
 *   2. mode 누락 → fail
 *   3. scope 누락 → fail
 *   4. reason 5자 미만 → fail (사용자 결재 명시 5+ 글자)
 *   5. mode 알 수 없는 값 → fail
 *
 * route.ts 의 zod schema 를 직접 import 가 어렵다면 (route 가 export 안 함),
 * 동일 schema 를 본 테스트 안에 재선언 + 룰 검증. 향후 route 코드 변경 시
 * 본 테스트 schema 도 동시 업데이트해야 회귀 잡힘.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// route.ts L42 와 동일한 schema (회귀 가드)
const PostBodySchema = z.object({
  mode: z.enum(["flutter", "paper"]),
  scope: z.enum(["all", "new_only", "exclude_in_progress"]),
  reason: z
    .string()
    .trim()
    .min(5, "사유는 5자 이상 입력해주세요.")
    .max(500),
});

describe("recording-mode/bulk zod schema (5 케이스)", () => {
  it("정상 입력 (mode + scope + reason 5+) → success", () => {
    const result = PostBodySchema.safeParse({
      mode: "paper",
      scope: "exclude_in_progress",
      reason: "결승 매치 종이 기록지 운영 결정",
    });
    expect(result.success).toBe(true);
  });

  it("mode 누락 → fail", () => {
    const result = PostBodySchema.safeParse({
      scope: "all",
      reason: "테스트사유입니다",
    });
    expect(result.success).toBe(false);
  });

  it("scope 누락 → fail", () => {
    const result = PostBodySchema.safeParse({
      mode: "flutter",
      reason: "테스트사유입니다",
    });
    expect(result.success).toBe(false);
  });

  it("reason 5자 미만 → fail (사용자 결재 명시 룰)", () => {
    const result = PostBodySchema.safeParse({
      mode: "paper",
      scope: "all",
      reason: "짧음",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "사유는 5자 이상 입력해주세요."
      );
    }
  });

  it("mode 알 수 없는 값 → fail", () => {
    const result = PostBodySchema.safeParse({
      mode: "video", // flutter/paper 만 허용
      scope: "all",
      reason: "테스트사유입니다",
    });
    expect(result.success).toBe(false);
  });

  it("scope 알 수 없는 값 → fail", () => {
    const result = PostBodySchema.safeParse({
      mode: "flutter",
      scope: "future_only", // 정의 안된 scope
      reason: "테스트사유입니다",
    });
    expect(result.success).toBe(false);
  });

  it("reason 좌우 공백 trim 후 5자 → fail (zod .trim() 동작 확인)", () => {
    // "  abc  " → trim() = "abc" = 3자 < 5 → fail
    const result = PostBodySchema.safeParse({
      mode: "paper",
      scope: "all",
      reason: "   abc   ",
    });
    expect(result.success).toBe(false);
  });
});
