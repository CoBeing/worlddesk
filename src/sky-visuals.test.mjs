import test from 'node:test'
import assert from 'node:assert/strict'
import {phaseIndex,moonSvg,relationSvg,PHASES} from './sky-visuals.mjs'
import {calendarDay,calendarText} from './seasonal-calendar.mjs'
test('quarters and cycle boundary have distinct labels and illumination sides',()=>{
 assert.equal(PHASES.zh[phaseIndex(.25)],'上弦月')
 assert.equal(PHASES.zh[phaseIndex(.75)],'下弦月')
 assert.equal(phaseIndex(.999),0)
 const points=p=>moonSvg(p).match(/points="([^"]+)"/)[1].split(' ').map(x=>x.split(',').map(Number))
 assert.ok(points(.25).every(([x])=>x>=50-1e-10))
 assert.ok(points(.75).every(([x])=>x<=50+1e-10))
 for(const p of [0,.125,.25,.5,.75,1])assert.ok(!moonSvg(p).includes('NaN'))
 assert.match(relationSvg(0),/cx="169"/)
 assert.match(relationSvg(.5),/cx="321"/)
})
test('festivals include lunar and solar dates without claiming official days off',()=>{
 assert.ok(calendarDay('2026-02-17').festivals.includes('春节'))
 assert.ok(calendarDay('2026-10-01').festivals.includes('国庆节'))
 assert.match(calendarText(calendarDay('2026-02-17'),'zh').holidayNote,/不代表官方/)
})
