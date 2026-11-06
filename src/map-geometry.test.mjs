import test from 'node:test'
import assert from 'node:assert/strict'
import {unwrapLand} from './map-geometry.mjs'
test('dateline polygons remain local without changing source or polar closure',()=>{
 const source={type:'Polygon',coordinates:[[[179,50],[-179,50],[-179,55],[179,55],[179,50]]]}
 const result=unwrapLand(source).coordinates[0]
 assert.ok(Math.max(...result.map(p=>p[0]))-Math.min(...result.map(p=>p[0]))<=2)
 assert.equal(source.coordinates[0][1][0],-179)
 assert.deepEqual(result[0],result.at(-1))
 const polar={type:'Polygon',coordinates:[[[-180,-85],[-90,-80],[0,-85],[90,-80],[180,-85],[-180,-85]]]}
 assert.deepEqual(unwrapLand(polar),polar)
})
