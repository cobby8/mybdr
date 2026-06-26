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
- 2026-06-26: Converted tournament creation wizard navigation and CTA buttons to Toss `ts-btn`; TypeScript passed.
- 2026-06-26: Converted small tournament-admin CTA buttons and series error backgrounds to Toss tokens; TypeScript passed.
- 2026-06-26: Completed series Toss cleanup for CTA buttons, copy/delete controls, and tokenized alert backgrounds; TypeScript passed.
- 2026-06-26: Converted organization action modals to Toss buttons and tokenized selected-state backgrounds; TypeScript passed.
- 2026-06-26: Converted organization detail page cards/buttons/chips to Toss wrappers; TypeScript passed.
- 2026-06-26: Converted organization members page to Toss `ts-card`/`ts-btn` wrappers; TypeScript passed.
- 2026-06-26: Converted tournament-admin organizations list to Toss `ts-card`/`ts-btn` wrappers; TypeScript passed.
- 2026-06-26: Converted tournament-admin playoffs client from UI Card to Toss `ts-card`; TypeScript passed.
- 2026-06-26: Converted tournament-admin series add-edition/edit form wrappers and submit buttons to Toss `ts-card`/`ts-btn`; TypeScript passed.
- 2026-06-26: Added live box score `기본/고급` toggle, advanced stats, and one help popover per team table.
