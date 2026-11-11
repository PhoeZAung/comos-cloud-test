import {diceTerms,damageExpression,entryCalculations,armorSpellFailure,criticalProfile,weaponDamageFormulas} from '../features/sheet/calculations.mjs';
import {weaponAttackParts} from '../features/sheet/model.mjs';

// Build only the same simple formulas that the Cosmos backend supports.
export async function requestSheetDice(character,change,requestRoll){
 const data=character.data||{},responses=[];
 async function roll(expression){
  const terms=diceTerms(expression);
  const notation=terms.map((t,i)=>(t.sign<0?'-':i?'+':'')+(t.count?t.count+'d'+t.sides:t.flat)).join('');
  const result=await requestRoll(notation),groups=result?.groups;
  if(!Array.isArray(groups))throw Error('Dice+ returned no dice.');
  const expected=terms.filter(t=>t.count),faces=[];
  if(groups.length!==expected.length)throw Error('Dice+ returned different dice groups.');
  groups.forEach((group,i)=>{
   const term=expected[i];
   if(group.isCondensed||group.diceType!=='d'+term.sides||!Array.isArray(group.dice)||group.dice.length!==term.count)throw Error('Dice+ returned different dice.');
   for(const die of group.dice){if(die.kept===false||die.label!==undefined||!Number.isInteger(die.value)||die.value<1||die.value>term.sides)throw Error('Dice+ returned an unsupported face.');faces.push(die.value);}
  });
  responses.push({expression,faces});return faces;
 }
 if(!change.kind){await roll(change.expression);return responses;}
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
 const attack=attackExpression?await roll(attackExpression):null;
 const profile=criticalProfile(row),cmb=weapon?calculation.type==='cmb':calculation.attack?.mode==='cmb';
 const threat=attack&&!cmb&&attack[0]!==1&&attack[0]>=profile.minimum;
 const formulas=weapon?weaponDamageFormulas(row,data,threat?profile.multiplier:0):{normal:hasDamage?damageExpression(String(row.damage||row.dmg),calculation.ctx):''};
 if(formulas.normal)await roll(formulas.normal);
 if(threat){await roll(attackExpression);if(formulas.critical)await roll(formulas.critical);}
 return responses;
}
