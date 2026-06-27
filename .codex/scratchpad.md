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
| Admin Toss sweep | In Progress | Tournament teams, bracket, schedule, ops, and settlement panels were rebuilt around Toss operate flow; site still needs the same direct-replacement pass. |
| Tournament operate bracket | Done | Bracket tab now has robust single-division category fallback, Toss-style generated match review, and 2-group/3-qualifier cross-seeding with bye-aware preview counts. |
| Tournament operate schedule | Done | Schedule tab now loads tournament dates/courts, supports division durations, lane start times, unscheduled/overwrite auto placement, direct placement, and lane timelines over real match PATCH saves. |
| Admin tournament list | Done | `/admin/tournaments` was replaced with a clean Toss list, Korean copy restored, and row click routes directly to the operate workspace. |
| Tournament teams category display | Done | Teams panel now preserves raw category values but renders/groups by the active division rule, preventing corrupted legacy labels from appearing in live ops. |
| Tournament admin standalone shell | Done | `/tournament-admin/*` now uses the v2.41/v2.42 standalone Toss workspace layout without the legacy global admin sidebar. |
| Admin Toss cleanup | In Progress | Admin scope now scans clean for `ta-*`, `au-*`, `material-symbols-outlined`, `components/ui`, active shell/mobile classes, and shared stat/empty/status components; remaining work is desktop sidebar class parity, old admin dashboard local classes, stat-pill/table residues, and full 9-screen replacement. |

## Work Log
- 2026-06-27: Migrated AdminStatCard, AdminEmptyState, and AdminStatusTabs to Toss `ad-stat`/`ad-empty`/`ad-tabs` markup with scoped CSS; TypeScript and local Chrome `/admin` DOM cleanup passed.
- 2026-06-27: Rebuilt AdminMobileNav on Toss `ad-mobile-*`/`ad-side-*` classes while preserving ESC close, route close, body scroll lock, and role-filtered links; TypeScript and local Chrome `/admin/tournaments` DOM cleanup passed.
- 2026-06-27: Migrated shared AdminShell root/main/topbar/content wrappers from legacy shell classes to Toss `ad-*` shell classes, added scoped CSS aliases, and verified local Chrome `/admin/tournaments` plus operate workspace have no old shell/Material/au/ta DOM residue.
- 2026-06-27: Replaced shared AdminPageHeader markup with canonical Toss `ts-ph` structure while preserving props/search/actions; TypeScript, `admin-pageheader` scan, and local Chrome `/admin/tournaments`/`/tournament-admin/tournaments` passed.
- 2026-06-27: Removed admin-scope Material Symbols and `components/ui` dependencies by routing icons/skeleton/buttons through admin Toss lucide kit; `rg` cleanup scan, TypeScript, diff check, and local Chrome `/admin/tournaments`/operate workspace passed.
- 2026-06-27: Replaced admin backoffice `au-*` residue with `ad-*`, added a lucide-based AdminThemeSwitch, and removed global sidebar/user-menu/logout ligature text; TypeScript and local Chrome `/admin/tournaments` passed.
- 2026-06-27: Removed active `ta-*` class usage from tournament operate divisions/bracket/matches surfaces by moving them to `ct-*`/`bk-*`/`amt-*`; `rg ta-*`, TypeScript, diff check, and local Chrome for `#divisions`/`#bracket` passed.
- 2026-06-27: Fixed 2-group/3-qualifier group-stage knockout seeding so first-round matches cross groups, bye slots advance without counting fake games, and the operate bracket preview shows 본선 5경기; Vitest, TypeScript, diff check, and local Chrome passed.
- 2026-06-27: Fixed tournament operate hash hydration by deferring hash sync to mount, and aligned bracket seeded slots/dual advance controls with the Toss flow; local Chrome verified `#bracket` loads without console errors; TypeScript passed.
- 2026-06-27: Replaced remaining Material ligature icons on `/tournament-admin/tournaments` with admin Toss lucide `Icon` components; local Chrome verified no ligature text or legacy sidebar residue; TypeScript passed.
- 2026-06-27: Removed the legacy global admin sidebar from `/tournament-admin/*`, kept auth/permission guards, and verified list/detail pages render as standalone Toss workspaces at 1240px without `light_mode` sidebar residue; TypeScript passed.
- 2026-06-27: Stabilized tournament teams category rendering by preserving raw DB category values while displaying/grouping by active division rules; local Chrome verified 8 teams show `남성 일반부` with no `?? ???`; TypeScript passed.
- 2026-06-27: Replaced `/admin/tournaments` with a clean Toss v2.41 tournament list, removed the legacy detail/delete drawer path from row interaction, verified Chrome local row-click routing to the operate workspace, and TypeScript passed.
