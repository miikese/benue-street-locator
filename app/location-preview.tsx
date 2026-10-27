"use client";
import {useEffect,useRef,useState} from "react";
import {satelliteLayer} from "./satellite-layer";
import {mapLabels} from "./map-labels";

export function LocationPreview({lat,lng,name,disabled=false}:{lat:number;lng:number;name:string;disabled?:boolean}) {
  const container=useRef<HTMLDivElement>(null),retry=useRef<()=>void>(()=>{});
  const [state,setState]=useState("loading");
  useEffect(()=>{
    if(disabled)return;
    let frame:number|undefined;let cancelled=false;let map:import("leaflet").Map|undefined;
    setState("loading");
    import("leaflet").then(L=>{
      if(cancelled || !container.current)return;
      map=L.map(container.current,{center:[lat,lng],zoom:17,minZoom:3,maxZoom:19,scrollWheelZoom:false,zoomControl:false});
      L.control.zoom({position:"bottomright"}).addTo(map);
      L.control.scale({position:"bottomleft",imperial:false}).addTo(map);
      const imagery=satelliteLayer(L).addTo(map);
      let loaded=false;
      imagery.on("tileload",()=>{loaded=true;if(!cancelled)setState("ready");});
      imagery.on("load",()=>{if(!cancelled && !loaded)setState("error");});
      retry.current=()=>{loaded=false;setState("loading");imagery.redraw();};
      mapLabels(L,map).addTo(map);
      L.marker([lat,lng],{title:name,icon:L.divIcon({className:"place-marker place-marker-selected",html:"<span>●</span>",iconSize:[28,28],iconAnchor:[14,14]})}).addTo(map);
      frame=requestAnimationFrame(()=>{if(!cancelled)map?.invalidateSize();});
    }).catch(()=>{if(!cancelled)setState("error");});
    return ()=>{cancelled=true;if(frame!==undefined)cancelAnimationFrame(frame);retry.current=()=>{};map?.remove();map=undefined;};
  },[lat,lng,name,disabled]);
  return <figure className="location-preview">
    {disabled?<div className="location-preview-paused">Satellite preview paused in low-data mode.</div>:<><div ref={container} className="location-preview-map" role="region" aria-label={`Satellite preview of ${name}`}/>{state!=="ready" && <div className="location-preview-status" role="status">{state==="error"?<><span>Satellite preview is unavailable.</span><button type="button" onClick={()=>retry.current()}>Retry preview</button></>:"Loading satellite preview…"}</div>}</>}
    <figcaption>Satellite context · pin location, not a street-level photograph. Imagery is not live.</figcaption>
  </figure>;
}
