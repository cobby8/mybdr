#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_SEED_PATH = "Dev/ranking-research/keyword-seed.json";
const DEFAULT_SOURCES_PATH = "Dev/ranking-research/sources.json";

const NAVER_ENDPOINTS = {
  "naver-cafe": "https://openapi.naver.com/v1/search/cafearticle.json",
  "naver-blog": "https://openapi.naver.com/v1/search/blog.json",
};
const TAVILY_ENDPOINT = "https://api.tavily.com/search";

const SOURCE_ALIASES = {
  cafe: "naver-cafe",
  blog: "naver-blog",
  naverCafe: "naver-cafe",
  naverBlog: "naver-blog",
};

function parseArgs(argv) {
  const args = {
    seed: DEFAULT_SEED_PATH,
    sourcesFile: DEFAULT_SOURCES_PATH,
    out: null,
    dryRun: false,
    limit: 50,
    display: 10,
    groups: [],
    sources: [],
    includeManual: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--seed") args.seed = argv[++i];
    else if (arg === "--sources-file") args.sourcesFile = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--limit") args.limit = Number(argv[++i]);
    else if (arg === "--display") args.display = Number(argv[++i]);
    else if (arg === "--group") args.groups.push(argv[++i]);
    else if (arg === "--source") args.sources.push(...argv[++i].split(",").map((v) => v.trim()));
    else if (arg === "--include-manual") args.includeManual = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) args.limit = 50;
  if (!Number.isFinite(args.display) || args.display < 1) args.display = 10;
  args.display = Math.min(args.display, 100);
  args.sources = args.sources.map((source) => SOURCE_ALIASES[source] ?? source);
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/collect-ranking-research.mjs [options]

Options:
  --dry-run                 Print planned work without calling external APIs
  --limit <number>          Max query count after template expansion (default: 50)
  --display <number>        Naver result count per query/source, max 100 (default: 10)
  --group <id>              Include only a keyword group. Can be repeated
  --source <list>           Comma-separated source ids. Aliases: cafe,blog
  --include-manual          Include manual/static URL candidates in output
  --seed <path>             Keyword seed JSON path
  --sources-file <path>     Source registry JSON path
  --out <path>              Output JSON path

Examples:
  node scripts/collect-ranking-research.mjs --dry-run --limit 20
  node scripts/collect-ranking-research.mjs --source naver-cafe,naver-blog --limit 40
  node scripts/collect-ranking-research.mjs --dry-run --source official-site,daum-cafe
`);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function normalizeSource(source) {
  return {
    enabled: true,
    searchable: false,
    adapter: "manual-url",
    requiresCredentials: [],
    queryTemplates: [],
    urls: [],
    ...source,
  };
}

function selectSources(registry, requestedIds) {
  const requested = new Set(requestedIds);
  const all = (registry.sources ?? []).map(normalizeSource);
  const selected = requested.size
    ? all.filter((source) => requested.has(source.id))
    : all.filter((source) => source.enabled && source.adapter.startsWith("naver-"));

  return selected.length ? selected : all.filter((source) => source.enabled && source.adapter.startsWith("naver-"));
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

function sourceQueryFor(source, query) {
  const templates = source.queryTemplates?.length ? source.queryTemplates : ["{query}"];
  return templates.map((template) =>
    template
      .replaceAll("{query}", query.query)
      .replaceAll("{term}", query.term)
      .trim(),
  );
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

const SIGNAL_TOKENS = {
  result: ["우승", "준우승", "최종순위", "순위표", "경기결과", "결과", "스코어", "결승", "4강", "8강"],
  recruiting: ["모집", "참가신청", "참가팀", "접수", "신청", "선착순"],
  schedule: ["일정", "대진표", "조편성", "예선", "본선", "타임테이블"],
  basketball: ["농구", "3x3", "3대3", "동호회", "생활체육", "클럽", "디비전", "리그"],
  official: ["협회", "대한민국농구협회", "KBA", "디비전", "i-League", "아이리그"],
  noise: ["프로농구", "KBL", "NBA", "WKBL", "고교농구", "중고농구", "엘리트"],
};

function matchedTokens(text, tokens) {
  return tokens.filter((token) => text.includes(token.toLowerCase()));
}

function analyzeCandidate(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const signals = Object.fromEntries(
    Object.entries(SIGNAL_TOKENS).map(([key, tokens]) => [key, matchedTokens(text, tokens)]),
  );
  const sourceTrust = Number(item.sourceTrustLevel ?? 0);

  let score = 0;
  score += signals.result.length * 3;
  score += signals.basketball.length * 2;
  score += signals.official.length * 2;
  score += signals.schedule.length;
  score += signals.recruiting.length;
  score -= signals.noise.length * 3;
  score += Math.round(sourceTrust / 20);

  let candidateType = "unknown";
  if (item.adapter === "manual-url" || item.adapter === "official-site") {
    candidateType = "source_seed";
  } else if (signals.result.length >= 2 && signals.basketball.length >= 1) {
    candidateType = "result_candidate";
  } else if (signals.recruiting.length >= 1 && signals.basketball.length >= 1) {
    candidateType = "recruiting_candidate";
  } else if (signals.schedule.length >= 1 && signals.basketball.length >= 1) {
    candidateType = "schedule_candidate";
  } else if (signals.basketball.length >= 1) {
    candidateType = "basketball_mention";
  }

  return {
    candidateType,
    relevanceScore: score,
    confidence: Math.max(0, Math.min(100, score * 8)),
    signals,
  };
}

function enrichCandidate(item) {
  return {
    ...item,
    ...analyzeCandidate(item),
  };
}

function credentialStatus(source) {
  const missing = (source.requiresCredentials ?? []).filter((name) => !process.env[name]);
  return {
    ok: missing.length === 0,
    missing,
  };
}

async function fetchNaver(source, query, display) {
  const endpoint = NAVER_ENDPOINTS[source.adapter];
  const url = new URL(endpoint);
  url.searchParams.set("query", query.sourceQuery);
  url.searchParams.set("display", String(display));
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "date");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${source.id} ${response.status}: ${body.slice(0, 160)}`);
  }

  const data = await response.json();
  return (data.items ?? []).map((item) => {
    const normalized = {
      source: source.id,
      sourceLabel: source.label,
      sourceTrustLevel: source.trustLevel ?? 0,
      adapter: source.adapter,
      query: query.query,
      sourceQuery: query.sourceQuery,
      groupId: query.groupId,
      groupLabel: query.groupLabel,
      term: query.term,
      title: stripHtml(item.title),
      link: item.link,
      description: stripHtml(item.description),
      collectedAt: new Date().toISOString(),
      raw: item,
    };
    return enrichCandidate(normalized);
  });
}

