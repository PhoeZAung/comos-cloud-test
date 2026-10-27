import {characterClasses,totalClassLevel} from '../characters/ffd20.mjs';
import {number,modifier,sheetStats} from './model.mjs';
export function restRecovery(data={}){
 const classes=characterClasses(data),profiles=Array.isArray(data.castingProfiles)?data.castingProfiles:[],rows=[],unresolved=[];
 for(const c of classes){
  const profile=profiles.find(p=>p.className===c.name);
  if(profile?.mode==='none')continue;
  const ability=profile?.ability||(!c.archetype?({'Black Mage':'int','White Mage':'wis'}[c.name]||null):null);
  let cl=profile?.casterLevel;
  if(cl===undefined&&['Black Mage','White Mage'].includes(c.name)&&!c.archetype)cl=c.level;
  if(!ability||!['int','wis','cha'].includes(ability)||!Number.isInteger(cl)||cl<0){if(c.name&&number(data.mp_class)>0)unresolved.push(c.name);continue;}
  if(cl>0)rows.push({className:c.name,casterLevel:cl,ability,modifier:modifier(data[ability]??10),mp:Math.max(0,cl+modifier(data[ability]??10))});
 }
 return {hp:Math.max(1,totalClassLevel(classes)||number(data.character_level||data.level)||1),mp:rows.reduce((n,r)=>n+r.mp,0),rows,unresolved};
}
