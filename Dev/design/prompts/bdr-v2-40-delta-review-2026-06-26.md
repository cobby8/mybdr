# BDR v2 (40) Delta Review

Date: 2026-06-26
Source: `C:/Users/user/Downloads/BDR v2 (40).zip`
Imported to:
- `Dev/design/BDR-current/_delta-v2.42-wiring/`
- `Dev/design/BDR-current/_handoff-admin-toss-v2.41/`

## 1. Package Classification

| Item | Result |
|---|---|
| Package type | v2.42 wiring delta, not a full UI package |
| File count | 4 |
| Main purpose | Public tournament site data must derive from admin/workspace source |
| UI scope | No new full screen HTML; data map and wiring metadata only |
| Source impact | Design handoff files only. No `src/` change yet |

## 2. Files Received

| File | Meaning |
|---|---|
| `IMPLEMENTATION.md` | Delta implementation note: stale mock team names fixed, public site wiring rules added |
| `PUBLIC-SITE-DATA-MAP.md` | Public site field → admin source map |
| `data.jsx` | Admin Toss workspace mock data corrected |
| `public-site-data.jsx` | Public site canonical data + `PSITE.wiring` bind/placeholder map |

## 3. Applied to Active Design

| Change | Status |
|---|---|
| Preserve raw delta under `BDR-current/_delta-v2.42-wiring/` | Done |
| Replace active handoff `data.jsx` with corrected version | Done |
| Add `public-site-data.jsx` to active handoff | Done |
| Add `PUBLIC-SITE-DATA-MAP.md` to active handoff | Done |
| Add `IMPLEMENTATION-v2.42-wiring.md` to active handoff | Done |
| Mark old v39 public fiction note as superseded | Done |

## 4. Key Findings

| Finding | Impact |
|---|---|
| Existing active `data.jsx` still referenced orphan mock teams before import | Fixed in design handoff |
| New canonical baseline is 44 teams / 27 matches / 4 divisions | Use this for public site and admin QA |
| `homeId/awayId` is now the match truth source in design data | Implementation should join by team FK, not team-name string |
| Public site `schedule/bracket/finalResult` are placeholder demo values | Operating source must inject API data; do not ship mock |
| Visibility model is section-based: overview/teams/schedule/bracket/results | Current production has only site-level publish gating |

## 5. Current Production Reality

| Area | Current Source Reality | Gap vs v2(40) |
|---|---|---|
| Public site route | `src/app/site-host` | Exists, real DB wired |
| Site publish | `TournamentSite.isPublished` | Site-level only |
| Public schedule API | `src/app/api/web/tournaments/[id]/public-schedule` | Reads all tournament matches; no explicit `match.published` gate found |
| Public bracket API | `src/app/api/web/tournaments/[id]/public-bracket` | Uses active/real matches and bracket logic; no explicit `bracket.publishedVersion` field found |
| Public teams/standings | Existing APIs | Need map to section visibility matrix |
| Final stats/article | Existing `stat-leaders` util exists, but site result/article gate needs audit | v2(40) wants `hasStats/hasArticle` false -> ready state, no mock |
| Design route naming | Earlier docs mentioned `src/app/(site)` | Actual route is `src/app/site-host` |

## 6. Updated Remaining Work

### Batch A. Admin Toss Parity Inventory

| Task | Status |
|---|---|
| Build v2.41/v2.42 class/function inventory | Pending |
| Compare operating `src` vs canonical handoff | Pending |
| Mark `ta-*`, old `admin-*`, `components/ui`, Material Symbols cleanup candidates | Pending |
| Include v2(40) public wiring delta in inventory | Added to scope |

### Batch B. Public Site Data Wiring Audit

| Task | Status |
|---|---|
| Audit `site-host` pages against `PUBLIC-SITE-DATA-MAP.md` | Pending |
| Audit `public-schedule`, `public-bracket`, `public-teams`, `public-standings` APIs | Pending |
| Identify fields that exist now vs DB/API design needed | Pending |
| Ensure mock schedule/bracket/finalResult does not ship | Pending |
| Replace stale route reference `src/app/(site)` with actual `src/app/site-host` in follow-up docs | Pending |

### Batch C. Publish Visibility Design Decision

v2(40) defines this matrix:

| State | overview | teams | schedule | bracket | results |
|---|---|---|---|---|---|
| before | show | hide | prep | hide | hide |
| reg | show | partial | prep | hide | hide |
| predraw | show | show | prep | prep | hide |
| drawn | show | show | prep | prep | hide |
| published | show | show | show | show | hide |
| live | show | show | show | show | partial |
| ended | show | show | show | show | show |

Implementation needs a decision because production currently appears to have only `TournamentSite.isPublished`.

| Option | Meaning | Risk |
|---|---|---|
| C1 | Implement visibility from existing tournament status + current APIs only | Faster, but no per-section publish control |
| C2 | Add section publish metadata to existing site/settings JSON | Medium DB/API work, matches v2(40) without new table |
| C3 | Add explicit DB fields/tables for section/match/bracket publication | Cleanest contract, highest DB impact |

Recommended next: audit current DB fields first, then propose the least destructive C1/C2 path.

### Batch D. Tournament Admin 100% Toss UI

Still unchanged by v2(40). Continue from previous plan:

| Priority | Area |
|---|---|
| D1 | Workspace shell exact parity |
| D2 | Divisions + Bracket |
| D3 | Schedule + Game settings |
| D4 | Matches + ScoreModal |
| D5 | Teams |
| D6 | Recorders / Site / Admins |
| D7 | Remove hybrid layers after replacements |

### Batch E. Public Site UI/Data Sync

New after v2(40):

| Priority | Area |
|---|---|
| E1 | Site home summary uses admin-derived team/match/division counts |
| E2 | Teams tab only shows approved teams per visibility state |
| E3 | Schedule tab shows published/prep/hide states |
| E4 | Bracket tab shows published/prep/hide states |
| E5 | Results tab uses real standings/MVP/stats/article flags |
| E6 | Empty/prep copy uses "준비중", never fake mock data |

## 7. Immediate Next Action

Next executable work:

1. Generate Admin Toss + Public Site parity inventory.
2. Include v2(40) as a new data-wiring source.
3. Produce a source-to-design gap table before code edits.

Do not start DB/schema changes until the public visibility path is chosen.
