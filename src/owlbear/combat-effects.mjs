// Pathfinder-style HP application shared by server-owned party sheets and
// Owlbear NPC scene metadata. No user-supplied damage totals are trusted.
export const COMBAT_CHANNEL='com.cosmos.character-sheets/combat-approval-v1';
export const VALIDATION='com.cosmos.character-sheets/combat-validation';
export function validationFrom(room={}){
 const data=room?.[VALIDATION]||{};
 return {weapon:data.weapon===true,ability:data.ability===true};
}
export function computeCombatEffect(roll,{defense='ac',ac=null}={}){
 if(!roll||!['weapon','ability','spell'].includes(roll.kind))throw Error('This receipt is not a weapon, spell, or ability roll.');
 const kind=roll.kind==='weapon'?'damage':roll.effectType;
 if(!['damage','heal','temp_hp'].includes(kind))throw Error('This roll has no targeted HP effect.');
 const attack=roll.kind==='weapon'?roll:roll.attack;
 let hit=true,reason='';
 if(roll.spellFailure?.failed){hit=false;reason='Spell failed';}
 else if(attack){
  if(!Number.isFinite(ac))throw Error('The target has no known '+defense.toUpperCase()+'.');
  const face=attack.rolls?.[0];
  if(!Number.isInteger(face)||face<1||face>20)throw Error('Invalid attack die.');
  hit=face===20||face!==1&&Number.isFinite(attack.total)&&attack.total>=ac;
  reason=hit?'Hit':'Miss';
 }else reason='No attack roll';
 let critical=false,amount=0;
 if(hit){
  let damage=roll.damage;
  const confirmation=roll.critical?.confirmation;
  if(kind==='damage'&&attack&&roll.critical?.threat&&confirmation&&
     Number.isInteger(confirmation.rolls?.[0])&&
     (confirmation.rolls[0]===20||confirmation.rolls[0]!==1&&confirmation.total>=ac)){
   critical=true;
   if(roll.critical?.damage)damage=roll.critical.damage;
  }
  amount=Math.max(0,Math.floor(Number(damage?.total)||0));
  if(!Number.isSafeInteger(amount)||amount>1000000)throw Error('Damage or healing roll exceeds supported limits.');
 }
 return {kind,hit,critical,amount,reason,defense,ac};
}
export function applyCombatHp({hp,hpMax,hpTemp=0},effect){
 if(!Number.isFinite(hp)||!Number.isFinite(hpMax)||!Number.isFinite(hpTemp))throw Error('Target HP is not available.');
 const before={hp,hpMax,hpTemp:Math.max(0,hpTemp)};
 const n=Math.max(0,Math.floor(effect.hit?effect.amount:0));
 let after={...before};
 if(effect.kind==='damage'){
  const absorbed=Math.min(after.hpTemp,n);after.hpTemp-=absorbed;after.hp-=n-absorbed;
 }else if(effect.kind==='heal')after.hp=Math.min(hpMax,after.hp+n);
 else if(effect.kind==='temp_hp'){
  // Conservative nonstacking: replace a smaller pool, never add the same source.
  after.hpTemp=Math.max(after.hpTemp,n);
 }
 return {before,after,applied:effect.kind==='damage'?before.hp-after.hp+before.hpTemp-after.hpTemp:
  effect.kind==='heal'?after.hp-before.hp:after.hpTemp-before.hpTemp};
}
