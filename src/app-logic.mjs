import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './style.css'
import landTopology from 'world-atlas/land-110m.json'
import {feature} from 'topojson-client'
import {FEEDS,normalizeQuakes,normalizeEonet,normalizeRadios,safeSnapshot,httpsUrl} from './data.mjs'
import {pickLanguage,translator} from './locale.mjs'
import {CITIES,cityById,locateByIp,haversineKm} from './location.mjs'
import {skyObservations,formatAtLocation} from './sky.mjs'

const el=id=>document.getElementById(id)
const LOCAL_LOCALE='worlddesk:language:v1'
const LOCAL_CITY='worlddesk:city:v1'
const LOCAL_SAVED='worlddesk:favorites:v1'
const readLocal=(key)=>{try{return localStorage.getItem(key)}catch{return null}}
const writeLocal=(key,value)=>{try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{}}
const preferred=readLocal(LOCAL_LOCALE)||'auto'
const state={
 lang:pickLanguage(navigator.languages?.[0]||navigator.language,preferred),
 choice:preferred,
 cityOverride:readLocal(LOCAL_CITY)||'auto',
 location:null,ipLocation:null,
 quake:[],event:[],radio:[],sky:[],
 view:'all',selected:null,saved:new Map(),markers:new Map(),
 loading:false,errors:[],playerId:null,map:null,markerLayer:null,positionMarker:null
}
let t=translator(state.lang)
const translationKeys={
 all:'headAll',nearby:'headNearby',sky:'headSky',
 quake:'headQuake',event:'headEvent',radio:'headRadio',saved:'headSaved'
}
const kindNames={quake:'quakeKind',event:'eventKind',radio:'radioKind',sky:'skyKind'}
function create(tag,text,className){
 const element=document.createElement(tag)
 if(text!==null&&text!==undefined)element.textContent=String(text)
 if(className)element.className=className
 return element
}
function titleOf(x){return x.titleKey?t(x.titleKey):String(x.title||'')}
function subtitleOf(x){
 if(x.kind==='sky'){
  const city=cityById(x.id.split(':').at(-1))
  const name=city?(state.lang==='zh'?city.zh:city.en):(x.locationName||'')
  return name+' · '+t(x.subtitleKey||'skyWarning')
 }
 return x.subtitle||''
}
function displayTime(x){
 if(!Number.isFinite(x.when))return t('statusNoTime')
 if(x.kind==='sky')return formatAtLocation(x.when,x.tz,state.lang)
 const options={month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}
 if(state.location?.tz&&state.location.tz!=='UTC')options.timeZone=state.location.tz
 try{return new Intl.DateTimeFormat(state.lang==='zh'?'zh-CN':'en-US',options).format(new Date(x.when))}
 catch{return new Date(x.when).toISOString()}
}
let toastTimer
function toast(message){
 const target=el('toast')
 target.textContent=message;target.hidden=false
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>{target.hidden=true},4400)
}
function applyLanguage(){
 t=translator(state.lang)
 document.documentElement.lang=state.lang==='zh'?'zh-CN':'en'
 for(const element of document.querySelectorAll('[data-i18n]')){
  element.textContent=t(element.dataset.i18n)
 }
 el('language-select').value=state.choice
 el('language-select').querySelector('option[value="auto"]').textContent=state.lang==='zh'?'跟随系统':'System'
 el('save').title=t(state.selected&&state.saved.has(state.selected.id)?'unfavorite':'favorite')
 el('refresh').title=t('refresh')
 rebuildCitySelect()
 updateLocationLabel()
 renderItems()
 if(state.selected)showDetail(state.selected)
 const hasData=allAvailable().length
 if(!state.loading)el('data-status').textContent=hasData?hasData+t('countSuffix'):t('noFeeds')
 else el('data-status').textContent=t('loadingWorld')
}
function rebuildCitySelect(){
 const select=el('city-select')
 select.replaceChildren()
 select.append(new Option(t('autoLocation'),'auto'))
 for(const c of CITIES)select.append(new Option(state.lang==='zh'?c.zh:c.en,c.id))
 select.value=cityById(state.cityOverride)?state.cityOverride:'auto'
}
function updateLocationLabel(){
 const label=el('location-label'),loc=state.location
 if(!loc){label.textContent=t('locating');return}
 if(loc.kind==='fallback'){label.textContent=t('locationNo')+' · '+(state.lang==='zh'?'北京':'Beijing');return}
 const name=loc.id&&cityById(loc.id)?(state.lang==='zh'?loc.zh:loc.en):loc.city
 label.textContent=(loc.kind==='ip'?t('locationIp'):t('locationManual'))+' · '+(name||loc.country||'?')
}
function setLanguage(value){
 state.choice=['auto','zh','en'].includes(value)?value:'auto'
 writeLocal(LOCAL_LOCALE,state.choice==='auto'?null:state.choice)
 state.lang=pickLanguage(navigator.languages?.[0]||navigator.language,state.choice)
 applyLanguage()
}
const selectedCity=()=>cityById(state.cityOverride)
function updateSky(){
 if(!state.location){state.sky=[];return}
 state.sky=skyObservations(state.location,new Date())
}
function setLocation(loc){
 const previouslySelectedSky=state.selected?.kind==='sky'?state.selected.skyType:null
 state.location=loc
 updateSky()
 if(previouslySelectedSky){
  state.selected=state.sky.find(item=>item.skyType===previouslySelectedSky)||state.sky[0]||null
 }
 updateLocationLabel()
 renderItems()
 renderMarkers()
 if(state.selected)showDetail(state.selected)
 if(loc?.lat!==undefined){
  const zoom=loc.country==='CN'?4:loc.country==='SG'?5:3
  map.setView([loc.lat,loc.lon],zoom,{animate:false})
  showPosition()
 }
 if(!state.selected&&state.sky.length)selectItem(state.sky[0],false)
}
async function initializeLocation(){
 const chosen=selectedCity()
 if(chosen){setLocation({...chosen,kind:'manual',city:chosen.zh});return}
 el('location-label').textContent=t('locating')
 const coarse=await locateByIp()
 if(cityById(state.cityOverride))return
 if(coarse){
  const close=CITIES.find(c=>c.country===coarse.country&&haversineKm([c.lat,c.lon],[coarse.lat,coarse.lon])<55)
  state.ipLocation={
   ...coarse,city:close?(state.lang==='zh'?close.zh:close.en):(coarse.city||coarse.country),
   tz:coarse.tz==='UTC'&&close?close.tz:coarse.tz
  }
  setLocation(state.ipLocation)
 }else{
  const fallback=cityById('beijing')
  setLocation({...fallback,kind:'fallback',city:fallback.zh})
 }
}
function setCity(value){
 state.cityOverride=cityById(value)?value:'auto'
 writeLocal(LOCAL_CITY,state.cityOverride==='auto'?null:state.cityOverride)
 if(state.cityOverride==='auto'){
  state.location=null
  updateLocationLabel()
  void initializeLocation()
 }else{
  const city=cityById(state.cityOverride)
  setLocation({...city,kind:'manual',city:state.lang==='zh'?city.zh:city.en})
  toast(t('citySaved'))
 }
}

