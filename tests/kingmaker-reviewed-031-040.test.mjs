import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_STAGED_ENTRIES,kingmakerNpcData,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import {KINGMAKER_BESTIARY_AUTO_002} from '../src/data/kingmaker/bestiary-auto-batch-002.mjs';
import {KINGMAKER_BESTIARY_REVIEWED_031_040} from '../src/data/kingmaker/bestiary-reviewed-031-040.mjs';

const expected=[
 ['Drainberry Bush',24,7,3200,85,20,22],
 ['Enormous Flame Drake',25,8,4800,94,21,25],
 ['Dweomercat',25,7,3200,85,23,15],
 ['River Elasmosaurus',26,11,12800,147,25,28],
 ['Elder Elemental Tsunami',27,14,38400,180,29,30],
 ['Fetch Stalker',27,18,153600,300,33,22],
 ['Fetch Behemoth',28,20,307200,378,36,30],
 ['Risen Fetch',28,22,614400,432,39,26],
 ['Gnome Explorer',29,1/3,135,6,13,8],
 ['Hunter',30,7,3200,80,18,14]
];
const batch=KINGMAKER_STAGED_ENTRIES.slice(30,40);
const find=name=>batch.find(x=>x.name===name);
const sheet=name=>kingmakerNpcData(find(name));

test('Bestiary 31–40 are source-checked with exact printed pages and stats',()=>{
 assert.equal(batch.length,10);
 assert.equal(Object.keys(KINGMAKER_BESTIARY_REVIEWED_031_040).length,10);
 for(let i=0;i<10;i++){
  const [name,page,cr,xp,hp,ac,str]=expected[i];
  const x=batch[i];
  assert.deepEqual([x.name,x.printedPage,x.stats.cr,x.stats.xp,x.hp,x.stats.ac,x.stats.str],
   [name,page,cr,xp,hp,ac,str]);
  assert.equal(x.pdfPage,page+1);
  assert.equal(x.verified,'transcribed-from-PDF');
  assert.deepEqual(x.reviewFlags,[]);
  assert.equal(x.needsRulesReference,true);
  assert.equal(sheet(name).npcVerified,true);
 }
 assert.deepEqual(kingmakerProgress().map(x=>x.staged),[105,105,0,7]);
 assert.deepEqual(kingmakerProgress().map(x=>x.reviewed),[50,0,0,0]);
 assert.equal(KINGMAKER_STAGED_ENTRIES.length,217);
});

test('buried natural attacks and full spell features remain editable without misleading rolls',()=>{
 const plant=sheet('Drainberry Bush');
 assert.equal(plant.weapons.length,2,'two vines must not be collapsed to one');
 assert.equal(plant.weapons[0].npcAttackBonus,12);
 assert.match(plant.npcText.specialAbilities,/2d8\+10/);
 assert.match(plant.npcText.specialAbilities,/swift action/);

 const drake=sheet('Enormous Flame Drake');
 assert.match(drake.npcText.specialAttacks,/180-ft/);
 assert.match(drake.npcText.specialAttacks,/8d6 fire/);
 assert.match(drake.activeAbilities[0].desc,/DC 17/);
 assert.match(drake.activeAbilities[0].desc,/1d4 rounds/);

 const cat=sheet('Dweomercat');
 assert.equal(cat.npcStats.sr,19);
 assert.equal(cat.weapons.length,5,'bite, two claws, and two conditional rake claws');
 assert.match(cat.npcText.specialAbilities,/Necromancy/);
 assert.ok(cat.activeAbilities.some(x=>x.name==='Spell Link'));
 assert.equal(cat.npcText.raceClassLevels,null,'neighboring monster heading removed from identity');
 assert.match(cat.npcText.maneuverDetail,/33 vs. trip/);

 const water=sheet('River Elasmosaurus');
 assert.equal(water.npcSkills.find(x=>x.name==='Swim').bonus,22);
 assert.match(water.npcText.maneuverDetail,/39 vs. trip/);
 assert.match(water.npcText.sourceReference,/Bestiary p. 84/);
});

test('tsunami disease, fetch defenses and shared attacks are preserved',()=>{
 const tsunami=sheet('Elder Elemental Tsunami');
 assert.equal(tsunami.weapons.length,2);
 assert.equal(tsunami.npcSkills.find(x=>x.name==='Knowledge (planes)').bonus,22);
 assert.equal(tsunami.npcSkills.find(x=>x.name==='Swim').bonus,40);
 assert.match(tsunami.npcText.specialAbilities,/Fortitude DC 23/);
 assert.match(tsunami.npcText.maneuverDetail,/50 vs. bull rush/);
 assert.doesNotMatch(tsunami.npcText.feats,/INTRODUCTION|CHAPTER/);

 const stalker=sheet('Fetch Stalker');
 assert.equal(stalker.npcStats.sr,29);
 assert.equal(stalker.npcStats.regeneration,5);
 assert.equal(stalker.weapons.length,3);
 assert.match(stalker.npcText.specialAbilities,/swift action/);

 const behemoth=sheet('Fetch Behemoth');
 assert.equal(behemoth.npcStats.sr,31);
 assert.equal(behemoth.npcStats.regeneration,5);
 assert.equal(behemoth.weapons.filter(x=>x.attack_type==='melee').length,2);
 assert.equal(behemoth.weapons.filter(x=>x.attack_type==='melee').every(x=>x.npcAttackBonus===29),true);
 assert.match(behemoth.npcText.maneuverDetail,/43 vs. sunder/);

 const risen=sheet('Risen Fetch');
 assert.equal(risen.npcStats.sr,33);
 assert.equal(risen.npcStats.regeneration,5);
 assert.match(risen.npcText.specialAbilities,/DC 35/);
 assert.match(risen.npcText.spellLikeAbilities,/wish/);
 assert.doesNotMatch(risen.npcText.spellLikeAbilities,/KINGMAKER BESTIARY/);
});

test('small encounters and inventory text are cleaned without altering original bulk archive',()=>{
 const gnome=sheet('Gnome Explorer');
 assert.equal(gnome.npcSkills.find(x=>x.name==='Knowledge (nature)').bonus,8);
 assert.equal(gnome.npcSkills.find(x=>x.name==='Survival').bonus,3);
 assert.equal(gnome.npcText.gear,'Padded armor, dagger.');
 const hunter=sheet('Hunter');
 assert.match(hunter.npcText.combatGear,/cure moderate wounds/);
 assert.match(hunter.npcText.gear,/composite longbow/);
 assert.equal(hunter.weapons.length,4);
 assert.match(hunter.npcText.spellsPrepared,/pass without trace/);

 const rawGnome=KINGMAKER_BESTIARY_AUTO_002.find(x=>x.slug==='gnome-explorer');
 assert.match(rawGnome.text.gear,/HUNTER INDEX/,'raw bulk data is preserved for audit');
 const rawStalker=KINGMAKER_BESTIARY_AUTO_002.find(x=>x.slug==='fetch-stalker');
 assert.equal(rawStalker.stats.sr,undefined,'raw parser not retroactively rewritten');
 assert.equal(KINGMAKER_STAGED_ENTRIES[40].verified,'automated-needs-review');
});
