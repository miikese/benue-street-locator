import { coordinates } from "./domain";
export type JourneyPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: "planned" | "visited";
  created: string;
  updated: string;
  date: string;
  note: string;
};
export const JOURNEY_KEY = "benue-journeys-v1";
export function readJourneys(raw: string | null): JourneyPlace[] {
  try {
    const rows = JSON.parse(raw || "[]");
    if (!Array.isArray(rows)) return [];
    const seen = new Set<string>();
    return rows
      .filter((r) => {
        try {
          coordinates(r.lat, r.lng);
          if (
            typeof r.id !== "string" ||
            seen.has(r.id) ||
            typeof r.name !== "string" ||
            !["planned", "visited"].includes(r.status)
          )
            return false;
          seen.add(r.id);
          return true;
        } catch {
          return false;
        }
      })
      .slice(0, 100)
      .map((r) => ({
        ...r,
        name: r.name.slice(0, 160),
        address: String(r.address || "").slice(0, 250),
        date: String(r.date || "").slice(0, 10),
        note: String(r.note || "").slice(0, 400),
      }));
  } catch {
    return [];
  }
}
export function addJourney(
  rows: JourneyPlace[],
  place: { id: string; data: Record<string, any> },
  status: JourneyPlace["status"],
  date = "",
  note = "",
  now = new Date().toISOString(),
): JourneyPlace[] {
  coordinates(place.data.lat, place.data.lng);
  const existing = rows.find((r) => r.id === place.id);
  if (!existing && rows.length >= 100)
    throw new Error(
      "Your journal has 100 places. Export or remove a place before adding more.",
    );
  const entry: JourneyPlace = {
    id: place.id,
    name: place.data.name || "Map pin",
    address: place.data.address || "",
    lat: place.data.lat,
    lng: place.data.lng,
    status,
    created: existing?.created || now,
    updated: now,
    date:
      date ||
      (status === "visited"
        ? new Intl.DateTimeFormat("en-CA").format(new Date())
        : ""),
    note: note.slice(0, 400),
  };
  return [entry, ...rows.filter((r) => r.id !== place.id)];
}
