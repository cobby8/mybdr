/**
 * fillRowsTo12 — TeamSection 의 FIBA 양식 12 행 정합 logic 회귀 가드.
 *
 * 2026-05-11 — Phase 1 신규 (fillRowsTo12).
 * 2026-05-12 — Phase 10 갱신 (fillRowsTo15 / 12 → 15 / 사용자 결재 §C).
 * 2026-05-12 — Phase 11 갱신 (fillRowsTo16 / 15 → 16 / FIBA 표준 16행 / reviewer 정합).
 * 2026-05-12 — Phase 12 갱신 (fillRowsTo12 / 16 → 12 / 사용자 직접 결재 / FIBA Article 4.2.2).
 *
 * 검증 매트릭스:
 *   1. 빈 명단 → 12 개 모두 null
 *   2. 5명 명단 → 5 + 7 null = 12 행
 *   3. 12명 명단 → 12 행 그대로 (변경 없음)
 *   4. 14명 명단 (12 초과) → 14 행 그대로 (운영 안정성 우선 — 잘라내지 X)
 *   5. fillRowsTo16 alias (deprecated) = fillRowsTo12 동작 (Phase 11 호환 가드)
 *   6. fillRowsTo15 alias (deprecated) = fillRowsTo12 동작 (Phase 10 호환 가드)
 */

import { describe, it, expect } from "vitest";
import {
  fillRowsTo12,
  fillRowsTo15,
  fillRowsTo16,
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

describe("fillRowsTo12 (Phase 12 — FIBA Article 4.2.2 실 운영 max 12명)", () => {
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

  it("14명 명단 (12 초과) → 14 행 그대로 (운영 안정성 — 잘라내지 X)", () => {
    const players = Array.from({ length: 14 }, (_, i) => mkPlayer(i + 1));
    const rows = fillRowsTo12(players);
    expect(rows).toHaveLength(14);
    expect(rows.every((r) => r !== null)).toBe(true);
  });
});

describe("fillRowsTo16 alias (deprecated — Phase 11 호환 가드)", () => {
  it("fillRowsTo16 === fillRowsTo12 (Phase 12 alias)", () => {
    // Phase 12 = 16 → 12 변경 시 기존 호출자 깨지지 않도록 alias 유지.
    expect(fillRowsTo16).toBe(fillRowsTo12);
  });

  it("fillRowsTo16 호출 = 12 행 결과 (alias 동작)", () => {
    const rows = fillRowsTo16([]);
    expect(rows).toHaveLength(12);
  });
});

describe("fillRowsTo15 alias (deprecated — Phase 10 호환 가드)", () => {
  it("fillRowsTo15 === fillRowsTo12 (Phase 12 alias)", () => {
    // Phase 10 = 15행, Phase 11 = 16행, Phase 12 = 12행 (단일 source: fillRowsTo12).
    expect(fillRowsTo15).toBe(fillRowsTo12);
  });

  it("fillRowsTo15 호출 = 12 행 결과 (alias 동작)", () => {
    const rows = fillRowsTo15([]);
    expect(rows).toHaveLength(12);
  });
});
