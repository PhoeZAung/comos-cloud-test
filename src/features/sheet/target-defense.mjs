import {attackType} from './model.mjs';

// Target defense is independent of attack roll type. Auto preserves legacy behavior.
export const targetDefenseChoices=Object.freeze({
 auto:'Automatic (attack type)',
 ac:'Normal AC',
 touch:'Touch AC'
});
export function targetDefenseForAttack(row={}){
 const type=attackType(row.attack_type||'melee');
 if(type==='cmb')return 'cmd'; // CMB always opposes CMD.
 if(row.target_defense==='ac'||row.target_defense==='touch')return row.target_defense;
 return type==='touch'||type==='ranged_touch'?'touch':'ac';
}
