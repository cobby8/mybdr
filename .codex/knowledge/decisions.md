# Decision Log

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
