import {selectKingmakerEntries} from '../scripts/import-kingmaker.mjs';
import {KINGMAKER_STAGED_ENTRIES,kingmakerNpcData,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_BESTIARY_REVIEWED_091_100 as batchA} from '../src/data/kingmaker/bestiary-reviewed-091-100.mjs';
import {KINGMAKER_BESTIARY_REVIEWED_101_105 as batchB} from '../src/data/kingmaker/bestiary-reviewed-101-105.mjs';
const expected=['thresholder-hermeticist','thresholder-mystic','brush-thylacine','storm-struck-treant','troll-guard','troll-king','vilderavn-herald','overgrown-viper-vine','wemmuth','whimwyrm','ancient-will-o-wisp','barbtongued-wyvern','bloom-wyvern','cyclops-zombie','zombie-hulk'];
const entries={...batchA,...batchB};
const weapons=slug=>entries[slug].weapons||[];
test('exactly the final 15 Bestiary entries, no duplicates or chapter bleed',()=>{
 assert.equal(Object.keys(batchA).length,10);
 assert.equal(Object.keys(batchB).length,5);
 assert.deepEqual(Object.keys(entries),expected);
 for(const [slug,e] of Object.entries(entries)){
  assert.match(e.text.importNotes,/Source-reviewed printed/);
  for(const [key,val] of Object.entries(e.text)){
   assert.ok(val===null||typeof val==='string',slug+' bad '+key);
   if(/skillDetail|attackDetail|feats|gear|languages|qualities/.test(key))assert.doesNotMatch(val||'',/\bCHAPTER\b|\bNPC CODEX\b|\bCOMPANIONS\b|\bINDEX\b/,slug+' sidebar text');
  }
 }
});
test('multi-attack counts and conditional alternate routines match printed source',()=>{
 assert.equal(weapons('storm-struck-treant').filter(w=>w.name.startsWith('Slam')).length,2);
 assert.equal(weapons('troll-guard').length,9);
 assert.equal(weapons('troll-king').length,3);
 assert.equal(weapons('vilderavn-herald').length,7);
 assert.equal(weapons('overgrown-viper-vine').length,5);
 assert.equal(weapons('wemmuth').length,3);
 assert.equal(weapons('whimwyrm').length,5);
 assert.equal(weapons('barbtongued-wyvern').length,5);
 assert.equal(weapons('bloom-wyvern').length,4);
 for(const [slug, e] of Object.entries(entries)){
  for(const w of e.weapons||[]){
   assert.ok(['melee','ranged'].includes(w.attack_type),slug);
   assert.ok(Number.isFinite(w.npcAttackBonus),slug);
   assert.match(w.damage,/^\d+d\d+(?:[+-]\d+)?$/,slug);
  }
 }
});
test('dangerous abilities, spell levels, and absent undead scores correctly represented',()=>{
 assert.match(entries['thresholder-hermeticist'].text.spellsPrepared,/6th—heal/);
 assert.equal(entries['thresholder-hermeticist'].text.spellLikeAbilities,null);
 assert.match(entries['thresholder-mystic'].text.spellLikeAbilities,/touch of darkness/);
 assert.match(entries['brush-thylacine'].text.specialAbilities,/Intimidate/);
 assert.match(entries['storm-struck-treant'].text.specialAbilities,/4d6/);
 assert.equal(entries['troll-guard'].stats.regeneration,5);
 assert.equal(entries['troll-king'].stats.regeneration,10);
 assert.match(entries['troll-king'].text.specialAbilities,/DC 16/);
 assert.match(entries['overgrown-viper-vine'].text.specialAbilities,/DC 25/);
 assert.match(entries['wemmuth'].text.specialAbilities,/DC 24/);
 assert.match(entries['whimwyrm'].activeAbilities.find(a=>a.name==='Mind-Numbing Breath').desc,/20d6.*DC 27/);
 assert.equal(entries['cyclops-zombie'].stats.con,null);
 assert.equal(entries['cyclops-zombie'].stats.int,null);
 assert.equal(entries['zombie-hulk'].stats.con,null);
 assert.equal(entries['zombie-hulk'].stats.int,null);
});
test('all 105 Bestiary creatures stay reviewed while NPC Codex advances in separate batches',()=>{
 const bestiary=KINGMAKER_STAGED_ENTRIES.filter(e=>e.chapter==='bestiary');
 assert.equal(bestiary.length,105);
 assert.equal(bestiary.filter(e=>e.verified==='transcribed-from-PDF').length,105);
 assert.equal(bestiary.filter(e=>(e.reviewFlags||[]).length>0).length,0);
 assert.deepEqual(kingmakerProgress().map(x=>x.reviewed),[105,10,0,0]);
 assert.deepEqual(kingmakerProgress().map(x=>x.staged),[105,105,0,7]);
 assert.deepEqual(kingmakerProgress().map(x=>x.imported),[0,0,0,0]);
 assert.equal(KINGMAKER_STAGED_ENTRIES.filter(e=>e.verified==='automated-needs-review').length,102);
 const pages=[57,58,59,59,60,61,61,62,62,63,64,64,65,65,65];
 const cr=[16,17,2,16,15,10,19,14,15,17,10,18,8,7,6];
 const hp=[216,174,22,230,220,126,312,199,225,261,90,261,94,77,54];
 const ac=[34,30,14,31,29,24,34,28,30,32,30,32,20,21,15];
 const last=bestiary.slice(90);
 for(let i=0;i<15;i++){
  const e=last[i],slug=expected[i];
  assert.deepEqual([e.slug,e.printedPage,e.pdfPage,e.stats.cr,e.hp,e.stats.ac],[slug,pages[i],pages[i]+1,cr[i],hp[i],ac[i]]);
  assert.equal(e.verified,'transcribed-from-PDF');
  assert.equal(kingmakerNpcData(e).npcVerified,true);
  assert.equal(e.needsRulesReference,true);
 }
});

test('chapter-scoped importer selects only reviewed Bestiary, without an unreviewed import bypass',()=>{
 assert.equal(selectKingmakerEntries(null).length,217);
 const bestiary=selectKingmakerEntries('bestiary');
 assert.equal(bestiary.length,105);
 assert.ok(bestiary.every(x=>x.verified==='transcribed-from-PDF'));
 assert.equal(selectKingmakerEntries('npc-codex').length,105);
 assert.equal(selectKingmakerEntries('npc-codex').filter(x=>x.verified==='transcribed-from-PDF').length,10);
 assert.equal(selectKingmakerEntries('npc-codex').filter(x=>x.verified==='automated-needs-review').length,95);
 assert.equal(selectKingmakerEntries('companions').length,7);
 assert.throws(()=>selectKingmakerEntries('hazards'),/Invalid Kingmaker chapter/);
});
