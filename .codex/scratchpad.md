# Scratchpad

## Current Work
- 2026-06-27 admin Toss sweep: tournament operate bracket and teams tabs are being rebuilt as direct Toss v2.41 implementations over the current DB/API.

## Progress
| Area | Status | Note |
|---|---|---|
| Tournament division rule settings | Done | Division operation settings now save through an explicit settings button and refresh local state from the server response. |
| Tournament bracket generation | Done | Division-rule generation is now the primary path, global generation is disabled when division rules exist, and invalid group sizes are blocked before writes. |
| Tournament progression | Done | Single-elim winner advancement now requires explicit `next_match_slot`; first-empty-slot fallback is removed. |
| Tournament division ops | Done | Team category moves now sync team division/player division codes and expose single/bulk move controls. |
| Tournament operate workspace | Done | `/tournament-admin/tournaments/[id]` now opens the 6-menu Toss operate workspace; `/edit` keeps the setup/edit workspace. |
| Theme tokens | Done | Added `--color-on-primary` so red primary buttons render white text/icons. |
| Live box score | Done | Per-team basic/advanced toggle added beside team name; help icon added at each table header. |
| Admin game rules | Done | `game_time`/`game_method` now derive from canonical `game_rules` instead of free text. |
| Recording modes | Done | Match-level `manual` is counted, displayed, and blocked from Flutter/score-sheet system inputs. |
| Recording copy | Done | User-facing "종이 기록지" copy has been renamed to "전자기록지" while internal `paper` mode/data keys are preserved. |
| Admin Toss handoff | Done | `BDR-current/_handoff-admin-toss-v2.41/` added; src unchanged. |
| Admin Toss sweep | In Progress | Tournament teams and bracket panels were rebuilt around Toss operate flow; schedule/ops/site still need the same direct-replacement pass. |
| Tournament operate bracket | Done | Bracket tab now has robust single-division category fallback plus Toss-style generation summary and stage-grouped generated match review. |
| Tournament operate schedule | Done | Schedule tab now loads tournament dates/courts, supports division durations, lane start times, unscheduled/overwrite auto placement, direct placement, and lane timelines over real match PATCH saves. |
| Admin tournament list | Done | `/admin/tournaments` was replaced with a clean Toss list, Korean copy restored, and row click routes directly to the operate workspace. |

## Work Log
- 2026-06-27: Replaced `/admin/tournaments` with a clean Toss v2.41 tournament list, removed the legacy detail/delete drawer path from row interaction, verified Chrome local row-click routing to the operate workspace, and TypeScript passed.
- 2026-06-27: Rebuilt tournament operate schedule tab around the Toss v2.41 scheduler flow: date/court lanes, division durations, lane starts, auto placement, direct placement, lane timelines, and real scheduledAt/venue/court PATCH saves; TypeScript and production build passed.
- 2026-06-27: Added drag reorder persistence to scheduled lane timelines so same-court match order changes recalculate and save start times; TypeScript and production build passed.
- 2026-06-27: Wired tournament operate schedule court numbers end-to-end through match create/update APIs, service writes, and admin match edit UI; TypeScript and production build passed.
- 2026-06-27: Tightened tournament operate bracket tab around the Toss v2.41 flow: single-division category fallback, generation summary, and generated matches grouped by prelim/dual/knockout stages; TypeScript and production build passed.
- 2026-06-27: Rebuilt tournament operate teams panel around the Toss v2.41 flow so division status, single/bulk category moves, approval/payment, tokens, and player roster actions are first-screen operations; TypeScript and production build passed.
- 2026-06-27: Removed first-empty-slot fallback from single-elim winner advancement; winners now require and use explicit `next_match_slot`, with targeted Vitest and TypeScript passing.
- 2026-06-27: Set Gangnam Association Cup D5 tournament and all 13 matches to `recording_mode=paper`, renamed user-facing score-sheet copy to "전자기록지", and kept internal `paper`/`[종이 기록]` data keys for compatibility; TypeScript passed.
- 2026-06-27: Fixed single-division bracket data fallback for corrupted team category values so the operate bracket tab recognizes approved teams and normalizes categories on draw/generate; TypeScript and production build passed.
- 2026-06-27: Replaced the legacy tournament operate bracket tab with the Toss v2.41 flow: division config, slot-based seeded draw, group-slot rendering, preview tree, and division generation; TypeScript and production build passed.
- 2026-06-26: Split tournament admin detail into a 6-menu Toss operate workspace at `/tournament-admin/tournaments/[id]` and a preserved edit/setup workspace at `/edit`; TypeScript and production build passed.
- 2026-06-26: Fixed tournament division rule settings save clarity: removed blur-only saves, added explicit settings save state, and refreshed rule format/settings from the PATCH response; TypeScript and targeted division-format Vitest passed.
