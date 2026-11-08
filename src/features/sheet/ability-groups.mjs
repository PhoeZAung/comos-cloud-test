import {isLimitBreak} from './limit-breaks.mjs';
export const abilityCollections=['activeAbilities','passiveAbilities','racialAbilities','feats'];
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