// An offline map sketch, without a commercial map API or fragile foreign tile CDN.
// The Natural Earth land silhouettes do NOT depict national borders and are not for navigation.
let map
let markers
function initializeMap(){
map=L.map('world-map',{zoomControl:false,worldCopyJump:true,preferCanvas:true,
 maxZoom:10,minZoom:1}).setView([28,105],3)
state.map=map
const landGeo=feature(landTopology,landTopology.objects.land)
L.geoJSON(landGeo,{interactive:false,style:{
 color:'#3e8590',weight:.7,opacity:.55,fillColor:'#1a6064',fillOpacity:.57
}}).addTo(map)
for(let lat=-60;lat<=60;lat+=30){
 L.polyline(Array.from({length:37},(_,i)=>[lat,-180+10*i]),{color:'#295668',opacity:.32,weight:.7,interactive:false}).addTo(map)
}
for(let lon=-150;lon<=180;lon+=30){
 L.polyline(Array.from({length:17},(_,i)=>[-80+10*i,lon]),{color:'#295668',opacity:.32,weight:.7,interactive:false}).addTo(map)
}
L.control.zoom({position:'bottomleft'}).addTo(map)
markers=L.layerGroup().addTo(map)
state.markerLayer=markers
}
let positionMarker=null
function showPosition(){
 if(positionMarker){map.removeLayer(positionMarker);positionMarker=null}
 if(!state.location)return
 positionMarker=L.circleMarker([state.location.lat,state.location.lon],{
  radius:7,color:'#b2ffec',fillColor:'#56e6c0',weight:2,fillOpacity:1
 }).addTo(map)
 positionMarker.bindTooltip(state.location.city||state.location.country||'')
}

