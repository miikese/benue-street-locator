import {describe,it,expect} from "vitest";
import {parentTile,locationError} from "../lib/map-tiles";
describe("satellite parent tile alignment",()=>{
 it("crops the right quadrant at each fallback level",()=>{
  expect(parentTile({x:547975,y:503285,z:20},19)).toEqual({x:273987,y:251642,z:19,size:512,left:-256,top:-256});
  expect(parentTile({x:547975,y:503285,z:20},18)).toEqual({x:136993,y:125821,z:18,size:1024,left:-768,top:-256});
 });
 it("leaves an available native tile unchanged",()=>{
  expect(parentTile({x:11,y:19,z:5},5)).toEqual({x:11,y:19,z:5,size:256,left:-0,top:-0});
 });
 it("gives actionable location errors",()=>{expect(locationError(1)).toContain("browser settings");expect(locationError(3)).toContain("too long");expect(locationError(2)).toContain("location services")});
});
