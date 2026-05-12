/**
 * fillRowsTo16 — TeamSection 의 FIBA 양식 16 행 정합 logic 회귀 가드.
 *
 * 2026-05-11 — Phase 1 신규 (fillRowsTo12).
 * 2026-05-12 — Phase 10 갱신 (fillRowsTo15 / 12 → 15 / 사용자 결재 §C).
 * 2026-05-12 — Phase 11 갱신 (fillRowsTo16 / 15 → 16 / FIBA 표준 16행 / reviewer 정합).
 *
 * 검증 매트릭스:
 *   1. 빈 명단 → 16 개 모두 null
 *   2. 5명 명단 → 5 + 11 null = 16 행
 *   3. 16명 명단 → 16 행 그대로 (변경 없음)
 *   4. 18명 명단 (16 초과) → 18 행 그대로 (운영 안정성 우선 — 잘라내지 X)
 *   5. fillRowsTo15 alias (deprecated) = fillRowsTo16 동작 (Phase 10 호환 가드)
 *   6. fillRowsTo12 alias (deprecated) = fillRowsTo16 동작 (Phase 1~9 호환 가드)
 */

import { describe, it, expect } from "vitest";
import {
  fillRowsTo16,
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

describe("fillRowsTo16 (Phase 11 — FIBA 표준 16행)", () => {
  it("빈 명단 → 16 개 모두 null (FIBA 양식 16 행 보장)", () => {
    const rows = fillRowsTo16([]);
    expect(rows).toHaveLength(16);
    expect(rows.every((r) => r === null)).toBe(true);
  });

  it("5명 명단 → 5 player + 11 null = 16 행", () => {
    const players = [1, 2, 3, 4, 5].map(mkPlayer);
    const rows = fillRowsTo16(players);
    expect(rows).toHaveLength(16);
    expect(rows.slice(0, 5).every((r) => r !== null)).toBe(true);
    expect(rows.slice(5).every((r) => r === null)).toBe(true);
  });

  it("16명 명단 → 16 행 그대로 (변경 0)", () => {
    const players = Array.from({ length: 16 }, (_, i) => mkPlayer(i + 1));
    const rows = fillRowsTo16(players);
    expect(rows).toHaveLength(16);
    expect(rows.every((r) => r !== null)).toBe(true);
    expect(rows[0]?.tournamentTeamPlayerId).toBe("p-1");
    expect(rows[15]?.tournamentTeamPlayerId).toBe("p-16");
  });

  it("18명 명단 (16 초과) → 18 행 그대로 (운영 안정성 — 잘라내지 X)", () => {
    const players = Array.from({ length: 18 }, (_, i) => mkPlayer(i + 1));
    const rows = fillRowsTo16(players);
    expect(rows).toHaveLength(18);
    expect(rows.every((r) => r !== null)).toBe(true);
  });
});

describe("fillRowsTo15 alias (deprecated — Phase 10 호환 가드)", () => {
  it("fillRowsTo15 === fillRowsTo16 (Phase 11 alias)", () => {
    // Phase 11 = 15 → 16 변경 시 기존 호출자 깨지지 않도록 alias 유지.
    expect(fillRowsTo15).toBe(fillRowsTo16);
  });

  it("fillRowsTo15 호출 = 16 행 결과 (alias 동작)", () => {
    const rows = fillRowsTo15([]);
    expect(rows).toHaveLength(16);
  });
});

describe("fillRowsTo12 alias (deprecated — Phase 1~9 호환 가드)", () => {
  it("fillRowsTo12 === fillRowsTo16 (Phase 11 alias)", () => {
    // Phase 1~9 = 12행, Phase 10 = 15행, Phase 11 = 16행 (단일 source).
    expect(fillRowsTo12).toBe(fillRowsTo16);
  });

  it("fillRowsTo12 호출 = 16 행 결과 (alias 동작)", () => {
    const rows = fillRowsTo12([]);
    expect(rows).toHaveLength(16);
  });
});
