import {
  buildNbaReporterPrompt,
  type NbaReporterPromptContract,
  type NbaReporterPromptInput,
} from "./reporter-prompt";
import type {
  NbaNewsArticleDraft,
  NbaNewsEditorialStatus,
  NbaNewsSource,
  NbaSourcePost,
} from "./types";

export const NBA_REPORTER_PREVIEW_MODEL = "deterministic-preview-v1" as const;

export interface NbaReporterArticleGenerationResult {
  prompt: NbaReporterPromptContract;
  articleDraft: NbaNewsArticleDraft;
  renderedMarkdown: string;
  publicArticleAllowed: boolean;
  requiresEditorReview: boolean;
}

function formatSourceName(source: NbaNewsSource | undefined): string {
  if (!source) return "an unseeded source";

  return source.handle
    ? `${source.displayName} (@${source.handle})`
    : source.displayName;
}

function formatSourceLine(
  source: NbaNewsSource | undefined,
  post: NbaSourcePost | undefined,
): string {
  if (!post) return `- ${formatSourceName(source)}: no captured post`;

  return `- ${formatSourceName(source)}: ${post.externalUrl}`;
}

function buildSourceLines(input: NbaReporterPromptInput): string {
  if (input.sourcePosts.length === 0) {
    return "- No seeded source post matched this event.";
  }

  return input.sourcePosts
    .map((post, index) => formatSourceLine(input.sources[index], post))
    .join("\n");
}

function getPrimarySourceName(input: NbaReporterPromptInput): string {
  return formatSourceName(input.sources[0]);
}

function sentenceCaseTitle(title: string): string {
  return title.charAt(0).toLowerCase() + title.slice(1);
}

function buildLead(
  input: NbaReporterPromptInput,
  prompt: NbaReporterPromptContract,
): string {
  const title = input.event.normalizedTitle;
  const primarySource = getPrimarySourceName(input);

  switch (prompt.policy.editorialMode) {
    case "verified_report":
      return prompt.policy.mustAttribute
        ? `${title} has enough corroboration for an editor-review draft, based on the listed sources.`
        : `${title} is being treated as an official update from ${primarySource}.`;
    case "single_source_report":
      return `According to ${primarySource}, ${sentenceCaseTitle(title)}.`;
    case "developing_note":
      return `${primarySource} surfaced a developing item around ${sentenceCaseTitle(title)}, but it still needs confirmation before publication language is used.`;
    case "analysis_draft":
      return `${title} is framed as analysis based only on the supplied source brief.`;
    case "monitoring_note":
      return "This item is held from public publication and should stay in the monitoring queue.";
  }
}

function getPreviewEditorialStatus(
  prompt: NbaReporterPromptContract,
): NbaNewsEditorialStatus {
  if (prompt.policy.outputKind === "internal_monitoring_note") return "queue_only";
  if (
    prompt.policy.editorialMode === "developing_note" ||
    prompt.policy.editorialMode === "analysis_draft"
  ) {
    return "draft";
  }
  return "needs_review";
}

function buildUncertaintyNote(
  input: NbaReporterPromptInput,
  prompt: NbaReporterPromptContract,
): string | null {
  if (prompt.policy.outputKind === "internal_monitoring_note") {
    return "Not for public publication until a seeded source confirms the event.";
  }

  if (prompt.policy.editorialMode === "developing_note") {
    return "Developing item; avoid confirmed-language until another independent source or an official account corroborates it.";
  }

  if (prompt.policy.editorialMode === "single_source_report") {
    return "Single-source item; every material claim needs attribution and editor approval.";
  }

  if (prompt.policy.editorialMode === "analysis_draft") {
    return "Analysis draft; keep reported facts separate from interpretation.";
  }

  if (input.event.verificationStatus === "official") return null;

  return "Editor review required before publication.";
}

