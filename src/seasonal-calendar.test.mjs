import test from 'node:test'
import assert from 'node:assert/strict'
import {calendarToday,validCalendarDate,shiftCalendarDate,calendarDay,calendarText,calendarMarkdown} from './seasonal-calendar.mjs'
test('calendar uses Beijing civil date regardless of observation city or host timezone',()=>{
 assert.equal(calendarToday(new Date('2026-11-05T15:59:59Z')),'2026-11-05')
 assert.equal(calendarToday(new Date('2026-11-05T16:00:00Z')),'2026-11-06')
})
test('reject impossible and unsupported dates without normalization',()=>{
 for(const date of ['2026-02-29','2026-04-31','1899-12-31','2101-01-01','2026-1-1','',null])assert.equal(validCalendarDate(date),false)
 assert.ok(validCalendarDate('2024-02-29'))
 assert.throws(()=>calendarDay('2026-02-29'),RangeError)
 assert.equal(shiftCalendarDate('2026-12-31',1),'2027-01-01')
})
test('Spring Festival and leap lunar month retain exact identity',()=>{
 const festival=calendarDay('2026-02-17');assert.equal(festival.month,1);assert.equal(festival.day,1);assert.equal(festival.year,2026)
 const leap=calendarDay('2023-03-22');assert.equal(leap.leap,true);assert.equal(leap.month,2);assert.equal(leap.day,1)
 assert.equal(leap.lunar,'癸卯年 闰二月初一')
})
test('term eve, term day and winter year boundary have distinct semantics',()=>{
 const eve=calendarDay('2026-11-06');assert.equal(eve.term,null);assert.equal(eve.next,'立冬');assert.equal(eve.countdown,1);assert.equal(eve.pentad,'蛰虫咸俯')
 const winter=calendarDay('2026-11-07');assert.equal(winter.term,'立冬');assert.equal(winter.current,'立冬');assert.equal(winter.longitude,225)
 assert.equal(calendarText(winter).term,'今日立冬')
 const january=calendarDay('2027-01-01');assert.equal(january.current,'冬至');assert.equal(january.nextDate,'2027-01-05');assert.equal(january.countdown,4)
 for(const date of ['1900-01-01','2100-12-31'])assert.ok(calendarDay(date).countdown>0)
})
test('both languages export sources, timezone and culture/weather distinction without Luo service dependency',()=>{
 const day=calendarDay('2026-03-20')
 for(const lang of ['zh','en']){
  const text=calendarMarkdown(day,lang)
  assert.ok(text.includes('2026-03-20'));assert.ok(text.includes('www.hko.gov.hk'));assert.ok(text.includes('UTC+8'));assert.ok(text.includes('lunar-typescript'));assert.ok(!text.includes('api-luo'))
 }
 assert.match(calendarText(day,'en').term,/Spring Equinox/)
 assert.match(calendarText(day,'en').caution,/not today’s weather/)
})
