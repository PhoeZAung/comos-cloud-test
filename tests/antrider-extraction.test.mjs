import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateArchetypeDefinition,validateArchetypeManifest} from '../src/features/characters/rules/archetype-contract.mjs';
import {buildClassCatalog} from '../scripts/generate-class-catalog.mjs';
import {newBuild,compileBuild} from '../src/features/characters/rules/build.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const read=async file=>JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
const ID='ffd20:archetype:chocobo-knight:antrider';
const load=()=>read('rules/classes/archetypes/chocobo-knight-antrider.archetype.json');
test('Antrider resolves only verified first-level parent replacements and retains five deferred later targets',async()=>{
 const a=await load(),parent=await read('rules/classes/chocobo-knight.class.json');
 assert.deepEqual(validateArchetypeDefinition(a,parent),{id:ID,parentClassId:parent.id,name:'Antrider',replacements:2,features:5,upgrades:7});
 assert.equal(a.data.requiredRaceId,'ffd20:race:antica');
 assert.deepEqual(a.data.replacements.flatMap(r=>r.targetFeatureIds).sort(),[parent.id+':feature:challenge',parent.id+':feature:chocobo-mount']);
 assert.deepEqual(a.data.deferredReplacements.map(r=>r.parentFeatureName),['Expert Trainer','Master Feeder','Improved Chocobo Mount','Superior Chocobo Mount','Protect the Meek']);
 assert(a.data.deferredReplacements.every(r=>!parent.data.features.some(f=>f.name===r.parentFeatureName)));
 const inventory=await read('docs/imports/catalog.json');assert.equal(a.sources[0].archiveSha256,inventory.items.find(i=>i.id===ID).source.sha256);
});
test('Antrider mount table preserves all rows and mindless/poison caveats rather than inventing automatic statistics',async()=>{
 const a=await load(),m=a.data.mount;assert.equal(m.progression.length,20);
 assert.deepEqual(m.progression.map(r=>r.classLevel),Array.from({length:20},(_,i)=>i+1));
 for(const row of m.progression){assert.equal(row.bab,Math.floor(row.hitDice*3/4));assert.equal(row.fort,2+Math.floor(row.hitDice/2));assert.equal(row.ref,Math.floor(row.hitDice/3));assert.equal(row.will,row.ref);}
 assert.deepEqual([m.progression[0].hitDice,m.progression[19].hitDice],[2,16]);
 assert.equal(m.startingStatistics.scores.int,null);assert.match(m.mindless,/No Intelligence score/);
 assert.equal(m.poison.printedFortitudeDC,17);assert.equal(m.poison.firstLevelFormulaDC,16);assert.equal(m.poison.automation,'manual');
 assert(a.review.issues.some(i=>i.blocking&&/prints Fort DC 17/.test(i.reason)));
 assert.deepEqual(m.startingStatistics.speedsFeet,{land:50,burrow:20,climb:20});
});
test('Antrider upgrades replace persistent values and retain feat prerequisites and daily use progression',async()=>{
 const a=await load(),state=(slug,level)=>a.data.upgrades.filter(u=>u.featureId.endsWith(':'+slug)&&u.atClassLevel<=level).sort((x,y)=>x.atClassLevel-y.atClassLevel).reduce((s,u)=>({...s,...u.changes}),a.data.features.find(f=>f.id.endsWith(':'+slug)).initialState);
 assert.deepEqual(state('mindlink',4),{charmCompulsionSaveMorale:2,flankingAttackMorale:1});
 assert.deepEqual(state('mindlink',20),{charmCompulsionSaveMorale:6,flankingAttackMorale:5});
 assert.equal(state('maneuver-tactics',9).startAction,'swift');assert.equal(state('maneuver-tactics',17).featSlots,3);
 assert.equal(state('acidic-bite',15).extraDamageDice,2);assert.equal(state('acidic-bite',15).element,'earth');
 assert.deepEqual([1,5,10,15,20].map(l=>a.data.resources[0].maximumByClassLevel[l-1]),[1,2,3,4,5]);
 assert.equal(a.data.choicePools[0].options.length,0);assert.match(a.data.features.find(f=>f.name==='Maneuver Tactics').description,/must meet each chosen feat/);
});
test('Antrider remains staged and cannot be enabled by a manifest flag or selected through the current builder',async()=>{
 const manifest=await read('rules/classes/archetypes/manifest.json'),entry=manifest.archetypes.find(a=>a.id===ID);assert.equal(entry.status,'staged');assert.equal(entry.adapter,null);
 const wrong=structuredClone(manifest);Object.assign(wrong.archetypes.find(a=>a.id===ID),{status:'live',adapter:'antrider'});assert.throws(()=>validateArchetypeManifest(wrong),/specialized validated adapter/);
 const record=(await buildClassCatalog()).archetypeRecords.find(a=>a.id===ID);assert.equal(record.data,undefined);
 const b=newBuild();Object.assign(b,{name:'Not implemented',classId:'ffd20:class:chocobo-knight',raceId:'ffd20:race:antica',archetypeId:ID,hpRolls:[10],reviewed:true});
 assert.doesNotMatch(renderBuild(b,3,{mode:'create'}),/option value="ffd20:archetype:chocobo-knight:antrider"/);
 assert.throws(()=>compileBuild(b),/Other archetypes are not enabled/);
});
