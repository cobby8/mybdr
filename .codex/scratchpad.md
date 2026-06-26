# Scratchpad

## Current Work
- 2026-06-26 tournament admin list: restore the visible tournament creation entry point.

## Progress
| Area | Status | Note |
|---|---|---|
| Push/main merge | Done | Existing dev work and bdr_stat_v3 fix were pushed; mybdr dev was merged to main. |
| Admin game rules | Done | `game_time`/`game_method` now derive from canonical `game_rules` instead of free text. |
| Recording modes | Done | Match-level `manual` is counted, displayed, and blocked from Flutter/score-sheet system inputs. |
| Verification | Done | Targeted Vitest suite and `cmd /c npx tsc --noEmit` passed. |

## Work Log
- 2026-06-26: Restored the tournament creation CTA on the tournament admin list page and verified TypeScript.
- 2026-06-26: Pushed/merged prior fixes, then aligned tournament admin game-rule display and match-level manual recording-mode guards.
- 2026-06-26: Added tournament division inline rename/delete controls and separated record-app time presets from clock mode.
- 2026-06-25: Repaired customer signal contact/report flow copy and prepared operator email reporting verification.
- 2026-06-25: Improved tournament admin PC/mobile UX with grouped registration/team/public controls, desktop sticky save, active mobile tabs, and larger image delete targets.
- 2026-06-25: Added manual group assignment controls to tournament admin team cards using the existing team PATCH API.
- 2026-06-25: Restored tournament admin edit fields for bank info, roster/waiting list, rules/prize info, and logo/banner media.
- 2026-06-25: Updated group-stage knockout seeding so 2-rank qualifiers from the same group cannot meet before the final for 2~12 groups.
- 2026-06-25: Fixed tournament admin edit/delete persistence for venue, division rules, and stale div schedule refs.
