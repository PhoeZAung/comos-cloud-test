import {BATTLE} from './battle-state.mjs';
import {applyCombatHp} from './combat-effects.mjs';

// Owlbear metadata stores NPC current HP. The receipt IDs prevent replaying
// the same action after a popup refresh or a network retry.
export async function applyNpcTokenReceipt(OBR,{tokenId,receiptId,effect}){
 if(typeof tokenId!=='string'||typeof receiptId!=='string'||!effect)throw Error('Invalid NPC combat receipt.');
 let outcome=null,found=false;
 await OBR.scene.items.updateItems([tokenId],drafts=>{
  for(const item of drafts){
   if(item.id!==tokenId||item.metadata?.[BATTLE]?.enabled!==true)continue;
   found=true;
   const saved=item.metadata[BATTLE],seen=Array.isArray(saved.appliedRollIds)?saved.appliedRollIds:[];
   if(seen.includes(receiptId)){outcome={duplicate:true,before:null,after:null};return;}
   const change=applyCombatHp({hp:saved.hp,hpMax:saved.hpMax,hpTemp:saved.hpTemp||0},effect);
   saved.hp=change.after.hp;saved.hpTemp=change.after.hpTemp;
   saved.appliedRollIds=[...seen.slice(-31),receiptId];
   outcome={duplicate:false,...change};
  }
 });
 if(!found||!outcome)throw Error('Target NPC is no longer in battle.');
 return outcome;
}
