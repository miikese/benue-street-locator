import {describe,it,expect,beforeEach,afterEach} from "vitest";
import {database} from "./database";
import {handle,type Context} from "../lib/service";
import {coordinates,matchPlaces,distance,canTransition,LGAS} from "../lib/domain";
let db:ReturnType<typeof database>,ctx:Context;
const user={userId:"member",displayName:"Member"},admin={userId:"admin",displayName:"Moderator"};
const place={name:"Test public school",description:"A test-only public place for validation.",lat:7.192,lng:8.132,lga:"Otukpo",town:"Otukpo",category:"School"};
async function call(path:string,method="GET",data?:unknown,origin?:string){const r=await handle(new Request("https://example.test/api/"+path,{method,headers:{...(data?{"content-type":"application/json"}:{}),...(origin?{origin}:{})},...(data?{body:JSON.stringify(data)}:{})}),ctx);return{status:r.status,body:await r.json() as any};}
beforeEach(()=>{db=database();ctx={db,user,adminIds:["admin"]};});
afterEach(()=>db.close());
describe("API trust and persistence",()=>{
 it("requires authentication for contributions",async()=>{ctx.user=null;expect((await call("records","POST",{kind:"place",data:place})).status).toBe(401);});
 it("blocks cross-origin writes",async()=>{expect((await call("records","POST",{kind:"place",data:place},"https://attacker.test")).status).toBe(403);});
 it("validates coordinates and categories before inserting",async()=>{expect((await call("records","POST",{kind:"place",data:{...place,lat:Infinity}})).status).toBe(400);expect((await call("records","POST",{kind:"place",data:{...place,category:"Home"}})).status).toBe(400);expect((await call("records?mine=1")).body.records).toHaveLength(0);});
 it("keeps pending places private until moderator approval",async()=>{const created=await call("records","POST",{kind:"place",data:place});expect(created.status).toBe(201);expect((await call("records")).body.records).toHaveLength(0);expect((await call("records?mine=1")).body.records).toHaveLength(1);expect((await call("records/"+created.body.id,"PATCH",{status:"approved",note:"Checked the submitted public details."})).status).toBe(403);ctx.user=admin;expect((await call("records/"+created.body.id,"PATCH",{status:"approved",note:"Checked the submitted public details."})).status).toBe(200);ctx.user=null;const listing=await call("records");expect(listing.body.records).toHaveLength(1);expect(listing.body.records[0]).not.toHaveProperty("owner");expect((await call("records/"+created.body.id)).body.history).toHaveLength(2);});
 it("does not expose another user's pending record",async()=>{const r=await call("records","POST",{kind:"place",data:place});ctx.user=null;expect((await call("records/"+r.body.id)).status).toBe(404);ctx.user={userId:"other",displayName:"Other"};expect((await call("records/"+r.body.id)).status).toBe(403);});
 it("requires a review note and valid status transition",async()=>{const r=await call("records","POST",{kind:"place",data:place});ctx.user=admin;expect((await call("records/"+r.body.id,"PATCH",{status:"approved",note:"ok"})).status).toBe(400);expect((await call("records/"+r.body.id,"PATCH",{status:"resolved",note:"This is not a valid mapping status."})).status).toBe(409);});
 it("persists favorites idempotently and generates owner notifications",async()=>{const r=await call("records","POST",{kind:"place",data:place});ctx.user=admin;await call("records/"+r.body.id,"PATCH",{status:"approved",note:"Reviewed the public location details."});ctx.user=user;await call("actions","POST",{record:r.body.id,type:"favorite"});await call("actions","POST",{record:r.body.id,type:"favorite"});expect((await call("actions")).body.actions).toHaveLength(1);expect((await call("me")).body.notifications).toHaveLength(1);await call("actions","POST",{record:r.body.id,type:"favorite",remove:true});expect((await call("actions")).body.actions).toHaveLength(0);});
 it("rejects unowned uploaded photos",async()=>{expect((await call("records","POST",{kind:"place",data:{...place,photo:"unknown"}})).status).toBe(400);});
 it("deletes only the current user's application data",async()=>{await call("records","POST",{kind:"place",data:place});ctx.user={userId:"other",displayName:"Other"};await call("records","POST",{kind:"place",data:place});await call("account","DELETE");ctx.user=user;expect((await call("records?mine=1")).body.records).toHaveLength(1);});
 it("rate-limits repeated writes",async()=>{for(let i=0;i<35;i++)await call("notifications","POST",{});expect((await call("notifications","POST",{})).status).toBe(429);});
 it("rejects script and non-HTTPS business URLs",async()=>{expect((await call("records","POST",{kind:"place",data:{...place,website:"javascript:alert(1)"}})).status).toBe(400);});
});
describe("map rules",()=>{
 it("registers all 23 LGAs",()=>expect(new Set(LGAS).size).toBe(23));
 it("matches aliases and applies LGA/category filters",()=>{const rows=[{data:{name:"Public hospital",aliases:"Clinic Junction",lga:"Otukpo",category:"Hospital"}}];expect(matchPlaces(rows,"junction","Otukpo","Hospital")).toHaveLength(1);expect(matchPlaces(rows,"junction","Makurdi")).toHaveLength(0);});
 it("rejects non-finite and out-of-region coordinates",()=>{expect(()=>coordinates(NaN,8.1)).toThrow();expect(()=>coordinates(7.1,NaN)).toThrow();expect(()=>coordinates(50,50)).toThrow();});
 it("calculates straight-line distance without inventing routes",()=>{expect(distance({lat:7,lng:8},{lat:7,lng:8})).toBe(0);expect(distance({lat:7,lng:8},{lat:7.01,lng:8})).toBeCloseTo(1.11,1);});
 it("requires explicit reopening of approved records",()=>{expect(canTransition("place","approved","rejected")).toBe(false);expect(canTransition("place","approved","under-review")).toBe(true);});
});

describe("directory search and public links",()=>{
 const rows=[{data:{name:"Orokam Street",aliases:"Old Market Road",town:"Otukpo",lga:"Otukpo",category:"Street"}},{data:{name:"Café Junction",lga:"Makurdi",category:"Market"}}];
 it("tolerates one typo while requiring every search term",()=>{
  expect(matchPlaces(rows,"orokm otukpo")).toHaveLength(1);
  expect(matchPlaces(rows,"market old")).toHaveLength(1);
  expect(matchPlaces(rows,"orokm hospital")).toHaveLength(0);
  expect(matchPlaces(rows,"orokm","Makurdi")).toHaveLength(0);
  expect(matchPlaces(rows,"abc")).toHaveLength(0);
 });
 it("matches accents and preserves exact short-term discovery",()=>{
  expect(matchPlaces(rows,"cafe")).toHaveLength(1);
  expect(matchPlaces(rows,"oro")).toHaveLength(1);
  expect(matchPlaces(rows,"")).toHaveLength(2);
 });
 it("rejects malformed and credential-bearing public URLs",async()=>{
  for(const website of ["https://", "https://user:password@example.com", "https://example.com/a b"])
   expect((await call("records","POST",{kind:"place",data:{...place,website}})).status).toBe(400);
  expect((await call("records","POST",{kind:"place",data:{...place,website:"https://example.com/public"}})).status).toBe(201);
 });
});
