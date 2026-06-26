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
| Admin Toss sweep | In Progress | Tournament detail now opens the relevant operation panel by step/hash; division setup/delete UI spacing is stabilized. |

## Work Log
- 2026-06-26: Removed duplicate tournament detail header, auto-opened division/match/team panels by step/hash, and clarified division delete/save UI; TypeScript passed.
- 2026-06-26: Replaced tournament detail hybrid workspace with v2.41 Toss shell/steps/footer, split schedule into its own step, removed embedded panel headers, and documented the alignment audit; TypeScript passed.
- 2026-06-26: Created post-v39 Claude.ai design brief for public-site data sync and admin Toss state QA.
- 2026-06-26: Applied BDR v2 (39) admin mock data consistency update to active v2.41 handoff; src unchanged because operational pages already use DB/API wiring.
- 2026-06-26: Added Material-to-lucide Icon aliases and converted organization detail top/tab icons to Toss Icon wrapper; TypeScript passed.
- 2026-06-26: Rebuilt organization members page with v2.41 Toss PageHead, invite panel, list rows, badges, and Icon wrappers; TypeScript passed.
- 2026-06-26: Rebuilt series hard-delete button/modal with v2.41 Toss Icon, danger button, modal, and input structures; TypeScript passed.
- 2026-06-26: Rebuilt tournament-admin series creation wizard with v2.41 Toss PageHead, stepper, panels, inputs, and Icon wrappers; TypeScript passed.
- 2026-06-26: Rebuilt tournament-admin organization creation form with v2.41 Toss PageHead, panel, inputs, selects, and Icon wrappers; TypeScript passed.
- 2026-06-26: Rebuilt tournament-admin series detail with v2.41 PageHead, KPI cards, and ad-table editions list; TypeScript passed.
