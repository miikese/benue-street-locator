import {worldCoordinates} from "./navigation";

export function locationViews(lat: number, lng: number, name: string) {
  worldCoordinates(lat, lng);
  const coordinate = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  return {
    google: googleMapsSearch(coordinate),
    googleSatellite: `https://www.google.com/maps/@?${new URLSearchParams({api:"1",map_action:"map",center:coordinate,zoom:"18",basemap:"satellite"})}`,
    earth: `https://earth.google.com/web/search/${encodeURIComponent(coordinate)}`,
    apple: `https://maps.apple.com/place?${new URLSearchParams({coordinate, name})}`,
  };
}

const xml = (value: string) => value.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, "").replace(/[<>&"']/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"})[c]!);

// KML uses longitude, latitude order. No external assets, tracking or private
// journal data are included. The downloaded file opens in Google Earth Pro.
export function locationKml(lat: number, lng: number, name: string) {
  worldCoordinates(lat, lng);
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml(name)}</name><Placemark><name>${xml(name)}</name><description>Shared map pin from Benue Street Locator. A pin is not a verified entrance or official address.</description><LookAt><longitude>${lng}</longitude><latitude>${lat}</latitude><range>1200</range><tilt>0</tilt></LookAt><Point><coordinates>${lng},${lat},0</coordinates></Point></Placemark></Document></kml>`;
}

export function googleMapsSearch(query: string) {
  return `https://www.google.com/maps/search/?${new URLSearchParams({api:"1",query:Array.from(query.trim()).slice(0,160).join("")})}`;
}

export function coordinateSearch(query: string) {
  const match=query.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  return match?worldCoordinates(Number(match[1]),Number(match[2])):null;
}
