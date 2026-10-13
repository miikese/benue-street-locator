import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { database } from "./database";
import { nearestRoad } from "../lib/nearest-road";
let db: ReturnType<typeof database>;
beforeEach(() => (db = database()));
afterEach(() => db.close());
const answer = (name = "QA street", distance = 12) =>
  Response.json({
    code: "Ok",
    waypoints: [{ name, distance, location: [8.1321, 7.1921] }],
  });
it("looks up the nearest road without storing raw GPS coordinates", async () => {
  const f = vi.fn(async (_url: any) => answer());
  const road = await nearestRoad(7.192, 8.132, db, undefined, f);
  expect(road).toMatchObject({ name: "QA street", distance: 12, named: true });
  expect(String(f.mock.calls[0][0])).toContain(
    "/nearest/v1/driving/8.132,7.192",
  );
  expect(
    (await db.prepare("SELECT id FROM limits").all()).results[0].id,
  ).not.toContain("7.192");
});
it("labels unnamed roads and refuses fabricated or far-away road matches", async () => {
  expect(
    (await nearestRoad(7.192, 8.132, db, undefined, async () => answer("")))
      .named,
  ).toBe(false);
  await expect(
    nearestRoad(7.192, 8.132, db, undefined, async () => answer("Far", 2500)),
  ).rejects.toThrow("could not identify");
  await expect(
    nearestRoad(7.192, 8.132, db, undefined, async () =>
      Response.json({ code: "NoSegment" }),
    ),
  ).rejects.toThrow("within 2 km");
});
it("validates coordinates before calling the provider", async () => {
  const f = vi.fn();
  await expect(nearestRoad(NaN, 8.132, db, undefined, f)).rejects.toThrow(
    "valid latitude",
  );
  expect(f).not.toHaveBeenCalled();
});
it("handles provider outages and applies the shared request cap", async () => {
  await expect(
    nearestRoad(7.192, 8.132, db, undefined, async () => {
      throw new Error("offline");
    }),
  ).rejects.toThrow("unavailable");
  for (let i = 0; i < 19; i++)
    await nearestRoad(7.192, 8.132, db, undefined, async () => answer());
  await expect(
    nearestRoad(7.192, 8.132, db, undefined, async () => answer()),
  ).rejects.toThrow("busy");
});
