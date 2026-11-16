// Explicit, idempotent Kingmaker NPC import. NEVER runs during app startup or deploy.
// Preview verified Bestiary only: node scripts/import-kingmaker.mjs --db /data/comos.sqlite --owner USER_ID --chapter bestiary
// Final import: add --apply --confirm-kingmaker (backup is mandatory); never bypass review for Bestiary.
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {backup} from 'node:sqlite';
import {pathToFileURL} from 'node:url';
import {openDatabase} from '../backend/db/database.mjs';
import {KINGMAKER_BOOK_ID,KINGMAKER_STAGED_ENTRIES,kingmakerNpcData} from '../src/data/kingmaker/catalog.mjs';

function stableId(ownerId,chapter,key){
 const hex=createHash('sha256').update(['kingmaker',KINGMAKER_BOOK_ID,ownerId,chapter,key].join('|')).digest('hex');
 return hex.slice(0,8)+'-'+hex.slice(8,12)+'-4'+hex.slice(13,16)+'-a'+hex.slice(17,20)+'-'+hex.slice(20,32);
}
export function selectKingmakerEntries(chapter,entries=KINGMAKER_STAGED_ENTRIES){
 if(chapter==null)return entries;
 if(!['bestiary','npc-codex','companions'].includes(chapter))
  throw Error('Invalid Kingmaker chapter. Choose bestiary, npc-codex, or companions.');
 return entries.filter(entry=>entry.chapter===chapter);
}
export function planKingmakerImport(db,ownerId,{entries=KINGMAKER_STAGED_ENTRIES,renameImportConflicts=false}={}){
 if(!ownerId||!db.prepare('SELECT 1 FROM users WHERE id=? AND deleted_at IS NULL').get(ownerId))throw Error('Supply a valid Cosmos user ID for the NPC owner.');
 const own=db.prepare(`SELECT c.id,c.name,c.archived,d.data_json AS data FROM characters c
 JOIN character_details d ON d.character_id=c.id
 WHERE c.owner_id=? AND c.kind='npc'`).all(ownerId);
 const imported=new Set(),manual=new Set(),occupiedNames=new Set();
 for(const row of own){
  const data=JSON.parse(row.data);
  if(!row.archived)occupiedNames.add(row.name.toLocaleLowerCase('en-US'));
  if(data.npcImportSource===KINGMAKER_BOOK_ID&&data.npcImportKey)
   imported.add((data.npcCategory||'npc-codex')+':'+data.npcImportKey);
  else if(!row.archived)manual.add(row.name.toLowerCase());
 }
 const create=[],skipped=[],conflicts=[],renamed=[];
 for(const entry of entries){
  const key=entry.chapter+':'+entry.slug;
  if(imported.has(key)){skipped.push(key);continue;}
  let name=entry.name;
  if(manual.has(entry.name.toLocaleLowerCase('en-US'))){
   if(!renameImportConflicts){
    conflicts.push({key,reason:'An existing manually managed NPC has this name.'});
    continue;
   }
   // The existing/manual NPC is never modified. Only the *new* Kingmaker
   // display name receives a visible suffix; its stable import key remains
   // chapter+slug, so repeat imports stay idempotent.
   name=entry.name+' (Bestiary)';
   if(name.length>80||occupiedNames.has(name.toLocaleLowerCase('en-US'))){
    conflicts.push({key,reason:'The proposed Bestiary display name is too long or already exists.'});
    continue;
   }
   renamed.push({key,from:entry.name,to:name});
  }
  const id=stableId(ownerId,entry.chapter,entry.slug);
  const data=kingmakerNpcData(entry);
  data.charName=name;
  if(Buffer.byteLength(JSON.stringify(data))>230000)throw Error('Oversized Kingmaker entry: '+key);
  if(db.prepare('SELECT 1 FROM characters WHERE id=?').get(id))throw Error('Deterministic ID collision for '+key);
  create.push({id,name,chapter:entry.chapter,slug:entry.slug,data,
   reviewed:entry.verified==='transcribed-from-PDF',reviewFlags:entry.reviewFlags||[]});
 }
 return {create,skipped,conflicts,renamed,unreviewed:create.filter(entry=>!entry.reviewed).length};
}
export function applyKingmakerImport(db,ownerId,{allowNeedsReview=false,entries=KINGMAKER_STAGED_ENTRIES,renameImportConflicts=false}={}){
 const plan=planKingmakerImport(db,ownerId,{entries,renameImportConflicts});
 if(plan.conflicts.length)throw Error('Resolve '+plan.conflicts.length+' naming conflict(s) before importing.');
 if(plan.unreviewed&&!allowNeedsReview)throw Error('Refusing to import '+plan.unreviewed+' unreviewed NPCs without explicit allowNeedsReview.');
 const now=new Date().toISOString();
 db.exec('BEGIN IMMEDIATE');
 try{
  const insertCharacter=db.prepare("INSERT INTO characters(id,owner_id,name,created_at,updated_at,kind) VALUES(?,?,?,?,?,'npc')");
  const insertDetails=db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)');
  for(const entry of plan.create){
   insertCharacter.run(entry.id,ownerId,entry.name,now,now);
   insertDetails.run(entry.id,JSON.stringify(entry.data));
  }
  db.exec('COMMIT');
  return {created:plan.create.length,skipped:plan.skipped.length,unreviewed:plan.unreviewed};
 }catch(err){db.exec('ROLLBACK');throw err;}
}
async function cli(){
 const args=process.argv.slice(2);
 const opt=name=>{const index=args.indexOf(name);return index>=0?args[index+1]:null;};
 const dbPath=opt('--db'),owner=opt('--owner'),chapter=opt('--chapter'),apply=args.includes('--apply'),allowNeedsReview=args.includes('--allow-needs-review'),renameImportConflicts=args.includes('--rename-import-conflicts');
 if(args.includes('--chapter')&&!chapter)throw Error('Provide a value after --chapter.');
 const selected=selectKingmakerEntries(chapter);
 if(!dbPath||!owner||!existsSync(dbPath))throw Error('Usage: node scripts/import-kingmaker.mjs --db EXISTING_DB --owner USER_ID [--apply --allow-needs-review]');
 if(apply&&!args.includes('--confirm-kingmaker'))throw Error('Use --confirm-kingmaker to explicitly authorize the final database changes.');
 const db=await openDatabase(dbPath);
 try{
  const plan=planKingmakerImport(db,owner,{entries:selected,renameImportConflicts});
  console.log(JSON.stringify({mode:apply?'apply':'dry-run',chapter:chapter||'all',toCreate:plan.create.length,alreadyImported:plan.skipped.length,
   existingNameConflicts:plan.conflicts,renamedNewEntries:plan.renamed,unreviewed:plan.unreviewed,
   byChapter:Object.fromEntries(['bestiary','npc-codex','companions'].map(k=>[k,plan.create.filter(e=>e.chapter===k).length]))},null,2));
  if(!apply)return;
  if(plan.conflicts.length)throw Error('Resolve manual NPC naming conflicts first; nothing imported.');
  if(plan.unreviewed&&!allowNeedsReview)throw Error('Source review incomplete: pass --allow-needs-review after approval.');
  const safeStamp=new Date().toISOString().replace(/[^0-9TZ]/g,'');
  const dest=dbPath+'.before-kingmaker-'+safeStamp+'.sqlite';
  await backup(db,dest);
  console.log('SQLite backup saved: '+dest);
  console.log('Import result:',JSON.stringify(applyKingmakerImport(db,owner,{allowNeedsReview,entries:selected,renameImportConflicts})));
 }finally{db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 cli().catch(error=>{console.error(error.message);process.exitCode=1;});
}
