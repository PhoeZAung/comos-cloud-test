import {diceTerms,damageExpression,entryCalculations,context} from '../features/sheet/calculations.mjs';
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
 if(change.mode==='send'||change.mode==='use'&&!String(row.damage||row.dmg||'').trim())return [];
 let attackExpression,ctx;
 if(change.kind==='weapon'){const p=weaponAttackParts(row,data);attackExpression='1d20'+(p.total>=0?'+':'')+p.total;ctx=context(data,row);}
 else{const c=entryCalculations(row,data,key);ctx=c.ctx;if(c.attack)attackExpression='1d20'+(c.attack.bonus>=0?'+':'')+c.attack.bonus;}
 const attack=attackExpression?await roll(attackExpression):null;
 if(row.damage||row.dmg)await roll(damageExpression(String(row.damage||row.dmg),ctx));
 const minimum=Number(/^(\d{1,2})(?:\s*-\s*20)?$/.exec(String(row.crit_range||'20').replace(/[–—]/g,'-'))?.[1]);
 const cmb=change.kind==='weapon'?weaponAttackParts(row,data).type==='cmb':entryCalculations(row,data,key).attack?.mode==='cmb';
 if(attack&&!cmb&&attack[0]!==1&&attack[0]>=minimum)await roll(attackExpression);
 return responses;
}
