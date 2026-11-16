import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {KINGMAKER_STAGED_ENTRIES,KINGMAKER_BOOK_ID} from '../src/data/kingmaker/catalog.mjs';
import {applyKingmakerImport,planKingmakerImport,selectKingmakerEntries} from '../scripts/import-kingmaker.mjs';
import {planKingmakerDuplicateCleanup,replaceKingmakerDuplicates} from '../scripts/replace-kingmaker-duplicates.mjs';

const names=['Black Tear Cutthroat','Gromog','Nishkiv the Knife','Volodmyra','Linzi'];
function handmade(db,owner,name){
 const id=randomUUID(),now=new Date().toISOString();
 db.prepare("INSERT INTO characters(id,owner_id,name,created_at,updated_at,kind) VALUES(?,?,?,?,?,'npc')")
  .run(id,owner,name,now,now);
 db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)')
  .run(id,JSON.stringify({charName:name,hp_max:19,npcStats:{},manualCharacter:true}));
 return id;
}
function seed(db,owner){
 const old=new Map(names.map(name=>[name,handmade(db,owner,name)]));
 const black=KINGMAKER_STAGED_ENTRIES.find(e=>e.chapter==='bestiary'&&e.slug==='black-tear-cutthroat');
 assert.ok(black);
 assert.equal(applyKingmakerImport(db,owner,{entries:[black],renameImportConflicts:true}).created,1);
 return old;
}
test('cleanup previews exact-name replacement, then imports reviewed copies, removes five duplicates and restores original names',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'Cleanup test'}).id;
  seed(db,owner);
  const unrelatedId=handmade(db,owner,'My custom friendly guide');
  const before=db.prepare('SELECT COUNT(*) AS n FROM characters').get().n;
  const prev=planKingmakerDuplicateCleanup(db,owner);
  assert.equal(prev.toDelete.length,5);
  assert.equal(prev.toCreate.length,4);
  assert.equal(prev.toRename.length,5);
  assert.deepEqual(prev.toRename.filter(x=>x.to==='Black Tear Cutthroat').map(x=>x.from),['Black Tear Cutthroat (Bestiary)']);
  assert.deepEqual(prev.linkedReferences,[]);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,before,'preview must not write');
  const outcome=replaceKingmakerDuplicates(db,owner);
  assert.deepEqual(outcome.deleted,names);
  assert.equal(outcome.createdReviewed.length,4);
  assert.equal(outcome.transferredRolls,0);
  assert.equal(outcome.readyToImport.npcCodex,102);
  assert.equal(outcome.readyToImport.companions,6);
  const remaining=db.prepare("SELECT c.id,c.name,d.data_json AS data FROM characters c JOIN character_details d ON d.character_id=c.id WHERE c.owner_id=? ORDER BY c.name").all(owner);
  assert.equal(remaining.length,6);
  assert.ok(remaining.some(x=>x.id===unrelatedId),'unrelated handmade NPC unchanged');
  for(const name of names){
   const reviewed=remaining.find(x=>x.name===name);
   assert.ok(reviewed,name+' original name restored');
   assert.equal(JSON.parse(reviewed.data).npcImportSource,KINGMAKER_BOOK_ID);
   assert.equal(JSON.parse(reviewed.data).charName,name);
  }
  const codex=planKingmakerImport(db,owner,{entries:selectKingmakerEntries('npc-codex')});
  const companions=planKingmakerImport(db,owner,{entries:selectKingmakerEntries('companions')});
  assert.deepEqual(codex.conflicts,[]);
  assert.deepEqual(companions.conflicts,[]);
  assert.equal(codex.create.length,102);
  assert.equal(companions.create.length,6);
  assert.equal(replaceKingmakerDuplicates(db,owner).deleted.length,0,'cleanup is idempotent');
  assert.equal(replaceKingmakerDuplicates(db,owner).createdReviewed.length,0);
 }finally{db.close();}
});

test('cleanup refuses unknown linked tables and rolls back all replacements',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'Linked NPC test'}).id;
  const manual=seed(db,owner);
  db.exec('CREATE TABLE deletion_guard_test(id TEXT PRIMARY KEY,npc_id TEXT REFERENCES characters(id))');
  db.prepare('INSERT INTO deletion_guard_test(id,npc_id) VALUES(?,?)')
   .run(randomUUID(),manual.get('Black Tear Cutthroat'));
  const plan=planKingmakerDuplicateCleanup(db,owner);
  assert.ok(plan.blockingReferences.some(x=>x.table==='deletion_guard_test'&&x.npc==='Black Tear Cutthroat'));
  const count=db.prepare('SELECT COUNT(*) AS n FROM characters').get().n;
  assert.throws(()=>replaceKingmakerDuplicates(db,owner),/referenced by other data/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,count);
  assert.equal(db.prepare('SELECT count(*) AS n FROM characters WHERE id=?').get(manual.get('Black Tear Cutthroat')).n,1);
 }finally{db.close();}
});

test('26 saved sheet rolls are preserved and reassigned to the reviewed NPC records',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'Roll history test'}).id;
  const old=seed(db,owner);
  const otherId=handmade(db,owner,'Some other NPC');
  // Minimal roll-history fixture with the production table and FK field names.
  db.exec('DROP TABLE IF EXISTS sheet_rolls');
  db.exec('CREATE TABLE sheet_rolls (id TEXT PRIMARY KEY,character_id TEXT NOT NULL REFERENCES characters(id),roll_text TEXT NOT NULL)');
  const insert=db.prepare('INSERT INTO sheet_rolls(id,character_id,roll_text) VALUES(?,?,?)');
  for(const [name,count] of [['Black Tear Cutthroat',21],['Gromog',4],['Volodmyra',1]]){
   for(let i=0;i<count;i++)insert.run(randomUUID(),old.get(name),'roll '+i);
  }
  insert.run(randomUUID(),otherId,'unrelated roll');
  const plan=planKingmakerDuplicateCleanup(db,owner);
  assert.deepEqual(plan.rollTransfers.map(x=>[x.npc,x.count]),[
   ['Black Tear Cutthroat',21],['Gromog',4],['Volodmyra',1]]);
  assert.equal(plan.blockingReferences.length,0);
  const before=db.prepare('SELECT COUNT(*) AS n FROM sheet_rolls').get().n;
  const outcome=replaceKingmakerDuplicates(db,owner);
  assert.equal(outcome.transferredRolls,26);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sheet_rolls').get().n,before);
  for(const [name,count] of [['Black Tear Cutthroat',21],['Gromog',4],['Volodmyra',1]]){
   assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sheet_rolls WHERE character_id=?').get(old.get(name)).n,0);
   const replacement=db.prepare('SELECT id FROM characters WHERE owner_id=? AND name=?').get(owner,name);
   assert.ok(replacement,name);
   assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sheet_rolls WHERE character_id=?').get(replacement.id).n,count);
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sheet_rolls WHERE character_id=?').get(otherId).n,1);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{db.close();}
});
