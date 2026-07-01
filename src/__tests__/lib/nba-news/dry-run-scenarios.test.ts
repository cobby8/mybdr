import { describe, expect, it } from "vitest";

import {
  createNbaNewsScenarioDryRun,
  getNbaNewsDryRunScenario,
  NBA_NEWS_DRY_RUN_SCENARIOS,
} from "@/lib/nba-news/dry-run-scenarios";

describe("NBA news dry-run scenarios", () => {
  it("keeps scenario ids unique", () => {
    const ids = NBA_NEWS_DRY_RUN_SCENARIOS.map((scenario) => scenario.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns null for unknown scenario ids", () => {
    expect(getNbaNewsDryRunScenario("missing")).toBeNull();
    expect(createNbaNewsScenarioDryRun("missing")).toBeNull();
  });

  it("runs the official injury scenario as an official review draft", () => {
    const dryRun = createNbaNewsScenarioDryRun("official_injury_update");

    expect(dryRun?.result.event.verificationStatus).toBe("official");
    expect(dryRun?.result.articleDraft.editorialStatus).toBe("needs_review");
    expect(dryRun?.result.missingHandles).toEqual([]);
  });

  it("runs the single insider trade scenario as developing draft", () => {
    const dryRun = createNbaNewsScenarioDryRun("single_insider_trade");

    expect(dryRun?.result.trust.independentSourceCount).toBe(1);
    expect(dryRun?.result.event.verificationStatus).toBe("developing");
    expect(dryRun?.result.articleDraft.editorialStatus).toBe("draft");
  });

  it("runs the multi-source signing scenario as confirmed multiple", () => {
    const dryRun = createNbaNewsScenarioDryRun("multi_source_signing");

    expect(dryRun?.result.trust.independentSourceCount).toBe(2);
    expect(dryRun?.result.event.verificationStatus).toBe("confirmed_multiple");
    expect(dryRun?.result.articleDraft.editorialStatus).toBe("needs_review");
  });

  it("runs the unknown source scenario as queue-only rumor", () => {
    const dryRun = createNbaNewsScenarioDryRun("unknown_source_rumor");

    expect(dryRun?.result.missingHandles).toEqual(["NotASeededSource"]);
    expect(dryRun?.result.event.verificationStatus).toBe("rumor");
    expect(dryRun?.result.articleDraft.editorialStatus).toBe("queue_only");
  });
});
