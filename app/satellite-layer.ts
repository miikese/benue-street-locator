import type * as Leaflet from "leaflet";
import {IMAGERY_URL, MAP_MAX_ZOOM, SATELLITE_NATIVE_ZOOM, parentTile} from "../lib/map-tiles";

export function satelliteLayer(L: typeof Leaflet) {
  const missing = new Set<string>();
  class Imagery extends L.GridLayer {
    redraw() {missing.clear(); return super.redraw();}
    createTile(coords: Leaflet.Coords, done: Leaflet.DoneCallback) {
      const tile = document.createElement("div"), img = document.createElement("img");
      tile.style.overflow = "hidden";
      tile.dataset.tileX=String(coords.x);tile.dataset.tileY=String(coords.y);tile.dataset.tileZoom=String(coords.z);
      img.alt = "";
      img.draggable = false;
      Object.assign(img.style, {position: "absolute", maxWidth: "none", maxHeight: "none"});
      tile.appendChild(img);
      let level = coords.z, key = "";
      const load = () => {
        let parent = parentTile(coords, level);
        key = `${parent.z}/${parent.y}/${parent.x}`;
        while (level > Math.max(0, coords.z - 6) && missing.has(key)) {
          parent = parentTile(coords, --level);
          key = `${parent.z}/${parent.y}/${parent.x}`;
        }
        Object.assign(img.style, {width: `${parent.size}px`, height: `${parent.size}px`, left: `${parent.left}px`, top: `${parent.top}px`});
        tile.dataset.imageryLevel = String(level);
        // Esri otherwise returns a successful image containing "map data not
        // yet available". A 404 lets us use the next available parent instead.
        img.src = `${IMAGERY_URL}/tile/${key}?blankTile=false`;
      };
      img.onload = () => done(undefined, tile);
      img.onerror = () => {
        if (level <= Math.max(0, coords.z - 6)) {done(new Error("Imagery is unavailable."), tile); return;}
        // Bound memory while retaining useful negative-cache entries.
        if (missing.size > 500) missing.clear();
        missing.add(key);
        level--;
        load();
      };
      load();
      return tile;
    }
  }
  const layer = new Imagery({maxZoom: MAP_MAX_ZOOM, maxNativeZoom: SATELLITE_NATIVE_ZOOM, keepBuffer: 1,
    attribution: 'Imagery © <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noreferrer">Esri</a>, Vantor, Earthstar Geographics, GIS User Community'}) as Leaflet.GridLayer;
  layer.on("tileunload", (e: Leaflet.TileEvent) => {
    const img = e.tile.querySelector("img");
    if (img) {img.onload = null; img.onerror = null; img.removeAttribute("src");}
  });
  return layer;
}
