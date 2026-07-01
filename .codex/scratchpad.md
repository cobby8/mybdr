# Scratchpad

## Current Work
- 2026-06-27 admin Toss sweep: tournament operate workspace is being rebuilt as direct Toss v2.41/v2.42 implementations over the current DB/API, one tab at a time.

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
| Admin Toss sweep | In Progress | Tournament operate tabs now share the single Toss workspace skin; remaining admin sweep work is broader 9-screen parity. |
| Tournament operate bracket | Done | Bracket tab now has robust single-division category fallback, Toss-style generated match review, and 2-group/3-qualifier cross-seeding with bye-aware preview counts. |
| Tournament operate schedule | Done | Schedule tab now loads tournament dates/courts, supports division durations, lane start times, unscheduled/overwrite auto placement, direct placement, and lane timelines over real match PATCH saves. |
| Admin tournament list | Done | `/admin/tournaments` was replaced with a clean Toss list, Korean copy restored, and row click routes directly to the operate workspace. |
| Tournament teams category display | Done | Teams panel now preserves raw category values but renders/groups by the active division rule, preventing corrupted legacy labels from appearing in live ops. |
| Tournament admin standalone shell | Done | `/tournament-admin/*` now uses the v2.41/v2.42 standalone Toss workspace layout without the legacy global admin sidebar. |
| Admin Toss cleanup | In Progress | Admin scope now scans clean for `ta-*`, `au-*`, `material-symbols-outlined`, `components/ui`, active shell/mobile classes, shared stat/empty/status components, admin dashboard local classes, active `admin-stat-pill`, and active admin table wrappers; remaining work is desktop sidebar class parity and full 9-screen replacement. |
| Tournament operate panel Toss flow | Done | Teams, bracket, schedule, ops, site, and settlement panel roots now run inside the single Toss workspace skin without nested compatibility wrappers. |

## Work Log
- 2026-07-02: Added NBA reporter prompt contract for verified, single-source, developing, analysis, and monitoring outputs; focused Vitest and `cmd /c npx tsc --noEmit` passed.
- 2026-07-02: Added NBA news dry-run scenario fixtures for official, single-insider, multi-source, and rumor cases; focused Vitest and `cmd /c npx tsc --noEmit` passed.
- 2026-07-02: Added NBA news dry-run pipeline and focused tests; fixed two-source T1 scoring threshold; focused Vitest and `cmd /c npx tsc --noEmit` passed.
- 2026-07-02: Upgraded Alkija match-news generation with editorial fact sheets, article-angle selection, and stricter phase2 title/team/score validation; `cmd /c npx tsc --noEmit` passed.
- 2026-07-02: Added NBA news trust scoring utility and unit tests; focused Vitest and `cmd /c npx tsc --noEmit` passed.
- 2026-07-02: Added `src/lib/nba-news/sources.seed.ts` mock source registry from the NBA seed doc; `cmd /c npx tsc --noEmit` passed.
- 2026-07-02: Added NBA newsroom planning docs and `src/lib/nba-news/types.ts` enum/type contract; `cmd /c npx tsc --noEmit` passed.
- 2026-07-01: Electronic score-sheet period navigation now asks for confirmation before next/previous quarter movement; Chrome confirmed Q4 end confirm, Q4→Q3 retreat, and Q3→Q4 advance.
- 2026-07-01: Electronic score-sheet Q4/OT end now delegates to the final review modal; Chrome confirmed period scores, required signatures, disabled submit before signatures, and submit unlock after 4 required signatures.
- 2026-07-01: Electronic score-sheet toolbar now exposes the existing jump-ball/held-ball flow; Chrome confirmed the toolbar button opens the jump-ball dialog.
