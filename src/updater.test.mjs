import test from 'node:test'
import assert from 'node:assert/strict'
import { mountUpdater } from './updater.mjs'

test('updates stay quiet, avoid duplicate checks and install only on click', async () => {
  const originals = Object.fromEntries(['document','navigator','setTimeout','setInterval'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis,k)]))
  const button = {setAttribute(){}}
  let scheduled, interval, checks = 0, installs = 0, restarts = 0
  try {
    Object.defineProperty(globalThis,'document',{configurable:true,value:{hidden:false,createElement:()=>button,querySelector:()=>({before(){}})}})
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}})
    globalThis.setTimeout = fn => { scheduled = fn }
    globalThis.setInterval = (fn, ms) => { interval = ms }
    mountUpdater({native:()=>true,checkUpdate:async()=>{checks++; return {version:'0.2.0',downloadAndInstall:async callback=>{installs++; callback({event:'Started',data:{contentLength:100}}); callback({event:'Progress',data:{chunkLength:50}})}}},restart:async()=>{restarts++}})
    assert.equal(button.hidden,true)
    assert.equal(interval,21600000)
    assert.equal(checks,0)
    await scheduled()
    await scheduled()
    assert.equal(checks,1)
    assert.equal(installs,0)
    assert.equal(button.textContent,'更新至 0.2.0')
    await button.onclick()
    assert.equal(installs,1)
    assert.equal(restarts,0)
    assert.equal(button.textContent,'重启使用新版')
    await button.onclick()
    assert.equal(restarts,1)
  } finally {
    for (const [k,descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis,k,descriptor)
      else delete globalThis[k]
    }
  }
})
