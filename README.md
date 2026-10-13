# Benue Street Locator

**Find Streets. Discover Places. Navigate Benue.**

A working Otukpo-first public mapping MVP. Independent React/TypeScript application,
REST API, SQLite-compatible Cloudflare D1 database, and moderated photo storage.
Built with Vinext for the connected Sites host; a lightweight Node/SQLite companion
runs the same API and frontend locally.

## Run on Linux

Requires Node 22.13+ and npm. No paid API or separate database process is needed.

```sh
npm ci
npm run build:local
PORT=3101 npm run local
```

Open http://127.0.0.1:3101. The companion runner applies pending schema migrations
automatically and imports two attributed OSM public map references. SQLite lives in
ignored `.local-state/data.sqlite`; images live in `.local-state/uploads`.
“Sign in” uses a **local development account** that is an administrator only on the
loopback-only runner. Local sessions are HttpOnly and SameSite=Lax; they are not
production authentication. Stop with Ctrl+C. The application and saved records
persist across restarts; sign in again after a restart.

For framework development: `npm run dev -- --port 3101 --hostname 127.0.0.1`.
The starter simulates ChatGPT sign-in only on loopback. D1 preview migrations must
first be applied as described in docs/deployment.md.

## Working features

- Interactive, attributed OSM roads, pan/zoom, markers, permission-based geolocation.
- Search public records and alternative local names; category and all 23 LGA filters.
- GPS-coordinate search, nearby straight-line sorting, local search history.
- Reviewed-public-place detail cards, source links and shareable links.
- Private map-pin links without registering a private home in the public directory.
- Account favorites; previously viewed public details cached for offline use.
- QR generation and WhatsApp sharing.
- Real OSRM driving route geometry, estimates and instructions when configured.
  If unavailable, the app offers external OSM directions; it invents no routes.
- Missing-place and correction submissions; public business fields and photos.
- Pending → under-review → approved/rejected moderation with review notes/history.
- Server-side moderator authorization, private pending records, notifications.
- Image format/size checks; browser re-encoding removes EXIF/location metadata.
- Account data deletion, write rate limits, same-origin checks and bounded bodies.
- Responsive desktop/mobile layouts, keyboard focus, light/dark and large-text modes.
- Installable web manifest and shell/asset cache. Map tiles and private API data
  are never cached by the service worker.

The two initial source records are **map references, not locally verified listings**.
Orokam Street's coordinates represent its mapped centre. The LGA registry is a
filter taxonomy, not polygon boundary data or a point-in-boundary validator.

## Quality checks

```sh
npm run typecheck
npm test
npm run build:local
npm run build
```

Browser journeys: install Python Playwright, then run `python3 scripts/e2e.py`
against the local runner. See docs/testing.md. GitHub Actions runs tests, type
checking, both builds, and desktop/mobile browser checks.

## Deployment and privacy

Connected Sites deployment uses Cloudflare Workers, D1 and R2, with dispatch-owned
ChatGPT authentication. Every mutation checks identity on the server. No password,
OAuth secret or session token is exposed to browser code.
`.openai/hosting.json` identifies the independent Site and bindings.
Configure `ADMIN_USER_IDS` (site-specific stable user IDs) or `ADMIN_EMAILS`
(verified platform emails) in the host's runtime secret settings.
An ordinary first visitor is **never automatically made admin**.

`ROUTING_URL` configures an OSRM-compatible driving service.
The public OSRM demo is best-effort; use an operator-backed instance for scale.
No walking/cycling estimates or traffic conditions are claimed.

Detailed deployment, API, security, data attribution, validation and remaining
phases are in docs/. No software license has been selected; dependency and OSM
licenses retain their own terms.

## Boundaries of this MVP

Locally verified business contacts, official building numbers, business claims,
business reviews/reputation, transport operator data, photo evidence verification,
accurate LGA boundary polygons, multilingual content, full offline map regions,
alternative/walking/cycling routes and voice navigation are future phases.
A reviewed contribution is not automatically an official or independently
verified government address. This is not an emergency dispatch service.

## Isolated browser verification

Set `APP_STATE_DIR` on the local runner to keep browser fixtures separate from
your saved data. The default remains `.local-state`; existing records are preserved.
For example, use `APP_STATE_DIR=/tmp/benue-street-locator-qa npm run local`,
then run `python3 scripts/e2e.py` in another terminal. Use a fresh directory for
each run. Browser checks include 320px, 390px, 768px and 1440px layouts.

## Address lookup and My journeys

Use **Search wider map for this address** for sourced public street/address references. Add any place or private pin to **My journeys**, with planned/visited status, dates, private notes, stop order and JSON export. All journey data stays on this device. See [provider setup, privacy and checks](docs/journeys.md).
