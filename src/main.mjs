import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './style.css'
import {FEEDS,normalizeQuakes,normalizeEonet,normalizeRadios,safeSnapshot,httpsUrl} from './data.mjs'

const app=document.getElementById('app')
app.innerHTML=[
'<div class="app-shell">',
'<aside class="nav">',
' <div class="brand"><div class="brand-symbol">◉</div><div><strong>WorldDesk</strong><small>EXPLORE THE REAL WORLD</small></div></div>',
' <div class="nav-caption">探索入口</div>',
' <nav class="navigation">',
'  <button class="nav-button active" data-view="all"><span>✦</span> 世界发现</button>',
'  <button class="nav-button" data-view="quake"><span>◎</span> 全球地震</button>',
'  <button class="nav-button" data-view="event"><span>☼</span> 自然事件</button>',
'  <button class="nav-button" data-view="radio"><span>♫</span> 听听世界</button>',
'  <button class="nav-button" data-view="saved"><span>♡</span> 我的收藏</button>',
' </nav>',
' <div class="nav-spacer"></div>',
' <div class="nav-caption">我的世界</div>',
' <button class="nav-secondary" id="go-cobeing"><span>✧</span><div>CoBeing<small>共生网络 · 可选连接</small></div></button>',
' <button class="nav-secondary" id="go-gev"><span>◈</span><div>3D 深度探索<small>了解 God’s Eye View</small></div></button>',
' <div class="nav-bottom"><span class="tiny-green"></span> 公开世界数据 · 本地收藏<br><small>Preview 0.1 · 无需登录</small></div>',
'</aside>',
'<section class="content">',
' <header class="top-bar"><div><span class="kicker">YOUR WINDOW TO THE WORLD</span><h1>打开世界，随时去远方。</h1></div>',
'  <div class="top-actions"><span id="clock" class="clock"></span><button id="refresh" class="icon-button" title="刷新世界数据">↻</button></div></header>',
' <section class="hero"><div class="hero-glow"></div><div class="hero-copy"><span class="micro">LIVE WORLD SIGNALS · 真实世界的窗口</span>',
'   <h2>此刻，世界正在<br><em>发生什么？</em></h2>',
'   <p>探索地震、自然现象与世界各地的声音。<br>不必计划出发，也可以遇见远方。</p>',
'   <button id="surprise" class="surprise">✦ 给我一个惊喜 <span>↗</span></button></div>',
'   <div class="hero-planet" aria-hidden="true"><div class="planet-core"></div><div class="planet-orbit orbit-one"></div><div class="planet-orbit orbit-two"></div><div class="planet-star star-a"></div><div class="planet-star star-b"></div></div>',
' </section>',
' <div class="section-line"><div><span class="kicker">WORLD SIGNALS</span><h2 id="feed-title">正在发生</h2></div>',
'   <div class="section-status"><span id="data-status">连接公开数据源…</span><span class="status-dot"></span></div></div>',
' <div id="toast" class="toast" role="status" hidden></div>',
' <div class="explore-grid">',
'   <div class="map-pane"><div id="world-map"></div><div class="map-caption"><span class="map-live">● 世界事件</span><span>© OpenStreetMap contributors</span></div></div>',
'   <div class="feed-pane"><div class="feed-head"><span id="results-label">正在加载…</span><span class="feed-count" id="count">—</span></div><div id="feed-list" class="feed-list"></div></div>',
' </div>',
' <div class="source-note">数据来自 USGS、NASA EONET 与 Radio Browser；各来源更新频率不同，不用于安全决策。地图底图 © OpenStreetMap 贡献者。</div>',
'</section>',
'<aside class="inspector">',
' <div class="inspector-title"><span>✦ DISCOVERY CARD</span><button id="save" class="icon-button heart" title="收藏当前发现">♡</button></div>',
' <div class="detail-illustration"><div class="detail-orb">◈</div><div class="detail-ring"></div></div>',
' <span id="detail-tag" class="detail-tag">欢迎来到 WorldDesk</span>',
' <h2 id="detail-title">世界这么大，<br>随便看看。</h2>',
' <p id="detail-sub" class="detail-sub">从世界地图或左侧列表选择一个事件，也可以点击“给我一个惊喜”。</p>',
' <div id="detail-data" class="detail-data"></div>',
' <div class="detail-actions"><button id="share" class="soft-action">↗ 分享发现</button>',
'  <button id="source" class="soft-action" hidden>↗ 查看来源</button></div>',
' <section class="radio-player" id="radio-player" hidden><div class="mini-heading">♫ WORLD RADIO</div>',
'  <div id="player-name" class="player-name"></div><audio id="player" controls preload="none"></audio>',
'  <small>电台音频由第三方直接提供，播放成功、可用性及版权以来源方为准。</small></section>',
' <div class="inspector-spacer"></div>',
' <div class="bridge-card"><div class="bridge-top"><div class="bridge-icon">▦</div><div><strong>Local Bridge</strong><small>本地能力连接器 · 桌面内置</small></div></div>',
'  <div id="bridge-label" class="bridge-label">检查内置组件…</div>',
'  <button id="bridge-check" class="bridge-action">检测本地组件 <span>↗</span></button>',
'  <div id="bridge-detail" class="bridge-detail"></div></div>',
' <div class="footer-legal">WorldDesk Preview · CoBeing 生态独立应用<br>个人收藏保存在本机，不会自动同步。</div>',
'</aside>',
'</div>'
].join('')

