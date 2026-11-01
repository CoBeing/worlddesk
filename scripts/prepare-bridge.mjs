// Produce the exact Tauri v2 externalBin filename for the host target.
// Build from the independently maintained Local Bridge source, not from a downloaded executable.
import {execFileSync} from 'node:child_process'
import {mkdirSync,copyFileSync,chmodSync} from 'node:fs'
import {resolve,join} from 'node:path'
const repo=resolve(process.env.LOCAL_BRIDGE_REPO || '../local-bridge')
const triple=(process.env.TARGET_TRIPLE || execFileSync('rustc',['-vV'],{encoding:'utf8'}).match(/host: (.*)/)?.[1]||'').trim()
if(!/^[a-z0-9_-]+$/.test(triple)) throw Error('invalid Rust target: '+triple)
const exe=triple.includes('windows')?'.exe':''
const cargo=process.env.CARGO || 'cargo'
const args=['build','--release','--locked','--manifest-path',join(repo,'Cargo.toml'),'-p','local-bridge','--bin','local-bridge','--target',triple]
console.log('Building Local Bridge for '+triple+' from '+repo)
execFileSync(cargo,args,{stdio:'inherit'})
const source=join(repo,'target',triple,'release','local-bridge'+exe)
const target=resolve('src-tauri/binaries/local-bridge-'+triple+exe)
mkdirSync(resolve('src-tauri/binaries'),{recursive:true})
copyFileSync(source,target)
if(!exe) chmodSync(target,0o755)
console.log('Embedded sidecar: '+target)
