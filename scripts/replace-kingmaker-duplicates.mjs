// One-time Kingmaker cleanup: remove ONLY the five obsolete handmade duplicates.
// Run dry-run first. --apply requires explicit confirmation and a full SQLite backup.
// Never run automatically at startup, during deployment, or during imports.
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
const q=value=>'"'+String(value).replaceAll('"','""')+'"';
const lower=value=>String(value).toLocaleLowerCase('en-US');

function referencingTables(db){
 const refs=[];
 for(const {name} of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()){
  for(const fk of db.prepare('PRAGMA foreign_key_list('+q(name)+')').all()){
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
  if(!entry||entry.verified!=='transcribed-from-PDF')throw Error('Reviewed Kingmaker entry is missing: '+chapter+':'+slug);
  const manual=parsed.filter(row=>lower(row.name)===lower(entry.name)&&
   !(row.data.npcImportSource===KINGMAKER_BOOK_ID&&row.data.npcImportKey));
  if(manual.length>1)throw Error('Multiple handmade NPCs named '+entry.name+'; stop for manual inspection.');
  const imported=parsed.filter(row=>row.data.npcImportSource===KINGMAKER_BOOK_ID&&
   row.data.npcCategory===chapter&&row.data.npcImportKey===slug);
  if(imported.length>1)throw Error('Multiple reviewed imports found for '+entry.name);
  if(chapter==='bestiary'&&!imported.length)
   throw Error('Refusing to remove handmade '+entry.name+': reviewed Bestiary replacement is not imported.');
  if(imported.length&&!([entry.name,entry.name+' (Bestiary)'].includes(imported[0].name)))
   throw Error('Imported '+entry.name+' has unexpected name '+imported[0].name+'; inspect manually.');
  return {chapter,slug,name:entry.name,manual:manual[0]||null,
   rename:imported.length&&imported[0].name!==entry.name?imported[0]:null};
 });
 const toDelete=targets.filter(t=>t.manual).map(t=>({id:t.manual.id,name:t.manual.name,chapter:t.chapter}));
 const toRename=targets.filter(t=>t.rename).map(t=>({id:t.rename.id,from:t.rename.name,to:t.name,chapter:t.chapter}));
 const linkedReferences=[];
 for(const ref of referencingTables(db)){
  const statement=db.prepare('SELECT count(*) AS n FROM '+q(ref.table)+' WHERE '+q(ref.column)+'=?');
  for(const item of toDelete){
   const count=statement.get(item.id).n;
   if(count)linkedReferences.push({...ref,npc:item.name,count});
  }
 }
 return {toDelete,toRename,linkedReferences};
}

export function replaceKingmakerDuplicates(db,ownerId){
 db.exec('BEGIN IMMEDIATE');
 try{
  const plan=planKingmakerDuplicateCleanup(db,ownerId);
  if(plan.linkedReferences.length)throw Error('Old NPCs are referenced by other data: '+JSON.stringify(plan.linkedReferences));
  for(const item of plan.toDelete){
   const result=db.prepare("DELETE FROM characters WHERE id=? AND owner_id=? AND kind='npc'").run(item.id,ownerId);
   if(result.changes!==1)throw Error('Failed to delete old NPC '+item.name);
  }
  for(const item of plan.toRename){
   const row=db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(item.id);
   if(!row)throw Error('Missing imported NPC details for '+item.from);
   const data=JSON.parse(row.data_json);
   if(data.npcImportSource!==KINGMAKER_BOOK_ID)throw Error('Refusing to rename a handmade NPC.');
   data.charName=item.to;
   db.prepare("UPDATE characters SET name=?,updated_at=? WHERE id=? AND owner_id=? AND kind='npc'")
    .run(item.to,new Date().toISOString(),item.id,ownerId);
   db.prepare('UPDATE character_details SET data_json=? WHERE character_id=?')
    .run(JSON.stringify(data),item.id);
  }
  const importPlan=planKingmakerImport(db,ownerId);
  if(importPlan.conflicts.length)throw Error('Unresolved Kingmaker naming conflicts: '+JSON.stringify(importPlan.conflicts));
  db.exec('COMMIT');
  return {deleted:plan.toDelete.map(({name})=>name),renamed:plan.toRename.map(({from,to})=>({from,to})),
   readyToImport:{npcCodex:importPlan.create.filter(x=>x.chapter==='npc-codex').length,
    companions:importPlan.create.filter(x=>x.chapter==='companions').length}};
 }catch(error){db.exec('ROLLBACK');throw error;}
}

async function main(){
 const args=process.argv.slice(2),value=flag=>args[args.indexOf(flag)+1];
 const dbPath=value('--db'),owner=value('--owner'),apply=args.includes('--apply');
 if(!dbPath||!owner||!existsSync(dbPath))throw Error('Usage: node scripts/replace-kingmaker-duplicates.mjs --db EXISTING_DB --owner USER_ID [--apply --confirm-delete-manual-npcs]');
 if(apply&&!args.includes('--confirm-delete-manual-npcs'))throw Error('Explicit --confirm-delete-manual-npcs required.');
 const db=await openDatabase(dbPath);
 try{
  const preview=planKingmakerDuplicateCleanup(db,owner);
  console.log(JSON.stringify({mode:apply?'apply':'dry-run',...preview},null,2));
  if(!apply)return;
  if(preview.linkedReferences.length)throw Error('Old NPCs have linked data. Nothing deleted; inspect references before proceeding.');
  const stamp=new Date().toISOString().replace(/[^0-9TZ]/g,'');
  const backupPath=dbPath+'.before-kingmaker-duplicate-cleanup-'+stamp+'.sqlite';
  await backup(db,backupPath);
  console.log('SQLite backup saved: '+backupPath);
  console.log('Cleanup result:',JSON.stringify(replaceKingmakerDuplicates(db,owner)));
 }finally{db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main().catch(err=>{console.error(err.message);process.exitCode=1;});
