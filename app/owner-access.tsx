"use client";
import {useEffect,useState} from "react";
import {LockKeyhole,ArrowRight} from "lucide-react";
import {api} from "../lib/client";
import {Moderation,Notice} from "./components";
export function OwnerAccess(){
 const [owner,setOwner]=useState<boolean|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{api("me").then(d=>setOwner(d.user?.role==="admin")).catch(()=>setOwner(false))},[]);
 if(owner)return <Moderation mapImport/>;
 const login=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setBusy(true);try{const fd=new FormData(e.currentTarget);await api("owner/login","POST",{email:fd.get("email"),password:fd.get("password")});window.location.assign("/admin")}catch(e){setMessage((e as Error).message);setBusy(false)}};
 return <section className="section readable"><p className="eyebrow"><LockKeyhole size={15}/>Benue Locator administration</p><h1>Owner sign-in.</h1><p className="muted">Review community submissions and manage sourced map references.</p>{owner===null?<p role="status">Checking your account…</p>:<form className="card" onSubmit={login}><label className="field">Admin email<input name="email" type="email" autoComplete="username" required maxLength={200}/></label><label className="field">Password<input name="password" type="password" autoComplete="current-password" required maxLength={256}/></label>{message&&<Notice error>{message}</Notice>}<button className="button" disabled={busy}>{busy?"Signing in…":"Sign in to administration"}<ArrowRight size={16}/></button><p className="muted">Only approved administrators can access this workspace.</p></form>}</section>;
}
