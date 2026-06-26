# Admin Toss v2.41 Alignment Audit - 2026-06-26

## Scope

- Target route: `src/app/(admin)/tournament-admin/tournaments/[id]`
- Package baseline: BDR v2 (38/39) admin Toss workspace
- PM decision: no hybrid fallback. Tournament admin pages must follow the Toss design package.

## Root Cause

| Item | Finding |
|---|---|
| Visible issue | The tournament admin detail page still looked like the old hybrid workspace. |
| Code cause | `TournamentWorkspace.tsx` rendered `ct-page ct-page--workspace`, a two-column `ct-grid--workspace`, legacy compact segment tabs, and separate save bars. |
| Panel cause | Embedded panels still rendered their own page headers/back links, so the single Toss workspace shell was broken inside the step flow. |
| CSS cause | Legacy workspace CSS remained available and could keep the hybrid layout alive. |

## Applied Fixes

| Area | Fix |
|---|---|
| Workspace shell | Replaced `ct-page--workspace` shell with `tw-shell`, `ts-ph`, `tw-steps`, `ct-progress`, and `tw-foot`. |
| Step flow | Split `schedule` into its own `WorkspaceSection` so the 5-step flow is explicit: info, schedule, divisions, game, publish. |
| Visibility rules | Updated `data-step` CSS so exactly one step section is visible at a time. |
| Panel headers | Removed embedded page headers/back links from admins, recorders, teams, site, and bracket panels. |
| Legacy functions | Removed unused legacy save bars and operation shortcut helpers. |
| Legacy CSS | Removed `ct-page--workspace` and `ct-grid--workspace` rules. |

## Full Scan Result

| Check | Result |
|---|---|
| `ct-page--workspace`, `ct-grid--workspace`, `OperationShortcut`, legacy save bar functions | 0 matches in active workspace code/CSS |
| Panel-level `대회 관리` back links / standalone `참가팀 관리`, `사이트 관리`, `사이트 만들기` headers | 0 active matches |
| Remaining tournament route links | Only in-workspace anchors remain: `#bracket`, `#matches`, `#publish` |
| TypeScript | `cmd /c npx tsc --noEmit` passed |

## Notes

- `rounded-full` remains in some Toss widgets for avatars, step indicators, color swatches, and preview skeletons. This is not the cause of the unchanged page and is part of the Toss admin visual language.
- This pass intentionally preserved API, Prisma, routes, and data fetching. Only UI shell/layout/header/style wiring was changed.
