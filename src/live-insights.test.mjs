import test from 'node:test'
import assert from 'node:assert/strict'
import {deriveFlightInsights,recordSessionSample,makeWorldPulse} from './live-insights.mjs'
test('flight insights use only actual supplied aircraft data',()=>{
 const a={id:'a',title:'AAA',point:[31.23,121.47],altitudeFt:33000,speedKmh:750}
 const b={id:'b',title:'BBB',point:[31.0,121.2],altitudeFt:29000,speedKmh:890}
 const d=deriveFlightInsights([a,b],{lat:31.23,lon:121.47})
 assert.equal(d.count,2);assert.equal(d.fastest.id,'b');assert.equal(d.highest.id,'a');assert.equal(d.nearest.km,0)
})
test('history never claims 24h without session samples',()=>{
 const first=recordSessionSample([],8,100000)
 assert.deepEqual(first,[{time:100000,count:8}])
 assert.equal(recordSessionSample(first,9,120000).length,1)
 assert.equal(recordSessionSample(first,9,140000).length,2)
})
test('pulse never invents live events',()=>{
 const x=makeWorldPulse({sky:[{skyType:'sunset',id:'s'}]})
 assert.equal(x.length,2)
 assert.equal(x[0].reason,'local-sky')
 assert.equal(x[1].item,null)
})

test('visual observation beats sparse generic event text when imagery exists',()=>{
 const q=makeWorldPulse({event:[{id:'fire'}],visual:{id:'sat:asia'},sky:[{id:'s',skyType:'sunset'}]})
 assert.equal(q[2].kind,'scene')
 assert.equal(q[2].item.id,'sat:asia')
})
