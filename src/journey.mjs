// Airport connection for exploration, distinct from the observed track.
export function journeyPoints(a,b){
 if(!a||!b)return []
 const rad=Math.PI/180,vec=([lat,lon])=>[Math.cos(lat*rad)*Math.cos(lon*rad),Math.cos(lat*rad)*Math.sin(lon*rad),Math.sin(lat*rad)]
 const u=vec(a),v=vec(b),angle=Math.acos(Math.max(-1,Math.min(1,u.reduce((s,x,i)=>s+x*v[i],0))))
 if(angle<1e-8)return [a,b]
 if(Math.abs(Math.sin(angle))<1e-8)return [a,b]
 const points=[]
 for(let i=0;i<=48;i++){
  const t=i/48,p=u.map((x,j)=>(Math.sin((1-t)*angle)*x+Math.sin(t*angle)*v[j])/Math.sin(angle))
  let lon=Math.atan2(p[1],p[0])/rad
  const previous=points.at(-1)?.[1]??a[1]
  while(lon-previous>180)lon-=360
  while(lon-previous< -180)lon+=360
  points.push([Math.atan2(p[2],Math.hypot(p[0],p[1]))/rad,lon])
 }
 return points
}