async function fetchTavily(source, query, display) {
  const response = await fetch(TAVILY_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.TAVILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query.sourceQuery,
      search_depth: source.searchDepth ?? "basic",
      max_results: Math.min(display, 20),
      topic: source.topic ?? "general",
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      include_domains: source.includeDomains ?? undefined,
      exclude_domains: source.excludeDomains ?? undefined,
      country: source.country ?? "south korea",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${source.id} ${response.status}: ${body.slice(0, 160)}`);
  }

  const data = await response.json();
  return (data.results ?? []).map((item) => {
    const normalized = {
      source: source.id,
      sourceLabel: source.label,
      sourceTrustLevel: source.trustLevel ?? 0,
      adapter: source.adapter,
      query: query.query,
      sourceQuery: query.sourceQuery,
      groupId: query.groupId,
      groupLabel: query.groupLabel,
      term: query.term,
      title: stripHtml(item.title),
      link: item.url,
      description: stripHtml(item.content),
      collectedAt: new Date().toISOString(),
      raw: item,
    };
    return enrichCandidate(normalized);
  });
}

function buildManualCandidates(sources, includeManual) {
  if (!includeManual) return [];

  const now = new Date().toISOString();
  return sources
    .filter((source) => source.adapter === "manual-url" || source.adapter === "official-site")
    .flatMap((source) =>
      (source.urls ?? []).map((entry) => {
        const normalized = {
          source: source.id,
          sourceLabel: source.label,
          sourceTrustLevel: source.trustLevel ?? 0,
          adapter: source.adapter,
          query: null,
          sourceQuery: null,
          groupId: null,
          groupLabel: null,
          term: null,
          title: entry.label ?? entry.url,
          link: entry.url,
          description: entry.notes ?? source.notes ?? "",
          collectedAt: now,
          raw: entry,
        };
        return enrichCandidate(normalized);
      }),
    );
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
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return a.title.localeCompare(b.title, "ko");
  });
}

function defaultOutputPath() {
  const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  return path.join("tmp", `ranking-research-candidates-${stamp}.json`);
}

function printDryRun({ args, queries, sources }) {
  console.log(`[ranking-research] dry-run=true`);
  console.log(`[ranking-research] queries=${queries.length}, sources=${sources.map((s) => s.id).join(",")}`);

  for (const source of sources) {
    const status = credentialStatus(source);
    const credentialText = status.ok ? "credentials ok/not required" : `missing ${status.missing.join(",")}`;
    console.log(`\n[source] ${source.id} (${source.adapter}) - ${credentialText}`);

    if (source.searchable) {
      for (const [index, query] of queries.entries()) {
        const expanded = sourceQueryFor(source, query);
        for (const sourceQuery of expanded) {
          console.log(`${String(index + 1).padStart(3, "0")}. [${query.groupId}] ${sourceQuery}`);
        }
      }
    } else if (source.urls?.length) {
      for (const url of source.urls) {
        console.log(`- ${url.label ?? source.label}: ${url.url}`);
      }
    } else {
      console.log(`- configured for later adapter implementation`);
    }
  }

  if (!args.includeManual) {
    console.log("\n[hint] Add --include-manual to emit static URL candidates into the output JSON.");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seed = await readJson(args.seed);
  const registry = await readJson(args.sourcesFile);
  const queries = buildQueries(seed, args.groups, args.limit);
  const sources = selectSources(registry, args.sources);

  console.log(`[ranking-research] seed=${args.seed}`);
  console.log(`[ranking-research] sourcesFile=${args.sourcesFile}`);

  const runnableSources = sources.filter((source) => {
    if (!source.searchable) return false;
    if (!(source.adapter in NAVER_ENDPOINTS) && source.adapter !== "tavily-search") return false;
    return credentialStatus(source).ok;
  });
  const needsDryRun = args.dryRun || runnableSources.length === 0;

  if (needsDryRun) {
    printDryRun({ args, queries, sources });
    const manualCandidates = buildManualCandidates(sources, args.includeManual);
    if (manualCandidates.length) {
      const output = {
        collectedAt: new Date().toISOString(),
        seedVersion: seed.version,
        sourcesVersion: registry.version,
        queryCount: queries.length,
        sourceCount: sources.length,
        runnableSourceCount: runnableSources.length,
        resultCount: manualCandidates.length,
        dedupedCount: 0,
        queries,
        sources,
        candidates: [],
        errors: [],
      };
      output.candidates = dedupeCandidates(manualCandidates);
      output.dedupedCount = output.candidates.length;

      const outPath = args.out ?? defaultOutputPath();
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
      console.log(`\n[ranking-research] wrote ${outPath}`);
      console.log(`[ranking-research] manual candidates=${output.dedupedCount}`);
    }
    if (!args.dryRun && runnableSources.length === 0) {
      console.log("\n[ranking-research] No runnable source credentials/adapters. Nothing fetched.");
    }
    return;
  }

  const candidates = buildManualCandidates(sources, args.includeManual);
  const errors = [];

  for (const query of queries) {
    for (const source of runnableSources) {
      for (const sourceQuery of sourceQueryFor(source, query)) {
        try {
          const items = source.adapter === "tavily-search"
            ? await fetchTavily(source, { ...query, sourceQuery }, args.display)
            : await fetchNaver(source, { ...query, sourceQuery }, args.display);
          candidates.push(...items);
          console.log(`[ok] ${source.id} "${sourceQuery}" -> ${items.length}`);
        } catch (error) {
          errors.push({ source: source.id, query: sourceQuery, message: error.message });
          console.warn(`[warn] ${source.id} "${sourceQuery}" -> ${error.message}`);
        }
      }
    }
  }

  const output = {
    collectedAt: new Date().toISOString(),
    seedVersion: seed.version,
    sourcesVersion: registry.version,
    queryCount: queries.length,
    sourceCount: sources.length,
    runnableSourceCount: runnableSources.length,
    resultCount: candidates.length,
    dedupedCount: 0,
    queries,
    sources,
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
