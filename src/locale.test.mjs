import test from 'node:test'
import assert from 'node:assert/strict'
import {detectLanguage,pickLanguage,strings,translator} from './locale.mjs'
test('defaults to actual system language, not IP country',()=>{
 assert.equal(detectLanguage('zh-Hans-CN'),'zh')
 assert.equal(detectLanguage('en-US'),'en')
 assert.equal(detectLanguage('ja-JP'),'en')
 assert.equal(pickLanguage('zh-CN','en'),'en')
 assert.equal(pickLanguage('en-SG','auto'),'en')
})
test('translations are complete in both languages',()=>{
 assert.deepEqual(Object.keys(strings.zh).sort(),Object.keys(strings.en).sort())
 assert.equal(translator('zh')('navSky'),'天空此刻')
 assert.equal(translator('en')('navSky'),'Sky Now')
})
