import { createNbaNewsDryRun, type NbaNewsDryRunInput } from "./dry-run-pipeline";

export const NBA_NEWS_DRY_RUN_SCENARIO_IDS = [
  "official_injury_update",
  "single_insider_trade",
  "multi_source_signing",
  "unknown_source_rumor",
] as const;

export type NbaNewsDryRunScenarioId =
  (typeof NBA_NEWS_DRY_RUN_SCENARIO_IDS)[number];

export interface NbaNewsDryRunScenario {
  id: NbaNewsDryRunScenarioId;
  label: string;
  description: string;
  input: NbaNewsDryRunInput;
}

const POSTED_AT = "2026-07-02T00:00:00.000Z";

export const NBA_NEWS_DRY_RUN_SCENARIOS = [
  {
    id: "official_injury_update",
    label: "Official injury update",
    description: "Official team account publishes a high-risk injury update.",
    input: {
      eventType: "injury",
      eventRisk: "high",
      normalizedTitle: "Lakers announce injury update",
      subjectTeamCode: "LAL",
      signals: [
        {
          sourceHandle: "Lakers",
          externalId: "dry-official-1001",
          postedAt: POSTED_AT,
          textExcerpt: "Injury update from the team.",
        },
      ],
    },
  },
  {
    id: "single_insider_trade",
    label: "Single insider trade",
    description: "One tier-one insider reports a high-risk trade development.",
    input: {
      eventType: "trade",
      eventRisk: "high",
      normalizedTitle: "Star guard trade talks intensify",
      signals: [
        {
          sourceHandle: "ShamsCharania",
          externalId: "dry-single-1002",
          postedAt: POSTED_AT,
          textExcerpt: "A tier-one insider reports a trade development.",
        },
      ],
    },
  },
  {
    id: "multi_source_signing",
    label: "Multi-source signing",
    description: "Two independent tier-one insiders report the same signing.",
    input: {
      eventType: "signing",
      eventRisk: "medium",
      normalizedTitle: "Free agent center agrees to deal",
      signals: [
        {
          sourceHandle: "ShamsCharania",
          externalId: "dry-multi-1003",
          postedAt: POSTED_AT,
        },
        {
          sourceHandle: "TheSteinLine",
          externalId: "dry-multi-1004",
          postedAt: "2026-07-02T00:02:00.000Z",
        },
      ],
    },
  },
  {
    id: "unknown_source_rumor",
    label: "Unknown source rumor",
    description: "Unseeded account posts a rumor, which must stay queue-only.",
    input: {
      eventType: "trade",
      eventRisk: "medium",
      normalizedTitle: "Unknown source posts trade rumor",
      signals: [
        {
          sourceHandle: "NotASeededSource",
          externalId: "dry-rumor-1005",
          postedAt: POSTED_AT,
        },
      ],
    },
  },
] satisfies readonly NbaNewsDryRunScenario[];

const NBA_NEWS_DRY_RUN_SCENARIO_BY_ID = new Map(
  NBA_NEWS_DRY_RUN_SCENARIOS.map((scenario) => [scenario.id, scenario]),
);

export function getNbaNewsDryRunScenario(
  id: string,
): NbaNewsDryRunScenario | null {
  return NBA_NEWS_DRY_RUN_SCENARIO_BY_ID.get(id as NbaNewsDryRunScenarioId) ?? null;
}

export function createNbaNewsScenarioDryRun(id: string) {
  const scenario = getNbaNewsDryRunScenario(id);

  if (!scenario) {
    return null;
  }

  return {
    scenario,
    result: createNbaNewsDryRun(scenario.input),
  };
}
