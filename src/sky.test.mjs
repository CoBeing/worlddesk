import test from 'node:test'
import assert from 'node:assert/strict'
import {skyObservations,formatAtLocation} from './sky.mjs'
test('China sky entries are local calculations and stable',()=>{
 const city={lat:31.23,lon:121.47,id:'shanghai',zh:'上海',tz:'Asia/Shanghai'}
 const now=new Date('2026-11-01T04:00:00Z')
 const rows=skyObservations(city,now)
 assert.equal(rows.length,3)
 assert.ok(rows[0].when>now.getTime())
 assert.ok(rows[1].when>now.getTime())
 assert.ok(rows[2].moonFraction>=0&&rows[2].moonFraction<=1)
 assert.equal(rows[0].sourceUrl,null)
 assert.match(formatAtLocation(rows[0].when,city.tz,'zh'),/11月/)
})
