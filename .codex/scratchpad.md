# Scratchpad

## Current Work
- 2026-06-26 tournament admin: division edit/delete UX and record-app game rule option separation.

## Progress
| Area | Status | Note |
|---|---|---|
| Division admin UX | Done | Selected divisions now support inline rename/delete with empty/duplicate validation. |
| Record app rules | Done | Time/period presets are separate from nonstop/all-dead clock mode. |
| Verification | Done | `cmd /c npx vitest run src/__tests__/lib/tournaments/game-rules.test.ts` and `cmd /c npx tsc --noEmit` passed. |

## Work Log
- 2026-06-26: Added tournament division inline rename/delete controls and separated record-app time presets from clock mode.
- 2026-06-25: Repaired customer signal contact/report flow copy and prepared operator email reporting verification.
- 2026-06-25: Improved tournament admin PC/mobile UX with grouped registration/team/public controls, desktop sticky save, active mobile tabs, and larger image delete targets.
- 2026-06-25: Added manual group assignment controls to tournament admin team cards using the existing team PATCH API.
- 2026-06-25: Restored tournament admin edit fields for bank info, roster/waiting list, rules/prize info, and logo/banner media.
- 2026-06-25: Updated group-stage knockout seeding so 2-rank qualifiers from the same group cannot meet before the final for 2~12 groups.
- 2026-06-25: Fixed tournament admin edit/delete persistence for venue, division rules, and stale div schedule refs.
