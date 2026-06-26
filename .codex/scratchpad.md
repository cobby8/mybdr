# Scratchpad

## Current Work
- 2026-06-26 admin Toss sweep: remaining tournament-admin and admin pages are being converted sequentially.

## Progress
| Area | Status | Note |
|---|---|---|
| Theme tokens | Done | Added `--color-on-primary` so red primary buttons render white text/icons. |
| Live box score | Done | Per-team `기본/고급` toggle added beside team name; help icon added at each table header. |
| Verification | Partial | Target TSX transpile and `git diff --check` passed; full `tsc` is blocked by stale `.next` validator route refs. |
| Push/main merge | Done | Existing dev work and bdr_stat_v3 fix were pushed; mybdr dev was merged to main. |
| Admin game rules | Done | `game_time`/`game_method` now derive from canonical `game_rules` instead of free text. |
| Recording modes | Done | Match-level `manual` is counted, displayed, and blocked from Flutter/score-sheet system inputs. |
| Verification | Done | Targeted Vitest suite and `cmd /c npx tsc --noEmit` passed. |
| Admin Toss handoff | Done | `BDR-current/_handoff-admin-toss-v2.41/` added; src unchanged. |
| Tournament admin implementation | In Progress | Matches score modal now exposes the existing manual recording mode. |

## Work Log
- 2026-06-26: Removed remaining tournament-admin series new-page UI Card/Button dependencies; TypeScript passed.
- 2026-06-26: Converted tournament-admin series add-edition/edit form wrappers and submit buttons to Toss `ts-card`/`ts-btn`; TypeScript passed.
- 2026-06-26: Converted tournament-admin series detail edition rows and empty state from UI Card/Badge to Toss wrappers; TypeScript passed.
- 2026-06-26: Converted tournament-admin series list from UI Card/Badge to Toss `ts-card`/chip/`ct-emptybox`; TypeScript passed.
- 2026-06-26: Converted tournament-admin templates empty state from UI Card/Material span to Toss `ct-emptybox` + Icon; TypeScript passed.
- 2026-06-26: Converted all remaining tournament-admin `Card/Button` wrappers in target panels/components to Toss `ts-*` wrappers; TypeScript passed.
- 2026-06-26: Defined `--color-on-primary` to fix black text/icons on red primary buttons.
- 2026-06-26: Added live box score `기본/고급` toggle, advanced stats, and one help popover per team table.
- 2026-06-26: Updated setup progress and match edit modal to treat `manual` as a real recording mode; targeted Vitest and TypeScript passed.
- 2026-06-26: Absorbed v2.41 admin Toss reverse-bake handoff into `BDR-current`, preserving B1 QA lock docs; no src changes.
- 2026-06-26: Restored the tournament creation CTA on the tournament admin list page and verified TypeScript.
- 2026-06-26: Pushed/merged prior fixes, then aligned tournament admin game-rule display and match-level manual recording-mode guards.
- 2026-06-26: Added tournament division inline rename/delete controls and separated record-app time presets from clock mode.
- 2026-06-25: Repaired customer signal contact/report flow copy and prepared operator email reporting verification.
- 2026-06-25: Improved tournament admin PC/mobile UX with grouped registration/team/public controls, desktop sticky save, active mobile tabs, and larger image delete targets.
- 2026-06-25: Added manual group assignment controls to tournament admin team cards using the existing team PATCH API.
- 2026-06-25: Restored tournament admin edit fields for bank info, roster/waiting list, rules/prize info, and logo/banner media.
- 2026-06-25: Updated group-stage knockout seeding so 2-rank qualifiers from the same group cannot meet before the final for 2~12 groups.
