import test from 'node:test'
import assert from 'node:assert/strict'
import {initialScenes,normalizeEpic,utcTimeSlots,CHINA_SCENES} from './cinema.mjs'
test('starting experience has watchable local images and real attribution',()=>{
 const scenes=initialScenes()
 assert.equal(scenes.length,6)
 for(const scene of scenes){
  assert.equal(scene.kind,'scene')
  assert.ok(scene.photoUrl.startsWith('/scenes/'))
  assert.ok(scene.author&&scene.license&&scene.sourceUrl?.startsWith('https://'))
 }
 assert.ok(CHINA_SCENES.every(s=>s.license.startsWith('CC BY-SA')))
})
test('EPIC metadata converts only valid official image identifiers',()=>{
 const x=normalizeEpic([{image:'epic_1b_20261029123456',date:'2026-10-29 12:34:56'},{image:'../evil',date:'2026-10-29 12:34:56'}])
 assert.equal(x.length,1)
 assert.equal(x[0].url,'https://epic.gsfc.nasa.gov/archive/natural/2026/10/29/jpg/epic_1b_20261029123456.jpg')
})
test('JMA frames are exactly ten-minute UTC slots with latency',()=>{
 const date=Date.parse('2026-11-01T14:57:00Z')
 const frames=utcTimeSlots(date,5)
 assert.equal(frames.length,5)
 assert.equal(frames.at(-1).slot,'1430')
 assert.ok(frames[0].url.startsWith('https://www.data.jma.go.jp/'))
})
