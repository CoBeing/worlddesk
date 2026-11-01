// Read-only, public real-world feeds. Delayed and historical values are not "live tracking".
export const FEEDS=Object.freeze({
 earthquakes:'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
 events:'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100',
 radio:'https://de1.api.radio-browser.info/json/stations/topvote/80?hidebroken=true',
 radioChina:'https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/CN?hidebroken=true&order=votes&reverse=true&limit=80'
})
const finite=(v)=>typeof v==='number'&&Number.isFinite(v)
export function httpsUrl(value){
 try{const u=new URL(value);return u.protocol==='https:'?u.href:null}catch{return null}
}
export function mediaUrl(value){
 try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}
}
export function geoPoint(value){
 if(!Array.isArray(value))return null
 if(value.length>=2&&finite(value[0])&&finite(value[1])&&Math.abs(value[0])<=180&&Math.abs(value[1])<=90)return [value[1],value[0]]
 return geoPoint(value[0])
}
const record=(id,kind,title,subtitle,when,point,url,extra={})=>({
 id:String(id),kind,title:String(title||'未命名现象'),subtitle:String(subtitle||''),
 when:finite(when)?when:null,point,sourceUrl:httpsUrl(url),...extra
})
export function normalizeQuakes(raw){
 if(!Array.isArray(raw?.features))return []
 return raw.features.slice(0,250).flatMap(f=>{
  const p=f?.properties||{},point=geoPoint(f?.geometry?.coordinates)
  if(!point)return []
  const mag=Number(p.mag)
  return [record('quake:'+String(f.id),'quake','M '+(Number.isFinite(mag)?mag.toFixed(1):'?')+' · '+String(p.place||'未知位置'),
   'USGS · 地震观测记录',Number(p.time),point,p.url,{magnitude:Number.isFinite(mag)?mag:null})]
 })
}
export function normalizeEonet(raw){
 if(!Array.isArray(raw?.events))return []
 return raw.events.flatMap(e=>{
  const g=(e.geometry||[]).at(-1),point=geoPoint(g?.coordinates)
  if(!point)return []
  const cat=(e.categories||[]).map(c=>c.title).filter(Boolean).join(' · ')||'自然事件'
  const when=Date.parse(g?.date||'')
  return [record('event:'+e.id,'event',e.title,cat,when,point,e.link,{category:cat})]
 })
}
export function normalizeRadios(raw){
 if(!Array.isArray(raw))return []
 const seen=new Set()
 return raw.flatMap(s=>{
  if(s.lastcheckok!==1&&s.lastcheckok!==true&&s.lastcheckok!=='1'&&s.lastcheckok!==undefined)return []
  const streamUrl=mediaUrl(s.url_resolved||s.url),id='radio:'+String(s.stationuuid||s.url)
  if(!streamUrl||seen.has(id))return []
  seen.add(id)
  return [record(id,'radio',String(s.name||'未知电台').trim().slice(0,120),
   String(s.country||s.countrycode||'未知地区')+(s.tags?' · '+s.tags.split(',').slice(0,2).join(' / '):''),
   null,null,'https://www.radio-browser.info/',{streamUrl,country:String(s.country||s.countrycode||'未知地区'),codec:String(s.codec||'未知')})]
 }).slice(0,80)
}
export function safeSnapshot(item){
 if(!item||!['quake','event','radio','sky'].includes(item.kind)||typeof item.id!=='string')return null
 const x={id:item.id.slice(0,200),kind:item.kind,title:String(item.title||'').slice(0,250),
  subtitle:String(item.subtitle||'').slice(0,250),when:finite(item.when)?item.when:null,
  point:item.point?geoPoint([item.point[1],item.point[0]]):null,sourceUrl:httpsUrl(item.sourceUrl)}
 if(item.kind==='quake')x.magnitude=finite(item.magnitude)?item.magnitude:null
 if(item.kind==='sky'){
  x.titleKey=String(item.titleKey||'').slice(0,80)
  x.subtitleKey=String(item.subtitleKey||'').slice(0,80)
  x.skyType=String(item.skyType||'').slice(0,40)
  x.locationName=String(item.locationName||'').slice(0,80)
  x.tz=String(item.tz||'UTC').slice(0,80)
  x.moonFraction=finite(item.moonFraction)?item.moonFraction:null
  x.moonPhase=finite(item.moonPhase)?item.moonPhase:null
 }
 if(item.kind==='event')x.category=String(item.category||'').slice(0,140)
 if(item.kind==='radio'){
  x.streamUrl=mediaUrl(item.streamUrl);x.country=String(item.country||'').slice(0,120)
  x.codec=String(item.codec||'').slice(0,40)
 }
 return x
}
