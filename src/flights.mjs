// WorldDesk aviation preview. Open ADS-B receptions, not Flightradar24 data.
// Licensed ODbL 1.0, credited to adsb.lol contributors. Position accuracy and
// coverage can vary, especially around mainland China. Never use for navigation.
export const FLIGHT_PROVIDER='https://www.adsb.lol/'
export const FLIGHT_RADIUS_NM=230
export const FLIGHT_REGIONS=Object.freeze([
 {id:'current',zh:'当前观测地',en:'Your viewing area'},
 {id:'shanghai',zh:'上海及周边',en:'Shanghai area',lat:31.2304,lon:121.4737},
 {id:'beijing',zh:'北京及周边',en:'Beijing area',lat:39.9042,lon:116.4074},
 {id:'guangzhou',zh:'广州 / 珠三角',en:'Guangzhou / Pearl River Delta',lat:23.1291,lon:113.2644},
 {id:'hongkong',zh:'香港及周边',en:'Hong Kong area',lat:22.3193,lon:114.1694},
 {id:'tokyo',zh:'东京及周边',en:'Tokyo area',lat:35.6762,lon:139.6503},
 {id:'singapore',zh:'新加坡及周边',en:'Singapore area',lat:1.3521,lon:103.8198},
 {id:'london',zh:'伦敦 / 希思罗',en:'London / Heathrow',lat:51.4700,lon:-0.4543}
])
const number=v=>typeof v==='number'&&Number.isFinite(v)
const clean=(v,limit=80)=>String(v||'').replace(/[<>\u0000-\u001F]/g,'').trim().slice(0,limit)
const normalizePlane=(p,now)=>{
 if(typeof p?.hex!=='string'||!/^[a-f0-9]{6}$/i.test(p.hex))return null
 if(!number(p.lat)||!number(p.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180)return null
 const age=number(p.seen_pos)?Math.max(0,p.seen_pos):null
 // Positions older than 180 seconds are stale and will not be used for "now".
 if(age!==null&&age>180)return null
 const call=clean(p.flight,32)
 const altitude=number(p.alt_baro)?Math.max(-500,Math.round(p.alt_baro)):(p.alt_baro==='ground'?'ground':null)
 const speed=number(p.gs)?Math.round(p.gs*1.852):null
 const heading=number(p.track)?((p.track%360)+360)%360:null
 const seenAge=age===null?null:Math.round(age)
 const when=number(now)&&age!==null?Math.round((now-age)*1000):null
 return {
  id:'flight:'+p.hex.toLowerCase(),kind:'flight',
  hex:p.hex.toLowerCase(),callsign:call,registration:clean(p.r,32),
  aircraftType:clean(p.t,32),
  title:call||clean(p.r,32)||p.hex.toUpperCase(),
  subtitle:[clean(p.t,32),clean(p.r,32)].filter(Boolean).join(' · ')||p.hex.toUpperCase(),
  point:[p.lat,p.lon],heading,altitudeFt:altitude,speedKmh:speed,
  ageSeconds:seenAge,when,sourceUrl:FLIGHT_PROVIDER
 }
}
export function normalizeFlights(raw){
 if(!Array.isArray(raw?.ac))return []
 const now=number(raw.now)?raw.now:Date.now()/1000
 return raw.ac.map(p=>normalizePlane(p,now)).filter(Boolean).slice(0,250)
}
export function formatAltitude(alt,lang='zh'){
 if(alt==='ground')return lang==='zh'?'地面':'Ground'
 if(!number(alt))return lang==='zh'?'未知':'Unknown'
 return Math.round(alt*0.3048).toLocaleString(lang==='zh'?'zh-CN':'en-US')+' m'
}
export function aircraftDataAge(item,lang='zh'){
 if(!number(item?.ageSeconds))return lang==='zh'?'位置时间未知':'Position age unknown'
 const s=Math.round(item.ageSeconds)
 return lang==='zh'?s+' 秒前收到位置':'Position received '+s+'s ago'
}