function radioInChina(r){return r.country==='China'||r.country==='CN'||r.country==='中国'}
function nearValues(){
 if(!state.location)return [...state.sky]
 const center=[state.location.lat,state.location.lon]
 const found=[...state.event,...state.quake].filter(it=>it.point&&haversineKm(center,it.point)<=2000)
 found.sort((a,b)=>haversineKm(center,a.point)-haversineKm(center,b.point))
 return [...state.sky,...found]
}
function allAvailable(){
 const all=[...state.sky,...nearValues().filter(x=>x.kind!=='sky'),
  ...state.radio.filter(radioInChina).slice(0,24),...state.event,...state.quake,...state.radio]
 const result=[],seen=new Set()
 for(const x of all)if(!seen.has(x.id)){seen.add(x.id);result.push(x)}
 return result
}
function viewItems(){
 if(state.view==='saved')return [...state.saved.values()]
 if(state.view==='nearby')return nearValues()
 if(state.view==='all')return allAvailable()
 return state[state.view]||[]
}
function renderMenu(){
 for(const btn of document.querySelectorAll('[data-view]'))btn.classList.toggle('active',btn.dataset.view===state.view)
 el('feed-title').textContent=t(translationKeys[state.view]||'headAll')
 el('results-label').textContent=t(state.view==='saved'?'feedSaved':'feedPublic')
}
function renderItems(){
 renderMenu()
 const list=el('feed-list');list.replaceChildren()
 const values=viewItems()
 el('count').textContent=String(values.length)
 if(!values.length){
  list.append(create('p',t(state.loading?'emptyLoading':state.view==='saved'?'emptySaved':'emptyFeed'),'empty'))
  return
 }
 for(const item of values.slice(0,110)){
  const selected=state.selected?.id===item.id
  const row=create('button',null,'feed-item'+(selected?' selected':''))
  row.type='button'
  const symbol=item.kind==='quake'?'◎':item.kind==='event'?'☼':item.kind==='radio'?'♫':'☾'
  const badge=create('div',symbol,'feed-symbol '+item.kind)
  const body=create('div',null,'feed-body')
  body.append(
   create('div',titleOf(item),'item-heading'),
   create('div',subtitleOf(item),'item-description'),
   create('div',item.kind==='radio'?t('statusAudio'):displayTime(item),'item-time')
  )
  row.append(badge,body,create('span','›','feed-chevron'))
  row.addEventListener('click',()=>selectItem(item,true))
  list.append(row)
 }
}
function renderMarkers(){
 markers.clearLayers();state.markers.clear()
 const visible=state.view==='saved'?viewItems():state.view==='radio'?[]:
  state.view==='sky'?state.sky:state.view==='nearby'?nearValues():
  state.view==='all'?[...state.sky,...state.event,...state.quake]:viewItems()
 for(const item of visible.filter(x=>x.point).slice(0,300)){
  const color=item.kind==='quake'?'#ffae79':item.kind==='sky'?'#c3e2ff':'#67efbb'
  const marker=L.circleMarker(item.point,{radius:item.kind==='sky'?4.5:5.5,
   color,fillColor:color,weight:1.5,fillOpacity:.74}).addTo(markers)
  marker.bindTooltip(titleOf(item),{direction:'top',opacity:.92})
  marker.on('click',()=>selectItem(item,true))
  state.markers.set(item.id,marker)
 }
 if(positionMarker)positionMarker.bringToFront()
}
function showDetail(item){
 if(!item)return
 el('detail-tag').textContent=t(kindNames[item.kind])
 el('detail-title').textContent=titleOf(item)
 el('detail-sub').textContent=subtitleOf(item)
 el('save').textContent=state.saved.has(item.id)?'♥':'♡'
 el('save').title=t(state.saved.has(item.id)?'unfavorite':'favorite')
 const rows=[
  [t('sourceLabel'),item.kind==='quake'?'USGS':item.kind==='event'?'NASA EONET':item.kind==='radio'?'Radio Browser':t('computedLabel')],
  [t('timeLabel'),item.kind==='radio'?t('statusAudio'):displayTime(item)]
 ]
 if(item.kind==='quake'&&Number.isFinite(item.magnitude))rows.push([t('magnitudeLabel'),String(item.magnitude)])
 if(item.kind==='sky'&&item.skyType==='moon'&&Number.isFinite(item.moonFraction)){
  rows.push([t('skyMoonPhase'),Math.round(item.moonFraction*100)+'%'])
 }
 if(item.point)rows.push([t('positionLabel'),item.point[0].toFixed(2)+'°, '+item.point[1].toFixed(2)+'°'])
 if(item.kind==='radio')rows.push([t('areaLabel'),item.country||t('statusUnknown')])
 const box=el('detail-data');box.replaceChildren()
 for(const [a,b] of rows){
  const row=create('div',null,'detail-row')
  row.append(create('span',a),create('strong',b))
  box.append(row)
 }
 el('source').hidden=!item.sourceUrl
 const player=el('radio-player')
 player.hidden=item.kind!=='radio'
 if(item.kind==='radio'){
  el('player-name').textContent=item.title
  if(state.playerId!==item.id){
   el('player').pause()
   el('player').removeAttribute('src')
   if(item.streamUrl)el('player').src=item.streamUrl
   state.playerId=item.id
  }
 }else{el('player').pause();player.hidden=true}
}
function selectItem(item,fly=true){
 state.selected=item
 showDetail(item)
 if(fly&&item.point)map.flyTo(item.point,Math.max(map.getZoom(),4),{duration:.8})
 state.markers.get(item.id)?.bringToFront()
 renderItems()
}
function changeView(view){
 state.view=view;renderItems();renderMarkers()
 if(view==='radio')toast(t('radioMapNote'))
 else if(view==='nearby')toast(t('nearbyTip'))
}
async function getJSON(url,timeout=11000){
 const controller=new AbortController()
 const timer=setTimeout(()=>controller.abort(),timeout)
 try{
  const response=await fetch(url,{signal:controller.signal})
  if(!response.ok)throw new Error('HTTP '+response.status)
  return await response.json()
 }finally{clearTimeout(timer)}
}
async function loadWorld(){
 if(state.loading)return
 state.loading=true;state.errors=[]
 el('refresh').disabled=true
 el('data-status').textContent=t('loadingWorld')
 renderItems()
 const requests=await Promise.allSettled([
  getJSON(FEEDS.earthquakes),getJSON(FEEDS.events),
  getJSON(FEEDS.radioChina),getJSON(FEEDS.radio)
 ])
 const sources=['USGS','NASA EONET','Radio Browser CN','Radio Browser Global']
 const parse=[normalizeQuakes,normalizeEonet,normalizeRadios,normalizeRadios]
 const gathered={}
 for(let i=0;i<requests.length;i++){
  const result=requests[i]
  if(result.status!=='fulfilled'){state.errors.push(sources[i]);continue}
  try{gathered[i]=parse[i](result.value)}
  catch{state.errors.push(sources[i])}
 }
 if(gathered[0])state.quake=gathered[0]
 if(gathered[1])state.event=gathered[1]
 const deduped=new Map()
 for(const item of [...(gathered[2]||[]),...(gathered[3]||[])])deduped.set(item.id,item)
 if(deduped.size){
  state.radio=[...deduped.values()].sort((a,b)=>Number(radioInChina(b))-Number(radioInChina(a)))
 }
 state.loading=false
 el('refresh').disabled=false
 el('data-status').textContent=allAvailable().length?allAvailable().length+t('countSuffix'):t('noFeeds')
 if(state.errors.length)toast(t('errorPartial')+' '+state.errors.join(', '))
 renderItems();renderMarkers()
 if(!state.selected){
  const first=allAvailable()[0]
  if(first)selectItem(first,false)
 }
}

