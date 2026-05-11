/**
 * LineupSelectionModal — Phase 7-B (2026-05-12) + Phase 7.1 확장 (2026-05-12).
 *
 * 회귀 가드: isLineupSelectionValid 검증 룰 (FIBA 표준 + 운영 안전망)
 *           + applyRosterCap 헬퍼 (FIBA Article 4.2.2 — 12명 cap).
 *
 * 검증 매트릭스 (Phase 7-B):
 *   1. starters=5 + substitutes=0 (출전 5명 = 선발 5인) → 유효
 *   2. starters=5 + substitutes=7 (출전 12명) → 유효
 *   3. starters=4 (선발 부족) → 무효
 *   4. starters=6 (선발 초과) → 무효
 *   5. starters=5 + substitutes=0 + 합 < 5 → 불가능 (starters=5 강제)
 *   6. starters + substitutes 중복 0 룰 — 중복 있으면 무효
 *
 * 신규 매트릭스 (Phase 7.1):
 *   7. starters=5 + substitutes=8 (출전 13명) → 무효 (FIBA 12명 상한 안전망)
 *   8. applyRosterCap — 12명 이하 = 전체 반환 + overflowed=false
 *   9. applyRosterCap — 12명 초과 = 앞 12명 + overflowed=true
 *  10. applyRosterCap — 빈 배열 = capped=[] + overflowed=false
 *  11. applyRosterCap — 입력 순서 보존 (caller 정렬 책임)
 */

import { describe, it, expect } from "vitest";
import {
  isLineupSelectionValid,
  applyRosterCap,
  MAX_ROSTER_PER_TEAM,
} from "@/app/(score-sheet)/score-sheet/[matchId]/_components/lineup-selection-modal";
import type { RosterItem } from "@/app/(score-sheet)/score-sheet/[matchId]/_components/team-section-types";

// 테스트용 RosterItem 팩토리 — 필수 필드만 채움
function mkPlayer(id: string, jersey: number | null = null): RosterItem {
  return {
    tournamentTeamPlayerId: id,
    jerseyNumber: jersey,
    role: null,
    displayName: `Player ${id}`,
    userId: null,
    isStarter: false,
    isInLineup: false,
  };
}

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

  // Phase 7.1 신규 — FIBA Article 4.2.2 (12명 상한 안전망)
  it("선발 5 + 후보 8 (출전 13명) → 무효 (FIBA 12명 상한)", () => {
    // UI 가 13번째 추가 시도를 toast 차단하지만 직접 state 주입 케이스 대비 안전망
    expect(
      isLineupSelectionValid({
        starters: ["1", "2", "3", "4", "5"],
        substitutes: ["6", "7", "8", "9", "10", "11", "12", "13"],
      })
    ).toBe(false);
  });
});

describe("applyRosterCap (Phase 7.1)", () => {
  it("MAX_ROSTER_PER_TEAM 상수 = 12 (FIBA Article 4.2.2)", () => {
    expect(MAX_ROSTER_PER_TEAM).toBe(12);
  });

  it("선수 10명 (≤ 12) → 전체 체크 + overflowed=false", () => {
    const players = Array.from({ length: 10 }, (_, i) => mkPlayer(String(i + 1)));
    const { capped, overflowed } = applyRosterCap(players);
    expect(capped.length).toBe(10);
    expect(overflowed).toBe(false);
    expect(capped).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  });

  it("선수 12명 (= 12) → 전체 체크 + overflowed=false (경계 케이스)", () => {
    const players = Array.from({ length: 12 }, (_, i) => mkPlayer(String(i + 1)));
    const { capped, overflowed } = applyRosterCap(players);
    expect(capped.length).toBe(12);
    expect(overflowed).toBe(false);
  });

  it("선수 15명 (> 12) → 앞 12명 + overflowed=true (FIBA cap)", () => {
    const players = Array.from({ length: 15 }, (_, i) => mkPlayer(String(i + 1)));
    const { capped, overflowed } = applyRosterCap(players);
    expect(capped.length).toBe(12);
    expect(overflowed).toBe(true);
    // 앞 12명만 — id "1"~"12"
    expect(capped).toEqual([
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
    ]);
    // "13", "14", "15" 는 포함 안 됨
    expect(capped).not.toContain("13");
  });

  it("빈 배열 → capped=[] + overflowed=false", () => {
    const { capped, overflowed } = applyRosterCap([]);
    expect(capped).toEqual([]);
    expect(overflowed).toBe(false);
  });

  it("입력 순서 보존 (caller 정렬 책임)", () => {
    // caller 가 jerseyNumber 역순 정렬한 케이스 — applyRosterCap 은 순서 변경 X
    const players = [
      mkPlayer("a", 99),
      mkPlayer("b", 88),
      mkPlayer("c", 77),
    ];
    const { capped } = applyRosterCap(players);
    expect(capped).toEqual(["a", "b", "c"]);
  });
});
