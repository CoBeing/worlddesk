import {haversineKm} from './location.mjs'
// Session-only observations. Never reconstruct a route from airport endpoints.
export function appendTrack(points,item,now=Date.now()){
 const previous=points.filter(p=>now-p.at<=3600000).slice(-179)
 if(!Number.isFinite(item?.when)||!Array.isArray(item?.point)||item.point.length!==2||!item.point.every(Number.isFinite))return previous
 if(Math.abs(item.point[0])>90||Math.abs(item.point[1])>180||now-item.when>180000||item.when>now+10000)return previous
 const last=previous.at(-1)
 if(last&&item.when<=last.at)return previous
 return [...previous,{point:[...item.point],at:item.when,source:item.provider}]
}
export function trackSegments(points){
 const result=[];let segment=[]
 for(const p of points){
  const last=segment.at(-1)
  if(last&&(p.at-last.at>180000||Math.abs(p.point[1]-last.point[1])>180||haversineKm(p.point,last.point)/Math.max((p.at-last.at)/3600000,1e-9)>1600)){
   if(segment.length>1)result.push(segment.map(x=>x.point));segment=[]
  }
  segment.push(p)
 }
 if(segment.length>1)result.push(segment.map(x=>x.point))
 return result
}
const clean=v=>String(v||'').replace(/[<>\u0000-\u001f]/g,'').slice(0,120)
export function normalizeRoute(raw,callsign){
 const r=raw?.response?.flightroute
 if(!r||![r.callsign,r.callsign_icao,r.callsign_iata].some(x=>typeof x==='string'&&x.toUpperCase()===callsign.toUpperCase()))return null
 const airport=a=>a&&/^[A-Z0-9]{3,4}$/.test(a.icao_code||a.iata_code||'')?{
  code:clean(a.iata_code||a.icao_code),icao:clean(a.icao_code),name:clean(a.name),city:clean(a.municipality)
 }:null
 const origin=airport(r.origin),destination=airport(r.destination)
 return origin&&destination?{origin,destination,via:airport(r.midpoint),source:'adsbdb',sourceUrl:'https://www.adsbdb.com/'}:null
}
