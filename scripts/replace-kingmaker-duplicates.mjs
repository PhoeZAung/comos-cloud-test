// One-time, owner-scoped Kingmaker cleanup for five named handmade duplicates.
// Replaces missing NPCs, transfers their saved sheet-roll history, removes the
// old copies, and restores original names in ONE atomic transaction.
// Preview first; --apply requires explicit confirmation and a SQLite backup.
// NEVER runs at startup, deployment, or routine Kingmaker import.
import {existsSync} from 'node:fs';
import {backup} from 'node:sqlite';
import {pathToFileURL} from 'node:url';
import {openDatabase} from '../backend/db/database.mjs';
import {KINGMAKER_BOOK_ID,KINGMAKER_STAGED_ENTRIES} from '../src/data/kingmaker/catalog.mjs';
import {planKingmakerImport} from './import-kingmaker.mjs';

const KEYS=Object.freeze([
 ['bestiary','black-tear-cutthroat'],
 ['npc-codex','gromog'],
 ['npc-codex','nishkiv-the-knife'],
 ['npc-codex','volodmyra'],
 ['companions','linzi']
]);
const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
const lower=value=>String(value).toLocaleLowerCase('en-US');
const keyOf=(chapter,slug)=>chapter+':'+slug;

function referencingTables(db){
 const refs=[];
 for(const {name} of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()){
  for(const fk of db.prepare('PRAGMA foreign_key_list('+quote(name)+')').all()){
   if(fk.table==='characters'&&fk.to==='id'&&name!=='character_details')
    refs.push({table:name,column:fk.from});
  }
 }
 return refs;
}

export function planKingmakerDuplicateCleanup(db,ownerId){
 if(!ownerId||!db.prepare('SELECT 1 FROM users WHERE id=? AND deleted_at IS NULL').get(ownerId))
  throw Error('Supply the valid Cosmos owner ID.');
 const rows=db.prepare(`SELECT c.id,c.name,c.archived,d.data_json AS data FROM characters c
  JOIN character_details d ON d.character_id=c.id
  WHERE c.owner_id=? AND c.kind='npc'`).all(ownerId);
 const parsed=rows.map(row=>({...row,data:JSON.parse(row.data)}));
 const targets=KEYS.map(([chapter,slug])=>{
  const entry=KINGMAKER_STAGED_ENTRIES.find(e=>e.chapter===chapter&&e.slug===slug);
  if(!entry||entry.verified!=='transcribed-from-PDF'||entry.reviewFlags?.length)
   throw Error('Reviewed Kingmaker entry is missing or incomplete: '+keyOf(chapter,slug));
  const manual=parsed.filter(row=>lower(row.name)===lower(entry.name)&&
   !(row.data.npcImportSource===KINGMAKER_BOOK_ID&&row.data.npcImportKey));
  if(manual.length>1)throw Error('Multiple handmade NPCs named '+entry.name+'; stop for manual inspection.');
  const imported=parsed.filter(row=>row.data.npcImportSource===KINGMAKER_BOOK_ID&&
   row.data.npcCategory===chapter&&row.data.npcImportKey===slug);
  if(imported.length>1)throw Error('Multiple reviewed imports found for '+entry.name);
  if(imported.length&&imported[0].archived)
   throw Error('Reviewed Kingmaker NPC is archived: '+entry.name+'; inspect manually.');
  if(imported.length&&![entry.name,entry.name+' (Bestiary)'].includes(imported[0].name))
   throw Error('Imported '+entry.name+' has unexpected name '+imported[0].name+'; inspect manually.');
  return {chapter,slug,name:entry.name,entry,manual:manual[0]||null,
   imported:imported[0]||null};
 });
 const absent=targets.filter(t=>!t.imported).map(t=>t.entry);
 const incoming=planKingmakerImport(db,ownerId,{entries:absent,renameImportConflicts:true});
 if(incoming.conflicts.length||incoming.unreviewed||incoming.create.length!==absent.length)
  throw Error('Cannot safely prepare all reviewed replacement NPCs: '+JSON.stringify(incoming.conflicts));
 const toCreate=incoming.create.map(x=>({id:x.id,name:x.name,chapter:x.chapter,slug:x.slug}));
 const incomingByKey=new Map(incoming.create.map(x=>[keyOf(x.chapter,x.slug),x]));
 for(const target of targets){
  target.replacement=target.imported||incomingByKey.get(keyOf(target.chapter,target.slug));
  if(!target.replacement||target.replacement.id===target.manual?.id)
   throw Error('Missing or invalid reviewed replacement for '+target.name);
 }
 const toDelete=targets.filter(t=>t.manual).map(t=>({id:t.manual.id,name:t.name,chapter:t.chapter}));
 const toRename=targets.filter(t=>t.replacement.name!==t.name)
  .map(t=>({id:t.replacement.id,from:t.replacement.name,to:t.name,chapter:t.chapter,slug:t.slug}));
 const linkedReferences=[],rollTransfers=[],blockingReferences=[];
 for(const ref of referencingTables(db)){
  const countStatement=db.prepare('SELECT count(*) AS n FROM '+quote(ref.table)+' WHERE '+quote(ref.column)+'=?');
  for(const target of targets){
   if(!target.manual)continue;
   const count=countStatement.get(target.manual.id).n;
   if(!count)continue;
   const approved=ref.table==='sheet_rolls'&&ref.column==='character_id';
   const record={table:ref.table,column:ref.column,npc:target.name,count,
    oldId:target.manual.id,replacementId:target.replacement.id};
   linkedReferences.push({...record,action:approved?'transfer':'block'});
   if(approved)rollTransfers.push(record);
   else blockingReferences.push(record);
  }
 }
 return {toDelete,toCreate,toRename,linkedReferences,rollTransfers,blockingReferences};
}

