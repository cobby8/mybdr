import { describe, expect, it } from "vitest";

import { createNbaNewsDryRun } from "@/lib/nba-news/dry-run-pipeline";

const POSTED_AT = "2026-07-02T00:00:00.000Z";

describe("NBA news dry-run pipeline", () => {
  it("turns an official team signal into an official review draft", () => {
    const result = createNbaNewsDryRun({
      eventType: "injury",
      eventRisk: "high",
      normalizedTitle: "Lakers announce injury update",
      subjectTeamCode: "LAL",
      signals: [
        {
          sourceHandle: "Lakers",
          externalId: "1001",
          postedAt: POSTED_AT,
          textExcerpt: "Injury update from the team.",
        },
      ],
    });

    expect(result.event.id).toBe("dry-run:lakers-announce-injury-update");
    expect(result.event.verificationStatus).toBe("official");
    expect(result.articleDraft.editorialStatus).toBe("needs_review");
    expect(result.articleDraft.sourceNote).toContain("Los Angeles Lakers");
    expect(result.sourcePosts).toHaveLength(1);
  });

  it("keeps high-risk single insider signals in draft developing state", () => {
    const result = createNbaNewsDryRun({
      eventType: "trade",
      eventRisk: "high",
      normalizedTitle: "Star guard trade talks intensify",
      signals: [
        {
          sourceHandle: "@ShamsCharania",
          externalId: "1002",
          postedAt: POSTED_AT,
        },
      ],
    });

    expect(result.trust.independentSourceCount).toBe(1);
    expect(result.event.verificationStatus).toBe("developing");
    expect(result.articleDraft.editorialStatus).toBe("draft");
    expect(result.articleDraft.uncertaintyNote).toContain("additional confirmation");
  });

  it("promotes two independent insider signals to confirmed multiple", () => {
    const result = createNbaNewsDryRun({
      eventType: "signing",
      eventRisk: "medium",
      normalizedTitle: "Free agent center agrees to deal",
      signals: [
        {
          sourceHandle: "ShamsCharania",
          externalId: "1003",
          postedAt: POSTED_AT,
        },
        {
          sourceHandle: "TheSteinLine",
          externalId: "1004",
          postedAt: "2026-07-02T00:02:00.000Z",
        },
      ],
    });

    expect(result.trust.independentSourceCount).toBe(2);
    expect(result.event.verificationStatus).toBe("confirmed_multiple");
    expect(result.articleDraft.editorialStatus).toBe("needs_review");
    expect(result.sourcePosts).toHaveLength(2);
  });

  it("collects unknown handles without crashing the dry-run", () => {
    const result = createNbaNewsDryRun({
      eventType: "trade",
      eventRisk: "medium",
      normalizedTitle: "Unknown source posts trade rumor",
      signals: [
        {
          sourceHandle: "NotASeededSource",
          externalId: "1005",
          postedAt: POSTED_AT,
        },
      ],
    });

    expect(result.missingHandles).toEqual(["NotASeededSource"]);
    expect(result.sources).toHaveLength(0);
    expect(result.event.verificationStatus).toBe("rumor");
    expect(result.articleDraft.editorialStatus).toBe("queue_only");
  });
});
