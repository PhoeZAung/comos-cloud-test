import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_STAGED_ENTRIES,kingmakerNpcData,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import {KINGMAKER_BESTIARY_AUTO_002} from '../src/data/kingmaker/bestiary-auto-batch-002.mjs';
import {KINGMAKER_BESTIARY_REVIEWED_041_050} from '../src/data/kingmaker/bestiary-reviewed-041-050.mjs';

const expected=[
 ['Logger',30,0.5,200,16,12,12],
 ['Poacher',30,2,600,27,14,12],
 ['Snapping Flytrap',30,3,800,39,15,16],
 ['Ghostly Guard',31,15,51200,178,24,null],
 ['Hill Giant Butcher',32,14,38400,192,29,27],
 ['Kargstaad’s Giant',32,15,51200,222,30,31],
 ['Goblin Commando',33,1,400,19,15,12],
 ['Goblin Pyro',33,1,400,15,14,11],
 ['Goblin War Chanter',34,1,400,15,17,8],
 ['Goblin Bat-Dog',34,3,800,20,17,19]
];
const batch=KINGMAKER_STAGED_ENTRIES.slice(40,50);
const find=name=>batch.find(e=>e.name===name);
const sheet=name=>kingmakerNpcData(find(name));

test('Bestiary 41–50 have source checked core stats and original PDF references',()=>{
 assert.equal(Object.keys(KINGMAKER_BESTIARY_REVIEWED_041_050).length,10);
 for(let i=0;i<expected.length;i++){
  const [name,page,cr,xp,hp,ac,str]=expected[i],e=batch[i];
  assert.deepEqual([e.name,e.printedPage,e.stats.cr,e.stats.xp,e.hp,e.stats.ac,e.stats.str??null],[name,page,cr,xp,hp,ac,str]);
  assert.equal(e.pdfPage,page+1);
  assert.equal(e.verified,'transcribed-from-PDF');
  assert.deepEqual(e.reviewFlags,[]);
  assert.equal(sheet(name).npcVerified,true);
 }
 assert.ok(kingmakerProgress().map(e=>e.reviewed)[0]>=50,'at least 50 source-checked bestiary records must remain reviewed');
 assert.deepEqual(kingmakerProgress().map(e=>e.staged),[105,105,0,7]);
 assert.equal(KINGMAKER_STAGED_ENTRIES.length,217);
});

test('simple roles, plants and giant alternatives do not lose attacks or conditional modifiers',()=>{
 assert.match(sheet('Logger').npcText.gear,/battleaxe/);
 const poacher=sheet('Poacher');
 assert.match(poacher.npcText.combatGear,/cure moderate wounds/);
 assert.match(poacher.npcText.gear,/20 arrows/);

 const flytrap=sheet('Snapping Flytrap');
 assert.equal(flytrap.weapons.length,2);
 assert.match(flytrap.npcText.maneuverDetail,/\+12 grapple/);
 assert.match(flytrap.npcText.maneuverDetail,/cannot be tripped/);
 assert.equal(flytrap.npcSkills.find(s=>s.name==='Perception').bonus,7);
 assert.doesNotMatch(flytrap.npcText.skillDetail,/GHOST Many consider/);

 const butcher=sheet('Hill Giant Butcher');
 assert.equal(butcher.weapons.filter(w=>w.name.startsWith('Slam')).length,2);
 assert.equal(butcher.weapons.filter(w=>w.attack_type==='ranged').length,3);
 assert.equal(butcher.weapons.filter(w=>w.name.includes('battleaxe')).length,3);
 assert.match(butcher.npcText.movementDetail,/30 ft. in armor/);

 const giant=sheet('Kargstaad’s Giant');
 assert.equal(giant.weapons.filter(w=>w.name.includes('greataxe')).length,4);
 assert.equal(giant.weapons.filter(w=>w.name.startsWith('Slam')).length,2);
 assert.equal(giant.weapons.filter(w=>w.name.startsWith('Rock')).length,4);
 assert.match(giant.npcText.feats,/Weapon Specialization \(greataxe\)/);
 assert.match(giant.npcText.maneuverDetail,/42 vs. bull rush/);
});

test('ghosts and goblins have source-correct status rules and separated spell slots',()=>{
 const ghost=sheet('Ghostly Guard');
 assert.equal(ghost.npcStats.str,null);
 assert.equal(ghost.npcStats.con,null);
 assert.equal(ghost.weapons.length,4);
 assert.equal(ghost.npcSkills.find(x=>x.name==='Intimidate').bonus,23);
 assert.equal(ghost.npcSkills.find(x=>x.name==='Stealth').bonus,28);
 assert.match(ghost.npcText.specialAbilities,/DC 30 Diplomacy/);
 assert.ok(ghost.activeAbilities.some(a=>a.name==='Shame'));
 assert.doesNotMatch(ghost.npcText.attackDetail,/CHAPTER/);

 const commando=sheet('Goblin Commando');
 assert.match(commando.npcText.movementDetail,/10 ft. with horsechopper/);
 const pyro=sheet('Goblin Pyro');
 assert.match(pyro.npcText.spellsKnown,/burning hands/);
 assert.match(pyro.npcText.spellLikeAbilities,/elemental ray/);
 assert.equal(pyro.weapons.length,1);
 assert.doesNotMatch(pyro.npcText.spellsKnown,/COMPANIONS|HAZARDS/);
 const war=sheet('Goblin War Chanter');
 assert.match(war.npcText.spellsKnown,/ear-piercing scream/);
 assert.match(war.npcText.specialAttacks,/7 rounds\/day/);
 assert.equal(war.weapons.length,2);
 const dog=sheet('Goblin Bat-Dog');
 assert.match(dog.activeAbilities[0].desc,/DC 15/);
 assert.match(dog.activeAbilities[0].desc,/1-minute cooldown/);
 assert.equal(dog.npcSkills.find(s=>s.name==='Fly').bonus,8);
});

test('raw auto extraction is preserved and only these 50 are marked reviewed',()=>{
 const source=KINGMAKER_BESTIARY_AUTO_002.find(x=>x.name==='Ghostly Guard');
 assert.match(source.text.attackDetail,/CHAPTER 3/);
 assert.equal(source.verified,'automated-needs-review');
 assert.equal(KINGMAKER_STAGED_ENTRIES[105].verified,'automated-needs-review');
 assert.ok(kingmakerProgress().find(x=>x.id==='bestiary').reviewed>=50);
});
