import type { DB } from "./service";
import { worldCoordinates } from "./navigation";
export type NearestRoad = {
  name: string;
  named: boolean;
  distance: number;
  lat: number;
  lng: number;
  checkedAt: string;
  source: string;
};
function fail(message: string, status: number): never {
  throw Object.assign(new Error(message), { status });
}
export async function nearestRoad(
  lat: unknown,
  lng: unknown,
  db: DB,
  endpoint = "https://router.project-osrm.org",
  fetcher: typeof fetch = fetch,
): Promise<NearestRoad> {
  const point = worldCoordinates(lat, lng),
    minute = Math.floor(Date.now() / 60000),
    key = "nearest-road:" + minute;
  const limit = await db
    .prepare(
      "INSERT INTO limits(id,count) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count",
    )
    .bind(key)
    .first();
  if (limit.count > 20)
    fail("Street lookup is busy. Try again in a minute.", 429);
  const url = new URL(
    endpoint.replace(/\/$/, "") +
      "/nearest/v1/driving/" +
      point.lng +
      "," +
      point.lat,
  );
  url.searchParams.set("number", "1");
  url.searchParams.set("radiuses", "2000");
  let response: Response;
  try {
    response = await fetcher(url, { signal: AbortSignal.timeout(12000) });
  } catch {
    fail(
      "Nearest-street lookup is unavailable. Your GPS position remains visible.",
      503,
    );
  }
  let data: any;
  try {
    data = await response.json();
  } catch {
    fail("The street provider returned an unreadable response.", 503);
  }
  if (data.code === "NoSegment")
    fail("No mapped driving road was found within 2 km of this position.", 404);
  const road = data.waypoints?.[0];
  if (
    !response.ok ||
    data.code !== "Ok" ||
    !road ||
    !Array.isArray(road.location) ||
    road.location.length !== 2 ||
    !Number.isFinite(road.distance) ||
    road.distance < 0 ||
    road.distance > 2000
  )
    fail("The street provider could not identify a nearby road.", 503);
  const mapped = worldCoordinates(road.location[1], road.location[0]);
  const name =
    typeof road.name === "string" ? road.name.trim().slice(0, 200) : "";
  await db
    .prepare("DELETE FROM limits WHERE id LIKE 'nearest-road:%' AND id<>?")
    .bind(key)
    .run();
  return {
    name: name || "Unnamed mapped road",
    named: !!name,
    distance: road.distance,
    ...mapped,
    checkedAt: new Date().toISOString(),
    source: "OpenStreetMap / OSRM driving network",
  };
}
