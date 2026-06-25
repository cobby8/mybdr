# Scratchpad

## Current Work
- 2026-06-25 tournament admin edit flow: restore edit/delete controls for fields saved during tournament creation.

## Progress
| Area | Status | Note |
|---|---|---|
| Admin setup fields | Done | Bank, roster, waiting list, rules/prize, logo/banner round-trip restored. |
| Verification | Done | `cmd /c npx tsc --noEmit` and targeted vitest passed. |

## Work Log
- 2026-06-25: Restored tournament admin edit fields for bank info, roster/waiting list, rules/prize info, and logo/banner media.
- 2026-06-25: Updated group-stage knockout seeding so 2-rank qualifiers from the same group cannot meet before the final for 2~12 groups.
- 2026-06-25: Fixed tournament admin edit/delete persistence for venue, division rules, and stale div schedule refs.
