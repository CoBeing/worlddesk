import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
const tag = process.env.GITHUB_REF_NAME
if (!/^v\d+\.\d+\.\d+-preview\.\d+$/.test(tag || '')) throw new Error('Invalid preview tag')
const assets = 'release-assets'
const base = `https://github.com/CoBeing/worlddesk/releases/download/${tag}/`
const platforms = {}
for (const [platform, file] of [['darwin-aarch64', 'WorldDesk-Preview-macos-arm64.app.tar.gz'], ['windows-x86_64', 'WorldDesk-Preview-windows-x64.exe']]) {
  if (!fs.statSync(`${assets}/${file}`).size) throw new Error(`Empty artifact: ${file}`)
  const signature = fs.readFileSync(`${assets}/${file}.sig`, 'utf8').trim()
  if (!signature) throw new Error(`Missing signature: ${file}`)
  platforms[platform] = { signature, url: base + file }
}
const manifest = JSON.stringify({version: tag.slice(1), notes: fs.readFileSync('RELEASE_NOTES.md', 'utf8'), pub_date: new Date().toISOString(), platforms}, null, 2) + '\n'
fs.writeFileSync(`${assets}/latest.json`, manifest)
const gh = args => execFileSync('gh', args, {encoding:'utf8'})
gh(['release','upload',tag,`${assets}/latest.json`,'--clobber'])
gh(['release','edit',tag,'--draft=false','--prerelease'])
const repo = 'repos/CoBeing/worlddesk'
try { gh(['api', `${repo}/git/ref/heads/updates`]) }
catch { gh(['api', `${repo}/git/refs`, '-f','ref=refs/heads/updates','-f',`sha=${process.env.GITHUB_SHA}`]) }
let sha
try { sha = JSON.parse(gh(['api',`${repo}/contents/latest.json?ref=updates`])).sha } catch {}
const body = {message:`Publish updater manifest ${tag}`, branch:'updates', content:Buffer.from(manifest).toString('base64'), ...(sha ? {sha} : {})}
fs.writeFileSync('/tmp/worlddesk-manifest-request.json', JSON.stringify(body))
gh(['api','--method','PUT',`${repo}/contents/latest.json`,'--input','/tmp/worlddesk-manifest-request.json'])
