// GM-only advisory targeting. Only linked, living party combatants are eligible.
// Distances use the tokens' Owlbear map coordinates; this cannot infer walls,
// cover, line of sight, reach, morale, or a specific creature's motivations.
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function tokenCenter(item){
 if(!item||!Number.isFinite(item.position?.x)||!Number.isFinite(item.position?.y))return null;
 const scaleX=Math.abs(finite(item.scale?.x,1)),scaleY=Math.abs(finite(item.scale?.y,1));
 const ratio=finite(item.grid?.dpi,0)>0?150/item.grid.dpi:1;
 return {x:item.position.x+finite(item.image?.width,0)*scaleX*ratio/2,
  y:item.position.y+finite(item.image?.height,0)*scaleY*ratio/2};
}
export function recommendTarget({attacker,battle=[],items=[],intelligence=null,grid=150}={}){
 if(!attacker?.isNpc)return null;
 const tokens=new Map(items.filter(item=>item.type==='IMAGE'&&item.layer==='CHARACTER'&&item.visible!==false).map(item=>[item.id,item]));
 const origin=tokenCenter(tokens.get(attacker.id));
 if(!origin)return null;
 const int=Number.isFinite(intelligence)?intelligence:10;
 const nearest=int<=2,instinctive=int<=7,strategic=int>=14;
 const cell=Math.max(1,finite(grid,150));
 let best=null;
 for(const row of battle){
  // Never recommend NPCs, unlinked tokens, hidden tokens, dead PCs, or
  // characters whose shared Cosmos status is no longer available.
  if(!row?.siteId||row.isNpc||row.visible===false||row.available===false||
     !Number.isFinite(row.hp)||row.hp<=0)continue;
  const position=tokenCenter(tokens.get(row.id));if(!position)continue;
  const distance=Math.hypot(position.x-origin.x,position.y-origin.y)/cell;
  const fraction=clamp(row.hp/Math.max(1,finite(row.hpMax,1)),0,1);
  const weakAc=clamp((18-finite(row.ac,10))/16,0,1);
  const casterHint=finite(row.mpMax)>0?1:0;
  // Location stays important. Higher-INT creatures can favor an injured,
  // easier-to-hit or magic-using PC, but must weigh the distance to reach them.
  const score=nearest?-distance:
   instinctive?-distance+0.16*(1-fraction):
   strategic?-0.65*distance+0.85*(1-fraction)+0.35*weakAc+0.12*casterHint:
    -0.8*distance+0.44*(1-fraction)+0.20*weakAc;
  if(!best||score>best.score+1e-9||
    (Math.abs(score-best.score)<=1e-9&&(distance<best.distance||
     distance===best.distance&&row.id<best.id)))best={id:row.id,name:row.name,score,distance};
 }
 return best&&{id:best.id,name:best.name};
}
