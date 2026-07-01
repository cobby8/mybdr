import type {
  NbaNewsEditorialStatus,
  NbaNewsEventRisk,
  NbaNewsEventType,
  NbaNewsSource,
  NbaNewsSourceType,
  NbaNewsTier,
  NbaNewsVerificationStatus,
  NbaTrustScoreInput,
  NbaTrustScoreResult,
} from "./types";

const SOURCE_TIER_SCORE: Record<NbaNewsTier, number> = {
  T0: 70,
  T1: 62,
  T2: 50,
  T3: 45,
  T4: 35,
  T5: 10,
  legacy: 0,
};

const RISK_PENALTY: Record<NbaNewsEventRisk, number> = {
  low: 0,
  medium: -5,
  high: -15,
};

export interface NbaTrustEvaluationInput {
  sources: readonly NbaNewsSource[];
  eventRisk: NbaNewsEventRisk;
  eventType?: NbaNewsEventType;
  specificityScore?: number;
}

export interface NbaTrustEvaluationResult extends NbaTrustScoreResult {
  input: NbaTrustScoreInput;
  sourceCount: number;
  independentSourceCount: number;
  hasOfficialSource: boolean;
}

function clampScore(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function getStrongestTierScore(sources: readonly NbaNewsSource[]): number {
  return sources.reduce(
    (score, source) => Math.max(score, SOURCE_TIER_SCORE[source.tier] ?? 0),
    0,
  );
}

function isOfficialSource(source: NbaNewsSource): boolean {
  return source.sourceType === "official_league" || source.sourceType === "official_team";
}

function getIndependentSourceCount(sources: readonly NbaNewsSource[]): number {
  const keys = new Set(
    sources
      .filter((source) => source.isActive)
      .map((source) => source.handle ?? source.sourceUrl ?? source.displayName),
  );
  return keys.size;
}

function getIndependenceScore(independentSourceCount: number): number {
  if (independentSourceCount >= 3) return 20;
  if (independentSourceCount === 2) return 20;
  if (independentSourceCount === 1) return 0;
  return 0;
}

function getOfficialityScore(sources: readonly NbaNewsSource[]): number {
  if (sources.some(isOfficialSource)) return 25;
  if (sources.some((source) => source.sourceType === "media_account")) return 8;
  return 0;
}

function getRiskPenalty(
  sources: readonly NbaNewsSource[],
  eventRisk: NbaNewsEventRisk,
): number {
  let penalty = sources.some(isOfficialSource) ? 0 : RISK_PENALTY[eventRisk];

  if (sources.some((source) => source.sourceType === "rumor_watch")) {
    penalty -= 30;
  }

  if (sources.every((source) => !source.isPublishEligible)) {
    penalty -= 30;
  }

  return Math.max(-30, penalty);
}

function hasOnlyBackgroundSources(sources: readonly NbaNewsSource[]): boolean {
  return sources.length > 0 && sources.every((source) => source.sourceType === "analyst");
}

function sourceHasType(
  sources: readonly NbaNewsSource[],
  sourceType: NbaNewsSourceType,
): boolean {
  return sources.some((source) => source.sourceType === sourceType);
}

function getStatusByScore(score: number): {
  verificationStatus: NbaNewsVerificationStatus;
  editorialStatus: NbaNewsEditorialStatus;
} {
  if (score >= 85) {
    return { verificationStatus: "confirmed_multiple", editorialStatus: "needs_review" };
  }
  if (score >= 65) {
    return { verificationStatus: "reported_single", editorialStatus: "needs_review" };
  }
  if (score >= 45) {
    return { verificationStatus: "developing", editorialStatus: "draft" };
  }
  return { verificationStatus: "rumor", editorialStatus: "queue_only" };
}

export function scoreNbaNewsTrust(input: NbaTrustScoreInput): NbaTrustScoreResult {
  const score = clampScore(
    input.sourceTierScore +
      input.independenceScore +
      input.officialityScore +
      input.specificityScore +
      input.riskPenalty,
  );
  const status = getStatusByScore(score);

  return {
    score,
    verificationStatus:
      input.officialityScore >= 25 && score >= 65
        ? "official"
        : status.verificationStatus,
    editorialStatus: status.editorialStatus,
  };
}

export function evaluateNbaNewsTrust({
  sources,
  eventRisk,
  eventType,
  specificityScore = 8,
}: NbaTrustEvaluationInput): NbaTrustEvaluationResult {
  const sourceCount = sources.length;
  const independentSourceCount = getIndependentSourceCount(sources);
  const hasOfficialSource = sources.some(isOfficialSource);
  const input: NbaTrustScoreInput = {
    sourceTierScore: getStrongestTierScore(sources),
    independenceScore: getIndependenceScore(independentSourceCount),
    officialityScore: getOfficialityScore(sources),
    specificityScore: clampScore(specificityScore, 0, 10),
    riskPenalty: getRiskPenalty(sources, eventRisk),
  };
  const scored = scoreNbaNewsTrust(input);

  if (sourceCount === 0 || sourceHasType(sources, "rumor_watch")) {
    return {
      ...scored,
      score: Math.min(scored.score, 44),
      verificationStatus: "rumor",
      editorialStatus: "queue_only",
      input,
      sourceCount,
      independentSourceCount,
      hasOfficialSource,
    };
  }

  if (hasOnlyBackgroundSources(sources) || eventType === "analysis") {
    return {
      ...scored,
      verificationStatus: "analysis",
      editorialStatus: "draft",
      input,
      sourceCount,
      independentSourceCount,
      hasOfficialSource,
    };
  }

  if (eventRisk === "high" && !hasOfficialSource && independentSourceCount < 2) {
    return {
      ...scored,
      verificationStatus: "developing",
      editorialStatus: "draft",
      input,
      sourceCount,
      independentSourceCount,
      hasOfficialSource,
    };
  }

  return {
    ...scored,
    input,
    sourceCount,
    independentSourceCount,
    hasOfficialSource,
  };
}
