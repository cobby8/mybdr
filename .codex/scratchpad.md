# Scratchpad

## Current Work
- 2026-06-25 tournament admin edit/delete bugfix: venue deletion, division deletion sync, stale division schedule cleanup.

## Progress
| Area | Status | Note |
|---|---|---|
| Tournament setup save | Done | Empty places now clear base venue fields. |
| Division sync | Done | Deselected unused division rules are deleted. |
| Verification | Done | `cmd /c npx tsc --noEmit` passed. |

## Work Log
- 2026-06-25: Updated group-stage knockout seeding so 2-rank qualifiers from the same group cannot meet before the final for 2~12 groups.
- 2026-06-25: Fixed tournament admin edit/delete persistence for venue, division rules, and stale div schedule refs.
