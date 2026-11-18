import {attackType} from './model.mjs';

// Target defense is independent of attack roll type. Auto preserves legacy behavior.
export const targetDefenseChoices=Object.freeze({
 auto:'Automatic (attack type)',
 ac:'Normal AC',
 touch:'Touch AC',
 flat:'Flat-Footed AC',
 cmd:'CMD'
});
export function targetDefenseForAttack(row={}){
 const type=attackType(row.attack_type||'melee');
 if(type==='cmb')return 'cmd'; // Combat maneuver rolls always oppose CMD.
 if(Object.hasOwn(targetDefenseChoices,row.target_defense)&&row.target_defense!=='auto')return row.target_defense;
 return type==='touch'||type==='ranged_touch'?'touch':'ac';
}
