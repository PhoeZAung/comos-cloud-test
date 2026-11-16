import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {EXTRA_ITEM_SOURCES,validateExtraCatalog} from '../backend/items/extra-sources.mjs';

const expected=Object.keys(EXTRA_ITEM_SOURCES);
const norm=name=>String(name).trim().toLocaleLowerCase('en').replace(/\s+/g,' ').replace(/[’']/g,"'");
const summary={},all=new Map(),errors=[];
const output=process.argv[2]||process.cwd();
for(const key of expected){
 const src=EXTRA_ITEM_SOURCES[key],file=join(output,'extra-'+key+'.json.gz');
 let json;
 try{json=JSON.parse(gunzipSync(await readFile(file)).toString('utf8'));}
 catch(error){
  summary[key]={label:src.label,status:'not-validated',reason:key==='pf2e-pf2ools'?
   'The pinned Pf2ools core bundles have no equipment/item types; skipped instead of making a fake shop.':
   String(error?.message||error)};
  if(key!=='pf2e-pf2ools')errors.push(key+': no valid archive');
  continue;
 }
 let rows;
 try{rows=validateExtraCatalog(json,key);}
 catch(error){errors.push(key+': '+error.message);continue;}
 const names=new Map();let price=0,desc=0,links=0,weight=0,mechanics=0,unresolved=0;
 for(const row of rows){
  const n=norm(row.name);names.set(n,(names.get(n)||0)+1);
  if(row.originalPriceText?.trim())price++;
  if(row.description?.trim())desc++;
  if(row.sourceUrl?.startsWith('https://github.com/'))links++;
  if(typeof row.weight==='number'&&Number.isFinite(row.weight))weight++;
  if(['dmg','crit','range','acBonus','healing'].some(field=>row[field]!==undefined))mechanics++;
  if(/^(?:item|spell|skill)\.[\w.-]+\.(?:name|text)$/.test(row.name)||/^(?:item|spell)\.[\w.-]+\.text$/.test(row.description))unresolved++;
 }
 const multiples=[...names.values()].reduce((s,n)=>s+(n-1),0);
 summary[key]={
  label:src.label,status:'converted',sourceFiles:json.sourceFiles,items:rows.length,
  priced:price,described:desc,linked:links,withWeight:weight,withMechanics:mechanics,
  duplicateNamesWithinCatalog:multiples,unresolvedI18n:unresolved,
  sample:rows.slice(0,4).map(row=>row.name)
 };
 if(unresolved){errors.push(key+': '+unresolved+' unresolved localization keys');}
 all.set(key,{system:src.system,names});
}
const overlaps=[];
for(const [one,{system,names}] of all){
 for(const [two,{system:system2,names:names2}] of all){
  if(one>=two||system!==system2)continue;
  let matchingDistinct=0;for(const name of names.keys())if(names2.has(name))matchingDistinct++;
  overlaps.push({first:one,second:two,sameNameCount:matchingDistinct});
 }
}
const lines=['# Cosmos real-upstream Pathfinder equipment audit','','Generated from pinned upstream source archive conversions in CI; these are **candidate source records**, not live QNAP item counts.','','| Source | Files read | Items | Described | Priced | PF1e weight | Mechanics | Duplicate names | Status |','| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |'];
for(const key of expected){
 const s=summary[key]||{status:'invalid'};
 lines.push('| '+(s.label||key)+' | '+(s.sourceFiles??'—')+' | '+(s.items??'—')+' | '+(s.described??'—')+' | '+(s.priced??'—')+' | '+(s.withWeight??'—')+' | '+(s.withMechanics??'—')+' | '+(s.duplicateNamesWithinCatalog??'—')+' | '+s.status+' |');
 if(s.reason)lines.push('  - '+key+': '+s.reason);
}
lines.push('','## Same-edition name overlaps (not automatically deleted)','');
for(const o of overlaps)lines.push('- '+o.first+' versus '+o.second+': '+o.sameNameCount+' matching distinct normalized names');
lines.push('','## Audit limitations','','- Duplicate-name counts are a discovery signal, not proof of identical edition, sourcebook or variants. No cross-source records were deleted.','- Confirm real prices, weight and damage/armor mechanics against individual upstream data before auto-applying anything.','- User-edited Cosmos items, production item counts and original AoN archives were not accessible to this public CI runner.','- No copyrighted source JSON is stored in CI artifacts; only aggregate metrics and sample names are uploaded.','','## Conversion problems','');
lines.push(...(errors.length?errors.map(x=>'- '+x):['- No missing archives or unresolved localization keys detected in the included sources.']));
const report=lines.join('\n')+'\n';
console.log(report);
await writeFile(join(output,'extra-item-audit.md'),report);
await writeFile(join(output,'extra-item-audit.json'),JSON.stringify({sources:summary,overlaps,errors},null,2)+'\n');
if(errors.length)process.exitCode=1;
