import type {
  NbaNewsArticleDraft,
  NbaNewsEvent,
  NbaNewsEventSource,
  NbaNewsSource,
  NbaSourcePost,
} from "./types";

export const NBA_REPORTER_PROMPT_VERSION = "nba-reporter-v1" as const;

export const NBA_REPORTER_EDITORIAL_MODES = [
  "verified_report",
  "single_source_report",
  "developing_note",
  "analysis_draft",
  "monitoring_note",
] as const;

export type NbaReporterEditorialMode =
  (typeof NBA_REPORTER_EDITORIAL_MODES)[number];

export type NbaReporterOutputKind =
  | "article_draft"
  | "analysis_draft"
  | "internal_monitoring_note";

export interface NbaReporterPromptInput {
  event: NbaNewsEvent;
  articleDraft: NbaNewsArticleDraft;
  sourcePosts: readonly NbaSourcePost[];
  sources: readonly NbaNewsSource[];
  missingHandles?: readonly string[];
  outletName?: string;
  language?: "ko-KR";
}

export interface NbaReporterPromptPolicy {
  editorialMode: NbaReporterEditorialMode;
  outputKind: NbaReporterOutputKind;
  articleDraftAllowed: boolean;
  mustAttribute: boolean;
  canUseConfirmedLanguage: boolean;
  requiresEditorReview: boolean;
  requiredDisclosures: string[];
  forbiddenClaims: string[];
}

export interface NbaReporterOutputContract {
  format: "sectioned_markdown";
  language: "ko-KR";
  maxWords: number;
  requiredSections: string[];
}

export interface NbaReporterPromptMessage {
  role: "system" | "user";
  content: string;
}

export interface NbaReporterPromptContract {
  promptVersion: typeof NBA_REPORTER_PROMPT_VERSION;
  policy: NbaReporterPromptPolicy;
  outputContract: NbaReporterOutputContract;
  systemPrompt: string;
  userPrompt: string;
  messages: NbaReporterPromptMessage[];
}

const DEFAULT_OUTLET_NAME = "BDR NEWS NBA desk";
const DEFAULT_LANGUAGE = "ko-KR";
const MAX_SOURCE_TEXT_LENGTH = 280;

function getEditorialMode(input: NbaReporterPromptInput): NbaReporterEditorialMode {
  if (
    input.articleDraft.editorialStatus === "queue_only" ||
    input.event.verificationStatus === "rumor"
  ) {
    return "monitoring_note";
  }

  if (input.event.verificationStatus === "analysis") {
    return "analysis_draft";
  }

  if (
    input.event.verificationStatus === "official" ||
    input.event.verificationStatus === "confirmed_multiple"
  ) {
    return "verified_report";
  }

  if (input.event.verificationStatus === "reported_single") {
    return "single_source_report";
  }

  return "developing_note";
}

function getOutputKind(mode: NbaReporterEditorialMode): NbaReporterOutputKind {
  if (mode === "monitoring_note") return "internal_monitoring_note";
  if (mode === "analysis_draft") return "analysis_draft";
  return "article_draft";
}

function getRequiredSections(kind: NbaReporterOutputKind): string[] {
  if (kind === "internal_monitoring_note") {
    return ["STATUS", "WHY_HELD", "KNOWN_FACTS", "NEXT_CHECKS", "SOURCES"];
  }

  if (kind === "analysis_draft") {
    return [
      "TITLE",
      "LEAD",
      "BODY",
      "FACTS_USED",
      "ANALYSIS_BOUNDARY",
      "SOURCE_NOTE",
    ];
  }

  return [
    "TITLE",
    "LEAD",
    "BODY",
    "SOURCE_NOTE",
    "UNCERTAINTY_NOTE",
    "EDITOR_CHECKLIST",
  ];
}

function getMaxWords(mode: NbaReporterEditorialMode): number {
  if (mode === "monitoring_note") return 350;
  if (mode === "developing_note") return 500;
  if (mode === "analysis_draft") return 800;
  return 650;
}

function buildPolicy(input: NbaReporterPromptInput): NbaReporterPromptPolicy {
  const editorialMode = getEditorialMode(input);
  const outputKind = getOutputKind(editorialMode);
  const canUseConfirmedLanguage =
    input.event.verificationStatus === "official" ||
    input.event.verificationStatus === "confirmed_multiple";

  return {
    editorialMode,
    outputKind,
    articleDraftAllowed: outputKind !== "internal_monitoring_note",
    mustAttribute: input.event.verificationStatus !== "official",
    canUseConfirmedLanguage,
    requiresEditorReview: input.articleDraft.editorialStatus !== "published",
    requiredDisclosures: [
      "Name the reporting source or official account behind each material claim.",
      "Say when the item is still developing, single-sourced, or awaiting confirmation.",
      "Keep excerpts short and link-oriented; do not republish social posts wholesale.",
    ],
    forbiddenClaims: [
      "Do not invent contract terms, medical timelines, trade packages, quotes, or motives.",
      "Do not call a rumor confirmed.",
      "Do not reuse paywalled or social post text as article body.",
      "Do not add background facts that are not present in the brief.",
    ],
  };
}

function normalizeInlineText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clipText(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalized = normalizeInlineText(value);
  if (normalized.length <= MAX_SOURCE_TEXT_LENGTH) return normalized;

  return `${normalized.slice(0, MAX_SOURCE_TEXT_LENGTH - 3).trim()}...`;
}

function formatSourceName(source: NbaNewsSource | undefined): string {
  if (!source) return "Unknown seeded source";

  return source.handle
    ? `${source.displayName} (@${source.handle})`
    : source.displayName;
}

