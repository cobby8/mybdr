# Scratchpad

## Current Work
- 2026-06-26 admin live ops stabilization: tournament operation entry has been split into a 6-menu operate workspace and a dedicated edit workspace.

## Progress
| Area | Status | Note |
|---|---|---|
| Tournament division rule settings | Done | Division operation settings now save through an explicit settings button and refresh local state from the server response. |
| Tournament bracket generation | Done | Division-rule generation is now the primary path, global generation is disabled when division rules exist, and invalid group sizes are blocked before writes. |
| Tournament division ops | Done | Team category moves now sync team division/player division codes and expose single/bulk move controls. |
| Tournament operate workspace | Done | `/tournament-admin/tournaments/[id]` now opens the 6-menu Toss operate workspace; `/edit` keeps the setup/edit workspace. |
| Theme tokens | Done | Added `--color-on-primary` so red primary buttons render white text/icons. |
| Live box score | Done | Per-team basic/advanced toggle added beside team name; help icon added at each table header. |
| Admin game rules | Done | `game_time`/`game_method` now derive from canonical `game_rules` instead of free text. |
| Recording modes | Done | Match-level `manual` is counted, displayed, and blocked from Flutter/score-sheet system inputs. |
| Admin Toss handoff | Done | `BDR-current/_handoff-admin-toss-v2.41/` added; src unchanged. |
| Admin Toss sweep | In Progress | v2(41) state/cleanup pass added Toss confirm/prompt modals and first loading/empty helpers; dev/main are synced. |

## Work Log
- 2026-06-26: Split tournament admin detail into a 6-menu Toss operate workspace at `/tournament-admin/tournaments/[id]` and a preserved edit/setup workspace at `/edit`; TypeScript and production build passed.
- 2026-06-26: Fixed tournament division rule settings save clarity: removed blur-only saves, added explicit settings save state, and refreshed rule format/settings from the PATCH response; TypeScript and targeted division-format Vitest passed.
- 2026-06-26: Fixed tournament bracket generation for live ops: bracket panel now exposes division-rule generation even at 0 matches, disables unsafe global generation when division rules exist, supports division single-elim/round-robin generation, and blocks mismatched group sizes before writes; TypeScript and targeted Vitest passed.
- 2026-06-26: Fixed tournament team division operations for next-day live ops: single/bulk team category moves now sync team division and player division codes, team cards expose category selects, and delete blocks show linked counts; TypeScript passed.
- 2026-06-26: Applied BDR v2 (41) admin Toss state pass: destructive confirms and prompt flows now use Toss modals, state helpers/skeletons are in `admin-toss`, and dev/main were pushed.
- 2026-06-26: Wired previous tournament import to real DB/API, removed venue mock fallback, linked wizard PDF/association actions, and replaced teams panel player error alerts with Toss toast; TypeScript passed and dev/main were pushed.
- 2026-06-26: Cleaned recorders/admins panels to shared Toss `tp-*` list/message/avatar classes; scans are clean and TypeScript passed.
- 2026-06-26: Cleaned teams player table and bulk-import modal to Toss `tt-*` classes; team panel scan only leaves real team primaryColor binding and TypeScript passed.
- 2026-06-26: Cleaned teams detail modal shell/header/category/payment/manager controls and action buttons to Toss classes; TypeScript passed.
- 2026-06-26: Cleaned teams panel readiness cards, group headers, team list metadata, seed/group mini inputs, and team badges to Toss `tt-*` classes; TypeScript passed.
- 2026-06-26: Converted teams panel status/via/payment/roster badges and via-stat cards to Toss `tt-*` classes; TypeScript passed.
