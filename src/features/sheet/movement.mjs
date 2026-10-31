// Movement modes are editable sheet values. 0 means no such movement.
export const movementModes=[
 {field:'speed_burrow',label:'Burrow',hint:'Tunneling; source rules determine eligible terrain and whether a tunnel remains.'},
 {field:'speed_climb',label:'Climb',hint:'Climbing movement; special hazards may still require checks.'},
 {field:'speed_fly',label:'Fly',hint:'Flying movement; maneuverability and any ascent restrictions are separate.'},
 {field:'speed_swim',label:'Swim',hint:'Water movement; apply any associated Swim-check bonus under the correct rule.'}
];
export const flyManeuverabilities=['','clumsy','poor','average','good','perfect'];
export const movementDetails=data=>movementModes.filter(m=>Number(data?.[m.field])>0&&Number.isFinite(Number(data[m.field]))).map(m=>m.label+' '+Number(data[m.field])+' ft'+(m.field==='speed_fly'&&data.speed_fly_maneuverability?' ('+data.speed_fly_maneuverability+')':''));
export function seedRacialMovement(next,previous,raceId,traits){
 // Only fill missing fields. User-entered values, including zero, are preserved.
 if(raceId==='ffd20:race:syricta'){
  const clipped=traits.some(t=>t.id==='ffd20:race:syricta:trait:wing-clipped');
  const flying=traits.some(t=>t.id==='ffd20:race:syricta:trait:base-speed')&&
   !traits.some(t=>t.id==='ffd20:race:syricta:trait:memories-of-the-forgotten');
  if(!Object.hasOwn(previous,'speed_fly'))next.speed_fly=flying?(clipped?20:40):0;
  if(!Object.hasOwn(previous,'speed_fly_maneuverability'))
   next.speed_fly_maneuverability=flying?(clipped?'clumsy':'poor'):'';
  return;
 }
 if(raceId==='ffd20:race:sylph'){
  const improved=traits.some(t=>t.id==='ffd20:race:sylph:trait:improved-flight');
  if(!Object.hasOwn(previous,'speed_fly'))next.speed_fly=improved?60:40;
  if(!Object.hasOwn(previous,'speed_fly_maneuverability'))next.speed_fly_maneuverability=improved?'good':'poor';
  return;
 }
 if(raceId==='ffd20:race:quadav'){
  const base=traits.find(f=>f.id==='ffd20:race:quadav:trait:base-speed');
  const effect=base?.effects?.find(e=>e.target==='identity.speed.swim'&&
   e.automation==='automatic'&&!e.condition&&e.value?.kind==='constant');
  if(!Object.hasOwn(previous,'speed_swim')&&Number.isFinite(effect?.value?.value))
   next.speed_swim=effect.value.value;
  return;
 }
 if(raceId==='ffd20:race:moomba'){
  const climb=traits.some(t=>t.id==='ffd20:race:moomba:trait:climb');
  if(!Object.hasOwn(previous,'speed_climb'))next.speed_climb=climb?20:0;
  return;
 }
 if(raceId==='ffd20:race:namazu'){
  const base=traits.find(t=>t.id==='ffd20:race:namazu:trait:base-speed');
  const effect=base?.effects?.find(e=>e.target==='identity.speed.swim'&&e.automation==='automatic'&&
   !e.condition&&e.value?.kind==='constant');
  if(!Object.hasOwn(previous,'speed_swim')&&Number.isFinite(effect?.value?.value))
   next.speed_swim=effect.value.value;
  return;
 }
 if(raceId==='ffd20:race:moogle'){
  const grounded=traits.some(t=>t.id==='ffd20:race:moogle:trait:grounded');
  if(!Object.hasOwn(previous,'speed_fly'))next.speed_fly=grounded?0:20;
  if(!Object.hasOwn(previous,'speed_fly_maneuverability'))next.speed_fly_maneuverability=grounded?'':'clumsy';
  return;
 }
 if(raceId!=='ffd20:race:aegyl')return;
 if(!Object.hasOwn(previous,'speed_fly'))next.speed_fly=traits.some(t=>t.id==='ffd20:race:aegyl:trait:wing-clipped')?20:40;
 if(!Object.hasOwn(previous,'speed_fly_maneuverability'))next.speed_fly_maneuverability='poor';
}
