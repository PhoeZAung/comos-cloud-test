import {randomUUID} from 'node:crypto';
import {adminSession,adminJson} from '../auth/admin-requests.mjs';
import {mergeSheetData} from './sheet-fields.mjs';
import {mergeWizardData} from './editor-fields.mjs';
import {LORE_ADMIN_TAG_ID} from '../lore/access.mjs';
export function createDirectoryRoutes({db,sessions,adminUids,origin}){
 const admins=new Set(adminUids);
 const tags=()=>db.prepare('SELECT * FROM character_tags ORDER BY name,id').all();
 return async(req,res,path,send)=>{
  const recordPath='/api/v1/character-records/',isRecord=path.startsWith(recordPath);
  if(!['/api/v1/admin/directory','/api/v1/admin/tags'].includes(path)&&!isRecord)return false;
  if(!['GET','POST'].includes(req.method)){send(405,{error:'method_not_allowed'});return true;}
  if(req.method==='POST'&&req.headers.origin!==origin){send(403,{error:'origin_not_allowed'});return true;}
  try{
   const session=await adminSession(req,sessions,admins);if(!session){send(401,{error:'sign_in_required'});return true;}
   const url=new URL(req.url,origin);
   if(!isRecord&&!session.admin){send(403,{error:'admin_required'});return true;}
   if(path.endsWith('/directory')){
    if(req.method!=='GET'){send(405,{error:'method_not_allowed'});return true;}
    const q=(url.searchParams.get('q')||'').slice(0,80),cursor=(url.searchParams.get('cursor')||'').slice(0,128),ownerId=url.searchParams.get('ownerId');
    if(ownerId){const rows=db.prepare('SELECT id,name,revision FROM characters WHERE owner_id=? AND archived=0 AND id>? ORDER BY id LIMIT 21').all(ownerId,cursor);send(200,{characters:rows.slice(0,20).map(c=>({...c,tags:db.prepare('SELECT t.* FROM character_tags t JOIN character_tag_links l ON l.tag_id=t.id WHERE l.character_id=?').all(c.id)})),nextCursor:rows.length>20?rows[19].id:null});}
    else{const rows=db.prepare("SELECT u.id,u.display_name AS displayName,(SELECT count(*) FROM characters c WHERE c.owner_id=u.id AND c.archived=0) AS characterCount FROM users u WHERE u.id>? AND (instr(lower(u.display_name),lower(?))>0 OR EXISTS(SELECT 1 FROM characters c WHERE c.owner_id=u.id AND instr(lower(c.name),lower(?))>0)) ORDER BY u.id LIMIT 51").all(cursor,q,q);send(200,{users:rows.slice(0,50),nextCursor:rows.length>50?rows[49].id:null});}return true;
   }
   if(path.endsWith('/tags')){
    if(req.method==='POST'){const data=await adminJson(req);if(typeof data.name!=='string'||!data.name.trim()||data.name.length>80||/[\u0000-\u001f]/.test(data.name))throw Error('Use a tag name of 1–80 characters.');if(data.id){
      if(data.id===LORE_ADMIN_TAG_ID)throw Error('The Admin tag is reserved and cannot be renamed.');
      if(data.name.trim().toLowerCase()==='admin')throw Error('The Admin tag name is reserved.');
      const changed=db.prepare('UPDATE character_tags SET name=? WHERE id=?').run(data.name.trim(),data.id);if(!changed.changes)throw Error('Tag not found.');}else {if(data.name.trim().toLowerCase()==='admin')throw Error('The Admin tag is reserved.');db.prepare('INSERT INTO character_tags VALUES(?,?)').run(randomUUID(),data.name.trim());}}
    send(200,{tags:tags()});return true;
   }
   const id=path.slice(recordPath.length),c=db.prepare('SELECT * FROM characters WHERE id=?').get(id);
   if(!c||(!session.admin&&c.owner_id!==session.user.id)){send(404,{error:'not_found'});return true;}
   if(req.method==='GET'&&url.searchParams.get('revision')===String(c.revision)){send(200,{unchanged:true,revision:c.revision});return true;}
   let data=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id)?.data_json||'{}');
   if(req.method==='POST'){
    const change=await adminJson(req,230000);if(change.revision!==c.revision){send(409,{error:'conflict',message:'This character changed. Reload before saving.'});return true;}
    db.exec('BEGIN IMMEDIATE');try{
     if(db.prepare('SELECT revision FROM characters WHERE id=?').get(id).revision!==change.revision)throw Object.assign(Error('Character changed. Reload before saving.'),{httpStatus:409});
     if(change.op==='tags'){
      if(!session.admin)throw Object.assign(Error('Administrator access required.'),{httpStatus:403});if(!Array.isArray(change.tagIds)||change.tagIds.length>100||change.tagIds.some(t=>typeof t!=='string'||!db.prepare('SELECT 1 FROM character_tags WHERE id=?').get(t)))throw Error('Invalid tags.');
      db.prepare('DELETE FROM character_tag_links WHERE character_id=?').run(id);for(const t of new Set(change.tagIds))db.prepare('INSERT INTO character_tag_links VALUES(?,?)').run(id,t);data.group_tags=change.tagIds.map(t=>db.prepare('SELECT name FROM character_tags WHERE id=?').get(t).name);db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(id,JSON.stringify(data));
     }else if(change.op==='sheet'){
      data=mergeSheetData(data,change);
      db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(id,JSON.stringify(data));
     }else if(change.op==='wizard'){
      if(!['identity','race','class'].includes(change.step))throw Error('Invalid wizard step.');
      data=mergeWizardData(data,change.step,change.fields);
      if(Buffer.byteLength(JSON.stringify(data))>380000)throw Error('Character data is too large.');
      db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(id,JSON.stringify(data));
      if(change.step==='identity')db.prepare('UPDATE characters SET name=? WHERE id=?').run(data.charName,id);
     }else if(change.op==='edit'){
      if(!change.fields||Object.keys(change.fields).some(k=>!['charName','race','class','level'].includes(k)))throw Error('Invalid character fields.');
      for(const [key,value] of Object.entries(change.fields)){if(typeof value!=='string'||value.length>120||/[\u0000-\u001f]/.test(value))throw Error('Invalid field.');if(key==='charName'&&(!value.trim()||value.length>80))throw Error('Enter a character name.');if(key==='level'&&!/^(?:[1-9]|[1-9][0-9])$/.test(value))throw Error('Level must be 1–99.');data[key]=value.trim();}
      db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(id,JSON.stringify(data));if(change.fields.charName)db.prepare('UPDATE characters SET name=? WHERE id=?').run(change.fields.charName.trim(),id);
     }else throw Error('Invalid operation.');
     db.prepare('UPDATE characters SET revision=revision+1,updated_at=? WHERE id=?').run(new Date().toISOString(),id);db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
   }
   const current=db.prepare('SELECT name,revision FROM characters WHERE id=?').get(id);
   send(200,{admin:session.admin,character:{id,...current,data,tags:db.prepare('SELECT tag_id AS id FROM character_tag_links WHERE character_id=?').all(id).map(t=>t.id)},availableTags:session.admin?tags():[]});
  }catch(error){send(error.httpStatus||400,{error:'invalid_request',message:error.message?.includes('UNIQUE')?'That name is already in use.':error.message||'Could not save.'});}return true;
 };
}
