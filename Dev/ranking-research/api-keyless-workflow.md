# API-keyless Ranking Research Workflow

API keys are useful for Naver and Tavily search, but the pipeline can still be tested without them.

## What Works Without API Keys

| Step | Works | Output |
|---|---|---|
| Manual/official source seed collection | Yes | Candidate JSON |
| Candidate classification | Yes | `candidateType`, `confidence`, `signals` |
| Markdown review report | Yes | Human-readable queue |
| CSV review report | Yes | Spreadsheet/filter workflow |
| Naver Cafe/Blog search | No | Requires `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` |
| Tavily broad web search | No | Requires `TAVILY_API_KEY` |

## Commands

Generate candidates from official/manual seeds:

```powershell
node scripts/collect-ranking-research.mjs --source official-kba,daum-cafe --include-manual --out tmp/ranking-research-manual.json --limit 2
```

Generate review reports:

```powershell
node scripts/ranking-research-report.mjs --input tmp/ranking-research-manual.json --out-dir tmp --prefix ranking-research-manual
```

Outputs:

| File | Use |
|---|---|
| `tmp/ranking-research-manual.md` | Human review table |
| `tmp/ranking-research-manual.csv` | Spreadsheet/filter workflow |

## Review Columns

| Column | Meaning |
|---|---|
| `type` | `source_seed`, `result_candidate`, `recruiting_candidate`, `schedule_candidate`, `basketball_mention`, `unknown` |
| `confidence` | 0-100 rough priority score |
| `score` | Raw relevance score |
| `source` | Source registry id |
| `title` | Candidate title |
| `signals` | Matched keyword groups |
| `link` | Candidate URL |

## Next Manual Review

For each source seed:

1. Open the URL manually.
2. Confirm whether the page is public, login-gated, or blocked.
3. If public, collect exact board/article URLs for ranking-relevant posts.
4. Add confirmed board/article URLs to `sources.json`.
5. Re-run the report.
