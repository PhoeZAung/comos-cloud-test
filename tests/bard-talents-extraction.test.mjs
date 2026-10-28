import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateClassDefinition,classAtLevel,classTalentAtLevel,eligibleClassTalents} from '../src/features/characters/rules/class-contract.mjs';
import {buildClassCatalog} from '../scripts/generate-class-catalog.mjs';
import {classCatalog} from '../src/features/characters/rules/class-catalog.mjs';
const get=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
test('Bard 44 verified song talents are importable but not live',async()=>{
 const b=await get('rules/classes/bard.class.json'),o=await get('rules/classes/bard-talents.json');
 const report=validateClassDefinition(b,{optionCatalog:o});
 assert.deepEqual([report.levels,report.features,report.upgrades],[20,35,64]);
 assert.equal(o.options.length,44);assert.equal(o.options.filter(o=>o.tier==='normal').length,32);
 assert.equal(o.options.filter(o=>o.tier==='advanced').length,12);
 assert.equal(new Set(o.options.map(t=>t.id)).size,44);
 const imported=classCatalog.classes.find(x=>x.id===b.id);
 assert.equal(imported.status,'staged');assert.equal(imported.adapter,null);
 assert.equal(imported.optionCount,44);assert.equal(imported.options.length,44);
 assert.deepEqual(await buildClassCatalog(),classCatalog);
});
test('advanced Bard talents replace an even-level slot rather than being available at low levels',async()=>{
 const b=await get('rules/classes/bard.class.json'),o=await get('rules/classes/bard-talents.json');
 const early=eligibleClassTalents(b,o,10),later=eligibleClassTalents(b,o,12);
 assert.equal(early.some(x=>x.tier==='advanced'),false);
 assert.equal(later.filter(x=>x.tier==='advanced').length,12);
 assert.deepEqual(b.data.events.filter(x=>x.type==='choose'&&x.poolId===b.id+':pool:song-talents').map(x=>x.atClassLevel),[2,4,6,8,10,12,14,16,18,20]);
});
test('Bardic Inspiration improves ONE option at 5, 10 and 15 without stacking earlier die sizes',async()=>{
 const o=await get('rules/classes/bard-talents.json'),base=o.options.find(x=>x.name==='Bardic Inspiration');
 for(const [level,expected] of [[2,6],[4,6],[5,8],[9,8],[10,10],[14,10],[15,12],[20,12]]){
  const selected=classTalentAtLevel(base,level);
  assert.equal(selected.id,base.id);assert.equal(selected.state.inspirationDieSides,expected,'wrong Bardic Inspiration at level '+level);
 }
 assert.deepEqual(base.upgrades.map(x=>x.atClassLevel),[5,10,15]);
});
test('talent chain prerequisites and repeat limits hold for all imported classes',async()=>{
 const b=await get('rules/classes/bard.class.json'),o=await get('rules/classes/bard-talents.json');
 const find=n=>o.options.find(x=>x.name===n)?.id;
 assert(!eligibleClassTalents(b,o,6).some(x=>x.name==='Bodyguard II'));
 const withFirst=eligibleClassTalents(b,o,6,[find('Attract Minion'),find('Bodyguard I')]);
 assert(withFirst.some(x=>x.name==='Bodyguard II'));
 assert(!withFirst.some(x=>x.name==='Bodyguard III'));
 assert(eligibleClassTalents(b,o,20,Array(4).fill(find('Coordinate'))).some(x=>x.name==='Coordinate'));
 assert(!eligibleClassTalents(b,o,20,Array(5).fill(find('Coordinate'))).some(x=>x.name==='Coordinate'));
 assert(eligibleClassTalents(b,o,6,[]).some(x=>x.name==='Improved Musical Power'));
 assert(!eligibleClassTalents(b,o,4,[]).some(x=>x.name==='Improved Musical Power'));
});
test('talent upgrades require source-backed, scalar replacement values and known prerequisite IDs',async()=>{
 const b=await get('rules/classes/bard.class.json'),o=await get('rules/classes/bard-talents.json');
 const bad=structuredClone(o),inspiration=bad.options.find(x=>x.name==='Bardic Inspiration');
 inspiration.upgrades[0].changes={inspirationDieSides:{add:2}};
 assert.throws(()=>validateClassDefinition(b,{optionCatalog:bad}),/SET scalar/);
 const bad2=structuredClone(o);bad2.options[0].requiresTalentIds=['ffd20:class:bard:talent:not-real'];
 assert.throws(()=>validateClassDefinition(b,{optionCatalog:bad2}),/missing or self-referencing talent prerequisite/);
});
