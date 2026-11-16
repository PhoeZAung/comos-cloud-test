import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_STAGED_ENTRIES,kingmakerNpcData,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import {KINGMAKER_BESTIARY_AUTO_002} from '../src/data/kingmaker/bestiary-auto-batch-002.mjs';
import {KINGMAKER_BESTIARY_REVIEWED_021_030} from '../src/data/kingmaker/bestiary-reviewed-021-030.mjs';

const expected=[
 // name, printed page, CR, XP, HP, AC, Strength
 ['Thorn River Bandit',19,1/3,135,10,13,13],
 ['Murder Of Crows',19,9,6400,71,16,3],
 ['Antipaladin',19,5,1600,55,20,18],
 ['Bloom Cultist',20,5,1600,52,15,12],
 ['Cleansed Cultist',21,6,2400,56,19,14],
 ['False Priestess',21,7,3200,62,18,12],
 ['Sister Of The Bloodshot Eye',22,12,19200,140,18,8],
 ['Leng Envoy',22,18,153600,256,25,18],
 ['Doprillu',23,14,38400,200,29,24],
 ['Enormous Dragonfly',24,9,6400,115,21,32]
];
const batch=KINGMAKER_STAGED_ENTRIES.slice(20,30);
const byName=name=>batch.find(e=>e.name===name);
const sheet=name=>kingmakerNpcData(byName(name));

test('Bestiary entries 21–30 have source-checked identity and core stats',()=>{
 assert.equal(Object.keys(KINGMAKER_BESTIARY_REVIEWED_021_030).length,10);
 assert.equal(batch.length,10);
 for(let i=0;i<expected.length;i++){
  const [name,page,cr,xp,hp,ac,str]=expected[i],e=batch[i];
  assert.deepEqual([e.name,e.printedPage,e.stats.cr,e.stats.xp,e.hp,e.stats.ac,e.stats.str],
   [name,page,cr,xp,hp,ac,str]);
  assert.equal(e.pdfPage,page+1);
  assert.equal(e.verified,'transcribed-from-PDF');
  assert.deepEqual(e.reviewFlags,[]);
  assert.equal(e.needsRulesReference,true);
  assert.equal(e.chapter,'bestiary');
  assert.equal(sheet(name).npcVerified,true);
 }
 assert.deepEqual(kingmakerProgress({}).map(p=>p.staged),[105,105,0,7]);
 assert.deepEqual(kingmakerProgress({}).map(p=>p.reviewed),[40,0,0,0]);
 assert.equal(KINGMAKER_STAGED_ENTRIES.length,217);
 assert.equal(new Set(KINGMAKER_STAGED_ENTRIES.map(e=>e.chapter+':'+e.slug)).size,217);
});

test('swarm damage and unavailable CMB/CMD are not disguised as ordinary attack rolls',()=>{
 const crow=sheet('Murder Of Crows');
 assert.equal(crow.npcStats.cmb,null);
 assert.equal(crow.npcStats.cmd,null);
 assert.equal(crow.weapons.length,0);
 assert.equal(crow.npcSkills.find(s=>s.name==='Perception').bonus,14);
 assert.equal(crow.npcSkills.find(s=>s.name==='Fly').bonus,15);
 assert.match(crow.npcText.attackDetail,/no conventional melee attack roll/);
 assert.match(crow.npcText.specialAttacks,/DC 16/);
});

