import {createHash} from 'node:crypto';
import {adminJson} from '../auth/admin-requests.mjs';
import {parseNpcStatBlock} from '../../src/features/characters/npc-stat-block.mjs';

export const npcDirectoryPath='/api/v1/admin/npcs';
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

export async function npcDirectory({req,url,db,ownerId,send}){
 if(req.method==='GET'){
  const cursor=url.searchParams.get('cursor')||'',query=(url.searchParams.get('q')||'').slice(0,80);
  if(cursor&&!uuid.test(cursor))throw Error('Invalid NPC cursor.');
  const rows=db.prepare(`SELECT id,name FROM characters
   WHERE kind='npc' AND archived=0 AND id>? AND instr(lower(name),lower(?))>0
   ORDER BY id LIMIT 41`).all(cursor,query);
  send(200,{characters:rows.slice(0,40).map(row=>({...row,kind:'npc'})),nextCursor:rows.length>40?rows[39].id:null});
  return;
 }

 const body=await adminJson(req,300000);
 if(!body||Object.keys(body).some(key=>!['name','markdown','requestId'].includes(key))||
   typeof body.name!=='string'||typeof body.markdown!=='string'||!uuid.test(body.requestId||''))throw Error('Invalid NPC request.');
 const parsed=parseNpcStatBlock(body.markdown),name=body.name.trim()||parsed.name;
 if(!name||name.length>80||/[\u0000-\u001f\u007f]/u.test(name))throw Error('Enter an NPC name of 1–80 characters.');
 const digest=createHash('sha256').update(JSON.stringify([name,body.markdown])).digest('hex');
 const hex=createHash('sha256').update('npc|'+ownerId+'|'+body.requestId).digest('hex');
 const id=`${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
 const data={...parsed.data,charName:name,npcImportDigest:digest};
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
