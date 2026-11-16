import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {KINGMAKER_STAGED_ENTRIES,KINGMAKER_BOOK_ID} from '../src/data/kingmaker/catalog.mjs';
import {selectKingmakerEntries,planKingmakerImport,applyKingmakerImport} from '../scripts/import-kingmaker.mjs';

test('default importer blocks existing manual names and never writes partial Bestiary imports',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'GM'});
  const id=randomUUID(),date=new Date().toISOString();
  const original={manualCharacter:true,npcCategory:'npc-codex',npcText:{summary:'Existing NPC; do not alter.'},hp_curr:13};
  db.prepare("INSERT INTO characters(id,owner_id,name,created_at,updated_at,kind) VALUES(?,?,?,?,?,'npc')").run(id,owner.id,'Black Tear Cutthroat',date,date);
  db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,JSON.stringify(original));
  const entries=selectKingmakerEntries('bestiary');
  assert.equal(entries.length,105);
  assert.ok(entries.some(entry=>entry.slug==='black-tear-cutthroat'));
  const plan=planKingmakerImport(db,owner.id,{entries});
  assert.equal(plan.create.length,104);
  assert.equal(plan.conflicts.length,1);
  assert.deepEqual(plan.renamed,[]);
  assert.equal(plan.unreviewed,0);
  assert.throws(()=>applyKingmakerImport(db,owner.id,{entries}),/naming conflict/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,1);
  assert.deepEqual(JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json),original);
 }finally{db.close();}
});

test('opt-in suffix imports all 105, keeps manual NPC byte-for-byte, and reruns idempotently',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'GM'});
  const id=randomUUID(),date='2026-11-16T00:00:00Z',entries=selectKingmakerEntries('bestiary');
  const original={manualCharacter:true,npcCategory:'npc-codex',hp_curr:33,hp_max:40,npcText:{summary:'User managed'}};
  db.prepare("INSERT INTO characters(id,owner_id,name,created_at,updated_at,kind) VALUES(?,?,?,?,?,'npc')").run(id,owner.id,'Black Tear Cutthroat',date,date);
  db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,JSON.stringify(original));
  const before=db.prepare('SELECT * FROM characters WHERE id=?').get(id);
  const beforeData=db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json;
  const plan=planKingmakerImport(db,owner.id,{entries,renameImportConflicts:true});
  assert.equal(plan.create.length,105);
  assert.equal(plan.unreviewed,0);
  assert.deepEqual(plan.conflicts,[]);
  assert.deepEqual(plan.renamed,[{key:'bestiary:black-tear-cutthroat',from:'Black Tear Cutthroat',to:'Black Tear Cutthroat (Bestiary)'}]);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,1,'preview is not a write');
  const applied=applyKingmakerImport(db,owner.id,{entries,renameImportConflicts:true});
  assert.equal(applied.created,105);
  const imported=db.prepare("SELECT c.id,c.name,d.data_json AS data FROM characters c JOIN character_details d ON d.character_id=c.id WHERE c.name='Black Tear Cutthroat (Bestiary)'").get();
  assert.ok(imported);
  const importedData=JSON.parse(imported.data);
  assert.equal(importedData.npcImportSource,KINGMAKER_BOOK_ID);
  assert.equal(importedData.npcImportKey,'black-tear-cutthroat');
  assert.equal(importedData.npcLibraryTag,'bestiary');
  assert.equal(importedData.charName,'Black Tear Cutthroat (Bestiary)');
  assert.deepEqual(db.prepare('SELECT * FROM characters WHERE id=?').get(id),before);
  assert.equal(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json,beforeData);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,106);
  assert.equal(planKingmakerImport(db,owner.id,{entries}).skipped.length,105,'the source slug is stable after display rename');
  const again=applyKingmakerImport(db,owner.id,{entries});
  assert.equal(again.created,0);
  assert.equal(again.skipped,105);
 }finally{db.close();}
});

test('opt-in rename refuses occupied suffixed name without changing any existing NPC',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'GM'});
  for(const name of ['Black Tear Cutthroat','Black Tear Cutthroat (Bestiary)']){
   const id=randomUUID(),date='2026-11-16T00:00:00Z';
   db.prepare("INSERT INTO characters(id,owner_id,name,created_at,updated_at,kind) VALUES(?,?,?,?,?,'npc')").run(id,owner.id,name,date,date);
   db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,'{}');
  }
  const entries=selectKingmakerEntries('bestiary');
  const plan=planKingmakerImport(db,owner.id,{entries,renameImportConflicts:true});
  assert.equal(plan.conflicts.length,1);
  assert.match(plan.conflicts[0].reason,/already exists/);
  assert.throws(()=>applyKingmakerImport(db,owner.id,{entries,renameImportConflicts:true}),/naming conflict/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,2);
 }finally{db.close();}
});
