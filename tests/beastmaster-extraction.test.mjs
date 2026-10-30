import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateClassDefinition,classAtLevel} from '../src/features/characters/rules/class-contract.mjs';
import {buildClassCatalog} from '../scripts/generate-class-catalog.mjs';
import {availableClasses} from '../src/features/characters/rules/class-adapters.mjs';
import {newBuild,compileBuild} from '../src/features/characters/rules/build.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const ID='ffd20:class:beastmaster';
const read=async file=>JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
const load=()=>read('rules/classes/beastmaster.class.json');

test('Beastmaster preserves the official full-BAB d10 companion progression rather than substituting druid statistics',async()=>{
 const c=await load(),catalog=await read('docs/imports/catalog.json');
 validateClassDefinition(c);
 assert.equal(c.sources[0].archiveSha256,catalog.items.find(i=>i.id===ID).source.sha256);
 assert.equal(c.data.companion.hitDie,10);assert.equal(c.data.companion.baseAttackProgression,'full');
 assert.equal(c.data.levels.length,20);assert.equal(c.data.companion.progression.length,20);
 for(const row of c.data.companion.progression){
  assert.equal(row.bab,row.hitDice);assert.equal(row.fort,2+Math.floor(row.hitDice/2));
  assert.equal(row.ref,row.fort);assert.equal(row.will,Math.floor(row.hitDice/3));
 }
 assert.deepEqual(c.data.companion.progression.map(r=>r.classLevel),Array.from({length:20},(_,i)=>i+1));
 assert.deepEqual([c.data.companion.progression[0].hitDice,c.data.companion.progression.at(-1).hitDice],[2,16]);
 assert.match(c.data.companion.rulesText,/bonus.*tricks/i);
 assert.match(c.data.companion.rulesText,/Intelligence of 3 or higher/);
 assert.match(c.data.companion.rulesText,/Shared Senses/);
});

test('Beastmaster retains temporary focus rules, source features and unresolved later contradictions without granting focus effects',async()=>{
 const c=await load(),one=classAtLevel(c,1);
 assert.equal(one.features.length,7);
 assert.deepEqual(one.features.filter(f=>f.featureKind==='limit_break').map(f=>f.name),['Bestial Defense','Bestial Fury']);
 assert.equal(c.data.animalAspects.length,12);
 assert(c.data.features.filter(f=>f.name!=='Nature Sense').every(f=>f.automation==='manual'&&!f.effects?.length));
 assert.equal(c.data.features.find(f=>f.name==='Nature Sense').automation,'automatic');
 assert(c.data.animalAspects.every(f=>f.automation==='manual'&&!f.effects?.length));
 const focus=one.features.find(f=>f.name==='Animal Focus');
 assert.match(focus.description,/1-minute increments/);assert.match(focus.description,/companion is dead/);
 const conflict=c.data.sourceConflicts.find(x=>x.name==='Natural Savagery');
 assert.deepEqual(conflict.proseIncrementLevels,[5,9,13,17]);
 assert.deepEqual(conflict.tableIncrementLevels,[5,8,11,14,17,20]);
 assert.equal(conflict.automation,'none');assert.equal(c.data.upgrades.length,0);
 assert(c.data.deferredFeatureSections.some(f=>f.name==='Natural Savagery'));
 assert(c.review.issues.some(i=>i.blocking&&/disagree with prose/.test(i.reason)));
});

test('Beastmaster runtime declares only first-level support and does not expose later or gated companion species',async()=>{
 const record=(await buildClassCatalog()).classes.find(c=>c.id===ID);
 assert.equal(record.status,'live');assert.equal(record.adapter,'beastmaster-level-one');assert.deepEqual(record.supportedLevels,[1]);
 assert(availableClasses.some(c=>c.id===ID));assert.equal(record.data.companion.species.length,11);
 assert(record.data.companion.species.every(s=>!s.advancements));
 const b=newBuild();Object.assign(b,{classId:ID,name:'Unimplemented Beastmaster',hpRolls:[10],reviewed:true});
 assert.match(renderBuild(b,3,{mode:'create'}),/<option[^>]*value="ffd20:class:beastmaster"[^>]*>Beastmaster/);
 assert.throws(()=>compileBuild({...b,level:2}),/level-1 testing/);
});
