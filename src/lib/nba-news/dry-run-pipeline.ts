import { NBA_NEWS_SOURCE_BY_HANDLE } from "./sources.seed";
import { evaluateNbaNewsTrust, type NbaTrustEvaluationResult } from "./trust-scoring";
import type {
  NbaNewsArticleDraft,
  NbaNewsEditorialStatus,
  NbaNewsEvent,
  NbaNewsEventRisk,
  NbaNewsEventSource,
  NbaNewsEventType,
  NbaNewsSource,
  NbaNewsVerificationStatus,
  NbaSourcePost,
} from "./types";

export interface NbaNewsMockSignal {
  sourceHandle: string;
  externalId: string;
  postedAt: string;
  externalUrl?: string;
  textExcerpt?: string | null;
  aiSummary?: string | null;
  role?: NbaNewsEventSource["role"];
}

export interface NbaNewsDryRunInput {
  eventType: NbaNewsEventType;
  eventRisk: NbaNewsEventRisk;
  normalizedTitle: string;
  signals: readonly NbaNewsMockSignal[];
  capturedAt?: string;
  specificityScore?: number;
  subjectTeamCode?: string | null;
  subjectPlayerName?: string | null;
}

export interface NbaNewsDryRunResult {
  event: NbaNewsEvent;
  articleDraft: NbaNewsArticleDraft;
  sourcePosts: NbaSourcePost[];
  sources: NbaNewsSource[];
  missingHandles: string[];
  trust: NbaTrustEvaluationResult;
}

function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

function makeDryRunEventId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `dry-run:${slug || "nba-news-event"}`;
}

function getDefaultExternalUrl(signal: NbaNewsMockSignal): string {
  const handle = normalizeHandle(signal.sourceHandle);
  return `https://x.com/${handle}/status/${signal.externalId}`;
}

function inferSourceRole(
  source: NbaNewsSource,
  index: number,
): NbaNewsEventSource["role"] {
  if (source.sourceType === "official_league" || source.sourceType === "official_team") {
    return "official";
  }
  if (source.sourceType === "analyst" || source.sourceType === "media_account") {
    return "background";
  }
  return index === 0 ? "primary" : "corroborating";
}

function formatSourceName(source: NbaNewsSource): string {
  return source.handle
    ? `${source.displayName} (@${source.handle})`
    : source.displayName;
}

function buildDraftBody(args: {
  title: string;
  trust: NbaTrustEvaluationResult;
  sourceCount: number;
  missingHandles: readonly string[];
}): string {
  const lines = [
    args.title,
    "",
    `Verification: ${args.trust.verificationStatus}.`,
    `Editorial status: ${args.trust.editorialStatus}.`,
    `Source signals: ${args.sourceCount}.`,
  ];

  if (args.missingHandles.length > 0) {
    lines.push(`Missing source handles: ${args.missingHandles.join(", ")}.`);
  }

  lines.push(
    "",
    "This is a deterministic dry-run draft. A reporter prompt should rewrite it before public publication.",
  );

  return lines.join("\n");
}

export function createNbaNewsDryRun(input: NbaNewsDryRunInput): NbaNewsDryRunResult {
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const missingHandles: string[] = [];
  const sources: NbaNewsSource[] = [];
  const sourcePosts: NbaSourcePost[] = [];
  const eventSources: NbaNewsEventSource[] = [];

  input.signals.forEach((signal, index) => {
    const handleKey = normalizeHandle(signal.sourceHandle);
    const source = NBA_NEWS_SOURCE_BY_HANDLE.get(handleKey);

    if (!source) {
      missingHandles.push(signal.sourceHandle);
      return;
    }

    sources.push(source);
    sourcePosts.push({
      sourceId: source.handle ?? source.sourceUrl ?? source.displayName,
      platform: source.platform,
      externalId: signal.externalId,
      externalUrl: signal.externalUrl ?? getDefaultExternalUrl(signal),
      postedAt: signal.postedAt,
      capturedAt,
      textExcerpt: signal.textExcerpt ?? null,
      aiSummary: signal.aiSummary ?? null,
      rawMeta: { dryRun: true },
    });
    eventSources.push({
      sourcePostId: signal.externalId,
      role: signal.role ?? inferSourceRole(source, index),
    });
  });

  const trust = evaluateNbaNewsTrust({
    sources,
    eventRisk: input.eventRisk,
    eventType: input.eventType,
    specificityScore: input.specificityScore,
  });
  const eventId = makeDryRunEventId(input.normalizedTitle);
  const sourceNote =
    sources.length > 0
      ? `Sources: ${sources.map(formatSourceName).join(", ")}.`
      : "Sources: none matched in seed registry.";
  const articleDraft: NbaNewsArticleDraft = {
    eventId,
    title: input.normalizedTitle,
    lead: null,
    body: buildDraftBody({
      title: input.normalizedTitle,
      trust,
      sourceCount: sourcePosts.length,
      missingHandles,
    }),
    sourceNote,
    uncertaintyNote:
      trust.verificationStatus === "official"
        ? null
        : "This event needs additional confirmation before public publication.",
    verificationStatus: trust.verificationStatus as NbaNewsVerificationStatus,
    editorialStatus: trust.editorialStatus as NbaNewsEditorialStatus,
    aiModel: null,
    aiPromptVersion: "dry-run-v1",
    qualityScore: null,
  };
  const event: NbaNewsEvent = {
    id: eventId,
    eventType: input.eventType,
    eventRisk: input.eventRisk,
    subjectTeamCode: input.subjectTeamCode ?? null,
    subjectPlayerName: input.subjectPlayerName ?? null,
    normalizedTitle: input.normalizedTitle,
    verificationStatus: trust.verificationStatus,
    confidenceScore: trust.score,
    firstSeenAt: sourcePosts[0]?.postedAt ?? capturedAt,
    lastSeenAt: sourcePosts.at(-1)?.postedAt ?? capturedAt,
    sources: eventSources,
  };

  return {
    event,
    articleDraft,
    sourcePosts,
    sources,
    missingHandles,
    trust,
  };
}
