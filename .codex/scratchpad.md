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
- 2026-07-01: Electronic score-sheet v2 player foul columns now consume the leftover roster width; 1440px/1024px Chrome measurements confirmed no right-side gap.
- 2026-07-01: Electronic score-sheet v2 toolbar now shows a large current-period chip, running-score reached marks inherit period colors, and local Chrome visual/color checks passed.
- 2026-06-27: Replaced recording-mode trigger/card modal Tailwind/inline UI with Toss `rm-*` classes and removed layout inline styles from site panel public-section card; TypeScript and diff check passed.
- 2026-06-27: Added operate-workspace final parity CSS guard for v2.41 Toss sizing and converted schedule table inline cell styles to classes; TypeScript and diff check passed.
- 2026-06-27: Removed nested Toss skin wrappers from bracket/schedule/ops/site/settlement panels, deleted old nested-skin compatibility CSS, and added shared operate panel flow.
- 2026-06-27: Rebuilt tournament teams tab visible order to match the v2.41 Toss screen, removed nested `data-skin` grey background, verified TypeScript/diff check/local Chrome DOM metrics.
- 2026-06-27: Migrated tournament audit-log native table wrapper to Toss `ad-native-table`, removed remaining active `admin-table` strings, and verified TypeScript/local Chrome no old table DOM residue.
- 2026-06-27: Replaced active `admin-stat-pill` usages with Toss `ad-pill` across admin status surfaces and added tone CSS; TypeScript and local Chrome `/admin/users` DOM cleanup passed.
- 2026-06-27: Rebuilt `/admin` dashboard markup on Toss `ad-stats`/`ad-chart`/`ad-log-card` classes while preserving Prisma counts, weekly raw SQL, and recent admin log queries; TypeScript and local Chrome DOM cleanup passed.
- 2026-06-27: Migrated AdminStatCard, AdminEmptyState, and AdminStatusTabs to Toss `ad-stat`/`ad-empty`/`ad-tabs` markup with scoped CSS; TypeScript and local Chrome `/admin` DOM cleanup passed.
- 2026-06-27: Rebuilt AdminMobileNav on Toss `ad-mobile-*`/`ad-side-*` classes while preserving ESC close, route close, body scroll lock, and role-filtered links; TypeScript and local Chrome `/admin/tournaments` DOM cleanup passed.
- 2026-06-27: Migrated shared AdminShell root/main/topbar/content wrappers from legacy shell classes to Toss `ad-*` shell classes, added scoped CSS aliases, and verified local Chrome `/admin/tournaments` plus operate workspace have no old shell/Material/au/ta DOM residue.