const native=!!window.__TAURI_INTERNALS__
async function openKnown(url){
 const safe=httpsUrl(url)
 if(!safe){toast(t('invalidUrl'));return}
 try{
  if(native){const {invoke}=await import('@tauri-apps/api/core');await invoke('open_external',{url:safe})}
  else window.open(safe,'_blank','noopener,noreferrer')
 }catch{toast(t('openFail'))}
}
async function checkBridge(){
 if(!native){toast(t('bridgeWeb'));return}
 el('bridge-label').textContent=t('bridgeDiag')
 try{
  const {invoke}=await import('@tauri-apps/api/core')
  const value=JSON.parse(await invoke('bridge_diagnostics'))
  el('bridge-label').textContent=t(value.ok===true?'bridgeDiagOk':'bridgeDiagIssue')
  el('bridge-detail').textContent=t('bridgeDiagNote')
 }catch{
  el('bridge-label').textContent=t('bridgeUnavailable')
  el('bridge-detail').textContent=t('bridgeNotNeeded')
 }
}
async function probeBridge(){
 if(!native){
  el('bridge-label').textContent=t('bridgeWeb')
  el('bridge-detail').textContent=t('bridgeWebDetail')
  return
 }
 try{
  const {invoke}=await import('@tauri-apps/api/core')
  const report=await invoke('bridge_status')
  el('bridge-label').textContent=report.bundled?t('bridgeReady')+report.version:t('bridgeUnavailable')
  el('bridge-detail').textContent=t('bridgeDiagNote')
 }catch{
  el('bridge-label').textContent=t('bridgeUnavailable')
  el('bridge-detail').textContent=t('bridgeNotNeeded')
 }
}
function tick(){
 el('clock').textContent=new Intl.DateTimeFormat(state.lang==='zh'?'zh-CN':'en-US',{
  hour:'2-digit',minute:'2-digit',hour12:false
 }).format(new Date())
}
function loadFavorites(){
 try{
  const data=JSON.parse(readLocal(LOCAL_SAVED)||'[]')
  if(Array.isArray(data))for(const raw of data.slice(0,150)){
   const item=safeSnapshot(raw);if(item)state.saved.set(item.id,item)
  }
 }catch{}
}
function persistFavorites(){writeLocal(LOCAL_SAVED,JSON.stringify([...state.saved.values()].slice(-150)))}

