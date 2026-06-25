# Architecture Notes

## 2026-06-25 Tournament Venue Navigation

- `src/lib/maps/navigation-links.ts` is the shared Kakao map/directions URL helper.
- `/api/web/place-search` searches Kakao Local first and keeps Google Places as a fallback.
- Tournament venue data is stored in `Tournament.places` JSON with optional provider, placeId, lat, lng, mapUrl, and routeUrl fields.
- `/api/cron/match-venue-reminders` sends match-day navigation notifications without DB schema changes by deduping through `notifications.notifiable_type/id`.

## 2026-06-24 Tournament Admin Single Workspace

- `/tournament-admin/tournaments/[id]` is now the single workspace for operating an existing tournament.
- The tournament-admin global sidebar remains; the former tournament-management sub-nav was removed from `tournament-admin/layout.tsx`.
- The former `/tournament-admin` hub is no longer a destination; it redirects to `/tournament-admin/tournaments`.
- The admin sidebar exposes one "대회 관리" item. Super/site admins keep the global `/admin/tournaments` destination; plain tournament admins land on `/tournament-admin/tournaments`.
- Existing detail UI routes under `[id]` such as `wizard`, `teams`, `divisions`, `bracket`, `matches`, `recorders`, `admins`, `site`, `playoffs`, and `completed` no longer expose page routes.
- Heavy operating surfaces were moved into `_panels/` and are lazy-loaded inside `TournamentWorkspace`.
- New tournament creation remains at `/tournament-admin/tournaments/new/wizard`; API routes under `/api/web/...` remain unchanged.
