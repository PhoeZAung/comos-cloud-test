import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_STAGED_ENTRIES,kingmakerNpcData,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import {KINGMAKER_BESTIARY_AUTO_002} from '../src/data/kingmaker/bestiary-auto-batch-002.mjs';
import {KINGMAKER_BESTIARY_REVIEWED_011_020} from '../src/data/kingmaker/bestiary-reviewed-011-020.mjs';
import {extractKingmakerChapter} from '../scripts/kingmaker-extract-layout.mjs';

const expectations=[
 // Name, printed page, CR (null = not ranked), XP, HP, AC, Strength
 ['Boggard Warden',14,9,6400,98,20,18],
 ['Giant Frog Companion',15,null,null,26,17,16],
 ['Bog Strider',15,2,600,15,16,14],
 ['Bugbear Tormentor',15,3,800,39,17,18],
 ['Cauthooj',16,12,19200,162,28,24],
 ['Centaur Scout',17,5,1600,53,16,20],
 ['Oversized Chimera',17,12,19200,161,27,24],
 ['Black Tear Cutthroat',17,0.5,200,10,16,14],
 ['Ruffian',18,2,600,25,16,16],
 ['Stag Lord Bandit',18,0.5,200,15,14,13]
];
const batch=KINGMAKER_STAGED_ENTRIES.slice(10,20);
const find=name=>batch.find(e=>e.name===name);

test('second PDF-checked Bestiary batch has exactly ten unique, contiguous entries',()=>{
 assert.equal(batch.length,10);
 assert.equal(Object.keys(KINGMAKER_BESTIARY_REVIEWED_011_020).length,10);
 for(let i=0;i<expectations.length;i++){
  const [name,page,cr,xp,hp,ac,str]=expectations[i];
  const e=batch[i];
  assert.deepEqual([e.name,e.printedPage,e.stats.cr??null,e.stats.xp??null,e.hp,e.stats.ac,e.stats.str],
   [name,page,cr,xp,hp,ac,str]);
  assert.equal(e.pdfPage,page+1);
  assert.equal(e.verified,'transcribed-from-PDF');
  assert.deepEqual(e.reviewFlags,[]);
  assert.equal(e.needsRulesReference,true);
 }
 assert.ok(kingmakerProgress().map(e=>e.reviewed)[0]>=50,'at least 50 source-checked bestiary records must remain reviewed');
 assert.deepEqual(kingmakerProgress().map(e=>e.staged),[105,105,0,7]);
});

test('special movement, conditionals, source pages and spellcasting survive Cosmos adapter',()=>{
 const frog=kingmakerNpcData(find('Giant Frog Companion'));
 assert.equal(frog.npcStats.cr,null);
 assert.equal(frog.npcStats.xp,null);
 assert.equal(frog.npcStats.str,16);
 assert.equal(frog.npcSkills.find(s=>s.name==='Swim').bonus,15);
 assert.match(frog.npcText.maneuverDetail,/\+10 grapple/);
 assert.match(frog.npcText.movementDetail,/tongue reach 15/);

 const bog=kingmakerNpcData(find('Bog Strider'));
 assert.equal(bog.npcStats.str,14);
 assert.match(bog.npcText.movementDetail,/water stride 50 ft/);
 assert.match(bog.npcText.maneuverDetail,/21 vs. trip/);
 assert.equal(bog.activeAbilities.length,4);
 assert.ok(bog.weapons.some(w=>w.name.startsWith('Masterwork net')&&w.npcAttackBonus===5));
 assert.equal(bog.weapons.filter(w=>w.name.startsWith('Claw')).length,2);

 const warden=kingmakerNpcData(find('Boggard Warden'));
 assert.match(warden.npcText.spellsPrepared,/entangle/);
 assert.match(warden.npcText.combatGear,/cure serious wounds/);
 assert.match(warden.npcText.movementDetail,/15 ft. wearing armor/);

 const cauthooj=kingmakerNpcData(find('Cauthooj'));
 assert.equal(cauthooj.activeAbilities.length,4);
 assert.equal(cauthooj.weapons.filter(w=>w.name.startsWith('Talon')).length,2);
 assert.match(cauthooj.npcText.specialAbilities,/DC 16 Will/);
 assert.equal(cauthooj.npcStats.str,24);

 const chimera=kingmakerNpcData(find('Oversized Chimera'));
 assert.equal(chimera.weapons.length,5);
 assert.equal(chimera.weapons.filter(w=>w.name.startsWith('Claw')).length,2);
 assert.equal(chimera.activeAbilities[0].name,'Breath Weapon');
 assert.match(chimera.npcText.specialAttacks,/10d8 fire/);
 assert.match(chimera.npcText.movementDetail,/poor maneuverability/);

 const centaur=kingmakerNpcData(find('Centaur Scout'));
 assert.equal(centaur.weapons.filter(w=>w.name.startsWith('Hoof')).length,2);
 assert.match(centaur.npcText.maneuverDetail,/30 vs. trip/);
});

test('overlays remove copied adjoining creature prose but preserve the raw auto extraction',()=>{
 for(const e of batch){
  const values=Object.values(e.text).filter(v=>typeof v==='string').join(' ');
  assert.ok(!values.includes('KINGMAKER BESTIARY BESTIA'),e.name);
  assert.ok(!values.includes('CHIMERA Chimeras are common'),e.name);
  assert.ok(!values.includes('CAUTHOOJ These large'),e.name);
 }
 const raw=KINGMAKER_BESTIARY_AUTO_002.find(e=>e.name==='Giant Frog Companion');
 assert.match(raw.text.skillDetail,/BOG STRIDER/,'raw record remains intact');
 assert.equal(raw.stats.str,undefined,'original parser omission still visible for auditing');
 const reviewed=find('Giant Frog Companion');
 assert.equal(reviewed.npcSkills.find(s=>s.name==='Swim').bonus,15);
 assert.match(reviewed.text.skillDetail,/Swim \+15$/);
 assert.equal(KINGMAKER_STAGED_ENTRIES.length,217);
});


test('offline PDF extractor retains Strength with all six ability scores',()=>{
 const pages=[{page:16,text:[
  'BOG STRIDER CR 2',
  'XP 600',
  'N Medium monstrous humanoid',
  'STATISTICS',
  'Str 14, Dex 14, Con 14, Int 11, Wis 13, Cha 9'
 ].join('\n')}];
 const parsed=extractKingmakerChapter(pages,'bestiary');
 assert.equal(parsed.length,1);
 assert.deepEqual(
  ['str','dex','con','int','wis','cha'].map(key=>parsed[0].stats[key]),
  [14,14,14,11,13,9]);
});
