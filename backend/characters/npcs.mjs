import {createHash} from 'node:crypto';
import {adminJson} from '../auth/admin-requests.mjs';
import {parseNpcStatBlock} from '../../src/features/characters/npc-stat-block.mjs';
import {kingmakerProgress,KINGMAKER_BOOK_ID} from '../../src/data/kingmaker/catalog.mjs';

export const npcDirectoryPath='/api/v1/admin/npcs';
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

export async function npcDirectory({req,url,db,ownerId,send}){
 if(req.method==='GET'){
  const cursor=url.searchParams.get('cursor')||'',query=(url.searchParams.get('q')||'').slice(0,80);
  const category=url.searchParams.get('category')||'npc-codex';
  if(cursor&&!uuid.test(cursor))throw Error('Invalid NPC cursor.');
  if(!['bestiary','npc-codex','companions','hazards'].includes(category))throw Error('Invalid NPC chapter.');
  // Older manually created NPCs stay in NPC Codex, never disappear.
  const categoryExpr="CASE WHEN json_extract(d.data_json,'$.npcCategory') IN ('bestiary','companions') THEN json_extract(d.data_json,'$.npcCategory') ELSE 'npc-codex' END";
  const rows=category==='hazards'?[]:db.prepare(`SELECT c.id,c.name FROM characters c
   JOIN character_details d ON d.character_id=c.id
   WHERE c.kind='npc' AND c.archived=0 AND c.id>? AND instr(lower(c.name),lower(?))>0
   AND ${categoryExpr}=?
   ORDER BY c.id LIMIT 41`).all(cursor,query,category);
  const importedRows=db.prepare(`SELECT json_extract(d.data_json,'$.npcCategory') AS category,COUNT(*) AS count
   FROM characters c JOIN character_details d ON d.character_id=c.id
   WHERE c.kind='npc' AND c.archived=0
   AND json_extract(d.data_json,'$.npcImportSource')=?
   GROUP BY json_extract(d.data_json,'$.npcCategory')`).all(KINGMAKER_BOOK_ID);
  const imported=Object.fromEntries(importedRows.map(row=>[row.category,row.count]));
  send(200,{category,characters:rows.slice(0,40).map(row=>({...row,kind:'npc',category})),
   nextCursor:rows.length>40?rows[39].id:null,
   progress:kingmakerProgress(imported)});
  return;
 }

 const body=await adminJson(req,300000);
 if(!body||Object.keys(body).some(key=>!['name','markdown','requestId','category'].includes(key))||
   typeof body.name!=='string'||typeof body.markdown!=='string'||!uuid.test(body.requestId||'')||
   !['bestiary','npc-codex','companions'].includes(body.category||'npc-codex'))throw Error('Invalid NPC request.');
 const parsed=parseNpcStatBlock(body.markdown),name=body.name.trim()||parsed.name;
 if(!name||name.length>80||/[\u0000-\u001f\u007f]/u.test(name))throw Error('Enter an NPC name of 1–80 characters.');
 const digest=createHash('sha256').update(JSON.stringify([name,body.markdown])).digest('hex');
 const hex=createHash('sha256').update('npc|'+ownerId+'|'+body.requestId).digest('hex');
 const id=`${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
 const data={...parsed.data,charName:name,npcImportDigest:digest,npcCategory:body.category||'npc-codex'};
 if(Buffer.byteLength(JSON.stringify(data))>230000)throw Error('NPC stat block is too large.');
 const now=new Date().toISOString();
 db.exec('BEGIN IMMEDIATE');
 try{
  const existing=db.prepare(`SELECT c.id,c.name,c.archived,json_extract(d.data_json,'$.npcImportDigest') AS digest
   FROM characters c JOIN character_details d ON d.character_id=c.id
   WHERE c.id=? AND c.kind='npc' AND c.owner_id=?`).get(id,ownerId);
  if(existing){
   if(existing.archived||existing.digest!==digest)throw Error('This save request was already used. Start another NPC.');
  }else{
   db.prepare("INSERT INTO characters(id,owner_id,name,created_at,updated_at,kind) VALUES(?,?,?,?,?,'npc')").run(id,ownerId,name,now,now);
   db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,JSON.stringify(data));
  }
  db.exec('COMMIT');
  send(existing?200:201,{character:{id,name:existing?.name||name,kind:'npc'}});
 }catch(error){db.exec('ROLLBACK');throw error;}
}
