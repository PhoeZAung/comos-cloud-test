import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {npcDirectory} from '../backend/characters/npcs.mjs';
import {KINGMAKER_STAGED_ENTRIES,KINGMAKER_CHAPTERS,KINGMAKER_BOOK_ID,kingmakerNpcData,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';

const expected=[
 ['Giant Animated Statue',7,3200,78,15,9],
 ['Ankou Assassin',17,102400,276,32,9],
 ['Vicious Army Ant Swarm',12,19200,135,23,10],
 ['Bloomborn Athach',17,102400,275,32,10],
 ['Azure Worm',15,51200,237,30,11],
 ['Elder Banshee',17,102400,264,30,11],
 ['Freshly Bloomed Basilisk',9,6400,105,21,12],
 ['Blodeuwedd',6,2400,66,20,12],
 ['Boggard Cultist',8,4800,101,19,13],
 ['Boggard Swampseer',3,800,39,19,13]
];

test('first 10 Bestiary entries match named creatures, CR, XP, HP, AC, and printed source pages',()=>{
 assert.equal(KINGMAKER_STAGED_ENTRIES.length,217);
 assert.equal(new Set(KINGMAKER_STAGED_ENTRIES.map(e=>e.chapter+':'+e.slug)).size,217,'unique chapter import keys');
 for(let i=0;i<expected.length;i++){
  const [name,cr,xp,hp,ac,page]=expected[i],rec=KINGMAKER_STAGED_ENTRIES[i];
  assert.deepEqual([rec.name,rec.stats.cr,rec.stats.xp,rec.hp,rec.stats.ac,rec.printedPage],[name,cr,xp,hp,ac,page]);
  assert.equal(rec.pdfPage,page+1);
  assert.equal(rec.chapter,'bestiary');
  assert.equal(rec.verified,'transcribed-from-PDF');
  assert.ok(rec.source.includes('First Edition'));
 }
});

test('staged monsters become Cosmos-editable NPC data without silently inventing unknown scores',()=>{
 for(const rec of KINGMAKER_STAGED_ENTRIES.slice(0,10)){
  const data=kingmakerNpcData(rec);
  assert.equal(data.npcCategory,'bestiary');
  assert.equal(data.npcImportSource,KINGMAKER_BOOK_ID);
  assert.equal(data.npcImportKey,rec.slug);
  assert.equal(data.hp_max,rec.hp);
  assert.equal(data.hp_curr,rec.hp);
  assert.equal(data.npcStats.cr,rec.stats.cr);
  assert.equal(data.npcStats.sourcePage,rec.printedPage);
  assert.equal(data.npcText.source,rec.source);
  assert.equal(data.weapons.length,rec.weapons.length);
  assert.equal(data.npcSkills.length,rec.npcSkills.length);
  assert.equal(data.activeAbilities.length,rec.activeAbilities.length);
  assert.equal(data.npcNeedsRulesReference,true);
  assert.ok(data.npcText.sourceReference.includes('p. '+rec.printedPage));
 }
 const construct=kingmakerNpcData(KINGMAKER_STAGED_ENTRIES[0]);
 assert.equal(construct.npcStats.con,null,'construct has no printed Constitution score');
 assert.equal(construct.npcStats.int,null,'construct has no printed Intelligence score');
 const swarm=kingmakerNpcData(KINGMAKER_STAGED_ENTRIES[2]);
 assert.equal(swarm.npcStats.cmb,null,'swarm cannot use standard combat maneuver rolls');
 assert.equal(swarm.weapons.length,0,'swarm damage is not a normal attack roll');
 assert.throws(()=>kingmakerNpcData({chapter:'hazards'}),/Unsupported/);
});

test('all categories have progress bars; hazards deferred; production remains unmodified',()=>{
 assert.deepEqual(KINGMAKER_CHAPTERS.map(x=>x.id),['bestiary','npc-codex','hazards','companions']);
 const progress=kingmakerProgress({});
 assert.deepEqual(progress.map(x=>x.staged),[105,105,0,7]);
 assert.deepEqual(progress.map(x=>x.reviewed),[10,0,0,0]);
 assert.deepEqual(progress.map(x=>x.imported),[0,0,0,0]);
 assert.equal(progress[0].total,105);
 assert.equal(progress[1].total,105);
 assert.equal(progress[2].deferred,true);
 assert.equal(progress[3].total,7);
 assert.equal(progress[0].percent,100);
 assert.equal(kingmakerProgress({bestiary:4})[0].imported,4);
});

test('NPC directory filters by chapter and keeps legacy manual NPCs in NPC Codex',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'GM'});
  const date='2026-11-16T00:00:00Z';
  function insert(name,data){
   const id=randomUUID();
   db.prepare(`INSERT INTO characters(id,owner_id,name,created_at,updated_at,kind) VALUES(?,?,?,?,?,'npc')`).run(id,owner.id,name,date,date);
   db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,JSON.stringify(data));
   return id;
  }
  const bestiaryId=insert('Giant Animated Statue',kingmakerNpcData(KINGMAKER_STAGED_ENTRIES[0]));
  const legacyId=insert('Old Custom Guard',{manualCharacter:true});
  const companionId=insert('Named Companion',{npcCategory:'companions'});
  const req={method:'GET'};const run=async url=>{
   let value;
   await npcDirectory({req,url:new URL(url,'https://cosmos.test'),db,ownerId:owner.id,send:(status,data)=>value={status,data}});
   return value;
  };
  let answer=await run('/api/v1/admin/npcs?category=bestiary');
  assert.equal(answer.status,200);
  assert.deepEqual(answer.data.characters.map(c=>c.id),[bestiaryId]);
  assert.deepEqual(answer.data.progress.map(p=>p.imported),[1,0,0,0]);
  answer=await run('/api/v1/admin/npcs');
  assert.deepEqual(answer.data.characters.map(c=>c.id),[legacyId]);
  answer=await run('/api/v1/admin/npcs?category=companions');
  assert.deepEqual(answer.data.characters.map(c=>c.id),[companionId]);
  answer=await run('/api/v1/admin/npcs?category=hazards');
  assert.deepEqual(answer.data.characters,[]);
  await assert.rejects(run('/api/v1/admin/npcs?category=invalid'),/Invalid NPC chapter/);
 }finally{db.close();}
});

test('NPC directory uses category-aware search and progress; no automatic QNAP import code runs on module load',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../src/ui/npc-directory.mjs',import.meta.url),'utf8');
 const api=await readFile(new URL('../backend/characters/npcs.mjs',import.meta.url),'utf8');
 assert.match(html,/data-npc-chapter="bestiary"/);
 assert.match(html,/data-npc-chapter="npc-codex"/);
 assert.match(html,/data-npc-chapter="companions"/);
 assert.match(html,/data-npc-chapter="hazards" disabled/);
 assert.match(html,/document.createElement\('progress'\)/);
 assert.match(html,/GitHub staged/);
 assert.match(html,/Cosmos imported/);
 assert.match(api,/kingmakerProgress\(imported\)/);
 assert.match(api,/body.category\|\|'npc-codex'/);
});
