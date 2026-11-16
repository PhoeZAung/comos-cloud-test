import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {KINGMAKER_STAGED_ENTRIES,kingmakerNpcData,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import {KINGMAKER_NPC_CODEX_AUTO_001} from '../src/data/kingmaker/npc-codex-auto-batch-001.mjs';
import {KINGMAKER_NPC_CODEX_REVIEWED_001_010 as overlay} from '../src/data/kingmaker/npc-codex-reviewed-001-010.mjs';
import {selectKingmakerEntries,planKingmakerImport,applyKingmakerImport} from '../scripts/import-kingmaker.mjs';

const slugs=['aecora-silverfire','agai','akiros-ismort','akuzhail','alasen','ameon-trask','annamede','armag','auchs','avinash-jurrg'];
const cr=[7,9,3,10,14,10,8,14,2,14];
const hp=[95,87,50,138,150,110,80,208,30,207];
const ac=[22,21,17,23,27,22,17,24,12,28];
const pages=[67,67,68,68,69,70,71,71,72,72];
const entries=selectKingmakerEntries('npc-codex');

test('source-reviewed first ten NPCs remain correct alongside all 105 reviewed Codex entries',()=>{
 assert.deepEqual(Object.keys(overlay),slugs);
 assert.equal(KINGMAKER_NPC_CODEX_AUTO_001.length,105);
 assert.equal(entries.length,105);
 assert.deepEqual(entries.slice(0,10).map(e=>e.slug),slugs);
 assert.deepEqual(kingmakerProgress().map(p=>p.reviewed),[105,105,0,7]);
 assert.deepEqual(kingmakerProgress().map(p=>p.staged),[105,105,0,7]);
 assert.equal(entries.filter(e=>e.verified==='automated-needs-review').length,0);
 assert.equal(KINGMAKER_STAGED_ENTRIES.filter(e=>e.verified==='automated-needs-review').length,0);
 assert.equal(KINGMAKER_STAGED_ENTRIES.filter(e=>e.chapter==='bestiary'&&e.verified==='transcribed-from-PDF').length,105);
 assert.equal(KINGMAKER_STAGED_ENTRIES.filter(e=>e.chapter==='companions'&&e.verified==='automated-needs-review').length,0);
});
test('first 10 printed NPC names and combat totals match the source pages',()=>{
 for(let i=0;i<10;i++){
  const entry=entries[i];
  assert.deepEqual([entry.slug,entry.stats.cr,entry.hp,entry.stats.ac,entry.printedPage,entry.pdfPage],[slugs[i],cr[i],hp[i],ac[i],pages[i],pages[i]+1],slugs[i]);
  assert.equal(entry.verified,'transcribed-from-PDF',entry.slug);
  assert.equal(entry.needsRulesReference,true);
  assert.deepEqual(entry.reviewFlags,[]);
  assert.match(entry.text.importNotes,/Source-reviewed printed/);
  const data=kingmakerNpcData(entry);
  assert.equal(data.npcCategory,'npc-codex');
  assert.equal(data.npcLibraryTag,'npc');
  assert.equal(data.npcVerified,true);
  assert.equal(data.npcImportKey,entry.slug);
  assert.equal(data.hp_curr,entry.hp);
  assert.equal(data.hp_max,entry.hp);
  assert.equal(data.weapons.length,entry.weapons.length);
  assert.equal(data.npcSkills.length,entry.npcSkills.length);
  assert.equal(data.activeAbilities.length,entry.activeAbilities.length);
  for(const [key,value] of Object.entries(entry.text)){
   assert.ok(value===null||typeof value==='string',entry.slug+':'+key);
   if(['gear','combatGear','acDetail','hpDetail','qualities','languages','spellsKnown','specialAttacks'].includes(key))
    assert.doesNotMatch(value||'',/\b(?:CHAPTER\s+[1-4]|INTRODUCTION|INDEX|COMPANIONS|NPC CODEX)\b/,entry.slug+':'+key+' contains layout spill');
  }
 }
});
test('Agai has complete Small and Enlarged alternate forms, not the same HP/space',()=>{
 const agai=entries[1],data=kingmakerNpcData(agai);
 assert.equal(agai.stats.str,14);
 assert.equal(agai.stats.space,null);
 assert.equal(agai.stats.reach,null);
 assert.equal(agai.variants.length,2);
 assert.deepEqual(agai.variants.map(v=>v.hp),[87,117]);
 assert.deepEqual(agai.variants.map(v=>v.stats.ac),[21,19]);
 assert.deepEqual(agai.variants.map(v=>v.stats.str),[14,26]);
 assert.deepEqual(agai.variants.map(v=>v.stats.cmb),[10,18]);
 assert.deepEqual(agai.variants.map(v=>v.stats.cmd),[24,31]);
 assert.equal(data.npcVariants.length,2);
 assert.equal(data.hp_max,87,'base HP stays Small-form only');
 assert.equal(agai.weapons.length,6);
 assert.equal(agai.weapons.filter(w=>w.name.startsWith('Enlarged')).length,3);
});
test('Akuzhail has discrete attacks and source-checked curse, poison, rattle, bloom rules',()=>{
 const e=entries[3];
 assert.equal(e.stats.str,23);
 assert.equal(e.text.energyResistances,null);
 assert.match(e.text.immunities,/Acid and poison/);
 assert.equal(e.weapons.length,5);
 assert.equal(e.weapons.filter(w=>w.name.includes('Claw')).length,2);
 assert.match(e.text.specialAbilities,/Fort DC 19/);
 assert.match(e.text.specialAbilities,/Fort DC 21/);
 assert.match(e.text.specialAbilities,/12d6/);
 assert.match(e.text.specialAbilities,/frightened 1d4 rounds/);
 for(const name of ['Acid Breath','Bloom Curse','Frightening Rattle','Life Bloom','Poison Bite','Bloom Stride'])
  assert.ok(e.activeAbilities.some(row=>row.name===name));
});
test('repaired gear, Bard spells, and alternate attack routines do not merge adjacent NPCs',()=>{
 const [aecora,,akiros,,alasen,ameon,annamede,armag,auchs,avinash]=entries;
 assert.equal(aecora.stats.str,20);
 assert.equal(aecora.weapons.length,4);
 assert.equal(akiros.stats.str,18);
 assert.match(akiros.text.tactics,/raging/);
 assert.match(akiros.weapons[1].desc,/×3/);
 assert.equal(alasen.stats.str,25);
 assert.match(alasen.text.qualities,/surprise attacks/);
 assert.deepEqual(alasen.weapons.filter(w=>/Rake claw/.test(w.name)).map(w=>w.npcAttackBonus),[16,16]);
 assert.equal(ameon.weapons.length,6);
 assert.match(ameon.text.feats,/Weapon Specialization/);
 assert.equal(annamede.stats.str,8);
 assert.match(annamede.text.spellsKnown,/3rd \(4\/day\)/);
 assert.match(annamede.text.spellsKnown,/0 \(at will\)/);
 assert.doesNotMatch(annamede.text.languages,/vanish|dancing lights/);
 assert.equal(armag.stats.casterLevel,null,'artifact caster level is not Armag\'s');
 assert.equal(armag.text.aura,null);
 assert.equal(armag.text.spellLikeAbilities,null);
 assert.match(armag.text.specialAbilities,/Ovinrbaane is a separate intelligent/);
 assert.equal(armag.weapons.length,9);
 assert.match(armag.text.attackDetail,/Mutually exclusive/);
 assert.equal(auchs.stats.str,20);
 assert.doesNotMatch(auchs.text.gear,/AVINASH/);
 assert.equal(avinash.stats.str,28);
 assert.equal(avinash.stats.regeneration,5);
 assert.match(avinash.text.spellLikeAbilities,/CL 9th/);
 assert.match(avinash.text.spellsKnown,/CL 10th/);
 assert.match(avinash.text.gear,/cloak of resistance \+2/);
 assert.equal(avinash.weapons.length,6);
});
test('NPC import for all 105 reviewed entries succeeds in an isolated in-memory database',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'GM'});
  const plan=planKingmakerImport(db,owner.id,{entries});
  assert.equal(plan.create.length,105);
  assert.equal(plan.unreviewed,0);
  assert.deepEqual(plan.conflicts,[]);
  assert.equal(applyKingmakerImport(db,owner.id,{entries}).created,105);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM characters').get().count,105);
 }finally{db.close();}
});
