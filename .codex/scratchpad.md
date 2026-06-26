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
- 2026-06-26: Rebuilt series hard-delete button/modal with v2.41 Toss Icon, danger button, modal, and input structures; TypeScript passed.
- 2026-06-26: Rebuilt tournament-admin series creation wizard with v2.41 Toss PageHead, stepper, panels, inputs, and Icon wrappers; TypeScript passed.
- 2026-06-26: Rebuilt tournament-admin organization creation form with v2.41 Toss PageHead, panel, inputs, selects, and Icon wrappers; TypeScript passed.
- 2026-06-26: Rebuilt tournament-admin series detail with v2.41 PageHead, KPI cards, and ad-table editions list; TypeScript passed.
- 2026-06-26: Rebuilt tournament-admin series list with v2.41 Toss PageHead and ad-table static server markup; TypeScript passed.
- 2026-06-26: Rebuilt tournament-admin organizations list with v2.41 PageHead, ad-cardgrid, Empty, and lucide Icon wrappers; TypeScript passed.
- 2026-06-26: Removed remaining tournament workspace legacy button classes in site panel/detail header; TypeScript and residue scans passed.
- 2026-06-26: Aligned tournament detail, organizer management, and audit log pages with v2.41 Toss buttons/PageHead; TypeScript and residue scans passed.
- 2026-06-26: Rebuilt `/admin/tournaments` top area with v2.41 PageHead, ad-toolbar search, and clean KPI copy; TypeScript and diff checks passed.
- 2026-06-26: Reviewed BDR v2.41 admin Toss package and converted shared admin KPI rows to package `ad-kpi-*`; TypeScript and residue scans passed, browser QA blocked by DB pooler access.
