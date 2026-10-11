The initial local directory has two map references: Otukpo administrative-area
reference point (OSM relation 3716096, which currently uses the spelling Oturkpo)
and the mapped centre of Orokam Street (OSM way 343560014).
Retrieved 11 October 2026 through one Nominatim lookup and one bounded OSM map
API request. The raw public record snapshot is lib/osm-seed.json.
These are map references, not locally verified businesses or official addresses.
OpenStreetMap contributors own the map data under ODbL 1.0:
https://www.openstreetmap.org/copyright
No private house data was imported. Street centre points are not street entrances.
The seed command only inserts missing source IDs and never overwrites contributions.
The 23 LGA names form a filter registry; polygon boundaries are not implemented.

Research:
- https://operations.osmfoundation.org/policies/tiles/ — ordinary interactive
  tiles with attribution, normal browser caching, no downloads/prefetch.
- https://operations.osmfoundation.org/policies/nominatim/ — no third-party
  autocomplete. Autocomplete/filtering is restricted to our own public directory.
- https://project-osrm.org/docs/v5.24.0/api/ — real driving routes with geometry,
  steps, distance and estimates; unavailable routing displays a useful fallback.
- https://fixmystreet.org/how-it-works/ — review histories and followable records.
