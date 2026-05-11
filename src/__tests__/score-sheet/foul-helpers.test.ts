/**
 * Player / Team Fouls 헬퍼 단위 테스트 — Phase 3 (2026-05-12).
 *
 * 검증 대상:
 *   - getPlayerFoulCount: 선수별 누적 (0~5)
 *   - getTeamFoulCountByPeriod: Period 별 팀 합산
 *   - isPlayerEjected: 5반칙 판정
 *   - shouldAwardFreeThrow: 5+ FT 부여 여부
 *   - foulsToPBPEvents: PBP 변환 (paper-fix prefix + period 정렬 + 등번호 lookup)
 *   - addFoul / removeLastFoul: 상태 변경 (5반칙 차단)
 */

import { describe, it, expect } from "vitest";
import {
  getPlayerFoulCount,
  getTeamFoulCountByPeriod,
  isPlayerEjected,
  shouldAwardFreeThrow,
  foulsToPBPEvents,
  addFoul,
  removeLastFoul,
} from "@/lib/score-sheet/foul-helpers";
import {
  type FoulMark,
  type FoulsState,
  EMPTY_FOULS,
} from "@/lib/score-sheet/foul-types";

// 헬퍼 — FoulMark 빌더
function f(playerId: string, period: number = 1): FoulMark {
  return { playerId, period };
}

describe("getPlayerFoulCount", () => {
  it("빈 배열 = 0", () => {
    expect(getPlayerFoulCount([], "100")).toBe(0);
  });

  it("선수 100 의 파울 3건 = 3", () => {
    const fouls = [f("100", 1), f("100", 2), f("200", 1), f("100", 3)];
    expect(getPlayerFoulCount(fouls, "100")).toBe(3);
  });

  it("다른 선수 = 0", () => {
    const fouls = [f("100"), f("100")];
    expect(getPlayerFoulCount(fouls, "999")).toBe(0);
  });
});

describe("getTeamFoulCountByPeriod", () => {
  it("Period 1 합산 3건", () => {
    const fouls = [f("100", 1), f("200", 1), f("300", 1), f("100", 2)];
    expect(getTeamFoulCountByPeriod(fouls, 1)).toBe(3);
  });

  it("Period 2 합산 1건", () => {
    const fouls = [f("100", 1), f("200", 1), f("100", 2)];
    expect(getTeamFoulCountByPeriod(fouls, 2)).toBe(1);
  });

  it("Period 5 (OT1) 합산 0건 (마킹 없음)", () => {
    const fouls = [f("100", 1)];
    expect(getTeamFoulCountByPeriod(fouls, 5)).toBe(0);
  });
});

describe("isPlayerEjected (5반칙 퇴장)", () => {
  it("4 파울 = false", () => {
    const fouls = [f("100"), f("100"), f("100"), f("100")];
    expect(isPlayerEjected(fouls, "100")).toBe(false);
  });

  it("5 파울 = true (퇴장)", () => {
    const fouls = [
      f("100"),
      f("100"),
      f("100"),
      f("100"),
      f("100"),
    ];
    expect(isPlayerEjected(fouls, "100")).toBe(true);
  });

  it("다른 선수 5건 - 해당 선수 0건 = false", () => {
    const fouls = [
      f("999"),
      f("999"),
      f("999"),
      f("999"),
      f("999"),
    ];
    expect(isPlayerEjected(fouls, "100")).toBe(false);
  });
});

describe("shouldAwardFreeThrow (5+ Team Foul)", () => {
  it("Period 1 4건 = false", () => {
    const fouls = [
      f("100", 1),
      f("200", 1),
      f("300", 1),
      f("400", 1),
    ];
    expect(shouldAwardFreeThrow(fouls, 1)).toBe(false);
  });

  it("Period 1 5건 = true", () => {
    const fouls = [
      f("100", 1),
      f("200", 1),
      f("300", 1),
      f("400", 1),
      f("500", 1),
    ];
    expect(shouldAwardFreeThrow(fouls, 1)).toBe(true);
  });

  it("Period 1 5건 / Period 2 0건 = period 2 는 false (period 별 분리)", () => {
    const fouls = [
      f("100", 1),
      f("200", 1),
      f("300", 1),
      f("400", 1),
      f("500", 1),
    ];
    expect(shouldAwardFreeThrow(fouls, 2)).toBe(false);
  });
});

