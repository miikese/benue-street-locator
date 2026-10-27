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

## Live navigation and wider search

Open **Live navigation** to opt into live device GPS, see your current marker and accuracy radius, select a place/planned stop/address/map pin, and start driving navigation. Road distance, estimated driving time, arrival time and route steps come from OSRM; they refresh from your latest GPS fix every 45 seconds. You can stop location tracking or disable map following. Tracking stops when the screen closes and never automatically saves a journey or shares location with other accounts. Starting a route sends coordinates to the routing provider. GPS permission, a secure browser context (HTTPS or localhost) and network access are needed. Traffic, closures, vehicle restrictions and full voice guidance are not provided.

A submitted place search now checks the wider Photon map automatically. It returns up to 20 references, recognises both “Benue” and “Benue State” metadata, and shows the lookup date. The homepage shows today's date in the Benue time zone. Lookup date is retrieval time, not verification that every business/street is current. Map coverage is incomplete; missing places can be submitted through Add a place, or located using a public landmark or coordinate pin.

Tests include the live GPS/routing browser contract in `scripts/navigation-check.py`, worldwide device-position validation, arrival arithmetic and wider-search metadata. The browser test uses explicit mocked GPS/routing fixtures; actual local OSRM routing is checked separately when the external service is available.

St Helen Specialist Hospital is included as a sourced public address from Crown Jewel HMO’s provider directory, checked on 13 October 2026. Its exact map pin is not confirmed, so the app shows the address/source but disables coordinate-based routing and journey tracking for that listing. No hospital coordinates, opening hours or services are invented. A reviewed correction can update the original listing once real pin evidence is supplied.

## Current position, nearest street and satellite view

Live navigation shows your reported GPS coordinates, accuracy in metres and a separate nearest-road marker. **Centre on me** zooms to your current position; **Copy coordinates** copies the current fix. Street lookup refreshes every 15 seconds from the current GPS position using the OSRM driving network. An unnamed road stays labelled as unnamed; road coverage and GPS accuracy determine how closely the street match represents your position. Coordinates are shared only with the configured routing provider while this opt-in screen is tracking, and are not recorded in the database.

Every map has **Normal / Satellite** controls. Satellite uses Esri World Imagery; imagery capture dates vary by location and the imagery is not a live satellite feed. Your GPS marker continues updating over either map view. The map-view preference is saved on this device. Network access is required for tiles; no offline satellite tiles are downloaded.

## Satellite and external location views

Satellite view includes switchable Esri road/place labels, visible pins and route outlines. When a lower-resolution parent tile is enlarged, the map discloses that extra zoom adds no detail; **Best detail** returns to the available tile resolution. Map detail depends on the provider's coverage, not on artificial sharpening.

Pinned place details include a real satellite context preview when no approved photograph exists. Low-data mode pauses this preview. A preview is labelled as imagery, not a ground-level photograph or verified entrance.

**Google Maps**, **Google Earth** and **Apple Maps** open the selected coordinates in the provider's website/app when clicked. **Download pin for Google Earth Pro** exports a standard KML placemark (longitude, latitude order) that can be opened in Earth Pro. These are external handoffs and KML export, not embedded Google/Apple imagery. No Google or Apple API key is required for these features; direct embedded Apple MapKit would require a Maps token. Nothing is sent to these external providers until the visitor chooses a link.

Checks: `npm run typecheck`, `npm test`, `npm run build:local`, `npm run build`, and `python3 scripts/imagery-check.py` with the local companion running. The browser check covers live imagery, overzoom recovery, label controls, coordinate links, a parsed KML download, low-data mode and 320/390/1440-pixel layouts.

Google Maps links include the exact-pin search and a separate satellite-centred view. Typed coordinates (including whitespace) open a private map pin directly. Google business labels stay in Google Maps; they are not copied into the reviewed community directory. Satellite quality tracking uses the tile at the current map centre, preventing late responses from an older zoom from changing Best detail.

Search suggests up to six related places from the first letter. Select an LGA to narrow local matches. Aliases, Centre/Center variants, transposed letters and misspelled prefixes are supported. After a 750 ms pause on three or more characters, the app also asks Photon for map references using the chosen LGA as search context. This sends public search text to Photon; numeric coordinates never trigger autocomplete requests. Requests are cancelled on edit, selection or dismissal, repeated results are cached, and errors leave directory matches available. Arrow keys, Enter and Escape work. Provider coverage is incomplete and is not the Google business directory.

LEEF Centre has a sourced Learn2Earn address and the approximate coordinate supplied in the user’s Google Maps screenshot (7.179556, 8.153785). Its detail view explicitly distinguishes that visitor pin from a confirmed building entrance. Packaged source entries initialize existing databases idempotently on the first public directory read; existing moderation decisions are preserved.

## Discovery and accessibility polish

The directory puts labelled area/type filters before search, provides removable filters and a full reset, and distinguishes missing matches from empty saved places. Mobile visitors can jump directly to the map and return to results. Directory errors offer a retry and can retain previously viewed approved records; unavailable browser storage does not prevent browsing. Nearby sorting has a timeout and can be cleared.

The mobile menu supports Escape, focus containment and focus restoration, prevents background interaction while open, and closes when resized to desktop. Larger text and theme preferences persist. Review navigation is shown to moderator roles; server authorization remains authoritative. Public business phone numbers can be called from place details. Run `python3 scripts/usability-check.py` against the loopback runner for responsive layout, menu, recovery and preference checks.
