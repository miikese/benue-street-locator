"use client";
import {useEffect,useId,useRef,useState} from "react";
import {ArrowRight,MapPin,Search,X} from "lucide-react";
import type {RecordItem} from "../lib/client";
import {suggestPlaces} from "../lib/place-search";
import {googleMapsSearch} from "../lib/location-views";

export function PlaceSearch({value,onChange,onSelect,onSearch,rows,lga,category}:{value:string;onChange:(value:string)=>void;onSelect:(record:RecordItem)=>void;onSearch:()=>void;rows:RecordItem[];lga:string;category:string}) {
  const id=useId(),chosen=useRef(""),input=useRef<HTMLInputElement>(null);
  const [manual,setManual]=useState<{key:string;attempt:number}|null>(null);
  const [open,setOpen]=useState(false),[active,setActive]=useState(-1);
  const [remote,setRemote]=useState<{key:string;rows:RecordItem[]}|null>(null),[looking,setLooking]=useState(false),[lookupError,setLookupError]=useState("");
  const queryKey=JSON.stringify([value.trim(),lga,category]);
  const cache=useRef(new Map<string,RecordItem[]>());
  useEffect(()=>{
    setLookupError("");setLooking(false);
    const term=value.trim();
    if(!open||value===chosen.current||term.length<3||/^[-+\d.\s,]+$/.test(term))return;
    if(cache.current.has(queryKey)){setRemote({key:queryKey,rows:cache.current.get(queryKey)!});return;}
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setLooking(true);
      try{
        const response=await fetch("/api/geocode?"+new URLSearchParams({q:term,lga}),{signal:controller.signal});
        const result=await response.json() as {results?:RecordItem[];error?:string};if(!response.ok)throw new Error(result.error||"Live suggestions unavailable.");
        if(controller.signal.aborted)return;
        const found=Array.isArray(result.results)?result.results:[];
        if(cache.current.size>=40)cache.current.delete(cache.current.keys().next().value!);
        cache.current.set(queryKey,found);setRemote({key:queryKey,rows:found});
      }catch(error){if(!controller.signal.aborted)setLookupError("Live map suggestions unavailable. Directory matches still work; try Google Maps below.");}
      finally{if(!controller.signal.aborted)setLooking(false);}
    },manual?.key===queryKey?0:750);
    return()=>{clearTimeout(timer);controller.abort();};
  },[value,lga,category,open,queryKey,manual]);
  const local=suggestPlaces(rows,value,lga,category);
  const external=remote?.key===queryKey?remote.rows.filter(record=>!category||record.data.category===category):[];
  const suggestions=[...local,...external.filter(record=>!local.some(item=>item.id===record.id||String(item.data.name).toLowerCase()===String(record.data.name).toLowerCase()))].slice(0,6);
  useEffect(()=>{setActive(-1);},[queryKey]);
  const visible=open&&suggestions.length>0;
  useEffect(()=>{if(visible&&active>=0)document.getElementById(`${id}-${active}`)?.scrollIntoView({block:"nearest"});},[active,visible,id]);
  const choose=(record:RecordItem)=>{chosen.current=String(record.data.name);onChange(chosen.current);setOpen(false);setActive(-1);onSelect(record);};
  const textQuery=!!value.trim()&&!/^[-+\d.\s,]+$/.test(value.trim());
  const submit=()=>{
    if(!textQuery&&value.trim()){setOpen(false);onSearch();return;}
    setActive(-1);setOpen(true);input.current?.focus();
    if(!suggestions.length&&value.trim().length>=3)setManual(previous=>({key:queryKey,attempt:(previous?.attempt||0)+1}));
  };
  return <div className="place-search" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)){setOpen(false);setActive(-1);}}}>
    <form className="search-box" onSubmit={event=>{event.preventDefault();submit();}}>
      <Search size={18}/><input ref={input} aria-label="Search places" aria-describedby={`${id}-help`} role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={visible?id:undefined} aria-activedescendant={visible&&active>=0&&active<suggestions.length?`${id}-${active}`:undefined} autoComplete="off" maxLength={160} value={value}
        onChange={event=>{chosen.current="";setManual(null);onChange(event.target.value);setActive(-1);setOpen(true);}}
        onFocus={()=>{if(value!==chosen.current)setOpen(true);}}
        onKeyDown={event=>{
          if(event.key==="Escape"){event.preventDefault();setOpen(false);setActive(-1);return;}
          if(suggestions.length&&(event.key==="ArrowDown"||event.key==="ArrowUp")){
            event.preventDefault();setOpen(true);setActive(index=>event.key==="ArrowDown"?(index+1)%suggestions.length:(index<0?suggestions.length-1:(index-1+suggestions.length)%suggestions.length));
          }else if(event.key==="Enter"&&visible&&active>=0&&active<suggestions.length){event.preventDefault();choose(suggestions[active]);}
        }} placeholder="Place or landmark…"/>
      {value&&<button type="button" aria-label="Clear search" onClick={()=>{onChange("");chosen.current="";setManual(null);setOpen(false);setActive(-1);}}><X size={15}/></button>}
      <button className="search-submit" aria-label="Search" type="submit">Search</button>
    </form>
    {visible&&<ul id={id} className="place-search-results" role="listbox" aria-label="Related places">
      <li role="presentation" className="place-search-heading">RELATED PLACES{lga?` · ${lga.toUpperCase()}`:""}</li>
      {suggestions.map((record,index)=><li key={record.id} id={`${id}-${index}`} role="option" aria-selected={index===active} className="place-search-option" onPointerDown={event=>event.preventDefault()} onClick={()=>choose(record)}>
        <MapPin size={17}/><span><strong>{record.data.name}</strong><small>{record.kind==="map-result"?"Map reference · ":"Directory · "}{record.data.address||record.data.town||record.data.category}{record.data.lga?` · ${record.data.lga}`:""}</small></span><ArrowRight size={14}/>
      </li>)}
    </ul>}
    {open&&textQuery&&!suggestions.length&&<div className="place-search-empty" role="status">
      <strong>{looking?"Finding matching names…":lookupError?"Map suggestions unavailable":value.trim().length<3?"Keep typing to search more places":"No matching names found yet"}</strong>
      <p>{looking?"Checking available map references.":lookupError|| (value.trim().length<3?"No directory match for these letters. Add another letter or try a nearby landmark.":"This directory and the map provider do not contain every business or street. Try a different spelling or landmark.")}</p>
      {value.trim().length>=2&&<a href={googleMapsSearch([value,lga||"Benue","Nigeria"].join(", "))} target="_blank" rel="noopener noreferrer">Search Google Maps ↗</a>}
    </div>}
    <small id={`${id}-help`} className="search-guidance" role="status" aria-live="polite">{open&&looking?"Looking for more places…":open&&lookupError&&suggestions.length>0?lookupError:open&&remote?.key===queryKey&&!suggestions.length?"No map suggestions found. Try a landmark or Google Maps below.":"Start with one letter. From 3 letters, Photon checks public search text after a pause."}</small>
  </div>;
}
