import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_STAGED_ENTRIES,kingmakerNpcData,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import {KINGMAKER_BESTIARY_AUTO_002} from '../src/data/kingmaker/bestiary-auto-batch-002.mjs';
import {KINGMAKER_BESTIARY_REVIEWED_051_060} from '../src/data/kingmaker/bestiary-reviewed-051-060.mjs';
import {KINGMAKER_BESTIARY_REVIEWED_061_070} from '../src/data/kingmaker/bestiary-reviewed-061-070.mjs';

const expected=[
 // Name, printed page, CR, hit points, AC
 ['Gogiteth',34,12,153,28],['Kellid Graveknight',35,14,180,27],
 ['Grimstalker',36,5,44,18],['Bounty Hunter',37,4,47,16],
 ['Drelev Guard',37,8,90,22],['Pitax Warden',37,12,118,22],
 ['Guthallath',38,19,249,34],['Hobgoblin Archer',38,4,47,20],
 ['Mastiff Of Tindalos',39,15,195,25],['Hooktongue Hydra',39,13,186,28],
 ['Irlgaunt',40,13,161,29],['Jabberwock, Lesser',41,21,379,37],
 ['Kobold Scout',41,1,14,17],['Krooth',41,8,102,21],
 ['Lerritan',42,21,387,37],['Lizardfolk Scout',43,1,17,17],
 ['Lizardfolk Warrior',43,2,30,17],['Immense Mandragora',44,20,363,35],
 ['Mandragora Swarm',44,18,299,31],['Mudwretch',45,2,15,13]
];
const batch=KINGMAKER_STAGED_ENTRIES.slice(50,70);
const get=name=>batch.find(e=>e.name===name);
const sheet=name=>kingmakerNpcData(get(name));

test('20 source-checked creatures 51–70 retain printed pages, CR, HP and AC',()=>{
 assert.equal(Object.keys(KINGMAKER_BESTIARY_REVIEWED_051_060).length,10);
 assert.equal(Object.keys(KINGMAKER_BESTIARY_REVIEWED_061_070).length,10);
 assert.equal(batch.length,20);
 for(let i=0;i<expected.length;i++){
  const [name,page,cr,hp,ac]=expected[i],e=batch[i];
  assert.deepEqual([e.name,e.printedPage,e.stats.cr,e.hp,e.stats.ac],[name,page,cr,hp,ac]);
  assert.equal(e.pdfPage,page+1);
  assert.equal(e.verified,'transcribed-from-PDF');
  assert.deepEqual(e.reviewFlags,[]);
  assert.equal(e.needsRulesReference,true);
  assert.equal(sheet(name).npcVerified,true);
  assert.ok(e.text.importNotes.includes('PDF-reviewed'),name);
 }
 assert.equal(KINGMAKER_STAGED_ENTRIES.length,217);
 assert.deepEqual(kingmakerProgress().map(x=>x.staged),[105,105,0,7]);
 assert.deepEqual(kingmakerProgress().map(x=>x.reviewed),[105,105,0,7]);
 assert.deepEqual(kingmakerProgress().map(x=>x.imported),[0,0,0,0]);
});

test('large multiattack monsters expose every natural weapon separately',()=>{
 for(const [name,prefix,count] of [
  ['Gogiteth','Claw',2],['Grimstalker','Claw',2],
  ['Guthallath','Fist',2],['Mastiff Of Tindalos','Claw',4],
  ['Irlgaunt','Slam',2],['Jabberwock, Lesser','Wing',2],
  ['Krooth','Claw',2],['Lizardfolk Scout','Claw',2],
  ['Lizardfolk Warrior','Claw',2],['Immense Mandragora','Vine whip',2]
 ]){
  assert.equal(sheet(name).weapons.filter(w=>w.name.startsWith(prefix)).length,count,name);
 }
 const hydra=sheet('Hooktongue Hydra');
 assert.equal(hydra.weapons.length,12);
 assert.equal(hydra.npcStats.fastHealing,12);
 assert.match(hydra.npcText.maneuverDetail,/cannot be tripped/);
 assert.equal(sheet('Mastiff Of Tindalos').npcSkills.length,11);
 assert.match(sheet('Irlgaunt').activeAbilities.find(a=>a.name==='Gastrolith').desc,/1d4 rounds/);
});

