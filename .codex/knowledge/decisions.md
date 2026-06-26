# Decision Log

## 2026-06-26 Tournament Operate/Edit Route Split

- Decision: `/tournament-admin/tournaments/[id]` is now the primary operate workspace, and the edit/setup form moves to `/tournament-admin/tournaments/[id]/edit`.
- Reason: tournament operators need a direct entry point for teams, bracket, schedule, operations, site, and settlement instead of landing in the setup wizard-like edit form.
- Scope: App Router pages, shared server prop loader, Toss operate workspace component, and scoped Toss CSS only. No DB schema or API route changes.
- Guardrail: existing hash links keep working by mapping old anchors to operate menus; settlement cannot display mock financial values until a real tournament income/expense data contract exists.

## 2026-06-26 Manual Recording Mode Contract

- Decision: match-level `recording_mode="manual"` is a real mode, but it means BDR record-system input is disabled rather than another Flutter/score-sheet input path.
- Reason: tournament admins can apply manual mode to matches, and treating it as Flutter fallback risks accidental app sync, auto quarter-score recomputation, and misleading admin stats.
- Scope: shared recording-mode parser, admin match stats UI, Flutter batch sync guard, web score-sheet guard, quarter-score auto-sync, match-minute exclusion, and tests.
- Guardrail: `manual` must be counted separately from `flutter` and `paper`; system input routes should return `RECORDING_MODE_MANUAL` or a manual-specific safe reason.

## 2026-06-26 Record App Game Rule Axes

- Decision: admin game-rule presets represent only time/period structure, while `clockMode` is selected independently as `nonstop` or `dead`.
- Reason: record-app operation combines "7분 4쿼터" style structure with "논스톱/올데드" clock behavior; mixing both into preset labels made the UI ambiguous.
- Scope: shared `game-rules` helpers, tournament creation/admin game settings UI, and additive v1 response fields.
- Guardrail: `toGameRulesResponse` now exposes `quarter_type` and `clock_mode` separately in addition to the full `game_rules` JSON.

## 2026-06-25 Division Bracket Generation

- Decision: `group_stage_knockout` creates a real knockout skeleton from group-rank placeholders, and `group_stage_with_ranking` supports every same-rank group pairing for 3+ groups.
- Reason: the approved six tournament formats must be operable from admin controls without dummy data or stub generators.
- Scope: division advancement planner/generator and unit tests only. No DB schema change or destructive data operation.
- Guardrail: `group_stage_knockout` expands odd/non-power-of-two qualifier counts to the next power-of-two bracket and carries empty slots as byes instead of creating partial brackets.

## 2026-06-25 Customer Signal Email Reporting

- Decision: build customer inquiry/error/correction reporting without a DB migration by combining `suggestions` for logged-in form submissions with `CUSTOMER_SIGNAL_REPORT_TO` email reports for every accepted signal.
- Reason: the owner needs immediate email visibility, while avoiding production DB schema risk during the first operational version.
- Scope: `/help/contact`, `/api/web/customer-signals`, shared mailer, and existing game/court report trigger hooks.
- Deferred: dedicated inquiry table, admin inbox filter for anonymous email-only signals, and non-email channels such as Slack/Kakao.

## 2026-06-25 Map API for Tournament Venues

- Decision: use Kakao Local/Maps/Navi links as the primary venue search and navigation path for Korean tournament operations.
- Reason: Korean venue/place accuracy and direct Kakao route links are more relevant than global-first autocomplete for domestic basketball venues.
- Scope: no DB schema change. Store provider/placeId/lat/lng/mapUrl/routeUrl inside `Tournament.places` JSON and expose them through admin/public schedule flows.
- Deferred: TMAP can be added later for richer ETA/traffic estimates if the product needs server-side travel-time suggestions.

## 2026-06-24 Tournament Admin IA

- Decision: existing tournament operation uses one page workspace instead of multiple nested admin routes.
- Reason: the previous admin sidebar + sub-nav + wizard tabs + detail routes created too much navigation and slow perceived flow.
- Scope: UI route files only; no DB schema, destructive data work, or API endpoint deletion.
- Section anchors are the canonical intra-workspace destinations: `#setup`, `#teams`, `#structure`, `#matches`, `#staff`, `#publish`.

## 2026-06-24 Tournament Admin Entry IA

- Decision: remove the separate "대회 운영자 도구" menu entry and make "대회 관리" the single admin entry point.
- Reason: operators manage tournaments, not a separate tool surface; the authorized tournament list already enforces organizer/admin-member visibility.
- Scope: navigation and redirect only. `/tournament-admin` redirects to `/tournament-admin/tournaments`; detail/API permissions remain unchanged.
