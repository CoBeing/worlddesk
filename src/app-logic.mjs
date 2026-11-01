import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './style.css'
import landTopology from 'world-atlas/land-110m.json'
import {feature} from 'topojson-client'
import {FEEDS,normalizeQuakes,normalizeEonet,normalizeRadios,safeSnapshot,httpsUrl} from './data.mjs'
import {pickLanguage,translator} from './locale.mjs'
import {CITIES,cityById,locateByIp,haversineKm} from './location.mjs'
import {skyObservations,formatAtLocation} from './sky.mjs'
import {createCinema} from './cinema.mjs'
import {FLIGHT_PROVIDER,FLIGHT_REGIONS,FLIGHT_RADIUS_NM,normalizeFlights,formatAltitude,aircraftDataAge} from './flights.mjs'
import {deriveFlightInsights,recordSessionSample,makeWorldPulse} from './live-insights.mjs'

const el=id=>document.getElementById(id)
const LOCAL_LOCALE='worlddesk:language:v1'
const LOCAL_CITY='worlddesk:city:v1'
const LOCAL_SAVED='worlddesk:favorites:v1'
const LOCAL_MAP='worlddesk:map:v1'
const readLocal=(key)=>{try{return localStorage.getItem(key)}catch{return null}}
const writeLocal=(key,value)=>{try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{}}
const preferred=readLocal(LOCAL_LOCALE)||'auto'
const state={
 lang:pickLanguage(navigator.languages?.[0]||navigator.language,preferred),
 choice:preferred,
 cityOverride:readLocal(LOCAL_CITY)||'auto',
 location:null,ipLocation:null,
 quake:[],event:[],radio:[],sky:[],flight:[],
 view:'watch',selected:null,saved:new Map(),markers:new Map(),cinema:null,
 loading:false,errors:[],playerId:null,map:null,markerLayer:null,positionMarker:null,
 flightLoading:false,flightError:null,flightRegion:'current',followedHex:null,flightLastUpdate:null,
 flightMapStyle:['bright','dark','offline'].includes(readLocal(LOCAL_MAP))?readLocal(LOCAL_MAP):'bright',
 flightListOpen:true,flightPanelOpen:false,flightSearch:'',flightAirborne:true,
 flightSamples:[],flightLines:new Map(),basemap:null,offlineSketch:null,offlineCities:[]
}
let t=translator(state.lang)
const translationKeys={
 watch:'headWatch',all:'headAll',flight:'headFlight',nearby:'headNearby',sky:'headSky',
 quake:'headQuake',event:'headEvent',radio:'headRadio',saved:'headSaved'
}
const kindNames={quake:'quakeKind',event:'eventKind',radio:'radioKind',sky:'skyKind',scene:'sceneKind',flight:'flightKind'}
function create(tag,text,className){
 const element=document.createElement(tag)
 if(text!==null&&text!==undefined)element.textContent=String(text)
 if(className)element.className=className
 return element
}
function titleOf(x){return x.kind==='scene'?(state.lang==='zh'?x.titleZh:x.titleEn)||x.title||'':x.titleKey?t(x.titleKey):String(x.title||'')}
function subtitleOf(x){
 if(x.kind==='scene')return (state.lang==='zh'?x.descriptionZh:x.descriptionEn)||x.subtitle||''
 if(x.kind==='sky'){
  const city=cityById(x.id.split(':').at(-1))
  const name=city?(state.lang==='zh'?city.zh:city.en):(x.locationName||'')
  return name+' · '+t(x.subtitleKey||'skyWarning')
 }
 return x.subtitle||''
}
function displayTime(x){
 if(x.kind==='scene')return x.frameDate||x.dateLabel||t('statusNoTime')
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
 for(const option of el('flight-map-style').options){
  option.textContent=t(option.value==='bright'?'mapBright':option.value==='dark'?'mapDark':'mapOffline')
 }
 el('flight-map-style').value=state.flightMapStyle
 el('flight-search').placeholder=t('flightSearch')
 el('close-inspector').title=t('flightCloseDetail')
 el('close-inspector').setAttribute('aria-label',t('flightCloseDetail'))
 el('flight-list-toggle').textContent=t(state.flightListOpen?'flightHideList':'flightShowList')
 rebuildFlightSelect()
 renderFlightStatus()
 for(const {city,marker} of state.offlineCities)
  marker.setTooltipContent(state.lang==='zh'?city.zh:city.en)
 rebuildCitySelect()
 updateLocationLabel()
 if(state.cinema)state.cinema.updateLanguage(state.lang)
 renderFlightHighlights()
 renderWorldPulse()
 renderItems()
 if(state.selected)showDetail(state.selected)
 const hasData=state.view==='flight'?state.flight.length:allAvailable().length
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
 renderWorldPulse()
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
  if(state.view==='flight'&&state.flightRegion==='current')void loadFlights()
 }else{
  const fallback=cityById('beijing')
  setLocation({...fallback,kind:'fallback',city:fallback.zh})
  if(state.view==='flight'&&state.flightRegion==='current')void loadFlights()
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
  if(state.view==='flight'&&state.flightRegion==='current')void loadFlights()
  toast(t('citySaved'))
 }
}

