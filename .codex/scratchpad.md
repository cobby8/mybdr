# Scratchpad

## Current Work
- 2026-06-26 admin Toss v2.41 package implementation: shared admin blocks are being aligned with the package screen system one unit at a time.

## Progress
| Area | Status | Note |
|---|---|---|
| Theme tokens | Done | Added `--color-on-primary` so red primary buttons render white text/icons. |
| Live box score | Done | Per-team basic/advanced toggle added beside team name; help icon added at each table header. |
| Admin game rules | Done | `game_time`/`game_method` now derive from canonical `game_rules` instead of free text. |
| Recording modes | Done | Match-level `manual` is counted, displayed, and blocked from Flutter/score-sheet system inputs. |
| Admin Toss handoff | Done | `BDR-current/_handoff-admin-toss-v2.41/` added; src unchanged. |
| Admin Toss sweep | In Progress | v2.41 package reviewed; shared KPI, DataTable, PageHead, and Toolbar blocks now use package structures. |

## Work Log
- 2026-06-26: Converted shared admin PageHead/Toolbar to v2.41 `ts-ph` and `ad-toolbar` structures; TypeScript and diff checks passed.
- 2026-06-26: Converted shared admin DataTable wrappers to v2.41 `ad-tablescroll`/`ad-table`; TypeScript and diff checks passed.
- 2026-06-26: Reviewed BDR v2.41 admin Toss package and converted shared admin KPI rows to package `ad-kpi-*`; TypeScript and residue scans passed, browser QA blocked by DB pooler access.
- 2026-06-26: Pushed tournament-admin Toss cleanup to dev and merged main; then token-normalized admin campaigns, games, and categories pages; TypeScript passed.
- 2026-06-26: Replaced remaining tournament-admin rgba overlays/shadows with `color-mix` tokens; TypeScript and residue scans passed.
- 2026-06-26: Converted site and teams panels to Toss buttons and tokenized site selection shadow; TypeScript passed.
- 2026-06-26: Converted tournament creation wizard navigation and CTA buttons to Toss `ts-btn`; TypeScript passed.
- 2026-06-26: Converted small tournament-admin CTA buttons and series error backgrounds to Toss tokens; TypeScript passed.
- 2026-06-26: Completed series Toss cleanup for CTA buttons, copy/delete controls, and tokenized alert backgrounds; TypeScript passed.
- 2026-06-26: Converted organization action modals to Toss buttons and tokenized selected-state backgrounds; TypeScript passed.
