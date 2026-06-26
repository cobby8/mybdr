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
| Admin Toss sweep | In Progress | v2(40) wiring delta is imported; B2 divisions panel is cleaned; B3 bracket top, round-1 editor, and dual bracket sections now use Toss-only local tokens. |

## Work Log
- 2026-06-26: Converted dual bracket sections and match cards to Toss-only section/card/status classes while keeping collapse and match display behavior; TypeScript passed.
- 2026-06-26: Converted the bracket panel round-1 team assignment editor to Toss grid/select/badge classes with stable mobile wrapping; TypeScript passed.
- 2026-06-26: Cleaned the bracket panel top version/generate block to Toss-only classes and removed its local BDR token/radius residue; TypeScript passed.
- 2026-06-26: Added selected division chips with direct delete controls, stabilized division row/grid sizing, and removed local BDR token/radius residue in the Toss divisions panel; TypeScript passed.
- 2026-06-26: Added v2.42 admin/public parity inventory and started B1 by switching workspace panel frames to `ct-panel-embed` and keeping the divisions panel visible by default; TypeScript passed.
- 2026-06-26: Reviewed BDR v2 (40) wiring delta, imported it into BDR-current, corrected active handoff data, and updated remaining work around public site data gates.
- 2026-06-26: Created integrated Claude.ai request for v2.42 admin Toss parity, including schedule/bracket/matches/teams/site state screens and cleanup manifest requirements.
- 2026-06-26: Created admin Toss v2.41 full parity audit for 100% design matching, cleanup candidates, schedule/bracket function gaps, and follow-up design requests.
- 2026-06-26: Replaced tournament detail hybrid workspace with v2.41 Toss shell/steps/footer, split schedule into its own step, removed embedded panel headers, and documented the alignment audit; TypeScript passed.
- 2026-06-26: Applied BDR v2 (39) admin mock data consistency update to active v2.41 handoff; src unchanged because operational pages already use DB/API wiring.
