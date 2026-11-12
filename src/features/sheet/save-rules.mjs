// Structured Pathfinder 1e save handling for existing spell/ability HP effects.
// Original descriptive saving_throw text remains on the sheet; it never silently
// turns into an automatic save rule.
export const saveTypes=Object.freeze({
 none:'No saving throw',fort:'Fortitude',ref:'Reflex',will:'Will'
});
export const saveOutcomes=Object.freeze({
 manual:'GM resolves the save effect',
 negates:'Success negates HP effect',
 half:'Success halves HP effect',
 alternate:'Success uses different damage dice'
});
const harmlessNone=/^(?:none|no save|n\/a|not applicable|\s*)$/i;
export function resolveSavingThrow(roll,effect,{bonus,die}={}){
 if(roll.kind==='weapon'||!effect.hit)return {effect,check:null};
 const source=roll.resolution||{};
 const type=Object.hasOwn(saveTypes,source.saveType)?source.saveType:'none';
 const description=String(source.saveDescription||'').trim();
 if(type==='none'){
  if(description&&!harmlessNone.test(description))throw Error('This spell/ability describes a save ('+description.slice(0,70)+'). Set Save type and success effect before automatic HP.');
  return {effect,check:null};
 }
 const outcome=Object.hasOwn(saveOutcomes,source.saveSuccess)?source.saveSuccess:'manual';
 if(outcome==='manual')throw Error('This save has a partial or special effect. Resolve it with the GM; no HP was applied.');
 const dc=Number(roll.dc);
 if(!Number.isInteger(dc)||dc<1||dc>100000)throw Error('Set a valid spell DC or ability Save DC formula before resolving a '+saveTypes[type]+' save.');
 if(!Number.isFinite(bonus)||!Number.isInteger(bonus)||Math.abs(bonus)>100000)throw Error('Target '+saveTypes[type]+' save bonus is missing. Add it to the NPC stat block before automatic HP.');
 if(!Number.isInteger(die)||die<1||die>20)throw Error('A server-generated 1d20 roll is required for saving throws.');
 const total=die+bonus,passed=die===20||die!==1&&total>=dc;
 let next=effect;
 if(passed){
  if(outcome==='negates')next={...effect,hit:false,amount:0,reason:'Save negated'};
  else if(outcome==='half')next={...effect,amount:Math.floor(effect.amount/2),reason:'Save for half'};
  else if(outcome==='alternate'){
   const alternative=roll.saveSuccessDamage;
   if(effect.kind!=='damage'||!alternative||!Number.isSafeInteger(alternative.total)||alternative.total<0||alternative.total>1000000)
    throw Error('Set valid alternate damage dice for a successful save, e.g. 3d6+{CL}.');
   next={...effect,amount:alternative.total,saveDamageUsed:true,reason:'Save: alternate damage'};
  }
 }
 const check={type:'save',save:type,dc,roll:die,bonus,total,passed,outcome,amountBefore:effect.amount,amountAfter:next.amount};
 return {effect:next,check};
}
