/**
 * fillRowsTo15 — TeamSection 의 FIBA 양식 15 행 정합 logic 회귀 가드.
 *
 * 2026-05-11 — Phase 1 신규 (fillRowsTo12).
 * 2026-05-12 — Phase 10 갱신 (fillRowsTo15 / 12 → 15 / 사용자 결재 §C).
 *
 * 검증 매트릭스:
 *   1. 빈 명단 → 15 개 모두 null
 *   2. 5명 명단 → 5 + 10 null = 15 행
 *   3. 15명 명단 → 15 행 그대로 (변경 없음)
 *   4. 18명 명단 (15 초과) → 18 행 그대로 (운영 안정성 우선 — 잘라내지 X)
 *   5. fillRowsTo12 alias (deprecated) = fillRowsTo15 동작 (구버전 호출자 회귀 안전망)
 */

import { describe, it, expect } from "vitest";
import {
  fillRowsTo15,
  fillRowsTo12,
} from "@/app/(score-sheet)/score-sheet/[matchId]/_components/team-section";
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

describe("fillRowsTo15 (Phase 10 — FIBA 종이기록지 표준)", () => {
  it("빈 명단 → 15 개 모두 null (FIBA 양식 15 행 보장)", () => {
    const rows = fillRowsTo15([]);
    expect(rows).toHaveLength(15);
    expect(rows.every((r) => r === null)).toBe(true);
  });

  it("5명 명단 → 5 player + 10 null = 15 행", () => {
    const players = [1, 2, 3, 4, 5].map(mkPlayer);
    const rows = fillRowsTo15(players);
    expect(rows).toHaveLength(15);
    expect(rows.slice(0, 5).every((r) => r !== null)).toBe(true);
    expect(rows.slice(5).every((r) => r === null)).toBe(true);
  });

  it("15명 명단 → 15 행 그대로 (변경 0)", () => {
    const players = Array.from({ length: 15 }, (_, i) => mkPlayer(i + 1));
    const rows = fillRowsTo15(players);
    expect(rows).toHaveLength(15);
    expect(rows.every((r) => r !== null)).toBe(true);
    expect(rows[0]?.tournamentTeamPlayerId).toBe("p-1");
    expect(rows[14]?.tournamentTeamPlayerId).toBe("p-15");
  });

  it("18명 명단 (15 초과) → 18 행 그대로 (운영 안정성 — 잘라내지 X)", () => {
    const players = Array.from({ length: 18 }, (_, i) => mkPlayer(i + 1));
    const rows = fillRowsTo15(players);
    expect(rows).toHaveLength(18);
    expect(rows.every((r) => r !== null)).toBe(true);
  });
});

describe("fillRowsTo12 alias (deprecated — 구버전 호출자 회귀 안전망)", () => {
  it("fillRowsTo12 === fillRowsTo15 (Phase 10 alias)", () => {
    // Phase 10 = 12 → 15 변경 시 기존 호출자 깨지지 않도록 alias 유지.
    expect(fillRowsTo12).toBe(fillRowsTo15);
  });

  it("fillRowsTo12 호출 = 15 행 결과 (alias 동작)", () => {
    const rows = fillRowsTo12([]);
    expect(rows).toHaveLength(15);
  });
});
