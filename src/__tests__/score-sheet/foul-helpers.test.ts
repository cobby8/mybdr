/**
 * Player / Team Fouls 헬퍼 단위 테스트 — Phase 3 (2026-05-12).
 * Phase 3.5 (2026-05-12) — Article 41 + FoulType 케이스 추가.
 *
 * 검증 대상:
 *   - getPlayerFoulCount: 선수별 누적 (0~∞)
 *   - getPlayerFoulCountByType: 종류별 누적 (T/U/D 임계 판정용)
 *   - getTeamFoulCountByPeriod: Period 별 팀 합산
 *   - getEjectionReason: Article 41 4가지 분기 (5_fouls / 2_technical / 2_unsportsmanlike / disqualifying)
 *   - isPlayerEjected: Article 41 종합 판정
 *   - shouldAwardFreeThrow: 5+ FT 부여 여부
 *   - foulsToPBPEvents: PBP 변환 (paper-fix prefix + period 정렬 + 등번호 lookup + type 직접 박제)
 *   - addFoul / removeLastFoul: 상태 변경 (Article 41 차단)
 */

import { describe, it, expect } from "vitest";
import {
  getPlayerFoulCount,
  getPlayerFoulCountByType,
  getTeamFoulCountByPeriod,
  getEjectionReason,
  isPlayerEjected,
  shouldAwardFreeThrow,
  foulsToPBPEvents,
  addFoul,
  removeLastFoul,
} from "@/lib/score-sheet/foul-helpers";
import {
  type FoulMark,
  type FoulType,
  type FoulsState,
  EMPTY_FOULS,
} from "@/lib/score-sheet/foul-types";

