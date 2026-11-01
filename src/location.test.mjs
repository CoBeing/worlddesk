import test from 'node:test'
import assert from 'node:assert/strict'
import {locateByIp,cityById,safePosition,haversineKm} from './location.mjs'
test('IP location extracts coarse lat lon and never raw IP',()=>{
 const x=safePosition({latitude:'31.20',longitude:'121.50',country_code:'CN',city:'Shanghai',ip:'secret'})
 assert.deepEqual(x,{lat:31.2,lon:121.5,country:'CN',city:'Shanghai',tz:'Asia/Shanghai',kind:'ip'})
 assert.equal(safePosition({latitude:999,longitude:1}),null)
})
test('IP geolocation falls back gracefully and times out',async()=>{
 let count=0
 const fetcher=async()=>{count++;if(count===1)throw Error('unreachable');return {ok:true,json:async()=>({latitude:25,longitude:110,country_code:'CN',city:'Guilin'})}}
 const x=await locateByIp(fetcher)
 assert.equal(count,2);assert.equal(x.country,'CN')
})
test('city selection is independent of IP and distances are sane',()=>{
 assert.equal(cityById('shanghai').country,'CN')
 assert.ok(haversineKm([31.23,121.47],[39.9,116.4])>950)
 assert.equal(haversineKm(null,[0,0]),Infinity)
})
