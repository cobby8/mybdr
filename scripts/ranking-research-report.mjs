#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const args = {
    input: null,
    outDir: "tmp",
    prefix: null,
    top: 100,
    minConfidence: 0,
    formats: ["md", "csv"],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input" || arg === "-i") args.input = argv[++i];
    else if (arg === "--out-dir") args.outDir = argv[++i];
    else if (arg === "--prefix") args.prefix = argv[++i];
    else if (arg === "--top") args.top = Number(argv[++i]);
    else if (arg === "--min-confidence") args.minConfidence = Number(argv[++i]);
    else if (arg === "--format") args.formats = argv[++i].split(",").map((v) => v.trim());
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!args.input) {
    printHelp();
    process.exit(1);
  }
  if (!Number.isFinite(args.top) || args.top < 1) args.top = 100;
  if (!Number.isFinite(args.minConfidence) || args.minConfidence < 0) args.minConfidence = 0;
  args.formats = args.formats.filter((format) => ["md", "csv"].includes(format));
  if (!args.formats.length) args.formats = ["md", "csv"];
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/ranking-research-report.mjs --input <candidate-json> [options]

Options:
  --out-dir <path>          Output directory (default: tmp)
  --prefix <name>           Output filename prefix. Defaults to input basename
  --top <number>            Max candidates in detail table (default: 100)
  --min-confidence <number> Only include candidates at or above confidence
  --format <list>           md,csv (default: md,csv)
`);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item) || "-";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"));
}

function signalSummary(candidate) {
  const signals = candidate.signals ?? {};
  return Object.entries(signals)
    .filter(([, tokens]) => Array.isArray(tokens) && tokens.length > 0)
    .map(([group, tokens]) => `${group}:${tokens.slice(0, 4).join("/")}`)
    .join("; ");
}

function escapeMd(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .trim();
}

function escapeCsv(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function candidateRows(candidates) {
  return candidates.map((candidate, index) => ({
    no: index + 1,
    type: candidate.candidateType ?? "unknown",
    confidence: candidate.confidence ?? 0,
    score: candidate.relevanceScore ?? 0,
    source: candidate.source ?? "-",
    title: candidate.title ?? "-",
    link: candidate.link ?? "-",
    signals: signalSummary(candidate),
  }));
}

function renderCountTable(title, counts) {
  const lines = [`## ${title}`, "", "| Key | Count |", "|---|---:|"];
  for (const [key, count] of counts) {
    lines.push(`| ${escapeMd(key)} | ${count} |`);
  }
  if (!counts.length) lines.push("| - | 0 |");
  return lines.join("\n");
}

function renderMarkdown(data, candidates, args) {
  const rows = candidateRows(candidates);
  const lines = [
    "# BDR Ranking Research Candidate Report",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Input: ${args.input}`,
    `- Candidate count: ${data.candidates?.length ?? 0}`,
    `- Included count: ${candidates.length}`,
    `- Min confidence: ${args.minConfidence}`,
    "",
    renderCountTable("By Candidate Type", countBy(candidates, (item) => item.candidateType)),
    "",
    renderCountTable("By Source", countBy(candidates, (item) => item.source)),
    "",
    "## Review Queue",
    "",
    "| # | Type | Conf | Score | Source | Title | Signals | Link |",
    "|---:|---|---:|---:|---|---|---|---|",
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.no} | ${escapeMd(row.type)} | ${row.confidence} | ${row.score} | ${escapeMd(row.source)} | ${escapeMd(row.title)} | ${escapeMd(row.signals)} | ${escapeMd(row.link)} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

function renderCsv(candidates) {
  const rows = candidateRows(candidates);
  const headers = ["no", "type", "confidence", "score", "source", "title", "signals", "link"];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => escapeCsv(row[key])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function outputPrefix(args) {
  if (args.prefix) return args.prefix;
  return path.basename(args.input, path.extname(args.input));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const data = await readJson(args.input);
  const candidates = (data.candidates ?? [])
    .filter((candidate) => Number(candidate.confidence ?? 0) >= args.minConfidence)
    .slice(0, args.top);

  await fs.mkdir(args.outDir, { recursive: true });
  const prefix = outputPrefix(args);

  if (args.formats.includes("md")) {
    const mdPath = path.join(args.outDir, `${prefix}.md`);
    await fs.writeFile(mdPath, renderMarkdown(data, candidates, args), "utf8");
    console.log(`[ranking-report] wrote ${mdPath}`);
  }

  if (args.formats.includes("csv")) {
    const csvPath = path.join(args.outDir, `${prefix}.csv`);
    await fs.writeFile(csvPath, renderCsv(candidates), "utf8");
    console.log(`[ranking-report] wrote ${csvPath}`);
  }
}

main().catch((error) => {
  console.error(`[ranking-report] failed: ${error.stack || error.message}`);
  process.exit(1);
});
