# Web Search Provider Notes

Updated: 2026-06-24

## Decision

Use `tavily-search` as the first broad web-search adapter after Naver.

Why:

- It exposes a simple `POST /search` API with result title, URL, content snippet, score, and optional domain include/exclude controls.
- The docs show `search_depth` cost behavior: `basic`, `fast`, and `ultra-fast` cost 1 API credit; `advanced` costs 2 credits.
- It supports `max_results` up to 20 and a `country` option, which fits Korean local discovery.
- It is easier to use for candidate discovery than scraping Google or Daum search pages directly.

## Provider Comparison

| Provider | Status | Use |
|---|---|---|
| Naver Cafe/Blog | Active | Korean community density; already implemented. |
| Tavily | Active adapter | Broad web discovery for Daum Cafe, official sites, Instagram, YouTube, and long-tail pages. |
| Daum Cafe | Manual seed | Exact cafe URLs are tracked first; dedicated parser later only for confirmed public boards. |
| Google Programmable Search | Candidate only | Useful web index, but avoid as the first adapter because product/setup constraints may change. |
| Bing Web Search | Avoid for now | Microsoft Learn page is under previous versions and Bing Search API access has retirement/deprecation risk. |
| Brave Search API | Candidate only | Potentially useful independent index, but official app pages returned 403 from CLI inspection; verify plans manually before wiring. |
| SerpAPI-style Google scrapers | Avoid for now | Legal/ToS risk is not worth it for a ranking pipeline that needs stable evidence. |

## Daum Cafe Seeds Found

Daum search for `BDR 동아리농구방` exposed these candidates:

| URL | Role |
|---|---|
| `https://cafe.daum.net/dongarry` | Primary BDR/dongari basketball room candidate |
| `https://cafe.daum.net/bdrleague` | BDR league candidate |

Board-level URLs appeared in search results under `dongarry`, but the source registry keeps the cafe root first. Add board URLs only after confirming that the pages are public and ranking-relevant.

## Sources Checked

- Tavily Search docs: https://docs.tavily.com/documentation/api-reference/endpoint/search
- Google Custom Search JSON API docs: https://developers.google.com/custom-search/v1/overview
- Microsoft Bing Web Search API docs: https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/overview
- KBA main: https://www.koreabasketball.or.kr/main/
- KBA division system: https://www.kba-il.kr/