test('mixed caster levels, spells and save-dependent special abilities are distinct',()=>{
 const antipaladin=sheet('Antipaladin');
 assert.equal(antipaladin.npcStats.casterLevel,3);
 assert.match(antipaladin.npcText.spellLikeAbilities,/CL 6th/);
 assert.match(antipaladin.npcText.spellsPrepared,/CL 3rd/);
 assert.match(antipaladin.npcText.movementDetail,/20 ft. in armor/);

 const bloom=sheet('Bloom Cultist');
 assert.equal(bloom.npcStats.casterLevel,5);
 assert.match(bloom.npcText.spellsKnown,/Sorcerer CL 1st/);
 assert.match(bloom.npcText.spellsPrepared,/Cleric CL 5th/);
 assert.ok(bloom.activeAbilities.some(a=>a.name==='Vision of Madness'));

 const clean=sheet('Cleansed Cultist');
 assert.equal(clean.weapons.length,2);
 assert.match(clean.activeAbilities[0].desc,/Success 2d6; failure 6d6/);
 assert.match(clean.activeAbilities[0].desc,/DC 14/);
 assert.match(clean.activeAbilities[0].desc,/cooldown 1d4/);

 const priestess=sheet('False Priestess');
 assert.equal(priestess.npcStats.reach,5);
 assert.match(priestess.npcText.movementDetail,/glaive reaches 10 ft/);
 assert.match(priestess.npcText.spellsKnown,/4th/);
 assert.match(priestess.npcText.qualities,/but not bloodline arcana/);

 const sister=sheet('Sister Of The Bloodshot Eye');
 assert.equal(sister.npcSkills.find(s=>s.name==='Knowledge (religion)').bonus,9);
 assert.equal(sister.npcSkills.find(s=>s.name==='Knowledge (history)').bonus,9);
 assert.match(sister.npcText.spellsPrepared,/7th/);
 assert.match(sister.npcText.spellsPrepared,/0—/);
 assert.equal(sister.weapons.length,2);
});

test('multiple attack routines, regeneration and dragonfly unknown score remain safe',()=>{
 const envoy=sheet('Leng Envoy');
 assert.equal(envoy.npcStats.sr,29);
 assert.equal(envoy.npcStats.fastHealing,5);
 assert.equal(envoy.weapons.length,10);
 assert.deepEqual(envoy.weapons.filter(w=>w.name.startsWith('+4 speed kukri')).map(w=>w.npcAttackBonus),[29,29,24,19,14]);
 assert.equal(envoy.weapons.filter(w=>w.name.includes('natural alternative')&&w.name.includes('Claw')).length,2);
 assert.match(envoy.npcText.energyResistances,/Cold 30, electricity 30/);
 assert.ok(envoy.activeAbilities.some(a=>a.name.includes('Dexterity Drain')));

 const dop=sheet('Doprillu');
 assert.equal(dop.npcStats.regeneration,10);
 assert.match(dop.npcText.hpDetail,/regeneration 10 \(cold\)/);
 assert.match(dop.npcText.immunities,/Fire/);
 assert.equal(dop.weapons.filter(w=>w.name.startsWith('Fist')).length,4);
 assert.ok(dop.activeAbilities.some(a=>a.name==='Whirlwind Throw'));
 assert.match(dop.npcText.specialAbilities,/4d6 fire/);

 const fly=sheet('Enormous Dragonfly');
 assert.equal(fly.npcStats.int,null);
 assert.equal(fly.npcSkills.find(s=>s.name==='Fly').bonus,9);
 assert.equal(fly.npcStats.flySpeed,80);
 assert.match(fly.npcText.movementDetail,/perfect/);
 assert.match(fly.npcText.maneuverDetail,/\+24 grapple/);
});

test('raw auto-extraction retained unchanged for verification and unknown records stay unverified',()=>{
 for(const e of batch){
  const source=KINGMAKER_BESTIARY_AUTO_002.find(record=>record.slug===e.slug);
  assert.ok(source,'original PDF extracted record remains stored');
  assert.equal(source.verified,'automated-needs-review');
  assert.equal(source.stats.str,undefined,'raw auto-parser source still lacks Strength');
  assert.equal(e.verified,'transcribed-from-PDF');
 }
 assert.match(KINGMAKER_BESTIARY_AUTO_002.find(e=>e.name==='Murder Of Crows').text.skillDetail,/CULTIST/);
 assert.doesNotMatch(byName('Murder Of Crows').text.skillDetail,/CULTIST/);
 const later=KINGMAKER_STAGED_ENTRIES[30];
 assert.equal(later.verified,'automated-needs-review');
 assert.equal(kingmakerProgress().find(x=>x.id==='bestiary').reviewed,30);
});
