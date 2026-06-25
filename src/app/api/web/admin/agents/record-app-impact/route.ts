import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, validationError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

type ImpactLevel = "none" | "needs_review" | "risk";
type ContractChange =
  | "none"
  | "field_addition"
  | "field_removal"
  | "field_rename"
  | "semantic_change"
  | "auth_change";
type Compatibility = "maintained" | "may_break" | "unknown";

const stringListSchema = z.array(z.string().trim().min(1).max(400)).max(200);

const responseFieldsSchema = z
  .object({
    added: stringListSchema.optional(),
    removed: stringListSchema.optional(),
    renamed: stringListSchema.optional(),
    semanticChanges: stringListSchema.optional(),
    semantic_changes: stringListSchema.optional(),
  })
  .optional();

const requestSchema = z.object({
  summary: z.string().trim().max(2000).optional(),
  diffSummary: z.string().trim().max(5000).optional(),
  diff_summary: z.string().trim().max(5000).optional(),
  changedFiles: stringListSchema.optional(),
  changed_files: stringListSchema.optional(),
  apiPaths: stringListSchema.optional(),
  api_paths: stringListSchema.optional(),
  dbModels: stringListSchema.optional(),
  db_models: stringListSchema.optional(),
  responseFields: responseFieldsSchema,
  response_fields: responseFieldsSchema,
});

interface NormalizedRequest {
  summary: string;
  diffSummary: string;
  changedFiles: string[];
  apiPaths: string[];
  dbModels: string[];
  responseFields: {
    added: string[];
    removed: string[];
    renamed: string[];
    semanticChanges: string[];
  };
}

const RECORD_APP_META = {
  repository: "https://github.com/cobby8/bdr_stat_v3.git",
  branch: "main",
  checkedCommit: "7676a1a",
  appVersion: "0.1.10+12",
};

const RECORD_APP_FILES = [
  "lib/data/api/api_client.dart",
  "lib/domain/usecases/sync_push_usecase.dart",
  "lib/domain/usecases/build_match_stats_snapshot.dart",
  "lib/domain/usecases/record_event_usecase.dart",
  "lib/data/auth/token_storage.dart",
];

const RECORD_APP_TESTS = [
  "test/domain/sync_push_usecase_test.dart",
  "test/domain/build_match_stats_snapshot_test.dart",
  "test/di/auth_notifier_test.dart",
  "test/di/scoreboard_broadcaster_test.dart",
];

export async function POST(req: NextRequest) {
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin permission required", 403, "FORBIDDEN");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON request", 400, "BAD_REQUEST");
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  const normalized = normalizeRequest(parsed.data);
  const analysis = analyzeRecordAppImpact(normalized);
  await logRecordAppImpact(normalized, analysis);

  return apiSuccess(analysis);
}

function normalizeRequest(input: z.infer<typeof requestSchema>): NormalizedRequest {
  const responseFields = input.responseFields ?? input.response_fields ?? {};

  return {
    summary: input.summary ?? "",
    diffSummary: input.diffSummary ?? input.diff_summary ?? "",
    changedFiles: input.changedFiles ?? input.changed_files ?? [],
    apiPaths: input.apiPaths ?? input.api_paths ?? [],
    dbModels: input.dbModels ?? input.db_models ?? [],
    responseFields: {
      added: responseFields.added ?? [],
      removed: responseFields.removed ?? [],
      renamed: responseFields.renamed ?? [],
      semanticChanges:
        responseFields.semanticChanges ?? responseFields.semantic_changes ?? [],
    },
  };
}

