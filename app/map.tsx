"use client";
import { useEffect, useRef, useState } from "react";
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
    [ready, setReady] = useState(false),
    [tiles, setTiles] = useState(false);
  const position = livePoint || standalonePoint;
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
        });
        map.current = m;
        L.control.zoom({ position: "bottomright" }).addTo(m);
        layers.current = L.layerGroup().addTo(m);
        m.on("click", (e: any) => onPin?.(e.latlng.lat, e.latlng.lng));
        setReady(true);
      })
      .catch(() => setError("The map could not load."));
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
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
    setError("");
    import("leaflet").then((L) => {
      if (cancelled || !map.current) return;
      baseLayer.current?.remove();
      const satellite = view === "satellite";
      const layer = L.tileLayer(
        satellite
          ? "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: satellite ? 20 : 19,
          maxNativeZoom: satellite ? 19 : 19,
          keepBuffer: 1,
          attribution: satellite
            ? 'Imagery © <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noreferrer">Esri</a>, Vantor, Earthstar Geographics, GIS User Community'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      );
      baseLayer.current = layer;
      layer.on("load", () => {
        if (!cancelled) setTiles(true);
      });
      layer.on("tileerror", () => {
        if (!cancelled)
          setError(
            satellite
              ? "Satellite imagery is unavailable here. Choose Normal view to continue."
              : "Map tiles are unavailable. Place search and coordinates still work.",
          );
      });
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
        L.marker([r.data.lat, r.data.lng], {
          icon: L.divIcon({
            className: "place-marker",
            html: "<span>●</span>",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        })
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
    if (position && map.current) {
      map.current.setView([position.lat, position.lng], 18);
      return;
    }
    if (!navigator.geolocation) {
      setError("Location is unavailable on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setStandalonePoint({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          timestamp: p.timestamp,
        });
        if (map.current)
          map.current.setView([p.coords.latitude, p.coords.longitude], 18);
      },
      () =>
        setError(
          "Location permission was declined or unavailable. You can enter coordinates instead.",
        ),
      { timeout: 10000, maximumAge: 60000 },
    );
  };
  return (
    <div className="map-wrap">
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
            aria-label="Interactive OpenStreetMap of Otukpo"
          />
          <div className="map-label">
            <span className="live-dot" />
            {tiles
              ? position
                ? "Your GPS position"
                : "Exploring Otukpo"
              : "Loading map…"}
            <small>
              {position ? "Device GPS position" : "Benue State, Nigeria"}
            </small>
          </div>
          <div className="map-view-switch" role="group" aria-label="Map view">
            <button
              type="button"
              className={view === "normal" ? "active" : ""}
              aria-pressed={view === "normal"}
              onClick={() => changeView("normal")}
            >
              Normal
            </button>
            <button
              type="button"
              className={view === "satellite" ? "active" : ""}
              aria-pressed={view === "satellite"}
              onClick={() => changeView("satellite")}
            >
              Satellite
            </button>
          </div>
          {position && (
            <div className="map-position-legend">
              <span>
                <i />
                Your GPS position
              </span>
              {nearestRoad && (
                <span>
                  <i className="street-dot" />
                  Nearest mapped street
                </span>
              )}
            </div>
          )}
          {view === "satellite" && (
            <div className="satellite-capture-note">
              Satellite imagery · capture dates vary
              {liveTracking ? " · GPS updates live" : ""}
            </div>
          )}
          <button
            className="map-locate button secondary small"
            onClick={locate}
          >
            ◎ {position ? "Centre on me" : "My location"}
          </button>
        </>
      )}
      {error && (
        <div className="map-error" role="status">
          {error}
        </div>
      )}
    </div>
  );
}