test('special damage stays an ability and no dummy attack rolls are generated',()=>{
 const construct=sheet('Guthallath');
 assert.equal(construct.npcStats.con,null);
 assert.equal(construct.weapons.length,3);
 assert.match(construct.activeAbilities.find(a=>a.name==='Annihilation Beams').desc,/30d6/);
 assert.match(construct.npcText.specialAbilities,/DC 23/);
 const grave=sheet('Kellid Graveknight');
 assert.equal(grave.npcStats.con,null);
 assert.equal(grave.npcStats.sr,25);
 assert.equal(grave.npcStats.cmd,33);
 assert.equal(grave.weapons.length,4);
 const jab=sheet('Jabberwock, Lesser');
 assert.equal(jab.npcStats.sr,31);
 assert.equal(jab.npcStats.fastHealing,15);
 assert.equal(jab.weapons.filter(w=>w.name.startsWith('Eye ray')).length,2);
 assert.match(jab.npcText.energyResistances,/Sonic 30/i);
 const swarm=sheet('Mandragora Swarm');
 assert.equal(swarm.weapons.length,0);
 assert.equal(swarm.npcStats.cmb,null);
 assert.equal(swarm.npcStats.cmd,null);
 assert.equal(swarm.npcStats.fastHealing,10);
 assert.match(swarm.npcText.attackDetail,/NO conventional melee attack roll/);
 assert.ok(swarm.activeAbilities.some(a=>a.name==='Blood Drain'));
});

test('spells, equipment and conditionals are split into Cosmos editable fields',()=>{
 const ranger=sheet('Bounty Hunter');
 assert.match(ranger.npcText.combatGear,/cure light wounds/);
 assert.match(ranger.npcText.gear,/masterwork falchion/);
 assert.match(ranger.npcText.spellsPrepared,/resist energy/);
 const guard=sheet('Drelev Guard');
 assert.match(guard.npcText.feats,/Weapon Specialization \(longsword\)/);
 assert.doesNotMatch(guard.npcText.gear,/PITAX WARDEN/);
 const warden=sheet('Pitax Warden');
 assert.match(warden.npcText.spellsKnown,/hold person/);
 assert.match(warden.npcText.spellsKnown,/expeditious retreat/);
 assert.equal(warden.activeAbilities.find(a=>a.name==='Bardic Performance').ability_kind,'su');
 const krooth=sheet('Krooth');
 assert.equal(krooth.activeAbilities.find(a=>a.name==='Poison Tooth').ability_kind,'ex');
 assert.match(krooth.npcText.specialAbilities,/DC 20/);
 const lerritan=sheet('Lerritan');
 assert.equal(lerritan.npcSkills.find(s=>s.name==='Knowledge (nature)').bonus,30);
 assert.match(lerritan.npcText.specialAbilities,/12d12/);
 const scout=sheet('Lizardfolk Scout');
 assert.equal(scout.npcSkills.find(s=>s.name==='Perception').bonus,7);
 assert.doesNotMatch(scout.npcText.gear,/LIZARDFOLK WARRIOR/);
 const mud=sheet('Mudwretch');
 assert.match(mud.npcText.specialAttacks,/20-ft. line/);
 assert.match(mud.activeAbilities.find(a=>a.name==='Breath Weapon').desc,/DC 13/);
});

test('unreviewed raw arrays remain unchanged, no production import performed',()=>{
 const raw=KINGMAKER_BESTIARY_AUTO_002.find(e=>e.name==='Lerritan');
 assert.match(raw.text.skillDetail,/KINGMAKER BESTIARY/);
 assert.equal(raw.verified,'automated-needs-review');
 assert.equal(raw.stats.str,undefined);
 assert.equal(KINGMAKER_STAGED_ENTRIES[105].verified,'transcribed-from-PDF');
 assert.equal(KINGMAKER_STAGED_ENTRIES[115].verified,'transcribed-from-PDF');
 assert.equal(KINGMAKER_STAGED_ENTRIES.filter(e=>e.verified==='automated-needs-review').length,0);
});
