import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_COMPANIONS_REVIEWED_001_007 as reviewed} from '../src/data/kingmaker/companions-reviewed-001-007.mjs';
const expected=[['amiri',[1,11],[15,126]],['ekundayo',[1,6],[12,52]],['jubilost-narthropple',[1,8],[10,59]],['linzi',[1,7],[10,52]],['nok-nok',[1,5],[11,43]],['tristian',[1,10],[9,72]],['valerie',[1,9],[13,103]]];
test('all seven companions have two PDF-verified levels and correct hp',()=>{
 assert.deepEqual(Object.keys(reviewed),expected.map(([s])=>s));
 for(const [slug,levels,hps] of expected){
  const e=reviewed[slug];
  assert.deepEqual(e.variants.map(v=>v.level),levels,slug);
  assert.deepEqual(e.variants.map(v=>v.hp),hps,slug);
  assert.equal(e.weapons.length,e.variants[0].weapons.length,slug);
  for(const v of e.variants){
   assert.equal(v.reviewFlags.length,0);assert.equal(v.verified,'transcribed-from-PDF');
   assert.equal(v.weapons.every(w=>Number.isFinite(w.npcAttackBonus)&&/^(\d+)d(\d+)(?:[+-]\d+)?$/.test(w.damage)),true,slug);
   assert.ok(v.text.hpDetail && v.text.attackDetail,slug);
  }
 }
});
test('important independent rules remain uncollapsed',()=>{
 assert.equal(reviewed['amiri'].variants[1].weapons.length,3);
 assert.equal(reviewed['ekundayo'].variants[1].weapons.length,4);
 assert.match(reviewed['ekundayo'].variants[1].text.specialAbilities,/HP 22/);
 assert.equal(reviewed['jubilost-narthropple'].variants[1].weapons.filter(w=>w.name.startsWith('Bomb')).length,2);
 assert.match(reviewed['linzi'].variants[1].text.spellsKnown,/3rd \(2\/day\)/);
 assert.equal(reviewed['nok-nok'].variants[0].weapons.length,4);
 assert.match(reviewed['tristian'].variants[1].text.spellsPrepared,/5th.*4th.*3rd.*2nd.*1st.*0/);
 assert.match(reviewed['valerie'].variants[1].text.maneuverDetail,/sunder/);
});