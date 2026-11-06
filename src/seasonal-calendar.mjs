// Luo's useful cultural calendar, computed locally: no remote API or annual packs.
import {Solar} from 'lunar-typescript'
export const CALENDAR_SOURCE='https://www.hko.gov.hk/sc/gts/time/24solarterms.htm'
export const CALENDAR_ENGINE='https://github.com/6tail/lunar-typescript'
export const TERMS=['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至']
const EN_TERMS=['Minor Cold','Major Cold','Start of Spring','Rain Water','Awakening of Insects','Spring Equinox','Pure Brightness','Grain Rain','Start of Summer','Grain Buds','Grain in Ear','Summer Solstice','Minor Heat','Major Heat','Start of Autumn','End of Heat','White Dew','Autumn Equinox','Cold Dew','Frost Descent','Start of Winter','Minor Snow','Major Snow','Winter Solstice']
export const MIN_DATE='1900-01-01',MAX_DATE='2100-12-31'
export function calendarToday(now=new Date()){
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now)
 return ['year','month','day'].map(k=>p.find(v=>v.type===k).value).join('-')
}
export function validCalendarDate(iso){
 if(typeof iso!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(iso)||iso<MIN_DATE||iso>MAX_DATE)return false
 const date=new Date(`${iso}T12:00:00Z`)
 return Number.isFinite(+date)&&date.toISOString().slice(0,10)===iso
}
export function shiftCalendarDate(iso,days){
 if(!validCalendarDate(iso)||!Number.isInteger(days))throw new RangeError('Invalid calendar date')
 const date=new Date(`${iso}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+days)
 return date.toISOString().slice(0,10)
}
export function calendarDay(iso){
 if(!validCalendarDate(iso))throw new RangeError('Supported civil dates: 1900–2100')
 const solar=Solar.fromYmd(...iso.split('-').map(Number))
 const lunar=solar.getLunar()
 const today=lunar.getJieQi(),next=lunar.getNextJieQi(true),previous=lunar.getPrevJieQi(true)
 const current=today||previous.getName()
 if(!TERMS.includes(current)||!next)throw new Error('Calendar data unavailable')
 const nextDate=next.getSolar().toYmd()
 return {iso,festivals:[...new Set([...solar.getFestivals(),...lunar.getFestivals()])],year:lunar.getYear(),month:Math.abs(lunar.getMonth()),day:lunar.getDay(),leap:lunar.getMonth()<0,
  lunar:`${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
  term:today||null,current,next:next.getName(),nextDate,
  countdown:Math.round((Date.parse(nextDate+'T12:00:00Z')-Date.parse(iso+'T12:00:00Z'))/86400000),
  pentad:lunar.getWuHou(),longitude:(285+TERMS.indexOf(current)*15)%360}
}
export function calendarText(day,lang='zh'){
 const zh=lang==='zh',term=name=>zh?name:`${EN_TERMS[TERMS.indexOf(name)]} · ${name}`
 return {
  festivals:(zh?'节日：':'Festivals (Chinese names): ')+(day.festivals?.join(' · ')||(zh?'今日无收录节日':'None listed today')),
  holidayNote:zh?'节日按中国历法列出；不代表官方放假或调休安排。':'Chinese calendar festivals; not an official public-holiday or make-up workday schedule.',
  lunar:zh?day.lunar:`Lunar ${day.year} · ${day.leap?'leap ':''}month ${day.month}, day ${day.day}`,
  term:day.term?(zh?`今日${day.term}`:`Today: ${term(day.term)}`):(zh?`距${day.next}还有 ${day.countdown} 天`:`${day.countdown} days until ${term(day.next)}`),
  note:zh?`${day.current}对应太阳黄经 ${day.longitude}°。节气依太阳运行划分，并非固定的农历日期。`:`${term(day.current)} marks solar longitude ${day.longitude}°. Solar terms follow the Sun, rather than fixed lunar dates.`,
  caution:zh?'物候是传统时令记述，不代表所选城市当天的天气。':'Phenology records traditional seasonal observations, not today’s weather in the selected city.',
  zone:zh?'中国历法 · 北京时间 UTC+8 · 本机计算':'Chinese calendar · Beijing time UTC+8 · Computed on device'
 }
}
export function calendarMarkdown(day,lang='zh'){
 const text=calendarText(day,lang),zh=lang==='zh'
 return `## ${zh?'WorldDesk · 岁时':'WorldDesk · Seasonal calendar'} · ${day.iso}\n\n${text.lunar}\n\n${text.festivals}\n${text.holidayNote}\n\n- ${text.term}\n- ${zh?'传统物候':'Traditional phenology (Chinese)'}: ${day.pentad}\n\n${text.note}\n\n> ${text.caution}\n\n${text.zone}\n\n[${zh?'节气知识：香港天文台':'Solar terms: Hong Kong Observatory'}](${CALENDAR_SOURCE}) · [lunar-typescript](${CALENDAR_ENGINE})\n`
}
