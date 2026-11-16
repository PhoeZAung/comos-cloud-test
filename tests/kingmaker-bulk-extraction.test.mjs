import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {KINGMAKER_STAGED_ENTRIES,kingmakerNpcData,kingmakerProgress,KINGMAKER_BOOK_ID} from '../src/data/kingmaker/catalog.mjs';
import {KINGMAKER_BESTIARY_AUTO_002} from '../src/data/kingmaker/bestiary-auto-batch-002.mjs';
import {KINGMAKER_NPC_CODEX_AUTO_001} from '../src/data/kingmaker/npc-codex-auto-batch-001.mjs';
import {KINGMAKER_COMPANIONS_AUTO_001} from '../src/data/kingmaker/companions-auto-batch-001.mjs';
import {extractKingmakerChapter} from '../scripts/kingmaker-extract-layout.mjs';
import {planKingmakerImport,applyKingmakerImport} from '../scripts/import-kingmaker.mjs';

test('all source chapter heading counts are covered without double-importing the first 10',()=>{
 assert.deepEqual([KINGMAKER_BESTIARY_AUTO_002.length,KINGMAKER_NPC_CODEX_AUTO_001.length,KINGMAKER_COMPANIONS_AUTO_001.length],[95,105,7]);
 assert.equal(KINGMAKER_STAGED_ENTRIES.length,217);
 const keys=KINGMAKER_STAGED_ENTRIES.map(e=>e.chapter+':'+e.slug);
 assert.equal(new Set(keys).size,217);
 assert.deepEqual(kingmakerProgress({}).map(p=>p.staged),[105,105,0,7]);
 assert.deepEqual(kingmakerProgress({}).map(p=>p.reviewed),[10,0,0,0]);
 assert.ok(KINGMAKER_COMPANIONS_AUTO_001.every(e=>e.variants?.length===2));
 assert.equal(KINGMAKER_COMPANIONS_AUTO_001.flatMap(e=>e.variants).length,14);
});
test('automatic records retain source pages and honest review flags; known unknowns stay null',()=>{
 for(const entry of KINGMAKER_STAGED_ENTRIES){
  assert.equal(entry.source,'Pathfinder Kingmaker Bestiary (First Edition)');
  assert.ok(Number.isInteger(entry.pdfPage)&&entry.pdfPage>=10&&entry.pdfPage<=152,entry.name);
  assert.equal(entry.pdfPage,entry.printedPage+1,entry.name);
  assert.ok(entry.name&&entry.slug);
  assert.ok(entry.verified==='automated-needs-review'||entry.verified==='transcribed-from-PDF');
  assert.ok(Array.isArray(entry.weapons)&&Array.isArray(entry.npcSkills));
  const data=kingmakerNpcData(entry);
  assert.equal(data.npcImportSource,KINGMAKER_BOOK_ID);
  assert.equal(data.npcCategory,entry.chapter);
  assert.equal(data.npcImportKey,entry.slug);
  assert.equal(data.npcStats.sourcePage,entry.printedPage);
  assert.equal(data.hp_curr,entry.hp??null);
  assert.equal(data.npcVerified,entry.verified==='transcribed-from-PDF');
  assert.deepEqual(data.npcVariants,entry.variants||[]);
  if(entry.verified==='automated-needs-review')assert.equal(data.npcVerified,false);
 }
 const frog=KINGMAKER_STAGED_ENTRIES.find(e=>e.name==='Giant Frog Companion');
 assert.equal(frog.hp,26);
 assert.equal(frog.stats.cr,undefined,'unranked CR remains null, not zero');
 assert.equal(kingmakerNpcData(frog).npcStats.cr,null);
});
test('layout-aware parser separates both columns, repairs split CR headings and keeps cross-page stat data',()=>{
 const left='OVERGROWN VIPER VINE                                         CR 14      WEMMUTH                                                 CR 15';
 const second='ANCIENT WILL-O’-WISP                                       CR 10    Fort +19, Ref +14, Will +16';
 const pages=[{page:63,text:[left,'XP 38,400                                                               XP 51,200','AC 22, touch 11, flat-footed 21                                     AC 30, touch 15, flat-footed 23','hp 160 (15d8+90)                                                    hp 200 (17d10+85)'].join('\n')},{page:65,text:[second,'XP 9,600','AC 23, touch 18, flat-footed 17','hp 100 (12d8+48)'].join('\n')}];
 const records=extractKingmakerChapter(pages,'bestiary');
 assert.equal(records.length,3);
 assert.deepEqual(records.map(e=>e.name),['Overgrown Viper Vine','Wemmuth','Ancient Will-O’-Wisp']);
 assert.deepEqual(records.map(e=>e.stats.cr),[14,15,10]);
 assert.deepEqual(records.map(e=>e.pdfPage),[63,63,65]);
});
test('dry-run never writes; applied import is explicitly authorized, idempotent and preserves existing characters',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'Kingmaker GM'});
  const before=db.prepare('SELECT COUNT(*) AS n FROM characters').get().n;
  const plan=planKingmakerImport(db,owner.id);
  assert.equal(plan.create.length,217);
  assert.equal(plan.unreviewed,207);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,before);
  assert.throws(()=>applyKingmakerImport(db,owner.id),/unreviewed NPCs/);
  const applied=applyKingmakerImport(db,owner.id,{allowNeedsReview:true});
  assert.equal(applied.created,217);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM characters WHERE kind='npc'").get().n,217);
  assert.deepEqual(kingmakerProgress(Object.fromEntries(db.prepare(`SELECT json_extract(d.data_json,'$.npcCategory') AS category,COUNT(*) AS n FROM characters c JOIN character_details d ON d.character_id=c.id GROUP BY category`).all().map(x=>[x.category,x.n]))).map(p=>p.imported),[105,105,0,7]);
  assert.equal(planKingmakerImport(db,owner.id).create.length,0);
  assert.equal(applyKingmakerImport(db,owner.id).created,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,before+217);
 }finally{db.close();}
});
