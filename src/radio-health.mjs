export const RADIO_OK_TTL=6*60*60*1000
export const RADIO_FAIL_TTL=30*60*1000
export const RADIO_RETRY_TTL=15*60*1000
export function createRadioHealth(saved=[],clock=Date.now){
 const records=new Map()
 for(const r of Array.isArray(saved)?saved.slice(-200):[]){
  if(typeof r?.id==='string'&&typeof r.url==='string'&&['ok','failed','unknown'].includes(r.status)&&Number.isFinite(r.until)&&r.until>clock()&&r.until<=clock()+RADIO_OK_TTL)records.set(r.id,r)
 }
 const current=item=>{const r=records.get(item.id);return r&&r.url===item.streamUrl&&r.until>clock()?r:null}
 return {
  available:item=>current(item)?.status!=='failed',
  needsCheck:item=>!current(item),
  record(item,status){
   if(!['ok','failed','unknown'].includes(status))return
   records.delete(item.id)
   records.set(item.id,{id:item.id,url:item.streamUrl,status,until:clock()+(status==='ok'?RADIO_OK_TTL:status==='failed'?RADIO_FAIL_TTL:RADIO_RETRY_TTL)})
   while(records.size>200)records.delete(records.keys().next().value)
  },
  snapshot:()=>[...records.values()].filter(r=>r.until>clock())
 }
}
// Loading a muted media element checks the actual stream/decoder without CORS fetch
// false negatives or automatic audible playback. A timeout is inconclusive.
export function probeRadio(url,{audioFactory=()=>new Audio(),timeout=8000,signal}={}){
 return new Promise(resolve=>{
  const audio=audioFactory();let done=false,timer
  const finish=status=>{
   if(done)return;done=true;clearTimeout(timer)
   signal?.removeEventListener('abort',abort)
   audio.oncanplay=audio.onerror=null
   audio.pause();audio.removeAttribute('src');audio.load();resolve(status)
  }
  const abort=()=>finish('cancelled')
  audio.muted=true;audio.preload='auto';audio.volume=0
  audio.oncanplay=()=>finish('ok')
  audio.onerror=()=>finish([2,3,4].includes(audio.error?.code)?'failed':'unknown')
  if(signal?.aborted){finish('cancelled');return}
  signal?.addEventListener('abort',abort,{once:true})
  timer=setTimeout(()=>finish('unknown'),timeout)
  audio.src=url;audio.load()
 })
}
