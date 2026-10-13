import {it,expect} from "vitest";
import {worldCoordinates,arrivalTime} from "../lib/navigation";
it("accepts device coordinates globally but rejects malformed positions",()=>{expect(worldCoordinates(33.57,-7.59)).toEqual({lat:33.57,lng:-7.59});for(const [lat,lng] of [[91,8],[-91,8],[7,181],[NaN,8],[7,Infinity]])expect(()=>worldCoordinates(lat,lng)).toThrow();});
it("calculates arrival using the provider duration and estimate timestamp",()=>{expect(arrivalTime(360,Date.parse("2026-10-13T10:00:00Z")).toISOString()).toBe("2026-10-13T10:06:00.000Z");expect(()=>arrivalTime(-1,Date.now())).toThrow();});
