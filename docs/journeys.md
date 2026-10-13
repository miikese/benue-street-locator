# Addresses and private journeys

Reviewed directory search still filters instantly on this app. The explicit “Search wider map for this address” button looks up additional public street/address references through Photon, using OpenStreetMap data. Keystrokes are not sent to the provider. Enter a street and town; avoid private or confidential addresses. Search results are map references, not locally verified or official addresses. Some building numbers and streets may be absent.

The server fixes the Benue search bounding region, filters out known non-Benue states and non-Nigerian results, validates coordinates, caches queries for a day, and limits uncached provider calls to one per second across the app. The bounding box is not an official state-boundary polygon. `GEOCODING_URL` can select an operator's Photon-compatible endpoint. The default public demo is suitable for moderate development use only and has no availability guarantee; use an operated instance for a larger audience. Provider terms and API: https://github.com/komoot/photon.

`GET /api/geocode?q=...` returns sourced map references. Its cache requires migration `drizzle/0001_geocode_cache.sql`, applied automatically by the local runner. Apply it to the hosted D1 database when deploying this change. The source schema, SQL, journal and snapshot are committed together.

Every reviewed place, map result and private pin can be added to **My journeys** with “Plan to go” or “I've been here”. Add a date and note, rearrange planned stops, mark arrivals, filter the journal, open details/directions, export JSON, remove individual stops or clear the journal. The planner sums straight-line distances; it does not represent those as driving distances or a road route.

Journey entries are stored in this browser only, capped at 100 places. There is no account syncing or background tracking. Other people using this browser can see them. Clearing browser storage removes them; export first if a copy matters. Exported files contain private notes and coordinates, so share them deliberately.

The existing OSRM driving route controls now include “Use my location as start”. Geolocation is requested only on a button click. Estimates have no traffic or road-condition information.

Checks: type checking, lint, 27 unit/API tests, both builds, existing `scripts/e2e.py`, and `scripts/journeys-check.py` with Python Playwright. The new browser journey checks coordinate lookup, planned/visited changes, notes, reload persistence, JSON export, removal and mobile width. Wider map lookup was also checked against the real provider.
