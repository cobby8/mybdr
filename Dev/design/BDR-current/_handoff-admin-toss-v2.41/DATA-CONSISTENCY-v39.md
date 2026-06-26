# v39 Data Consistency Note

Date: 2026-06-26

## Applied Baseline
- Admin/operation mock baseline: `BDR Summer Open #4` uses 44 teams and 27 matches.
- v39 corrected stale list/backoffice 38-team labels and activity-feed 31-match labels to match the workspace summary.

## Not Applied
- Public site mock remains a separate fiction baseline with 38 teams and different divisions/team names.
- Unifying public site data with admin data needs a PM decision before changing it.

## Source Code Impact
- No `src/` change was required. Operational tournament pages already use DB/API wiring instead of these mock summary literals.
