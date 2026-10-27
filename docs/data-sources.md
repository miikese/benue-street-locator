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
  autocomplete. The app does not use Nominatim for autocomplete; local matching uses the packaged public directory and live matching uses Photon.
- https://project-osrm.org/docs/v5.24.0/api/ — real driving routes with geometry,
  steps, distance and estimates; unavailable routing displays a useful fallback.
- https://fixmystreet.org/how-it-works/ — review histories and followable records.

Satellite context uses the existing Esri World Imagery service with transparent World Boundaries and Places / World Transportation labels. Image dates and resolution vary by location; imagery is not live. Zooming beyond the tile resolution enlarges existing pixels. No AI-generated location imagery, Google/Apple tile scraping, bulk tile downloads or map-image service-worker caching are added.

- Esri imagery and metadata: https://www.arcgis.com/home/item.html?id=c03a526d94704bfb839445e80de95495
- Apple coordinate links: https://developer.apple.com/documentation/mapkit/unified-map-urls
- Apple embedded map authorization: https://developer.apple.com/documentation/mapkitjs/creating-a-maps-token
- Google Earth coordinate search: https://support.google.com/earth/answer/148068
- KML placemark format and coordinate order: https://developers.google.com/kml/documentation/kmlreference

- Google Maps exact-coordinate search and satellite view links (no API key): https://developers.google.com/maps/documentation/urls/get-started
- An embedded Google map, if added separately, requires an authorized API key: https://developers.google.com/maps/documentation/embed/embedding-map

## Place suggestions and LEEF Centre

- Photon API supports search-as-you-type, typo tolerance and geographic bias: https://github.com/komoot/photon/blob/master/docs/api-v1.md
- Demo provider usage must remain reasonable: https://github.com/komoot/photon#demo-server . The client waits 750 ms and three characters before lookups, cancels stale requests, and caches results. The server retains its shared request limit and one-day query cache, keyed separately by LGA.
- First-letter local suggestions use public directory names and aliases; they do not expose pending/private submissions.
- Learn2Earn's own venue announcement supplies the LEEF address: https://www.linkedin.com/posts/learn2earnng_learn2earn-otukpo-benuestate-activity-7452789888120344577-tq8u
- The LEEF visitor coordinate is user-supplied from the Google Maps screenshot, not independently surveyed, scraped from Google, or inferred from the address. It is labelled approximate in the directory.
- OpenStreetMap/Photon may lack businesses Google lists. The app provides a town-qualified Google Maps search link for additional coverage; no Google Places API key is configured.

The Otukpo town search uses an approximate town bounding box (8.02,7.10–8.30,7.35 longitude/latitude); this is not a surveyed LGA border. Other LGA names are passed as textual provider context inside the wider Benue search box.

## Benue expansion — 27 October 2026

The directory adds 34 populated-place references selected from the GeoNames Nigeria gazetteer, with at least one reference for each of the 23 Benue LGA filters. Imported features use country NG, administrative state 26 (Benue), populated-place feature codes, matching administrative-level-2 metadata, and the application coordinate bounds. The selection favours administrative seats, larger settlements and a short list of recognisable regional towns. It does not include private residences or infer building entrances.

Source files and schema (retrieved on 27 October 2026):
- https://download.geonames.org/export/dump/NG.zip
- https://download.geonames.org/export/dump/admin1CodesASCII.txt
- https://download.geonames.org/export/dump/admin2Codes.txt
- https://download.geonames.org/export/dump/readme.txt

Attribution: GeoNames.org and contributors, licensed CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . This is a selected/normalized derivative, not an official address register or surveyed LGA boundary dataset. Each record retains its GeoNames URL, retrieval date and source modification date. Upstream admin spellings Bukuru, Markurdi and Oturkpo are normalized to Buruku, Makurdi and Otukpo in the app's existing LGA registry. Duplicate upstream Makurdi/Buruku administrative codes map to the same displayed LGA. Geographic accuracy and currency are not guaranteed by the source.

Three additional public OSM references retrieved through Photon are the Benue State University Teaching Hospital, Nigeria Security and Civil Defence Corps Benue State Command, and DHL Office Makurdi. Each keeps its OSM object URL and mapped point; these are not locally verified entrances. OSM attribution/ODbL applies independently of GeoNames licensing.

Institution-published address sources (no coordinates invented):
- Joseph Sarwuan Tarka University: https://uam.edu.ng/contact-us/
- Rev. Fr. Moses Orshio Adasu University (Benue State University aliases retained): https://bsum.edu.ng/w3/contacts.php
- College of Education Katsina-Ala: https://portal.coekatsinaala.edu.ng/login.jsp

The app does not display placeholder phone numbers from the college portal. No operating hours, current admissions, services or access promises are inferred.

## Otukpo street names — 27 October 2026

Twenty-one additional unpinned street-name records and one OSM road-segment point expand Otukpo to 23 street/road entries, including the original Orokam Street. Only street names are included from address references; house numbers, occupants, polling-unit information and voter statistics are not imported.

Sixteen names were read from the public 6 January 2019 Benue directory hosted by Nigeria Civil Society Situation Room, PDF pages 141–145: https://situationroomng.org/wp-content/uploads/2019/11/BENUE.pdf . The PDF was downloaded and these pages were visually checked; they include Central, East and West town sections. These are historical name references, not current street surveys. Each record retains the publication date and page link and has null coordinates. Compound junction names were excluded to avoid inventing separate streets.

Five street names are corroborated by public organization addresses: Ogiri Oko Street (https://www.echijaculturalfestival.com/contact?option=media), Ahmadu Bello Way (https://jedplc.com/ccrm_offices.php), Old Makurdi Road (the Learn2Earn venue announcement linked above), and Burnt Bricks Road / New Otobo Road (https://crownjewelhmo.com/providers/). No building coordinates are inferred from these addresses.

Otukpo–Weto Road uses https://www.openstreetmap.org/way/294440965 from the bounded OSM map snapshot. Its point (7.2112188, 8.1201182) is an actual mapped road node within Otukpo, not the road midpoint, entire route or a building entrance. The source's Oturkpo spelling remains a search alias. OSM/ODbL attribution applies. No road geometry or current passability is invented.
