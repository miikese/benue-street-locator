"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Route,
  Search,
  Clock,
  LocateFixed,
} from "lucide-react";
import { PlaceMap } from "./map";
import { Notice } from "./components";
import { api, type RecordItem } from "../lib/client";
import { coordinates, distance } from "../lib/domain";
import {
  worldCoordinates,
  arrivalTime,
  type LivePoint,
} from "../lib/navigation";
import type { NearestRoad } from "../lib/nearest-road";
import { journeyRecord } from "./journeys";
import type { JourneyPlace } from "../lib/journeys";
export function LiveNavigation({
  places,
  journeys,
  initialDestination,
}: {
  places: RecordItem[];
  journeys: JourneyPlace[];
  initialDestination: RecordItem | null;
}) {
  const [point, setPoint] = useState<LivePoint | null>(null),
    [tracking, setTracking] = useState(false),
    [gpsProblem, setGpsProblem] = useState(""),
    [destination, setDestination] = useState<RecordItem | null>(
      initialDestination,
    ),
    [navigating, setNavigating] = useState(false),
    [route, setRoute] = useState<any>(null),
    [routeUpdated, setRouteUpdated] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [follow, setFollow] = useState(true),
    [query, setQuery] = useState(""),
    [searching, setSearching] = useState(false),
    [matches, setMatches] = useState<RecordItem[]>([]),
    [manual, setManual] = useState("");
  const [road, setRoad] = useState<NearestRoad | null>(null),
    [roadBusy, setRoadBusy] = useState(false),
    [roadError, setRoadError] = useState("");
  const watch = useRef<number | null>(null),
    pointRef = useRef<LivePoint | null>(null);
  const stop = useCallback(() => {
    if (watch.current !== null) {
      navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    }
    setTracking(false);
    setNavigating(false);
  }, []);
  useEffect(
    () => () => {
      if (watch.current !== null)
        navigator.geolocation.clearWatch(watch.current);
    },
    [],
  );
  const start = () => {
    if (!navigator.geolocation) {
      setMessage(
        "This browser does not provide location. Enter a destination and open external directions instead.",
      );
      return;
    }
    setMessage("");
    setGpsProblem("");
    setPoint(null);
    pointRef.current = null;
    setTracking(true);
    setFollow(true);
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        try {
          worldCoordinates(p.coords.latitude, p.coords.longitude);
          const next = {
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            accuracy: p.coords.accuracy,
            timestamp: p.timestamp,
          };
          pointRef.current = next;
          setPoint(next);
          setMessage("");
          setGpsProblem("");
        } catch {
          setMessage(
            "Your device returned an invalid position. Please try again.",
          );
        }
      },
      (e) => {
        setMessage(
          e.code === 1
            ? "Location permission was declined. Enable location for this site in your browser, then try again."
            : e.code === 3
              ? "Your device timed out while finding a position. Move to a clearer area and retry."
              : "Your device cannot determine its location right now. Check that location services are enabled.",
        );
        setGpsProblem("Waiting for a fresh GPS signal");
        if (e.code === 1) stop();
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
  };
  const hasPoint = !!point;
  useEffect(() => {
    if (!tracking || !hasPoint) return;
    let disposed = false,
      pending = false;
    const controller = new AbortController();
    const refresh = async () => {
      const current = pointRef.current;
      if (pending || !current || disposed) return;
      pending = true;
      setRoadBusy(true);
      setRoad(null);
      setRoadError("");
      try {
        const response = await fetch(
          "/api/nearest-road?lat=" + current.lat + "&lng=" + current.lng,
          { signal: controller.signal },
        );
        const data = (await response.json()) as any;
        if (!response.ok)
          throw new Error(data.error || "Street lookup is unavailable.");
        if (!disposed) setRoad(data);
      } catch (e) {
        if (!disposed) setRoadError((e as Error).message);
      } finally {
        pending = false;
        if (!disposed) setRoadBusy(false);
      }
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      disposed = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [tracking, hasPoint]);
  const choose = useCallback((r: RecordItem) => {
    setDestination(r);
    setNavigating(false);
    setRoute(null);
    setMessage("");
  }, []);
  const pin = useCallback(
    (lat: number, lng: number) => {
      try {
        coordinates(lat, lng);
        choose({
          id: "live-pin:" + lat + "," + lng,
          kind: "private-pin",
          status: "private",
          created: "",
          updated: "",
          data: {
            name: "Your chosen destination",
            lat,
            lng,
            address: lat.toFixed(5) + ", " + lng.toFixed(5),
            category: "Destination",
            lga: "Benue",
          },
        });
      } catch (e) {
        setMessage((e as Error).message);
      }
    },
    [choose],
  );
  useEffect(() => {
    if (!navigating || !destination) return;
    let cancelled = false,
      pending = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (pending || !pointRef.current) return;
      pending = true;
      setBusy(true);
      const from = pointRef.current;
      try {
        const response = await fetch(
          "/api/directions?from=" +
            from.lat +
            "," +
            from.lng +
            "&to=" +
            destination.data.lat +
            "," +
            destination.data.lng,
          { signal: controller.signal },
        );
        const d: any = await response.json();
        if (!response.ok)
          throw new Error(d.error || "Driving directions are unavailable.");
        if (
          !Number.isFinite(d.duration) ||
          !Number.isFinite(d.distance) ||
          d.distance < 0 ||
          d.duration < 0 ||
          !Array.isArray(d.geometry?.coordinates)
        )
          throw new Error("The routing provider returned an invalid estimate.");
        if (!cancelled) {
          setRoute(d);
          setRouteUpdated(Date.now());
          setMessage("");
        }
      } catch (e) {
        if (!cancelled) {
          setRoute(null);
          setMessage(
            (e as Error).message +
              " You can still see your live position or use Open external directions.",
          );
        }
      } finally {
        pending = false;
        if (!cancelled) setBusy(false);
      }
    };
    void refresh();
    const timer = setInterval(refresh, 45000);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(timer);
      setBusy(false);
    };
  }, [navigating, destination]);
  const all = [
    ...places,
    ...journeys.filter((j) => j.status === "planned").map(journeyRecord),
    ...matches,
    ...(destination ? [destination] : []),
  ].filter(
    (r, i, rows) =>
      rows.findIndex((p) => p.id === r.id) === i &&
      typeof r.data.lat === "number" &&
      typeof r.data.lng === "number",
  );
  return (
    <section className="section live-navigation">
      <p className="eyebrow">Your position. Your next destination.</p>
      <div className="heading-row">
        <div>
          <h1>
            Know where you are.
            <br />
            <em>See the way ahead.</em>
          </h1>
          <p className="muted">
            Live device location and real driving estimates, together on one
            map.
          </p>
        </div>
        <span
          className={
            "live-status " + (tracking && point && !gpsProblem ? "active" : "")
          }
        >
          <i />
          {tracking
            ? gpsProblem
              ? "Waiting for GPS signal"
              : point
                ? "Live location on"
                : "Waiting for GPS…"
            : "Location paused"}
        </span>
      </div>
      <div className="live-navigation-layout">
        <aside className="live-navigation-controls">
          <section className="card">
            <div className="navigation-card-title">
              <LocateFixed size={20} />
              <h2>Your current location.</h2>
            </div>
            <p className="muted">
              Turn on high-accuracy location to follow your position and
              identify the nearest mapped street. This shares your coordinates
              with the street provider; your browser will ask for location
              permission.
            </p>
            <div className="button-row">
              {tracking ? (
                <button className="button secondary" onClick={stop}>
                  Stop live location
                </button>
              ) : (
                <button className="button" onClick={start}>
                  <Navigation size={15} />
                  Start live location
                </button>
              )}
            </div>
            {point && (
              <div className="live-coordinate">
                <strong>
                  {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                </strong>
                <small>
                  Accuracy approximately {Math.round(point.accuracy)} m ·
                  position from {new Date(point.timestamp).toLocaleTimeString()}
                </small>
                {point.accuracy > 100 && (
                  <small>
                    GPS accuracy is low. Confirm the road and destination on the
                    map.
                  </small>
                )}
                <div className="nearest-street" aria-live="polite">
                  <small>Nearest mapped street</small>
                  {roadBusy ? (
                    <p>Finding the nearest street…</p>
                  ) : road ? (
                    <>
                      <strong>{road.name}</strong>
                      <p>
                        {Math.round(distance(point, road) * 1000)} m from your
                        reported position · straight-line distance
                      </p>
                      <small>
                        {road.named
                          ? "Mapped road name"
                          : "This road has no recorded name"}
                        . Based on the driving-road network; GPS accuracy may
                        place you on a different nearby street.
                      </small>
                      <small>
                        Street lookup at{" "}
                        {new Date(road.checkedAt).toLocaleTimeString()}
                      </small>
                    </>
                  ) : (
                    <p>
                      {roadError ||
                        "Start live location to look up the nearest street."}
                    </p>
                  )}
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(point.lat + ", " + point.lng)
                      .then(() => setMessage("GPS coordinates copied."))
                      .catch(() =>
                        setMessage(
                          "Select the coordinates above to copy them.",
                        ),
                      )
                  }
                >
                  Copy my coordinates
                </button>
                <label className="live-follow">
                  <input
                    type="checkbox"
                    checked={follow}
                    onChange={(e) => setFollow(e.target.checked)}
                  />
                  Keep the map centred on me
                </label>
              </div>
            )}
          </section>
          <section className="card">
            <div className="navigation-card-title">
              <MapPin size={20} />
              <h2>Where are you going?</h2>
            </div>
            <label className="field">
              Choose a place or planned stop
              <select
                value={destination?.id || ""}
                onChange={(e) => {
                  const r = all.find((p) => p.id === e.target.value);
                  if (r) choose(r);
                }}
              >
                <option value="">Select a destination</option>
                {all.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.data.name}
                  </option>
                ))}
              </select>
            </label>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSearching(true);
                setMessage("");
                try {
                  const d = await api("geocode?q=" + encodeURIComponent(query));
                  setMatches(d.results);
                  if (!d.results.length)
                    setMessage(
                      "No mapped destination found. Try a street and town, or choose a pin on the map.",
                    );
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setSearching(false);
                }
              }}
            >
              <label className="field">
                Search a public address
                <input
                  minLength={3}
                  maxLength={180}
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="A street, place or town in Benue…"
                />
              </label>
              <button className="button small secondary" disabled={searching}>
                <Search size={14} />
                {searching ? "Searching…" : "Find destination"}
              </button>
              <small className="navigation-privacy">
                This address search sends the entered text to Photon. Use public
                addresses only.
              </small>
            </form>
            {matches.length > 0 && (
              <div className="live-destination-results">
                {matches.map((r) => (
                  <button key={r.id} onClick={() => choose(r)}>
                    <strong>{r.data.name}</strong>
                    <small>{r.data.address}</small>
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const c = manual.split(",").map(Number);
                if (c.length !== 2 || c.some((v) => !Number.isFinite(v))) {
                  setMessage("Enter destination latitude, longitude.");
                  return;
                }
                pin(c[0], c[1]);
              }}
            >
              <label className="field">
                Or enter destination coordinates
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  required
                  placeholder="7.192, 8.132"
                />
              </label>
              <button className="text-button">
                Use destination coordinates
              </button>
            </form>
            <small className="navigation-privacy">
              You can also choose a destination by clicking the map.
            </small>
          </section>
          {destination && (
            <section className="card live-route-card">
              <p className="eyebrow">YOUR DESTINATION</p>
              <h2>{destination.data.name}</h2>
              <p className="muted">
                {destination.data.address ||
                  destination.data.lat + ", " + destination.data.lng}
              </p>
              <div className="button-row">
                <button
                  className="button"
                  disabled={!tracking || !point || busy || navigating}
                  onClick={() => setNavigating(true)}
                >
                  <Route size={14} />
                  {busy
                    ? "Finding route…"
                    : navigating
                      ? "Navigation running"
                      : "Start driving navigation"}
                </button>
                {navigating && (
                  <button
                    className="text-button"
                    onClick={() => setNavigating(false)}
                  >
                    Stop navigation
                  </button>
                )}
              </div>
              {route && (
                <div className="live-route-estimate" role="status">
                  <div>
                    <Clock size={20} />
                    <strong>
                      {Math.max(0, Math.ceil(route.duration / 60))} min
                    </strong>
                    <span>estimated driving time</span>
                  </div>
                  <div>
                    <Route size={20} />
                    <strong>{(route.distance / 1000).toFixed(1)} km</strong>
                    <span>road distance remaining</span>
                  </div>
                  <p>
                    Estimated arrival:{" "}
                    <strong>
                      {arrivalTime(
                        route.duration,
                        routeUpdated,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </p>
                  <small>
                    Estimate updated at{" "}
                    {new Date(routeUpdated).toLocaleTimeString()}. Recalculated
                    every 45 seconds while navigation is running. No live
                    traffic or road-condition information.
                  </small>
                </div>
              )}
              <a
                className="button small secondary"
                href={
                  "https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=" +
                  encodeURIComponent(
                    (point ? point.lat + "," + point.lng : "") +
                      ";" +
                      destination.data.lat +
                      "," +
                      destination.data.lng,
                  )
                }
                target="_blank"
                rel="noreferrer"
              >
                Open external directions ↗
              </a>
            </section>
          )}
          {message && <Notice>{message}</Notice>}
        </aside>
        <div className="live-navigation-map">
          <PlaceMap
            rows={all}
            onSelect={choose}
            selected={destination}
            route={route?.geometry?.coordinates}
            onPin={pin}
            livePoint={point}
            nearestRoad={tracking ? road : null}
            liveTracking={tracking}
            followLocation={tracking && follow}
          />
          <div className="navigation-privacy-note">
            <ShieldNote />
          </div>
        </div>
      </div>
      {route?.steps?.length > 0 && (
        <section className="card live-instructions">
          <h2>Driving route steps.</h2>
          <ol>
            {route.steps.map((s: any, i: number) => (
              <li key={i}>
                {String(s.maneuver?.type || "Continue").replaceAll("-", " ")}{" "}
                {s.maneuver?.modifier || ""} {s.name ? "onto " + s.name : ""} ·{" "}
                {Math.round(s.distance)} m
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
function ShieldNote() {
  return (
    <p>
      Live location runs only while this screen is open and enabled. It is not
      saved to your account or journey journal. Starting driving navigation
      sends your current coordinates and destination to the routing provider.
    </p>
  );
}
