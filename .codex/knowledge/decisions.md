# Decision Log

## 2026-06-25 Division Bracket Generation

- Decision: `group_stage_knockout` creates a real knockout skeleton from group-rank placeholders, and `group_stage_with_ranking` supports every same-rank group pairing for 3+ groups.
- Reason: the approved six tournament formats must be operable from admin controls without dummy data or stub generators.
- Scope: division advancement planner/generator and unit tests only. No DB schema change or destructive data operation.
- Guardrail: `group_stage_knockout` requires total qualifiers to be a power of two; unsupported sizes return a clear reason instead of creating partial brackets.

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
