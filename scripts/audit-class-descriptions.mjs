import {readFile,writeFile} from 'node:fs/promises';
import {classCatalog} from '../src/features/characters/rules/class-catalog.mjs';
import {registry} from '../src/features/characters/rules/catalog.mjs';
import {classAbilityDescription} from '../src/features/characters/rules/ability-description.mjs';
const manifest=JSON.parse(await readFile('rules/classes/manifest.json','utf8'));
const archetypes=JSON.parse(await readFile('rules/classes/archetypes/manifest.json','utf8'));
const report={sourceArchiveAvailable:false,sourceArchiveNote:'The extractor GitHub repository contains tools only. Saved HTML/Markdown exports are not present. Stored text is checked verbatim against application definitions; original archive completeness is not certified.',definitions:[]};
async function inspect(entry){
 const definition=JSON.parse(await readFile(entry.file,'utf8')),records=new Map();
 function visit(value){if(!value||typeof value!=='object')return;if(value.id&&typeof value.description==='string')records.set(value.id,value);for(const child of Object.values(value))if(child&&typeof child==='object')visit(child);}
 visit(definition.data);
 for(const field of ['optionFile'])if(entry[field])visit(JSON.parse(await readFile(entry[field],'utf8')));
 if(definition.id==='ffd20:class:archer')visit(JSON.parse(await readFile('rules/classes/archer-talents.json','utf8')));
 const rows=[...records.values()].filter(row=>/^ffd20:(class|archetype):/.test(row.id)).map(row=>({id:row.id,name:row.name,field:row.progressionDescription?'progressionDescription':'description',characters:(row.progressionDescription||row.description).length,sourceLookupMatches:classAbilityDescription(row)===(row.progressionDescription||row.description)}));
 report.definitions.push({id:definition.id,name:definition.name,file:entry.file,records:rows});
}
for(const entry of [...manifest.classes,...archetypes.archetypes].filter(e=>e.status==='live'))await inspect(entry);
report.definitions.unshift({id:registry.class.id,name:registry.class.name,file:'src/features/characters/rules/catalog.mjs',records:registry.class.features.map(row=>({id:row.id,name:row.name,field:'description',characters:row.description.length,sourceLookupMatches:classAbilityDescription(row)===row.description}))});
const records=report.definitions.flatMap(d=>d.records);report.recordCount=records.length;report.fullCompanionCount=records.filter(r=>r.field==='progressionDescription').length;report.mismatches=records.filter(r=>!r.sourceLookupMatches).map(r=>r.id);
await writeFile('docs/extraction/class-description-audit.json',JSON.stringify(report,null,2)+'\n');
await writeFile('docs/extraction/class-description-audit.md','# Class ability description audit\n\nWhere a full stored text companion exists, the wizard copies it verbatim. Entries without one retain their current descriptions and runtime details pending archive review; some are still older summaries. Personal description edits are preserved when resaving a wizard.\n\n'+report.recordCount+' stored feature/option records checked across '+report.definitions.length+' enabled class/archetype definitions. '+report.fullCompanionCount+' records have a full progression-description field. '+report.mismatches.length+' source-field resolution mismatches.\n\n| Definition | Records | Full companion field |\n| --- | ---: | ---: |\n'+report.definitions.map(d=>'| '+d.name+' | '+d.records.length+' | '+d.records.filter(r=>r.field==='progressionDescription').length+' |').join('\n')+'\n\n## Source limitation\n\n'+report.sourceArchiveNote+' In particular, Archer and Bard contain short summary-style feature descriptions without a full companion field. No text was fabricated to replace those. Upload the extractor export ZIP from `workspace/exports/` to finish archive comparison and replace any remaining summaries with the saved source text.\n');
console.log(JSON.stringify({definitions:report.definitions.length,records:report.recordCount,fullFields:report.fullCompanionCount,mismatches:report.mismatches}));
if(report.mismatches.length)process.exitCode=1;
