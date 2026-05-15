/**
 * FIBA Phase 19 PR-T1 (2026-05-15) — getCellPhase + isCellActive 단위 테스트.
 *
 * 왜 (이유):
 *   timeout-helpers.ts 신규 헬퍼 회귀 가드. cell index ↔ phase 분기 + 활성 룰 12 케이스.
 *
 * 검증 케이스 (12):
 *   getCellPhase (5):
 *     1. cellIndex 0 → first_half (전반 첫 칸)
 *     2. cellIndex 1 → first_half (전반 둘째 칸)
 *     3. cellIndex 2 → second_half (후반 첫 칸)
 *     4. cellIndex 4 → second_half (후반 셋째 칸)
 *     5. cellIndex 5 → overtime (OT1)
 *
 *   isCellActive (7):
 *     6. cellIndex 0 + period 1 → true (전반 진행 중 = 전반 cell 활성)
 *     7. cellIndex 0 + period 3 → false (후반 진행 중 = 전반 cell 비활성)
 *     8. cellIndex 2 + period 3 → true (후반 진행 중 = 후반 cell 활성)
 *     9. cellIndex 2 + period 1 → false (전반 진행 중 = 후반 cell 비활성)
 *     10. cellIndex 5 + period 5 → true (OT1 진행 중 = cell 5 활성 / 일대일 매칭)
 *     11. cellIndex 5 + period 6 → false (OT2 진행 중 = cell 5 (OT1) 비활성)
 *     12. cellIndex 6 + period 6 → true (OT2 진행 중 = cell 6 활성)
 */

import { describe, it, expect } from "vitest";
import {
  getCellPhase,
  isCellActive,
} from "@/lib/score-sheet/timeout-helpers";

describe("getCellPhase — cell index → phase 분기", () => {
  it("cellIndex 0 → first_half (전반 첫 칸)", () => {
    expect(getCellPhase(0)).toBe("first_half");
  });

  it("cellIndex 1 → first_half (전반 둘째 칸)", () => {
    expect(getCellPhase(1)).toBe("first_half");
  });

  it("cellIndex 2 → second_half (후반 첫 칸)", () => {
    expect(getCellPhase(2)).toBe("second_half");
  });

  it("cellIndex 4 → second_half (후반 셋째 칸)", () => {
    expect(getCellPhase(4)).toBe("second_half");
  });

  it("cellIndex 5 → overtime (OT1 칸)", () => {
    expect(getCellPhase(5)).toBe("overtime");
  });
});

describe("isCellActive — cell phase 와 current period phase 일치 여부", () => {
  it("cellIndex 0 + period 1 → true (전반 진행 중 = 전반 cell 활성)", () => {
    expect(isCellActive(0, 1)).toBe(true);
  });

  it("cellIndex 0 + period 3 → false (후반 진행 중 = 전반 cell 비활성)", () => {
    expect(isCellActive(0, 3)).toBe(false);
  });

  it("cellIndex 2 + period 3 → true (후반 진행 중 = 후반 cell 활성)", () => {
    expect(isCellActive(2, 3)).toBe(true);
  });

  it("cellIndex 2 + period 1 → false (전반 진행 중 = 후반 cell 비활성)", () => {
    expect(isCellActive(2, 1)).toBe(false);
  });

  it("cellIndex 5 + period 5 → true (OT1 진행 중 = cell 5 활성 / 일대일 매칭)", () => {
    expect(isCellActive(5, 5)).toBe(true);
  });

  it("cellIndex 5 + period 6 → false (OT2 진행 중 = cell 5 (OT1) 비활성)", () => {
    expect(isCellActive(5, 6)).toBe(false);
  });

  it("cellIndex 6 + period 6 → true (OT2 진행 중 = cell 6 활성)", () => {
    expect(isCellActive(6, 6)).toBe(true);
  });
});
