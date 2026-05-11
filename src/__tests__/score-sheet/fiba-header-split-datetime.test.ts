/**
 * splitDateTime — FibaHeader 의 자동 fill 분기 logic 회귀 가드.
 *
 * 2026-05-11 — Phase 1 신규.
 *
 * 검증 매트릭스:
 *   1. null 입력 → { date: null, time: null }
 *   2. "—" placeholder → { date: null, time: null }
 *   3. "2026-05-11 14:00" → { date: "2026-05-11", time: "14:00" }
 *   4. 한국어 "2026. 05. 11. 14:00" → { date: "2026. 05. 11.", time: "14:00" }
 *   5. 공백 없는 입력 → date 만 채워짐 (fallback)
 */

import { describe, it, expect } from "vitest";
import { splitDateTime } from "@/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header";

describe("splitDateTime", () => {
  it("null 입력 = 양쪽 null", () => {
    expect(splitDateTime(null)).toEqual({ dateLabel: null, timeLabel: null });
  });

  it("'—' placeholder = 양쪽 null (page.tsx fallback 케이스)", () => {
    expect(splitDateTime("—")).toEqual({ dateLabel: null, timeLabel: null });
  });

  it("ISO-like '2026-05-11 14:00' = 정상 분리", () => {
    expect(splitDateTime("2026-05-11 14:00")).toEqual({
      dateLabel: "2026-05-11",
      timeLabel: "14:00",
    });
  });

  it("한국어 toLocaleString 출력 '2026. 05. 11. 14:00' = 정상 분리", () => {
    expect(splitDateTime("2026. 05. 11. 14:00")).toEqual({
      dateLabel: "2026. 05. 11.",
      timeLabel: "14:00",
    });
  });

  it("공백 없는 입력 = date 만 채워짐 (timeLabel null)", () => {
    expect(splitDateTime("2026-05-11")).toEqual({
      dateLabel: "2026-05-11",
      timeLabel: null,
    });
  });
});
