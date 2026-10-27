"use client";
import {ArrowUpRight, Download, Globe2, Map} from "lucide-react";
import {locationKml, locationViews} from "../lib/location-views";

export function LocationViews({lat,lng,name}:{lat:number;lng:number;name:string}) {
  const links=locationViews(lat,lng,name);
  const download=()=>{
    const url=URL.createObjectURL(new Blob([locationKml(lat,lng,name)],{type:"application/vnd.google-earth.kml+xml;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download="benue-location.kml";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <section className="location-views" aria-label="View this location in other maps">
    <div><span className="eyebrow">A DIFFERENT PERSPECTIVE</span><h3>See this location</h3><p>Compare imagery at the same coordinates.</p></div>
    <div className="location-view-links">
      <a href={links.earth} target="_blank" rel="noopener noreferrer"><Globe2 size={23}/><span><strong>Google Earth</strong><small>Explore satellite imagery</small></span><ArrowUpRight size={17}/></a>
      <a href={links.apple} target="_blank" rel="noopener noreferrer"><Map size={23}/><span><strong>Apple Maps</strong><small>Open this location</small></span><ArrowUpRight size={17}/></a>
    </div>
    <button type="button" className="button small secondary" onClick={download}><Download size={15}/>Download pin for Google Earth Pro</button>
    <small>Open the downloaded .kml file in Google Earth Pro. External maps open only when selected; imagery dates, detail and 3D coverage vary.</small>
  </section>;
}
