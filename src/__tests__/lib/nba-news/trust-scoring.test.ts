import { describe, expect, it } from "vitest";

import { NBA_NEWS_SOURCE_BY_HANDLE, NBA_RUMOR_WATCH_SOURCES } from "@/lib/nba-news/sources.seed";
import { evaluateNbaNewsTrust, scoreNbaNewsTrust } from "@/lib/nba-news/trust-scoring";
import type { NbaNewsSource } from "@/lib/nba-news/types";

function sourceByHandle(handle: string): NbaNewsSource {
  const source = NBA_NEWS_SOURCE_BY_HANDLE.get(handle.toLowerCase());
  if (!source) throw new Error(`Missing NBA news seed source: ${handle}`);
  return source;
}

describe("NBA news trust scoring", () => {
  it("maps official team sources to official review candidates", () => {
    const result = evaluateNbaNewsTrust({
      sources: [sourceByHandle("Lakers")],
      eventRisk: "high",
      eventType: "injury",
    });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.hasOfficialSource).toBe(true);
    expect(result.verificationStatus).toBe("official");
    expect(result.editorialStatus).toBe("needs_review");
  });

  it("keeps a low-risk T1 insider report as reported_single", () => {
    const result = evaluateNbaNewsTrust({
      sources: [sourceByHandle("ShamsCharania")],
      eventRisk: "low",
      eventType: "signing",
    });

    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.verificationStatus).toBe("reported_single");
    expect(result.editorialStatus).toBe("needs_review");
  });

  it("downgrades high-risk single-source reports to developing", () => {
    const result = evaluateNbaNewsTrust({
      sources: [sourceByHandle("ShamsCharania")],
      eventRisk: "high",
      eventType: "trade",
    });

    expect(result.independentSourceCount).toBe(1);
    expect(result.verificationStatus).toBe("developing");
    expect(result.editorialStatus).toBe("draft");
  });

  it("keeps rumor-watch sources out of publishable editorial states", () => {
    const result = evaluateNbaNewsTrust({
      sources: [NBA_RUMOR_WATCH_SOURCES[0]],
      eventRisk: "medium",
      eventType: "trade",
    });

    expect(result.score).toBeLessThanOrEqual(44);
    expect(result.verificationStatus).toBe("rumor");
    expect(result.editorialStatus).toBe("queue_only");
  });

  it("treats analyst-only material as analysis drafts", () => {
    const result = evaluateNbaNewsTrust({
      sources: [sourceByHandle("ZachLowe_NBA")],
      eventRisk: "low",
      eventType: "analysis",
    });

    expect(result.verificationStatus).toBe("analysis");
    expect(result.editorialStatus).toBe("draft");
  });

  it("scores raw trust inputs without source registry context", () => {
    const result = scoreNbaNewsTrust({
      sourceTierScore: 62,
      independenceScore: 15,
      officialityScore: 0,
      specificityScore: 8,
      riskPenalty: 0,
    });

    expect(result.score).toBe(85);
    expect(result.verificationStatus).toBe("confirmed_multiple");
    expect(result.editorialStatus).toBe("needs_review");
  });
});
