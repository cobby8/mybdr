# Scratchpad

## Current Work
- 2026-06-27 live tournament setup: Gangnam D5 tournament is configured for electronic score-sheet recording mode, with public/admin copy using "전자기록지".

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
| Recording copy | Done | User-facing "종이 기록지" copy has been renamed to "전자기록지" while internal `paper` mode/data keys are preserved. |
| Admin Toss handoff | Done | `BDR-current/_handoff-admin-toss-v2.41/` added; src unchanged. |
| Admin Toss sweep | In Progress | v2(41) state/cleanup pass added Toss confirm/prompt modals and first loading/empty helpers; dev/main are synced. |
| Tournament operate bracket | Done | Legacy bracket tab was replaced with the Toss operate flow: division config, seeded/random draw, group slots, and division generation. |

## Work Log
- 2026-06-27: Set Gangnam Association Cup D5 tournament and all 13 matches to `recording_mode=paper`, renamed user-facing score-sheet copy to "전자기록지", and kept internal `paper`/`[종이 기록]` data keys for compatibility; TypeScript passed.
- 2026-06-27: Fixed single-division bracket data fallback for corrupted team category values so the operate bracket tab recognizes approved teams and normalizes categories on draw/generate; TypeScript and production build passed.
- 2026-06-27: Replaced the legacy tournament operate bracket tab with the Toss v2.41 flow: division config, slot-based seeded draw, group-slot rendering, preview tree, and division generation; TypeScript and production build passed.
- 2026-06-26: Split tournament admin detail into a 6-menu Toss operate workspace at `/tournament-admin/tournaments/[id]` and a preserved edit/setup workspace at `/edit`; TypeScript and production build passed.
- 2026-06-26: Fixed tournament division rule settings save clarity: removed blur-only saves, added explicit settings save state, and refreshed rule format/settings from the PATCH response; TypeScript and targeted division-format Vitest passed.
- 2026-06-26: Fixed tournament bracket generation for live ops: bracket panel now exposes division-rule generation even at 0 matches, disables unsafe global generation when division rules exist, supports division single-elim/round-robin generation, and blocks mismatched group sizes before writes; TypeScript and targeted Vitest passed.
- 2026-06-26: Fixed tournament team division operations for next-day live ops: single/bulk team category moves now sync team division and player division codes, team cards expose category selects, and delete blocks show linked counts; TypeScript passed.
- 2026-06-26: Applied BDR v2 (41) admin Toss state pass: destructive confirms and prompt flows now use Toss modals, state helpers/skeletons are in `admin-toss`, and dev/main were pushed.
- 2026-06-26: Wired previous tournament import to real DB/API, removed venue mock fallback, linked wizard PDF/association actions, and replaced teams panel player error alerts with Toss toast; TypeScript passed and dev/main were pushed.
- 2026-06-26: Cleaned recorders/admins panels to shared Toss `tp-*` list/message/avatar classes; scans are clean and TypeScript passed.
