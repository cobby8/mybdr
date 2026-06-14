// auto-complete-tournaments cron 의 KST 경계 순수함수(kstMidnightUtc) 검증.
//
// 이유: "당일 종료 대회 보호 / 어제까지만 처리" 가 KST 자정 경계 계산에 달려 있으므로
//       경계 함수만 격리해 단위 테스트한다. (DB / prisma 미접촉 — 순수함수 only)

import { describe, it, expect } from "vitest";
import { kstMidnightUtc } from "@/app/api/cron/auto-complete-tournaments/route";

describe("kstMidnightUtc", () => {
  it("KST 새벽(UTC 전날 오후) — 같은 KST 날짜의 00:00 을 반환", () => {
    // now(UTC) = 2026-06-15T01:00:00Z → KST 2026-06-15 10:00
    // KST 오늘 00:00 = 2026-06-15 00:00 KST = 2026-06-14T15:00:00Z
    const now = new Date("2026-06-15T01:00:00Z");
    expect(kstMidnightUtc(now).toISOString()).toBe("2026-06-14T15:00:00.000Z");
  });

  it("KST 자정 직후(UTC 15:00 직후) — 그 날 KST 00:00", () => {
    // now(UTC) = 2026-06-14T15:30:00Z → KST 2026-06-15 00:30
    // KST 오늘 00:00 = 2026-06-14T15:00:00Z
    const now = new Date("2026-06-14T15:30:00Z");
    expect(kstMidnightUtc(now).toISOString()).toBe("2026-06-14T15:00:00.000Z");
  });

  it("KST 자정 직전(UTC 14:59) — 전날 KST 00:00", () => {
    // now(UTC) = 2026-06-14T14:59:00Z → KST 2026-06-14 23:59
    // KST 오늘 00:00 = 2026-06-13T15:00:00Z
    const now = new Date("2026-06-14T14:59:00Z");
    expect(kstMidnightUtc(now).toISOString()).toBe("2026-06-13T15:00:00.000Z");
  });

  it("당일 보호 — endDate 가 오늘 KST 면 경계 미만이 아님(처리 대상 제외)", () => {
    // 오늘 KST = 2026-06-15. endDate = 2026-06-15 18:00 KST = 2026-06-15T09:00:00Z
    const now = new Date("2026-06-15T01:00:00Z"); // KST 2026-06-15 10:00
    const boundary = kstMidnightUtc(now); // 2026-06-14T15:00:00Z
    const todayEnd = new Date("2026-06-15T09:00:00Z"); // 오늘(KST) 종료
    // 당일은 경계 미만이 아님 → 자동 종료 대상에서 제외되어야 한다
    expect(todayEnd < boundary).toBe(false);
  });

  it("어제 종료 — endDate 가 어제 KST 면 경계 미만(처리 대상)", () => {
    // 오늘 KST = 2026-06-15. endDate = 2026-06-14 20:00 KST = 2026-06-14T11:00:00Z
    const now = new Date("2026-06-15T01:00:00Z");
    const boundary = kstMidnightUtc(now); // 2026-06-14T15:00:00Z
    const yesterdayEnd = new Date("2026-06-14T11:00:00Z"); // 어제(KST) 종료
    expect(yesterdayEnd < boundary).toBe(true);
  });
});
