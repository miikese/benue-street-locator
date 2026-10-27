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
  expect(new Date(first.checkedAt).getTime()).toBeGreaterThan(0);
  expect(new URL(String(f.mock.calls[0][0])).searchParams.get("limit")).toBe("20");
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

it("accepts Benue State metadata and excludes neighbouring states",async()=>{const a=feature(),b=feature();a.properties.state="Benue State";b.properties.state="Kogi";const result=await geocode("Public landmark",db,undefined,async()=>Response.json({features:[a,b]}));expect(result.results).toHaveLength(1);});

it("uses town context and a distinct cached query for each LGA",async()=>{
 const f=vi.fn(async (_url:any)=>Response.json({features:[feature()]}));
 await geocode("school",db,undefined,f,"Otukpo");
 const params=new URL(String(f.mock.calls[0][0])).searchParams;
 expect(params.get("bbox")).toBe("8.02,7.1,8.3,7.35");expect(params.get("q")).toBe("school Otukpo");expect(params.get("countrycode")).toBe("NG");expect(params.get("lat")).toBe("7.192");
 await geocode("school",db,undefined,f,"Otukpo");expect(f).toHaveBeenCalledTimes(1);
 await expect(geocode("school",db,undefined,f,"Unknown")).rejects.toThrow("valid Benue LGA");
});
