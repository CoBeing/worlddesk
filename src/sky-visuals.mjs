const calendarToday=date=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-')}
import {skyObservations,formatAtLocation} from './sky.mjs'
export const PHASES={zh:['新月','娥眉月','上弦月','盈凸月','满月','亏凸月','下弦月','残月'],en:['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent']}
export function phaseIndex(phase){return ((Math.round(phase*8)%8)+8)%8}
export function moonSvg(phase,label='Moon'){
 const p=((phase%1)+1)%1,c=Math.cos(p*Math.PI*2),waxing=p<=.5,points=[]
 // Orthographic illuminated hemisphere. Northern-view convention, not camera imagery.
 for(let i=0;i<=64;i++){const y=-1+i/32;const x=Math.sqrt(Math.max(0,1-y*y));points.push([50+42*(waxing?x:-x),50+42*y])}
 for(let i=64;i>=0;i--){const y=-1+i/32;const x=Math.sqrt(Math.max(0,1-y*y));points.push([50+42*(waxing?c*x:-c*x),50+42*y])}
 const safe=label.replace(/[<>&"']/g,'')
 return `<svg viewBox="0 0 100 100" role="img" aria-label="${safe}"><circle cx="50" cy="50" r="43" fill="#0c1828" stroke="#637186"/><polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="#e8e1c9"/><circle cx="50" cy="50" r="42" fill="none" stroke="#91a0b1" stroke-width=".5"/></svg>`
}
function sunSvg(setting){
 return `<svg viewBox="0 0 260 120" role="img" aria-label="${setting?'Sunset illustration':'Sunrise illustration'}"><rect width="260" height="120" rx="12" fill="${setting?'#342b49':'#173d55'}"/><path d="M25 88 Q130 -35 235 88" fill="none" stroke="#e4b67b" stroke-dasharray="4 5"/><circle cx="130" cy="70" r="27" fill="${setting?'#ef9966':'#ffda8c'}"/><path d="M0 88 Q60 74 120 89 T260 83 V120 H0Z" fill="#183b40"/><path d="M130 ${setting?'15 v28 m-7 -7 l7 7 7 -7':'43 v-28 m-7 7 l7 -7 7 7'}" fill="none" stroke="#fff2ce" stroke-width="2"/></svg>`
}
export function relationSvg(phase,lang='zh'){
 const a=phase*Math.PI*2,x=245-76*Math.cos(a),y=110+76*Math.sin(a),zh=lang==='zh'
 return `<svg viewBox="0 0 360 225" role="img" aria-label="${zh?'日地月位置关系示意':'Sun Earth Moon phase diagram'}"><path d="M245 34a76 76 0 1 1 0 152a76 76 0 1 1 0 -152" fill="none" stroke="#52687e" stroke-dasharray="4 4"/><circle cx="48" cy="110" r="30" fill="#ffcb74"/><path d="M92 75h64m-8 -5l8 5 -8 5 M92 110h64m-8 -5l8 5 -8 5 M92 145h64m-8 -5l8 5 -8 5" stroke="#e8bb73" fill="none"/><line x1="245" y1="110" x2="${x}" y2="${y}" stroke="#668fa4"/><circle cx="245" cy="110" r="19" fill="#10253d"/><path d="M245 91a19 19 0 0 0 0 38Z" fill="#6ab8ca"/><circle cx="${x}" cy="${y}" r="11" fill="#172338"/><path d="M${x} ${y-11}a11 11 0 0 0 0 22Z" fill="#e8e1c9"/><g fill="#c7d6de" font-size="12" text-anchor="middle"><text x="48" y="158">${zh?'太阳':'Sun'}</text><text x="245" y="142">${zh?'地球':'Earth'}</text><text x="${x}" y="${y-17}">${zh?'月球':'Moon'}</text></g></svg>`
}
export function createSkyVisuals(root,{lang='zh',onSelect=()=>{},onDate=()=>{}}={}){
 let language=lang,location=null,rows=[],demo=null,offset=0
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
 const controls=el('div',null,'sky-time-travel'),label=el('label'),range=document.createElement('input'),dateLabel=el('strong'),resetDate=el('button'),stage=el('div')
 range.type='range';range.min='-14';range.max='30';range.step='1';range.value='0';range.id='sky-day-slider'
 label.htmlFor=range.id;resetDate.type='button'
 controls.append(label,dateLabel,range,resetDate);root.append(controls,stage)
 const selectedDate=()=>new Date(Date.now()+offset*86400000)
 range.addEventListener('input',()=>{offset=Number(range.value);demo=null;render();onDate(calendarToday(selectedDate()))})
 resetDate.addEventListener('click',()=>{offset=0;range.value='0';demo=null;render();onDate(calendarToday(selectedDate()))})
 function render(){
  const zh=language==='zh';stage.replaceChildren()
  const date=selectedDate()
  label.textContent=zh?'拖动时间，看看月亮怎么变':'Slide through time. Watch the Moon change.'
  dateLabel.textContent=offset===0?(zh?'此刻':'Now'):formatAtLocation(date.getTime(),location?.tz,language)
  resetDate.textContent=zh?'回到今天':'Back to today'
  range.setAttribute('aria-valuetext',dateLabel.textContent)

  stage.append(el('h2',zh?'天空与历法':'Sky & calendar'))
  if(!location){stage.append(el('p',zh?'选择观测城市后查看当地天空。':'Choose a city to explore its sky.'));return}
  rows=skyObservations(location,date)
  const cards=el('div',null,'sky-visual-cards')
  for(const row of rows){
   const b=el('button',null,'sky-visual-card');b.type='button'
   const visual=el('div',null,'sky-picture')
   visual.innerHTML=row.skyType==='moon'?moonSvg(row.moonPhase,PHASES[language][phaseIndex(row.moonPhase)]):sunSvg(row.skyType==='sunset')
   const name=row.skyType==='sunrise'?(zh?'下一次日出':'Next sunrise'):row.skyType==='sunset'?(zh?'下一次日落':'Next sunset'):PHASES[language][phaseIndex(row.moonPhase)]
   b.append(visual,el('strong',name),el('span',row.skyType==='moon'?(zh?'照亮 ':'Illuminated ')+Math.round(row.moonFraction*100)+'%':formatAtLocation(row.when,location.tz,language)))
   b.addEventListener('click',()=>onSelect(row));cards.append(b)
  }
  stage.append(cards)
  const relation=el('details',null,'sky-relation');relation.open=true
  relation.append(el('summary',zh?'为什么有上弦月和下弦月？':'Why do lunar phases change?'))
  const phase=demo===null?rows[2].moonPhase:demo
  const body=el('div',null,'sky-relation-body'),diagram=el('div');diagram.innerHTML=relationSvg(phase,language)
  const explanation=el('div');const preview=el('div',null,'phase-preview');preview.innerHTML=moonSvg(phase,PHASES[language][phaseIndex(phase)])
  explanation.append(preview,el('strong',(demo===null?(zh?(offset===0?'当前月相 · ':'这一天 · '):(offset===0?'Current phase · ':'Selected day · ')):(zh?'演示 · ':'Demo · '))+PHASES[language][phaseIndex(phase)]),el('p',zh?'月球始终有一半被太阳照亮；从地球看到的受光部分随相对位置变化。上弦月在满月之前，下弦月在满月之后。':'The Sun lights half the Moon. From Earth we see different portions as its position changes. First quarter comes before full moon; last quarter follows it.'))
  body.append(diagram,explanation);relation.append(body)
  const choices=el('div',null,'moon-phase-choices')
  PHASES[language].forEach((name,i)=>{const b=el('button');b.type='button';b.innerHTML=moonSvg(i/8,name);b.append(el('span',name));b.setAttribute('aria-pressed',String(demo===i/8));b.addEventListener('click',()=>{demo=i/8;render();root.querySelectorAll('.moon-phase-choices button')[i]?.focus()});choices.append(b)})
  relation.append(choices)
  const reset=el('button',zh?'返回所选日期月相':'Return to selected date','soft-action');reset.type='button';reset.addEventListener('click',()=>{demo=null;render();root.querySelector('.sky-relation .soft-action')?.focus()});relation.append(reset)
  relation.append(el('p',zh?'本机计算与教学示意，非实拍；从地球北极上方俯视，距离、大小及轨道倾角未按比例。月面图采用北半球朝向，实际倾斜随地点和时刻变化；不用于预测日月食。':'Local calculations and educational illustrations, not photographs. View from above Earth’s north pole; sizes, distances and inclination are not to scale. Moon faces use a northern-view convention; actual tilt depends on place and time. Not an eclipse prediction.','sky-note'))
  stage.append(relation)
 }
 render()
 return {update(loc,value=language){location=loc;language=value==='zh'?'zh':'en';render()}}
}
