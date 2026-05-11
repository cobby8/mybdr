/**
 * fillRowsTo12 — TeamSection 의 FIBA 양식 12 행 정합 logic 회귀 가드.
 *
 * 2026-05-11 — Phase 1 신규.
 *
 * 검증 매트릭스:
 *   1. 빈 명단 → 12 개 모두 null
 *   2. 5명 명단 → 5 + 7 null = 12 행
 *   3. 12명 명단 → 12 행 그대로 (변경 없음)
 *   4. 15명 명단 (12 초과) → 15 행 그대로 (운영 안정성 우선 — 잘라내지 X)
 */

import { describe, it, expect } from "vitest";
import { fillRowsTo12 } from "@/app/(score-sheet)/score-sheet/[matchId]/_components/team-section";
import type { RosterItem } from "@/app/(score-sheet)/score-sheet/[matchId]/_components/team-section-types";

function mkPlayer(idx: number): RosterItem {
  return {
    tournamentTeamPlayerId: `p-${idx}`,
    jerseyNumber: idx,
    role: null,
    displayName: `선수 ${idx}`,
    userId: null,
    isStarter: false,
    isInLineup: false,
  };
}

describe("fillRowsTo12", () => {
  it("빈 명단 → 12 개 모두 null (FIBA 양식 12 행 보장)", () => {
    const rows = fillRowsTo12([]);
    expect(rows).toHaveLength(12);
    expect(rows.every((r) => r === null)).toBe(true);
  });

  it("5명 명단 → 5 player + 7 null = 12 행", () => {
    const players = [1, 2, 3, 4, 5].map(mkPlayer);
    const rows = fillRowsTo12(players);
    expect(rows).toHaveLength(12);
    expect(rows.slice(0, 5).every((r) => r !== null)).toBe(true);
    expect(rows.slice(5).every((r) => r === null)).toBe(true);
  });

  it("12명 명단 → 12 행 그대로 (변경 0)", () => {
    const players = Array.from({ length: 12 }, (_, i) => mkPlayer(i + 1));
    const rows = fillRowsTo12(players);
    expect(rows).toHaveLength(12);
    expect(rows.every((r) => r !== null)).toBe(true);
    expect(rows[0]?.tournamentTeamPlayerId).toBe("p-1");
    expect(rows[11]?.tournamentTeamPlayerId).toBe("p-12");
  });

  it("15명 명단 (12 초과) → 15 행 그대로 (운영 안정성 — 잘라내지 X)", () => {
    const players = Array.from({ length: 15 }, (_, i) => mkPlayer(i + 1));
    const rows = fillRowsTo12(players);
    expect(rows).toHaveLength(15);
    expect(rows.every((r) => r !== null)).toBe(true);
  });
});
