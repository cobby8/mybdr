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
| Admin Toss sweep | In Progress | v2(40) wiring delta is imported; B2 divisions/B3 bracket/B4 matches/B5 teams are cleaned to Toss local classes. |

## Work Log
- 2026-06-26: Cleaned teams player table and bulk-import modal to Toss `tt-*` classes; team panel scan only leaves real team primaryColor binding and TypeScript passed.
- 2026-06-26: Cleaned teams detail modal shell/header/category/payment/manager controls and action buttons to Toss classes; TypeScript passed.
- 2026-06-26: Cleaned teams panel readiness cards, group headers, team list metadata, seed/group mini inputs, and team badges to Toss `tt-*` classes; TypeScript passed.
- 2026-06-26: Converted teams panel status/via/payment/roster badges and via-stat cards to Toss `tt-*` classes; TypeScript passed.
- 2026-06-26: Cleaned matches table/mobile cards/ScoreModal/error/filter UI to Toss-only `amt-*` classes; matches scan is clean and TypeScript passed.
- 2026-06-26: Finished bracket panel Toss cleanup for full match lists and multi-division bracket filters/sections; bracket panel residue scan is now clean and TypeScript passed.
- 2026-06-26: Added v2.42 admin/public parity inventory and started B1 by switching workspace panel frames to `ct-panel-embed` and keeping the divisions panel visible by default; TypeScript passed.
- 2026-06-26: Created integrated Claude.ai request for v2.42 admin Toss parity, including schedule/bracket/matches/teams/site state screens and cleanup manifest requirements.
- 2026-06-26: Replaced tournament detail hybrid workspace with v2.41 Toss shell/steps/footer, split schedule into its own step, removed embedded panel headers, and documented the alignment audit; TypeScript passed.
- 2026-06-26: Applied BDR v2 (39) admin mock data consistency update to active v2.41 handoff; src unchanged because operational pages already use DB/API wiring.
