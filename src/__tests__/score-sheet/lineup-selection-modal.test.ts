/**
 * LineupSelectionModal — Phase 7-B (2026-05-12).
 *
 * 회귀 가드: isLineupSelectionValid 검증 룰 (FIBA 표준 + 운영 안전망).
 *
 * 검증 매트릭스:
 *   1. starters=5 + substitutes=0 (출전 5명 = 선발 5인) → 유효
 *   2. starters=5 + substitutes=7 (출전 12명) → 유효
 *   3. starters=4 (선발 부족) → 무효
 *   4. starters=6 (선발 초과) → 무효
 *   5. starters=5 + substitutes=0 + 합 < 5 → 불가능 (starters=5 강제)
 *   6. starters + substitutes 중복 0 룰 — 중복 있으면 무효
 */

import { describe, it, expect } from "vitest";
import { isLineupSelectionValid } from "@/app/(score-sheet)/score-sheet/[matchId]/_components/lineup-selection-modal";

describe("isLineupSelectionValid", () => {
  it("선발 5인 + 후보 0명 (출전 5명) → 유효", () => {
    // FIBA 최소 운영 케이스 — 후보 없이 선발 5인만 출전
    expect(
      isLineupSelectionValid({
        starters: ["1", "2", "3", "4", "5"],
        substitutes: [],
      })
    ).toBe(true);
  });

  it("선발 5인 + 후보 7명 (출전 12명) → 유효 (FIBA 표준)", () => {
    expect(
      isLineupSelectionValid({
        starters: ["1", "2", "3", "4", "5"],
        substitutes: ["6", "7", "8", "9", "10", "11", "12"],
      })
    ).toBe(true);
  });

  it("선발 4명 (선발 부족) → 무효", () => {
    expect(
      isLineupSelectionValid({
        starters: ["1", "2", "3", "4"],
        substitutes: ["5", "6", "7"],
      })
    ).toBe(false);
  });

  it("선발 6명 (선발 초과 — FIBA 표준 위반) → 무효", () => {
    expect(
      isLineupSelectionValid({
        starters: ["1", "2", "3", "4", "5", "6"],
        substitutes: ["7"],
      })
    ).toBe(false);
  });

  it("starters + substitutes 중복 → 무효 (UI 가 보장하지만 안전망)", () => {
    // "1" 이 starters / substitutes 양쪽에 박제 = 운영 데이터 무결성 위반
    expect(
      isLineupSelectionValid({
        starters: ["1", "2", "3", "4", "5"],
        substitutes: ["1", "6", "7"],
      })
    ).toBe(false);
  });

  it("빈 selection → 무효", () => {
    expect(
      isLineupSelectionValid({
        starters: [],
        substitutes: [],
      })
    ).toBe(false);
  });
});
