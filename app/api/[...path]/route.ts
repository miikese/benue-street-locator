import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { handle, json } from "../../../lib/service";
import osmSeed from "../../../lib/osm-seed.json";
import directorySeed from "../../../lib/directory-seed.json";
const seed=[...osmSeed,...directorySeed];
import {worldCoordinates} from "../../../lib/navigation";
import {coordinates} from "../../../lib/domain";
async function route(req:Request) {
 if(!env.DB)return json({error:"Database unavailable."},503);
 if(new URL(req.url).pathname==="/api/directions"&&req.method==="GET") {
  try{
   const vars=env as unknown as {ROUTING_URL?:string},base=vars.ROUTING_URL;
   if(!base)return json({error:"Route calculation is unavailable. Use Open directions to navigate with a supported map provider."},503);
   const key="routing:"+Math.floor(Date.now()/60000),limit=await env.DB.prepare("INSERT INTO limits(id,count) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count").bind(key).first<{count:number}>();
   if((limit?.count||0)>10)return json({error:"Routing is busy. Try again in a minute."},429);
   const u=new URL(req.url),f=(u.searchParams.get("from")||"").split(",").map(Number),t=(u.searchParams.get("to")||"").split(",").map(Number);
   worldCoordinates(f[0],f[1]);coordinates(t[0],t[1]);
   const response=await fetch(base.replace(/\/$/,"")+"/route/v1/driving/"+f[1]+","+f[0]+";"+t[1]+","+t[0]+"?overview=full&geometries=geojson&steps=true",{signal:AbortSignal.timeout(12000)});
   const d=await response.json() as any;if(!response.ok||d.code!=="Ok"||!d.routes?.length)return json({error:"No route was found. Check the coordinates or use Open directions."},503);
   const r=d.routes[0];return json({distance:r.distance,duration:r.duration,geometry:r.geometry,steps:r.legs.flatMap((l:any)=>l.steps)});
  }catch{return json({error:"Routing is unavailable or the coordinates are invalid. You can still view the destination and open external directions."},503);}
 }
 if(new URL(req.url).pathname==="/api/seed" && req.method==="POST" && (env as unknown as {INITIALIZE_TOKEN?:string}).INITIALIZE_TOKEN && req.headers.get("x-initialize-token")===(env as unknown as {INITIALIZE_TOKEN:string}).INITIALIZE_TOKEN) {
  return handle(req,{db:env.DB,user:{userId:"deployment-seed",displayName:"Deployment seed"},adminIds:["deployment-seed"],seed});
 }
 const ids=((env as unknown as {ADMIN_USER_IDS?:string}).ADMIN_USER_IDS||"").split(",").map(s=>s.trim()).filter(Boolean);
 return handle(req,{db:env.DB,user:await getChatGPTUser(),adminIds:ids,adminEmails:((env as unknown as {ADMIN_EMAILS?:string}).ADMIN_EMAILS||"").toLowerCase().split(",").map(s=>s.trim()).filter(Boolean),bucket:env.BUCKET,routingUrl:(env as unknown as {ROUTING_URL?:string}).ROUTING_URL,geocodeUrl:(env as unknown as {GEOCODING_URL?:string}).GEOCODING_URL,seed});
}
export const GET=route,POST=route,PATCH=route,DELETE=route;
