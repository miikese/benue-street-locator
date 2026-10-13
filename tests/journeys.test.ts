import { it, expect } from "vitest";
import { addJourney, readJourneys } from "../lib/journeys";
const place = {
  id: "test-pin",
  data: { name: "Public stop", lat: 7.19, lng: 8.13, address: "Otukpo" },
};
it("preserves creation when moving a planned place into visited", () => {
  const a = addJourney(
    [],
    place,
    "planned",
    "2026-10-20",
    "A note",
    "2026-10-13T10:00:00Z",
  );
  const b = addJourney(
    a,
    place,
    "visited",
    "2026-10-21",
    "Updated note",
    "2026-10-21T10:00:00Z",
  );
  expect(b).toHaveLength(1);
  expect(b[0]).toMatchObject({
    created: a[0].created,
    status: "visited",
    note: "Updated note",
    date: "2026-10-21",
  });
});
it("recovers from corrupt storage and drops invalid or duplicate coordinates", () => {
  expect(readJourneys("oops")).toEqual([]);
  expect(readJourneys("{}")).toEqual([]);
  const a = addJourney([], place, "planned");
  expect(
    readJourneys(
      JSON.stringify([...a, ...a, { ...a[0], id: "invalid", lat: 0 }]),
    ),
  ).toHaveLength(1);
});
it("rejects places outside the region and enforces journal capacity", () => {
  expect(() =>
    addJourney([], { ...place, data: { ...place.data, lat: 0 } }, "planned"),
  ).toThrow();
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...addJourney([], place, "planned")[0],
    id: String(i),
  }));
  expect(() => addJourney(full, place, "planned")).toThrow("100 places");
  expect(addJourney(full, { ...place, id: "0" }, "visited")).toHaveLength(100);
});
