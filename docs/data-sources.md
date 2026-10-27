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

Satellite context uses the existing Esri World Imagery service with transparent World Boundaries and Places / World Transportation labels. Image dates and resolution vary by location; imagery is not live. Zooming beyond the tile resolution enlarges existing pixels. No AI-generated location imagery, Google/Apple tile scraping, bulk tile downloads or map-image service-worker caching are added.

- Esri imagery and metadata: https://www.arcgis.com/home/item.html?id=c03a526d94704bfb839445e80de95495
- Apple coordinate links: https://developer.apple.com/documentation/mapkit/unified-map-urls
- Apple embedded map authorization: https://developer.apple.com/documentation/mapkitjs/creating-a-maps-token
- Google Earth coordinate search: https://support.google.com/earth/answer/148068
- KML placemark format and coordinate order: https://developers.google.com/kml/documentation/kmlreference
