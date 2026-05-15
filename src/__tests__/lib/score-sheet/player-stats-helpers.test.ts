/**
 * Phase 19 PR-Stat1 — player-stats-helpers vitest.
 *
 * 2026-05-15 — Phase 19 PR-Stat1 (planner-architect §1)
 *
 * 검증 목표:
 *   - addStat / removeStat / getStat / totalStats 4 헬퍼의 immutable + 폴백 보장.
 *   - min 0 가드 (음수 차단) — 운영 사고 안전망.
 *   - reference equality — 변경 없을 때 같은 reference 반환 (React 리렌더 최소화 단서).
 */

import { describe, it, expect } from "vitest";
import {
  addStat,
  removeStat,
  getStat,
  totalStats,
} from "@/lib/score-sheet/player-stats-helpers";
import {
  EMPTY_PLAYER_STAT,
  EMPTY_PLAYER_STATS,
} from "@/lib/score-sheet/player-stats-types";
import type { PlayerStatsState } from "@/lib/score-sheet/player-stats-types";

describe("player-stats-helpers — addStat", () => {
  it("[case 1] 신규 player 에 stat 추가 = EMPTY 에서 +1 시작", () => {
    const next = addStat(EMPTY_PLAYER_STATS, "100", "or");
    expect(next["100"]).toEqual({ or: 1, dr: 0, a: 0, s: 0, b: 0, to: 0 });
  });

  it("[case 2] 기존 player 의 stat +1 = 다른 stat 보존", () => {
    const initial: PlayerStatsState = {
      "100": { or: 2, dr: 1, a: 3, s: 0, b: 0, to: 0 },
    };
    const next = addStat(initial, "100", "a");
    expect(next["100"]).toEqual({ or: 2, dr: 1, a: 4, s: 0, b: 0, to: 0 });
  });

  it("[case 3] addStat 은 immutable — 원본 state 변경 X", () => {
    const initial: PlayerStatsState = {
      "100": { or: 1, dr: 0, a: 0, s: 0, b: 0, to: 0 },
    };
    const snapshot = JSON.stringify(initial);
    addStat(initial, "100", "or");
    expect(JSON.stringify(initial)).toBe(snapshot);
  });

  it("[case 4] 다른 player 추가 = 기존 player 보존", () => {
    const initial: PlayerStatsState = {
      "100": { or: 5, dr: 0, a: 0, s: 0, b: 0, to: 0 },
    };
    const next = addStat(initial, "200", "to");
    expect(next["100"]).toEqual(initial["100"]);
    expect(next["200"]).toEqual({ or: 0, dr: 0, a: 0, s: 0, b: 0, to: 1 });
  });
});

describe("player-stats-helpers — removeStat", () => {
  it("[case 5] stat -1 = 정상", () => {
    const initial: PlayerStatsState = {
      "100": { or: 3, dr: 0, a: 0, s: 0, b: 0, to: 0 },
    };
    const next = removeStat(initial, "100", "or");
    expect(next["100"].or).toBe(2);
  });

  it("[case 6] stat=0 에서 remove = 같은 reference (변경 없음 — 음수 차단)", () => {
    const initial: PlayerStatsState = {
      "100": { or: 0, dr: 2, a: 0, s: 0, b: 0, to: 0 },
    };
    const next = removeStat(initial, "100", "or");
    expect(next).toBe(initial); // reference equality
  });

  it("[case 7] 미존재 player remove = 같은 reference", () => {
    const next = removeStat(EMPTY_PLAYER_STATS, "999", "or");
    expect(next).toBe(EMPTY_PLAYER_STATS);
  });

  it("[case 8] removeStat 은 immutable — 원본 state 변경 X", () => {
    const initial: PlayerStatsState = {
      "100": { or: 5, dr: 0, a: 0, s: 0, b: 0, to: 0 },
    };
    const snapshot = JSON.stringify(initial);
    removeStat(initial, "100", "or");
    expect(JSON.stringify(initial)).toBe(snapshot);
  });
});

describe("player-stats-helpers — getStat", () => {
  it("[case 9] 미존재 player = 0 폴백", () => {
    expect(getStat(EMPTY_PLAYER_STATS, "999", "or")).toBe(0);
  });

  it("[case 10] 존재 player 의 정확 값 반환", () => {
    const initial: PlayerStatsState = {
      "100": { or: 7, dr: 0, a: 0, s: 0, b: 0, to: 0 },
    };
    expect(getStat(initial, "100", "or")).toBe(7);
    expect(getStat(initial, "100", "a")).toBe(0);
  });
});

describe("player-stats-helpers — totalStats", () => {
  it("[case 11] 미존재 player = EMPTY_PLAYER_STAT 복사 (reference 분리)", () => {
    const total = totalStats(EMPTY_PLAYER_STATS, "999");
    expect(total).toEqual(EMPTY_PLAYER_STAT);
    // mutate 안전성 — 호출자가 totalStats 결과 mutate 해도 EMPTY 원본 보존
    total.or = 999;
    expect(EMPTY_PLAYER_STAT.or).toBe(0);
  });

  it("[case 12] 존재 player = 6 stat 그대로 복사", () => {
    const initial: PlayerStatsState = {
      "100": { or: 1, dr: 2, a: 3, s: 4, b: 5, to: 6 },
    };
    const total = totalStats(initial, "100");
    expect(total).toEqual({ or: 1, dr: 2, a: 3, s: 4, b: 5, to: 6 });
  });

  it("[case 13] 통합 시나리오 — 3 회 add + 1 회 remove + total", () => {
    // 운영 흐름: OR +1 / DR +1 / OR +1 / OR -1 → 최종 OR=1, DR=1
    let state = EMPTY_PLAYER_STATS;
    state = addStat(state, "100", "or");
    state = addStat(state, "100", "dr");
    state = addStat(state, "100", "or");
    state = removeStat(state, "100", "or");
    expect(getStat(state, "100", "or")).toBe(1);
    expect(getStat(state, "100", "dr")).toBe(1);
    expect(totalStats(state, "100")).toEqual({
      or: 1,
      dr: 1,
      a: 0,
      s: 0,
      b: 0,
      to: 0,
    });
  });
});
