import { describe, expect, it } from "vitest";
import {
  GAME_RULE_DEFAULTS,
  GAME_RULE_PRESETS,
  applyGameRuleClockMode,
  applyGameRulePreset,
  toGameRulesResponse,
} from "@/lib/tournaments/game-rules";

describe("game-rules", () => {
  it("keeps time presets separate from clock mode", () => {
    expect(GAME_RULE_PRESETS.map((preset) => preset.label)).toEqual([
      "7분 4쿼터",
      "6분 4쿼터",
      "10분 4쿼터",
      "10분 전후반",
    ]);

    const current = { ...GAME_RULE_DEFAULTS, clockMode: "nonstop" as const };
    const next = applyGameRulePreset(current, GAME_RULE_PRESETS[0]!);

    expect(next.quarterType).toBe("4Q");
    expect(next.quarterMinutes).toBe(7);
    expect(next.clockMode).toBe("nonstop");
  });

  it("updates clock mode without changing the selected time preset", () => {
    const current = applyGameRulePreset(GAME_RULE_DEFAULTS, GAME_RULE_PRESETS[0]!);
    const next = applyGameRuleClockMode(current, "dead");

    expect(next.quarterType).toBe("4Q");
    expect(next.quarterMinutes).toBe(7);
    expect(next.clockMode).toBe("dead");
  });

  it("exposes period and clock mode as separate v1 response fields", () => {
    const response = toGameRulesResponse({
      quarterType: "4Q",
      quarterMinutes: 7,
      clockMode: "nonstop",
    });

    expect(response.quarter_type).toBe("4Q");
    expect(response.quarter_minutes).toBe(7);
    expect(response.clock_mode).toBe("nonstop");
    expect(response.game_rules).toMatchObject({
      quarterType: "4Q",
      quarterMinutes: 7,
      clockMode: "nonstop",
    });
  });
});
