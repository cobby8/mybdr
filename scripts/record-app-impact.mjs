#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import process from "node:process";

const DEFAULT_BASE_URL = "http://localhost:3001";
const ENDPOINT_PATH = "/api/web/admin/agents/record-app-impact";

const DB_MODEL_KEYWORDS = [
  ["match_events", "MatchEvent"],
  ["matchevent", "MatchEvent"],
  ["/events/", "MatchEvent"],
  ["client_event_id", "MatchEvent"],
  ["event_type", "MatchEvent"],
  ["match_player_stats", "MatchPlayerStat"],
  ["matchplayerstat", "MatchPlayerStat"],
  ["player_stat", "MatchPlayerStat"],
  ["tournament_matches", "TournamentMatch"],
  ["tournamentmatch", "TournamentMatch"],
  ["scoreboard", "TournamentMatch"],
  ["roster", "TournamentRoster"],
  ["lineup", "TournamentRoster"],
  ["live-token", "LiveToken"],
  ["jwt", "AuthToken"],
  ["refresh", "AuthToken"],
];

function parseArgs(argv) {
  const args = {
    summary: "Local change impact check",
    diffSummary: "",
    files: [],
    apiPaths: [],
    dbModels: [],
    addedFields: [],
    removedFields: [],
    renamedFields: [],
    semanticChanges: [],
    baseUrl: DEFAULT_BASE_URL,
    cookie: "",
    post: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--summary") args.summary = readValue(argv, ++index, arg);
    else if (arg === "--diff-summary") args.diffSummary = readValue(argv, ++index, arg);
    else if (arg === "--file") args.files.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--files") args.files.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--api-path") args.apiPaths.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--api-paths") args.apiPaths.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--db-model") args.dbModels.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--db-models") args.dbModels.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--added-field") args.addedFields.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--added-fields") args.addedFields.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--removed-field") args.removedFields.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--removed-fields") args.removedFields.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--renamed-field") args.renamedFields.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--renamed-fields") args.renamedFields.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--semantic-change") args.semanticChanges.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--semantic-changes") args.semanticChanges.push(...splitList(readValue(argv, ++index, arg)));
    else if (arg === "--base-url") args.baseUrl = readValue(argv, ++index, arg);
    else if (arg === "--cookie") args.cookie = readValue(argv, ++index, arg);
    else if (arg === "--post") args.post = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function gitLines(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function collectChangedFiles() {
  const tracked = gitLines(["diff", "--name-only", "HEAD", "--", "."]);
  const untracked = gitLines(["ls-files", "--others", "--exclude-standard"]);
  return unique([...tracked, ...untracked]).sort();
}

function routePathFromFile(file) {
  const normalized = file.replaceAll("\\", "/");
  const prefix = "src/app/api";
  const suffix = "/route.ts";

  if (!normalized.startsWith(prefix) || !normalized.endsWith(suffix)) return null;

  const relative = normalized
    .slice(prefix.length, -suffix.length)
    .replace(/\[([^\]]+)\]/g, ":$1");

  return `/api${relative}`;
}

function inferApiPaths(files, explicitApiPaths) {
  const inferred = files.map(routePathFromFile).filter(Boolean);
  return unique([...explicitApiPaths, ...inferred]).sort();
}

function inferDbModels(files, explicitDbModels) {
  const haystack = files.join("\n").toLowerCase();
  const inferred = [];

  if (haystack.includes("prisma/schema.prisma")) inferred.push("Prisma schema");

  for (const [keyword, model] of DB_MODEL_KEYWORDS) {
    if (haystack.includes(keyword)) inferred.push(model);
  }

  return unique([...explicitDbModels, ...inferred]).sort();
}

function buildPayload(args) {
  const changedFiles = args.files.length ? unique(args.files).sort() : collectChangedFiles();
  const apiPaths = inferApiPaths(changedFiles, args.apiPaths);
  const dbModels = inferDbModels(changedFiles, args.dbModels);

  return {
    summary: args.summary,
    diff_summary: args.diffSummary,
    changed_files: changedFiles,
    api_paths: apiPaths,
    db_models: dbModels,
    response_fields: {
      added: unique(args.addedFields),
      removed: unique(args.removedFields),
      renamed: unique(args.renamedFields),
      semantic_changes: unique(args.semanticChanges),
    },
  };
}

async function postPayload(args, payload) {
  if (!args.cookie) {
    throw new Error("--post requires --cookie with an authenticated super_admin web session");
  }

  const url = new URL(ENDPOINT_PATH, args.baseUrl);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: args.cookie,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Keep non-JSON responses visible for auth or dev-server failures.
  }

  console.log(JSON.stringify(body, null, 2));
  if (!response.ok) process.exitCode = 1;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/record-app-impact.mjs [options]

Default behavior:
  Prints a JSON payload for POST /api/web/admin/agents/record-app-impact.
  It reads changed and untracked files from git when --file/--files is omitted.

Options:
  --summary <text>              Work summary sent to the impact API
  --diff-summary <text>         Short description of the contract-level change
  --file <path[,path]>          Changed file. Can be repeated
  --api-path <path[,path]>      API route path. Can be repeated
  --db-model <name[,name]>      Related DB model/table. Can be repeated
  --added-field <name[,name]>   Response fields added
  --removed-field <name[,name]> Response fields removed
  --renamed-field <name[,name]> Response fields renamed
  --semantic-change <name[,name]> Fields whose meaning changed
  --base-url <url>              Local server URL (default: ${DEFAULT_BASE_URL})
  --cookie <cookie>             super_admin web session cookie for POST
  --post                        POST payload to the local server API

Examples:
  node scripts/record-app-impact.mjs --summary "Add match event response field"
  node scripts/record-app-impact.mjs --summary "Remove legacy score field" --removed-field legacy_score
  node scripts/record-app-impact.mjs --post --cookie "bdr_session=..."
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = buildPayload(args);

  if (args.post) {
    await postPayload(args, payload);
    return;
  }

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
