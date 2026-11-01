import {haversineKm} from './location.mjs'

const real=(v)=>typeof v==='number'&&Number.isFinite(v)
export function deriveFlightInsights(items,center){
 const available=Array.isArray(items)?items.filter(p=>Array.isArray(p?.point)):[],airborne=available.filter(p=>p.altitudeFt!=='ground')
 const fastest=airborne.filter(p=>real(p.speedKmh)).sort((a,b)=>b.speedKmh-a.speedKmh)[0]||null
 const highest=airborne.filter(p=>real(p.altitudeFt)).sort((a,b)=>b.altitudeFt-a.altitudeFt)[0]||null
 const farEnough=center&&real(center.lat)&&real(center.lon)
 const nearest=farEnough?available.map(p=>({...p,km:haversineKm([center.lat,center.lon],p.point)})).sort((a,b)=>a.km-b.km)[0]||null:null
 return {count:available.length,airborne:airborne.length,fastest,highest,nearest}
}
export function recordSessionSample(samples,count,time=Date.now()){
 // Each point is an observed snapshot, not an invented 24-hour history.
 const cleaned=Array.isArray(samples)?samples.slice(-79):[]
 if(cleaned.length&&time-cleaned.at(-1).time<30000)return cleaned
 return [...cleaned,{time,count}].slice(-80)
}
export function makeWorldPulse({sky=[],flight=[],event=[],quake=[],radio=[],visual=null}={}){
 // Real data only. Every item carries a source object, or a labeled local prediction.
 const records=[]
 const sunrise=sky.find(p=>p.skyType==='sunrise'),sunset=sky.find(p=>p.skyType==='sunset')
 if(sunset||sunrise)records.push({kind:'sky',item:sunset||sunrise,reason:'local-sky'})
 if(flight.length)records.push({kind:'flight',item:flight[0],reason:'observed-aircraft',count:flight.length})
 else records.push({kind:'flight',item:null,reason:'explore-aircraft'})
 if(visual)records.push({kind:'scene',item:visual,reason:'satellite-observation'})
 else if(event.length)records.push({kind:'event',item:event[0],reason:'natural-event'})
 else if(quake.length)records.push({kind:'quake',item:quake[0],reason:'earthquake-report'})
 if(radio.length)records.push({kind:'radio',item:radio[0],reason:'audio'})
 return records.slice(0,4)
}