export function mountWorldDesk(){
 initializeMap()
 loadFavorites()
 el('language-select').value=state.choice
 el('language-select').addEventListener('change',e=>{setLanguage(e.target.value);tick()})
 el('city-select').addEventListener('change',e=>setCity(e.target.value))
 for(const b of document.querySelectorAll('[data-view]'))
  b.addEventListener('click',()=>changeView(b.dataset.view))
 el('refresh').addEventListener('click',()=>void loadWorld())
 el('surprise').addEventListener('click',()=>{
  const values=allAvailable()
  if(!values.length){toast(t('surpriseWait'));return}
  const selected=values[Math.floor(Math.random()*values.length)]
  if(state.view!=='all'&&state.view!==selected.kind)changeView('all')
  selectItem(selected,true)
  toast(t('surpriseFound'))
 })
 el('save').addEventListener('click',()=>{
  const item=state.selected;if(!item){toast(t('selectFirst'));return}
  if(state.saved.has(item.id)){state.saved.delete(item.id);toast(t('unsaved'))}
  else{state.saved.set(item.id,safeSnapshot(item));toast(t('saved'))}
  persistFavorites();showDetail(item)
  if(state.view==='saved'){renderItems();renderMarkers()}
 })
 el('share').addEventListener('click',async()=>{
  const item=state.selected;if(!item){toast(t('selectFirst'));return}
  const title='WorldDesk · '+titleOf(item)
  const description=subtitleOf(item)+' · '+displayTime(item)
  const payload={title,text:description}
  if(item.sourceUrl)payload.url=item.sourceUrl
  try{
   if(navigator.share)await navigator.share(payload)
   else{
    await navigator.clipboard.writeText(title+'\n'+description+(item.sourceUrl?'\n'+item.sourceUrl:''))
    toast(t('copied'))
   }
  }catch(error){if(error?.name!=='AbortError')toast(t('shareFail'))}
 })
 el('source').addEventListener('click',()=>{if(state.selected?.sourceUrl)void openKnown(state.selected.sourceUrl)})
 el('bridge-check').addEventListener('click',()=>void checkBridge())
 applyLanguage();tick()
 setInterval(tick,30000)
 setInterval(()=>{if(state.location){updateSky();if(state.view==='sky'||state.view==='nearby')renderItems()}},900000)
 void probeBridge()
 void initializeLocation()
 void loadWorld()
}