function getSourceRole(
  eventSources: readonly NbaNewsEventSource[],
  sourcePost: NbaSourcePost,
): NbaNewsEventSource["role"] {
  return (
    eventSources.find((eventSource) => eventSource.sourcePostId === sourcePost.externalId)
      ?.role ?? "background"
  );
}

function buildSourceBrief(input: NbaReporterPromptInput): string {
  const lines: string[] = [];

  if (input.sourcePosts.length === 0) {
    lines.push("- No matched source posts in the seed registry.");
  }

  input.sourcePosts.forEach((post, index) => {
    const source = input.sources[index];
    const evidence = clipText(post.aiSummary) ?? clipText(post.textExcerpt);
    const role = getSourceRole(input.event.sources, post);

    lines.push(
      [
        `${index + 1}. ${formatSourceName(source)}`,
        `role=${role}`,
        `tier=${source?.tier ?? "unknown"}`,
        `type=${source?.sourceType ?? "unknown"}`,
        `postedAt=${post.postedAt}`,
        `url=${post.externalUrl}`,
        `evidence=${evidence ?? "No excerpt or summary provided."}`,
      ].join(" | "),
    );
  });

  if (input.missingHandles && input.missingHandles.length > 0) {
    lines.push(`- Missing handles: ${input.missingHandles.join(", ")}`);
  }

  return lines.join("\n");
}

function buildOutputContract(
  policy: NbaReporterPromptPolicy,
): NbaReporterOutputContract {
  return {
    format: "sectioned_markdown",
    language: DEFAULT_LANGUAGE,
    maxWords: getMaxWords(policy.editorialMode),
    requiredSections: getRequiredSections(policy.outputKind),
  };
}

function buildSystemPrompt(outletName: string): string {
  return [
    `You are an NBA news reporter for ${outletName}.`,
    "Write in Korean with a neutral, wire-service style.",
    "Use only the event brief and source brief provided by the editor.",
    "Prioritize accuracy, attribution, uncertainty labels, and reader clarity over speed.",
    "Do not fabricate facts, quotes, motivations, timelines, salary terms, or medical details.",
    "Do not copy social posts or paywalled text into the article body.",
  ].join("\n");
}

function buildTaskInstruction(policy: NbaReporterPromptPolicy): string {
  if (policy.outputKind === "internal_monitoring_note") {
    return "Do not write a public article. Write an internal monitoring note only.";
  }

  if (policy.editorialMode === "developing_note") {
    return "Write a draft-only developing update. Do not use confirmed, agreed, final, or official wording.";
  }

  if (policy.editorialMode === "single_source_report") {
    return "Write an attributed single-source draft. Tie every material claim to the named source.";
  }

  if (policy.editorialMode === "analysis_draft") {
    return "Write an analysis draft. Separate reported facts from interpretation and avoid breaking-news certainty.";
  }

  return "Write a neutral article draft for editor review.";
}

function buildUserPrompt(args: {
  input: NbaReporterPromptInput;
  policy: NbaReporterPromptPolicy;
  outputContract: NbaReporterOutputContract;
}): string {
  const { input, policy, outputContract } = args;

  return [
    `Prompt version: ${NBA_REPORTER_PROMPT_VERSION}`,
    "",
    "Event brief:",
    `- Title: ${input.event.normalizedTitle}`,
    `- Event type: ${input.event.eventType}`,
    `- Risk: ${input.event.eventRisk}`,
    `- Verification: ${input.event.verificationStatus}`,
    `- Confidence score: ${input.event.confidenceScore}`,
    `- Team: ${input.event.subjectTeamCode ?? "not specified"}`,
    `- Player: ${input.event.subjectPlayerName ?? "not specified"}`,
    `- First seen: ${input.event.firstSeenAt}`,
    `- Last seen: ${input.event.lastSeenAt}`,
    "",
    "Editorial policy:",
    `- Mode: ${policy.editorialMode}`,
    `- Output kind: ${policy.outputKind}`,
    `- Article draft allowed: ${policy.articleDraftAllowed ? "yes" : "no"}`,
    `- Must attribute: ${policy.mustAttribute ? "yes" : "no"}`,
    `- Confirmed language allowed: ${policy.canUseConfirmedLanguage ? "yes" : "no"}`,
    `- Editor review required: ${policy.requiresEditorReview ? "yes" : "no"}`,
    `- Required disclosures: ${policy.requiredDisclosures.join(" / ")}`,
    `- Forbidden claims: ${policy.forbiddenClaims.join(" / ")}`,
    "",
    "Source brief:",
    buildSourceBrief(input),
    "",
    "Output contract:",
    `- Format: ${outputContract.format}`,
    `- Language: ${outputContract.language}`,
    `- Max words: ${outputContract.maxWords}`,
    `- Required sections: ${outputContract.requiredSections.join(", ")}`,
    "",
    "Task:",
    buildTaskInstruction(policy),
  ].join("\n");
}

export function buildNbaReporterPrompt(
  input: NbaReporterPromptInput,
): NbaReporterPromptContract {
  const policy = buildPolicy(input);
  const outputContract = buildOutputContract(policy);
  const systemPrompt = buildSystemPrompt(input.outletName ?? DEFAULT_OUTLET_NAME);
  const userPrompt = buildUserPrompt({ input, policy, outputContract });

  return {
    promptVersion: NBA_REPORTER_PROMPT_VERSION,
    policy,
    outputContract,
    systemPrompt,
    userPrompt,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
}