export function replaceKingmakerDuplicates(db,ownerId){
 db.exec('BEGIN IMMEDIATE');
 try{
  // Replan inside the write lock: no race between preview and deletion.
  const plan=planKingmakerDuplicateCleanup(db,ownerId);
  if(plan.blockingReferences.length)
   throw Error('Old NPCs are referenced by other data: '+JSON.stringify(plan.blockingReferences));
  const now=new Date().toISOString();
  const insertCharacter=db.prepare("INSERT INTO characters(id,owner_id,name,created_at,updated_at,kind) VALUES(?,?,?,?,?,'npc')");
  const insertDetails=db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)');
  // Use the existing import adapter, deterministic IDs and reviewed stats.
  const absent=plan.toCreate.map(x=>KINGMAKER_STAGED_ENTRIES.find(e=>e.chapter===x.chapter&&e.slug===x.slug));
  const staged=planKingmakerImport(db,ownerId,{entries:absent,renameImportConflicts:true});
  if(staged.conflicts.length||staged.unreviewed||staged.create.length!==plan.toCreate.length)
   throw Error('Reviewed replacement import changed during cleanup.');
  for(const entry of staged.create){
   insertCharacter.run(entry.id,ownerId,entry.name,now,now);
   insertDetails.run(entry.id,JSON.stringify(entry.data));
  }
  // Roll rows retain all original columns and IDs; only their linked NPC changes.
  const reassignRoll=db.prepare('UPDATE sheet_rolls SET character_id=? WHERE character_id=?');
  let rollsMoved=0;
  for(const roll of plan.rollTransfers){
   const result=reassignRoll.run(roll.replacementId,roll.oldId);
   if(result.changes!==roll.count)
    throw Error('Roll transfer count changed for '+roll.npc+'; rollback.');
   rollsMoved+=result.changes;
  }
  // After roll remapping, delete exactly the five selected obsolete rows.
  for(const item of plan.toDelete){
   const result=db.prepare("DELETE FROM characters WHERE id=? AND owner_id=? AND kind='npc'").run(item.id,ownerId);
   if(result.changes!==1)throw Error('Failed to delete old NPC '+item.name);
  }
  for(const item of plan.toRename){
   const row=db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(item.id);
   if(!row)throw Error('Missing reviewed NPC details for '+item.from);
   const data=JSON.parse(row.data_json);
   if(data.npcImportSource!==KINGMAKER_BOOK_ID||data.npcImportKey!==item.slug||data.npcCategory!==item.chapter)
    throw Error('Refusing to rename unrecognized NPC '+item.from);
   data.charName=item.to;
   const result=db.prepare("UPDATE characters SET name=?,updated_at=? WHERE id=? AND owner_id=? AND kind='npc'")
    .run(item.to,now,item.id,ownerId);
   if(result.changes!==1)throw Error('Failed to rename '+item.from);
   db.prepare('UPDATE character_details SET data_json=? WHERE character_id=?')
    .run(JSON.stringify(data),item.id);
  }
  const importPlan=planKingmakerImport(db,ownerId);
  if(importPlan.conflicts.length)throw Error('Unresolved Kingmaker naming conflicts: '+JSON.stringify(importPlan.conflicts));
  const violations=db.prepare('PRAGMA foreign_key_check').all();
  if(violations.length)throw Error('Foreign-key check failed after cleanup; rollback: '+JSON.stringify(violations.slice(0,5)));
  db.exec('COMMIT');
  return {createdReviewed:plan.toCreate.map(({name,chapter})=>({name,chapter})),
   transferredRolls:rollsMoved,deleted:plan.toDelete.map(({name})=>name),
   renamed:plan.toRename.map(({from,to})=>({from,to})),
   readyToImport:{npcCodex:importPlan.create.filter(x=>x.chapter==='npc-codex').length,
    companions:importPlan.create.filter(x=>x.chapter==='companions').length}};
 }catch(error){db.exec('ROLLBACK');throw error;}
}

async function main(){
 const args=process.argv.slice(2),value=flag=>args.indexOf(flag)>=0?args[args.indexOf(flag)+1]:null;
 const dbPath=value('--db'),owner=value('--owner'),apply=args.includes('--apply');
 if(!dbPath||!owner||!existsSync(dbPath))
  throw Error('Usage: node scripts/replace-kingmaker-duplicates.mjs --db EXISTING_DB --owner USER_ID [--apply --confirm-delete-manual-npcs]');
 if(apply&&!args.includes('--confirm-delete-manual-npcs'))
  throw Error('Explicit --confirm-delete-manual-npcs required.');
 const db=await openDatabase(dbPath);
 try{
  const preview=planKingmakerDuplicateCleanup(db,owner);
  console.log(JSON.stringify({mode:apply?'apply':'dry-run',...preview},null,2));
  if(!apply)return;
  if(preview.blockingReferences.length)
   throw Error('Old NPCs still have unsupported linked data. Nothing deleted.');
  const stamp=new Date().toISOString().replace(/[^0-9TZ]/g,'');
  const backupPath=dbPath+'.before-kingmaker-duplicate-cleanup-'+stamp+'.sqlite';
  await backup(db,backupPath);
  console.log('SQLite backup saved: '+backupPath);
  console.log('Cleanup result:',JSON.stringify(replaceKingmakerDuplicates(db,owner)));
 }finally{db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main().catch(err=>{console.error(err.message);process.exitCode=1;});
