# REST API

All JSON responses have no-store and nosniff headers. Mutations require platform
identity and pass same-origin and database-backed rate checks.

- GET /api/health — real database health.
- GET /api/me — current user/role and private notifications.
- GET /api/records?kind=place — public, approved records; owner IDs omitted.
- GET /api/records?mine=1 — current user's submissions.
- GET /api/records?review=1 — moderator-only queue.
- POST /api/records — validated {kind: "place"|"correction", data:{...}}.
- GET /api/records/:id — allowed details and chronological status history.
- PATCH /api/records/:id — moderator-only {status, note}, valid transitions only.
- DELETE /api/records/:id — owner or moderator.
- GET/POST /api/actions — private favorites, follows and abuse flags.
- POST /api/notifications — mark own notifications read.
- POST /api/upload — JPEG/PNG/WebP, maximum 2 MB; signed-in only.
- GET /api/photo/:id — publicly approved attachments or owner/moderator access.
- DELETE /api/account — delete the signed-in user's application data.
- GET /api/directions?from=lat,lng&to=lat,lng — configured real OSRM driving routes.
- POST /api/seed — moderator-only idempotent import of bundled OSM references.

Deployment initialization can temporarily authorize only /api/seed through an
ephemeral INITIALIZE_TOKEN runtime secret. The operator removes it immediately
after importing the attributed source snapshot. It grants no general API access.
