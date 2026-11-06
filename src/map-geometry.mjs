// Keep dateline-crossing coastlines continuous instead of drawing bands across the ocean.
export function unwrapLand(geojson) {
 const result=structuredClone(geojson)
 const ring=(points,reference)=>{
  const out=[]
  for(const point of points){
   const previous=out.at(-1)?.[0]??point[0]
   out.push([point[0]+360*Math.round((previous-point[0])/360),...point.slice(1)])
  }
  // Polar rings wind around the whole globe and must retain their original closure.
  if(Math.abs(out.at(-1)[0]-out[0][0])>180)return points
  const center=(Math.min(...out.map(p=>p[0]))+Math.max(...out.map(p=>p[0])))/2
  const shift=360*Math.round(((reference??0)-center)/360)
  return out.map(([lon,...rest])=>[lon+shift,...rest])
 }
 const polygon=rings=>{
  const outer=ring(rings[0])
  const center=(Math.min(...outer.map(p=>p[0]))+Math.max(...outer.map(p=>p[0])))/2
  return [outer,...rings.slice(1).map(r=>ring(r,center))]
 }
 const walk=g=>{
  if(g.type==='FeatureCollection')g.features.forEach(walk)
  else if(g.type==='Feature')walk(g.geometry)
  else if(g.type==='GeometryCollection')g.geometries.forEach(walk)
  else if(g.type==='Polygon')g.coordinates=polygon(g.coordinates)
  else if(g.type==='MultiPolygon')g.coordinates=g.coordinates.map(polygon)
 }
 walk(result)
 return result
}
