import test from 'node:test'
import assert from 'node:assert/strict'
import {aircraftIcon} from './aircraft-icon.mjs'
import {adaptFr24} from './fr24.mjs'
import {mergeFlightSources} from './flights.mjs'
test('provider compass tracks rotate a north-facing SVG consistently',()=>{
 const now=Date.now()
 for(const heading of [0,90,180,270,359]){
  const row=['abc123',31,121,heading,30000,400,'','','A320','B-1234',now/1000,'PVG','PEK','TEST1',0,0,'TEST1']
  for(const provider of ['fr24','adsb.lol','adsb.fi']){
   const raw=provider==='fr24'?adaptFr24({version:4,abcd:row},now):{ac:[{hex:'abc123',lat:31,lon:121,track:heading,seen_pos:0}],now:now/1000}
   const [plane]=mergeFlightSources([{provider,raw}])
   assert.equal(plane.heading,heading)
   assert.match(aircraftIcon(plane.heading),new RegExp(`rotate\\(${heading}deg\\)`))
   assert.ok(!aircraftIcon(plane.heading).includes('✈'))
  }
 }
})
test('unknown direction stays neutral and angles normalize safely',()=>{
 for(const value of [null,undefined,NaN,Infinity,'90']){
  assert.match(aircraftIcon(value),/<circle/)
  assert.ok(!aircraftIcon(value).includes('rotate'))
 }
 assert.match(aircraftIcon(-90),/rotate\(270deg\)/)
 assert.match(aircraftIcon(450),/rotate\(90deg\)/)
})
