import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { database } from "./database";
import { geocode } from "../lib/geocoding";
let db: ReturnType<typeof database>;
beforeEach(() => {
  db = database();
});
afterEach(() => db.close());
const feature = (lat = 7.19, lng = 8.13) => ({
  geometry: { coordinates: [lng, lat] },
  properties: {
    name: "Otukpo",
    city: "Otukpo",
    state: "Benue",
    countrycode: "NG",
    osm_type: "N",
    osm_id: 12,
  },
});
it("bounds address lookup and caches repeated queries", async () => {
  const f = vi.fn(async (_url: any) =>
    Response.json({ features: [feature(), feature(0, 0)] }),
  );
  const first = await geocode("Otukpo", db, undefined, f);
  expect(first.results).toHaveLength(1);
  expect(first.results[0].data.sourceUrl).toContain("/node/12");
  expect(new URL(String(f.mock.calls[0][0])).searchParams.get("bbox")).toBe(
    "7.2,6.3,10.1,8.6",
  );
  await geocode("otukpo", db, undefined, f);
  expect(f).toHaveBeenCalledTimes(1);
});
it("validates address input before contacting a provider", async () => {
  const f = vi.fn();
  await expect(geocode("ab", db, undefined, f)).rejects.toThrow("between 3");
  expect(f).not.toHaveBeenCalled();
});
it("turns provider failures into an actionable error", async () => {
  await expect(
    geocode(
      "Otukpo",
      db,
      undefined,
      async () => new Response(null, { status: 503 }),
    ),
  ).rejects.toThrow("unavailable");
});
it("limits concurrent uncached searches across the app", async () => {
  const f = vi.fn(async (_url: any) => Response.json({ features: [] }));
  const outcomes = await Promise.allSettled([
    geocode("One place", db, undefined, f),
    geocode("Another place", db, undefined, f),
  ]);
  expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(f).toHaveBeenCalledTimes(1);
});
