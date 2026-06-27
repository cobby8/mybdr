# v39 Data Consistency Note

Date: 2026-06-26

## Applied Baseline
- Admin/operation mock baseline: `BDR Summer Open #4` uses 44 teams and 27 matches.
- v39 corrected stale list/backoffice 38-team labels and activity-feed 31-match labels to match the workspace summary.

## Superseded by v2.42 Wiring Delta
- `BDR v2 (40).zip` delivered `_delta-v2.42-wiring/`.
- Public site mock fiction baseline is no longer the current handoff direction.
- Public site data should derive from the admin/workspace source: 44 teams / 27 matches / 4 divisions.
- See `IMPLEMENTATION-v2.42-wiring.md`, `PUBLIC-SITE-DATA-MAP.md`, and `public-site-data.jsx`.

## Source Code Impact
- No `src/` change was required. Operational tournament pages already use DB/API wiring instead of these mock summary literals.
