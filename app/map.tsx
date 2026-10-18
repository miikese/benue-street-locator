"use client";
import { useEffect, useRef, useState } from "react";
import {LocateFixed, Maximize2, Minimize2, Copy, RefreshCw, Navigation, MapPin, Layers, Satellite, X} from "lucide-react";
import {MAP_MAX_ZOOM, locationError} from "../lib/map-tiles";
import {satelliteLayer} from "./satellite-layer";
import type { LivePoint } from "../lib/navigation";
import type { NearestRoad } from "../lib/nearest-road";
import type { RecordItem } from "../lib/client";
export function PlaceMap({
  rows,
  onSelect,
  selected,
  route,
  disabled = false,
  onPin,
  livePoint,
  followLocation = false,
  nearestRoad,
  liveTracking=false,
  onLocation,
}: {
  rows: RecordItem[];
  onSelect: (r: RecordItem) => void;
  selected?: RecordItem | null;
  route?: number[][];
  disabled?: boolean;
  onPin?: (lat: number, lng: number) => void;
  livePoint?: LivePoint | null;
  followLocation?: boolean;
  nearestRoad?: NearestRoad | null;
  liveTracking?:boolean;
  onLocation?: (point: LivePoint) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<any>(null),
    layers = useRef<any>(null),
    routing = useRef<any>(null),
    positionLayer = useRef<any>(null),
    baseLayer = useRef<any>(null),
    streetLayer = useRef<any>(null),
    firstLocation = useRef(true),
    [view, setView] = useState<"normal" | "satellite">("normal"),
    [standalonePoint, setStandalonePoint] = useState<LivePoint | null>(null),
    [error, setError] = useState(""),
    [tileError, setTileError] = useState(""),
    [locating, setLocating] = useState(false),
    [watching, setWatching] = useState(false),
    [expanded, setExpanded] = useState(false),
    [zoom, setZoom] = useState(13),
    [notice, setNotice] = useState(""),
    requestId = useRef(0),
    locationCallback = useRef(onLocation),
    expandButton = useRef<HTMLButtonElement>(null),
    [ready, setReady] = useState(false),
    [tiles, setTiles] = useState(false);
  const position = livePoint || standalonePoint;
  locationCallback.current = onLocation;
  useEffect(() => () => {requestId.current++;}, []);
  useEffect(() => {
    if (!expanded) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (e: KeyboardEvent) => {if (e.key === "Escape") {setExpanded(false); expandButton.current?.focus();}};
    document.addEventListener("keydown", escape);
    return () => {document.body.style.overflow = old; document.removeEventListener("keydown", escape);};
  }, [expanded]);
  useEffect(() => {
    if (!ready || !container.current) return;
    const observer = new ResizeObserver(() => map.current?.invalidateSize({pan: false}));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [ready]);
  useEffect(() => {
    if (!watching || disabled || !navigator.geolocation) return;
    let watch: number | undefined;
    const stop = () => {if (watch !== undefined) navigator.geolocation.clearWatch(watch); watch = undefined;};
    const resume = () => {
      stop();
      if (!document.hidden) watch = navigator.geolocation.watchPosition(p => {
        const point = {lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, timestamp: p.timestamp};
        setStandalonePoint(point); locationCallback.current?.(point); setError("");
        map.current?.panTo([point.lat, point.lng], {animate: false});
      }, e => {setError(locationError(e.code)); if (e.code === 1) setWatching(false);}, {enableHighAccuracy: true, timeout: 20000, maximumAge: 5000});
    };
    resume(); document.addEventListener("visibilitychange", resume);
    return () => {stop(); document.removeEventListener("visibilitychange", resume);};
  }, [watching, disabled]);
  useEffect(() => {
    let cancelled = false;
    if (disabled) return;
    import("leaflet")
      .then((L) => {
        if (cancelled || !container.current) return;
        const m = L.map(container.current, {
          zoomControl: false,
          center: [7.192, 8.132],
          zoom: 13,
          minZoom: 2,
          maxZoom: MAP_MAX_ZOOM,
          worldCopyJump: true,
        });
        map.current = m;
        L.control.zoom({ position: "bottomright" }).addTo(m);
        L.control.scale({position: "bottomleft", imperial: false, maxWidth: 100}).addTo(m);
        m.on("zoomend", () => setZoom(m.getZoom()));
        m.on("dragstart", () => setWatching(false));
        layers.current = L.layerGroup().addTo(m);
        m.on("click", (e: any) => onPin?.(e.latlng.lat, e.latlng.lng));
        setReady(true);
      })
      .catch(() => setError("The map could not load."));
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      requestId.current++;
      setLocating(false);
      setReady(false);
    };
  }, [disabled, onPin]);
  useEffect(() => {
    try {
      if (localStorage.getItem("benue-map-view") === "satellite")
        setView("satellite");
    } catch {}
  }, []);
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;
    setTiles(false);
    setTileError("");
    import("leaflet").then((L) => {
      if (cancelled || !map.current) return;
      baseLayer.current?.remove();
      const satellite = view === "satellite";
      const layer = satellite ? satelliteLayer(L) : L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: MAP_MAX_ZOOM, maxNativeZoom: 19, keepBuffer: 1,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      baseLayer.current = layer;
      let failed = false, loaded = false;
      layer.on("loading", () => {failed = false; loaded = false;});
      layer.on("tileload", () => {loaded = true; if (!cancelled) {setTiles(true); setTileError("");}});
      layer.on("load", () => {
        if (!cancelled && failed) setTileError(loaded ? "Some map tiles could not load. Retry to fill the gaps." : "Map tiles could not load. Check your connection and retry, or switch map view.");
      });
      layer.on("tileerror", () => {failed = true;});
      layer.addTo(map.current);
    });
    return () => {
      cancelled = true;
    };
  }, [view, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    import("leaflet").then((L) => {
      if (!map.current || !layers.current) return;
      layers.current.clearLayers();
      rows.forEach((r) => {
        if (typeof r.data.lat !== "number" || typeof r.data.lng !== "number")
          return;
        const label = document.createElement("span");
        label.textContent = String(r.data.name || "Mapped place");
        L.marker([r.data.lat, r.data.lng], {
          title: label.textContent,
          keyboard: true,
          icon: L.divIcon({
            className: "place-marker",
            html: "<span>●</span>",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        })
          .bindTooltip(label, {direction: "top"})
          .addTo(layers.current)
          .on("click", () => onSelect(r));
      });
    });
  }, [rows, ready, onSelect]);
  useEffect(() => {
    if (
      selected &&
      map.current &&
      !followLocation &&
      typeof selected.data.lat === "number" &&
      typeof selected.data.lng === "number"
    )
      map.current.flyTo([selected.data.lat, selected.data.lng], 15, {
        duration: 0.5,
      });
  }, [selected, ready, followLocation]);
  useEffect(() => {
    if (!map.current) return;
    import("leaflet").then((L) => {
      if (!map.current) return;
      routing.current?.remove();
      if (route?.length) {
        routing.current = L.polyline(
          route.map((c) => [c[1], c[0]] as [number, number]),
          { color: "#17684b", weight: 5 },
        ).addTo(map.current);
        map.current.fitBounds(routing.current.getBounds(), {
          padding: [30, 30],
        });
      }
    });
  }, [route, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !map.current) return;
      positionLayer.current?.remove();
      positionLayer.current = null;
      if (position) {
        positionLayer.current = L.layerGroup([
          L.circle([position.lat, position.lng], {
            radius: Math.max(position.accuracy, 0),
            color: "#3978cb",
            weight: 1,
            fillOpacity: 0.08,
          }),
          L.circleMarker([position.lat, position.lng], {
            radius: 9,
            color: "white",
            weight: 3,
            fillColor: "#3978cb",
            fillOpacity: 1,
          }),
        ]).addTo(map.current);
        if (followLocation) {
          map.current.setView(
            [position.lat, position.lng],
            firstLocation.current ? 17 : map.current.getZoom(),
            { animate: false },
          );
          firstLocation.current = false;
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [position, followLocation, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !map.current) return;
      streetLayer.current?.remove();
      streetLayer.current = null;
      if (nearestRoad && position) {
        const road: [number, number] = [nearestRoad.lat, nearestRoad.lng];
        streetLayer.current = L.layerGroup([
          L.polyline([[position.lat, position.lng], road], {
            color: "#d09524",
            weight: 2,
            dashArray: "5 7",
          }),
          L.circleMarker(road, {
            radius: 6,
            color: "#fff",
            weight: 2,
            fillColor: "#d09524",
            fillOpacity: 1,
          }),
        ]).addTo(map.current);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [nearestRoad, position, ready]);
  const changeView = (next: "normal" | "satellite") => {
    setView(next);
    try {
      localStorage.setItem("benue-map-view", next);
    } catch {}
  };
  const locate = () => {
    if (!navigator.geolocation) {setError("Location is unavailable on this device. Use a browser with location services enabled."); return;}
    setLocating(true); setError(""); setNotice("");
    const current = ++requestId.current;
    navigator.geolocation.getCurrentPosition(p => {
      if (current !== requestId.current) return;
      const point = {lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, timestamp: p.timestamp};
      setStandalonePoint(point); locationCallback.current?.(point); setLocating(false);
      map.current?.setView([point.lat, point.lng], point.accuracy > 1000 ? 13 : point.accuracy > 150 ? 16 : 18);
    }, e => {if (current === requestId.current) {setLocating(false); setError(locationError(e.code));}},
    {enableHighAccuracy: true, timeout: 20000, maximumAge: 0});
  };
  const centre = () => {if (position) map.current?.setView([position.lat, position.lng], Math.max(16, map.current.getZoom())); else locate();};
  const copyPosition = async () => {
    if (!position) return;
    try {await navigator.clipboard.writeText(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`); setNotice("Coordinates copied.");}
    catch {setNotice("Select the coordinates above to copy your position.");}
  };
  return (
    <div className={"map-wrap atlas-map" + (expanded ? " map-expanded" : "")} data-map-zoom={zoom} data-map-view={view}>
      {disabled ? (
        <div className="map-off">
          <h3>Low-data mode</h3>
          <p>
            The map is paused. Search and saved place details are still
            available.
          </p>
        </div>
      ) : (
        <>
          <div
            ref={container}
            className="map-canvas"
            role="region"
            aria-label="Interactive street and satellite map"
          />
          <div className="map-label">
            <span className="live-dot" />{tiles ? position ? "Your location" : "Explore Benue" : tileError ? "Map offline" : "Loading map…"}
            <small>{position ? `Accuracy ±${Math.round(position.accuracy)} m` : "Otukpo · Nigeria"}</small>
          </div>
          <div className="map-tools">
            <div className="map-view-switch" role="group" aria-label="Map view">
              <button type="button" className={view === "normal" ? "active" : ""} aria-pressed={view === "normal"} onClick={() => changeView("normal")}><Layers size={14}/>Streets</button>
              <button type="button" className={view === "satellite" ? "active" : ""} aria-pressed={view === "satellite"} onClick={() => changeView("satellite")}><Satellite size={14}/>Satellite</button>
            </div>
            <button ref={expandButton} className="map-tool-button" aria-label={expanded ? "Close expanded map" : "Expand map"} title={expanded ? "Close expanded map (Esc)" : "Expand map"} aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>
          </div>
          <div className="map-navigation-tools">
            <button className="map-tool-button map-home" aria-label="Return to Otukpo" title="Return to Otukpo" onClick={() => {setWatching(false); map.current?.setView([7.192, 8.132], 13);}}><MapPin size={18}/></button>
          </div>
          {position ? <section className="map-gps-card" aria-label="Your device location">
            <div className="map-gps-heading"><span className="gps-dot"/><strong>{watching || liveTracking ? "Following your location" : "Your device location"}</strong><button className="map-inline-button" aria-label="Copy my coordinates" title="Copy my coordinates" onClick={copyPosition}><Copy size={15}/></button></div>
            <p className="map-coordinates">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
            <small>Accuracy ±{Math.round(position.accuracy)} m{position.accuracy > 100 ? " · Approximate position" : " · Blue circle shows accuracy"}</small>
            {nearestRoad && <small className="map-nearest">Nearest mapped street: {nearestRoad.name}</small>}
            <div className="map-gps-actions"><button onClick={centre}><LocateFixed size={14}/>Centre</button><button onClick={locate} disabled={locating}><RefreshCw size={13}/>{locating ? "Finding…" : "Refresh"}</button>{!livePoint && <button aria-pressed={watching} onClick={() => setWatching(!watching)}><Navigation size={13}/>{watching ? "Stop" : "Follow me"}</button>}</div>
            {notice && <small role="status">{notice}</small>}
          </section> : <div className="map-location-start"><button className="button map-locate" disabled={locating} onClick={locate}><LocateFixed size={16}/>{locating ? "Finding your position…" : "My location"}</button><small>Only with your permission</small></div>}
          <div className="map-imagery-note">{view === "satellite" ? <>Satellite imagery · dates and detail vary{zoom > 18 ? " · Enlarged view" : ""}</> : <>Street map{zoom > 19 ? " · Enlarged view" : ""}</>}<span>Zoom {zoom}</span></div>
        </>
      )}
      {(error || tileError) && (
        <div className="map-error" role="status">
          <span>{error || tileError}</span>
          {tileError && !error && <button onClick={() => {setTileError(""); baseLayer.current?.redraw();}}>Retry map</button>}
          <button aria-label="Dismiss map message" onClick={() => {setError(""); setTileError("");}}><X size={14}/></button>
        </div>
      )}
    </div>
  );
}
