"use client";
import {useEffect,useId,useRef,useState} from "react";
import {ArrowRight,MapPin,Search,X} from "lucide-react";
import type {RecordItem} from "../lib/client";
import {suggestPlaces} from "../lib/place-search";

export function PlaceSearch({value,onChange,onSelect,onSearch,rows,lga,category}:{value:string;onChange:(value:string)=>void;onSelect:(record:RecordItem)=>void;onSearch:()=>void;rows:RecordItem[];lga:string;category:string}) {
  const id=useId(),chosen=useRef("");
  const [open,setOpen]=useState(false),[active,setActive]=useState(-1);
  const suggestions=suggestPlaces(rows,value,lga,category);
  const visible=open&&suggestions.length>0;
  useEffect(()=>{if(visible&&active>=0)document.getElementById(`${id}-${active}`)?.scrollIntoView({block:"nearest"});},[active,visible,id]);
  const choose=(record:RecordItem)=>{chosen.current=String(record.data.name);onChange(chosen.current);setOpen(false);setActive(-1);onSelect(record);};
  return <div className="place-search">
    <form className="search-box" onSubmit={event=>{event.preventDefault();setOpen(false);setActive(-1);onSearch();}}>
      <Search size={18}/><input aria-label="Search places" role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={visible?id:undefined} aria-activedescendant={visible&&active>=0&&active<suggestions.length?`${id}-${active}`:undefined} autoComplete="off" maxLength={160} value={value}
        onChange={event=>{chosen.current="";onChange(event.target.value);setActive(-1);setOpen(true);}}
        onFocus={()=>{if(value!==chosen.current)setOpen(true);}}
        onBlur={()=>{setOpen(false);setActive(-1);}}
        onKeyDown={event=>{
          if(event.key==="Escape"){event.preventDefault();setOpen(false);setActive(-1);return;}
          if(suggestions.length&&(event.key==="ArrowDown"||event.key==="ArrowUp")){
            event.preventDefault();setOpen(true);setActive(index=>event.key==="ArrowDown"?(index+1)%suggestions.length:(index<0?suggestions.length-1:(index-1+suggestions.length)%suggestions.length));
          }else if(event.key==="Enter"&&visible&&active>=0&&active<suggestions.length){event.preventDefault();choose(suggestions[active]);}
        }} placeholder="Street, address, landmark, or local name…"/>
      {value&&<button type="button" aria-label="Clear search" onClick={()=>{onChange("");chosen.current="";setOpen(false);setActive(-1);}}><X size={15}/></button>}
      <button aria-label="Search" type="submit"><ArrowRight size={17}/></button>
    </form>
    {visible&&<ul id={id} className="place-search-results" role="listbox" aria-label="Related places">
      <li role="presentation" className="place-search-heading">RELATED PLACES · PUBLIC DIRECTORY</li>
      {suggestions.map((record,index)=><li key={record.id} id={`${id}-${index}`} role="option" aria-selected={index===active} className="place-search-option" onPointerDown={event=>event.preventDefault()} onClick={()=>choose(record)}>
        <MapPin size={17}/><span><strong>{record.data.name}</strong><small>{record.data.address||record.data.town||record.data.category}{record.data.lga?` · ${record.data.lga}`:""}</small></span><ArrowRight size={14}/>
      </li>)}
    </ul>}
  </div>;
}
