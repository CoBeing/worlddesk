import test from 'node:test'
import assert from 'node:assert/strict'
import {appendTrack,trackSegments,normalizeRoute} from './flight-tracks.mjs'
import {normalizeFlights} from './flights.mjs'
test('tracks reject stale, backwards and malformed positions, and expire session history',()=>{
 const now=200000000,plane={point:[20,30],when:now,provider:'adsb.lol'}
 const first=appendTrack([],plane,now)
 assert.equal(appendTrack(first,plane,now).length,1)
 assert.equal(appendTrack(first,{...plane,when:now-200000},now).length,1)
 assert.equal(appendTrack(first,{...plane,point:[91,0],when:now+1},now).length,1)
 assert.equal(appendTrack(first,{...plane,when:now+4000000},now+4000000).length,1)
})
test('track segments never bridge gaps, dateline or implausible jumps',()=>{
 const p=(at,lon,source='adsb.lol')=>({at,point:[20,lon],source})
 const segments=trackSegments([p(0,179),p(60000,179.01),p(120000,-179),p(180000,-178.99),p(500000,-177),p(560000,-176.99,'adsb.fi'),p(620000,-176.98,'adsb.fi')])
 assert.equal(segments.length,3)
 assert.deepEqual(segments[0],[[20,179],[20,179.01]])
 assert.equal(trackSegments([p(0,1)]).length,0)
})
test('airport metadata requires matching callsign and both valid endpoints',()=>{
 const raw={response:{flightroute:{callsign_icao:'BAW123',origin:{icao_code:'EGLL',iata_code:'LHR',name:'Heathrow'},destination:{icao_code:'OTHH',iata_code:'DOH',name:'Hamad'}}}}
 assert.equal(normalizeRoute(raw,'BAW123').origin.code,'LHR')
 assert.equal(normalizeRoute(raw,'BAW124'),null)
 assert.equal(normalizeRoute({response:{flightroute:{...raw.response.flightroute,destination:null}}},'BAW123'),null)
})
test('both position sources retain their own attribution',()=>{
 const raw={now:1000,ac:[{hex:'abcdef',lat:20,lon:30,seen_pos:1}]}
 assert.equal(normalizeFlights(raw,'adsb.fi')[0].sourceUrl,'https://adsb.fi/')
 assert.equal(normalizeFlights(raw)[0].provider,'adsb.lol')
 assert.throws(()=>normalizeFlights(raw,'unknown'))
})

test('source handoff keeps a plausible continuous track',()=>{
 assert.equal(trackSegments([{at:0,point:[20,30],source:'adsb.lol'},{at:60000,point:[20.01,30.01],source:'adsb.fi'}]).length,1)
})
