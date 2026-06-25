# Architecture Notes

## 2026-06-25 Customer Signal Reporting

- `src/lib/customer-signals/report-mailer.ts` is the shared formatter/sender for customer inquiry, site error, correction request, game report, court report, and court edit suggestion signals.
- `/api/web/customer-signals` accepts help/contact form submissions, rate-limits by IP, stores logged-in submissions in `suggestions`, and queues owner email reporting through `after()`.
- `/help/contact` is the first public intake UI. `/help` links to it instead of opening a `mailto:` URL.
- Existing domain triggers also report by email: game reports with flags/no-show, court physical reports, and court edit suggestions.
- No DB schema change. Logged-in general signals reuse `suggestions`; anonymous signals are email-only in this phase.

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