const el=id=>document.getElementById(id)
const labels={all:'正在发生',quake:'地震观察',event:'地球自然事件',radio:'听听世界',saved:'我的收藏'}
const kinds={quake:'地震记录',event:'自然事件',radio:'电台流媒体'}
const state={quake:[],event:[],radio:[],view:'all',selected:null,saved:new Map(),markers:new Map(),loading:false,errors:[],playerId:null}
const storageKey='worlddesk:favorites:v1'
try{
 const stored=JSON.parse(localStorage.getItem(storageKey)||'[]')
 if(Array.isArray(stored))for(const raw of stored.slice(0,150)){
  const item=safeSnapshot(raw);if(item)state.saved.set(item.id,item)
 }
}catch{/* invalid local storage must not prevent launch */}
function persist(){localStorage.setItem(storageKey,JSON.stringify([...state.saved.values()].slice(-150)))}
function whenLabel(timestamp){
 if(!Number.isFinite(timestamp))return '时间由来源提供'
 return new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(timestamp))
}
function node(tag,text,cls){
 const item=document.createElement(tag)
 if(text!==undefined&&text!==null)item.textContent=String(text)
 if(cls)item.className=cls
 return item
}
let toastTimer
function toast(text){
 const target=el('toast');target.textContent=text;target.hidden=false
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>target.hidden=true,4300)
}
const map=L.map('world-map',{zoomControl:false,worldCopyJump:true,preferCanvas:true}).setView([19,22],2)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
 maxZoom:12,attribution:'© OpenStreetMap contributors',updateWhenIdle:true
}).addTo(map)
L.control.zoom({position:'bottomleft'}).addTo(map)
const layer=L.layerGroup().addTo(map)
function everything(){return [...state.event,...state.quake,...state.radio]}
function items(){
 if(state.view==='saved')return [...state.saved.values()]
 if(state.view==='all')return everything()
 return state[state.view]||[]
}
function renderMenu(){
 for(const b of document.querySelectorAll('[data-view]'))b.classList.toggle('active',b.dataset.view===state.view)
 el('feed-title').textContent=labels[state.view]||labels.all
 el('results-label').textContent=state.view==='saved'?'收藏在当前设备':'公开数据 · 由来源更新'
}
function renderList(){
 renderMenu()
 const values=items()
 const host=el('feed-list');host.replaceChildren();el('count').textContent=String(values.length)
 if(!values.length){
  host.append(node('p',state.loading?'正在连接世界…':state.view==='saved'?'还没有收藏。遇到喜欢的场景，可以点击右侧的 ♡ 保存。':'暂无可用数据。可切换其他分类或点击刷新。','empty'))
  return
 }
 for(const item of values.slice(0,100)){
  const row=node('button',null,'feed-item'+(state.selected?.id===item.id?' selected':''));row.type='button'
  const badge=node('div',item.kind==='quake'?'◎':item.kind==='event'?'☼':'♫','feed-symbol '+item.kind)
  const description=node('div',null,'feed-body')
  description.append(node('div',item.title,'item-heading'),node('div',item.subtitle,'item-description'),node('div',item.kind==='radio'?'电台目录 · 点开可播放':whenLabel(item.when),'item-time'))
  row.append(badge,description,node('span','›','feed-chevron'))
  row.addEventListener('click',()=>selectItem(item))
  host.append(row)
 }
}
function renderMap(){
 layer.clearLayers();state.markers.clear()
 const displayed=state.view==='saved'?items():state.view==='radio'?[]:state.view==='all'?[...state.event,...state.quake]:items()
 for(const item of displayed.filter(x=>x.point).slice(0,300)){
  const color=item.kind==='quake'?'#ffa46a':'#64e0b4'
  const marker=L.circleMarker(item.point,{radius:item.kind==='quake'?5.2:6.3,color,fillColor:color,weight:1.5,fillOpacity:0.67}).addTo(layer)
  marker.bindTooltip(item.title,{direction:'top',opacity:0.95})
  marker.on('click',()=>selectItem(item))
  state.markers.set(item.id,marker)
 }
}
function showDetails(item){
 if(!item)return
 el('detail-tag').textContent=kinds[item.kind]
 el('detail-title').textContent=item.title
 el('detail-sub').textContent=item.subtitle
 el('save').textContent=state.saved.has(item.id)?'♥':'♡'
 el('save').title=state.saved.has(item.id)?'取消收藏':'收藏当前发现'
 const box=el('detail-data');box.replaceChildren()
 const entries=[
  ['来源',item.kind==='quake'?'USGS':item.kind==='event'?'NASA EONET':'Radio Browser'],
  ['时间',item.kind==='radio'?'第三方电台流':whenLabel(item.when)]
 ]
 if(item.kind==='quake'&&Number.isFinite(item.magnitude))entries.push(['震级',String(item.magnitude)])
 if(item.point)entries.push(['坐标',item.point[0].toFixed(2)+'°, '+item.point[1].toFixed(2)+'°'])
 if(item.kind==='radio')entries.push(['地区',item.country||'未知'])
 for(const [label,value] of entries){
  const row=node('div',null,'detail-row');row.append(node('span',label),node('strong',value));box.append(row)
 }
 el('source').hidden=!item.sourceUrl
 const radio=el('radio-player');radio.hidden=item.kind!=='radio'
 if(item.kind==='radio'){
  el('player-name').textContent=item.title
  if(state.playerId!==item.id){
   el('player').pause();el('player').removeAttribute('src')
   if(item.streamUrl)el('player').src=item.streamUrl
   state.playerId=item.id
  }
 }else{el('player').pause();radio.hidden=true}
}
function selectItem(item){
 state.selected=item;showDetails(item)
 if(item.point){
  map.flyTo(item.point,Math.max(4,map.getZoom()),{duration:1})
  state.markers.get(item.id)?.bringToFront()
 }
 renderList()
}
async function getJson(url){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000)
 try{const r=await fetch(url,{signal:controller.signal,cache:'no-store'})
  if(!r.ok)throw new Error('HTTP '+r.status)
  return await r.json()
 }finally{clearTimeout(timer)}
}
async function loadWorld(){
 if(state.loading)return
 state.loading=true;state.errors=[]
 el('refresh').disabled=true;el('data-status').textContent='读取公开世界数据…'
 renderList()
 const jobs=await Promise.allSettled([getJson(FEEDS.earthquakes),getJson(FEEDS.events),getJson(FEEDS.radio)])
 const parse=[normalizeQuakes,normalizeEonet,normalizeRadios]
 const names=['USGS','NASA EONET','Radio Browser']
 for(let i=0;i<jobs.length;i++){
  const kind=['quake','event','radio'][i],job=jobs[i]
  if(job.status==='fulfilled'){
   const values=parse[i](job.value)
   if(values.length)state[kind]=values
   else state.errors.push(names[i]+' 暂时没有数据')
  }else state.errors.push(names[i]+' 无法访问')
 }
 state.loading=false
 const length=everything().length
 el('data-status').textContent=length?String(length)+' 条可探索记录':'公开数据源暂不可用'
 if(state.errors.length)toast(state.errors.join('；')+'。其他可用来源不受影响。')
 el('refresh').disabled=false
 renderList();renderMap()
 if(!state.selected&&length){
  selectItem([...state.event,...state.quake,...state.radio][0])
  map.setView([19,22],2,{animate:false})
 }
}
function switchView(view){
 state.view=view;renderList();renderMap()
 if(view==='radio')toast('电台仅提供国家/地区信息，不显示虚构的精确地图定位。')
}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>switchView(b.dataset.view))
el('refresh').addEventListener('click',()=>void loadWorld())
el('surprise').addEventListener('click',()=>{
 const values=everything()
 if(!values.length){toast('公开世界数据尚未加载，请检查网络并刷新。');return}
 const picked=values[Math.floor(Math.random()*values.length)]
 if(state.view!=='all'&&state.view!==picked.kind)switchView('all')
 selectItem(picked);toast('遇见了一个新的世界角落 ✦')
})
el('save').addEventListener('click',()=>{
 const item=state.selected
 if(!item){toast('先选择一个场景');return}
 if(state.saved.has(item.id)){state.saved.delete(item.id);toast('已取消本地收藏')}
 else{state.saved.set(item.id,safeSnapshot(item));toast('已保存在本机')}
 persist();showDetails(item)
 if(state.view==='saved'){renderList();renderMap()}
})
el('share').addEventListener('click',async()=>{
 const item=state.selected;if(!item){toast('先选择一个发现');return}
 const title='WorldDesk · '+item.title
 const url=item.sourceUrl||'https://github.com/CoBeing/worlddesk'
 try{
  if(navigator.share)await navigator.share({title,text:item.subtitle,url})
  else{await navigator.clipboard.writeText(title+'\n'+item.subtitle+'\n'+url);toast('已复制发现和来源链接')}
 }catch(error){if(error?.name!=='AbortError')toast('系统分享不可用，可复制来源网址')}
})
const native=!!window.__TAURI_INTERNALS__
async function openKnown(url){
 const link=httpsUrl(url)
 if(!link){toast('来源未提供可打开的 HTTPS 链接');return}
 try{
  if(native){const {invoke}=await import('@tauri-apps/api/core');await invoke('open_external',{url:link})}
  else window.open(link,'_blank','noopener,noreferrer')
 }catch{toast('无法打开外部来源；请使用浏览器访问原始项目')}
}
el('source').addEventListener('click',()=>state.selected?.sourceUrl&&void openKnown(state.selected.sourceUrl))
el('go-cobeing').addEventListener('click',()=>{
 toast('CoBeing 的记忆与同步仍在孵化；当前收藏不会上传。')
 void openKnown('https://github.com/CoBeing/cobeing')
})
el('go-gev').addEventListener('click',()=>void openKnown('https://github.com/bilawalsidhu/gods-eye-view'))
el('bridge-check').addEventListener('click',async()=>{
 if(!native){toast('网页模式不运行本地 Bridge；请下载桌面 Preview。');return}
 el('bridge-label').textContent='本地自检中…'
 try{
  const {invoke}=await import('@tauri-apps/api/core')
  const data=JSON.parse(await invoke('bridge_diagnostics'))
  el('bridge-label').textContent=data.ok===true?'已内置 · 诊断正常':'已内置 · 检查诊断详情'
  el('bridge-detail').textContent='仅运行 Bridge 自检，没有读取消息或个人文件。'
  toast('本机自检已完成')
 }catch{
  el('bridge-label').textContent='Bridge 自检未完成'
  el('bridge-detail').textContent='不影响世界探索'
 }
})
async function probeBridge(){
 if(!native){
  el('bridge-label').textContent='Web 模式 · 不需要安装 Bridge'
  el('bridge-detail').textContent='WorldDesk 桌面安装包默认携带 Local Bridge。'
  return
 }
 try{
  const {invoke}=await import('@tauri-apps/api/core')
  const report=await invoke('bridge_status')
  el('bridge-label').textContent=report.bundled?'已内置 · '+report.version:'组件暂不可用'
  el('bridge-detail').textContent=report.info
 }catch{
  el('bridge-label').textContent='组件暂不可用'
  el('bridge-detail').textContent='世界探索仍然可用'
 }
}
function clock(){
 el('clock').textContent=new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())
}
clock();setInterval(clock,30000)
void probeBridge();void loadWorld()
