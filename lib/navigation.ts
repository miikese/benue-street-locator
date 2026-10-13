export type LivePoint = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};
export function worldCoordinates(lat: unknown, lng: unknown) {
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  )
    throw new Error("Enter valid latitude and longitude coordinates.");
  return { lat, lng };
}
export function arrivalTime(duration: number, updated: number) {
  if (!Number.isFinite(duration) || duration < 0)
    throw new Error("Invalid route estimate.");
  return new Date(updated + duration * 1000);
}
