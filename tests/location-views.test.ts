import {describe,it,expect} from "vitest";
import {coordinateSearch,googleMapsSearch,locationKml,locationViews} from "../lib/location-views";
import {imageryIsEnlarged} from "../lib/map-tiles";

describe("external location views",()=>{
 it("passes the same pin to Apple Maps and Google Earth",()=>{
  const links=locationViews(7.192,8.132,"Otukpo & surroundings");
  const apple=new URL(links.apple);
  expect(apple.origin).toBe("https://maps.apple.com");
  expect(apple.searchParams.get("coordinate")).toBe("7.192000,8.132000");
  expect(apple.searchParams.get("name")).toBe("Otukpo & surroundings");
  expect(new URL(links.google).searchParams.get("query")).toBe("7.192000,8.132000");
  expect(new URL(links.googleSatellite).searchParams.get("basemap")).toBe("satellite");
  expect(decodeURIComponent(new URL(links.earth).pathname)).toBe("/web/search/7.192000,8.132000");
 });
 it("keeps arbitrary place names in an encoded query",()=>{
  const apple=new URL(locationViews(7,8,'A & B?coordinate=0,0#<script>').apple);
  expect(apple.searchParams.getAll('coordinate')).toEqual(['7.000000,8.000000']);
  expect(apple.hash).toBe('');
 });
 it("exports an escaped KML placemark in longitude/latitude order",()=>{
  const kml=locationKml(7.192,8.132,'A < B & "Friends"');
  expect(kml).toContain('<coordinates>8.132,7.192,0</coordinates>');
  expect(kml).toContain('A &lt; B &amp; &quot;Friends&quot;');
  expect(kml).not.toContain('<NetworkLink>');
  expect(kml).not.toContain('<script>');
  expect(locationKml(7,8,'Street\u0000Name')).toContain('<name>StreetName</name>');
 });
 it("rejects unconfirmed or nonfinite coordinates rather than exporting a false pin",()=>{
  for(const point of [[NaN,8],[7,Infinity],[91,8],[7,-181]]){
   expect(()=>locationViews(point[0],point[1],'Place')).toThrow();
   expect(()=>locationKml(point[0],point[1],'Place')).toThrow();
  }
 });
});
describe('imagery detail disclosure',()=>{
 it('distinguishes actual tile detail from magnification, including fallback tiles',()=>{
  expect(imageryIsEnlarged(17,null)).toBe(false);
  expect(imageryIsEnlarged(17,17)).toBe(false);
  expect(imageryIsEnlarged(18,17)).toBe(true);
  expect(imageryIsEnlarged(22,18)).toBe(true);
 });
});

describe('coordinate searches',()=>{
 it('recognizes the supplied Google example with surrounding whitespace',()=>{
  expect(coordinateSearch('  7.179556 , 8.153785  ')).toEqual({lat:7.179556,lng:8.153785});
  expect(coordinateSearch('St Helen Specialist Hospital, Otukpo')).toBeNull();
  expect(()=>coordinateSearch('91,8')).toThrow();
 });
 it('keeps provider searches encoded and within the Google URL length limit',()=>{
  const url=new URL(googleMapsSearch('St Helen & Resort?x=1'));
  expect(url.searchParams.get('api')).toBe('1');
  expect(url.searchParams.get('query')).toBe('St Helen & Resort?x=1');
  expect(googleMapsSearch('😀'.repeat(400)).length).toBeLessThan(2048);
 });
});
