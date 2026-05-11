/**
 * QuarterEndModal — Phase 7-C (2026-05-12).
 *
 * 회귀 가드: Q4 / OT 종료 분기 로직 + 동점 차단 룰.
 *
 * 검증 매트릭스:
 *   getQuarterEndMode:
 *     1. period 1~3 종료 → null (모달 X / 자동 진입)
 *     2. period 4 (Q4) 종료 → "quarter4"
 *     3. period 5~7 (OTn) 종료 → "overtime"
 *     4. period 8+ → null (안전 가드)
 *
 *   canEndMatchAtEnd:
 *     1. 점수 차이 있음 → 종료 가능
 *     2. 동점 → 종료 불가 (FIBA 룰 OT 강제)
 *     3. 0:0 → 종료 불가 (동점 케이스 — 운영 안전성)
 */

import { describe, it, expect } from "vitest";
import {
  getQuarterEndMode,
  canEndMatchAtEnd,
} from "@/app/(score-sheet)/score-sheet/[matchId]/_components/quarter-end-modal";

describe("getQuarterEndMode", () => {
  it("period 1 종료 → null (자동 진입)", () => {
    expect(getQuarterEndMode(1)).toBe(null);
  });

  it("period 2 종료 → null", () => {
    expect(getQuarterEndMode(2)).toBe(null);
  });

  it("period 3 종료 → null", () => {
    expect(getQuarterEndMode(3)).toBe(null);
  });

  it("period 4 (Q4) 종료 → 'quarter4' (모달 표시)", () => {
    // 운영 사고 방지 — Q4 종료 = 자동 OT 진입 X
    expect(getQuarterEndMode(4)).toBe("quarter4");
  });

  it("period 5 (OT1) 종료 → 'overtime' (모달 표시)", () => {
    expect(getQuarterEndMode(5)).toBe("overtime");
  });

  it("period 6 (OT2) 종료 → 'overtime'", () => {
    expect(getQuarterEndMode(6)).toBe("overtime");
  });

  it("period 7 (OT3) 종료 → 'overtime' (마지막 OT)", () => {
    expect(getQuarterEndMode(7)).toBe("overtime");
  });

  it("period 8 → null (안전 가드 — 비정상 값)", () => {
    expect(getQuarterEndMode(8)).toBe(null);
  });

  it("period 0 → null (안전 가드)", () => {
    expect(getQuarterEndMode(0)).toBe(null);
  });
});

describe("canEndMatchAtEnd", () => {
  it("점수 차이 있음 (75 vs 82) → 종료 가능", () => {
    expect(canEndMatchAtEnd(75, 82)).toBe(true);
  });

  it("점수 차이 1점 → 종료 가능", () => {
    expect(canEndMatchAtEnd(80, 81)).toBe(true);
  });

  it("동점 (80 vs 80) → 종료 불가 (FIBA 룰 OT 강제)", () => {
    // FIBA 룰: 동점 = 연장전 강제. "경기 종료" 버튼 비활성 되어야 함.
    expect(canEndMatchAtEnd(80, 80)).toBe(false);
  });

  it("0:0 → 종료 불가 (동점 케이스)", () => {
    expect(canEndMatchAtEnd(0, 0)).toBe(false);
  });

  it("큰 점수 차이 (100 vs 50) → 종료 가능", () => {
    expect(canEndMatchAtEnd(100, 50)).toBe(true);
  });
});
