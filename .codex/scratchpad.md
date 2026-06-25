# Scratchpad

## Current Work
- 2026-06-25 tournament admin manual operations: add manual group assignment controls before schedule board work.

## Progress
| Area | Status | Note |
|---|---|---|
| Admin setup fields | Done | Bank, roster, waiting list, rules/prize, logo/banner round-trip restored. |
| Verification | Done | `cmd /c npx tsc --noEmit` and targeted vitest passed. |

## Work Log
- 2026-06-25: Added manual group assignment controls to tournament admin team cards using the existing team PATCH API.
- 2026-06-25: Restored tournament admin edit fields for bank info, roster/waiting list, rules/prize info, and logo/banner media.
- 2026-06-25: Updated group-stage knockout seeding so 2-rank qualifiers from the same group cannot meet before the final for 2~12 groups.
- 2026-06-25: Fixed tournament admin edit/delete persistence for venue, division rules, and stale div schedule refs.
