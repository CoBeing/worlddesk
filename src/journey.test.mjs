import test from 'node:test'
import assert from 'node:assert/strict'
import {journeyPoints} from './journey.mjs'
test('journey arcs connect endpoints and cross date line without a world-spanning jump',()=>{
 const points=journeyPoints([35,139],[37,-122])
 assert.equal(points.length,49)
 assert.ok(Math.abs(points[0][0]-35)<1e-8)
 assert.ok(Math.abs(points.at(-1)[0]-37)<1e-8)
 for(let i=1;i<points.length;i++)assert.ok(Math.abs(points[i][1]-points[i-1][1])<180)
 assert.deepEqual(journeyPoints(null,[1,2]),[])
 assert.deepEqual(journeyPoints([1,2],[1,2]),[[1,2],[1,2]])
})
