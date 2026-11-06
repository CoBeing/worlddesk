import test from 'node:test'
import assert from 'node:assert/strict'
import {adaptFr24,fr24Bounds} from './fr24.mjs'
import {mergeFlightSources} from './flights.mjs'
const now=1793970275000
const row=['86D9F4',30.7223,120.6365,228,40100,415,'','T-F7M','B789','JA837A',now/1000,'NRT','HAN','NH897',0,0,'ANA897',0,'ANA']
test('FR24 public feed yields aircraft and airport metadata',()=>{
 const raw=adaptFr24({version:4,full_count:100,abcd:row},now)
 const [plane]=mergeFlightSources([{provider:'fr24',raw}])
 assert.equal(plane.hex,'86d9f4');assert.equal(plane.callsign,'ANA897')
 assert.equal(plane.route.origin.code,'NRT');assert.equal(plane.route.destination.code,'HAN')
 assert.equal(plane.when,now);assert.equal(plane.speedKmh,769)
})
test('reject unsupported format, stale and future rows; do not invent missing airports',()=>{
 assert.throws(()=>adaptFr24({version:5},now))
 assert.equal(adaptFr24({version:4,a:[...row.slice(0,10),now/1000-181,...row.slice(11)]},now).ac.length,0)
 assert.equal(adaptFr24({version:4,a:[...row.slice(0,10),now/1000+20,...row.slice(11)]},now).ac.length,0)
 const missing=[...row];missing[11]='';assert.equal(adaptFr24({version:4,a:missing},now).ac[0].route,null)
})
test('retain FR24 route with newer ADS-B position only when callsign matches',()=>{
 const fr24={provider:'fr24',raw:adaptFr24({version:4,a:row},now)}
 const adsb={provider:'adsb.lol',raw:{now:now+1000,ac:[{hex:'86d9f4',lat:31,lon:121,seen_pos:0,flight:'ANA897'}]}}
 for(const snapshots of [[fr24,adsb],[adsb,fr24]]){
  const [p]=mergeFlightSources(snapshots);assert.equal(p.provider,'adsb.lol');assert.equal(p.route.source,'Flightradar24')
 }
 adsb.raw.ac[0].flight='ANA898'
 assert.equal(mergeFlightSources([fr24,adsb])[0].route,null)
})
test('bounds remain valid at poles and date line',()=>{
 assert.throws(()=>fr24Bounds(91,0,100))
 for(const [lat,lon] of [[31,121],[89,179],[-89,-179]]){
  const [n,s,w,e]=fr24Bounds(lat,lon,230).split(',').map(Number)
  assert.ok(n<=90&&s>=-90&&w>=-180&&e<=180&&n>s&&e>w)
 }
})
