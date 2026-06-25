import { describe, expect, it } from "vitest";
import {
  ADVANCE_PER_GROUP_DEFAULT,
  ALLOWED_FORMATS,
  FORMAT_LABEL,
  calculateTotalTeams,
  shouldShowAdvancePerGroup,
  showGroupSettings,
  showRankingFormat,
  validateDivisionSettings,
} from "@/lib/tournaments/division-formats";

describe("division-formats - ALLOWED_FORMATS", () => {
  it("standardizes on the six supported tournament formats", () => {
    expect(ALLOWED_FORMATS).toEqual([
      "single_elimination",
      "round_robin",
      "dual_tournament",
      "group_stage_knockout",
      "league_advancement",
      "group_stage_with_ranking",
    ]);
  });
});

describe("division-formats - FORMAT_LABEL", () => {
  it("uses the approved Korean labels", () => {
    expect(FORMAT_LABEL).toEqual({
      single_elimination: "토너먼트",
      round_robin: "풀리그",
      dual_tournament: "듀얼토너먼트",
      group_stage_knockout: "조별리그+토너먼트",
      league_advancement: "링크제",
      group_stage_with_ranking: "조별리그+동순위 순위결정전",
    });
  });
});

describe("division-formats - display helpers", () => {
  it("shows group settings only for formats that need groups", () => {
    expect(showGroupSettings("single_elimination")).toBe(false);
    expect(showGroupSettings("round_robin")).toBe(true);
    expect(showGroupSettings("dual_tournament")).toBe(true);
    expect(showGroupSettings("group_stage_knockout")).toBe(true);
    expect(showGroupSettings("league_advancement")).toBe(true);
    expect(showGroupSettings("group_stage_with_ranking")).toBe(true);
    expect(showGroupSettings("double_elimination")).toBe(false);
    expect(showGroupSettings("full_league_knockout")).toBe(false);
    expect(showGroupSettings("swiss")).toBe(false);
    expect(showGroupSettings(null)).toBe(false);
  });

  it("shows ranking format only for group-stage ranking format", () => {
    expect(showRankingFormat("group_stage_with_ranking")).toBe(true);
    expect(showRankingFormat("league_advancement")).toBe(false);
    expect(showRankingFormat("round_robin")).toBe(false);
    expect(showRankingFormat(null)).toBe(false);
  });

  it("shows advance-per-group only for finals-entry formats", () => {
    expect(shouldShowAdvancePerGroup("group_stage_knockout")).toBe(true);
    expect(shouldShowAdvancePerGroup("dual_tournament")).toBe(true);
    expect(shouldShowAdvancePerGroup("league_advancement")).toBe(false);
    expect(shouldShowAdvancePerGroup("group_stage_with_ranking")).toBe(false);
    expect(shouldShowAdvancePerGroup("round_robin")).toBe(false);
  });
});

describe("division-formats - validateDivisionSettings", () => {
  it("accepts empty settings", () => {
    expect(validateDivisionSettings(null)).toBeNull();
    expect(validateDivisionSettings(undefined)).toBeNull();
    expect(validateDivisionSettings({})).toBeNull();
  });

  it("validates group_size and group_count", () => {
    expect(validateDivisionSettings({ group_size: 4, group_count: 2 })).toBeNull();
    expect(validateDivisionSettings({ group_size: 0 })?.field).toBe("group_size");
    expect(validateDivisionSettings({ group_count: 100 })?.field).toBe("group_count");
  });

  it("validates ranking_format", () => {
    expect(validateDivisionSettings({ ranking_format: "round_robin" })).toBeNull();
    expect(validateDivisionSettings({ ranking_format: "single_elimination" })).toBeNull();
    expect(validateDivisionSettings({ ranking_format: "double_elimination" })?.field).toBe(
      "ranking_format",
    );
  });

  it("validates advance_per_group", () => {
    expect(ADVANCE_PER_GROUP_DEFAULT).toBe(2);
    expect(validateDivisionSettings({ group_size: 4, advance_per_group: 2 })).toBeNull();
    expect(validateDivisionSettings({ advance_per_group: 0 })?.field).toBe("advance_per_group");
    expect(validateDivisionSettings({ group_size: 4, advance_per_group: 5 })?.field).toBe(
      "advance_per_group",
    );
  });
});

describe("division-formats - calculateTotalTeams", () => {
  it("calculates group size times group count", () => {
    expect(calculateTotalTeams(4, 4)).toBe(16);
    expect(calculateTotalTeams(3, 8)).toBe(24);
  });

  it("returns null for incomplete or invalid input", () => {
    expect(calculateTotalTeams(null, 4)).toBeNull();
    expect(calculateTotalTeams(4, null)).toBeNull();
    expect(calculateTotalTeams(Infinity, 4)).toBeNull();
    expect(calculateTotalTeams(4, NaN)).toBeNull();
  });
});