function buildMonitoringMarkdown(input: NbaReporterPromptInput): string {
  const missing =
    input.missingHandles && input.missingHandles.length > 0
      ? input.missingHandles.join(", ")
      : "none";

  return [
    "## STATUS",
    "Held from public feed.",
    "",
    "## WHY_HELD",
    "The event is either queue-only, unverified, or missing seeded source confirmation.",
    "",
    "## KNOWN_FACTS",
    `- Event: ${input.event.normalizedTitle}`,
    `- Verification: ${input.event.verificationStatus}`,
    `- Confidence score: ${input.event.confidenceScore}`,
    `- Missing handles: ${missing}`,
    "",
    "## NEXT_CHECKS",
    "- Wait for an official account or at least one publish-eligible insider source.",
    "- Re-run trust scoring after new source signals arrive.",
    "",
    "## SOURCES",
    buildSourceLines(input),
  ].join("\n");
}

function buildArticleMarkdown(args: {
  input: NbaReporterPromptInput;
  prompt: NbaReporterPromptContract;
  lead: string;
}): string {
  const { input, prompt, lead } = args;
  const uncertaintyNote = buildUncertaintyNote(input, prompt);
  const sections = [
    "## TITLE",
    input.event.normalizedTitle,
    "",
    "## LEAD",
    lead,
    "",
    "## BODY",
    [
      `Event type: ${input.event.eventType}.`,
      `Verification status: ${input.event.verificationStatus}.`,
      `Risk level: ${input.event.eventRisk}.`,
      `Confidence score: ${input.event.confidenceScore}.`,
      `The draft should stay within the supplied source brief and avoid unsupported details.`,
    ].join(" "),
    "",
    "## SOURCE_NOTE",
    input.articleDraft.sourceNote ?? buildSourceLines(input),
  ];

  if (prompt.policy.outputKind === "analysis_draft") {
    sections.push(
      "",
      "## FACTS_USED",
      buildSourceLines(input),
      "",
      "## ANALYSIS_BOUNDARY",
      "This preview separates sourced facts from interpretation and does not create new reporting.",
    );
  } else {
    sections.push(
      "",
      "## UNCERTAINTY_NOTE",
      uncertaintyNote ?? "No additional uncertainty note beyond editor review.",
      "",
      "## EDITOR_CHECKLIST",
      "- Verify source identity and URL.",
      "- Confirm no unsupported contract, injury, trade, quote, or motive detail was added.",
      "- Confirm attribution language matches the verification status.",
    );
  }

  return sections.join("\n");
}

export function generateNbaReporterArticlePreview(
  input: NbaReporterPromptInput,
): NbaReporterArticleGenerationResult {
  const prompt = buildNbaReporterPrompt(input);
  const lead = buildLead(input, prompt);
  const renderedMarkdown =
    prompt.policy.outputKind === "internal_monitoring_note"
      ? buildMonitoringMarkdown(input)
      : buildArticleMarkdown({ input, prompt, lead });
  const editorialStatus = getPreviewEditorialStatus(prompt);
  const articleDraft: NbaNewsArticleDraft = {
    ...input.articleDraft,
    title:
      prompt.policy.outputKind === "internal_monitoring_note"
        ? `[Monitoring] ${input.event.normalizedTitle}`
        : input.event.normalizedTitle,
    lead: prompt.policy.outputKind === "internal_monitoring_note" ? null : lead,
    body: renderedMarkdown,
    sourceNote: input.articleDraft.sourceNote,
    uncertaintyNote: buildUncertaintyNote(input, prompt),
    verificationStatus: input.event.verificationStatus,
    editorialStatus,
    aiModel: NBA_REPORTER_PREVIEW_MODEL,
    aiPromptVersion: prompt.promptVersion,
    qualityScore: Math.max(0, Math.min(100, input.event.confidenceScore)),
  };

  return {
    prompt,
    articleDraft,
    renderedMarkdown,
    publicArticleAllowed: prompt.policy.articleDraftAllowed,
    requiresEditorReview: prompt.policy.requiresEditorReview,
  };
}
