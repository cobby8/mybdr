# Errors

## 2026-06-26 Prettier via npx Blocked by Registry/Cache Access

- Symptom: `cmd /c npx prettier --write ...` hung without output and then failed with `npm ERR! EACCES` while trying to request `https://registry.npmjs.org/prettier`.
- Cause: `prettier` was not available locally, so `npx` attempted a network/cache operation that is not permitted in the current environment.
- Fix: Skipped formatter and validated the focused TSX/CSS changes with `cmd /c npx tsc --noEmit` and `git diff --check`.
- Prevention: Prefer an already-installed formatter script from `package.json`; if none exists, do not use bare `npx prettier` without confirming package availability/network access.

## 2026-06-26 Local Browser QA Blocked by Supabase Pooler

- Symptom: Local admin browser QA redirected to login or rendered Prisma initialization errors while opening `/admin/tournaments`, `/admin/users`, and `/admin/partners`.
- Cause: The local dev server could not reach `aws-1-ap-northeast-2.pooler.supabase.com:6543`, so admin data queries and dev auto-login could not complete.
- Fix: UI changes were validated with `cmd /c npx tsc --noEmit`, `git diff --check`, and residue scans; full browser QA should be rerun when DB connectivity is available.
- Prevention: Before browser QA for admin pages, confirm the Supabase pooler is reachable or use a local/dev DB override with known seed data.

## 2026-06-26 Missing Primary Contrast Token

- Symptom: Red primary buttons could render black text/icons when components used `var(--color-on-primary)`.
- Cause: Several components referenced `--color-on-primary`, but the global theme alias layer only defined `--color-on-text-primary` and `--color-on-accent`.
- Fix: Define `--color-on-primary: #ffffff` in both light and dark theme alias blocks.
- Prevention: When introducing `--color-on-*` usages, confirm the alias exists in `src/app/globals.css` for every theme block.

## 2026-06-26 Next Validator Stale Route Cache

- Symptom: `.\node_modules\.bin\tsc.cmd --noEmit --incremental false` failed in `.next/dev/types/validator.ts` and `.next/types/validator.ts`, pointing to deleted tournament-admin route files.
- Cause: Next generated validator files were stale and still referenced admin route modules that no longer exist in `src/app`.
- Fix: The live box-score change was validated with target TSX transpile and `git diff --check`; full `tsc` needs regenerated `.next` type metadata before it can be used as a clean signal.
- Prevention: When deleted/moved app routes appear in `.next/**/validator.ts` errors, regenerate or clean Next generated types before treating the result as a source-code failure.

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
