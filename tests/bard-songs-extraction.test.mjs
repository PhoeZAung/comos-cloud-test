import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateBardSongCatalog,bardSongLearningSlots,eligibleBardSongChoices,bardSongCatalogCoverage}
 from '../src/features/characters/rules/song-contract.mjs';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));

test('Bard staged song index has all seven tiers (0–6)',async()=>{
 const c=await read('rules/classes/bard-songs.json');
 assert.deepEqual(validateBardSongCatalog(c).counts,{'0':11,'1':30,'2':36,'3':33,'4':23,'5':24,'6':19});
 assert.equal(validateBardSongCatalog(c).total,176);
 assert.equal(c.review.state,'needs_review');
 assert.equal(c.review.complete,true);
 assert.equal(c.songs.find(s=>s.name==='Lullaby').usageMode,'maintained');
 assert.equal(c.songs.find(s=>s.name==='Saving Finale').usageMode,'normal');
 assert.equal(c.songs.find(s=>s.name==='Army’s Paeon').kind,'song');
 assert.ok(c.songs.every(s=>s.automation==='manual'));
});
test('Bard level and CHA eligibility do not unlock premature songs or auto-select prior ones',async()=>{
 const c=await read('rules/classes/bard-songs.json'),bard=await read('rules/classes/bard.class.json');
 const at3=eligibleBardSongChoices(bard,c,{bardLevel:3,chaScore:18});
 assert.equal(at3.length,30);
 assert.ok(at3.every(s=>s.level===1));
 const at4=eligibleBardSongChoices(bard,c,{bardLevel:4,chaScore:12});
 assert.equal(at4.length,66);
 assert.ok(at4.some(s=>s.level===2));
 const lowCha=eligibleBardSongChoices(bard,c,{bardLevel:4,chaScore:11});
 assert.equal(lowCha.length,30);
  const selectedId=c.songs.find(s=>s.name==='Army’s Paeon').id;
 assert.ok(!eligibleBardSongChoices(bard,c,{bardLevel:1,chaScore:16,knownIds:[selectedId]}).some(s=>s.id===selectedId));
 assert.deepEqual(bardSongLearningSlots(1,16),{songs:6,jingles:2});
 assert.deepEqual(bardSongLearningSlots(5,16),{songs:2,jingles:1});
 assert.deepEqual(bardSongLearningSlots(6,16),{songs:2,jingles:0});
 assert.deepEqual(bardSongLearningSlots(17,16),{songs:2,jingles:1});
 assert.equal(eligibleBardSongChoices(bard,c,{bardLevel:1,chaScore:16,kind:'jingle'}).length,11);
});
test('All song tiers are indexed without implying mechanical approval',async()=>{
 const c=await read('rules/classes/bard-songs.json'),bard=await read('rules/classes/bard.class.json');
 assert.equal(bardSongCatalogCoverage(c,bard,4).completeForLevel,true);
 assert.equal(bardSongCatalogCoverage(c,bard,7).completeForLevel,true);
 assert.equal(bardSongCatalogCoverage(c,bard,20).completeForLevel,true);
 assert.notEqual(c.review.state,'approved');
 assert.equal(c.songs.find(s=>s.name==='Army’s Paeon II').level,3);
 assert.notEqual(c.songs.find(s=>s.name==='Army’s Paeon').id,c.songs.find(s=>s.name==='Army’s Paeon II').id);
 const incorrect=structuredClone(c);
 incorrect.review.state='approved';
 incorrect.review.complete=false;
 assert.throws(()=>validateBardSongCatalog(incorrect),/incomplete catalog cannot be approved/);
 incorrect.review.state='needs_review';
 incorrect.songs[0].usageMode='always_active';
 assert.throws(()=>validateBardSongCatalog(incorrect),/unsafe song fields/);
});