// An offline map sketch, without a commercial map API or fragile foreign tile CDN.
// The Natural Earth land silhouettes do NOT depict national borders and are not for navigation.
let map
let markers
function initializeMap(){
map=L.map('world-map',{zoomControl:false,worldCopyJump:true,preferCanvas:true,
 maxZoom:11,minZoom:1}).setView([28,105],3)
map.attributionControl.setPrefix(false)
state.map=map
const sketch=L.layerGroup().addTo(map)
const landGeo=feature(landTopology,landTopology.objects.land)
L.geoJSON(landGeo,{interactive:false,style:{
 color:'#3e8590',weight:.7,opacity:.55,fillColor:'#1a6064',fillOpacity:.57
}}).addTo(sketch)
for(let lat=-60;lat<=60;lat+=30){
 L.polyline(Array.from({length:37},(_,i)=>[lat,-180+10*i]),{color:'#295668',opacity:.32,weight:.7,interactive:false}).addTo(sketch)
}
for(let lon=-150;lon<=180;lon+=30){
 L.polyline(Array.from({length:17},(_,i)=>[-80+10*i,lon]),{color:'#295668',opacity:.32,weight:.7,interactive:false}).addTo(sketch)
}
// An explicit, small offline city catalog gives geographic context if
// the online vector provider is unavailable. Not a navigational map.
for(const city of CITIES){
 const marker=L.circleMarker([city.lat,city.lon],{
  radius:2,color:'#7dd3d0',weight:1.0,fillColor:'#86e1c3',fillOpacity:.95,
  interactive:false
 })
 marker.bindTooltip(state.lang==='zh'?city.zh:city.en,{
  permanent:true,direction:'right',opacity:.86,
  offset:[3,0],className:'offline-city-name'
 })
 marker.addTo(sketch)
 state.offlineCities.push({city,marker})
}
L.control.zoom({position:'bottomleft'}).addTo(map)
markers=L.layerGroup().addTo(map)
state.markerLayer=markers
state.offlineSketch=sketch
}
// Lazy-load the vector renderer on Flight Live entry, preserving a small,
// responsive World Cinema initial bundle and an offline Natural Earth fallback.
let basemapLoading=null
async function useBasemap(){
 if(state.flightMapStyle==='offline'&&!state.basemap){
  document.querySelector('.map-caption span:last-child').textContent=t('mapOffline')+' · © Natural Earth'
  return
 }
 if(state.basemap){
  state.basemap.setStyle(state.view==='flight'?state.flightMapStyle:'offline')
  return
 }
 if(basemapLoading)return basemapLoading
 basemapLoading=import('./map-base.mjs')
  .then(({createBasemapController})=>{
   state.basemap=createBasemapController(map,state.offlineSketch,({style,status})=>{
    const select=el('flight-map-style')
    if(select)select.value=style
    const caption=document.querySelector('.map-caption span:last-child')
    if(status==='fallback'){
     caption.textContent=t('mapFallback')+' · © Natural Earth'
     if(state.view==='flight')toast(t('mapFallback'))
    }else if(status==='loading')caption.textContent=t('mapPending')+' · OpenFreeMap'
    else if(status==='ready')caption.textContent=style==='offline'?t('mapOffline')+' · © Natural Earth':t('mapReady')+' · OpenFreeMap'
   })
   state.basemap.setStyle(state.view==='flight'?state.flightMapStyle:'offline')
  })
  .catch(()=>{
   document.querySelector('.map-caption span:last-child').textContent=t('mapFallback')+' · © Natural Earth'
   if(state.view==='flight')toast(t('mapFallback'))
  })
  .finally(()=>{basemapLoading=null})
 return basemapLoading
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
 if(state.view==='flight'){
  const term=state.flightSearch.trim().toLowerCase()
  return state.flight.filter(item=>{
   if(state.flightAirborne&&item.altitudeFt==='ground')return false
   return !term||[item.title,item.callsign,item.registration,item.aircraftType,item.hex]
    .some(text=>String(text||'').toLowerCase().includes(term))
  })
 }
 return state[state.view]||[]
}
function showFlightDetail(item){
 if(!item||item.kind!=='flight')return
 state.selected=item
 state.flightPanelOpen=true
 const shell=document.querySelector('.app-shell')
 shell.classList.add('flight-inspector-open')
 showDetail(item)
 renderMarkers()
 renderItems()
}
function renderFlightHighlights(){
 const host=el('flight-highlights')
 host.replaceChildren()
 const summary=deriveFlightInsights(state.flight,currentFlightCenter())
 const row=[
  {id:'count',label:t('flightStatCount'),
   value:String(summary.count),note:t('flightSession')+': '+state.flightSamples.length+' '+t('flightSessionSamples'),item:null},
  {id:'fast',label:t('flightStatFast'),item:summary.fastest,
   value:summary.fastest?summary.fastest.speedKmh+' km/h':'—',
   note:summary.fastest?.title||t('flightStatNone')},
  {id:'high',label:t('flightStatHigh'),item:summary.highest,
   value:summary.highest?formatAltitude(summary.highest.altitudeFt,state.lang):'—',
   note:summary.highest?.title||t('flightStatNone')},
  {id:'near',label:t('flightStatNear'),item:summary.nearest,
   value:summary.nearest?Math.round(summary.nearest.km)+' km':'—',
   note:summary.nearest?.title||t('flightStatNone')}
 ]
 for(const card of row){
  const button=create('button',null,'flight-insight')
  button.type='button'
  button.append(
   create('span',card.label,'insight-label'),
   create('span',card.value,'insight-value'),
   create('span',card.note,'insight-note')
  )
  button.disabled=card.id!=='count'&&!card.item
  button.addEventListener('click',()=>{
   if(card.item)selectItem(card.item,true)
   else if(card.id==='count'){
    state.flightListOpen=!state.flightListOpen
    renderMenu()
    map.invalidateSize({animate:false})
   }
  })
  host.append(button)
 }
}
function renderWorldPulse(){
 const root=el('world-pulse-list')
 root.replaceChildren()
 const records=makeWorldPulse({
  sky:state.sky,flight:state.flight,event:state.event,
  quake:state.quake,radio:state.radio,
  visual:state.cinema?.getScene('sat:asia')||null
 })
 for(const record of records.slice(0,4)){
  const item=record.item
  const key=record.kind==='sky'?'pulseSky':record.kind==='flight'?'pulseFlight':
   record.kind==='radio'?'pulseRadio':record.kind==='scene'?'pulseVisual':'pulseEvent'
  const b=create('button',null,'pulse-card')
  b.type='button'
  const headline=record.kind==='flight'?(state.flight.length?
   state.flight.length+' '+t('countSuffix'):t('pulseFlight')):
   item?titleOf(item):t('pulseAction')
  const summary=item?(record.kind==='sky'?displayTime(item):record.kind==='scene'?(item.frames?.at(-1)?.date||item.dateLabel||''):record.kind==='radio'?item.country||item.subtitle:subtitleOf(item)):
   record.kind==='flight'?t('pulseFlightSub'):''
  b.append(
   create('span',t(key),'pulse-label'),
   create('span',headline,'pulse-title'),
   create('span',summary,'pulse-subtitle')
  )
  b.addEventListener('click',()=>{
   const view=record.kind==='sky'?'sky':record.kind==='radio'?'radio':
    record.kind==='flight'?'flight':record.kind==='scene'?'watch':'all'
   changeView(view)
   if(item&&record.kind==='scene')state.cinema?.selectId(item.id)
   else if(item&&record.kind!=='flight')selectItem(item,true)
   if(record.kind==='flight'&&state.flight.length&&view==='flight'){
    // The first frame is just the airspace; a card click must still select a plane.
    // Do not force the inspector open.
    map.invalidateSize({animate:false})
   }
  })
  root.append(b)
 }
}
function renderMenu(){
 const flight=state.view==='flight'
 const watching=state.view==='watch'
 const world=['all','nearby','sky','quake','event'].includes(state.view)
 const shell=document.querySelector('.app-shell')
 shell.classList.toggle('watch-active',watching)
 shell.classList.toggle('flight-active',flight)
 shell.classList.toggle('flight-inspector-open',flight&&state.flightPanelOpen)
 shell.classList.toggle('list-hidden',flight&&!state.flightListOpen)
 for(const btn of document.querySelectorAll('.nav [data-view]')){
  btn.classList.toggle('active',btn.dataset.view===(world?'all':state.view))
  btn.title=t(btn.dataset.view==='watch'?'navWatch':btn.dataset.view==='flight'?'navFlight':btn.dataset.view==='all'?'navAll':btn.dataset.view==='radio'?'navRadio':'navSaved')
 }
 for(const btn of document.querySelectorAll('[data-subview]')){
  btn.classList.toggle('active',btn.dataset.subview===state.view)
 }
 el('cinema').hidden=!watching
 el('cinema-rail').hidden=!watching
 el('flight-toolbar').hidden=!flight
 el('flight-highlights').hidden=!flight
 el('flight-search-box').hidden=!flight
 el('world-filters').hidden=!world
 el('world-pulse').hidden=!watching&&!world
 document.querySelector('.section-line').hidden=watching
 document.querySelector('.explore-grid').hidden=watching
 document.querySelector('.source-note').hidden=watching
 el('close-inspector').hidden=!flight
 el('flight-list-toggle').textContent=t(state.flightListOpen?'flightHideList':'flightShowList')
 el('feed-title').textContent=t(translationKeys[state.view]||'headAll')
 el('results-label').textContent=flight?t('flightFeed'):t(state.view==='saved'?'feedSaved':'feedPublic')
 if(flight)el('data-status').textContent=state.flight.length?state.flight.length+t('countSuffix'):t(state.flightLoading?'flightStatusLoading':'flightStatusEmpty')
 document.querySelector('.source-note').textContent=flight?t('flightSource')+' — '+t('flightInfo'):t('sourceNote')
 document.querySelector('.top-bar h1').textContent=flight?t('flightHeadline'):t('tagline')
}
function renderItems(){
 renderMenu()
 const list=el('feed-list');list.replaceChildren()
 const values=viewItems()
 el('count').textContent=String(values.length)
 if(!values.length){
  const empty=state.view==='flight'?state.flightLoading?'flightStatusLoading':state.flightError?'flightStatusError':'flightStatusEmpty':state.loading?'emptyLoading':state.view==='saved'?'emptySaved':'emptyFeed'
  list.append(create('p',t(empty),'empty'))
  return
 }
 for(const item of values.slice(0,110)){
  const selected=state.selected?.id===item.id
  const row=create('button',null,'feed-item'+(selected?' selected':''))
  row.type='button'
  const symbol=item.kind==='quake'?'◎':item.kind==='event'?'☼':item.kind==='radio'?'♫':item.kind==='flight'?'✈':'☾'
  const badge=create('div',symbol,'feed-symbol '+item.kind)
  const body=create('div',null,'feed-body')
  body.append(
   create('div',titleOf(item),'item-heading'),
   create('div',subtitleOf(item),'item-description'),
   create('div',item.kind==='radio'?t('statusAudio'):item.kind==='flight'?aircraftDataAge(item,state.lang):displayTime(item),'item-time')
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
  if(item.kind==='flight'){
   const track=Number.isFinite(item.heading)?Math.round(item.heading):0
   const marker=L.marker(item.point,{
    icon:L.divIcon({
     className:'aircraft-marker'+(state.followedHex===item.hex?' following':''),
     html:'<span style="transform:rotate('+track+'deg)">✈</span>',
     iconSize:[29,29],iconAnchor:[14,14]
    })
   }).addTo(markers)
   marker.bindTooltip(item.title+' · '+formatAltitude(item.altitudeFt,state.lang),{direction:'top',opacity:.95})
   marker.on('click',()=>selectItem(item,true))
   state.markers.set(item.id,marker)
   continue
  }
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
 const rows=item.kind==='scene'?[
  [t('sceneTime'),displayTime(item)],
  [t('sceneCredit'),item.author||''],
  [t('sceneLicense'),item.license||''],
  [t('sceneCategory'),t(item.category==='china'?'sceneChina':item.category==='earth'?'sceneEarth':'sceneClouds')]
 ]:[
  [t('sourceLabel'),item.kind==='quake'?'USGS':item.kind==='event'?'NASA EONET':item.kind==='radio'?'Radio Browser':t('computedLabel')],
  [t('timeLabel'),item.kind==='radio'?t('statusAudio'):displayTime(item)]
 ]
 if(item.kind==='quake'&&Number.isFinite(item.magnitude))rows.push([t('magnitudeLabel'),String(item.magnitude)])
 if(item.kind==='sky'&&item.skyType==='moon'&&Number.isFinite(item.moonFraction)){
  rows.push([t('skyMoonPhase'),Math.round(item.moonFraction*100)+'%'])
 }
 if(item.point)rows.push([t('positionLabel'),item.point[0].toFixed(2)+'°, '+item.point[1].toFixed(2)+'°'])
 if(item.kind==='radio')rows.push([t('areaLabel'),item.country||t('statusUnknown')])
 if(item.kind==='flight'){
  rows.length=0
  rows.push(
   [t('flightCallsign'),item.callsign||item.hex.toUpperCase()],
   [t('flightRegistration'),item.registration||t('statusUnknown')],
   [t('flightType'),item.aircraftType||t('statusUnknown')],
   [t('flightAltitude'),formatAltitude(item.altitudeFt,state.lang)],
   [t('flightSpeed'),Number.isFinite(item.speedKmh)?item.speedKmh+' km/h':t('statusUnknown')],
   [t('flightHeading'),Number.isFinite(item.heading)?Math.round(item.heading)+'°':t('statusUnknown')],
   [t('flightAge'),aircraftDataAge(item,state.lang)],
   [t('sourceLabel'),'adsb.lol · ODbL 1.0']
  )
 }
 el('save').hidden=item.kind==='flight'
 el('flight-follow').hidden=item.kind!=='flight'
 el('flight-warning').hidden=item.kind!=='flight'
 if(item.kind==='flight')el('flight-follow').textContent=t(state.followedHex===item.hex?'flightUnfollow':'flightFollow')
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
 if(item.kind==='flight'&&state.view==='flight'){
  showFlightDetail(item)
  if(fly&&item.point)map.flyTo(item.point,Math.max(map.getZoom(),7),{duration:.65})
  return
 }
 if(item.kind==='scene'&&state.cinema){
  if(state.view!=='watch')changeView('watch')
  state.cinema.selectId(item.id)
  return
 }
 state.selected=item
 showDetail(item)
 if(fly&&item.point)map.flyTo(item.point,Math.max(map.getZoom(),item.kind==='flight'?7:4),{duration:.8})
 const selectedMarker=state.markers.get(item.id)
 if(typeof selectedMarker?.bringToFront==='function')selectedMarker.bringToFront()
 else if(typeof selectedMarker?.setZIndexOffset==='function')selectedMarker.setZIndexOffset(1000)
 renderItems()
}
function changeView(view){
 const old=state.view
 const previouslyWatching=old==='watch'
 if(previouslyWatching&&view!=='watch')state.cinema?.stop()
 state.view=view
 if(view==='flight'&&old!=='flight'){
  state.flightPanelOpen=false
  void useBasemap()
 }else if(old==='flight'&&view!=='flight'){
  state.basemap?.setStyle('offline')
 }
 renderItems()
 renderMarkers()
 if(view==='flight')renderFlightHighlights()
 renderWorldPulse()
 if(view!=='watch'){
  requestAnimationFrame(()=>map.invalidateSize({animate:false}))
  setTimeout(()=>map.invalidateSize({animate:false}),140)
 }
 if(view==='flight'){
  const center=currentFlightCenter()
  if(center)map.setView([center.lat,center.lon],6,{animate:false})
  if(state.flight.length){
   state.selected=state.flight[0]
   showDetail(state.selected)
  }else showFlightPlaceholder()
  if(!state.flight.length)void loadFlights()
 }
 if(view==='watch'&&state.cinema){
  state.selected={...state.cinema.selected(),title:state.cinema.selected().titleZh}
  showDetail(state.selected)
 }
 if(view==='radio')toast(t('radioMapNote'))
 else if(view==='nearby')toast(t('nearbyTip'))
}
function rebuildFlightSelect(){
 const select=el('flight-area')
 const desired=state.flightRegion
 select.replaceChildren()
 for(const region of FLIGHT_REGIONS){
  select.append(new Option(state.lang==='zh'?region.zh:region.en,region.id))
 }
 select.value=desired
}
function currentFlightCenter(){
 if(state.flightRegion==='current'){
  if(state.location&&Number.isFinite(state.location.lat)&&Number.isFinite(state.location.lon)){
   return state.location
  }
  return cityById('shanghai')
 }
 return FLIGHT_REGIONS.find(x=>x.id===state.flightRegion)||cityById('shanghai')
}
function renderFlightStatus(){
 const status=el('flight-status')
 if(state.flightLoading){status.textContent=t('flightStatusLoading');return}
 if(state.flightError){status.textContent=t(state.flightError);return}
 if(state.flightLastUpdate){
  const time=new Intl.DateTimeFormat(state.lang==='zh'?'zh-CN':'en-US',{
   hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false
  }).format(new Date(state.flightLastUpdate))
  status.textContent=state.flight.length+' · '+time+' · '+t('flightFeed')
  return
 }
 status.textContent=t('flightAwait')
}
function showFlightPlaceholder(){
 el('detail-tag').textContent=t('flightKind')
 el('detail-title').textContent=t('flightAwait')
 el('detail-sub').textContent=t('flightStatusEmpty')
 el('detail-data').replaceChildren()
 el('save').hidden=true
 el('source').hidden=true
 el('flight-follow').hidden=true
 el('flight-warning').hidden=false
 el('radio-player').hidden=true
}
async function fetchFlightData(center){
 if(native){
  const {invoke}=await import('@tauri-apps/api/core')
  return await invoke('flight_snapshot',{
   lat:center.lat,lon:center.lon,dist:FLIGHT_RADIUS_NM
  })
 }
 // Development server only: a narrow proxy for browser UI and screenshot tests.
 // Production web builds cannot directly use the ADSB.lol endpoint (no CORS);
 // the signed/unsigned desktop client is the supported interface.
 if(import.meta.env.DEV){
  return await getJSON('/flight-preview/v2/lat/'+center.lat.toFixed(4)+'/lon/'+center.lon.toFixed(4)+'/dist/'+FLIGHT_RADIUS_NM,10000)
 }
 throw new Error('desktop-only')
}
let flightRequestSerial=0
async function loadFlights(){
 if(state.flightLoading)return
 const center=currentFlightCenter()
 if(!center)return
 const serial=++flightRequestSerial
 const requestedRegion=state.flightRegion
 state.flightLoading=true
 state.flightError=null
 el('flight-refresh').disabled=true
 renderFlightStatus()
 if(state.view==='flight')renderItems()
 try{
  const raw=await fetchFlightData(center)
  if(serial!==flightRequestSerial||requestedRegion!==state.flightRegion)return
  const firstLoaded=!state.flightLastUpdate
  state.flight=normalizeFlights(raw)
  state.flightLastUpdate=Date.now()
  state.flightSamples=recordSessionSample(state.flightSamples,state.flight.length)
 if(state.view==='flight'&&firstLoaded&&state.flight.length>1&&!state.followedHex){
   const bounds=L.latLngBounds(state.flight.map(item=>item.point))
   if(bounds.isValid())map.fitBounds(bounds.pad(.14),{maxZoom:6,animate:false})
  }
  if(state.followedHex){
   const tracked=state.flight.find(a=>a.hex===state.followedHex)
   if(tracked){
    state.selected=tracked
    if(state.view==='flight')map.setView(tracked.point,Math.max(map.getZoom(),7))
   }else{
    state.followedHex=null
   }
  }
  if(state.view==='flight'){
   if(state.selected?.kind==='flight'){
    state.selected=state.flight.find(f=>f.hex===state.selected.hex)||state.flight[0]||null
   }else state.selected=state.flight[0]||null
  }
  if(state.view==='flight'){
   if(state.selected?.kind==='flight')showDetail(state.selected)
   else showFlightPlaceholder()
  }
 }catch(e){
  state.flight=[]
  state.flightError=native||import.meta.env.DEV?'flightStatusError':'flightStatusDesktop'
  if(state.view==='flight')showFlightPlaceholder()
 }finally{
  if(serial===flightRequestSerial){
   state.flightLoading=false
   el('flight-refresh').disabled=false
   renderFlightStatus()
   renderFlightHighlights()
   renderWorldPulse()
   if(state.view==='flight'){
    el('data-status').textContent=state.flight.length?state.flight.length+t('countSuffix'):t(state.flightError||'flightStatusEmpty')
    renderItems();renderMarkers()
   }
  }
 }
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
 renderWorldPulse()
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
 state.cinema=createCinema({lang:state.lang,onToast:toast,onScene:scene=>{
  if(state.view==='watch'){
   state.selected=scene
   showDetail(scene)
  }
 }})
 window.addEventListener('worlddesk:source',event=>{
  if(event.detail?.url)void openKnown(event.detail.url)
 })
 el('language-select').value=state.choice
 el('language-select').addEventListener('change',e=>{setLanguage(e.target.value);tick()})
 el('city-select').addEventListener('change',e=>setCity(e.target.value))
 for(const b of document.querySelectorAll('[data-view]'))
  b.addEventListener('click',()=>changeView(b.dataset.view))
 el('refresh').addEventListener('click',()=>{
  if(state.view==='watch'){void state.cinema?.refreshEarth();state.cinema?.refreshClouds()}
  if(state.view==='flight')void loadFlights()
  else void loadWorld()
 })
 el('surprise').addEventListener('click',()=>{
  if(state.view==='watch'){state.cinema?.next();return}
  const values=allAvailable()
  if(!values.length){toast(t('surpriseWait'));return}
  const selected=values[Math.floor(Math.random()*values.length)]
  if(state.view!=='all'&&state.view!==selected.kind)changeView('all')
  selectItem(selected,true)
  toast(t('surpriseFound'))
 })
 el('save').addEventListener('click',()=>{
  const item=state.selected;if(!item){toast(t('selectFirst'));return}
  if(item.kind==='flight'){toast(t('flightInfo'));return}
  if(state.saved.has(item.id)){state.saved.delete(item.id);toast(t('unsaved'))}
  else{state.saved.set(item.id,safeSnapshot(item));toast(t('saved'))}
  persistFavorites();showDetail(item)
  if(state.view==='saved'){renderItems();renderMarkers()}
 })
 el('share').addEventListener('click',async()=>{
  const item=state.selected;if(!item){toast(t('selectFirst'));return}
  const title='WorldDesk · '+titleOf(item)
  const description=subtitleOf(item)+' · '+displayTime(item)+(item.kind==='scene'?' · '+item.author+' · '+item.license:'')
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
 el('flight-follow').addEventListener('click',()=>{
  if(state.selected?.kind!=='flight')return
  state.followedHex=state.followedHex===state.selected.hex?null:state.selected.hex
  showDetail(state.selected);renderMarkers()
  if(state.followedHex)map.setView(state.selected.point,8,{animate:true})
 })
 el('flight-area').addEventListener('change',event=>{
  state.flightRegion=event.target.value
  state.flightSamples=[]
  flightRequestSerial++
  state.flightLoading=false
  state.flight=[];state.followedHex=null
  state.flightLastUpdate=null
  state.flightError=null
  const center=currentFlightCenter()
  if(center)map.setView([center.lat,center.lon],6,{animate:false})
  void loadFlights()
 })
 el('flight-refresh').addEventListener('click',()=>void loadFlights())
 el('flight-map-style').addEventListener('change',event=>{
  state.flightMapStyle=event.target.value
  writeLocal(LOCAL_MAP,state.flightMapStyle)
  void useBasemap()
 })
 el('flight-list-toggle').addEventListener('click',()=>{
  state.flightListOpen=!state.flightListOpen
  renderMenu()
  requestAnimationFrame(()=>map.invalidateSize({animate:false}))
 })
 el('close-inspector').addEventListener('click',()=>{
  state.flightPanelOpen=false
  renderMenu()
  requestAnimationFrame(()=>map.invalidateSize({animate:false}))
 })
 el('flight-search').addEventListener('input',event=>{
  state.flightSearch=event.target.value
  if(state.view==='flight'){renderItems();renderMarkers()}
 })
 el('flight-airborne').addEventListener('change',event=>{
  state.flightAirborne=event.target.checked
  if(state.view==='flight'){renderItems();renderMarkers()}
 })
 for(const btn of document.querySelectorAll('[data-subview]'))
  btn.addEventListener('click',()=>changeView(btn.dataset.subview))
 el('bridge-check').addEventListener('click',()=>void checkBridge())
 applyLanguage();tick()
 setInterval(tick,30000)
 setInterval(()=>{
  if(state.view==='flight'&&!document.hidden&&!state.flightLoading)void loadFlights()
 },60000)
 setInterval(()=>{if(state.location){updateSky();if(state.view==='sky'||state.view==='nearby')renderItems()}},900000)
 void probeBridge()
 void initializeLocation()
 void loadWorld()
}
