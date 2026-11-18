import {isLimitBreak} from './limit-breaks.mjs';
export const abilityCollections=['activeAbilities','passiveAbilities','racialAbilities','feats'];
// Group details use the same tabs as individual abilities; only uses are shared.
export const abilityGroupEditorKeys=Object.freeze(["name","ability_kind","desc","effect","at_higher_lvls","link","action_type","range","duration","target","effect_type","attack_type","attack_misc","target_defense","attack_bonus_override","damage","damage_types","saving_throw","save_type","save_success","save_success_damage","save_dc_override","dc_formula","casting_ability","dc_misc","caster_level","sr_bonus","spell_resist","u_curr","u_max","restoreOnLongRest"]);
export function abilityGroup(data,row,collection){
 return abilityCollections.includes(collection)&&row?.abilityGroupId?(data.abilityGroups||[]).find(g=>g.id===row.abilityGroupId&&g.collection===collection)||null:null;
}

// Stable row keys keep mixed group/ability order intact when another row is removed.
export function abilityLayout(data,collection){
 const groups=(data.abilityGroups||[]).filter(g=>g.collection===collection).map(group=>({key:'group:'+group.id,group}));
 const rows=(data[collection]||[]).map((row,index)=>({key:'ability:'+(row.abilityLayoutId||index),row,index})).filter(({row})=>!isLimitBreak(row)&&!abilityGroup(data,row,collection));
 const entries=[...groups,...rows],byKey=new Map(entries.map(entry=>[entry.key,entry]));
 const ordered=[];
 for(const key of data.abilityOrder?.[collection]||[]){if(byKey.has(key)){ordered.push(byKey.get(key));byKey.delete(key);}}
 return [...ordered,...entries.filter(entry=>byKey.has(entry.key))];
}

// Every grouped ability spends from the group pool.
export function abilityUsageGroup(data,row,collection){
 return abilityGroup(data,row,collection);
}
