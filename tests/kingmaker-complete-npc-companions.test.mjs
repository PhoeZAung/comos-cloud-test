import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {KINGMAKER_STAGED_ENTRIES,kingmakerProgress,kingmakerNpcData} from '../src/data/kingmaker/catalog.mjs';
import {selectKingmakerEntries,planKingmakerImport} from '../scripts/import-kingmaker.mjs';

test('all 217 staged Kingmaker entries are PDF-reviewed, with hazards still deferred',()=>{
 assert.equal(KINGMAKER_STAGED_ENTRIES.length,217);
 assert.deepEqual(kingmakerProgress().map(c=>c.reviewed),[105,105,0,7]);
 assert.deepEqual(kingmakerProgress().map(c=>c.staged),[105,105,0,7]);
 assert.ok(KINGMAKER_STAGED_ENTRIES.every(x=>x.verified==='transcribed-from-PDF'), 'no auto-unreviewed records may pass');
 assert.ok(KINGMAKER_STAGED_ENTRIES.every(x=>!x.reviewFlags?.length),'no outstanding review flags');
 assert.equal(new Set(KINGMAKER_STAGED_ENTRIES.map(x=>x.chapter+':'+x.slug)).size,217);
});

test('seven companions retain fourteen separate printed levels with own hp and combat data',()=>{
 const expected=[['amiri',[1,11],[15,126]],['ekundayo',[1,6],[12,52]],['jubilost-narthropple',[1,8],[10,59]],['linzi',[1,7],[10,52]],['nok-nok',[1,5],[11,43]],['tristian',[1,10],[9,72]],['valerie',[1,9],[13,103]]];
 const entries=selectKingmakerEntries('companions');
 assert.deepEqual(entries.map(x=>x.slug),expected.map(x=>x[0]));
 for (const [slug,levels,hp] of expected){
  const e=entries.find(x=>x.slug===slug),data=kingmakerNpcData(e);
  assert.equal(e.verified,'transcribed-from-PDF',slug);
  assert.equal(data.npcCategory,'companions');
  assert.equal(data.npcLibraryTag,'companion');
  assert.equal(data.npcVerified,true);
  assert.deepEqual(e.variants.map(v=>v.level),levels);
  assert.deepEqual(e.variants.map(v=>v.hp),hp);
  assert.equal(data.npcVariants.length,2);
  assert.equal(data.hp_max,hp[0],slug);
  assert.equal(data.hp_curr,hp[0],slug);
  assert.equal(e.weapons.length,e.variants[0].weapons.length);
  for(const v of e.variants){
   assert.ok(v.weapons.length>0,slug);
   assert.ok(v.npcSkills.length>0,slug);
   assert.ok(v.weapons.every(w=>Number.isFinite(w.npcAttackBonus)),slug);
   assert.deepEqual(v.reviewFlags,[],slug);
  }
 }
 assert.match(entries.find(e=>e.slug==='ekundayo').variants[1].text.specialAbilities,/DOG|Dog/);
 assert.match(entries.find(e=>e.slug==='tristian').variants[1].text.spellsPrepared,/5th.*4th.*3rd.*2nd.*1st.*0/);
});

test('preview selects NPC Codex and companions without an unreviewed-entry bypass',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'Kingmaker staging test'});
  const npc=selectKingmakerEntries('npc-codex');
  const companions=selectKingmakerEntries('companions');
  assert.equal(npc.length,105);
  assert.equal(companions.length,7);
  const p1=planKingmakerImport(db,owner.id,{entries:npc});
  const p2=planKingmakerImport(db,owner.id,{entries:companions});
  assert.equal(p1.unreviewed,0);
  assert.equal(p2.unreviewed,0);
  assert.equal(p1.create.length,105);
  assert.equal(p2.create.length,7);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,0,'dry-run must never write');
 }finally{db.close();}
});
