import {validateMartialProgression} from '../src/features/characters/rules/martial-contract.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateClassManifest,validateClassDefinition,classAtLevel} from '../src/features/characters/rules/class-contract.mjs';
import {validateArchetypeManifest,validateArchetypeDefinition} from '../src/features/characters/rules/archetype-contract.mjs';
import {validateBeastmasterCompanions} from './validate-beastmaster-companions.mjs';

const root=new URL('../',import.meta.url);
const target=new URL('src/features/characters/rules/class-catalog.mjs',root);
const fileURL=relative=>new URL(relative,root);
// Only the verified first-level companion subset reaches the runtime adapter.
function beastmasterData(c){
 const d=c.data,companion=d.companion;
 return Object.fromEntries([
  ...['hitDie','skillRanksPerLevel','classSkills','startingWealth','proficiencies','spellcasting','supportedLevels','levels','features','events'].map(k=>[k,d[k]]),
  ['companion',{linkDescription:companion.linkDescription,species:companion.species.filter(s=>companion.firstLevelOrdinaryCandidateIds.includes(s.id)).map(({id,name,startingStatistics,startingRules,sourceRefs})=>({id,name,startingStatistics,startingRules,sourceRefs}))}]
 ]);
}
export async function buildClassCatalog(){
 const manifest=validateClassManifest(JSON.parse(await readFile(fileURL('rules/classes/manifest.json'),'utf8')));
 const classes=[];
 for(const entry of manifest.classes){
  const c=JSON.parse(await readFile(fileURL(entry.file),'utf8'));
  const opts=entry.optionFile?JSON.parse(await readFile(fileURL(entry.optionFile),'utf8')):null;
  if(c.id!==entry.id)throw Error('Class manifest ID mismatch: '+entry.file);
  const report=validateClassDefinition(c,{optionCatalog:opts});
  if(c.id==='ffd20:class:beastmaster')validateBeastmasterCompanions(c);
  const levelOne=['ffd20:class:chocobo-knight','ffd20:class:dancer','ffd20:class:dragoon','ffd20:class:knight','ffd20:class:monk'].includes(entry.id)&&entry.adapter==='martial-level-one'&&JSON.stringify(c.data.supportedLevels)==='[1]';
  const martialProgression=['ffd20:class:chocobo-knight','ffd20:class:dancer','ffd20:class:gunbreaker'].includes(entry.id)&&entry.adapter==='martial-progression'&&JSON.stringify(c.data.supportedLevels)===JSON.stringify(Array.from({length:20},(_,i)=>i+1));
  const bardOne=entry.id==='ffd20:class:bard'&&entry.adapter==='bard-level-one'&&JSON.stringify(c.data.supportedLevels)==='[1]';
  const redOne=entry.id==='ffd20:class:red-mage'&&entry.adapter==='red-mage-level-one'&&JSON.stringify(c.data.supportedLevels)==='[1,2]';
  const beastOne=entry.id==='ffd20:class:beastmaster'&&entry.adapter==='beastmaster-level-one'&&JSON.stringify(c.data.supportedLevels)==='[1]';
  if(martialProgression)validateMartialProgression(c);
  if(entry.status==='live'&&!(entry.id==='ffd20:class:archer'&&entry.adapter==='archer')&&!levelOne&&!martialProgression&&!bardOne&&!beastOne&&!redOne)throw Error('Class has no verified runtime adapter: '+entry.id);
  if(entry.status==='live'&&c.review.state!=='needs_review'&&c.review.state!=='approved')throw Error('Review missing');
  classes.push({id:c.id,name:c.name,status:entry.status,adapter:entry.adapter,review:c.review.state,
   description:'See official source for class features, progression and limitations.',
   source:c.sources[0].url,summary:report,levels:c.data.levels,
   features:c.data.features,upgrades:c.data.upgrades,events:c.data.events,
   archetypes:c.data.archetypeIndex||[],optionCount:opts?.options.length||0,
   options:opts?.options||[],...(levelOne||martialProgression||bardOne||beastOne||redOne?{data:beastOne?beastmasterData(c):c.data,sources:c.sources,supportedLevels:c.data.supportedLevels}:{})});
 }
 const archetypeManifest=validateArchetypeManifest(JSON.parse(await readFile(fileURL('rules/classes/archetypes/manifest.json'),'utf8')));
 const archetypeRecords=[];
 for(const entry of archetypeManifest.archetypes){
  const parentEntry=manifest.classes.find(c=>entry.id.startsWith('ffd20:archetype:'+c.id.split(':').at(-1)+':'));
  if(!parentEntry)throw Error('Missing archetype parent class '+entry.id);
  const parent=JSON.parse(await readFile(fileURL(parentEntry.file),'utf8'));
  const archetype=JSON.parse(await readFile(fileURL(entry.file),'utf8'));
  if(archetype.id!==entry.id)throw Error('Archetype manifest ID mismatch');
  const summary=validateArchetypeDefinition(archetype,parent);
  if(entry.adapter==='martial-progression')validateMartialProgression(archetype,{archetype:true});
  archetypeRecords.push({...summary,status:entry.status,adapter:entry.adapter,source:archetype.sources[0].url,review:archetype.review.state,
   ...(entry.status==='live'?{data:archetype.data,sources:archetype.sources}:{})});
 }
 return {schemaVersion:'comos.class-catalog.v1',classes,archetypeRecords};
}
export async function generateClassCatalog({check=false}={}){
 const catalog=await buildClassCatalog();
 const text='// Generated from validated rules/classes/manifest.json. Do not edit by hand.\nexport const classCatalog='+JSON.stringify(catalog)+';\n';
 if(check){if(await readFile(target,'utf8')!==text)throw Error('Class catalog projection is stale');}
 else await writeFile(target,text);
 return catalog;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const catalog=await generateClassCatalog({check:process.argv.includes('--check')});
 console.log('Validated '+catalog.classes.length+' class records ('+catalog.classes.filter(c=>c.status==='live').length+' with live adapters).');
}
