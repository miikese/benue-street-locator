import type { DB } from "./service";
import { coordinates,LGAS } from "./domain";
export async function geocode(
  query: string,
  db: DB,
  endpoint = "https://photon.komoot.io/api/",
  fetcher: typeof fetch = fetch,
  lga = "",
) {
  const q = query.trim();
  if(lga&&!LGAS.includes(lga))throw new Error("Choose a valid Benue LGA.");
  const cacheKey="v4:"+lga.toLowerCase()+":"+q.toLowerCase();
  if (q.length < 3 || q.length > 180)
    throw new Error(
      "Enter a public address or place name between 3 and 180 characters.",
    );
  const cached = await db
    .prepare("SELECT data FROM geocode_cache WHERE query=? AND expires>?")
    .bind(cacheKey, Date.now())
    .first();
  if (cached) return JSON.parse(cached.data);
  const key = "geocode:" + Math.floor(Date.now() / 1000),
    limit = await db
      .prepare(
        "INSERT INTO limits(id,count) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count",
      )
      .bind(key)
      .first();
  if ((limit?.count || 0) > 1)
    throw Object.assign(
      new Error("Please wait a moment before another address search."),
      { status: 429 },
    );
  const url = new URL(endpoint);
  url.searchParams.set("q", lga&&!q.toLowerCase().includes(lga.toLowerCase())?q+" "+lga:q);
  url.searchParams.set("countrycode","NG");
  if(lga==="Otukpo"){url.searchParams.set("lat","7.192");url.searchParams.set("lon","8.132");url.searchParams.set("zoom","12");}
  url.searchParams.set("bbox", lga==="Otukpo"?"8.02,7.1,8.3,7.35":"7.2,6.3,10.1,8.6");
  url.searchParams.set("limit", "20");
  url.searchParams.set("lang", "en");
  let response: Response;
  try {
    response = await fetcher(url, {
      headers: {
        "User-Agent":
          "BenueStreetLocator/1.0 (https://github.com/miikese/benue-street-locator)",
      },
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw Object.assign(
      new Error(
        "Address search is unavailable. You can still search reviewed places or use a coordinate pin.",
      ),
      { status: 503 },
    );
  }
  if (!response.ok)
    throw Object.assign(
      new Error("Address search is temporarily unavailable."),
      { status: 503 },
    );
  const data = (await response.json()) as any;
  if (!Array.isArray(data.features))
    throw new Error("The address provider returned an invalid response.");
  const results = data.features.flatMap((feature: any) => {
    try {
      const [lng, lat] = feature.geometry.coordinates;
      coordinates(lat, lng);
      const p = feature.properties;
      if (p.countrycode && p.countrycode.toLowerCase() !== "ng") return [];
      if (p.state && !/^benue(?: state)?$/i.test(p.state.trim())) return [];
      const address = [p.housenumber, p.street, p.district, p.city, p.state]
          .filter(Boolean)
          .join(", "),
        name = p.name || p.street || p.city || "Mapped location";
      return [
        {
          id: "map:" + p.osm_type + ":" + p.osm_id,
          kind: "map-result",
          status: "map-reference",
          created: "",
          updated: "",
          data: {
            name,
            lat,
            lng,
            address,
            town: p.city || p.district || "Benue",
            lga: p.county || p.city || "Benue",
            category: ({hospital:"Hospital",clinic:"Clinic",pharmacy:"Pharmacy",school:"School",university:"School",college:"School",marketplace:"Market",hotel:"Hotel",restaurant:"Restaurant",police:"Police",bus_station:"Transport",station:"Transport"} as Record<string,string>)[p.osm_value] || (p.osm_key==="highway"?"Street":p.osm_key==="shop"?"Shop":"Map result"),
            description:
              "An OpenStreetMap address reference. Building numbers and local conditions may be incomplete. Confirm the destination before travelling.",
            source: "OpenStreetMap",
            sourceUrl:
              "https://www.openstreetmap.org/" +
              ({ N: "node", W: "way", R: "relation" }[
                p.osm_type as "N" | "W" | "R"
              ] || "node") +
              "/" +
              p.osm_id,
          },
        },
      ];
    } catch {
      return [];
    }
  });
  const result = {
    results,
    checkedAt: new Date().toISOString(),
    attribution: "© OpenStreetMap contributors · Photon",
  };
  await db
    .prepare(
      "INSERT INTO geocode_cache(query,data,expires) VALUES(?,?,?) ON CONFLICT(query) DO UPDATE SET data=excluded.data,expires=excluded.expires",
    )
    .bind(
      cacheKey,
      JSON.stringify(result),
      Date.now() + 86400000,
    )
    .run();
  await db
    .prepare("DELETE FROM geocode_cache WHERE expires<?")
    .bind(Date.now())
    .run();
  await db
    .prepare("DELETE FROM limits WHERE id LIKE 'geocode:%' AND id<>?")
    .bind(key)
    .run();
  return result;
}
