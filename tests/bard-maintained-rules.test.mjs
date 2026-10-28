import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
test('maintained-song source rules retain manual-only lifecycle and targeting requirements',async()=>{
 const def=await read('rules/classes/bard-maintained-songs.json');
 assert.equal(def.classId,'ffd20:class:bard');
 assert.equal(def.review.state,'needs_review');
 assert.equal(def.review.automation,'manual');
 assert.equal(def.sourceURL,'https://finalfantasyd20.com/classes/core-classes/bard/');
 const rules=new Map(def.rules.map(x=>[x.id,x]));
 assert.equal(rules.size,8);
 assert.equal(rules.get('single-song').baseActiveSongs,1);
 assert.equal(rules.get('single-song').modifiedByFeatureId,'ffd20:class:bard:feature:medley');
 for(const id of ['maintain-action','normal-song-interaction','range-grace','retarget','repeat-saves','repeat-resistance','song-start'])
  assert.ok(rules.get(id)?.description?.length>25,'missing '+id);
 assert.match(rules.get('repeat-saves').description,/until it fails/);
 assert.match(rules.get('repeat-resistance').description,/until successful/);
 assert.match(rules.get('range-grace').description,/next turn/);
});
