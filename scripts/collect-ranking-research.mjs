#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_SEED_PATH = "Dev/ranking-research/keyword-seed.json";
const NAVER_ENDPOINTS = {
  cafe: "https://openapi.naver.com/v1/search/cafearticle.json",
  blog: "https://openapi.naver.com/v1/search/blog.json",
};

function parseArgs(argv) {
  const args = {
    seed: DEFAULT_SEED_PATH,
    out: null,
    dryRun: false,
    limit: 50,
    display: 10,
    groups: [],
    sources: ["cafe", "blog"],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--seed") args.seed = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--limit") args.limit = Number(argv[++i]);
    else if (arg === "--display") args.display = Number(argv[++i]);
    else if (arg === "--group") args.groups.push(argv[++i]);
    else if (arg === "--source") args.sources = argv[++i].split(",").map((v) => v.trim());
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) args.limit = 50;
  if (!Number.isFinite(args.display) || args.display < 1) args.display = 10;
  args.display = Math.min(args.display, 100);
  args.sources = args.sources.filter((source) => source in NAVER_ENDPOINTS);
  if (args.sources.length === 0) args.sources = ["cafe", "blog"];
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/collect-ranking-research.mjs [options]

Options:
  --dry-run            Print planned queries without calling external APIs
  --limit <number>     Max query count after template expansion (default: 50)
  --display <number>   Naver result count per query/source, max 100 (default: 10)
  --group <id>         Include only a keyword group. Can be repeated
  --source <list>      Comma-separated sources: cafe,blog (default: cafe,blog)
  --seed <path>        Keyword seed JSON path
  --out <path>         Output JSON path
`);
}

async function readSeed(seedPath) {
  const raw = await fs.readFile(seedPath, "utf8");
  return JSON.parse(raw);
}

function buildQueries(seed, selectedGroups, limit) {
  const groupFilter = new Set(selectedGroups);
  const templates = seed.queryTemplates?.length ? seed.queryTemplates : ["{term}"];
  const groups = (seed.groups ?? [])
    .filter((group) => groupFilter.size === 0 || groupFilter.has(group.id))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const seen = new Set();
  const queries = [];

  for (const group of groups) {
    for (const term of group.terms ?? []) {
      for (const template of templates) {
        const query = template.replaceAll("{term}", term).trim();
        if (!query || seen.has(query)) continue;
        seen.add(query);
        queries.push({
          query,
          term,
          groupId: group.id,
          groupLabel: group.label,
          priority: group.priority ?? 0,
        });
        if (queries.length >= limit) return queries;
      }
    }
  }

  return queries;
}

function stripHtml(value) {
  return String(value ?? "")
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll("&quot;", "\"")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim();
}

function scoreCandidate(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  let score = 0;
  const positive = ["우승", "준우승", "결과", "최종순위", "순위", "스코어", "대진표", "결승", "4강", "8강"];
  const weak = ["모집", "참가신청", "일정", "후기", "공지"];

  for (const token of positive) {
    if (text.includes(token.toLowerCase())) score += 2;
  }
  for (const token of weak) {
    if (text.includes(token.toLowerCase())) score += 1;
  }
  if (text.includes("농구")) score += 2;
  if (text.includes("동호회") || text.includes("생활체육") || text.includes("클럽")) score += 2;
  return score;
}

async function fetchNaver(source, query, display, credentials) {
  const endpoint = NAVER_ENDPOINTS[source];
  const url = new URL(endpoint);
  url.searchParams.set("query", query.query);
  url.searchParams.set("display", String(display));
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "date");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": credentials.clientId,
      "X-Naver-Client-Secret": credentials.clientSecret,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${source} ${response.status}: ${body.slice(0, 160)}`);
  }

  const data = await response.json();
  return (data.items ?? []).map((item) => {
    const normalized = {
      source,
      query: query.query,
      groupId: query.groupId,
      groupLabel: query.groupLabel,
      term: query.term,
      title: stripHtml(item.title),
      link: item.link,
      description: stripHtml(item.description),
      collectedAt: new Date().toISOString(),
      raw: item,
    };
    return {
      ...normalized,
      relevanceScore: scoreCandidate(normalized),
    };
  });
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  const deduped = [];

  for (const candidate of candidates) {
    const key = candidate.link || `${candidate.source}:${candidate.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(candidate);
  }

  return deduped.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return a.title.localeCompare(b.title, "ko");
  });
}

function defaultOutputPath() {
  const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  return path.join("tmp", `ranking-research-candidates-${stamp}.json`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seed = await readSeed(args.seed);
  const queries = buildQueries(seed, args.groups, args.limit);
  const credentials = {
    clientId: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
  };
  const hasCredentials = Boolean(credentials.clientId && credentials.clientSecret);

  console.log(`[ranking-research] seed=${args.seed}`);
  console.log(`[ranking-research] queries=${queries.length}, sources=${args.sources.join(",")}`);

  if (args.dryRun || !hasCredentials) {
    if (!hasCredentials) {
      console.log("[ranking-research] NAVER_CLIENT_ID/NAVER_CLIENT_SECRET missing. Running as dry-run.");
    }
    for (const [index, query] of queries.entries()) {
      console.log(`${String(index + 1).padStart(3, "0")}. [${query.groupId}] ${query.query}`);
    }
    return;
  }

  const candidates = [];
  const errors = [];

  for (const query of queries) {
    for (const source of args.sources) {
      try {
        const items = await fetchNaver(source, query, args.display, credentials);
        candidates.push(...items);
        console.log(`[ok] ${source} "${query.query}" -> ${items.length}`);
      } catch (error) {
        errors.push({ source, query: query.query, message: error.message });
        console.warn(`[warn] ${source} "${query.query}" -> ${error.message}`);
      }
    }
  }

  const output = {
    collectedAt: new Date().toISOString(),
    seedVersion: seed.version,
    queryCount: queries.length,
    sourceCount: args.sources.length,
    resultCount: candidates.length,
    dedupedCount: 0,
    queries,
    candidates: [],
    errors,
  };
  output.candidates = dedupeCandidates(candidates);
  output.dedupedCount = output.candidates.length;

  const outPath = args.out ?? defaultOutputPath();
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`[ranking-research] wrote ${outPath}`);
  console.log(`[ranking-research] results=${output.resultCount}, deduped=${output.dedupedCount}, errors=${errors.length}`);
}

main().catch((error) => {
  console.error(`[ranking-research] failed: ${error.stack || error.message}`);
  process.exit(1);
});
