# Errors

## 2026-06-26 Manual Recording Mode Fell Back to Flutter

- Symptom: Admin bulk controls could set match `recording_mode="manual"`, but shared mode extraction treated it as `flutter`, so stats, Flutter batch-sync guards, score-sheet errors, and auto quarter-score sync could misclassify manual matches.
- Cause: `getRecordingMode()` still only recognized `paper`; `manual` had been added to UI/API schemas first as a tournament-level concept and was not promoted through every match-level guard.
- Fix: `getRecordingMode()` now returns `manual`, match stats include manual counts, Flutter batch sync and web score-sheet submit return manual-specific blocks, and quarter-score/minutes helpers skip manual like non-record-app input.
- Prevention: When adding a new enum-like mode, update the canonical parser, all boundary guards, server stats, UI summaries, and tests in the same change.

## 2026-06-26 Archived Zip Source Included in Typecheck

- Symptom: `cmd /c npx tsc --noEmit` failed in `Dev/design/_zips/.../ct-game-settings.tsx` after changing the live `GameRulePreset` type.
- Cause: `tsconfig.json` included `**/*.ts` and `**/*.tsx`, so archived design zip source copies were treated as active TypeScript source.
- Fix: exclude `Dev/design/_zips` from `tsconfig.json` so typecheck targets the actual app code and intentional test sources.
- Prevention: keep generated/archive source bundles outside TypeScript include scope, or add a narrow `exclude` when a design handoff stores source snapshots under the repo.

## 2026-06-25 Tournament Admin Edit/Delete Persistence

- Symptom: Tournament admin users could remove venue/division values in the UI, but saved data appeared to remain or reappear.
- Cause: Setup save fell back to legacy `venue_name`/`venue_address` when `places` was empty, and division sync only created/updated `TournamentDivisionRule` rows without deleting deselected unused rules.
- Fix: Empty `places` now sends null base venue fields; division sync deletes unreferenced deselected rules and blocks deletion when teams or matches still reference the division code.
- Prevention: When a UI supports deletion, send explicit null/empty values and make the server reconcile removed child rows or return a clear conflict.
