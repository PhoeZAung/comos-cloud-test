import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {KINGMAKER_STAGED_ENTRIES,KINGMAKER_BOOK_ID} from '../src/data/kingmaker/catalog.mjs';
import {applyKingmakerImport,planKingmakerImport,selectKingmakerEntries} from '../scripts/import-kingmaker.mjs';
import {planKingmakerDuplicateCleanup,replaceKingmakerDuplicates} from '../scripts/replace-kingmaker-duplicates.mjs';

function handmade(db,owner,name){
 const id=randomUUID(),now=new Date().toISOString();
 db.prepare("INSERT INTO characters(id,owner_id,name,created_at,updated_at,kind) VALUES(?,?,?,?,?,'npc')")
  .run(id,owner,name,now,now);
 db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)')
  .run(id,JSON.stringify({charName:name,hp_max:19,npcStats:{},manualCharacter:true}));
 return id;
}

test('cleanup previews and removes only 5 handmade duplicates; restores reviewed Bestiary name',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'Cleanup test'}).id;
  const names=['Black Tear Cutthroat','Gromog','Nishkiv the Knife','Volodmyra','Linzi'];
  for(const name of names)handmade(db,owner,name);
  const unrelatedId=handmade(db,owner,'My custom friendly guide');
  const black=KINGMAKER_STAGED_ENTRIES.find(e=>e.chapter==='bestiary'&&e.slug==='black-tear-cutthroat');
  assert.ok(black);
  const result=applyKingmakerImport(db,owner,{entries:[black],renameImportConflicts:true});
  assert.equal(result.created,1);
  const prev=planKingmakerDuplicateCleanup(db,owner);
  assert.equal(prev.toDelete.length,5);
  assert.equal(prev.toRename.length,1);
  assert.deepEqual(prev.toRename.map(x=>[x.from,x.to]),[['Black Tear Cutthroat (Bestiary)','Black Tear Cutthroat']]);
  assert.deepEqual(prev.linkedReferences,[]);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,7,'preview does not modify characters');
  const outcome=replaceKingmakerDuplicates(db,owner);
  assert.deepEqual(outcome.deleted,names);
  assert.equal(outcome.readyToImport.npcCodex,105);
  assert.equal(outcome.readyToImport.companions,7);
  const remaining=db.prepare("SELECT c.id,c.name,d.data_json AS data FROM characters c JOIN character_details d ON d.character_id=c.id WHERE c.owner_id=? ORDER BY c.name").all(owner);
  assert.equal(remaining.length,2);
  assert.ok(remaining.some(x=>x.id===unrelatedId),'unrelated manual NPC unchanged');
  const reviewed=remaining.find(x=>x.name==='Black Tear Cutthroat');
  assert.ok(reviewed);
  assert.equal(JSON.parse(reviewed.data).npcImportSource,KINGMAKER_BOOK_ID);
  assert.equal(JSON.parse(reviewed.data).charName,'Black Tear Cutthroat');
  const codex=planKingmakerImport(db,owner,{entries:selectKingmakerEntries('npc-codex')});
  const companions=planKingmakerImport(db,owner,{entries:selectKingmakerEntries('companions')});
  assert.deepEqual(codex.conflicts,[]);
  assert.deepEqual(companions.conflicts,[]);
  assert.equal(codex.create.length,105);
  assert.equal(companions.create.length,7);
  const again=replaceKingmakerDuplicates(db,owner);
  assert.equal(again.deleted.length,0);
  assert.equal(again.renamed.length,0);
 }finally{db.close();}
});

test('cleanup refuses to delete a manual NPC referenced by non-native tables',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'Linked NPC test'}).id;
  const black=KINGMAKER_STAGED_ENTRIES.find(e=>e.chapter==='bestiary'&&e.slug==='black-tear-cutthroat');
  const manualId=handmade(db,owner,'Black Tear Cutthroat');
  applyKingmakerImport(db,owner,{entries:[black],renameImportConflicts:true});
  db.exec('CREATE TABLE deletion_guard_test(id TEXT PRIMARY KEY,npc_id TEXT REFERENCES characters(id))');
  db.prepare('INSERT INTO deletion_guard_test(id,npc_id) VALUES(?,?)').run(randomUUID(),manualId);
  const plan=planKingmakerDuplicateCleanup(db,owner);
  assert.ok(plan.linkedReferences.some(x=>x.table==='deletion_guard_test'&&x.npc==='Black Tear Cutthroat'));
  assert.throws(()=>replaceKingmakerDuplicates(db,owner),/referenced by other data/);
  assert.equal(db.prepare('SELECT count(*) AS n FROM characters WHERE id=?').get(manualId).n,1);
 }finally{db.close();}
});
