import {classCatalog} from './class-catalog.mjs';
import {archer} from './archer-catalog.mjs';
import {registry} from './catalog.mjs';
let descriptions;
export function classAbilityDescription(feature){
 if(!/^ffd20:(class|archetype):/.test(feature.id||''))return feature.description||'';
 if(!descriptions){
  descriptions=new Map();
  const visit=value=>{
   if(!value||typeof value!=='object')return;
   if(value.id&&typeof value.description==='string')descriptions.set(value.id,value.progressionDescription||null);
   for(const child of Object.values(value))if(child&&typeof child==='object')visit(child);
  };
  visit(registry.class);visit(archer.data);
  for(const record of [...classCatalog.classes,...classCatalog.archetypeRecords])if(record.status==='live')visit(record.data||record);
 }
 // Without an archived full-text companion, keep existing runtime detail intact.
 // The audit records those entries for source-archive review rather than inventing text.
 const text=descriptions.get(feature.id)||feature.progressionDescription||feature.description||'';
 return text+(feature.sheetNotes?'\n\nSheet notes:\n'+feature.sheetNotes:'');
}
