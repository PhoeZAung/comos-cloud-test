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