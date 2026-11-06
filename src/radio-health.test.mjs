import test from 'node:test'
import assert from 'node:assert/strict'
import {createRadioHealth,probeRadio,RADIO_FAIL_TTL,RADIO_OK_TTL} from './radio-health.mjs'
const station={id:'radio:a',streamUrl:'https://example.com/stream'}
test('failed stations are temporarily hidden and recover without user action',()=>{
 let now=1000;const health=createRadioHealth([],()=>now)
 health.record(station,'failed');assert.equal(health.available(station),false)
 assert.equal(health.needsCheck(station),false)
 const restored=createRadioHealth(health.snapshot(),()=>now);assert.equal(restored.available(station),false)
 now+=RADIO_FAIL_TTL;assert.equal(health.available(station),true);assert.equal(health.needsCheck(station),true)
})
test('success is cached; changed streams and uncertain timeouts do not stay hidden',()=>{
 let now=1000;const h=createRadioHealth([],()=>now)
 h.record(station,'ok');assert.equal(h.needsCheck(station),false)
 now+=RADIO_OK_TTL;assert.equal(h.needsCheck(station),true)
 h.record(station,'failed');assert.equal(h.available({...station,streamUrl:'https://example.com/new'}),true)
 h.record(station,'unknown');assert.equal(h.available(station),true);assert.equal(h.needsCheck(station),false)
})
function fakeAudio(){return {src:'',load(){},pause(){this.stopped=true},removeAttribute(){this.src=''}}}
test('probe stays muted, cleans up and distinguishes failure from cancellation',async()=>{
 const a=fakeAudio(),p=probeRadio(station.streamUrl,{audioFactory:()=>a})
 assert.equal(a.muted,true);assert.equal(a.volume,0)
 a.error={code:4};a.onerror();assert.equal(await p,'failed');assert.equal(a.src,'');assert.ok(a.stopped)
 const controller=new AbortController(),b=fakeAudio(),q=probeRadio(station.streamUrl,{audioFactory:()=>b,signal:controller.signal})
 controller.abort();assert.equal(await q,'cancelled');assert.equal(b.src,'')
 const c=fakeAudio(),r=probeRadio(station.streamUrl,{audioFactory:()=>c});c.oncanplay();assert.equal(await r,'ok')
})