function analyzeRecordAppImpact(input: NormalizedRequest) {
  let impact: ImpactLevel = "none";
  const contractChanges = new Set<ContractChange>();
  const reasons = new Set<string>();
  const recordAppChecks = new Set<string>();
  const serverTests = new Set<string>();

  const haystack = [
    input.summary,
    input.diffSummary,
    ...input.changedFiles,
    ...input.apiPaths,
    ...input.dbModels,
    ...input.responseFields.added,
    ...input.responseFields.removed,
    ...input.responseFields.renamed,
    ...input.responseFields.semanticChanges,
  ]
    .join("\n")
    .toLowerCase();

  const changedApiV1 = hasAny(haystack, ["/api/v1", "src/app/api/v1"]);
  const touchesRecordPath = hasAny(haystack, [
    "/matches/",
    "events",
    "events/batch",
    "scoreboard",
    "roster",
    "status",
    "live-token",
    "scoreboard-url",
    "tournaments/",
    "matches/sync",
  ]);
  const touchesRecordData = hasAny(haystack, [
    "match_events",
    "matchplayerstat",
    "tournamentmatch",
    "tournament_matches",
    "score_at_time",
    "pbp",
    "quarter",
    "client_event_id",
    "event_type",
    "game_time",
    "minutes",
    "boxscore",
    "stats",
  ]);
  const touchesAuth = hasAny(haystack, [
    "jwt",
    "bearer",
    "authorization",
    "refresh",
    "login",
    "require-recorder",
    "require_recorder",
    "auth/",
  ]);

  if (changedApiV1) {
    impact = escalate(impact, "needs_review");
    reasons.add("The change may affect the /api/v1 mobile contract.");
    recordAppChecks.add(
      "Check bdr_stat_v3 lib/data/api/api_client.dart endpoint mapping.",
    );
    serverTests.add("Verify changed /api/v1 raw responses with curl.");
  }

  if (touchesRecordPath || touchesRecordData) {
    impact = escalate(impact, "needs_review");
    reasons.add("The change may affect recording, scoreboard, roster, or sync flows.");
    recordAppChecks.add("Check test/domain/sync_push_usecase_test.dart impact.");
    recordAppChecks.add(
      "Check test/domain/build_match_stats_snapshot_test.dart impact.",
    );
    serverTests.add("Verify snake_case payload/response compatibility.");
    serverTests.add("Verify related DB state with count/groupBy or match lookup.");
  }

  if (touchesAuth) {
    impact = escalate(impact, "risk");
    contractChanges.add("auth_change");
    reasons.add("The change may affect mobile JWT/Bearer auth or refresh flow.");
    recordAppChecks.add("Check test/di/auth_notifier_test.dart impact.");
    serverTests.add("Verify 401/403/refresh failure paths.");
  }

  if (input.responseFields.added.length > 0) {
    impact = escalate(impact, "needs_review");
    contractChanges.add("field_addition");
    reasons.add("Response fields were added. This is usually compatible but should be checked.");
  }

  if (input.responseFields.removed.length > 0) {
    impact = escalate(impact, "risk");
    contractChanges.add("field_removal");
    reasons.add("Removed response fields may break the record app.");
  }

  if (input.responseFields.renamed.length > 0) {
    impact = escalate(impact, "risk");
    contractChanges.add("field_rename");
    reasons.add("Renamed response fields may break the record app.");
  }

  if (input.responseFields.semanticChanges.length > 0) {
    impact = escalate(impact, "risk");
    contractChanges.add("semantic_change");
    reasons.add("Semantic response changes may break the record app even if field names stay the same.");
  }

  if (contractChanges.size === 0) contractChanges.add("none");

  const compatibility: Compatibility =
    impact === "risk"
      ? "may_break"
      : impact === "needs_review"
        ? "unknown"
        : "maintained";

  return {
    recordApp: RECORD_APP_META,
    impact,
    impactLabel: toImpactLabel(impact),
    apiContractChanges: Array.from(contractChanges),
    backwardCompatibility: compatibility,
    userDecisionRequired: impact === "risk",
    reasons: Array.from(reasons),
    recordAppCheckRequests: Array.from(recordAppChecks),
    recommendedRecordAppFiles: RECORD_APP_FILES,
    recommendedRecordAppTests: RECORD_APP_TESTS,
    serverTests: Array.from(serverTests),
  };
}

function hasAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

async function logRecordAppImpact(
  input: NormalizedRequest,
  result: ReturnType<typeof analyzeRecordAppImpact>,
) {
  await adminLog("record_app_impact_check", "agent", {
    targetType: "record_app",
    description: `record-app-impact ${result.impact}`,
    changesMade: {
      summary: input.summary,
      diff_summary: input.diffSummary,
      changed_files: input.changedFiles,
      api_paths: input.apiPaths,
      db_models: input.dbModels,
      response_fields: input.responseFields,
      impact: result.impact,
      api_contract_changes: result.apiContractChanges,
      backward_compatibility: result.backwardCompatibility,
      user_decision_required: result.userDecisionRequired,
      reasons: result.reasons,
    },
    severity: result.impact === "risk" ? "warning" : "info",
  });
}

function escalate(current: ImpactLevel, next: ImpactLevel): ImpactLevel {
  const rank: Record<ImpactLevel, number> = {
    none: 0,
    needs_review: 1,
    risk: 2,
  };
  return rank[next] > rank[current] ? next : current;
}

function toImpactLabel(impact: ImpactLevel) {
  if (impact === "risk") return "risk";
  if (impact === "needs_review") return "needs_review";
  return "none";
}
