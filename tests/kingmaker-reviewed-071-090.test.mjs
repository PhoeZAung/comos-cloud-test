// Place in the Cosmos repo tests directory when applying the local backup.
import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_STAGED_ENTRIES,kingmakerNpcData,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import {KINGMAKER_BESTIARY_REVIEWED_071_080 as a} from '../src/data/kingmaker/bestiary-reviewed-071-080.mjs';
import {KINGMAKER_BESTIARY_REVIEWED_081_090 as b} from '../src/data/kingmaker/bestiary-reviewed-081-090.mjs';
const names=['Bog Mummy Cultist','Monster Hunter','Tiger Lord','Defaced Naiad Queen','Fen Pudding','Verdurous Ooze','Winged Owlbear','Quelaunt','Radiant Warden','Talon Peak Roc','Scythe Tree','Tree That Weeps','Skeletal Hulk','Skeletal Tiger Lord','Chew Spiders','Giant Trapdoor Spider','Trapdoor Ogre Spider','Sportlebore Swarm','Spriggan Warlord','Thresholder Disciple'];
const slugs=['bog-mummy-cultist','monster-hunter','tiger-lord','defaced-naiad-queen','fen-pudding','verdurous-ooze','winged-owlbear','quelaunt','radiant-warden','talon-peak-roc','scythe-tree','tree-that-weeps','skeletal-hulk','skeletal-tiger-lord','chew-spiders','giant-trapdoor-spider','trapdoor-ogre-spider','sportlebore-swarm','spriggan-warlord','thresholder-disciple'];
const pages=[46,46,46,47,48,49,49,50,50,51,52,52,53,53,54,55,55,55,56,57];
const batch=KINGMAKER_STAGED_ENTRIES.slice(70,90);
const sheet=name=>kingmakerNpcData(batch.find(x=>x.name===name));
test('PDF batch 71-90 safely overlays exactly 20 contiguous Kingmaker creatures',()=>{
 assert.equal(Object.keys(a).length,10);
 assert.equal(Object.keys(b).length,10);
 for(let i=0;i<20;i++){
  const entry=batch[i];
  assert.deepEqual([entry.name,entry.slug,entry.printedPage,entry.pdfPage],[names[i],slugs[i],pages[i],pages[i]+1]);
  assert.equal(entry.verified,'transcribed-from-PDF');
  assert.deepEqual(entry.reviewFlags,[]);
  assert.equal(entry.needsRulesReference,true);
  assert.equal(sheet(names[i]).npcVerified,true);
 }
 assert.ok(kingmakerProgress()[0].reviewed>=90);
 assert.deepEqual(kingmakerProgress().map(x=>x.staged),[105,105,0,7]);
});
test('combat safety checks: automatic swarms, multiple natural attacks, and no fake ability scores',()=>{
 for(const name of ['Chew Spiders','Sportlebore Swarm']){
  const s=sheet(name);
  assert.equal(s.weapons.length,0);
  assert.equal(s.npcStats.cmb,null);
  assert.equal(s.npcStats.cmd,null);
 }
 assert.equal(sheet('Radiant Warden').weapons.filter(w=>w.name.startsWith('Slam')).length,4);
 assert.equal(sheet('Quelaunt').weapons.length,3);
 assert.equal(sheet('Tree That Weeps').weapons.length,3);
 assert.equal(sheet('Skeletal Hulk').weapons.length,4);
 assert.equal(sheet('Bog Mummy Cultist').npcStats.con,null);
 assert.equal(sheet('Verdurous Ooze').npcStats.int,null);
 assert.equal(sheet('Skeletal Tiger Lord').npcStats.fastHealing,6);
});
test('special DCs and role split survive normalization',()=>{
 const queen=sheet('Defaced Naiad Queen');
 assert.match(queen.npcText.spellsPrepared,/Druid CL 7th/);
 assert.match(queen.npcText.spellLikeAbilities,/dimension door/);
 assert.doesNotMatch(queen.npcText.spellLikeAbilities,/flame strike/);
 assert.match(sheet('Radiant Warden').activeAbilities.find(a=>a.name==='Radiant Blast').desc,/10d12/);
 assert.match(sheet('Sportlebore Swarm').activeAbilities.find(a=>a.name==='Sportlebore Infestation').desc,/DC 17/);
 assert.match(sheet('Thresholder Disciple').npcText.specialAbilities,/DC 21/);
 assert.match(sheet('Spriggan Warlord').npcText.qualities,/Enlarged form/);
});