import { describe, expect, it } from "vitest";

import { generateNbaReporterArticlePreview } from "@/lib/nba-news/article-generator";
import { createNbaNewsDryRun } from "@/lib/nba-news/dry-run-pipeline";
import { createNbaNewsScenarioDryRun } from "@/lib/nba-news/dry-run-scenarios";

function scenarioResult(id: string) {
  const dryRun = createNbaNewsScenarioDryRun(id);
  if (!dryRun) throw new Error(`Missing dry-run scenario: ${id}`);
  return dryRun.result;
}

describe("NBA reporter article generator preview", () => {
  it("renders official source items as editor-review article drafts", () => {
    const result = generateNbaReporterArticlePreview(
      scenarioResult("official_injury_update"),
    );

    expect(result.publicArticleAllowed).toBe(true);
    expect(result.articleDraft.editorialStatus).toBe("needs_review");
    expect(result.articleDraft.aiPromptVersion).toBe("nba-reporter-v1");
    expect(result.renderedMarkdown).toContain("## TITLE");
    expect(result.renderedMarkdown).toContain("Los Angeles Lakers (@Lakers)");
  });

  it("keeps high-risk single-source trade items in draft state", () => {
    const result = generateNbaReporterArticlePreview(
      scenarioResult("single_insider_trade"),
    );

    expect(result.prompt.policy.editorialMode).toBe("developing_note");
    expect(result.articleDraft.editorialStatus).toBe("draft");
    expect(result.articleDraft.uncertaintyNote).toContain("Developing item");
    expect(result.renderedMarkdown).toContain("## UNCERTAINTY_NOTE");
  });

  it("renders low-risk single-source items with attribution policy", () => {
    const dryRun = createNbaNewsDryRun({
      eventType: "signing",
      eventRisk: "low",
      normalizedTitle: "Veteran guard agrees to one-year deal",
      signals: [
        {
          sourceHandle: "ShamsCharania",
          externalId: "single-low-preview-1001",
          postedAt: "2026-07-02T00:00:00.000Z",
        },
      ],
    });
    const result = generateNbaReporterArticlePreview(dryRun);

    expect(result.prompt.policy.editorialMode).toBe("single_source_report");
    expect(result.articleDraft.editorialStatus).toBe("needs_review");
    expect(result.articleDraft.lead).toContain("According to Shams Charania");
    expect(result.articleDraft.uncertaintyNote).toContain("Single-source item");
  });

  it("renders multi-source reports as reviewable article drafts", () => {
    const result = generateNbaReporterArticlePreview(
      scenarioResult("multi_source_signing"),
    );

    expect(result.prompt.policy.editorialMode).toBe("verified_report");
    expect(result.articleDraft.editorialStatus).toBe("needs_review");
    expect(result.renderedMarkdown).toContain("Shams Charania");
    expect(result.renderedMarkdown).toContain("Marc Stein");
  });

  it("blocks queue-only rumors from public article output", () => {
    const result = generateNbaReporterArticlePreview(
      scenarioResult("unknown_source_rumor"),
    );

    expect(result.publicArticleAllowed).toBe(false);
    expect(result.articleDraft.editorialStatus).toBe("queue_only");
    expect(result.articleDraft.title).toContain("[Monitoring]");
    expect(result.renderedMarkdown).toContain("## WHY_HELD");
    expect(result.renderedMarkdown).not.toContain("## TITLE");
  });

  it("renders analysis events with analysis boundary sections", () => {
    const dryRun = createNbaNewsDryRun({
      eventType: "analysis",
      eventRisk: "low",
      normalizedTitle: "How the Lakers rotation could change",
      signals: [
        {
          sourceHandle: "ZachLowe_NBA",
          externalId: "analysis-preview-1001",
          postedAt: "2026-07-02T00:00:00.000Z",
        },
      ],
    });
    const result = generateNbaReporterArticlePreview(dryRun);

    expect(result.prompt.policy.outputKind).toBe("analysis_draft");
    expect(result.articleDraft.editorialStatus).toBe("draft");
    expect(result.renderedMarkdown).toContain("## ANALYSIS_BOUNDARY");
    expect(result.renderedMarkdown).toContain("Zach Lowe");
  });
});
