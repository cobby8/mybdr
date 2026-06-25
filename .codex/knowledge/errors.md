# Errors

## 2026-06-25 Tournament Admin Edit/Delete Persistence

- Symptom: Tournament admin users could remove venue/division values in the UI, but saved data appeared to remain or reappear.
- Cause: Setup save fell back to legacy `venue_name`/`venue_address` when `places` was empty, and division sync only created/updated `TournamentDivisionRule` rows without deleting deselected unused rules.
- Fix: Empty `places` now sends null base venue fields; division sync deletes unreferenced deselected rules and blocks deletion when teams or matches still reference the division code.
- Prevention: When a UI supports deletion, send explicit null/empty values and make the server reconcile removed child rows or return a clear conflict.
