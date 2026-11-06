import test from 'node:test'
import assert from 'node:assert/strict'
import {normalizeFlights,mergeFlightSources,formatAltitude,FLIGHT_REGIONS} from './flights.mjs'
test('normalizes real ADS-B positions, height and heading',()=>{
 const data={now:1793534800,ac:[{hex:'7805d5',flight:'CXA8508 ',lat:31.1,lon:117.2,alt_baro:23600,gs:450,track:270,seen_pos:6,r:'B-5488',t:'B738'}]}
 const x=normalizeFlights(data)
 assert.equal(x.length,1);assert.equal(x[0].id,'flight:7805d5')
 assert.equal(x[0].title,'CXA8508');assert.equal(x[0].speedKmh,833)
 assert.equal(x[0].altitudeFt,23600);assert.equal(x[0].heading,270)
 assert.deepEqual(x[0].point,[31.1,117.2]);assert.equal(x[0].when,1793534794000)
})
test('rejects stale, invalid and unsafe aircraft',()=>{
 const x=normalizeFlights({now:1793534800,ac:[
  {hex:'../foo',flight:'fake',lat:40,lon:20},
  {hex:'abcdef',lat:100,lon:0},
  {hex:'abc123',lat:40,lon:20,seen_pos:300},
  {hex:'123abc',flight:'<svg onload=alert(1)>',lat:35,lon:139,alt_baro:'ground',seen_pos:1}
 ]})
 assert.equal(x.length,1);assert.equal(x[0].altitudeFt,'ground')
 assert.ok(!x[0].title.includes('<'))
})
test('formats altitudes and includes China and world choices',()=>{
 assert.equal(formatAltitude(10000,'en'),'3,048 m')
 assert.equal(formatAltitude('ground','zh'),'地面')
 assert.ok(FLIGHT_REGIONS.find(r=>r.id==='shanghai'))
 assert.ok(FLIGHT_REGIONS.find(r=>r.id==='london'))
})

test('provider millisecond timestamps normalize to observation milliseconds',()=>{
 const now=1793969783500
 const [item]=normalizeFlights({now,ac:[{hex:'abcdef',lat:51,lon:0,seen_pos:2}]})
 assert.equal(item.when,now-2000)
})

test('automatic aggregation deduplicates aircraft using newest observation',()=>{
 const a={now:1793969783500,ac:[{hex:'abcdef',lat:51,lon:0,seen_pos:2}]}
 const b={now:1793969784500,ac:[{hex:'abcdef',lat:51.01,lon:0,seen_pos:1},{hex:'123456',lat:52,lon:1,seen_pos:0}]}
 const merged=mergeFlightSources([{provider:'adsb.lol',raw:a},{provider:'adsb.fi',raw:b}])
 assert.equal(merged.length,2)
 assert.equal(merged.find(x=>x.hex==='abcdef').provider,'adsb.fi')
 assert.equal(mergeFlightSources([{provider:'adsb.lol',raw:a}]).length,1)
})
