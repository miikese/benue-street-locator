import {scrypt,randomBytes,createHash,timingSafeEqual} from "node:crypto";
import type {Context,Identity} from "./service";
const COOKIE="benue_owner";
const SESSION_SECONDS=12*60*60;
const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
export const ownerIdentityId=(email:string)=>"owner-"+digest(email.trim().toLowerCase()).slice(0,32);
export async function hashOwnerPassword(password:string,salt=randomBytes(16).toString("hex")){
 const key=await new Promise<Buffer>((resolve,reject)=>scrypt(password,Buffer.from(salt,"hex"),64,{N:32768,r:8,p:3,maxmem:64*1024*1024},(error,result)=>error?reject(error):resolve(result)));
 return `scrypt$32768$8$3$${salt}$${key.toString("hex")}`;
}
export async function verifyOwnerPassword(password:string,stored:string){
 const [algorithm,n,r,p,salt,expected]=stored.split("$");
 if(algorithm!=="scrypt"||n!=="32768"||r!=="8"||p!=="3"||!salt?.match(/^[a-f0-9]{32}$/)||!expected?.match(/^[a-f0-9]{128}$/))return false;
 const computed=await hashOwnerPassword(password,salt),actual=Buffer.from(computed.split("$")[5],"hex");return timingSafeEqual(actual,Buffer.from(expected,"hex"));
}
function tokenFrom(req:Request){return(req.headers.get("cookie")||"").split(";").map(v=>v.trim()).find(v=>v.startsWith(COOKIE+"="))?.slice(COOKIE.length+1)||"";}
export async function resolveOwnerSession(req:Request,ctx:Context):Promise<Identity>{
 if(!ctx.ownerEmail||!ctx.ownerPasswordHash)return null;const token=tokenFrom(req);if(!/^[a-f0-9]{64}$/.test(token))return null;
 const row=await ctx.db.prepare("SELECT * FROM owner_sessions WHERE id=? AND expires>?").bind(digest(token),Date.now()).first();
 if(!row||row.email!==ctx.ownerEmail.trim().toLowerCase()||row.credential_digest!==digest(ctx.ownerPasswordHash))return null;
 return{userId:ownerIdentityId(row.email),displayName:"Benue Locator owner",email:row.email,authMethod:"owner-password"};
}
export async function handleOwnerAuth(req:Request,ctx:Context):Promise<Response|null>{
 const path=new URL(req.url).pathname;if(!["/api/owner/login","/api/owner/logout"].includes(path))return null;
 const fail=(message:string,status:number)=>Response.json({error:message},{status,headers:{"cache-control":"no-store"}});
 if(req.method!=="POST")return fail("Use POST.",405);
 const origin=req.headers.get("origin");if(origin&&origin!==new URL(req.url).origin||req.headers.get("sec-fetch-site")==="cross-site")return fail("Cross-origin sign-in is not allowed.",403);
 const cookie=(value:string,maxAge:number)=>`${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(req.url).protocol==="https:"?"; Secure":""}`;
 if(path.endsWith("logout")){const token=tokenFrom(req);if(token)await ctx.db.prepare("DELETE FROM owner_sessions WHERE id=?").bind(digest(token)).run();return Response.json({signedOut:true},{headers:{"set-cookie":cookie("",0),"cache-control":"no-store"}});}
 if(!ctx.ownerEmail||!ctx.ownerPasswordHash)return fail("Owner password sign-in has not been configured. Use your authorized ChatGPT account.",503);
 if(!req.headers.get("content-type")?.startsWith("application/json"))return fail("Send JSON.",415);
 const bucket="owner-login:"+digest(req.headers.get("cf-connecting-ip")||"local").slice(0,24)+":"+Math.floor(Date.now()/900000);
 const limit=await ctx.db.prepare("INSERT INTO limits(id,count) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count").bind(bucket).first();if(limit.count>8)return fail("Too many sign-in attempts. Please try again in 15 minutes.",429);
 const reader=req.body?.getReader();let raw="",size=0;if(reader)for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>2048){await reader.cancel();return fail("Sign-in request is too large.",413)}raw+=new TextDecoder().decode(part.value);}
 let data:any;try{data=JSON.parse(raw)}catch{return fail("Enter your email and password.",400)}
 const email=typeof data?.email==="string"?data.email.trim().toLowerCase():"",password=typeof data?.password==="string"?data.password:"";if(!email||!password||password.length>256)return fail("Email or password is incorrect.",401);
 const valid=await verifyOwnerPassword(password,ctx.ownerPasswordHash);if(!valid||email!==ctx.ownerEmail.trim().toLowerCase())return fail("Email or password is incorrect.",401);
 const token=randomBytes(32).toString("hex"),id=ownerIdentityId(email),now=new Date().toISOString();
 await ctx.db.batch([
  ctx.db.prepare("DELETE FROM owner_sessions WHERE expires<=?").bind(Date.now()),
  ctx.db.prepare("INSERT INTO owner_sessions(id,email,credential_digest,expires,created) VALUES(?,?,?,?,?)").bind(digest(token),email,digest(ctx.ownerPasswordHash),Date.now()+SESSION_SECONDS*1000,now),
  ctx.db.prepare("INSERT INTO users(id,name,role) VALUES(?,?,'super_admin') ON CONFLICT(id) DO UPDATE SET role='super_admin'").bind(id,"Benue Locator owner"),
  ctx.db.prepare("DELETE FROM limits WHERE id=?").bind(bucket)
 ]);
 return Response.json({signedIn:true},{headers:{"set-cookie":cookie(token,SESSION_SECONDS),"cache-control":"no-store"}});
}
