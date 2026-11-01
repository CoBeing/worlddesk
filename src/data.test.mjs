import test from 'node:test'
import assert from 'node:assert/strict'
import {normalizeQuakes,normalizeEonet,normalizeRadios,geoPoint,httpsUrl,safeSnapshot} from './data.mjs'
test('observations keep real coordinates and timestamps',()=>{
 const items=normalizeQuakes({features:[{id:'a',properties:{mag:3.5,place:'Japan',time:1790000000000,url:'https://earthquake.usgs.gov/a'},geometry:{coordinates:[139.7,35.7,20]}}]})
 assert.deepEqual(items[0].point,[35.7,139.7])
 assert.equal(items[0].title,'M 3.5 · Japan')
})
test('EONET understands Polygon coordinates',()=>{
 const items=normalizeEonet({events:[{id:'wildfire',title:'Wildfire',link:'https://eonet.gsfc.nasa.gov/a',geometry:[{date:'2026-11-01T00:00:00Z',coordinates:[[[25,35],[26,36]]]}]}]})
 assert.deepEqual(items[0].point,[35,25])
})
test('radio streams are validated and deduplicated',()=>{
 const items=normalizeRadios([{stationuuid:'X',name:'A',url_resolved:'https://example.org/stream',lastcheckok:1},{stationuuid:'X',name:'B',url:'https://example.org/other',lastcheckok:1},{stationuuid:'Z',url:'javascript:alert(1)'}])
 assert.equal(items.length,1)
})
test('reject untrusted URL schemes and impossible coordinates',()=>{
 assert.equal(httpsUrl('javascript:alert(1)'),null)
 assert.equal(geoPoint([999,999]),null)
})
test('favorites retain only approved fields',()=>{
 const x=safeSnapshot({id:'radio:1',kind:'radio',title:'A',extra:'secret',streamUrl:'http://example.com/stream'})
 assert.equal(x.extra,undefined);assert.equal(x.streamUrl,'http://example.com/stream')
})