describe("foulsToPBPEvents (PBP 변환)", () => {
  it("빈 상태 = []", () => {
    const events = foulsToPBPEvents(EMPTY_FOULS);
    expect(events).toEqual([]);
  });

  it("home 2건 + away 1건 = 3개 PBP, period 오름차순 정렬", () => {
    const state: FoulsState = {
      home: [f("100", 2), f("200", 1)],
      away: [f("300", 1)],
    };
    const events = foulsToPBPEvents(state);
    expect(events).toHaveLength(3);
    // 정렬: period 1 (home 200) → period 1 (away 300) → period 2 (home 100)
    expect(events[0].quarter).toBe(1);
    expect(events[0].team_side).toBe("home");
    expect(events[0].tournament_team_player_id_str).toBe("200");
    expect(events[1].quarter).toBe(1);
    expect(events[1].team_side).toBe("away");
    expect(events[2].quarter).toBe(2);
    expect(events[2].team_side).toBe("home");
  });

  it("paper-fix prefix + description 박제", () => {
    const state: FoulsState = {
      home: [f("100", 3)],
      away: [],
    };
    const events = foulsToPBPEvents(state, (id) =>
      id === "100" ? "23" : null
    );
    expect(events[0].local_id.startsWith("paper-fix-")).toBe(true);
    expect(events[0].description).toBe(
      "[종이 기록] 선수 23번 P3 파울"
    );
    expect(events[0].action_type).toBe("foul");
  });

  it("등번호 lookup 없음 = '?'", () => {
    const state: FoulsState = {
      home: [f("100", 1)],
      away: [],
    };
    const events = foulsToPBPEvents(state);
    expect(events[0].description).toBe("[종이 기록] 선수 ?번 P1 파울");
  });

  it("같은 period 안 home → away 순서 (안정 정렬)", () => {
    const state: FoulsState = {
      home: [f("100", 1), f("200", 1)],
      away: [f("300", 1), f("400", 1)],
    };
    const events = foulsToPBPEvents(state);
    expect(events.map((e) => e.team_side)).toEqual([
      "home",
      "home",
      "away",
      "away",
    ]);
    // home 안 = index 순서 (100 → 200)
    expect(events[0].tournament_team_player_id_str).toBe("100");
    expect(events[1].tournament_team_player_id_str).toBe("200");
  });
});

describe("addFoul", () => {
  it("정상 추가 = 1 → 2건", () => {
    const result = addFoul(
      { home: [f("100", 1)], away: [] },
      "home",
      f("100", 2)
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.home).toHaveLength(2);
      expect(result.state.home[1].period).toBe(2);
    }
  });

  it("away 팀 추가", () => {
    const result = addFoul(EMPTY_FOULS, "away", f("200", 1));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.away).toHaveLength(1);
      expect(result.state.home).toHaveLength(0);
    }
  });

  it("5반칙 도달 후 6번째 시도 = 차단", () => {
    const state: FoulsState = {
      home: [
        f("100", 1),
        f("100", 2),
        f("100", 3),
        f("100", 4),
        f("100", 4),
      ],
      away: [],
    };
    const result = addFoul(state, "home", f("100", 5));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("5반칙");
    }
  });

  it("다른 선수는 5반칙 무관 추가 가능", () => {
    const state: FoulsState = {
      home: [
        f("100", 1),
        f("100", 2),
        f("100", 3),
        f("100", 4),
        f("100", 4),
      ],
      away: [],
    };
    const result = addFoul(state, "home", f("200", 1));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.home).toHaveLength(6);
    }
  });
});

describe("removeLastFoul", () => {
  it("해당 선수 마지막 파울 1건 제거", () => {
    const state: FoulsState = {
      home: [f("100", 1), f("200", 1), f("100", 2)],
      away: [],
    };
    const next = removeLastFoul(state, "home", "100");
    expect(next.home).toHaveLength(2);
    // 마지막 100,2 만 제거 (200,1 + 100,1 보존)
    expect(next.home[0]).toEqual(f("100", 1));
    expect(next.home[1]).toEqual(f("200", 1));
  });

  it("해당 선수 마킹 0 = no-op", () => {
    const state: FoulsState = {
      home: [f("100", 1)],
      away: [],
    };
    const next = removeLastFoul(state, "home", "999");
    expect(next).toBe(state); // 같은 참조 (no-op)
  });

  it("빈 배열 = no-op", () => {
    const next = removeLastFoul(EMPTY_FOULS, "home", "100");
    expect(next).toBe(EMPTY_FOULS);
  });
});
