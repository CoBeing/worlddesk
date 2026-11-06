import {calendarToday,calendarDay,calendarText,calendarMarkdown,validCalendarDate,shiftCalendarDate,MIN_DATE,MAX_DATE,CALENDAR_SOURCE} from './seasonal-calendar.mjs'
const labels={
 zh:{title:'岁时 · 把今天写进日记',date:'查看日期',today:'今天',prev:'前一天',next:'后一天',phenology:'传统物候',copy:'复制 Markdown',source:'节气知识与来源 ↗',manual:'剪贴板不可用，请手动复制：',copied:'已复制，可粘贴到日记。',invalid:'请选择 1900–2100 年间的有效日期。',unavailable:'历法资料暂不可用；世界探索不受影响。'},
 en:{title:'Seasonal calendar · Keep a note of today',date:'Calendar date',today:'Today',prev:'Previous day',next:'Next day',phenology:'Traditional phenology (Chinese)',copy:'Copy Markdown',source:'Solar terms & source ↗',manual:'Clipboard unavailable. Copy the selected text:',copied:'Copied. Paste into your journal.',invalid:'Choose a valid date between 1900 and 2100.',unavailable:'Calendar unavailable; world exploration is still available.'}
}
export function createSeasonalCard(root,{lang='zh',openSource=()=>{}}={}){
 let language=lang,date=calendarToday(),followingToday=true,day=null,copySerial=0
 root.innerHTML='<details class="seasonal-details"><summary><span class="seasonal-heading"></span><span class="seasonal-summary"></span></summary><div class="seasonal-body"><div class="seasonal-controls"><button data-action="prev">←</button><label><span class="seasonal-date-label"></span> <input type="date" min="1900-01-01" max="2100-12-31"></label><button data-action="next">→</button><button data-action="today"></button></div><p class="seasonal-zone"></p><div class="seasonal-columns"><div><h3 class="seasonal-lunar"></h3><p class="seasonal-term"></p><small class="seasonal-phenology-label"></small><h3 class="seasonal-phenology"></h3></div><div><p class="seasonal-note"></p><p class="seasonal-caution"></p><button data-action="source"></button></div></div><div class="seasonal-copy"><button data-action="copy"></button><span role="status" class="seasonal-status"></span></div><label class="seasonal-manual" hidden><span></span><textarea readonly rows="8"></textarea></label></div></details>'
 const q=s=>root.querySelector(s),button=action=>q(`[data-action="${action}"]`),text=()=>labels[language]
 function render(){
  copySerial++
  const l=text();q('.seasonal-heading').textContent=l.title;q('.seasonal-date-label').textContent=l.date
  q('input').value=date;q('input').setAttribute('aria-label',l.date)
  for(const a of ['today','copy','source'])button(a).textContent=l[a]
  for(const a of ['prev','next'])button(a).setAttribute('aria-label',l[a])
  q('.seasonal-phenology-label').textContent=l.phenology
  q('.seasonal-status').textContent='';q('.seasonal-manual').hidden=true;q('textarea').value=''
  q('.seasonal-manual span').textContent=l.manual
  button('prev').disabled=date<=MIN_DATE;button('next').disabled=date>=MAX_DATE
  try{
   day=calendarDay(date);const t=calendarText(day,language)
   q('.seasonal-summary').textContent=`${date} · ${t.term}`
   for(const [name,value] of Object.entries({lunar:t.lunar,term:t.term,phenology:day.pentad,note:t.note,caution:t.caution,zone:t.zone}))q(`.seasonal-${name}`).textContent=value
   button('copy').disabled=false
  }catch{
   day=null;button('copy').disabled=true;q('.seasonal-summary').textContent=l.unavailable
   for(const name of ['lunar','term','phenology','note','caution','zone'])q(`.seasonal-${name}`).textContent=''
  }
 }
 function select(iso){
  if(!validCalendarDate(iso)){q('input').value=date;q('.seasonal-status').textContent=text().invalid;return}
  date=iso;followingToday=date===calendarToday();render()
 }
 q('input').addEventListener('change',e=>select(e.target.value))
 button('prev').addEventListener('click',()=>select(shiftCalendarDate(date,-1)))
 button('next').addEventListener('click',()=>select(shiftCalendarDate(date,1)))
 button('today').addEventListener('click',()=>select(calendarToday()))
 button('source').addEventListener('click',()=>openSource(CALENDAR_SOURCE))
 button('copy').addEventListener('click',async()=>{
  if(!day)return
  const content=calendarMarkdown(day,language),serial=++copySerial
  try{await navigator.clipboard.writeText(content);if(serial===copySerial)q('.seasonal-status').textContent=text().copied}
  catch{if(serial!==copySerial)return;q('.seasonal-manual').hidden=false;q('textarea').value=content;q('textarea').focus();q('textarea').select()}
 })
 render()
 return {
  updateLanguage(value){language=value==='zh'?'zh':'en';render()},
  tick(now=new Date()){const today=calendarToday(now);if(followingToday&&today!==date){date=today;render()}}
 }
}
