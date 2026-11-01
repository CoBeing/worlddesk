// OpenFreeMap public vector tiles, keyless and commercial-use allowed.
// Preserve a bundled Natural Earth coastline fallback when an overseas map
// service is unreachable from mainland China.
// Source: https://openfreemap.org/quick_start/
import {maplibreGL} from '@maplibre/maplibre-gl-leaflet'
import {setWorkerUrl} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)

const BASE='https://tiles.openfreemap.org/styles/'
export const MAP_STYLES=Object.freeze({
  bright:BASE+'liberty',
  dark:BASE+'dark',
  offline:null
})
export function createBasemapController(map,offlineLayer,onState=()=>{}){
 let layer=null,active='offline'
 let timeout=null
 const fallBack=message=>{
  if(layer){map.removeLayer(layer);layer=null}
  if(!map.hasLayer(offlineLayer))offlineLayer.addTo(map)
  active='offline'
  onState({style:active,status:'fallback',message})
 }
 function switchTo(style){
  const target=Object.hasOwn(MAP_STYLES,style)?style:'offline'
  if(target==='offline'){
   fallBack(null);onState({style:'offline',status:'ready'})
   return
  }
  if(layer&&target===active){
   onState({style:active,status:'ready'});return
  }
  if(layer){
   map.removeLayer(layer);layer=null
  }
  if(!map.hasLayer(offlineLayer))offlineLayer.addTo(map)
  active=target
  onState({style:target,status:'loading'})
  try{
   const candidate=maplibreGL({style:MAP_STYLES[target],interactive:false,attribution:'© OpenMapTiles · © OpenStreetMap contributors'})
   layer=candidate
   candidate.addTo(map)
   const inner=candidate.getMaplibreMap()
   clearTimeout(timeout)
   let ready=false
   const success=()=>{
    ready=true;clearTimeout(timeout)
    if(map.hasLayer(offlineLayer))map.removeLayer(offlineLayer)
    onState({style:target,status:'ready'})
   }
   const failure=(evt)=>{
    // Only react to actual source failures. A glyph may occasionally be
    // missing without making the full map unusable.
    const msg=String(evt?.error?.message||'')
    if(!ready&&/fetch|network|style|source|failed|cors|404|403|503|timeout/i.test(msg)){
     clearTimeout(timeout)
     fallBack(msg)
    }
   }
   inner.once('load',success)
   inner.on('error',failure)
   timeout=setTimeout(()=>{if(!ready)fallBack('Map service unavailable')},14000)
  }catch(error){fallBack(String(error?.message||'Map style unavailable'))}
 }
 return {setStyle:switchTo,getStyle:()=>active,dispose:()=>{
  clearTimeout(timeout)
  if(layer)map.removeLayer(layer)
  layer=null
 }}
}
