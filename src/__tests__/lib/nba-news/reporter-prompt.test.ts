import { describe, expect, it } from "vitest";

import { createNbaNewsDryRun } from "@/lib/nba-news/dry-run-pipeline";
import { createNbaNewsScenarioDryRun } from "@/lib/nba-news/dry-run-scenarios";
import { buildNbaReporterPrompt } from "@/lib/nba-news/reporter-prompt";

function scenarioResult(id: string) {
  const dryRun = createNbaNewsScenarioDryRun(id);
  if (!dryRun) throw new Error(`Missing dry-run scenario: ${id}`);
  return dryRun.result;
}

describe("NBA reporter prompt contract", () => {
  it("allows confirmed language for official reports", () => {
    const prompt = buildNbaReporterPrompt(scenarioResult("official_injury_update"));

    expect(prompt.policy.editorialMode).toBe("verified_report");
    expect(prompt.policy.articleDraftAllowed).toBe(true);
    expect(prompt.policy.canUseConfirmedLanguage).toBe(true);
    expect(prompt.outputContract.requiredSections).toContain("EDITOR_CHECKLIST");
    expect(prompt.userPrompt).toContain("Los Angeles Lakers (@Lakers)");
  });

  it("keeps high-risk single-source reports as developing draft prompts", () => {
    const prompt = buildNbaReporterPrompt(scenarioResult("single_insider_trade"));

    expect(prompt.policy.editorialMode).toBe("developing_note");
    expect(prompt.policy.canUseConfirmedLanguage).toBe(false);
    expect(prompt.userPrompt).toContain("Do not use confirmed, agreed, final");
  });

  it("turns low-risk single-source reports into attributed prompts", () => {
    const dryRun = createNbaNewsDryRun({
      eventType: "signing",
      eventRisk: "low",
      normalizedTitle: "Veteran guard agrees to one-year deal",
      signals: [
        {
          sourceHandle: "ShamsCharania",
          externalId: "single-low-1001",
          postedAt: "2026-07-02T00:00:00.000Z",
        },
      ],
    });
    const prompt = buildNbaReporterPrompt(dryRun);

    expect(prompt.policy.editorialMode).toBe("single_source_report");
    expect(prompt.policy.mustAttribute).toBe(true);
    expect(prompt.policy.canUseConfirmedLanguage).toBe(false);
    expect(prompt.userPrompt).toContain("Tie every material claim to the named source");
  });

  it("allows verified report mode for multi-source reports", () => {
    const prompt = buildNbaReporterPrompt(scenarioResult("multi_source_signing"));

    expect(prompt.policy.editorialMode).toBe("verified_report");
    expect(prompt.policy.canUseConfirmedLanguage).toBe(true);
    expect(prompt.userPrompt).toContain("Shams Charania (@ShamsCharania)");
    expect(prompt.userPrompt).toContain("Marc Stein (@TheSteinLine)");
  });

  it("blocks public article generation for queue-only rumors", () => {
    const prompt = buildNbaReporterPrompt(scenarioResult("unknown_source_rumor"));

    expect(prompt.policy.editorialMode).toBe("monitoring_note");
    expect(prompt.policy.outputKind).toBe("internal_monitoring_note");
    expect(prompt.policy.articleDraftAllowed).toBe(false);
    expect(prompt.outputContract.requiredSections).toContain("WHY_HELD");
    expect(prompt.userPrompt).toContain("Do not write a public article");
  });

  it("clips source excerpts before placing them in the prompt", () => {
    const longExcerpt = "Source detail ".repeat(60);
    const dryRun = createNbaNewsDryRun({
      eventType: "injury",
      eventRisk: "low",
      normalizedTitle: "Team shares rotation update",
      signals: [
        {
          sourceHandle: "Lakers",
          externalId: "clip-1001",
          postedAt: "2026-07-02T00:00:00.000Z",
          textExcerpt: longExcerpt,
        },
      ],
    });
    const prompt = buildNbaReporterPrompt(dryRun);

    expect(prompt.userPrompt).not.toContain(longExcerpt.trim());
    expect(prompt.userPrompt).toContain("...");
  });
});
