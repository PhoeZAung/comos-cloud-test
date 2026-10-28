import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeClassReview} from '../scripts/review-class.mjs';
import {stagedManifest} from '../scripts/stage-class.mjs';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));

test('review report tracks same ability through successive upgrades and cites sources',async()=>{
 const def=await read('rules/classes/archer.class.json');
 const options=await read('rules/classes/archer-talents.json');
 const review=makeClassReview(def,{optionCatalog:options});
 assert.match(review,/ABILITY UPGRADE CHAINS/);
 assert.match(review,/Aim — gained at class level 1/);
 assert.match(review,/LEVEL 5 → IMPROVE SAME ABILITY/);
 assert.match(review,/Values set at this level: bonus: 2/);
 assert.match(review,/LEVEL 20 → IMPROVE SAME ABILITY/);
 assert.match(review,/finalfantasyd20.com/);
 assert.match(review,/Leave review.state as needs_review/);
});

test('staging a new class validates but never marks it live',async()=>{
 const def=await read('rules/classes/bard.class.json');
 const options=await read('rules/classes/bard-talents.json');
 const manifest=await read('rules/classes/manifest.json');
 const withoutBard={...manifest,classes:manifest.classes.filter(x=>x.id!==def.id)};
 const updated=stagedManifest(withoutBard,def,'bard',{optionCatalog:options});
 const bard=updated.classes.find(x=>x.id===def.id);
 assert.equal(bard.status,'staged');
 assert.equal(bard.adapter,null);
 assert.equal(bard.optionFile,'rules/classes/bard-talents.json');
 assert.throws(()=>stagedManifest(manifest,def,'bard',{optionCatalog:options}),/already exists/);
 assert.throws(()=>stagedManifest(withoutBard,def,'archer',{optionCatalog:options}),/does not match/);
});

test('unextracted scaffolds cannot be staged',async()=>{
 const def=await read('rules/classes/archer.class.json');
 const manifest=await read('rules/classes/manifest.json');
 const withoutArcher={...manifest,classes:manifest.classes.filter(x=>x.id!==def.id)};
 const unfinished=structuredClone(def);
 unfinished.review.coverage='scaffold';
 assert.throws(()=>stagedManifest(withoutArcher,unfinished,'archer'),/unfinished scaffold/);
});
