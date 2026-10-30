import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateArchetypeDefinition,validateArchetypeManifest} from '../src/features/characters/rules/archetype-contract.mjs';
import {buildClassCatalog} from '../scripts/generate-class-catalog.mjs';
import {newBuild,compileBuild} from '../src/features/characters/rules/build.mjs';
const read=async file=>JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
const ID='ffd20:archetype:chocobo-knight:beast-rider';
const load=()=>read('rules/classes/archetypes/chocobo-knight-beast-rider.archetype.json');
test('Beast Rider resolves only the existing mount target and preserves nine unverified later parent targets',async()=>{
 const a=await load(),p=await read('rules/classes/chocobo-knight.class.json'),catalog=await read('docs/imports/catalog.json');
 assert.deepEqual(validateArchetypeDefinition(a,p),{id:ID,parentClassId:p.id,name:'Beast Rider',replacements:1,features:10,upgrades:6});
 assert.equal(a.sources[0].archiveSha256,catalog.items.find(i=>i.id===ID).source.sha256);
 assert.deepEqual(a.data.replacements[0].targetFeatureIds,[p.id+':feature:chocobo-mount']);
 assert.equal(a.data.deferredReplacements.length,9);
 assert(a.data.deferredReplacements.every(r=>!p.data.features.some(f=>f.name===r.parentFeatureName)));
});
test('Beast Rider mount eligibility is distinct from Beastmaster and upgrades set total values instead of accumulating',async()=>{
 const a=await load(),m=a.data.mount;
 assert.equal(m.rulesSystem,'external-druid-animal-companion');assert.equal(m.canonicalStatisticsStatus,'not-verified');assert.equal(m.automation,'none');
 assert.deepEqual(m.firstLevelChoicesByRiderSize,{Small:['pony','wolf'],Medium:['camel','horse']});
 assert.equal(m.minimumLegs,4);assert.equal(m.flySpeedAllowed,false);assert(m.mustCarryRiderWeight);assert(m.swimMountsRequireGMApproval);
 const state=(slug,level)=>a.data.upgrades.filter(u=>u.featureId===ID+':feature:'+slug&&u.atClassLevel<=level).sort((x,y)=>x.atClassLevel-y.atClassLevel).reduce((s,u)=>({...s,...u.changes}),a.data.features.find(f=>f.id===ID+':feature:'+slug).initialState);
 assert.equal(state('rugged-steed',20).naturalArmorIncrease,5);assert.equal(state('gigantic-steed',20).strengthSizeBonus,6);assert.equal(state('gigantic-steed',20).minimumDexterity,1);
});
test('Beast Rider source staging cannot activate through a manifest flag or forged character choice',async()=>{
 const m=await read('rules/classes/archetypes/manifest.json'),entry=m.archetypes.find(x=>x.id===ID);assert.equal(entry.status,'staged');assert.equal(entry.adapter,null);
 const bad=structuredClone(m);Object.assign(bad.archetypes.find(x=>x.id===ID),{status:'live',adapter:'beast-rider'});assert.throws(()=>validateArchetypeManifest(bad),/specialized validated adapter/);
 const projected=(await buildClassCatalog()).archetypeRecords.find(x=>x.id===ID);assert.equal(projected.data,undefined);
 const b=newBuild();Object.assign(b,{name:'Unavailable mount',classId:'ffd20:class:chocobo-knight',raceId:'ffd20:race:galka',archetypeId:ID,hpRolls:[10],reviewed:true});
 assert.throws(()=>compileBuild(b),/Other archetypes are not enabled/);
});
