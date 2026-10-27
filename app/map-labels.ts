import type * as Leaflet from "leaflet";
import {LABEL_URLS, MAP_MAX_ZOOM} from "../lib/map-tiles";

export function mapLabels(L: typeof Leaflet, map: Leaflet.Map, onError?: (failed: boolean) => void) {
  if (!map.getPane("place-labels")) {
    const pane=map.createPane("place-labels");pane.style.zIndex="350";pane.style.pointerEvents="none";
  }
  const failed=new Set<number>();
  return L.layerGroup(LABEL_URLS.map((url,index)=>{
    const layer=L.tileLayer(url,{pane:"place-labels",maxZoom:MAP_MAX_ZOOM,maxNativeZoom:19,keepBuffer:1,
      attribution:index===0?'Labels © <a href="https://www.arcgis.com/home/item.html?id=c03a526d94704bfb839445e80de95495" target="_blank" rel="noreferrer">Esri and contributors</a>':undefined});
    layer.on("tileerror",()=>{failed.add(index);onError?.(true);});
    layer.on("tileload",()=>{failed.delete(index);onError?.(failed.size>0);});
    return layer;
  }));
}
