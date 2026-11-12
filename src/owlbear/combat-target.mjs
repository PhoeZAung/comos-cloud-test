import {effectType} from '../features/sheet/effect-types.mjs';
import {attackType} from '../features/sheet/model.mjs';

// Advisory action gate for the Owlbear UI. Actor sheet access is independently
// verified by the existing Cosmos server session. No HP changes are performed.
export function resolveCombatTarget({characterId,kind,row={},battle=[],turn={},selection=[],ready=false,admin=false}={}){
 if(kind!=='weapon'&&effectType(row)==='none')return null;
 if(!ready||!Array.isArray(battle)||!battle.length)return null; // Out of combat.
 const actor=battle.find(item=>item.available!==false&&
  (item.siteId===characterId||(admin===true&&item.isNpc&&item.npcId===characterId)));
 if(!actor)throw Error('Add and link this character token to initiative before using a targeted combat action.');
 const active=turn?.id===undefined?battle[0]?.id:turn?.id;
 if(active!==actor.id)throw Error('Targeted combat actions are available only on this character’s initiative turn.');
 if(!Array.isArray(selection)||selection.length!==1)throw Error('Select exactly one combatant token in Owlbear before this action.');
 const target=battle.find(item=>item.id===selection[0]&&item.visible!==false&&item.available!==false);
 if(!target)throw Error('Choose a visible combatant from initiative as your target.');
 const kindEffect=kind==='weapon'?'damage':effectType(row);
 if(['heal','temp_hp'].includes(kindEffect)&&!String(row.damage||row.dmg||'').trim())throw Error('Set a healing or temporary HP Dice Roll formula before using this ability.');
 if(kindEffect==='damage'&&target.id===actor.id)throw Error('Choose a different target to attack.');
 if(kindEffect==='heal'||kindEffect==='temp_hp'){
  if(!target.siteId||target.isNpc)throw Error('Choose a linked party character to receive healing or temporary HP.');
 }else if(kindEffect==='damage'){
  // PC attack → enemy; NPC attack → PC. GM can still resolve ally damage manually.
  if(Boolean(actor.isNpc)===Boolean(target.isNpc))throw Error('Choose an opposing combatant token to attack.');
 }
 const type=attackType(row.attack_type||'melee');
 const defense=type==='cmb'?'cmd':['touch','ranged_touch'].includes(type)?'touch':'ac';
 return {actorId:actor.id,targetId:target.id,targetName:target.name,kind:kindEffect,
  defense,ac:Number.isFinite(target[defense])?target[defense]:null};
}

export function attackOutcome(roll,target){
 if(!roll||!target||target.ac===null||!['damage'].includes(target.kind))return null;
 const attack=roll.kind==='weapon'?roll:roll.attack;
 if(!attack||!Number.isFinite(attack.total)||!Number.isInteger(attack.rolls?.[0]))return null;
 const face=attack.rolls[0];
 return face===1?'Miss':face===20||attack.total>=target.ac?'Hit':'Miss';
}
