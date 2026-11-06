// Desktop-direct public web-feed adapter. This is not the official paid FR24 API.
export function fr24Bounds(lat,lon,dist){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||!Number.isFinite(dist)||dist<5||dist>250)throw new RangeError('Invalid flight region')
 const dy=dist/60,dx=Math.min(180,dy/Math.max(.1,Math.cos(lat*Math.PI/180)))
 return [Math.min(90,lat+dy),Math.max(-90,lat-dy),Math.max(-180,lon-dx),Math.min(180,lon+dx)].map(x=>x.toFixed(4)).join(',')
}
export function adaptFr24(raw,now=Date.now()){
 if(!raw||typeof raw!=='object'||raw.version!==4)throw new Error('Unsupported FR24 feed format')
 const ac=[]
 for(const [id,row] of Object.entries(raw)){
  if(!/^[a-f0-9]+$/i.test(id)||!Array.isArray(row)||row.length<17)continue
  const timestamp=row[10]
  if(!Number.isFinite(timestamp)||timestamp*1000>now+10000||now-timestamp*1000>180000)continue
  const airport=v=>typeof v==='string'&&/^[A-Z]{3,4}$/.test(v)?v:null
  const origin=airport(row[11]),destination=airport(row[12])
  ac.push({hex:row[0],lat:row[1],lon:row[2],track:row[3],alt_baro:row[14]===1?'ground':row[4],gs:row[5],t:row[8],r:row[9],seen_pos:Math.max(0,now/1000-timestamp),flight:row[16]||row[13],
   route:origin&&destination?{origin:{code:origin,name:''},destination:{code:destination,name:''},source:'Flightradar24',sourceUrl:'https://www.flightradar24.com/',callsign:row[16]||row[13],observedAt:timestamp*1000}:null})
  if(ac.length>=1200)break
 }
 return {ac,now:now/1000,provider:'fr24'}
}
