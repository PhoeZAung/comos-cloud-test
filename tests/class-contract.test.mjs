import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateClassDefinition,validateClassManifest,classAtLevel} from '../src/features/characters/rules/class-contract.mjs';
import {generateClassCatalog,buildClassCatalog} from '../scripts/generate-class-catalog.mjs';
import {classCatalog} from '../src/features/characters/rules/class-catalog.mjs';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
test('class manifest and verified Archer are registered consistently',async()=>{
 const manifest=validateClassManifest(await read('rules/classes/manifest.json'));
 assert(manifest.classes.some(x=>x.id==='ffd20:class:archer'&&x.status==='live'));
 await generateClassCatalog({check:true});
 const c=await buildClassCatalog();
 assert.deepEqual(c,classCatalog);
});
test('upgrades SET stable existing features and never grant extra cards',async()=>{
 const c=await read('rules/classes/archer.class.json'),opts=await read('rules/classes/archer-talents.json');
 const report=validateClassDefinition(c,{optionCatalog:opts});
 assert.equal(report.levels,20);assert.equal(report.upgrades,31);
 const one=classAtLevel(c,1),five=classAtLevel(c,5),twenty=classAtLevel(c,20);
 const aim=level=>level.features.filter(f=>f.name==='Aim');
 assert.equal(aim(one).length,1);assert.equal(aim(five).length,1);assert.equal(aim(twenty).length,1);
 assert.equal(aim(five)[0].state.bonus,2);assert.equal(aim(twenty)[0].state.bonus,5);
});
test('invalid upgrade IDs, duplicate upgrades and extra grant events are rejected',async()=>{
 const c=await read('rules/classes/archer.class.json'),copy=x=>structuredClone(x);
 const bad=copy(c);bad.data.upgrades[0].featureId='ffd20:class:archer:feature:invented';
 assert.throws(()=>validateClassDefinition(bad),/unknown feature target/);
 const twice=copy(c);twice.data.upgrades.push({...twice.data.upgrades[0],id:twice.data.upgrades[0].id+'-copy'});
 assert.throws(()=>validateClassDefinition(twice),/duplicate upgrade at same level/);
 const grant=copy(c);grant.data.events.push({...grant.data.events.find(e=>e.type==='grant_feature'),id:'duplicate-grant'});
 assert.throws(()=>validateClassDefinition(grant),/exactly one initial grant/);
});
test('untouched extraction templates fail validation even if someone tries to register them',async()=>{
 const c=await read('rules/classes/archer.class.json'),bad=structuredClone(c);
 bad.review.coverage='scaffold';
 assert.throws(()=>validateClassDefinition(bad),/unfinished scaffold/);
 bad.review.coverage='partial';bad.data.levels[0].special='NOT EXTRACTED';
 assert.throws(()=>validateClassDefinition(bad),/placeholder not allowed/);
});
test('new classes cannot go live from a manifest flag without an adapter',async()=>{
 const m=await read('rules/classes/manifest.json'),clone=structuredClone(m);
 clone.classes[0].status='staged';clone.classes[0].adapter='archer';
 assert.throws(()=>validateClassManifest(clone),/staged classes cannot claim/);
 clone.classes[0].status='live';clone.classes[0].adapter=null;
 assert.throws(()=>validateClassManifest(clone),/requires a verified adapter/);
});
