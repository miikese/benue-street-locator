import {it,expect} from "vitest";
import {database} from "./database";
import {handle,type Context} from "../lib/service";
import {hashOwnerPassword} from "../lib/owner-auth";
it("persists authenticated owner sessions and rejects password rotation, forged identity and cross-origin login",async()=>{
 const db=database(),password="fixture-owner-password",ctx:Context={db,user:null,adminIds:[],ownerEmail:"owner@example.test",ownerPasswordHash:await hashOwnerPassword(password)};
 const call=async(path:string,data?:any,cookie="",origin="")=>{const r=await handle(new Request("https://example.test/api/"+path,{method:data?"POST":"GET",headers:{"content-type":"application/json",cookie,...(origin?{origin}:{})},...(data?{body:JSON.stringify(data)}:{})}),ctx);return{status:r.status,body:await r.json() as any,cookie:r.headers.get("set-cookie")?.split(";")[0]||""}};
 try{expect((await call("owner/login",{email:ctx.ownerEmail,password},"","https://evil.test")).status).toBe(403);expect((await call("owner/login",{email:ctx.ownerEmail,password:"incorrect"})).status).toBe(401);const login=await call("owner/login",{email:ctx.ownerEmail,password});expect(login.status).toBe(200);expect((await call("me",undefined,login.cookie)).body.user.role).toBe("admin");expect((await call("records?review=1",undefined,login.cookie)).status).toBe(200);ctx.ownerPasswordHash=await hashOwnerPassword("replacement-fixture-password");expect((await call("records?review=1",undefined,login.cookie)).status).toBe(401);ctx.user={userId:"member",displayName:"Member"};expect((await call("records?review=1")).status).toBe(403)}finally{db.close()}
},30000);