// 헬퍼 — FoulMark 빌더 (Phase 3.5 — type 기본 "P")
function f(
  playerId: string,
  period: number = 1,
  type: FoulType = "P"
): FoulMark {
  return { playerId, period, type };
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

  it("paper-fix prefix + description 박제 (Phase 3.5 — type 직접)", () => {
    const state: FoulsState = {
      home: [f("100", 3)],
      away: [],
    };
    const events = foulsToPBPEvents(state, (id) =>
      id === "100" ? "23" : null
    );
    expect(events[0].local_id.startsWith("paper-fix-")).toBe(true);
    // Phase 3.5 — description = "선수 N번 {type}" (period 정보는 quarter 필드에 박제)
    expect(events[0].description).toBe("[종이 기록] 선수 23번 P");
    expect(events[0].action_type).toBe("foul");
    expect(events[0].quarter).toBe(3);
  });

  it("등번호 lookup 없음 = '?'", () => {
    const state: FoulsState = {
      home: [f("100", 1)],
      away: [],
    };
    const events = foulsToPBPEvents(state);
    expect(events[0].description).toBe("[종이 기록] 선수 ?번 P");
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

// Phase 3.5 — Article 41 분기 케이스
describe("getPlayerFoulCountByType (Phase 3.5)", () => {
  it("선수 100 의 T 종류 2건, U 1건", () => {
    const fouls = [
      f("100", 1, "T"),
      f("100", 2, "U"),
      f("100", 3, "T"),
      f("200", 1, "T"),
    ];
    expect(getPlayerFoulCountByType(fouls, "100", "T")).toBe(2);
    expect(getPlayerFoulCountByType(fouls, "100", "U")).toBe(1);
    expect(getPlayerFoulCountByType(fouls, "100", "D")).toBe(0);
  });
});

describe("getEjectionReason (Phase 3.5 — FIBA Article 41)", () => {
  it("0 파울 = 퇴장 X / reason null", () => {
    const r = getEjectionReason([], "100");
    expect(r.ejected).toBe(false);
    expect(r.reason).toBeNull();
  });

  it("D 1회 = 즉시 퇴장 (disqualifying)", () => {
    const fouls = [f("100", 1, "D")];
    const r = getEjectionReason(fouls, "100");
    expect(r.ejected).toBe(true);
    expect(r.reason).toBe("disqualifying");
  });

  it("T 2회 = 퇴장 (2_technical)", () => {
    const fouls = [f("100", 1, "T"), f("100", 2, "T")];
    const r = getEjectionReason(fouls, "100");
    expect(r.ejected).toBe(true);
    expect(r.reason).toBe("2_technical");
  });

  it("U 2회 = 퇴장 (2_unsportsmanlike)", () => {
    const fouls = [f("100", 1, "U"), f("100", 2, "U")];
    const r = getEjectionReason(fouls, "100");
    expect(r.ejected).toBe(true);
    expect(r.reason).toBe("2_unsportsmanlike");
  });

  it("P 5건 = 5반칙 (5_fouls)", () => {
    const fouls = [
      f("100", 1, "P"),
      f("100", 2, "P"),
      f("100", 3, "P"),
      f("100", 4, "P"),
      f("100", 4, "P"),
    ];
    const r = getEjectionReason(fouls, "100");
    expect(r.ejected).toBe(true);
    expect(r.reason).toBe("5_fouls");
  });

  it("P 4 + T 1 = 5반칙 (혼합 합산)", () => {
    const fouls = [
      f("100", 1, "P"),
      f("100", 1, "P"),
      f("100", 2, "P"),
      f("100", 3, "P"),
      f("100", 4, "T"),
    ];
    const r = getEjectionReason(fouls, "100");
    expect(r.ejected).toBe(true);
    // T 1건만으로는 T 임계 미달 → 합산 5 = 5_fouls
    expect(r.reason).toBe("5_fouls");
  });

  it("우선순위 — D 1 + P 3 = disqualifying (D 우선)", () => {
    const fouls = [
      f("100", 1, "P"),
      f("100", 2, "P"),
      f("100", 3, "P"),
      f("100", 4, "D"),
    ];
    const r = getEjectionReason(fouls, "100");
    expect(r.ejected).toBe(true);
    // D 가 가장 빠른 조건 (1회) → disqualifying
    expect(r.reason).toBe("disqualifying");
  });

  it("우선순위 — T 2 + U 2 도달 = 2_technical (T 우선, U 보다 먼저 검사)", () => {
    const fouls = [
      f("100", 1, "T"),
      f("100", 2, "T"),
      f("100", 3, "U"),
      f("100", 4, "U"),
    ];
    const r = getEjectionReason(fouls, "100");
    expect(r.ejected).toBe(true);
    // 구현 우선순위: D → T → U → 5반칙 → null
    expect(r.reason).toBe("2_technical");
  });

  it("다른 선수 영향 0 (100의 사유는 200 파울과 독립)", () => {
    const fouls = [
      f("999", 1, "T"),
      f("999", 2, "T"),
      f("100", 1, "P"),
    ];
    const r100 = getEjectionReason(fouls, "100");
    const r999 = getEjectionReason(fouls, "999");
    expect(r100.ejected).toBe(false);
    expect(r999.ejected).toBe(true);
    expect(r999.reason).toBe("2_technical");
  });
});

describe("isPlayerEjected (Phase 3.5 — Article 41 종합 판정)", () => {
  it("P 4건 + T 0 = 퇴장 X", () => {
    const fouls = [
      f("100", 1, "P"),
      f("100", 2, "P"),
      f("100", 3, "P"),
      f("100", 4, "P"),
    ];
    expect(isPlayerEjected(fouls, "100")).toBe(false);
  });

  it("D 1회 = 퇴장 (5건 미만)", () => {
    const fouls = [f("100", 1, "D")];
    expect(isPlayerEjected(fouls, "100")).toBe(true);
  });

  it("T 2회 = 퇴장 (5건 미만 시 일찍 도달)", () => {
    const fouls = [f("100", 1, "T"), f("100", 2, "T")];
    expect(isPlayerEjected(fouls, "100")).toBe(true);
  });
});

describe("addFoul (Phase 3.5 — Article 41 차단)", () => {
  it("D 마킹 후 추가 시도 = 차단", () => {
    const state: FoulsState = {
      home: [f("100", 1, "D")],
      away: [],
    };
    const result = addFoul(state, "home", f("100", 2, "P"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Disqualifying");
    }
  });

  it("T 2회 도달 후 추가 시도 = 차단 (T 2회 사유 메시지)", () => {
    const state: FoulsState = {
      home: [f("100", 1, "T"), f("100", 2, "T")],
      away: [],
    };
    const result = addFoul(state, "home", f("100", 3, "P"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Technical 2회");
    }
  });

  it("U 2회 도달 후 추가 시도 = 차단", () => {
    const state: FoulsState = {
      home: [f("100", 1, "U"), f("100", 2, "U")],
      away: [],
    };
    const result = addFoul(state, "home", f("100", 3, "P"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Unsportsmanlike");
    }
  });

  it("혼합 5건 (P3 + T1 + U1) 후 추가 = 차단 (5반칙 사유)", () => {
    const state: FoulsState = {
      home: [
        f("100", 1, "P"),
        f("100", 2, "P"),
        f("100", 3, "P"),
        f("100", 4, "T"),
        f("100", 4, "U"),
      ],
      away: [],
    };
    const result = addFoul(state, "home", f("100", 5, "P"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // T/U 각 1건만 → 합산 5건 = 5반칙 사유
      expect(result.reason).toContain("5반칙");
    }
  });
});

describe("foulsToPBPEvents (Phase 3.5 — type 박제)", () => {
  it("type 다양한 종류 → description 직접 박제", () => {
    const state: FoulsState = {
      home: [f("100", 1, "T"), f("100", 2, "D")],
      away: [],
    };
    const events = foulsToPBPEvents(state, (id) => (id === "100" ? "23" : null));
    expect(events).toHaveLength(2);
    expect(events[0].foul_type).toBe("T");
    expect(events[0].description).toBe("[종이 기록] 선수 23번 T");
    expect(events[1].foul_type).toBe("D");
    expect(events[1].description).toBe("[종이 기록] 선수 23번 D");
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
