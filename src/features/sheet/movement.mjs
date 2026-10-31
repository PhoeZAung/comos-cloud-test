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
 // FFd20 Aegyl Base Speed: fly 40 ft poor; Wing-Clipped: fly 20 ft poor.
 // Never replace a sheet user's own edits while recompiling a saved build.
 if(raceId!=='ffd20:race:aegyl')return;
 if(!Object.hasOwn(previous,'speed_fly'))next.speed_fly=traits.some(t=>t.id==='ffd20:race:aegyl:trait:wing-clipped')?20:40;
 if(!Object.hasOwn(previous,'speed_fly_maneuverability'))next.speed_fly_maneuverability='poor';
}
