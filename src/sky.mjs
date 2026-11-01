import * as SunCalc from 'suncalc'
const nextTime=(date,lat,lon,key)=>{
 for(let d=0;d<4;d++){
  const candidate=new Date(date.getTime()+d*86400000)
  const time=SunCalc.getTimes(candidate,lat,lon)[key]
  if(time instanceof Date&&!isNaN(time)&&time.getTime()>date.getTime())return time.getTime()
 }
 return null
}
export function skyObservations(location,now=new Date()){
 if(!location||!Number.isFinite(location.lat)||!Number.isFinite(location.lon))return []
 const lat=location.lat,lon=location.lon
 const moon=SunCalc.getMoonIllumination(now)
 const city=location.city||location.zh||location.en||''
 const position=[lat,lon]
 const anchor=location.id||'auto'
 const sunrise=nextTime(now,lat,lon,'sunrise')
 const sunset=nextTime(now,lat,lon,'sunset')
 const base={kind:'sky',point:position,sourceUrl:null,locationName:city,tz:location.tz||'UTC'}
 return [
  {...base,id:'sky:sunrise:'+anchor,titleKey:'skySunrise',subtitleKey:'skySunriseSub',when:sunrise,skyType:'sunrise'},
  {...base,id:'sky:sunset:'+anchor,titleKey:'skySunset',subtitleKey:'skySunsetSub',when:sunset,skyType:'sunset'},
  {...base,id:'sky:moon:'+anchor,titleKey:'skyMoon',subtitleKey:'skyMoonSub',when:now.getTime(),moonFraction:moon.fraction,moonPhase:moon.phase,skyType:'moon'}
 ]
}
export function formatAtLocation(timestamp,tz,locale='zh'){
 if(!Number.isFinite(timestamp))return locale==='zh'?'时间待计算':'Time unavailable'
 try{return new Intl.DateTimeFormat(locale==='zh'?'zh-CN':'en-US',{
  timeZone:tz||'UTC',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false
 }).format(new Date(timestamp))}catch{return new Date(timestamp).toISOString()}
}
