import {matchPlaces} from "./domain";
import type {RecordItem} from "./client";

const normalize=(value:unknown)=>String(value||"").normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase();

export function suggestPlaces(rows:RecordItem[],query:string,lga="",category="") {
  const term=query.trim();
  if(term.length<2 || /^[-+\d.\s,]+$/.test(term))return [];
  const normalized=normalize(term);
  const score=(record:RecordItem)=>{
    const name=normalize(record.data.name);
    return name.startsWith(normalized)?0:name.includes(normalized)?1:normalize(record.data.aliases).includes(normalized)?2:3;
  };
  return matchPlaces(rows.filter(record=>record.kind==="place"&&record.status==="approved"),term,lga,category)
    .sort((a,b)=>score(a)-score(b)||String(a.data.name).localeCompare(String(b.data.name)))
    .slice(0,6);
}
