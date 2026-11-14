import {sheetSkills,skillCanRoll} from '../features/sheet/skills.mjs';
import {skillTotal} from '../features/sheet/model.mjs';
import {diceTerms,damageExpression,entryCalculations,armorSpellFailure,criticalProfile,weaponDamageFormulas} from '../features/sheet/calculations.mjs';
import {weaponAttackParts} from '../features/sheet/model.mjs';

// Build only the same simple formulas that the Cosmos backend supports.
export async function requestSheetDice(character,change,requestRoll){
 const data=character.data||{},responses=[];
 // Dice+ supports comma-separated independent rolls in ONE request. Sending
 // attack and damage as two concurrent requests can leave the second roll
 // unprocessed while the first physical roll is still in progress.
 async function rollBatch(expressions){
  if(!expressions.length)return [];
  const entries=expressions.map(expression=>({expression,terms:diceTerms(expression)}));
  const notation=entries.map(({terms})=>terms.map((t,i)=>(t.sign<0?'-':i?'+':'')+(t.count?t.count+'d'+t.sides:t.flat)).join('')).join(', ');
  const result=await requestRoll(notation),groups=result?.groups;
  if(!Array.isArray(groups))throw Error('Dice+ returned no dice.');
  const expected=entries.flatMap(entry=>entry.terms.filter(t=>t.count));
  if(groups.length!==expected.length)throw Error('Dice+ returned different dice groups.');
  const faces=entries.map(()=>[]);let at=0;
  entries.forEach(({terms},i)=>{
   for(const term of terms.filter(t=>t.count)){
    const group=groups[at++];
    if(group.isCondensed||group.diceType!=='d'+term.sides||!Array.isArray(group.dice)||group.dice.length!==term.count)throw Error('Dice+ returned different dice.');
    for(const die of group.dice){
     if(die.kept===false||die.label!==undefined||!Number.isInteger(die.value)||die.value<1||die.value>term.sides)throw Error('Dice+ returned an unsupported face.');
     faces[i].push(die.value);
    }
   }
  });
  responses.push(...entries.map(({expression},i)=>({expression,faces:faces[i]})));
  return faces;
 }
 async function roll(expression){return (await rollBatch([expression]))[0];}
 if(!change.kind){await roll(change.expression);return responses;}
 if(change.kind==='skill'){
  const row=sheetSkills(data)[change.index];
  if(!row||!skillCanRoll(row))throw Error('Trained only: assign 1 rank before rolling this skill.');
  const bonus=skillTotal(row,data);
  await roll('1d20'+(bonus>=0?'+':'')+bonus);
  return responses;
 }
 const key=change.kind==='weapon'?'weapons':change.kind==='spell'?'spells':change.collection,row=data[key]?.[change.index];
 if(!row)throw Error('Entry unavailable. Reload your sheet.');
 if(change.mode==='send')return [];
 const weapon=change.kind==='weapon',hasDamage=Boolean(String(row.damage||row.dmg||'').trim());
 if(change.kind==='spell'){
  const chance=armorSpellFailure(data,row);
  if(chance>0){const [face]=await roll('1d100');if(face<=chance)return responses;}
 }
 if(change.mode==='use'&&!weapon&&!hasDamage)return responses;
 const calculation=weapon?weaponAttackParts(row,data,{npc:character.kind==='npc'}):entryCalculations(row,data,key);
 const bonus=weapon?calculation.total:calculation.attack?.bonus;
 const attackExpression=bonus===undefined?null:'1d20'+(bonus>=0?'+':'')+bonus;
 // Attack and normal damage land in the same Dice+ throw, but Cosmos still
 // records separate ordered receipts so the backend can apply the correct rules.
 // Crit confirmation and extra critical damage remain conditional on a threat.
 const normal=weapon?weaponDamageFormulas(row,data,0).normal:
  hasDamage?damageExpression(String(row.damage||row.dmg),calculation.ctx):'';
 const first=await rollBatch([attackExpression,normal].filter(Boolean));
 const attack=attackExpression?first[0]:null;
 const profile=criticalProfile(row),cmb=weapon?calculation.type==='cmb':calculation.attack?.mode==='cmb';
 const threat=attack&&!cmb&&attack[0]!==1&&attack[0]>=profile.minimum;
 if(threat){
  const critical=weapon?weaponDamageFormulas(row,data,profile.multiplier).critical:'';
  await rollBatch([attackExpression,critical].filter(Boolean));
 }
 return responses;
}
