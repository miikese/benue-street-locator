# Benue Street Locator product plan

## Purpose and users
Help residents, visitors and delivery workers discover public places in Otukpo,
then expand across Benue without inventing official addresses or local facts.

## Current working MVP
React/TypeScript interface with Leaflet, QR sharing and a bounded OSM source
snapshot. A separate Cloudflare Worker API uses D1/SQLite and R2 images.
ChatGPT identity is checked server-side; allowlisted moderators review submissions.
The loopback runner uses a development identity only, never production sign-in.

Implemented: local-directory search (aliases, accents, multiple terms and one-edit
typos), LGA/category filters, nearby straight-line sorting, map pins, external
directions, optional OSRM driving routes, saved places, QR/WhatsApp links,
private pending contributions, moderation history, notifications and deletion.
Low-data mode pauses tiles; the offline shell caches public details, not private API
responses or third-party tiles. All 23 LGA names are taxonomy, not boundaries.

## Decisions and researched dependencies
- Keep one maintainable Worker and relational schema; no paid geocoder or accounts.
- OSM attribution is visible. Do not prefetch/offline-cache OSM tiles, in accordance
  with https://operations.osmfoundation.org/policies/tiles/.
- Search stays within our directory rather than third-party autocomplete:
  https://operations.osmfoundation.org/policies/nominatim/.
- Real driving routes require an operator-configured OSRM-compatible provider;
  its outage must show a fallback, never fabricated routes.
- Limit typo matching to one edit on terms of at least four characters; require
  every query term so unrelated places do not crowd out accurate discovery.
- Validate URLs structurally and reject embedded credentials in public listings.

## Architecture, security and operations
See db/schema.ts, drizzle/ migrations, docs/api.md, docs/security.md and
README.md. Parameterized SQL, upload size/type/ownership checks, same-origin
writes, per-user limits and moderator-only transitions protect the workflow.
Production health endpoint: /api/health; configure admin identities and independent
D1/R2 bindings before accepting contributions. Back up storage and monitor failed
API requests. Keep initial seed provenance separate from community verification.

## Next phases
1. Field-review public directory sources, provide evidence criteria and duplicate
   candidate review; no claim of verified businesses yet.
2. Apply corrections to source records with an auditable merge workflow.
3. Add cursor pagination for larger directories. Privacy/owner/type filters now run
   in SQL before the 1,000-record cap, preventing pending backlogs hiding places.
4. Validate LGA polygons, accessible route evidence and local-language content.
5. Choose a supported tile/routing provider and perform production identity,
   backup/restore and moderation-operations checks before broad public release.

## Acceptance and delivery
Run unit/API rules against real SQLite, strict typechecking, lint, both production
builds and browser contribution/moderation/save/QR journeys on desktop/mobile.
Ship and verify this repository before publishing its portfolio card. Status:
working MVP, continuing development; advanced roadmap is not complete.

## Dependency maintenance phase
Apply tested patch releases without changing the product architecture. Audit
production dependencies separately from the build/migration toolchain, record
remaining advisories, and rebuild/retest browser workflows before GitHub and Sites
delivery. Maintainer advisories include:
https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j and
https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w.
