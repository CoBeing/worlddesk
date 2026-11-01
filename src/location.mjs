// Coarse, opt-out-able public-IP location on the visitor's own device.
// Never sends an IP to our server; the geolocation service sees the caller's public IP.
// Never requests navigator.geolocation or stores raw IP coordinates.
export const CITIES=Object.freeze([
 {id:'beijing',zh:'北京',en:'Beijing',lat:39.904,lon:116.407,tz:'Asia/Shanghai',country:'CN'},
 {id:'shanghai',zh:'上海',en:'Shanghai',lat:31.230,lon:121.473,tz:'Asia/Shanghai',country:'CN'},
 {id:'guangzhou',zh:'广州',en:'Guangzhou',lat:23.129,lon:113.264,tz:'Asia/Shanghai',country:'CN'},
 {id:'shenzhen',zh:'深圳',en:'Shenzhen',lat:22.543,lon:114.057,tz:'Asia/Shanghai',country:'CN'},
 {id:'hangzhou',zh:'杭州',en:'Hangzhou',lat:30.275,lon:120.155,tz:'Asia/Shanghai',country:'CN'},
 {id:'chengdu',zh:'成都',en:'Chengdu',lat:30.573,lon:104.067,tz:'Asia/Shanghai',country:'CN'},
 {id:'chongqing',zh:'重庆',en:'Chongqing',lat:29.562,lon:106.551,tz:'Asia/Shanghai',country:'CN'},
 {id:'wuhan',zh:'武汉',en:'Wuhan',lat:30.594,lon:114.305,tz:'Asia/Shanghai',country:'CN'},
 {id:'xian',zh:'西安',en:"Xi'an",lat:34.341,lon:108.940,tz:'Asia/Shanghai',country:'CN'},
 {id:'kunming',zh:'昆明',en:'Kunming',lat:25.039,lon:102.713,tz:'Asia/Shanghai',country:'CN'},
 {id:'hongkong',zh:'香港',en:'Hong Kong',lat:22.320,lon:114.169,tz:'Asia/Hong_Kong',country:'HK'},
 {id:'taipei',zh:'台北',en:'Taipei',lat:25.033,lon:121.565,tz:'Asia/Taipei',country:'TW'},
 {id:'singapore',zh:'新加坡',en:'Singapore',lat:1.352,lon:103.820,tz:'Asia/Singapore',country:'SG'},
 {id:'tokyo',zh:'东京',en:'Tokyo',lat:35.677,lon:139.650,tz:'Asia/Tokyo',country:'JP'},
 {id:'london',zh:'伦敦',en:'London',lat:51.507,lon:-0.128,tz:'Europe/London',country:'GB'},
 {id:'newyork',zh:'纽约',en:'New York',lat:40.713,lon:-74.006,tz:'America/New_York',country:'US'},
])
export function cityById(id){return CITIES.find(c=>c.id===id)||null}
export function safePosition(raw){
 if(raw?.latitude===undefined||raw?.longitude===undefined||raw?.latitude===null||raw?.longitude===null)return null
 const lat=Number(raw.latitude),lon=Number(raw.longitude)
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null
 const country=String(raw.country_code||raw.country||'').toUpperCase().slice(0,3)
 const city=String(raw.city||'').trim().slice(0,70)
 return {lat,lon,country,city,tz:typeof raw.timezone==='string'&&raw.timezone.includes('/')?raw.timezone:(country==='CN'?'Asia/Shanghai':'UTC'),kind:'ip'}
}
export const GEO_ENDPOINTS=[
 {url:'https://get.geojs.io/v1/ip/geo.json',pick:safePosition},
 {url:'https://ipwho.is/',pick:data=>data.success===false?null:safePosition(data)}
]
export async function locateByIp(fetcher=fetch,timeoutMs=3500){
 for(const endpoint of GEO_ENDPOINTS){
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),timeoutMs)
  try{
   const response=await fetcher(endpoint.url,{signal:controller.signal,cache:'no-store'})
   if(!response.ok)continue
   const pos=endpoint.pick(await response.json())
   if(pos)return {...pos,source:new URL(endpoint.url).hostname}
  }catch{/* explicit fallback to next provider */}
  finally{clearTimeout(timer)}
 }
 return null
}
export function haversineKm(a,b){
 if(!a||!b)return Number.POSITIVE_INFINITY
 const x=Math.PI/180,dlat=(b[0]-a[0])*x,dlon=(b[1]-a[1])*x
 const s=Math.sin(dlat/2)**2+Math.cos(a[0]*x)*Math.cos(b[0]*x)*Math.sin(dlon/2)**2
 return 12742*Math.asin(Math.min(1,Math.sqrt(s)))
}
